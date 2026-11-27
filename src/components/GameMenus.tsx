import React, { useEffect, useRef, useState } from 'react';
import {
  ArrowLeft,
  Gamepad2,
  Music,
  Play,
  Settings,
  Smartphone,
  Volume2,
  VolumeX,
  Keyboard,
} from 'lucide-react';
import { LEVELS } from '../game/levels';
import { HudSnapshot, LevelProgress } from '../game/types';
import { TouchControlsMode } from './GameHUD';
import { LevelThumbnail } from './LevelThumbnail';
import { PWAInstallButton } from './PWAInstallButton';

export type TitleView = 'home' | 'levels' | 'settings' | 'controls';

interface GameMenusProps {
  hud: HudSnapshot;
  titleView: TitleView;
  onChangeTitleView: (view: TitleView) => void;
  selectedLevel: number;
  onSelectLevel: (idx: number) => void;
  progress: Record<number, LevelProgress>;
  touchControlsMode: TouchControlsMode;
  onChangeTouchControlsMode: (mode: TouchControlsMode) => void;
  onToggleMute: () => void;
  onToggleMusic: () => void;
  victoryStats: {
    levelIndex: number;
    coins: number;
    totalCoins: number;
    bots: number;
    totalBots: number;
    relics: number;
    totalRelics: number;
    time: number;
  } | null;
  onStartGame: (levelIdx: number) => void;
  onResume: () => void;
  onRestart: () => void;
  onNextLevel: () => void;
  onReturnTitle: () => void;
}

function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

