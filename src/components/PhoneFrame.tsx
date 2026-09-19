import React, { useState, useEffect } from 'react';
import { Smartphone, Monitor, Wifi, BatteryCharging, Signal, QrCode, X, Copy, Check, ExternalLink } from 'lucide-react';

interface PhoneFrameProps {
  children: React.ReactNode;
  isFullScreen: boolean;
  onToggleFullScreen: () => void;
}

export const PhoneFrame: React.FC<PhoneFrameProps> = ({
  children,
  isFullScreen,
  onToggleFullScreen,
}) => {
  const [currentTime, setCurrentTime] = useState<string>('12:06');
  const [isMobileScreen, setIsMobileScreen] = useState<boolean>(false);
  const [showQRModal, setShowQRModal] = useState<boolean>(false);
  const [copiedLink, setCopiedLink] = useState<boolean>(false);

  // Detect if user is viewing on a real physical mobile screen or standalone PWA
  useEffect(() => {
    const checkMobile = () => {
      const isMobile = window.innerWidth < 640 || window.matchMedia('(display-mode: standalone)').matches;
      setIsMobileScreen(isMobile);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  useEffect(() => {
    const updateClock = () => {
      const now = new Date();
      const hours = now.getHours();
      const minutes = now.getMinutes().toString().padStart(2, '0');
      setCurrentTime(`${hours}:${minutes}`);
    };
    updateClock();
    const interval = setInterval(updateClock, 10000);
    return () => clearInterval(interval);
  }, []);

  // IP address for local network mobile testing
  const mobileUrl = typeof window !== 'undefined' && window.location.hostname !== 'localhost'
    ? `${window.location.protocol}//${window.location.host}`
    : 'http://192.168.0.112:3000';

  const handleCopyLink = () => {
    navigator.clipboard.writeText(mobileUrl);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  // If accessed directly on an actual physical mobile device, render natively without outer phone frame
  if (isMobileScreen) {
    return (
      <div className="w-full h-screen h-dvh bg-white text-slate-900 flex flex-col overflow-hidden relative [transform:translateZ(0)]">
        {children}
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-zinc-900 to-stone-950 flex flex-col items-center justify-start text-slate-100 selection:bg-rose-500 selection:text-white relative">
      {/* Top Controls Bar */}
      <header className="w-full max-w-6xl px-4 py-3 flex items-center justify-between border-b border-zinc-800/80 backdrop-blur-md bg-zinc-950/70 z-50 sticky top-0">
        <div className="flex items-center gap-3">
          <div className="h-8 w-8 rounded-lg bg-rose-600 flex items-center justify-center font-black text-white text-lg tracking-tighter shadow-md shadow-rose-600/30">
            Z
          </div>
          <div>
            <h1 className="font-bold text-sm sm:text-base tracking-tight flex items-center gap-2">
              Zomato <span className="text-xs px-2 py-0.5 rounded-full bg-rose-500/20 text-rose-400 font-semibold border border-rose-500/30">Hyderabad 🇮🇳</span>
            </h1>
            <p className="text-[11px] text-zinc-400 hidden sm:block">
              Express + React 18 + Tailwind Mobile App
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 sm:gap-3">
          <div className="text-xs text-zinc-400 bg-zinc-900/90 border border-zinc-800 rounded-full px-3 py-1 hidden md:flex items-center gap-1.5 font-mono">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            Port 3000 Active
          </div>

          {/* Open on Phone QR Code Button (High-Visibility Emerald Pill) */}
          <button
            onClick={() => setShowQRModal(true)}
            className="flex items-center gap-1.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-xs font-bold px-3.5 py-1.5 rounded-full shadow-lg shadow-emerald-600/30 border border-emerald-400/40 active:scale-95 transition-all cursor-pointer"
            title="Scan QR Code to open on actual mobile device"
          >
            <QrCode className="w-3.5 h-3.5 text-white stroke-[2.5]" />
            <span>Open on Mobile</span>
          </button>

          <button
            onClick={onToggleFullScreen}
            aria-label="Toggle Phone Frame View"
            className="flex items-center gap-2 bg-gradient-to-r from-rose-600 to-red-600 hover:from-rose-500 hover:to-red-500 text-white text-xs font-semibold px-3.5 py-1.5 rounded-full shadow-lg shadow-rose-600/20 active:scale-95 transition-all cursor-pointer"
          >
            {isFullScreen ? (
              <>
                <Smartphone className="w-3.5 h-3.5" />
                <span>Switch to Phone Frame</span>
              </>
            ) : (
              <>
                <Monitor className="w-3.5 h-3.5" />
                <span>Full Screen View</span>
              </>
            )}
          </button>
        </div>
      </header>

      {/* QR Code / Share to Mobile Modal */}
      {showQRModal && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-150">
          <div className="bg-white text-slate-900 w-full max-w-sm rounded-3xl p-6 shadow-2xl relative animate-in zoom-in-95 duration-150">
            <button
              onClick={() => setShowQRModal(false)}
              className="absolute top-4 right-4 p-1 rounded-full text-slate-400 hover:text-slate-700 hover:bg-zinc-100"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-2 mb-4">
              <div className="w-8 h-8 rounded-xl bg-rose-600 text-white flex items-center justify-center font-black text-sm">
                Z
              </div>
              <div>
                <h3 className="text-sm font-extrabold text-slate-900">Show on Mobile Device</h3>
                <p className="text-[11px] text-slate-500">Scan to test authentic Hyderabad Zomato app</p>
              </div>
            </div>

            {/* QR Code Graphic */}
            <div className="bg-zinc-50 border border-zinc-200 rounded-2xl p-4 flex flex-col items-center justify-center shadow-inner">
              <img
                src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(mobileUrl)}&color=0f172a&bgcolor=f8fafc`}
                alt="QR Code for Mobile Testing"
                className="w-44 h-44 rounded-lg mix-blend-multiply"
              />
              <span className="text-[10px] text-slate-500 font-semibold mt-2">
                Point iPhone or Android Camera at code
              </span>
            </div>

            {/* URL Copy Bar */}
            <div className="mt-4 flex items-center gap-2 bg-zinc-100 border border-zinc-200 rounded-xl px-3 py-2">
              <span className="text-xs font-mono font-bold text-slate-700 truncate flex-1">
                {mobileUrl}
              </span>
              <button
                onClick={handleCopyLink}
                className="px-2.5 py-1 bg-white hover:bg-zinc-200 rounded-lg text-slate-700 text-xs font-bold flex items-center gap-1 border border-zinc-200 shadow-xs transition-colors flex-shrink-0"
              >
                {copiedLink ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-600" />
                    <span className="text-emerald-700">Copied</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" />
                    <span>Copy</span>
                  </>
                )}
              </button>
            </div>

            {/* 3 Quick Steps */}
            <div className="mt-4 space-y-2 text-xs text-slate-600">
              <div className="flex items-start gap-2">
                <span className="w-4 h-4 rounded-full bg-rose-100 text-rose-700 text-[10px] font-extrabold flex items-center justify-center mt-0.5">1</span>
                <span>Connect your phone to the <strong>same Wi-Fi</strong> network.</span>
              </div>
              <div className="flex items-start gap-2">
                <span className="w-4 h-4 rounded-full bg-rose-100 text-rose-700 text-[10px] font-extrabold flex items-center justify-center mt-0.5">2</span>
                <span>Scan the QR code or open <strong>{mobileUrl}</strong> in Safari / Chrome.</span>
              </div>
              <div className="flex items-start gap-2">
                <span className="w-4 h-4 rounded-full bg-rose-100 text-rose-700 text-[10px] font-extrabold flex items-center justify-center mt-0.5">3</span>
                <span>Tap <strong>"Install App"</strong> to experience it as a native full-screen app!</span>
              </div>
            </div>

            <button
              onClick={() => setShowQRModal(false)}
              className="mt-5 w-full py-2.5 rounded-xl bg-slate-900 text-white font-bold text-xs hover:bg-slate-800 transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      )}

      {/* Main Container */}
      <main className="flex-1 w-full flex items-center justify-center p-0 sm:p-4 md:p-6 overflow-hidden">
        {isFullScreen ? (
          // Fullscreen Responsive Container
          <div className="w-full max-w-md h-[92vh] sm:h-[88vh] bg-white text-slate-900 rounded-none sm:rounded-2xl shadow-2xl overflow-hidden flex flex-col relative border border-zinc-800/40 [transform:translateZ(0)]">
            {children}
          </div>
        ) : (
          // Realistic Phone Frame View
          <div className="relative my-auto select-none [transform:translateZ(0)]">
            {/* Phone Outer Edge & Buttons */}
            <div className="relative w-[390px] h-[830px] bg-zinc-900 rounded-[52px] p-3 shadow-phone border-[4px] border-zinc-700/60 ring-1 ring-white/20">
              
              {/* Left Side Volume Buttons */}
              <div className="absolute -left-[7px] top-[125px] w-[3.5px] h-[26px] bg-zinc-600 rounded-l-sm"></div>
              <div className="absolute -left-[7px] top-[165px] w-[3.5px] h-[46px] bg-zinc-600 rounded-l-sm"></div>
              <div className="absolute -left-[7px] top-[225px] w-[3.5px] h-[46px] bg-zinc-600 rounded-l-sm"></div>

              {/* Right Side Power Button */}
              <div className="absolute -right-[7px] top-[175px] w-[3.5px] h-[65px] bg-zinc-600 rounded-r-sm"></div>

              {/* Phone Inner Screen Glass */}
              <div className="w-full h-full bg-white text-slate-900 rounded-[44px] overflow-hidden flex flex-col relative shadow-inner [transform:translateZ(0)]">
                
                {/* Mobile Status Bar */}
                <div className="h-10 bg-white/95 backdrop-blur-md z-40 flex items-center justify-between px-6 pt-1 select-none border-b border-zinc-100">
                  {/* Digital Clock */}
                  <span className="text-[13px] font-semibold text-slate-900 tracking-tight font-sans">
                    {currentTime}
                  </span>

                  {/* Dynamic Island / Pill Notch */}
                  <div className="absolute left-1/2 -translate-x-1/2 top-2.5 w-24 h-5 bg-black rounded-full flex items-center justify-end px-2.5 gap-1.5 shadow-sm">
                    <div className="w-2.5 h-2.5 rounded-full bg-zinc-900 border border-zinc-700 flex items-center justify-center">
                      <div className="w-1 h-1 rounded-full bg-blue-900/60"></div>
                    </div>
                  </div>

                  {/* Status Icons: 5G, Wi-Fi, Battery */}
                  <div className="flex items-center gap-1.5 text-slate-900">
                    <span className="text-[10px] font-bold text-slate-800">5G</span>
                    <Signal className="w-3.5 h-3.5 text-slate-800 stroke-[2.5]" />
                    <Wifi className="w-3.5 h-3.5 text-slate-800 stroke-[2.5]" />
                    <div className="flex items-center gap-0.5">
                      <span className="text-[10px] font-bold text-slate-700">94%</span>
                      <BatteryCharging className="w-4 h-4 text-emerald-600 stroke-[2.5]" />
                    </div>
                  </div>
                </div>

                {/* Mobile App Viewport */}
                <div className="flex-1 overflow-hidden relative flex flex-col bg-white">
                  {children}
                </div>

                {/* iPhone Home Indicator Line */}
                <div className="w-full h-4 bg-white flex items-center justify-center pointer-events-none pb-1 z-30">
                  <div className="w-32 h-1 bg-zinc-300 rounded-full"></div>
                </div>

              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};
