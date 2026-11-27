import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Music, Pause, Volume2, VolumeX } from 'lucide-react';
import { HudSnapshot } from '../game/types';
import { VirtualJoystick } from './VirtualJoystick';

export type TouchControlsMode = 'auto' | 'always' | 'off';

interface GameHUDProps {
  hud: HudSnapshot;
  touchControlsMode: TouchControlsMode;
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

interface TouchActionButtonProps {
  label: string;
  subLabel?: string;
  onPressStart: () => void;
  onPressEnd?: () => void;
  repeatMs?: number;
  className: string;
  ariaLabel?: string;
}

const TouchActionButton: React.FC<TouchActionButtonProps> = ({
  label,
  subLabel,
  onPressStart,
  onPressEnd,
  repeatMs,
  className,
  ariaLabel,
}) => {
  const pointerIdRef = useRef<number | null>(null);
  const repeatTimerRef = useRef<number | null>(null);
  const [pressed, setPressed] = useState(false);

  const clearRepeat = useCallback(() => {
    if (repeatTimerRef.current !== null) {
      window.clearInterval(repeatTimerRef.current);
      repeatTimerRef.current = null;
    }
  }, []);

  const endPress = useCallback(() => {
    if (pointerIdRef.current === null) return;
    pointerIdRef.current = null;
    clearRepeat();
    setPressed(false);
    onPressEnd?.();
  }, [clearRepeat, onPressEnd]);

  useEffect(() => {
    const handleBlur = () => endPress();
    window.addEventListener('blur', handleBlur);
    return () => {
      window.removeEventListener('blur', handleBlur);
      clearRepeat();
      if (pointerIdRef.current !== null) {
        onPressEnd?.();
      }
    };
  }, [clearRepeat, endPress, onPressEnd]);

  const handlePointerDown = (e: React.PointerEvent<HTMLButtonElement>) => {
    e.preventDefault();
    e.stopPropagation();
    if (pointerIdRef.current !== null) return;
    pointerIdRef.current = e.pointerId;
    setPressed(true);
    try {
      e.currentTarget.setPointerCapture(e.pointerId);
    } catch {
      // Ignore capture errors
    }
    onPressStart();
    if (repeatMs && repeatMs > 0) {
      clearRepeat();
      repeatTimerRef.current = window.setInterval(() => {
        onPressStart();
      }, repeatMs);
    }
  };

  const handlePointerUp = (e: React.PointerEvent<HTMLButtonElement>) => {
    if (pointerIdRef.current !== e.pointerId) return;
    e.preventDefault();
    e.stopPropagation();
    try {
      if (e.currentTarget.hasPointerCapture(e.pointerId)) {
        e.currentTarget.releasePointerCapture(e.pointerId);
      }
    } catch {
      // Ignore release errors
    }
    endPress();
  };

  return (
    <button
      type="button"
      aria-label={ariaLabel ?? label}
      onPointerDown={handlePointerDown}
      onPointerUp={handlePointerUp}
      onPointerCancel={handlePointerUp}
      onLostPointerCapture={handlePointerUp}
      onContextMenu={(e) => e.preventDefault()}
      style={{ touchAction: 'none' }}
      className={`pointer-events-auto flex select-none flex-col items-center justify-center rounded-full border-2 font-display shadow-lg transition-transform duration-75 ${
        pressed ? 'scale-92 brightness-125' : 'scale-100'
      } ${className}`}
    >
      <span className="leading-tight">{label}</span>
      {subLabel && (
        <span className="text-[9px] font-medium opacity-80 leading-none mt-0.5">{subLabel}</span>
      )}
    </button>
  );
};

function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  const tenths = Math.floor((seconds % 1) * 10);
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}.${tenths}`;
}

export const GameHUD: React.FC<GameHUDProps> = ({
  hud,
  touchControlsMode,
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
    const checkTouch = () => {
      const coarse =
        window.matchMedia?.('(pointer: coarse)').matches ||
        window.matchMedia?.('(any-pointer: coarse)').matches ||
        navigator.maxTouchPoints > 0;
      setIsTouchDevice(Boolean(coarse));
    };
    checkTouch();
    window.addEventListener('resize', checkTouch);
    return () => window.removeEventListener('resize', checkTouch);
  }, []);

  if (hud.phase !== 'playing') return null;

  const showTouchControls =
    touchControlsMode === 'always'
      ? true
      : touchControlsMode === 'off'
        ? false
        : isTouchDevice;

  const joystickAccent = hud.hasHulkSuit
    ? { color: '#a3e635', rgb: '163, 230, 53' }
    : hud.hasSpiderSuit
      ? { color: '#fb7185', rgb: '251, 113, 133' }
      : { color: '#38bdf8', rgb: '56, 189, 248' };

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
    <div className="pointer-events-none fixed inset-0 z-10 flex flex-col justify-between p-2.5 pt-[max(0.65rem,env(safe-area-inset-top))] pb-[max(0.65rem,env(safe-area-inset-bottom))] pl-[max(0.85rem,env(safe-area-inset-left))] pr-[max(0.85rem,env(safe-area-inset-right))] sm:p-5">
      {/* Top Perimeter Clusters */}
      <div className="flex items-start justify-between gap-2 sm:gap-4">
        {/* Top-Left: Health + Hover Fuel + Level/Mode/Timer */}
        <div className="flex max-w-[60vw] flex-col gap-1.5 rounded-xl border border-white/15 bg-[#070d1d]/82 px-2.5 py-1.5 text-white shadow-lg sm:max-w-none sm:gap-2 sm:px-4 sm:py-2.5">
          <div className="flex flex-wrap items-center gap-1.5 sm:gap-3">
            <div className="flex items-center gap-1 sm:gap-1.5" aria-label={`Energía ${hud.health} de ${hud.maxHealth}`}>
              {Array.from({ length: hud.maxHealth }).map((_, i) => {
                const active = i < hud.health;
                return (
                  <svg
                    key={i}
                    width="17"
                    height="17"
                    viewBox="0 0 24 24"
                    fill={active ? '#38bdf8' : 'rgba(148, 163, 184, 0.25)'}
                    className="sm:h-5 sm:w-5 transition-transform duration-150"
                  >
                    <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
                  </svg>
                );
              })}
            </div>

            <span className="hidden text-white/30 sm:inline" aria-hidden="true">·</span>

            <span className="hidden truncate font-display text-sm font-semibold tracking-tight text-sky-100 sm:inline">
              {hud.levelName}
            </span>

            <span className="text-white/30" aria-hidden="true">·</span>

            <span className="font-mono-num text-[11px] font-bold text-amber-300 sm:text-xs">
              {hud.perspectiveMode}
            </span>

            {hud.hasBow && (
              <>
                <span className="text-white/30" aria-hidden="true">·</span>
                <span className="text-[11px] font-semibold text-sky-300 sm:text-xs">Arco</span>
              </>
            )}

            {hud.hasMonkeySuit && (
              <>
                <span className="text-white/30" aria-hidden="true">·</span>
                <span className="text-[11px] font-semibold text-emerald-300 sm:text-xs">Mono</span>
              </>
            )}

            {hud.hasSpiderSuit && (
              <>
                <span className="text-white/30" aria-hidden="true">·</span>
                <span className="text-[11px] font-semibold text-rose-300 sm:text-xs">
                  {hud.isSwinging ? 'Balanceo' : 'Arácnido'}
                </span>
              </>
            )}

            {hud.hasHulkSuit && (
              <>
                <span className="text-white/30" aria-hidden="true">·</span>
                <span className="text-[11px] font-semibold text-lime-300 sm:text-xs">
                  {hud.hulkTransforming ? 'Transformando...' : 'Hulk'}
                </span>
              </>
            )}

            {hud.hasHulkSuit && hud.hulkCarrying && (
              <>
                <span className="text-white/30" aria-hidden="true">·</span>
                <span className="text-[11px] font-semibold text-amber-300 sm:text-xs">
                  {hud.hulkCarrying}
                </span>
              </>
            )}

            <span className="text-white/30" aria-hidden="true">·</span>

            <span className="font-mono-num text-[11px] text-slate-300 sm:text-xs">
              {formatTime(hud.elapsedTime)}
            </span>
          </div>

          {/* Hover Laser / Bot Rocket / Hulk Leap Charge Bar */}
          <div className="flex items-center gap-2">
            <span
              className={`text-[10px] font-medium sm:text-[11px] ${
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
            <div className="h-1.5 w-20 overflow-hidden rounded-full bg-slate-800 sm:w-32">
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

        {/* Top-Right: Bots, Relics, Coins, Mute & Pause */}
        <div className="flex items-center gap-1.5 sm:gap-2.5">
          <div className="flex items-center gap-2 rounded-xl border border-white/15 bg-[#070d1d]/82 px-2.5 py-1.5 text-white shadow-lg sm:gap-4 sm:px-4 sm:py-2.5">
            <div className="flex items-center gap-1" title="Mini-Bots rescatados">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" className="sm:h-[18px] sm:w-[18px]">
                <rect x="5" y="6" width="14" height="11" rx="5" fill="#f8fafc" />
                <rect x="7.5" y="9" width="9" height="5" rx="2" fill="#0f172a" />
                <circle cx="10" cy="11.5" r="1.1" fill="#38bdf8" />
                <circle cx="14" cy="11.5" r="1.1" fill="#38bdf8" />
                <line x1="12" y1="6" x2="12" y2="3" stroke="#38bdf8" strokeWidth="2" />
                <circle cx="12" cy="2.5" r="1.3" fill="#38bdf8" />
              </svg>
              <span className="font-mono-num text-xs font-bold text-white sm:text-sm">
                {hud.botsRescued}/{hud.totalBots}
              </span>
            </div>

            {hud.botRocketCharges > 0 && (
              <>
                <span className="text-white/25" aria-hidden="true">·</span>
                <div className="flex items-center gap-0.5" title="Bots Cohete de rescate al caer">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" className="sm:h-4 sm:w-4">
                    <path d="M12 2c3.5 3.5 5 8 5 12l-5-2.5L7 14c0-4 1.5-8.5 5-12z" fill="#fb923c" />
                    <path d="M10 15.5l2 5.5 2-5.5" fill="#38bdf8" />
                  </svg>
                  <span className="font-mono-num text-[11px] font-bold text-amber-300 sm:text-xs">
                    ×{hud.botRocketCharges}
                  </span>
                </div>
              </>
            )}

            <span className="text-white/25" aria-hidden="true">·</span>

            <div className="flex items-center gap-1" title="Reliquias Estelares">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" className="sm:h-[17px] sm:w-[17px]">
                <polygon points="12,2 19,9 12,22 5,9" fill="#38bdf8" stroke="#bae6fd" strokeWidth="1.4" />
                <polygon points="12,5 16,9.5 12,17 8,9.5" fill="#e0f2fe" opacity="0.7" />
              </svg>
              <span className="font-mono-num text-xs font-bold text-cyan-300 sm:text-sm">
                {hud.relicsCollected}/{hud.totalRelics}
              </span>
            </div>

            <span className="text-white/25" aria-hidden="true">·</span>

            <div className="flex items-center gap-1" title="Monedas estelares">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" className="sm:h-[18px] sm:w-[18px]">
                <circle cx="12" cy="12" r="9" fill="#facc15" stroke="#ca8a04" strokeWidth="1.5" />
                <path
                  d="M12 6.8l1.45 2.95 3.25.47-2.35 2.29.55 3.24L12 14.22l-2.9 1.53.55-3.24-2.35-2.29 3.25-.47L12 6.8z"
                  fill="#fef9c3"
                />
              </svg>
              <span className="font-mono-num text-xs font-bold text-amber-300 sm:text-sm">
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
            className={`pointer-events-auto hidden h-10 w-10 items-center justify-center rounded-xl border transition-colors focus-visible:outline-2 focus-visible:outline-sky-400 sm:flex ${
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
            className="pointer-events-auto hidden h-10 w-10 items-center justify-center rounded-xl border border-white/15 bg-[#070d1d]/85 text-slate-200 transition-colors hover:bg-slate-800 hover:text-white focus-visible:outline-2 focus-visible:outline-sky-400 sm:flex"
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

      {/* Center Top Dynamic Status Banners */}
      <div className="flex flex-col items-center">
        {hud.boss && (
          <div className="mt-1.5 flex w-full max-w-md flex-col gap-1 rounded-xl border border-rose-500/40 bg-[#140714]/88 px-4 py-2 text-white shadow-xl">
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
            <div className="h-2 w-full overflow-hidden rounded-full bg-slate-900">
              <div
                className="h-full origin-left bg-gradient-to-r from-rose-500 to-amber-400 transition-transform duration-150"
                style={{ transform: `scaleX(${Math.max(0, Math.min(1, hud.boss.hp / hud.boss.maxHp))})` }}
              />
            </div>
          </div>
        )}

        {hud.challengeTimer !== null && hud.challengeProgress && (
          <div className="mt-1.5 flex items-center gap-3 rounded-xl border border-amber-400/50 bg-[#0d1326]/90 px-4 py-1.5 text-white shadow-xl">
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

        {hud.hasSpiderSuit && hud.canWebTarget && !hud.isSwinging && !hud.spiderTransforming && !hud.bannerText && (
          <div className="mt-1.5 rounded-lg border border-rose-400/40 bg-[#0d1326]/82 px-3.5 py-1 text-center shadow">
            <span className="font-display text-xs font-semibold text-rose-200">
              {showTouchControls
                ? 'Anclaje fijado · Pulsa Telaraña para balancearte'
                : 'Anclaje fijado · Pulsa Clic Izq / G / RT para balancearte'}
            </span>
          </div>
        )}

        {hud.bannerText && (
          <div className="mt-2 rounded-lg border border-sky-400/35 bg-[#070d1d]/88 px-4 py-1.5 text-center shadow-lg">
            <span className="font-display text-sm font-bold tracking-wide text-sky-300 sm:text-base">
              {hud.bannerText}
            </span>
          </div>
        )}
      </div>

      {/* Bottom Controls: Virtual Analog Joystick (left) + Dynamic Action Cluster (right) */}
      {showTouchControls ? (
        <div className="flex items-end justify-between px-1 pb-1 sm:px-3 sm:pb-2">
          {/* Bottom-Left: Analog Virtual Joystick */}
          <VirtualJoystick
            onMove={onTouchMove}
            accentColor={joystickAccent.color}
            accentRgb={joystickAccent.rgb}
          />

          {/* Bottom-Right: Contextual Action Buttons */}
          <div className="pointer-events-auto flex items-end gap-2 sm:gap-3">
            {hud.hasHulkSuit ? (
              <div className="flex flex-col items-end gap-2">
                <div className="flex items-center gap-2 sm:gap-2.5">
                  <TouchActionButton
                    label={hud.hulkCarrying ? 'Lanzar' : 'Agarrar'}
                    onPressStart={onTouchHulkGrab}
                    className="h-14 w-14 border-amber-400/65 bg-amber-950/85 text-[11px] font-bold text-amber-200 md:h-16 md:w-16 md:text-xs"
                  />
                  <TouchActionButton
                    label="Golpe"
                    subLabel="Suelo"
                    onPressStart={onTouchHulkSlam}
                    className="h-14 w-14 border-purple-400/65 bg-purple-950/85 text-[11px] font-bold text-purple-200 md:h-16 md:w-16 md:text-xs"
                  />
                </div>
                <div className="flex items-end gap-2.5 sm:gap-3">
                  <TouchActionButton
                    label="Puñetazo"
                    onPressStart={onTouchHulkPunch}
                    repeatMs={340}
                    className="h-15 w-15 border-lime-400/70 bg-lime-950/85 text-[11px] font-bold text-lime-200 md:h-[4.25rem] md:w-[4.25rem] md:text-xs"
                  />
                  <TouchActionButton
                    label="Salto"
                    subLabel="Mantén"
                    onPressStart={() => onTouchJump(true, true)}
                    onPressEnd={() => onTouchJump(false, false)}
                    className="h-[4.4rem] w-[4.4rem] border-lime-300/80 bg-lime-600/90 text-xs font-extrabold text-white md:h-20 md:w-20 md:text-sm"
                  />
                </div>
              </div>
            ) : hud.hasSpiderSuit ? (
              <div className="flex flex-col items-end gap-2">
                <div className="flex items-center gap-2 sm:gap-2.5">
                  {hud.isSwinging && (
                    <TouchActionButton
                      label="Soltar"
                      subLabel="Red"
                      onPressStart={onTouchReleaseWeb}
                      className="h-14 w-14 border-amber-400/70 bg-amber-950/85 text-[11px] font-bold text-amber-200 md:h-16 md:w-16 md:text-xs"
                    />
                  )}
                  <TouchActionButton
                    label="Girar"
                    onPressStart={onTouchSpin}
                    repeatMs={360}
                    className="h-14 w-14 border-sky-400/60 bg-sky-950/85 text-[11px] font-bold text-sky-200 md:h-16 md:w-16 md:text-xs"
                  />
                </div>
                <div className="flex items-end gap-2.5 sm:gap-3">
                  <TouchActionButton
                    label="Telaraña"
                    onPressStart={onTouchWeb}
                    className="h-15 w-15 border-rose-400/75 bg-rose-950/85 text-[11px] font-bold text-rose-200 md:h-[4.25rem] md:w-[4.25rem] md:text-xs"
                  />
                  <TouchActionButton
                    label="Saltar"
                    subLabel="Planear"
                    onPressStart={() => onTouchJump(true, true)}
                    onPressEnd={() => onTouchJump(false, false)}
                    className="h-[4.4rem] w-[4.4rem] border-sky-300/80 bg-sky-600/90 text-xs font-extrabold text-white md:h-20 md:w-20 md:text-sm"
                  />
                </div>
              </div>
            ) : (
              <div className="flex items-end gap-2.5 sm:gap-3">
                {hud.hasBow && (
                  <TouchActionButton
                    label="Arco"
                    onPressStart={onTouchBow}
                    repeatMs={320}
                    className="h-14 w-14 border-amber-400/70 bg-amber-950/85 text-xs font-bold text-amber-200 md:h-16 md:w-16 md:text-sm"
                  />
                )}
                {hud.perspectiveMode !== 'COHETE' &&
                  hud.perspectiveMode !== 'ALA DELTA' &&
                  hud.perspectiveMode !== 'BARCO' && (
                    <TouchActionButton
                      label="Girar"
                      onPressStart={onTouchSpin}
                      repeatMs={360}
                      className="h-14 w-14 border-sky-400/65 bg-sky-950/85 text-xs font-bold text-sky-200 md:h-16 md:w-16 md:text-sm"
                    />
                  )}
                <TouchActionButton
                  label={
                    hud.perspectiveMode === 'COHETE'
                      ? 'Turbo'
                      : hud.perspectiveMode === 'ALA DELTA'
                        ? 'Térmica'
                        : hud.perspectiveMode === 'BARCO'
                          ? 'Saltar'
                          : 'Saltar'
                  }
                  subLabel={
                    hud.perspectiveMode === 'COHETE' ||
                    hud.perspectiveMode === 'ALA DELTA' ||
                    hud.perspectiveMode === 'BARCO'
                      ? undefined
                      : 'Planear'
                  }
                  onPressStart={() => onTouchJump(true, true)}
                  onPressEnd={() => onTouchJump(false, false)}
                  className="h-[4.4rem] w-[4.4rem] border-sky-300/80 bg-sky-600/90 text-xs font-extrabold text-white md:h-20 md:w-20 md:text-sm"
                />
              </div>
            )}
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
