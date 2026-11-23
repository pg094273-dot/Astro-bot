import React, { useState } from 'react';
import { Download, PlusSquare, Share, Smartphone, WifiOff } from 'lucide-react';
import { useOnlineStatus, usePWAInstall } from '../hooks/usePWAInstall';

export const PWAInstallButton: React.FC = () => {
  const { isInstallable, isInstalled, isIOS, install } = usePWAInstall();
  const [showIOSGuide, setShowIOSGuide] = useState(false);
  const isNativeAndroid = Boolean(
    (window as unknown as { Capacitor?: { isNativePlatform?: () => boolean } }).Capacitor?.isNativePlatform?.()
  );

  if (isInstalled || isNativeAndroid) {
    return null;
  }

  if (isInstallable) {
    return (
      <button
        type="button"
        onClick={install}
        className="flex items-center justify-center gap-2 rounded-xl border border-sky-400/40 bg-sky-950/85 px-4 py-2.5 font-display text-xs font-bold text-sky-200 transition-colors hover:bg-sky-900 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-300"
      >
        <Download className="h-4 w-4" />
        Instalar App
      </button>
    );
  }

  // Always offer iOS / Safari Home Screen guide on iOS (and fallback desktop instructions on Safari/non-Chromium)
  return (
    <>
      <button
        type="button"
        onClick={() => setShowIOSGuide(true)}
        className="flex items-center justify-center gap-2 rounded-xl border border-sky-400/35 bg-[#0a1630]/90 px-4 py-2.5 font-display text-xs font-bold text-sky-200 transition-colors hover:border-sky-400/70 hover:bg-sky-950 hover:text-white"
      >
        <Smartphone className="h-4 w-4 text-sky-400" />
        {isIOS ? 'Instalar en iPhone' : 'Instalar en iOS'}
      </button>

      {showIOSGuide && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#040814]/85 p-4">
          <div className="w-full max-w-sm rounded-2xl border border-sky-400/30 bg-[#091124] p-6 text-white shadow-2xl">
            <div className="flex items-center gap-3">
              <img
                src="./apple-touch-icon.png"
                alt="Icono de Astro Nova"
                className="h-12 w-12 rounded-xl border border-white/15"
              />
              <div>
                <h3 className="font-display text-lg font-bold text-white">
                  Instalar Astro Nova en iPhone
                </h3>
                <p className="text-xs text-sky-300">
                  Sin Xcode, sin cables y sin cuenta de desarrollador
                </p>
              </div>
            </div>

            <ol className="mt-4 space-y-3 text-sm text-slate-200">
              <li className="flex items-start gap-2.5">
                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-sky-500/20 font-mono-num text-xs font-bold text-sky-300">
                  1
                </span>
                <span>
                  Abre la URL del juego en <strong>Safari</strong> desde tu iPhone o iPad.
                </span>
              </li>
              <li className="flex items-start gap-2.5">
                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-sky-500/20 font-mono-num text-xs font-bold text-sky-300">
                  2
                </span>
                <span className="flex flex-wrap items-center gap-1">
                  Pulsa el icono <strong>Compartir</strong>
                  <Share className="inline h-4 w-4 text-sky-400" />
                  en la barra inferior de Safari.
                </span>
              </li>
              <li className="flex items-start gap-2.5">
                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-sky-500/20 font-mono-num text-xs font-bold text-sky-300">
                  3
                </span>
                <span className="flex flex-wrap items-center gap-1">
                  Desliza y toca <strong>Añadir a pantalla de inicio</strong>
                  <PlusSquare className="inline h-4 w-4 text-sky-400" />.
                </span>
              </li>
            </ol>

            <p className="mt-4 rounded-xl border border-white/10 bg-slate-900/80 px-3 py-2 text-xs text-slate-300">
              Se abrirá a pantalla completa con icono propio, controles táctiles y funcionamiento sin conexión.
            </p>

            <button
              type="button"
              onClick={() => setShowIOSGuide(false)}
              className="mt-4 w-full rounded-xl bg-sky-500 py-2.5 font-display text-sm font-bold text-slate-950 transition-colors hover:bg-sky-400"
            >
              Entendido
            </button>
          </div>
        </div>
      )}
    </>
  );
};

export const OfflineIndicator: React.FC = () => {
  const isOnline = useOnlineStatus();

  if (isOnline) return null;

  return (
    <div className="pointer-events-none fixed bottom-4 left-4 z-40 flex items-center gap-2 rounded-lg border border-amber-400/40 bg-[#070d1d]/92 px-3 py-1.5 text-xs font-medium text-amber-200 shadow-lg">
      <WifiOff className="h-3.5 w-3.5 text-amber-400" />
      Modo sin conexión · Caché activa
    </div>
  );
};
