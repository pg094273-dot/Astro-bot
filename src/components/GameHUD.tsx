import React, { useEffect, useState } from 'react';
import { Music, Pause, Volume2, VolumeX } from 'lucide-react';
import { HudSnapshot } from '../game/types';

interface GameHUDProps {
  hud: HudSnapshot;
  onToggleMute: () => void;
  onToggleMusic: () => void;
  onPause: () => void;
  onTouchMove: (x: number, z: number) => void;
  onTouchJump: (held: boolean, justPressed: boolean) => void;
  onTouchSpin: () => void;
  onTouchBow: () => void;
}

function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  const tenths = Math.floor((seconds % 1) * 10);
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}.${tenths}`;
}

export const GameHUD: React.FC<GameHUDProps> = ({
  hud,
  onToggleMute,
  onToggleMusic,
  onPause,
  onTouchMove,
  onTouchJump,
  onTouchSpin,
  onTouchBow,
}) => {
  const [isTouchDevice, setIsTouchDevice] = useState(false);

  useEffect(() => {
    const coarse = window.matchMedia?.('(pointer: coarse)').matches || navigator.maxTouchPoints > 0;
    setIsTouchDevice(Boolean(coarse));
  }, []);

  if (hud.phase !== 'playing') return null;

  const hintText =
    hud.perspectiveMode === 'COHETE'
      ? 'Cruceta / WASD Maniobrar · OK / A / Espacio Turbo · Volver / Esc Pausa'
      : hud.isClimbing
        ? 'Cruceta / Stick Trepar y Lateral · OK / A / Espacio Saltar del muro'
        : hud.hasBow
          ? 'Cruceta / Mando Mover · OK / A Saltar · 2×OK / X / B Girar y Arco · Volver Pausa'
          : 'Cruceta / Mando Mover · OK / A Saltar/Planear · 2×OK / X Girar · Volver Pausa';

  return (
    <div className="pointer-events-none fixed inset-0 z-10 flex flex-col justify-between p-4 pt-[max(1rem,env(safe-area-inset-top))] pb-[max(1rem,env(safe-area-inset-bottom))] pl-[max(1rem,env(safe-area-inset-left))] pr-[max(1rem,env(safe-area-inset-right))] sm:p-6">
      {/* Top Perimeter Clusters */}
      <div className="flex items-start justify-between gap-4">
        {/* Top-Left: Health + Hover Fuel + Level/Mode/Timer */}
        <div className="flex flex-col gap-2 rounded-xl border border-white/15 bg-[#070d1d]/82 px-4 py-2.5 text-white shadow-lg">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5" aria-label={`Energía ${hud.health} de ${hud.maxHealth}`}>
              {Array.from({ length: hud.maxHealth }).map((_, i) => {
                const active = i < hud.health;
                return (
                  <svg
                    key={i}
                    width="20"
                    height="20"
                    viewBox="0 0 24 24"
                    fill={active ? '#38bdf8' : 'rgba(148, 163, 184, 0.25)'}
                    className="transition-transform duration-150"
                  >
                    <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
                  </svg>
                );
              })}
            </div>

            <span className="text-white/30" aria-hidden="true">·</span>

            <span className="font-display text-sm font-semibold tracking-tight text-sky-100">
              {hud.levelName}
            </span>

            <span className="text-white/30" aria-hidden="true">·</span>

            <span className="font-mono-num text-xs font-bold text-amber-300">
              {hud.perspectiveMode}
            </span>

            {hud.hasBow && (
              <>
                <span className="text-white/30" aria-hidden="true">·</span>
                <span className="text-xs font-semibold text-sky-300">Arco</span>
              </>
            )}

            {hud.hasMonkeySuit && (
              <>
                <span className="text-white/30" aria-hidden="true">·</span>
                <span className="text-xs font-semibold text-emerald-300">Traje Mono</span>
              </>
            )}

            <span className="text-white/30" aria-hidden="true">·</span>

            <span className="font-mono-num text-xs text-slate-300">
              {formatTime(hud.elapsedTime)}
            </span>
          </div>

          {/* Hover Laser Fuel Bar */}
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-medium text-sky-300">
              {hud.perspectiveMode === 'COHETE' ? 'Propulsor' : 'Láser'}
            </span>
            <div className="h-1.5 w-32 overflow-hidden rounded-full bg-slate-800">
              <div
                className="h-full origin-left bg-sky-400 transition-transform duration-75"
                style={{ transform: `scaleX(${Math.max(0, Math.min(1, hud.hoverFuel))})` }}
              />
            </div>
          </div>
        </div>

        {/* Top-Right: Bots, Coins, Mute & Pause */}
        <div className="flex items-center gap-2.5">
          <div className="flex items-center gap-4 rounded-xl border border-white/15 bg-[#070d1d]/82 px-4 py-2.5 text-white shadow-lg">
            <div className="flex items-center gap-1.5" title="Mini-Bots rescatados">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                <rect x="5" y="6" width="14" height="11" rx="5" fill="#f8fafc" />
                <rect x="7.5" y="9" width="9" height="5" rx="2" fill="#0f172a" />
                <circle cx="10" cy="11.5" r="1.1" fill="#38bdf8" />
                <circle cx="14" cy="11.5" r="1.1" fill="#38bdf8" />
                <line x1="12" y1="6" x2="12" y2="3" stroke="#38bdf8" strokeWidth="2" />
                <circle cx="12" cy="2.5" r="1.3" fill="#38bdf8" />
              </svg>
              <span className="font-mono-num text-sm font-bold text-white">
                {hud.botsRescued}/{hud.totalBots}
              </span>
            </div>

            <span className="text-white/25" aria-hidden="true">·</span>

            <div className="flex items-center gap-1.5" title="Monedas estelares">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                <circle cx="12" cy="12" r="9" fill="#facc15" stroke="#ca8a04" strokeWidth="1.5" />
                <path
                  d="M12 6.8l1.45 2.95 3.25.47-2.35 2.29.55 3.24L12 14.22l-2.9 1.53.55-3.24-2.35-2.29 3.25-.47L12 6.8z"
                  fill="#fef9c3"
                />
              </svg>
              <span className="font-mono-num text-sm font-bold text-amber-300">
                {hud.coins}
              </span>
            </div>
          </div>

          <button
            type="button"
            tabIndex={-1}
            onClick={onToggleMusic}
            aria-label={hud.musicMuted ? 'Activar música' : 'Silenciar música'}
            title={hud.musicMuted ? 'Activar música' : 'Silenciar música'}
            className={`pointer-events-auto flex h-10 w-10 items-center justify-center rounded-xl border transition-colors focus-visible:outline-2 focus-visible:outline-sky-400 ${
              hud.musicMuted || hud.muted
                ? 'border-white/10 bg-[#070d1d]/75 text-slate-500 hover:bg-slate-800 hover:text-slate-300'
                : 'border-sky-400/35 bg-[#070d1d]/85 text-sky-300 hover:bg-slate-800 hover:text-white'
            }`}
          >
            <Music className="h-4 w-4" />
          </button>

          <button
            type="button"
            tabIndex={-1}
            onClick={onToggleMute}
            aria-label={hud.muted ? 'Activar sonido' : 'Silenciar sonido'}
            title={hud.muted ? 'Activar sonido' : 'Silenciar sonido'}
            className="pointer-events-auto flex h-10 w-10 items-center justify-center rounded-xl border border-white/15 bg-[#070d1d]/85 text-slate-200 transition-colors hover:bg-slate-800 hover:text-white focus-visible:outline-2 focus-visible:outline-sky-400"
          >
            {hud.muted ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
          </button>

          <button
            type="button"
            tabIndex={-1}
            onClick={onPause}
            aria-label="Pausar juego"
            className="pointer-events-auto flex h-10 w-10 items-center justify-center rounded-xl border border-white/15 bg-[#070d1d]/85 text-slate-200 transition-colors hover:bg-slate-800 hover:text-white focus-visible:outline-2 focus-visible:outline-sky-400"
          >
            <Pause className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Final Boss Health Bar */}
      {hud.boss && (
        <div className="mx-auto mt-2 flex w-full max-w-md flex-col gap-1.5 rounded-xl border border-rose-500/40 bg-[#140714]/88 px-4 py-2.5 text-white shadow-xl">
          <div className="flex items-center justify-between">
            <span className="font-display text-xs font-bold tracking-wider text-rose-300 uppercase">
              Jefe Final · {hud.boss.name}
            </span>
            <span className="font-mono-num text-xs font-bold text-amber-300">
              {hud.boss.hp}/{hud.boss.maxHp}
            </span>
          </div>
          <div className="h-2.5 w-full overflow-hidden rounded-full bg-slate-900">
            <div
              className="h-full origin-left bg-gradient-to-r from-rose-500 to-amber-400 transition-transform duration-150"
              style={{ transform: `scaleX(${Math.max(0, Math.min(1, hud.boss.hp / hud.boss.maxHp))})` }}
            />
          </div>
        </div>
      )}

      {/* Transient Event Banner */}
      {hud.bannerText && (
        <div className="mx-auto mt-3 rounded-lg border border-sky-400/35 bg-[#070d1d]/88 px-5 py-2 text-center shadow-lg">
          <span className="font-display text-base font-bold tracking-wide text-sky-300">
            {hud.bannerText}
          </span>
        </div>
      )}

      {/* Bottom Controls */}
      {isTouchDevice ? (
        <div className="flex items-end justify-between pb-2">
          <div className="pointer-events-auto grid grid-cols-3 gap-1.5 rounded-2xl border border-white/15 bg-[#070d1d]/75 p-2">
            <div />
            <button
              type="button"
              onPointerDown={() => onTouchMove(0, -1)}
              onPointerUp={() => onTouchMove(0, 0)}
              onPointerLeave={() => onTouchMove(0, 0)}
              className="flex h-12 w-12 items-center justify-center rounded-lg bg-slate-800/90 text-sm font-bold text-white active:bg-sky-600"
            >
              ▲
            </button>
            <div />
            <button
              type="button"
              onPointerDown={() => onTouchMove(-1, 0)}
              onPointerUp={() => onTouchMove(0, 0)}
              onPointerLeave={() => onTouchMove(0, 0)}
              className="flex h-12 w-12 items-center justify-center rounded-lg bg-slate-800/90 text-sm font-bold text-white active:bg-sky-600"
            >
              ◀
            </button>
            <button
              type="button"
              onPointerDown={() => onTouchMove(0, 1)}
              onPointerUp={() => onTouchMove(0, 0)}
              onPointerLeave={() => onTouchMove(0, 0)}
              className="flex h-12 w-12 items-center justify-center rounded-lg bg-slate-800/90 text-sm font-bold text-white active:bg-sky-600"
            >
              ▼
            </button>
            <button
              type="button"
              onPointerDown={() => onTouchMove(1, 0)}
              onPointerUp={() => onTouchMove(0, 0)}
              onPointerLeave={() => onTouchMove(0, 0)}
              className="flex h-12 w-12 items-center justify-center rounded-lg bg-slate-800/90 text-sm font-bold text-white active:bg-sky-600"
            >
              ▶
            </button>
          </div>

          <div className="pointer-events-auto flex items-center gap-2.5">
            {hud.hasBow && (
              <button
                type="button"
                onPointerDown={onTouchBow}
                className="flex h-14 w-14 items-center justify-center rounded-full border border-amber-400/60 bg-amber-950/90 font-display text-xs font-bold text-amber-200 active:bg-amber-600"
              >
                Arco
              </button>
            )}
            <button
              type="button"
              onPointerDown={onTouchSpin}
              className="flex h-14 w-14 items-center justify-center rounded-full border border-sky-400/50 bg-sky-950/90 font-display text-xs font-bold text-sky-200 active:bg-sky-600"
            >
              Girar
            </button>
            <button
              type="button"
              onPointerDown={() => onTouchJump(true, true)}
              onPointerUp={() => onTouchJump(false, false)}
              onPointerCancel={() => onTouchJump(false, false)}
              className="flex h-16 w-16 items-center justify-center rounded-full border border-sky-300/60 bg-sky-600/95 font-display text-xs font-bold text-white shadow-lg active:bg-sky-400"
            >
              {hud.perspectiveMode === 'COHETE' ? 'Turbo' : 'Saltar'}
            </button>
          </div>
        </div>
      ) : (
        <div className="mx-auto text-center">
          <p className="rounded-lg bg-[#070d1d]/75 px-3.5 py-1 text-xs text-slate-200">
            {hintText}
          </p>
        </div>
      )}
    </div>
  );
};
