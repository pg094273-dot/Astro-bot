/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useCallback, useEffect, useRef, useState } from 'react';
import { GameHUD, TouchControlsMode } from './components/GameHUD';
import { GameMenus, TitleView } from './components/GameMenus';
import { OfflineIndicator } from './components/PWAInstallButton';
import { GameEngine } from './game/Engine';
import { LEVELS } from './game/levels';
import { HudSnapshot, LevelProgress } from './game/types';

const STORAGE_KEY = 'astro-nova-progress-v1';
const TOUCH_MODE_STORAGE_KEY = 'astro-nova-touch-mode-v1';

const INITIAL_HUD: HudSnapshot = {
  phase: 'title',
  levelIndex: 0,
  levelName: LEVELS[0].name,
  biome: LEVELS[0].theme.biome,
  perspectiveMode: '3D',
  hasBow: false,
  hasMonkeySuit: false,
  isClimbing: false,
  hasSpiderSuit: false,
  isSwinging: false,
  canWebTarget: false,
  spiderTransforming: false,
  hasHulkSuit: false,
  hulkLeapCharge: 0,
  hulkCarrying: null,
  hulkTransforming: false,
  challengeTimer: null,
  challengeProgress: null,
  boss: null,
  health: 3,
  maxHealth: 3,
  coins: 0,
  totalCoins: 0,
  botsRescued: 0,
  totalBots: LEVELS[0].miniBots.length,
  relicsCollected: 0,
  totalRelics: LEVELS[0].relics?.length ?? 0,
  hoverFuel: 1,
  botRocketCharges: 0,
  botRocketActive: false,
  elapsedTime: 0,
  checkpointActive: false,
  bannerText: null,
  muted: false,
  musicMuted: false,
};

function loadProgress(): Record<number, LevelProgress> {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw);
  } catch {
    // Ignore storage errors
  }
  return {};
}

function loadTouchMode(): TouchControlsMode {
  try {
    const raw = localStorage.getItem(TOUCH_MODE_STORAGE_KEY);
    if (raw === 'auto' || raw === 'always' || raw === 'off') return raw;
  } catch {
    // Ignore storage errors
  }
  return 'auto';
}

