import React, { useState, useEffect, useRef } from 'react';
import { Mic, MicOff, X, Sparkles, ArrowRight, Volume2 } from 'lucide-react';

interface VoiceSearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectQuery: (query: string) => void;
}

export const VoiceSearchModal: React.FC<VoiceSearchModalProps> = ({
  isOpen,
  onClose,
  onSelectQuery,
}) => {
  const [isListening, setIsListening] = useState<boolean>(false);
  const [transcript, setTranscript] = useState<string>('');
  const [speechSupported, setSpeechSupported] = useState<boolean>(true);
  const recognitionRef = useRef<any>(null);

  const fallbackChips = [
    'Want something light under 250 rupees',
    'Hot Irani chai with Osmania biscuits under 120',
    'Rainy day chai and mirchi bajji',
    'Authentic spicy mutton dum biryani',
    'Pure Veg Babai Sponge Dosa under 220',
    'Late night chocolate dessert craving under 350',
  ];

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const SpeechRecognition =
        (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      if (!SpeechRecognition) {
        setSpeechSupported(false);
      }
    }
  }, []);

  const startListening = () => {
    if (typeof window === 'undefined') return;
    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      setSpeechSupported(false);
      return;
    }

    try {
      if (recognitionRef.current) {
        recognitionRef.current.abort();
      }

      const recognition = new SpeechRecognition();
      recognition.continuous = false;
      recognition.interimResults = true;
      recognition.lang = 'en-IN'; // Indian English accent recognition

      recognition.onstart = () => {
        setIsListening(true);
        setTranscript('');
      };

      recognition.onresult = (event: any) => {
        let currentTranscript = '';
        for (let i = event.resultIndex; i < event.results.length; i++) {
          currentTranscript += event.results[i][0].transcript;
        }
        setTranscript(currentTranscript);
      };

      recognition.onerror = (event: any) => {
        console.warn('Speech recognition error:', event.error);
        setIsListening(false);
      };

      recognition.onend = () => {
        setIsListening(false);
        if (transcript.trim().length > 0) {
          onSelectQuery(transcript);
          onClose();
        }
      };

      recognitionRef.current = recognition;
      recognition.start();
    } catch (err) {
      console.warn('Could not start speech recognition:', err);
      setIsListening(false);
    }
  };

  const stopListening = () => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
      setIsListening(false);
      if (transcript.trim().length > 0) {
        onSelectQuery(transcript);
        onClose();
      }
    }
  };

  useEffect(() => {
    if (isOpen) {
      startListening();
    } else {
      if (recognitionRef.current) {
        recognitionRef.current.abort();
      }
      setIsListening(false);
      setTranscript('');
    }
    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.abort();
      }
    };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="absolute inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-end justify-center animate-in fade-in duration-200">
      <div className="bg-white w-full rounded-t-3xl p-5 shadow-2xl animate-in slide-in-from-bottom-6 duration-200 flex flex-col relative overflow-hidden">
        
        {/* Top Header */}
        <div className="flex items-center justify-between pb-3 border-b border-zinc-100">
          <div className="flex items-center gap-1.5 text-xs font-black text-slate-900">
            <Sparkles className="w-4 h-4 text-rose-600 fill-rose-100" />
            <span>AI Voice & Natural Language Search</span>
          </div>
          <button
            onClick={onClose}
            className="w-7 h-7 rounded-full bg-zinc-100 hover:bg-zinc-200 flex items-center justify-center text-slate-500"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Microphone Center with Animated Listening Rings */}
        <div className="py-8 flex flex-col items-center justify-center relative">
          {/* Animated concentric rings */}
          {isListening && (
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <span className="w-24 h-24 rounded-full bg-rose-500/20 animate-ping absolute"></span>
              <span className="w-32 h-32 rounded-full bg-rose-500/15 animate-pulse absolute"></span>
              <span className="w-40 h-40 rounded-full bg-rose-500/10 absolute"></span>
            </div>
          )}

          {/* Central Mic Button */}
          <button
            onClick={isListening ? stopListening : startListening}
            className={`relative z-10 w-20 h-20 rounded-full flex items-center justify-center transition-all shadow-xl active:scale-95 ${
              isListening
                ? 'bg-gradient-to-tr from-rose-600 to-red-500 text-white shadow-rose-600/40 ring-4 ring-rose-200'
                : 'bg-zinc-100 text-slate-700 hover:bg-zinc-200'
            }`}
          >
            {isListening ? (
              <Mic className="w-9 h-9 animate-pulse" />
            ) : (
              <MicOff className="w-8 h-8" />
            )}
          </button>

          {/* Real-time Status Text */}
          <div className="mt-4 text-center px-4 min-h-[48px] flex flex-col items-center justify-center">
            {isListening ? (
              <>
                <span className="text-xs font-black text-rose-600 animate-pulse tracking-wide flex items-center gap-1">
                  <Volume2 className="w-3.5 h-3.5" />
                  Listening... Speak your craving
                </span>
                <p className="text-sm font-extrabold text-slate-800 mt-1 min-h-[20px] max-w-[280px] truncate">
                  {transcript ? `"${transcript}"` : 'e.g. "Hot Irani chai under 120"'}
                </p>
              </>
            ) : (
              <>
                <span className="text-xs font-bold text-slate-500">
                  {speechSupported ? 'Tap mic to speak' : 'Microphone unavailable on this device'}
                </span>
                {transcript && (
                  <p className="text-xs font-bold text-slate-800 mt-1">"{transcript}"</p>
                )}
              </>
            )}
          </div>

          {/* Submit Captured Speech */}
          {transcript && !isListening && (
            <button
              onClick={() => {
                onSelectQuery(transcript);
                onClose();
              }}
              className="mt-2 px-4 py-1.5 bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold rounded-full shadow flex items-center gap-1.5"
            >
              <span>Search with Gemini AI</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Fallback Clickable Prompt Chips */}
        <div className="mt-2 pt-3 border-t border-zinc-100">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-extrabold text-slate-500 uppercase tracking-wider">
              Try asking Gemini
            </span>
            <span className="text-[10px] text-rose-600 font-bold">1-Tap Prompts</span>
          </div>

          <div className="space-y-1.5">
            {fallbackChips.map(chip => (
              <button
                key={chip}
                onClick={() => {
                  onSelectQuery(chip);
                  onClose();
                }}
                className="w-full text-left p-2.5 rounded-xl bg-zinc-50 hover:bg-rose-50 border border-zinc-200/80 hover:border-rose-300 text-xs font-semibold text-slate-800 flex items-center justify-between group transition-all"
              >
                <span className="truncate pr-2">"{chip}"</span>
                <ArrowRight className="w-3.5 h-3.5 text-slate-400 group-hover:text-rose-600 group-hover:translate-x-0.5 transition-all flex-shrink-0" />
              </button>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
};
