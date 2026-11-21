import React from 'react';
import { LEVELS } from '../game/levels';
import { HudSnapshot, LevelProgress } from '../game/types';
import { PWAInstallButton } from './PWAInstallButton';

interface GameMenusProps {
  hud: HudSnapshot;
  selectedLevel: number;
  onSelectLevel: (idx: number) => void;
  progress: Record<number, LevelProgress>;
  victoryStats: {
    levelIndex: number;
    coins: number;
    totalCoins: number;
    bots: number;
    totalBots: number;
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
  selectedLevel,
  onSelectLevel,
  progress,
  victoryStats,
  onStartGame,
  onResume,
  onRestart,
  onNextLevel,
  onReturnTitle,
}) => {
  if (hud.phase === 'playing') return null;

  // 1. TITLE SCREEN (Stages live 3D rotating showcase behind calm left-aligned lockup)
  if (hud.phase === 'title') {
    const activeLevel = LEVELS[selectedLevel];
    return (
      <div className="fixed inset-0 z-20 flex flex-col justify-between p-6 pt-[max(1.5rem,env(safe-area-inset-top))] pb-[max(1.5rem,env(safe-area-inset-bottom))] sm:p-10">
        {/* Top-left bespoke SVG title lockup + Install CTA */}
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="max-w-xl">
          <svg
            viewBox="0 0 420 96"
            className="h-16 w-auto sm:h-24 drop-shadow-[0_6px_24px_rgba(2,132,199,0.45)]"
            aria-label="Astro Nova 3D"
          >
            <defs>
              <linearGradient id="astroTitleGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#ffffff" />
                <stop offset="55%" stopColor="#e0f2fe" />
                <stop offset="100%" stopColor="#38bdf8" />
              </linearGradient>
            </defs>
            {/* Visor emblem mark */}
            <rect x="4" y="14" width="66" height="54" rx="22" fill="#f8fafc" />
            <rect x="13" y="25" width="48" height="32" rx="14" fill="#091124" />
            <ellipse cx="28" cy="41" rx="5.5" ry="7.5" fill="#38bdf8" />
            <ellipse cx="46" cy="41" rx="5.5" ry="7.5" fill="#38bdf8" />
            <path d="M37 14 L37 4" stroke="#38bdf8" strokeWidth="4" strokeLinecap="round" />
            <circle cx="37" cy="4" r="4" fill="#38bdf8" />
            {/* Wordmark */}
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
          <PWAInstallButton />
        </div>

        {/* Bottom Dock: Level Selector Cards + Primary Start CTA + Single Control Hint Line */}
        <div className="mx-auto flex w-full max-w-4xl flex-col gap-4 rounded-2xl border border-white/15 bg-[#070d1d]/88 p-5 text-white shadow-2xl">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            {LEVELS.map((lvl) => {
              const isSelected = lvl.index === selectedLevel;
              const stats = progress[lvl.index];
              return (
                <button
                  key={lvl.id}
                  type="button"
                  onClick={() => onSelectLevel(lvl.index)}
                  className={`flex flex-col items-start gap-1 rounded-xl border p-3.5 text-left transition-colors ${
                    isSelected
                      ? 'border-sky-400 bg-sky-950/75 text-white'
                      : 'border-white/10 bg-slate-900/65 text-slate-300 hover:border-white/25 hover:bg-slate-800/75'
                  }`}
                >
                  <div className="flex w-full items-center justify-between gap-2">
                    <span className="font-display text-sm font-bold text-white">
                      0{lvl.index + 1}. {lvl.name}
                    </span>
                    {stats?.completed && (
                      <span className="text-xs font-semibold text-emerald-400">Completado</span>
                    )}
                  </div>
                  <p className="line-clamp-1 text-xs text-slate-300">{lvl.subtitle}</p>
                  <div className="mt-1 flex items-center gap-2 font-mono-num text-xs text-sky-300">
                    <span>Bots {stats ? stats.bestBots : 0}/{lvl.miniBots.length}</span>
                    <span className="text-white/25" aria-hidden="true">·</span>
                    <span className="text-amber-300">Monedas {stats ? stats.bestCoins : 0}</span>
                  </div>
                </button>
              );
            })}
          </div>

          <div className="flex flex-col items-center justify-between gap-3 border-t border-white/10 pt-3 sm:flex-row">
            <p className="text-xs text-slate-300">
              WASD Mover · Espacio Saltar / Planear con Láser · F / Clic Der. Girar · Q/E Cámara · Esc Pausa
            </p>
            <button
              type="button"
              onClick={() => onStartGame(activeLevel.index)}
              className="w-full shrink-0 rounded-xl bg-sky-500 px-8 py-3 font-display text-base font-bold text-slate-950 shadow-lg transition-transform hover:bg-sky-400 active:scale-[0.98] sm:w-auto"
            >
              Jugar Nivel {activeLevel.index + 1}
            </button>
          </div>
        </div>
      </div>
    );
  }

  // 2. PAUSE MODAL
  if (hud.phase === 'paused') {
    return (
      <div className="fixed inset-0 z-20 flex items-center justify-center bg-[#040814]/75 p-4">
        <div className="flex w-full max-w-sm flex-col gap-4 rounded-2xl border border-white/15 bg-[#091124]/95 p-6 text-white shadow-2xl">
          <h2 className="font-display text-2xl font-bold text-white">Pausa</h2>
          <p className="text-sm text-slate-300">{hud.levelName}</p>
          <div className="flex flex-col gap-2.5 pt-2">
            <button
              type="button"
              onClick={onResume}
              className="rounded-xl bg-sky-500 px-5 py-2.5 font-display text-sm font-bold text-slate-950 transition-colors hover:bg-sky-400"
            >
              Continuar
            </button>
            <button
              type="button"
              onClick={onRestart}
              className="rounded-xl border border-white/15 bg-slate-800 px-5 py-2.5 font-display text-sm font-semibold text-white transition-colors hover:bg-slate-700"
            >
              Reiniciar Nivel
            </button>
            <button
              type="button"
              onClick={onReturnTitle}
              className="rounded-xl border border-white/10 bg-transparent px-5 py-2.5 font-display text-sm font-semibold text-slate-300 transition-colors hover:bg-slate-800 hover:text-white"
            >
              Volver al Menú
            </button>
            <div className="flex justify-center pt-1">
              <PWAInstallButton />
            </div>
          </div>
        </div>
      </div>
    );
  }

  // 3. GAME OVER MODAL
  if (hud.phase === 'gameover') {
    return (
      <div className="fixed inset-0 z-20 flex items-center justify-center bg-[#040814]/78 p-4">
        <div className="flex w-full max-w-sm flex-col gap-4 rounded-2xl border border-rose-500/30 bg-[#091124]/95 p-6 text-white shadow-2xl">
          <h2 className="font-display text-2xl font-bold text-rose-400">Sin Energía</h2>
          <p className="text-sm text-slate-300">
            Nova Bot necesita recargar circuitos en {hud.levelName}.
          </p>
          <div className="flex flex-col gap-2.5 pt-2">
            <button
              type="button"
              onClick={onRestart}
              className="rounded-xl bg-sky-500 px-5 py-2.5 font-display text-sm font-bold text-slate-950 transition-colors hover:bg-sky-400"
            >
              Reintentar Nivel
            </button>
            <button
              type="button"
              onClick={onReturnTitle}
              className="rounded-xl border border-white/10 bg-slate-800 px-5 py-2.5 font-display text-sm font-semibold text-slate-200 transition-colors hover:bg-slate-700"
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
    <div className="fixed inset-0 z-20 flex items-center justify-center bg-[#040814]/75 p-4">
      <div className="flex w-full max-w-md flex-col gap-5 rounded-2xl border border-sky-400/30 bg-[#091124]/95 p-7 text-white shadow-2xl">
        <div>
          <p className="text-xs font-semibold tracking-wide text-sky-400">Misión Completada</p>
          <h2 className="mt-1 font-display text-3xl font-extrabold text-white">
            {hud.levelName}
          </h2>
        </div>

        <div className="grid grid-cols-3 gap-3 rounded-xl border border-white/10 bg-slate-900/75 p-4 text-center">
          <div>
            <p className="text-xs text-slate-400">Mini-Bots</p>
            <p className="mt-1 font-mono-num text-xl font-bold text-sky-300">
              {victoryStats?.bots ?? hud.botsRescued}/{victoryStats?.totalBots ?? hud.totalBots}
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
              type="button"
              onClick={onNextLevel}
              className="rounded-xl bg-sky-500 px-6 py-3 font-display text-base font-bold text-slate-950 transition-colors hover:bg-sky-400"
            >
              Siguiente Nivel
            </button>
          )}
          <div className="grid grid-cols-2 gap-2.5">
            <button
              type="button"
              onClick={onRestart}
              className="rounded-xl border border-white/15 bg-slate-800 px-4 py-2.5 font-display text-sm font-semibold text-white transition-colors hover:bg-slate-700"
            >
              Repetir
            </button>
            <button
              type="button"
              onClick={onReturnTitle}
              className="rounded-xl border border-white/10 bg-transparent px-4 py-2.5 font-display text-sm font-semibold text-slate-300 transition-colors hover:bg-slate-800 hover:text-white"
            >
              Menú Principal
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