export default function App() {
  const mountRef = useRef<HTMLDivElement | null>(null);
  const engineRef = useRef<GameEngine | null>(null);

  const [hud, setHud] = useState<HudSnapshot>(INITIAL_HUD);
  const [titleView, setTitleView] = useState<TitleView>('home');
  const [selectedLevel, setSelectedLevel] = useState(0);
  const [progress, setProgress] = useState<Record<number, LevelProgress>>(loadProgress);
  const [touchControlsMode, setTouchControlsMode] = useState<TouchControlsMode>(loadTouchMode);
  const [contextLost, setContextLost] = useState(false);
  const [victoryStats, setVictoryStats] = useState<{
    levelIndex: number;
    coins: number;
    totalCoins: number;
    bots: number;
    totalBots: number;
    relics: number;
    totalRelics: number;
    time: number;
  } | null>(null);

  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    const engine = new GameEngine(container, {
      onHudUpdate: (snapshot) => {
        setHud(snapshot);
      },
      onLevelComplete: (stats) => {
        setVictoryStats(stats);
        setProgress((prev) => {
          const existing = prev[stats.levelIndex];
          const updated: Record<number, LevelProgress> = {
            ...prev,
            [stats.levelIndex]: {
              bestCoins: Math.max(existing?.bestCoins ?? 0, stats.coins),
              bestBots: Math.max(existing?.bestBots ?? 0, stats.bots),
              bestRelics: Math.max(existing?.bestRelics ?? 0, stats.relics),
              bestTime:
                existing?.bestTime != null
                  ? Math.min(existing.bestTime, stats.time)
                  : stats.time,
              completed: true,
            },
          };
          try {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
          } catch {
            // Ignore storage errors
          }
          return updated;
        });
      },
      onContextLostChange: (lost) => {
        setContextLost(lost);
      },
    });

    engineRef.current = engine;
    return () => {
      engine.dispose();
      engineRef.current = null;
    };
  }, []);

  const handleSelectLevel = useCallback((idx: number) => {
    setSelectedLevel(idx);
    engineRef.current?.loadLevel(idx, 'title');
    engineRef.current?.unlockAudio();
  }, []);

  const handleStartGame = useCallback((idx: number) => {
    setVictoryStats(null);
    setSelectedLevel(idx);
    engineRef.current?.startLevel(idx);
  }, []);

  const handleChangeTouchControlsMode = useCallback((mode: TouchControlsMode) => {
    setTouchControlsMode(mode);
    try {
      localStorage.setItem(TOUCH_MODE_STORAGE_KEY, mode);
    } catch {
      // Ignore storage errors
    }
  }, []);

  const handleChangeTitleView = useCallback((view: TitleView) => {
    engineRef.current?.unlockAudio();
    setTitleView(view);
  }, []);

  // Keyboard / TV Remote / Gamepad menu navigation when not playing
  useEffect(() => {
    if (hud.phase === 'playing') return;

    const onKey = (e: KeyboardEvent) => {
      const isSelect = e.key === 'Select' || e.code === 'NumpadEnter' || e.keyCode === 23;
      const isBack =
        e.code === 'Escape' ||
        e.key === 'GoBack' ||
        e.key === 'BrowserBack';

      if (hud.phase === 'title') {
        if (isBack && titleView !== 'home') {
          e.preventDefault();
          setTitleView('home');
          return;
        }
        const activeTag = (document.activeElement as HTMLElement | null)?.tagName;
        if (e.code === 'Space' || (activeTag !== 'BUTTON' && (e.code === 'Enter' || isSelect))) {
          e.preventDefault();
          if (titleView === 'home') {
            setTitleView('levels');
          } else if (titleView === 'levels') {
            handleStartGame(selectedLevel);
          }
        }
      } else if (isBack) {
        e.preventDefault();
        if (hud.phase === 'paused') engineRef.current?.setPhase('playing');
        else {
          setVictoryStats(null);
          setTitleView('levels');
          engineRef.current?.returnToTitle();
        }
      }
    };

    window.addEventListener('keydown', onKey);

    // Lightweight Gamepad menu poller when paused/title/gameover/victory
    let rafId = 0;
    let prevA = false;
    let prevB = false;
    let prevLeft = false;
    let prevRight = false;

    const pollMenuPad = () => {
      const pads = navigator.getGamepads?.();
      if (pads) {
        for (let i = 0; i < pads.length; i++) {
          const gp = pads[i];
          if (!gp?.connected) continue;
          const aNow = Boolean(gp.buttons[0]?.pressed);
          const bNow = Boolean(gp.buttons[1]?.pressed);
          const leftNow = Boolean(gp.buttons[14]?.pressed || (gp.axes[0] ?? 0) < -0.55);
          const rightNow = Boolean(gp.buttons[15]?.pressed || (gp.axes[0] ?? 0) > 0.55);

          if (hud.phase === 'title') {
            if (titleView === 'levels') {
              if (leftNow && !prevLeft) {
                handleSelectLevel((selectedLevel - 1 + LEVELS.length) % LEVELS.length);
              } else if (rightNow && !prevRight) {
                handleSelectLevel((selectedLevel + 1) % LEVELS.length);
              }
              if (aNow && !prevA) {
                handleStartGame(selectedLevel);
              } else if (bNow && !prevB) {
                setTitleView('home');
              }
            } else if (titleView === 'home') {
              if (aNow && !prevA) {
                const focused = document.activeElement as HTMLElement | null;
                if (focused?.tagName === 'BUTTON') focused.click();
                else setTitleView('levels');
              }
            } else {
              if (aNow && !prevA) {
                const focused = document.activeElement as HTMLElement | null;
                if (focused?.tagName === 'BUTTON') focused.click();
              } else if (bNow && !prevB) {
                setTitleView('home');
              }
            }
          } else {
            if (aNow && !prevA) {
              const focused = document.activeElement as HTMLElement | null;
              if (focused?.tagName === 'BUTTON') {
                focused.click();
              } else if (hud.phase === 'paused') {
                engineRef.current?.setPhase('playing');
              } else if (hud.phase === 'gameover') {
                setVictoryStats(null);
                engineRef.current?.restartLevel();
              } else if (hud.phase === 'victory') {
                if (hud.levelIndex < LEVELS.length - 1) {
                  const nextIdx = hud.levelIndex + 1;
                  setVictoryStats(null);
                  setSelectedLevel(nextIdx);
                  engineRef.current?.startLevel(nextIdx);
                } else {
                  setVictoryStats(null);
                  setTitleView('levels');
                  engineRef.current?.returnToTitle();
                }
              }
            } else if (bNow && !prevB) {
              if (hud.phase === 'paused') engineRef.current?.setPhase('playing');
              else {
                setVictoryStats(null);
                setTitleView('levels');
                engineRef.current?.returnToTitle();
              }
            }
          }

          prevA = aNow;
          prevB = bNow;
          prevLeft = leftNow;
          prevRight = rightNow;
          break;
        }
      }
      rafId = window.requestAnimationFrame(pollMenuPad);
    };
    rafId = window.requestAnimationFrame(pollMenuPad);

    return () => {
      window.removeEventListener('keydown', onKey);
      window.cancelAnimationFrame(rafId);
    };
  }, [hud.phase, hud.levelIndex, titleView, selectedLevel, handleSelectLevel, handleStartGame]);

  // Native Android TV Back button bridge & gameplay canvas focus lock
  useEffect(() => {
    if (hud.phase === 'playing') {
      mountRef.current?.focus();
    }
    const win = window as unknown as { __handleAndroidBack?: () => 'handled' | 'exit' };
    win.__handleAndroidBack = () => {
      if (hud.phase === 'title' && titleView !== 'home') {
        setTitleView('home');
        return 'handled';
      }
      if (hud.phase === 'playing') {
        engineRef.current?.setPhase('paused');
        return 'handled';
      }
      if (hud.phase === 'paused') {
        engineRef.current?.setPhase('playing');
        return 'handled';
      }
      if (hud.phase === 'gameover' || hud.phase === 'victory') {
        setVictoryStats(null);
        setTitleView('levels');
        engineRef.current?.returnToTitle();
        return 'handled';
      }
      return 'exit';
    };
    return () => {
      delete win.__handleAndroidBack;
    };
  }, [hud.phase, titleView]);

  const handleToggleMute = useCallback(() => {
    engineRef.current?.setMuted(!hud.muted);
  }, [hud.muted]);

  const handleToggleMusic = useCallback(() => {
    engineRef.current?.setMusicMuted(!hud.musicMuted);
  }, [hud.musicMuted]);

  const handlePause = useCallback(() => {
    engineRef.current?.setPhase('paused');
  }, []);

  const handleResume = useCallback(() => {
    engineRef.current?.setPhase('playing');
  }, []);

  const handleRestart = useCallback(() => {
    setVictoryStats(null);
    engineRef.current?.restartLevel();
  }, []);

  const handleNextLevel = useCallback(() => {
    const nextIdx = Math.min(LEVELS.length - 1, hud.levelIndex + 1);
    setVictoryStats(null);
    setSelectedLevel(nextIdx);
    engineRef.current?.startLevel(nextIdx);
  }, [hud.levelIndex]);

  const handleReturnTitle = useCallback(() => {
    setVictoryStats(null);
    setTitleView('levels');
    engineRef.current?.returnToTitle();
  }, []);

  const handleTouchMove = useCallback((x: number, z: number) => {
    engineRef.current?.setTouchMove(x, z);
  }, []);

  const handleTouchJump = useCallback((held: boolean, justPressed: boolean) => {
    engineRef.current?.setTouchJump(held, justPressed);
  }, []);

  const handleTouchSpin = useCallback(() => {
    engineRef.current?.triggerSpin();
  }, []);

  const handleTouchBow = useCallback(() => {
    engineRef.current?.shootArrow();
  }, []);

  const handleTouchWeb = useCallback(() => {
    engineRef.current?.triggerSpiderWebAction();
  }, []);

  const handleTouchReleaseWeb = useCallback(() => {
    engineRef.current?.releaseWeb(false);
  }, []);

  const handleTouchHulkPunch = useCallback(() => {
    engineRef.current?.triggerHulkPunch();
  }, []);

  const handleTouchHulkSlam = useCallback(() => {
    engineRef.current?.triggerHulkSlam();
  }, []);

  const handleTouchHulkGrab = useCallback(() => {
    engineRef.current?.triggerHulkGrabOrThrow();
  }, []);

  return (
    <main className="relative h-dvh w-screen overflow-hidden bg-[#060b19]">
      {/* Isolated WebGL Canvas Container */}
      <div ref={mountRef} tabIndex={-1} className="absolute inset-0 h-full w-full outline-none" />

      {contextLost && (
        <div className="fixed inset-0 z-30 flex items-center justify-center bg-[#060b19]/95 p-6 text-center text-white">
          <div className="max-w-sm rounded-2xl border border-white/15 bg-slate-900 p-6">
            <h2 className="font-display text-xl font-bold">Contexto WebGL pausado</h2>
            <p className="mt-2 text-sm text-slate-300">
              El navegador liberó los recursos gráficos temporalmente. Recarga para continuar jugando.
            </p>
          </div>
        </div>
      )}

      <GameHUD
        hud={hud}
        touchControlsMode={touchControlsMode}
        onToggleMute={handleToggleMute}
        onToggleMusic={handleToggleMusic}
        onPause={handlePause}
        onTouchMove={handleTouchMove}
        onTouchJump={handleTouchJump}
        onTouchSpin={handleTouchSpin}
        onTouchBow={handleTouchBow}
        onTouchWeb={handleTouchWeb}
        onTouchReleaseWeb={handleTouchReleaseWeb}
        onTouchHulkPunch={handleTouchHulkPunch}
        onTouchHulkSlam={handleTouchHulkSlam}
        onTouchHulkGrab={handleTouchHulkGrab}
      />

      <GameMenus
        hud={hud}
        titleView={titleView}
        onChangeTitleView={handleChangeTitleView}
        selectedLevel={selectedLevel}
        onSelectLevel={handleSelectLevel}
        progress={progress}
        touchControlsMode={touchControlsMode}
        onChangeTouchControlsMode={handleChangeTouchControlsMode}
        onToggleMute={handleToggleMute}
        onToggleMusic={handleToggleMusic}
        victoryStats={victoryStats}
        onStartGame={handleStartGame}
        onResume={handleResume}
        onRestart={handleRestart}
        onNextLevel={handleNextLevel}
        onReturnTitle={handleReturnTitle}
      />

      <OfflineIndicator />
    </main>
  );
}
