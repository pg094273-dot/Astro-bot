import React from 'react';
import { BiomeKind } from '../game/types';

interface LevelThumbnailProps {
  biome: BiomeKind;
  levelNumber: number;
}

export const LevelThumbnail: React.FC<LevelThumbnailProps> = ({ biome, levelNumber }) => {
  switch (biome) {
    case 'jungle':
      return (
        <svg viewBox="0 0 160 88" className="h-full w-full" aria-hidden="true">
          <defs>
            <linearGradient id={`bg-${levelNumber}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#165a9e" />
              <stop offset="100%" stopColor="#4ade80" />
            </linearGradient>
          </defs>
          <rect width="160" height="88" fill={`url(#bg-${levelNumber})`} />
          <circle cx="128" cy="22" r="11" fill="#fde047" opacity="0.9" />
          <path d="M0 68 Q40 44 82 64 T160 58 L160 88 L0 88 Z" fill="#14532d" />
          <path d="M0 75 Q45 58 95 72 T160 70 L160 88 L0 88 Z" fill="#166534" />
          <rect x="64" y="42" width="32" height="28" rx="2" fill="#57534e" />
          <rect x="70" y="34" width="20" height="10" rx="1" fill="#78716c" />
          <rect x="76" y="52" width="8" height="18" fill="#0f172a" />
          <circle cx="24" cy="48" r="16" fill="#22c55e" />
          <circle cx="136" cy="50" r="14" fill="#15803d" />
        </svg>
      );
    case 'desert':
      return (
        <svg viewBox="0 0 160 88" className="h-full w-full" aria-hidden="true">
          <defs>
            <linearGradient id={`bg-${levelNumber}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#1e3a8a" />
              <stop offset="100%" stopColor="#f59e0b" />
            </linearGradient>
          </defs>
          <rect width="160" height="88" fill={`url(#bg-${levelNumber})`} />
          <circle cx="34" cy="26" r="12" fill="#fef08a" />
          <polygon points="82,22 126,70 38,70" fill="#d97706" />
          <polygon points="82,22 126,70 82,70" fill="#b45309" />
          <path d="M0 66 Q45 50 90 66 T160 62 L160 88 L0 88 Z" fill="#f59e0b" />
          <path d="M0 76 Q60 66 115 76 T160 74 L160 88 L0 88 Z" fill="#b45309" />
          <ellipse cx="132" cy="78" rx="18" ry="5" fill="#0ea5e9" opacity="0.85" />
        </svg>
      );
    case 'ice':
      return (
        <svg viewBox="0 0 160 88" className="h-full w-full" aria-hidden="true">
          <defs>
            <linearGradient id={`bg-${levelNumber}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#09152b" />
              <stop offset="100%" stopColor="#0ea5e9" />
            </linearGradient>
          </defs>
          <rect width="160" height="88" fill={`url(#bg-${levelNumber})`} />
          <path d="M8 28 Q50 8 92 26 T156 16" fill="none" stroke="#34d399" strokeWidth="7" opacity="0.55" strokeLinecap="round" />
          <path d="M16 20 Q62 34 112 16" fill="none" stroke="#67e8f9" strokeWidth="4" opacity="0.55" strokeLinecap="round" />
          <polygon points="20,76 54,30 88,76" fill="#bae6fd" />
          <polygon points="70,76 112,22 148,76" fill="#7dd3fc" />
          <polygon points="112,22 148,76 112,76" fill="#0284c7" />
          <rect x="0" y="72" width="160" height="16" fill="#e0f2fe" />
        </svg>
      );
    case 'temple':
      return (
        <svg viewBox="0 0 160 88" className="h-full w-full" aria-hidden="true">
          <defs>
            <linearGradient id={`bg-${levelNumber}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#0f4c5c" />
              <stop offset="100%" stopColor="#10b981" />
            </linearGradient>
          </defs>
          <rect width="160" height="88" fill={`url(#bg-${levelNumber})`} />
          <polygon points="80,18 122,74 38,74" fill="#78716c" />
          <rect x="52" y="42" width="56" height="10" fill="#a8a29e" />
          <rect x="64" y="28" width="32" height="12" fill="#d6d3d1" />
          <rect x="74" y="54" width="12" height="22" fill="#38bdf8" opacity="0.85" />
          <path d="M0 72 L160 72 L160 88 L0 88 Z" fill="#065f46" />
          <circle cx="22" cy="56" r="16" fill="#15803d" />
          <circle cx="138" cy="56" r="16" fill="#15803d" />
        </svg>
      );
    case 'volcanic':
      return (
        <svg viewBox="0 0 160 88" className="h-full w-full" aria-hidden="true">
          <defs>
            <linearGradient id={`bg-${levelNumber}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#1c0a0d" />
              <stop offset="100%" stopColor="#991b1b" />
            </linearGradient>
          </defs>
          <rect width="160" height="88" fill={`url(#bg-${levelNumber})`} />
          <polygon points="36,76 74,22 92,22 130,76" fill="#292524" />
          <path d="M76 22 Q82 46 68 74 L92 74 Q86 44 86 22 Z" fill="#f97316" />
          <circle cx="83" cy="14" r="6" fill="#fb923c" opacity="0.7" />
          <rect x="0" y="72" width="160" height="16" fill="#ea580c" />
          <rect x="0" y="77" width="160" height="6" fill="#facc15" opacity="0.65" />
        </svg>
      );
    case 'nebula':
      return (
        <svg viewBox="0 0 160 88" className="h-full w-full" aria-hidden="true">
          <defs>
            <linearGradient id={`bg-${levelNumber}`} x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor="#090721" />
              <stop offset="55%" stopColor="#3b0764" />
              <stop offset="100%" stopColor="#0e7490" />
            </linearGradient>
          </defs>
          <rect width="160" height="88" fill={`url(#bg-${levelNumber})`} />
          <circle cx="34" cy="24" r="12" fill="#a855f7" opacity="0.75" />
          <ellipse cx="34" cy="24" rx="22" ry="5" fill="none" stroke="#e879f9" strokeWidth="2" transform="rotate(-16 34 24)" />
          <circle cx="128" cy="22" r="2" fill="#ffffff" />
          <circle cx="106" cy="16" r="1.5" fill="#bae6fd" />
          <circle cx="72" cy="14" r="1.5" fill="#fde047" />
          <polygon points="54,58 106,58 96,72 64,72" fill="#1e1b4b" stroke="#22d3ee" strokeWidth="1.5" />
          <rect x="74" y="28" width="12" height="30" rx="2" fill="#312e81" stroke="#38bdf8" strokeWidth="1.5" />
          <circle cx="80" cy="24" r="6" fill="#22d3ee" />
        </svg>
      );
    case 'paris':
      return (
        <svg viewBox="0 0 160 88" className="h-full w-full" aria-hidden="true">
          <defs>
            <linearGradient id={`bg-${levelNumber}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#1e293b" />
              <stop offset="55%" stopColor="#f97316" />
              <stop offset="100%" stopColor="#fde047" />
            </linearGradient>
          </defs>
          <rect width="160" height="88" fill={`url(#bg-${levelNumber})`} />
          <circle cx="122" cy="38" r="13" fill="#fef08a" opacity="0.85" />
          <polygon points="80,10 92,72 68,72" fill="#334155" />
          <polygon points="73,54 87,54 90,72 70,72" fill="#1e293b" />
          <rect x="69" y="42" width="22" height="4" fill="#fbbf24" />
          <rect x="0" y="70" width="160" height="18" fill="#0f172a" />
          <polygon points="22,26 42,32 28,38" fill="#38bdf8" />
        </svg>
      );
    case 'rapids':
      return (
        <svg viewBox="0 0 160 88" className="h-full w-full" aria-hidden="true">
          <defs>
            <linearGradient id={`bg-${levelNumber}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#0284c7" />
              <stop offset="100%" stopColor="#065f46" />
            </linearGradient>
          </defs>
          <rect width="160" height="88" fill={`url(#bg-${levelNumber})`} />
          <polygon points="0,34 46,42 36,88 0,88" fill="#14532d" />
          <polygon points="160,30 114,42 124,88 160,88" fill="#166534" />
          <path d="M52 38 Q78 58 66 88 L108 88 Q98 58 112 38 Z" fill="#0ea5e9" />
          <path d="M68 52 Q84 62 76 74" fill="none" stroke="#e0f2fe" strokeWidth="3" strokeLinecap="round" />
          <polygon points="74,64 90,64 86,73 78,73" fill="#f97316" />
        </svg>
      );
    case 'newyork':
      return (
        <svg viewBox="0 0 160 88" className="h-full w-full" aria-hidden="true">
          <defs>
            <linearGradient id={`bg-${levelNumber}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#0f172a" />
              <stop offset="100%" stopColor="#be123c" />
            </linearGradient>
          </defs>
          <rect width="160" height="88" fill={`url(#bg-${levelNumber})`} />
          <rect x="14" y="34" width="22" height="54" fill="#1e293b" />
          <rect x="44" y="18" width="26" height="70" fill="#0f172a" />
          <rect x="78" y="28" width="24" height="60" fill="#1e293b" />
          <rect x="110" y="14" width="28" height="74" fill="#0f172a" />
          <rect x="122" y="4" width="3" height="12" fill="#f43f5e" />
          <path d="M58 24 Q88 52 122 22" fill="none" stroke="#f8fafc" strokeWidth="2" strokeDasharray="3 2" />
          <circle cx="88" cy="40" r="5" fill="#ef4444" stroke="#1d4ed8" strokeWidth="2" />
        </svg>
      );
    case 'gammacity':
    default:
      return (
        <svg viewBox="0 0 160 88" className="h-full w-full" aria-hidden="true">
          <defs>
            <linearGradient id={`bg-${levelNumber}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#0a1612" />
              <stop offset="100%" stopColor="#365314" />
            </linearGradient>
          </defs>
          <rect width="160" height="88" fill={`url(#bg-${levelNumber})`} />
          <rect x="12" y="34" width="26" height="54" fill="#1f2937" />
          <rect x="46" y="22" width="30" height="66" fill="#111827" />
          <rect x="116" y="26" width="28" height="62" fill="#1f2937" />
          <rect x="54" y="32" width="6" height="6" fill="#84cc16" />
          <rect x="64" y="42" width="6" height="6" fill="#84cc16" />
          <ellipse cx="82" cy="74" rx="34" ry="8" fill="none" stroke="#a3e635" strokeWidth="2.5" />
          <circle cx="82" cy="64" r="10" fill="#65a30d" stroke="#bef264" strokeWidth="2" />
        </svg>
      );
  }
};
