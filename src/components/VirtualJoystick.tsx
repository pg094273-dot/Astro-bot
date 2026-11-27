import React, { useCallback, useEffect, useRef, useState } from 'react';

interface VirtualJoystickProps {
  onMove: (x: number, z: number) => void;
  accentColor?: string;
  accentRgb?: string;
  disabled?: boolean;
}

const DEAD_ZONE = 0.14;

export const VirtualJoystick: React.FC<VirtualJoystickProps> = ({
  onMove,
  accentColor = '#38bdf8',
  accentRgb = '56, 189, 248',
  disabled = false,
}) => {
  const baseRef = useRef<HTMLDivElement | null>(null);
  const activePointerIdRef = useRef<number | null>(null);
  const centerRef = useRef<{ x: number; y: number; maxRadius: number }>({
    x: 0,
    y: 0,
    maxRadius: 46,
  });

  const [active, setActive] = useState(false);
  const [knobOffset, setKnobOffset] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [normVec, setNormVec] = useState<{ x: number; y: number; mag: number }>({
    x: 0,
    y: 0,
    mag: 0,
  });

  const resetStick = useCallback(() => {
    activePointerIdRef.current = null;
    setActive(false);
    setKnobOffset({ x: 0, y: 0 });
    setNormVec({ x: 0, y: 0, mag: 0 });
    onMove(0, 0);
  }, [onMove]);

  useEffect(() => {
    if (disabled) {
      resetStick();
    }
  }, [disabled, resetStick]);

  useEffect(() => {
    const handleBlur = () => {
      if (activePointerIdRef.current !== null) {
        resetStick();
      }
    };
    window.addEventListener('blur', handleBlur);
    return () => {
      window.removeEventListener('blur', handleBlur);
      if (activePointerIdRef.current !== null) {
        onMove(0, 0);
      }
    };
  }, [onMove, resetStick]);

  const updateFromClientCoords = useCallback(
    (clientX: number, clientY: number) => {
      const { x: cx, y: cy, maxRadius } = centerRef.current;
      const dx = clientX - cx;
      const dy = clientY - cy;
      const dist = Math.hypot(dx, dy);

      const clampedDist = Math.min(dist, maxRadius);
      const nx = dist > 1e-4 ? dx / dist : 0;
      const ny = dist > 1e-4 ? dy / dist : 0;

      setKnobOffset({
        x: nx * clampedDist,
        y: ny * clampedDist,
      });

      const rawRatio = maxRadius > 0 ? clampedDist / maxRadius : 0;
      if (rawRatio <= DEAD_ZONE) {
        setNormVec({ x: 0, y: 0, mag: 0 });
        onMove(0, 0);
        return;
      }

      const scaled = (rawRatio - DEAD_ZONE) / (1 - DEAD_ZONE);
      // Smooth analog ramp: slow walk near center (0.14), full run at outer rim (1.0)
      const analogMag = Math.min(1, 0.14 + scaled * 0.86);
      setNormVec({ x: nx, y: ny, mag: analogMag });
      onMove(nx * analogMag, ny * analogMag);
    },
    [onMove]
  );

  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if (disabled) return;
    e.preventDefault();
    e.stopPropagation();

    if (activePointerIdRef.current !== null) return;
    const el = baseRef.current;
    if (!el) return;

    const rect = el.getBoundingClientRect();
    const maxRadius = Math.max(32, rect.width * 0.34);
    centerRef.current = {
      x: rect.left + rect.width / 2,
      y: rect.top + rect.height / 2,
      maxRadius,
    };

    activePointerIdRef.current = e.pointerId;
    setActive(true);
    try {
      el.setPointerCapture(e.pointerId);
    } catch {
      // Ignore environments where pointer capture is unavailable
    }
    updateFromClientCoords(e.clientX, e.clientY);
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (activePointerIdRef.current !== e.pointerId) return;
    e.preventDefault();
    e.stopPropagation();
    updateFromClientCoords(e.clientX, e.clientY);
  };

  const handlePointerEnd = (e: React.PointerEvent<HTMLDivElement>) => {
    if (activePointerIdRef.current !== e.pointerId) return;
    e.preventDefault();
    e.stopPropagation();
    try {
      if (e.currentTarget.hasPointerCapture(e.pointerId)) {
        e.currentTarget.releasePointerCapture(e.pointerId);
      }
    } catch {
      // Ignore release errors
    }
    resetStick();
  };

  const angleDeg = (Math.atan2(normVec.y, normVec.x) * 180) / Math.PI + 90;
  const showDirection = active && normVec.mag > 0;

  return (
    <div
      ref={baseRef}
      role="slider"
      aria-label="Joystick virtual de movimiento"
      aria-valuetext={
        normVec.mag > 0 ? `Intensidad ${Math.round(normVec.mag * 100)}%` : 'En reposo'
      }
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerEnd}
      onPointerCancel={handlePointerEnd}
      onLostPointerCapture={handlePointerEnd}
      onContextMenu={(e) => e.preventDefault()}
      style={{
        touchAction: 'none',
        borderColor: active ? `rgba(${accentRgb}, 0.72)` : 'rgba(255, 255, 255, 0.22)',
        boxShadow: active
          ? `0 0 28px rgba(${accentRgb}, 0.32), inset 0 0 22px rgba(${accentRgb}, 0.14)`
          : '0 8px 24px rgba(2, 6, 23, 0.45), inset 0 1px 0 rgba(255, 255, 255, 0.08)',
      }}
      className="pointer-events-auto relative flex h-32 w-32 select-none items-center justify-center rounded-full border-2 bg-[#070d1d]/45 transition-[border-color,box-shadow] duration-150 sm:h-36 sm:w-36 md:h-40 md:w-40"
    >
      {/* Subtle controller inner ring & cardinal guide ticks */}
      <div
        className="pointer-events-none absolute inset-3 rounded-full border border-white/10"
        style={{
          background: active
            ? `radial-gradient(circle at center, rgba(${accentRgb}, 0.14) 0%, rgba(7, 13, 29, 0.08) 70%, transparent 100%)`
            : 'radial-gradient(circle at center, rgba(255, 255, 255, 0.05) 0%, transparent 72%)',
        }}
      />

      {/* Cardinal guide dots */}
      <span className="pointer-events-none absolute top-2.5 h-1.5 w-1.5 rounded-full bg-white/30" />
      <span className="pointer-events-none absolute bottom-2.5 h-1.5 w-1.5 rounded-full bg-white/30" />
      <span className="pointer-events-none absolute left-2.5 h-1.5 w-1.5 rounded-full bg-white/30" />
      <span className="pointer-events-none absolute right-2.5 h-1.5 w-1.5 rounded-full bg-white/30" />

      {/* Dead-zone reference circle */}
      <div className="pointer-events-none absolute h-7 w-7 rounded-full border border-dashed border-white/15" />

      {/* Rotating directional arc & chevron indicator */}
      <div
        className="pointer-events-none absolute inset-0 transition-opacity duration-100"
        style={{
          opacity: showDirection ? Math.min(1, 0.35 + normVec.mag * 0.65) : 0,
          transform: `rotate(${angleDeg}deg)`,
        }}
      >
        <svg viewBox="0 0 100 100" className="h-full w-full">
          <path
            d="M 32 10 A 42 42 0 0 1 68 10"
            fill="none"
            stroke={accentColor}
            strokeWidth="3.5"
            strokeLinecap="round"
          />
          <polygon points="50,2 44,10 56,10" fill={accentColor} />
        </svg>
      </div>

      {/* Movable thumbstick knob */}
      <div
        className="pointer-events-none relative flex h-14 w-14 items-center justify-center rounded-full border-2 shadow-xl sm:h-16 sm:w-16"
        style={{
          transform: `translate3d(${knobOffset.x}px, ${knobOffset.y}px, 0) scale(${active ? 1.06 : 1})`,
          transition: active ? 'none' : 'transform 140ms cubic-bezier(0.16, 1, 0.3, 1)',
          borderColor: active ? accentColor : 'rgba(226, 232, 240, 0.45)',
          background:
            'radial-gradient(circle at 35% 30%, rgba(51, 65, 85, 0.94), rgba(15, 23, 42, 0.94) 68%, rgba(2, 6, 23, 0.98) 100%)',
          boxShadow: active
            ? `0 6px 18px rgba(0, 0, 0, 0.55), 0 0 14px rgba(${accentRgb}, 0.5)`
            : '0 6px 14px rgba(0, 0, 0, 0.5)',
        }}
      >
        {/* Pro-controller concentric thumb grip ring */}
        <div
          className="h-7 w-7 rounded-full border sm:h-8 sm:w-8"
          style={{
            borderColor: active ? `rgba(${accentRgb}, 0.75)` : 'rgba(148, 163, 184, 0.35)',
            background:
              'radial-gradient(circle at 40% 35%, rgba(30, 41, 59, 0.9), rgba(9, 13, 26, 0.95))',
          }}
        />
      </div>
    </div>
  );
};
