import React, { useState, useEffect } from 'react';
import { Download, X, Smartphone, Apple, Share, PlusSquare, Sparkles, CheckCircle2 } from 'lucide-react';

export const InstallAppBanner: React.FC = () => {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isVisible, setIsVisible] = useState<boolean>(true);
  const [showInstructionsModal, setShowInstructionsModal] = useState<boolean>(false);
  const [isIOS, setIsIOS] = useState<boolean>(false);
  const [isStandalone, setIsStandalone] = useState<boolean>(false);

  useEffect(() => {
    // Check if already in standalone PWA mode
    if (
      window.matchMedia('(display-mode: standalone)').matches ||
      (window.navigator as any).standalone === true
    ) {
      setIsStandalone(true);
      setIsVisible(false);
      return;
    }

    // Detect iOS
    const userAgent = window.navigator.userAgent.toLowerCase();
    const isIosDevice = /iphone|ipad|ipod/.test(userAgent);
    setIsIOS(isIosDevice);

    // Listen for beforeinstallprompt event (Android / Chromium)
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setIsVisible(true);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  const handleInstallClick = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === 'accepted') {
        setIsVisible(false);
      }
      setDeferredPrompt(null);
    } else {
      setShowInstructionsModal(true);
    }
  };

  if (!isVisible || isStandalone) return null;

  return (
    <>
      {/* Floating In-App Install App Banner */}
      <div className="mx-4 mb-2.5 p-3 rounded-2xl bg-gradient-to-r from-slate-900 via-zinc-900 to-rose-950 border border-zinc-800 text-white shadow-lg flex items-center justify-between gap-3 animate-in slide-in-from-bottom-2 duration-200">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-rose-600 to-red-500 text-white flex items-center justify-center font-black text-lg shadow-md shadow-rose-600/30 flex-shrink-0">
            Z
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-1.5">
              <span className="text-xs font-black tracking-tight text-white truncate">
                Install Zomato Hyderabad
              </span>
              <span className="text-[9px] bg-rose-500/20 text-rose-300 font-extrabold px-1.5 py-0.2 rounded border border-rose-500/30">
                PWA
              </span>
            </div>
            <p className="text-[10px] text-zinc-400 truncate mt-0.5">
              Offline menus & 1-tap mobile ordering
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1.5 flex-shrink-0">
          <button
            onClick={handleInstallClick}
            className="px-3 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-[11px] font-extrabold flex items-center gap-1 shadow-md shadow-rose-600/20 active:scale-95 transition-all"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Install</span>
          </button>

          <button
            onClick={() => setIsVisible(false)}
            className="p-1 rounded-full text-zinc-400 hover:text-white"
            title="Dismiss"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* PWA Installation Instructions Modal (Android & iOS) */}
      {showInstructionsModal && (
        <div className="absolute inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-end justify-center animate-in fade-in duration-150">
          <div className="bg-white w-full rounded-t-3xl p-5 shadow-2xl animate-in slide-in-from-bottom-4 duration-200">
            <div className="flex items-center justify-between pb-3 border-b border-zinc-100">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-rose-600 text-white flex items-center justify-center font-black text-sm">
                  Z
                </div>
                <div>
                  <h4 className="font-extrabold text-sm text-slate-900">
                    Install App on Home Screen
                  </h4>
                  <p className="text-[10px] text-slate-500">
                    Zomato Hyderabad PWA
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowInstructionsModal(false)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-full"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Instruction Tabs for Android & iOS */}
            <div className="mt-4 space-y-4">
              {/* iOS Guide */}
              <div className="p-3.5 rounded-2xl bg-zinc-50 border border-zinc-200/80">
                <div className="flex items-center gap-1.5 text-xs font-black text-slate-900 mb-2">
                  <Apple className="w-4 h-4 text-slate-800" />
                  <span>iPhone / iPad (Safari)</span>
                </div>
                <ol className="space-y-2 text-[11px] text-slate-600 font-medium">
                  <li className="flex items-start gap-2">
                    <span className="w-4 h-4 rounded-full bg-rose-100 text-rose-700 font-bold flex items-center justify-center text-[10px] flex-shrink-0 mt-0.5">
                      1
                    </span>
                    <span>
                      Tap the <strong className="text-slate-900">Share</strong> icon (square with arrow up <Share className="w-3 h-3 inline mx-0.5 text-slate-700" />) at the bottom of Safari.
                    </span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="w-4 h-4 rounded-full bg-rose-100 text-rose-700 font-bold flex items-center justify-center text-[10px] flex-shrink-0 mt-0.5">
                      2
                    </span>
                    <span>
                      Scroll down and tap <strong className="text-slate-900">Add to Home Screen</strong> (<PlusSquare className="w-3 h-3 inline mx-0.5 text-slate-700" />).
                    </span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="w-4 h-4 rounded-full bg-rose-100 text-rose-700 font-bold flex items-center justify-center text-[10px] flex-shrink-0 mt-0.5">
                      3
                    </span>
                    <span>
                      Tap <strong className="text-rose-600">Add</strong> in the top-right corner.
                    </span>
                  </li>
                </ol>
              </div>

              {/* Android Guide */}
              <div className="p-3.5 rounded-2xl bg-zinc-50 border border-zinc-200/80">
                <div className="flex items-center gap-1.5 text-xs font-black text-slate-900 mb-2">
                  <Smartphone className="w-4 h-4 text-emerald-600" />
                  <span>Android (Chrome / Edge)</span>
                </div>
                <ol className="space-y-2 text-[11px] text-slate-600 font-medium">
                  <li className="flex items-start gap-2">
                    <span className="w-4 h-4 rounded-full bg-emerald-100 text-emerald-700 font-bold flex items-center justify-center text-[10px] flex-shrink-0 mt-0.5">
                      1
                    </span>
                    <span>
                      Tap the <strong className="text-slate-900">three dots (⋮)</strong> menu in Chrome.
                    </span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="w-4 h-4 rounded-full bg-emerald-100 text-emerald-700 font-bold flex items-center justify-center text-[10px] flex-shrink-0 mt-0.5">
                      2
                    </span>
                    <span>
                      Select <strong className="text-slate-900">"Install App"</strong> or <strong className="text-slate-900">"Add to Home Screen"</strong>.
                    </span>
                  </li>
                </ol>
              </div>

              <button
                onClick={() => setShowInstructionsModal(false)}
                className="w-full py-2.5 rounded-xl bg-slate-900 text-white text-xs font-bold hover:bg-slate-800 transition-colors"
              >
                Got it!
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