export const GameMenus: React.FC<GameMenusProps> = ({
  hud,
  titleView,
  onChangeTitleView,
  selectedLevel,
  onSelectLevel,
  progress,
  touchControlsMode,
  onChangeTouchControlsMode,
  onToggleMute,
  onToggleMusic,
  victoryStats,
  onStartGame,
  onResume,
  onRestart,
  onNextLevel,
  onReturnTitle,
}) => {
  const primaryBtnRef = useRef<HTMLButtonElement | null>(null);
  const [controlTab, setControlTab] = useState<'touch' | 'keyboard' | 'gamepad'>('touch');

  useEffect(() => {
    if (hud.phase !== 'playing') {
      const id = window.setTimeout(() => {
        primaryBtnRef.current?.focus();
      }, 40);
      return () => window.clearTimeout(id);
    }
  }, [hud.phase, titleView]);

  if (hud.phase === 'playing') return null;

  const completedCount = LEVELS.filter((lvl) => progress[lvl.index]?.completed).length;
  const totalBotsFound = LEVELS.reduce((acc, lvl) => acc + (progress[lvl.index]?.bestBots ?? 0), 0);
  const totalBotsPossible = LEVELS.reduce((acc, lvl) => acc + lvl.miniBots.length, 0);

  // 1. TITLE SCREEN & NAVIGATION VIEWS
  if (hud.phase === 'title') {
    // 1A. MAIN MENU HOME (Minimal perimeter layout keeping 3D robot & universe center-stage)
    if (titleView === 'home') {
      return (
        <div className="pointer-events-none fixed inset-0 z-20 flex flex-col justify-between p-4 pt-[max(1rem,env(safe-area-inset-top))] pb-[max(1rem,env(safe-area-inset-bottom))] pl-[max(1rem,env(safe-area-inset-left))] pr-[max(1rem,env(safe-area-inset-right))] sm:p-8">
          {/* Top Perimeter: Brand Logo + Install CTA */}
          <div className="flex items-start justify-between gap-3">
            <div className="pointer-events-auto">
              <svg
                viewBox="0 0 420 96"
                className="h-12 w-auto sm:h-16 md:h-20 drop-shadow-[0_6px_24px_rgba(2,132,199,0.5)]"
                aria-label="Astro Nova"
              >
                <defs>
                  <linearGradient id="astroTitleGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#ffffff" />
                    <stop offset="55%" stopColor="#e0f2fe" />
                    <stop offset="100%" stopColor="#38bdf8" />
                  </linearGradient>
                </defs>
                <ellipse
                  cx="40"
                  cy="46"
                  rx="34"
                  ry="12"
                  fill="none"
                  stroke="#38bdf8"
                  strokeWidth="2.5"
                  opacity="0.7"
                  transform="rotate(-16 40 46)"
                />
                <polygon
                  points="40,10 66,28 60,64 20,64 14,28"
                  fill="#0f172a"
                  stroke="#e2e8f0"
                  strokeWidth="3"
                  strokeLinejoin="round"
                />
                <polygon points="22,33 58,33 53,51 27,51" fill="#0ea5e9" opacity="0.9" />
                <polygon points="27,37 53,37 50,45 30,45" fill="#bae6fd" />
                <polygon
                  points="40,3 44,12 53,12 46,18 48,26 40,21 32,26 34,18 27,12 36,12"
                  fill="#facc15"
                />
                <text
                  x="86"
                  y="56"
                  fill="url(#astroTitleGrad)"
                  fontFamily="Outfit, sans-serif"
                  fontWeight="800"
                  fontSize="44"
                  letterSpacing="-1"
                >
                  ASTRO NOVA
                </text>
                <text
                  x="88"
                  y="80"
                  fill="#bae6fd"
                  fontFamily="Plus Jakarta Sans, sans-serif"
                  fontWeight="600"
                  fontSize="14"
                  letterSpacing="2"
                >
                  PLATAFORMAS ORBITALES 3D
                </text>
              </svg>
            </div>

            <div className="pointer-events-auto shrink-0">
              <PWAInstallButton />
            </div>
          </div>

          {/* Bottom-Left Compact Menu Card — leaves center & right 3D Robot showcase unobstructed */}
          <div className="pointer-events-auto w-full max-w-[19.5rem] rounded-2xl border border-white/15 bg-[#070d1d]/82 p-4 text-white shadow-2xl sm:max-w-xs sm:p-5">
            <button
              ref={primaryBtnRef}
              type="button"
              onClick={() => onChangeTitleView('levels')}
              className="flex min-h-[52px] w-full items-center justify-center gap-2.5 rounded-xl bg-sky-500 px-6 py-3 font-display text-lg font-extrabold tracking-wide text-slate-950 shadow-lg transition-transform hover:bg-sky-400 focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-white active:scale-[0.98]"
            >
              <Play className="h-5 w-5 fill-slate-950" />
              JUGAR
            </button>

            <div className="mt-2.5 grid grid-cols-2 gap-2.5">
              <button
                type="button"
                onClick={() => onChangeTitleView('settings')}
                className="flex min-h-[44px] items-center justify-center gap-1.5 rounded-xl border border-white/15 bg-slate-900/80 px-3 py-2 font-display text-xs font-semibold text-slate-100 transition-colors hover:border-sky-400/50 hover:bg-slate-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-300 sm:text-sm"
              >
                <Settings className="h-4 w-4 text-sky-300 shrink-0" />
                <span className="whitespace-nowrap">Configuración</span>
              </button>

              <button
                type="button"
                onClick={() => onChangeTitleView('controls')}
                className="flex min-h-[44px] items-center justify-center gap-1.5 rounded-xl border border-white/15 bg-slate-900/80 px-3 py-2 font-display text-xs font-semibold text-slate-100 transition-colors hover:border-sky-400/50 hover:bg-slate-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-300 sm:text-sm"
              >
                <Gamepad2 className="h-4 w-4 text-sky-300 shrink-0" />
                <span className="whitespace-nowrap">Controles</span>
              </button>
            </div>

            <div className="mt-3 flex items-center justify-between border-t border-white/10 pt-2.5 font-mono-num text-[11px] text-slate-300">
              <span>Mundos {completedCount}/{LEVELS.length}</span>
              <span className="text-white/25" aria-hidden="true">·</span>
              <span>Bots {totalBotsFound}/{totalBotsPossible}</span>
            </div>
          </div>
        </div>
      );
    }

    // 1B. LEVEL SELECTOR VIEW (10 Worlds Grid with Back button)
    if (titleView === 'levels') {
      return (
        <div className="fixed inset-0 z-20 flex flex-col bg-[#040917]/74 p-3 pt-[max(0.85rem,env(safe-area-inset-top))] pb-[max(0.85rem,env(safe-area-inset-bottom))] pl-[max(0.85rem,env(safe-area-inset-left))] pr-[max(0.85rem,env(safe-area-inset-right))] sm:p-6">
          <div className="mx-auto flex h-full w-full max-w-6xl flex-col gap-3 sm:gap-4">
            {/* Selector Top Bar */}
            <header className="flex items-center justify-between gap-3 rounded-2xl border border-white/12 bg-[#070d1d]/90 px-3.5 py-2.5 text-white shadow-xl sm:px-5 sm:py-3">
              <button
                type="button"
                onClick={() => onChangeTitleView('home')}
                className="flex min-h-[44px] shrink-0 items-center gap-2 rounded-xl border border-white/15 bg-slate-900/85 px-3.5 py-2 font-display text-xs font-bold text-slate-100 transition-colors hover:border-sky-400/50 hover:bg-slate-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-300 sm:text-sm"
              >
                <ArrowLeft className="h-4 w-4 text-sky-300" />
                <span>Volver</span>
              </button>

              <div className="min-w-0 text-center sm:text-left sm:flex-1 sm:pl-2">
                <h1 className="truncate font-display text-base font-extrabold text-white sm:text-xl">
                  Selector de Niveles
                </h1>
                <p className="hidden font-mono-num text-xs text-slate-300 sm:block">
                  10 mundos disponibles · {completedCount} completados · {totalBotsFound}/{totalBotsPossible} Bots
                </p>
              </div>

              <span className="shrink-0 font-mono-num text-xs font-semibold text-sky-300 sm:hidden">
                {completedCount}/{LEVELS.length}
              </span>
            </header>

            {/* Responsive 10-Level Grid */}
            <div className="touch-pan-y grid flex-1 grid-cols-1 gap-2.5 overflow-y-auto pr-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 sm:gap-3 content-start">
              {LEVELS.map((lvl) => {
                const isSelected = lvl.index === selectedLevel;
                const stats = progress[lvl.index];
                const totalBots = lvl.miniBots.length;
                const totalRelics = lvl.relics?.length ?? 0;
                const botsGot = stats?.bestBots ?? 0;
                const relicsGot = stats?.bestRelics ?? 0;
                const totalItems = totalBots + totalRelics;
                const gotItems = botsGot + relicsGot;
                const progressPct = stats?.completed
                  ? Math.max(50, Math.round(((gotItems + 1) / (totalItems + 1)) * 100))
                  : totalItems > 0
                    ? Math.round((gotItems / (totalItems + 1)) * 100)
                    : 0;

                return (
                  <button
                    key={lvl.id}
                    ref={isSelected ? primaryBtnRef : undefined}
                    type="button"
                    onClick={() => onStartGame(lvl.index)}
                    onFocus={() => {
                      if (lvl.index !== selectedLevel) onSelectLevel(lvl.index);
                    }}
                    className={`group flex flex-row items-center gap-3 overflow-hidden rounded-2xl border p-2.5 text-left transition-all focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-sky-300 active:scale-[0.985] md:flex-col md:items-stretch md:gap-0 md:p-0 ${
                      isSelected
                        ? 'border-sky-400 bg-[#0b1b36]/95 shadow-[0_0_20px_rgba(56,189,248,0.2)]'
                        : 'border-white/12 bg-[#081022]/90 hover:border-sky-400/55 hover:bg-[#0b1730]/95'
                    }`}
                  >
                    {/* World Miniature */}
                    <div className="relative h-16 w-28 shrink-0 overflow-hidden rounded-xl border border-white/10 md:h-24 md:w-full md:rounded-none md:border-x-0 md:border-t-0 md:border-b">
                      <LevelThumbnail biome={lvl.theme.biome} levelNumber={lvl.index + 1} />
                      <span className="absolute top-1.5 left-1.5 rounded-md bg-[#040814]/80 px-1.5 py-0.5 font-mono-num text-[10px] font-bold text-white">
                        {String(lvl.index + 1).padStart(2, '0')}
                      </span>
                    </div>

                    {/* Card Metadata */}
                    <div className="flex min-w-0 flex-1 flex-col justify-between gap-1.5 md:p-3">
                      <div>
                        <div className="flex items-center justify-between gap-1.5">
                          <h2 className="truncate font-display text-sm font-bold text-white group-hover:text-sky-200">
                            {lvl.name}
                          </h2>
                        </div>
                        <div className="mt-0.5 flex items-center gap-1.5 text-[11px]">
                          <span className={stats?.completed ? 'font-semibold text-emerald-400' : 'text-sky-300'}>
                            {stats?.completed ? 'Completado' : 'Desbloqueado'}
                          </span>
                          {stats?.bestTime != null && (
                            <>
                              <span className="text-white/25" aria-hidden="true">·</span>
                              <span className="font-mono-num text-slate-300">
                                {formatTime(stats.bestTime)}
                              </span>
                            </>
                          )}
                        </div>
                      </div>

                      {/* Slim progress indicator */}
                      <div className="h-1 w-full overflow-hidden rounded-full bg-slate-800">
                        <div
                          className={`h-full origin-left transition-transform ${
                            stats?.completed ? 'bg-emerald-400' : 'bg-sky-400'
                          }`}
                          style={{ transform: `scaleX(${Math.max(0.04, progressPct / 100)})` }}
                        />
                      </div>

                      {/* Collectibles achieved */}
                      <div className="flex flex-wrap items-center gap-1.5 font-mono-num text-[11px] text-slate-300">
                        <span className="text-sky-300">Bots {botsGot}/{totalBots}</span>
                        <span className="text-white/25" aria-hidden="true">·</span>
                        <span className="text-cyan-300">Reliq. {relicsGot}/{totalRelics}</span>
                        <span className="text-white/25" aria-hidden="true">·</span>
                        <span className="text-amber-300">Mon. {stats?.bestCoins ?? 0}</span>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      );
    }

    // 1C. SETTINGS MODAL
    if (titleView === 'settings') {
      return (
        <div className="fixed inset-0 z-20 flex items-center justify-center bg-[#040917]/75 p-4 pt-[max(1rem,env(safe-area-inset-top))] pb-[max(1rem,env(safe-area-inset-bottom))]">
          <div className="touch-pan-y flex max-h-[calc(100dvh-2rem)] w-full max-w-md flex-col gap-4 overflow-y-auto rounded-2xl border border-white/15 bg-[#091124]/95 p-5 text-white shadow-2xl sm:p-6">
            <div className="flex items-center justify-between gap-3">
              <h2 className="font-display text-xl font-bold text-white sm:text-2xl">Configuración</h2>
              <button
                ref={primaryBtnRef}
                type="button"
                onClick={() => onChangeTitleView('home')}
                className="flex min-h-[44px] items-center gap-1.5 rounded-xl border border-white/15 bg-slate-800 px-3.5 py-2 font-display text-xs font-bold text-slate-100 transition-colors hover:bg-slate-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-300"
              >
                <ArrowLeft className="h-4 w-4 text-sky-300" />
                Volver
              </button>
            </div>

            <div className="flex flex-col gap-3">
              <div className="flex items-center justify-between gap-3 rounded-xl border border-white/10 bg-slate-900/75 p-3.5">
                <div className="flex items-center gap-3">
                  {hud.muted ? (
                    <VolumeX className="h-5 w-5 text-slate-400" />
                  ) : (
                    <Volume2 className="h-5 w-5 text-sky-300" />
                  )}
                  <div>
                    <p className="font-display text-sm font-semibold text-white">Efectos de sonido</p>
                    <p className="text-xs text-slate-400">Saltos, monedas, impactos y voces</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={onToggleMute}
                  className={`min-h-[44px] min-w-[96px] rounded-xl px-3.5 py-2 font-display text-xs font-bold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-300 ${
                    hud.muted
                      ? 'border border-white/15 bg-slate-800 text-slate-300 hover:bg-slate-700'
                      : 'bg-sky-500 text-slate-950 hover:bg-sky-400'
                  }`}
                >
                  {hud.muted ? 'Silenciado' : 'Activados'}
                </button>
              </div>

              <div className="flex items-center justify-between gap-3 rounded-xl border border-white/10 bg-slate-900/75 p-3.5">
                <div className="flex items-center gap-3">
                  <Music className={`h-5 w-5 ${hud.musicMuted || hud.muted ? 'text-slate-400' : 'text-sky-300'}`} />
                  <div>
                    <p className="font-display text-sm font-semibold text-white">Música de fondo</p>
                    <p className="text-xs text-slate-400">Banda sonora dinámica de cada mundo</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={onToggleMusic}
                  className={`min-h-[44px] min-w-[96px] rounded-xl px-3.5 py-2 font-display text-xs font-bold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-300 ${
                    hud.musicMuted
                      ? 'border border-white/15 bg-slate-800 text-slate-300 hover:bg-slate-700'
                      : 'bg-sky-500 text-slate-950 hover:bg-sky-400'
                  }`}
                >
                  {hud.musicMuted ? 'Silenciada' : 'Activada'}
                </button>
              </div>

              <div className="flex flex-col gap-2.5 rounded-xl border border-white/10 bg-slate-900/75 p-3.5">
                <div className="flex items-center gap-2.5">
                  <Smartphone className="h-5 w-5 text-sky-300" />
                  <div>
                    <p className="font-display text-sm font-semibold text-white">Controles táctiles</p>
                    <p className="text-xs text-slate-400">Joystick analógico y botones en iPhone/iPad</p>
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-1.5 rounded-xl bg-slate-950/75 p-1">
                  {(
                    [
                      { id: 'auto', label: 'Auto' },
                      { id: 'always', label: 'Siempre' },
                      { id: 'off', label: 'Ocultos' },
                    ] as const
                  ).map((opt) => (
                    <button
                      key={opt.id}
                      type="button"
                      onClick={() => onChangeTouchControlsMode(opt.id)}
                      className={`min-h-[40px] rounded-lg px-2 py-1.5 font-display text-xs font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-300 ${
                        touchControlsMode === opt.id
                          ? 'bg-sky-500 text-slate-950'
                          : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                      }`}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      );
    }

    // 1D. CONTROLS & HELP MODAL
    return (
      <div className="fixed inset-0 z-20 flex items-center justify-center bg-[#040917]/75 p-4 pt-[max(1rem,env(safe-area-inset-top))] pb-[max(1rem,env(safe-area-inset-bottom))]">
        <div className="touch-pan-y flex max-h-[calc(100dvh-2rem)] w-full max-w-xl flex-col gap-4 overflow-y-auto rounded-2xl border border-white/15 bg-[#091124]/95 p-5 text-white shadow-2xl sm:p-6">
          <div className="flex items-center justify-between gap-3">
            <h2 className="font-display text-xl font-bold text-white sm:text-2xl">Controles y Ayuda</h2>
            <button
              ref={primaryBtnRef}
              type="button"
              onClick={() => onChangeTitleView('home')}
              className="flex min-h-[44px] items-center gap-1.5 rounded-xl border border-white/15 bg-slate-800 px-3.5 py-2 font-display text-xs font-bold text-slate-100 transition-colors hover:bg-slate-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-300"
            >
              <ArrowLeft className="h-4 w-4 text-sky-300" />
              Volver
            </button>
          </div>

          <div className="grid grid-cols-3 gap-1.5 rounded-xl bg-slate-950/80 p-1">
            <button
              type="button"
              onClick={() => setControlTab('touch')}
              className={`flex min-h-[40px] items-center justify-center gap-1.5 rounded-lg px-2 py-1.5 font-display text-xs font-semibold transition-colors ${
                controlTab === 'touch' ? 'bg-sky-500 text-slate-950' : 'text-slate-300 hover:text-white'
              }`}
            >
              <Smartphone className="h-3.5 w-3.5 shrink-0" />
              <span>iPhone / iPad</span>
            </button>
            <button
              type="button"
              onClick={() => setControlTab('keyboard')}
              className={`flex min-h-[40px] items-center justify-center gap-1.5 rounded-lg px-2 py-1.5 font-display text-xs font-semibold transition-colors ${
                controlTab === 'keyboard' ? 'bg-sky-500 text-slate-950' : 'text-slate-300 hover:text-white'
              }`}
            >
              <Keyboard className="h-3.5 w-3.5 shrink-0" />
              <span>Teclado</span>
            </button>
            <button
              type="button"
              onClick={() => setControlTab('gamepad')}
              className={`flex min-h-[40px] items-center justify-center gap-1.5 rounded-lg px-2 py-1.5 font-display text-xs font-semibold transition-colors ${
                controlTab === 'gamepad' ? 'bg-sky-500 text-slate-950' : 'text-slate-300 hover:text-white'
              }`}
            >
              <Gamepad2 className="h-3.5 w-3.5 shrink-0" />
              <span>Mando / TV</span>
            </button>
          </div>

          {controlTab === 'touch' && (
            <div className="space-y-2.5 text-xs text-slate-200 sm:text-sm">
              <div className="rounded-xl border border-white/10 bg-slate-900/75 p-3">
                <p className="font-display font-bold text-sky-300">Joystick analógico izquierdo</p>
                <p className="mt-1 text-slate-300">
                  Desliza ligeramente el pulgar para caminar despacio o llévalo al borde para correr a máxima velocidad en cualquier dirección.
                </p>
              </div>
              <div className="rounded-xl border border-white/10 bg-slate-900/75 p-3">
                <p className="font-display font-bold text-sky-300">Botones de acción derechos</p>
                <p className="mt-1 text-slate-300">
                  Pulsa <strong>Saltar</strong> para saltar, pulsa dos veces para doble salto o mantenlo en el aire para planear. Usa <strong>Girar</strong> y <strong>Arco</strong> en combate, y desliza el fondo para rotar la cámara.
                </p>
              </div>
              <div className="rounded-xl border border-white/10 bg-slate-900/75 p-3">
                <p className="font-display font-bold text-rose-300">Spider-Man (Nivel 09) y Hulk (Nivel 10)</p>
                <p className="mt-1 text-slate-300">
                  Con Spider-Man aparecen <strong>Telaraña</strong> y <strong>Soltar</strong>. Con Hulk dispones de <strong>Puñetazo</strong>, <strong>Golpe Suelo</strong>, <strong>Agarrar / Lanzar</strong> y <strong>Salto</strong> cargado al mantener pulsado.
                </p>
              </div>
            </div>
          )}

          {controlTab === 'keyboard' && (
            <div className="space-y-2.5 text-xs text-slate-200 sm:text-sm">
              <div className="rounded-xl border border-white/10 bg-slate-900/75 p-3">
                <p className="font-display font-bold text-sky-300">Movimiento y Cámara</p>
                <p className="mt-1 text-slate-300">
                  <strong>WASD</strong> o <strong>Flechas</strong> para desplazarte · <strong>Q / E</strong> o arrastrar con ratón para girar la cámara.
                </p>
              </div>
              <div className="rounded-xl border border-white/10 bg-slate-900/75 p-3">
                <p className="font-display font-bold text-sky-300">Saltos y Habilidades</p>
                <p className="mt-1 text-slate-300">
                  <strong>Espacio</strong> para saltar, doble salto y planear (mantener en Hulk para Súper Salto) · <strong>F / G / R / Clic</strong> para girar, arco, telaraña o golpes · <strong>E</strong> en Hulk para agarrar y lanzar.
                </p>
              </div>
            </div>
          )}

          {controlTab === 'gamepad' && (
            <div className="space-y-2.5 text-xs text-slate-200 sm:text-sm">
              <div className="rounded-xl border border-white/10 bg-slate-900/75 p-3">
                <p className="font-display font-bold text-sky-300">Mando Bluetooth (iOS / iPadOS / TV)</p>
                <p className="mt-1 text-slate-300">
                  <strong>Stick izquierdo</strong> movimiento analógico · <strong>Stick derecho</strong> cámara · <strong>A / Cruz</strong> saltar, planear y Súper Salto.
                </p>
              </div>
              <div className="rounded-xl border border-white/10 bg-slate-900/75 p-3">
                <p className="font-display font-bold text-sky-300">Combate y Poderes</p>
                <p className="mt-1 text-slate-300">
                  <strong>X / Cuadrado</strong> girar o puñetazo · <strong>Y / Triángulo</strong> arco o golpe suelo · <strong>B / RT</strong> telaraña o agarrar/lanzar · <strong>Start / Menú</strong> pausa.
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  // 2. PAUSE MODAL
  if (hud.phase === 'paused') {
    return (
      <div className="fixed inset-0 z-20 flex items-center justify-center bg-[#040814]/75 p-4 pt-[max(1rem,env(safe-area-inset-top))] pb-[max(1rem,env(safe-area-inset-bottom))]">
        <div className="touch-pan-y flex max-h-[calc(100dvh-2rem)] w-full max-w-sm flex-col gap-4 overflow-y-auto rounded-2xl border border-white/15 bg-[#091124]/95 p-6 text-white shadow-2xl">
          <div>
            <h2 className="font-display text-2xl font-bold text-white">Pausa</h2>
            <p className="mt-0.5 text-sm text-slate-300">{hud.levelName}</p>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={onToggleMute}
              className="flex min-h-[44px] items-center justify-center gap-1.5 rounded-xl border border-white/15 bg-slate-900/80 px-3 py-2 text-xs font-semibold text-slate-200 transition-colors hover:bg-slate-800"
            >
              {hud.muted ? <VolumeX className="h-4 w-4 text-slate-400" /> : <Volume2 className="h-4 w-4 text-sky-300" />}
              <span>{hud.muted ? 'SFX Off' : 'SFX On'}</span>
            </button>
            <button
              type="button"
              onClick={onToggleMusic}
              className="flex min-h-[44px] items-center justify-center gap-1.5 rounded-xl border border-white/15 bg-slate-900/80 px-3 py-2 text-xs font-semibold text-slate-200 transition-colors hover:bg-slate-800"
            >
              <Music className={`h-4 w-4 ${hud.musicMuted || hud.muted ? 'text-slate-400' : 'text-sky-300'}`} />
              <span>{hud.musicMuted ? 'Música Off' : 'Música On'}</span>
            </button>
          </div>

          <div className="flex flex-col gap-2.5">
            <button
              ref={primaryBtnRef}
              type="button"
              onClick={onResume}
              className="min-h-[48px] rounded-xl bg-sky-500 px-5 py-2.5 font-display text-sm font-bold text-slate-950 transition-colors hover:bg-sky-400 focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-white"
            >
              Continuar
            </button>
            <button
              type="button"
              onClick={onRestart}
              className="min-h-[44px] rounded-xl border border-white/15 bg-slate-800 px-5 py-2.5 font-display text-sm font-semibold text-white transition-colors hover:bg-slate-700 focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-sky-300"
            >
              Reiniciar Nivel
            </button>
            <button
              type="button"
              onClick={onReturnTitle}
              className="min-h-[44px] rounded-xl border border-white/10 bg-transparent px-5 py-2.5 font-display text-sm font-semibold text-slate-300 transition-colors hover:bg-slate-800 hover:text-white focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-sky-300"
            >
              Volver a Niveles
            </button>
          </div>
        </div>
      </div>
    );
  }

  // 3. GAME OVER MODAL
  if (hud.phase === 'gameover') {
    return (
      <div className="fixed inset-0 z-20 flex items-center justify-center bg-[#040814]/78 p-4 pt-[max(1rem,env(safe-area-inset-top))] pb-[max(1rem,env(safe-area-inset-bottom))]">
        <div className="flex max-h-[calc(100dvh-2rem)] w-full max-w-sm flex-col gap-4 overflow-y-auto rounded-2xl border border-rose-500/30 bg-[#091124]/95 p-6 text-white shadow-2xl">
          <h2 className="font-display text-2xl font-bold text-rose-400">Sin Energía</h2>
          <p className="text-sm text-slate-300">
            {hud.hasHulkSuit
              ? `Hulk necesita recargar energía gamma en ${hud.levelName}.`
              : hud.hasSpiderSuit
                ? `El Héroe Arácnido necesita recargar fuerzas en ${hud.levelName}.`
                : `Nova Bot necesita recargar circuitos en ${hud.levelName}.`}
          </p>
          <div className="flex flex-col gap-2.5 pt-2">
            <button
              ref={primaryBtnRef}
              type="button"
              onClick={onRestart}
              className="min-h-[48px] rounded-xl bg-sky-500 px-5 py-2.5 font-display text-sm font-bold text-slate-950 transition-colors hover:bg-sky-400 focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-white"
            >
              Reintentar Nivel
            </button>
            <button
              type="button"
              onClick={onReturnTitle}
              className="min-h-[44px] rounded-xl border border-white/10 bg-slate-800 px-5 py-2.5 font-display text-sm font-semibold text-slate-200 transition-colors hover:bg-slate-700 focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-sky-300"
            >
              Elegir Nivel
            </button>
          </div>
        </div>
      </div>
    );
  }

  // 4. VICTORY MODAL
  const hasNext = (victoryStats?.levelIndex ?? hud.levelIndex) < LEVELS.length - 1;
  return (
    <div className="fixed inset-0 z-20 flex items-center justify-center bg-[#040814]/75 p-4 pt-[max(1rem,env(safe-area-inset-top))] pb-[max(1rem,env(safe-area-inset-bottom))]">
      <div className="flex max-h-[calc(100dvh-2rem)] w-full max-w-md flex-col gap-5 overflow-y-auto rounded-2xl border border-sky-400/30 bg-[#091124]/95 p-6 text-white shadow-2xl sm:p-7">
        <div>
          <p className="text-xs font-semibold tracking-wide text-sky-400">Misión Completada</p>
          <h2 className="mt-1 font-display text-2xl font-extrabold text-white sm:text-3xl">
            {hud.levelName}
          </h2>
        </div>

        <div className="grid grid-cols-2 gap-3 rounded-xl border border-white/10 bg-slate-900/75 p-4 text-center sm:grid-cols-4">
          <div>
            <p className="text-xs text-slate-400">Mini-Bots</p>
            <p className="mt-1 font-mono-num text-xl font-bold text-sky-300">
              {victoryStats?.bots ?? hud.botsRescued}/{victoryStats?.totalBots ?? hud.totalBots}
            </p>
          </div>
          <div>
            <p className="text-xs text-slate-400">Reliquias</p>
            <p className="mt-1 font-mono-num text-xl font-bold text-cyan-300">
              {victoryStats?.relics ?? hud.relicsCollected}/{victoryStats?.totalRelics ?? hud.totalRelics}
            </p>
          </div>
          <div>
            <p className="text-xs text-slate-400">Monedas</p>
            <p className="mt-1 font-mono-num text-xl font-bold text-amber-300">
              {victoryStats?.coins ?? hud.coins}
            </p>
          </div>
          <div>
            <p className="text-xs text-slate-400">Tiempo</p>
            <p className="mt-1 font-mono-num text-xl font-bold text-white">
              {formatTime(victoryStats?.time ?? hud.elapsedTime)}
            </p>
          </div>
        </div>

        <div className="flex flex-col gap-2.5">
          {hasNext && (
            <button
              ref={primaryBtnRef}
              type="button"
              onClick={onNextLevel}
              className="min-h-[48px] rounded-xl bg-sky-500 px-6 py-3 font-display text-base font-bold text-slate-950 transition-colors hover:bg-sky-400 focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-white"
            >
              Siguiente Nivel
            </button>
          )}
          <div className="grid grid-cols-2 gap-2.5">
            <button
              ref={hasNext ? undefined : primaryBtnRef}
              type="button"
              onClick={onRestart}
              className="min-h-[44px] rounded-xl border border-white/15 bg-slate-800 px-4 py-2.5 font-display text-sm font-semibold text-white transition-colors hover:bg-slate-700 focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-sky-300"
            >
              Repetir
            </button>
            <button
              type="button"
              onClick={onReturnTitle}
              className="min-h-[44px] rounded-xl border border-white/10 bg-transparent px-4 py-2.5 font-display text-sm font-semibold text-slate-300 transition-colors hover:bg-slate-800 hover:text-white focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-sky-300"
            >
              Elegir Nivel
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
