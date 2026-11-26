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
  onTouchWeb: () => void;
  onTouchReleaseWeb: () => void;
  onTouchHulkPunch: () => void;
  onTouchHulkSlam: () => void;
  onTouchHulkGrab: () => void;
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
  onTouchWeb,
  onTouchReleaseWeb,
  onTouchHulkPunch,
  onTouchHulkSlam,
  onTouchHulkGrab,
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
      : hud.perspectiveMode === 'ALA DELTA'
        ? 'Cruceta / WASD Planear · OK / A / Espacio Corriente térmica · Volver Pausa'
        : hud.perspectiveMode === 'BARCO'
          ? 'Cruceta / WASD Timón · OK / A / Espacio Saltar ola · Volver Pausa'
          : hud.hasHulkSuit
            ? hud.hulkCarrying
              ? `Cargando ${hud.hulkCarrying} · Pulsa E / Clic Izq / B para Lanzar · WASD Mover · Espacio Súper Salto`
              : 'WASD Mover · Clic Izq / F / X Puñetazo · Mantén Espacio Súper Salto · Clic Der / G / Y Golpe Suelo · E Agarrar'
            : hud.hasSpiderSuit
              ? hud.isSwinging
                ? 'WASD Balancearse · Espacio / Clic Der Soltar telaraña · Clic Izq / G Reenganchar'
                : hud.isClimbing
                  ? 'WASD / Cruceta Escalar rascacielos · Espacio Saltar de la fachada'
                  : 'WASD Mover · Clic Izq / G / RT Telaraña (Balanceo / Enredar) · Empuja edificios para escalar'
              : hud.isClimbing
                ? 'Cruceta / Stick Trepar y Lateral · OK / A / Espacio Saltar del muro'
                : hud.hasBow
                  ? 'Cruceta / Mando Mover · OK / A Saltar (×2 Doble salto) · 2×OK / X / B Girar y Arco · Volver Pausa'
                  : 'Cruceta / Mando Mover · OK / A Saltar (×2 Doble salto) y Planear · 2×OK / X Girar · Volver Pausa';

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

            {hud.hasSpiderSuit && (
              <>
                <span className="text-white/30" aria-hidden="true">·</span>
                <span className="text-xs font-semibold text-rose-300">
                  {hud.isSwinging ? 'Balanceo' : 'Traje Arácnido'}
                </span>
              </>
            )}

            {hud.hasHulkSuit && (
              <>
                <span className="text-white/30" aria-hidden="true">·</span>
                <span className="text-xs font-semibold text-lime-300">
                  {hud.hulkTransforming ? 'Transformando...' : 'Hulk'}
                </span>
              </>
            )}

            {hud.hasHulkSuit && hud.hulkCarrying && (
              <>
                <span className="text-white/30" aria-hidden="true">·</span>
                <span className="text-xs font-semibold text-amber-300">
                  Cargando: {hud.hulkCarrying}
                </span>
              </>
            )}

            <span className="text-white/30" aria-hidden="true">·</span>

            <span className="font-mono-num text-xs text-slate-300">
              {formatTime(hud.elapsedTime)}
            </span>
          </div>

          {/* Hover Laser / Bot Rocket / Hulk Leap Charge Bar */}
          <div className="flex items-center gap-2">
            <span
              className={`text-[11px] font-medium ${
                hud.botRocketActive
                  ? 'text-amber-300'
                  : hud.hasHulkSuit
                    ? 'text-lime-300'
                    : 'text-sky-300'
              }`}
            >
              {hud.botRocketActive
                ? 'Cohete Bot'
                : hud.perspectiveMode === 'COHETE'
                  ? 'Propulsor'
                  : hud.perspectiveMode === 'ALA DELTA'
                    ? 'Térmica'
                    : hud.perspectiveMode === 'BARCO'
                      ? 'Olas'
                      : hud.hasHulkSuit
                        ? 'Salto Gamma'
                        : 'Láser'}
            </span>
            <div className="h-1.5 w-32 overflow-hidden rounded-full bg-slate-800">
              <div
                className={`h-full origin-left transition-transform duration-75 ${
                  hud.botRocketActive
                    ? 'bg-gradient-to-r from-amber-400 to-orange-500'
                    : hud.hasHulkSuit
                      ? 'bg-gradient-to-r from-lime-400 to-emerald-400'
                      : 'bg-sky-400'
                }`}
                style={{
                  transform: `scaleX(${Math.max(
                    0,
                    Math.min(1, hud.hasHulkSuit && !hud.botRocketActive ? hud.hulkLeapCharge : hud.hoverFuel)
                  )})`,
                }}
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

            {hud.botRocketCharges > 0 && (
              <>
                <span className="text-white/25" aria-hidden="true">·</span>
                <div className="flex items-center gap-1" title="Bots Cohete de rescate al caer">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                    <path d="M12 2c3.5 3.5 5 8 5 12l-5-2.5L7 14c0-4 1.5-8.5 5-12z" fill="#fb923c" />
                    <path d="M10 15.5l2 5.5 2-5.5" fill="#38bdf8" />
                  </svg>
                  <span className="font-mono-num text-xs font-bold text-amber-300">
                    ×{hud.botRocketCharges}
                  </span>
                </div>
              </>
            )}

            <span className="text-white/25" aria-hidden="true">·</span>

            <div className="flex items-center gap-1.5" title="Reliquias Estelares">
              <svg width="17" height="17" viewBox="0 0 24 24" fill="none">
                <polygon points="12,2 19,9 12,22 5,9" fill="#38bdf8" stroke="#bae6fd" strokeWidth="1.4" />
                <polygon points="12,5 16,9.5 12,17 8,9.5" fill="#e0f2fe" opacity="0.7" />
              </svg>
              <span className="font-mono-num text-sm font-bold text-cyan-300">
                {hud.relicsCollected}/{hud.totalRelics}
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
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <span className="font-display text-xs font-bold tracking-wider text-rose-300 uppercase">
                Jefe Final · {hud.boss.name}
              </span>
              {hud.boss.phase > 1 && (
                <span className="rounded bg-rose-500/30 px-1.5 py-0.5 font-mono-num text-[10px] font-bold text-rose-200 uppercase">
                  Fase {hud.boss.phase}
                </span>
              )}
            </div>
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

      {/* Timed Challenge Countdown (Level 09) */}
      {hud.challengeTimer !== null && hud.challengeProgress && (
        <div className="mx-auto mt-2 flex items-center gap-3 rounded-xl border border-amber-400/50 bg-[#0d1326]/90 px-4 py-2 text-white shadow-xl">
          <span className="font-display text-xs font-bold tracking-wide text-amber-300 uppercase">
            {hud.challengeProgress}
          </span>
          <span className="text-white/25" aria-hidden="true">·</span>
          <span
            className={`font-mono-num text-sm font-extrabold ${
              hud.challengeTimer <= 5 ? 'text-rose-400' : 'text-white'
            }`}
          >
            {hud.challengeTimer.toFixed(1)}s
          </span>
        </div>
      )}

      {/* Web Anchor Target Prompt */}
      {hud.hasSpiderSuit && hud.canWebTarget && !hud.isSwinging && !hud.spiderTransforming && !hud.bannerText && (
        <div className="mx-auto mt-2 rounded-lg border border-rose-400/40 bg-[#0d1326]/82 px-3.5 py-1 text-center shadow">
          <span className="font-display text-xs font-semibold text-rose-200">
            Anclaje fijado · Pulsa Clic Izq / G / RT para balancearte
          </span>
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
            {hud.hasHulkSuit ? (
              <>
                <button
                  type="button"
                  onPointerDown={onTouchHulkGrab}
                  className="flex h-14 w-14 items-center justify-center rounded-full border border-amber-400/60 bg-amber-950/90 font-display text-[11px] font-bold text-amber-200 active:bg-amber-600"
                >
                  {hud.hulkCarrying ? 'Lanzar' : 'Agarrar'}
                </button>
                <button
                  type="button"
                  onPointerDown={onTouchHulkSlam}
                  className="flex h-14 w-14 items-center justify-center rounded-full border border-purple-400/60 bg-purple-950/90 font-display text-[10px] font-bold leading-tight text-purple-200 active:bg-purple-600"
                >
                  Golpe Suelo
                </button>
                <button
                  type="button"
                  onPointerDown={onTouchHulkPunch}
                  className="flex h-14 w-14 items-center justify-center rounded-full border border-lime-400/60 bg-lime-950/90 font-display text-[11px] font-bold text-lime-200 active:bg-lime-600"
                >
                  Puñetazo
                </button>
              </>
            ) : (
              <>
                {hud.hasSpiderSuit && hud.isSwinging && (
                  <button
                    type="button"
                    onPointerDown={onTouchReleaseWeb}
                    className="flex h-14 w-14 items-center justify-center rounded-full border border-amber-400/60 bg-amber-950/90 font-display text-xs font-bold text-amber-200 active:bg-amber-600"
                  >
                    Soltar
                  </button>
                )}
                {hud.hasSpiderSuit && (
                  <button
                    type="button"
                    onPointerDown={onTouchWeb}
                    className="flex h-14 w-14 items-center justify-center rounded-full border border-rose-400/60 bg-rose-950/90 font-display text-[11px] font-bold text-rose-200 active:bg-rose-600"
                  >
                    Telaraña
                  </button>
                )}
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
              </>
            )}
            <button
              type="button"
              onPointerDown={() => onTouchJump(true, true)}
              onPointerUp={() => onTouchJump(false, false)}
              onPointerCancel={() => onTouchJump(false, false)}
              className={`flex h-16 w-16 items-center justify-center rounded-full border font-display text-xs font-bold text-white shadow-lg ${
                hud.hasHulkSuit
                  ? 'border-lime-300/60 bg-lime-600/95 active:bg-lime-500'
                  : 'border-sky-300/60 bg-sky-600/95 active:bg-sky-400'
              }`}
            >
              {hud.perspectiveMode === 'COHETE'
                ? 'Turbo'
                : hud.perspectiveMode === 'ALA DELTA'
                  ? 'Térmica'
                  : hud.hasHulkSuit
                    ? 'Salto'
                    : 'Saltar'}
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
