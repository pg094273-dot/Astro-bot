/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useCallback, useEffect, useRef, useState } from 'react';
import { GameHUD } from './components/GameHUD';
import { GameMenus } from './components/GameMenus';
import { OfflineIndicator } from './components/PWAInstallButton';
import { GameEngine } from './game/Engine';
import { LEVELS } from './game/levels';
import { HudSnapshot, LevelProgress } from './game/types';

const STORAGE_KEY = 'astro-nova-progress-v1';

const INITIAL_HUD: HudSnapshot = {
  phase: 'title',
  levelIndex: 0,
  levelName: LEVELS[0].name,
  biome: LEVELS[0].theme.biome,
  perspectiveMode: '3D',
  hasBow: false,
  health: 3,
  maxHealth: 3,
  coins: 0,
  totalCoins: 0,
  botsRescued: 0,
  totalBots: LEVELS[0].miniBots.length,
  hoverFuel: 1,
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

export default function App() {
  const mountRef = useRef<HTMLDivElement | null>(null);
  const engineRef = useRef<GameEngine | null>(null);

  const [hud, setHud] = useState<HudSnapshot>(INITIAL_HUD);
  const [selectedLevel, setSelectedLevel] = useState(0);
  const [progress, setProgress] = useState<Record<number, LevelProgress>>(loadProgress);
  const [contextLost, setContextLost] = useState(false);
  const [victoryStats, setVictoryStats] = useState<{
    levelIndex: number;
    coins: number;
    totalCoins: number;
    bots: number;
    totalBots: number;
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

  // Enter / Space shortcut on Title Screen
  useEffect(() => {
    if (hud.phase !== 'title') return;
    const onKey = (e: KeyboardEvent) => {
      if (e.code === 'Enter' || e.code === 'Space') {
        e.preventDefault();
        handleStartGame(selectedLevel);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [hud.phase, selectedLevel, handleStartGame]);

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

  return (
    <main className="relative h-screen w-screen overflow-hidden bg-[#060b19]">
      {/* Isolated WebGL Canvas Container */}
      <div ref={mountRef} className="absolute inset-0 h-full w-full" />

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
        onToggleMute={handleToggleMute}
        onToggleMusic={handleToggleMusic}
        onPause={handlePause}
        onTouchMove={handleTouchMove}
        onTouchJump={handleTouchJump}
        onTouchSpin={handleTouchSpin}
        onTouchBow={handleTouchBow}
      />

      <GameMenus
        hud={hud}
        selectedLevel={selectedLevel}
        onSelectLevel={handleSelectLevel}
        progress={progress}
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
