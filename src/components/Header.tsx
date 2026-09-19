import React, { useState } from 'react';
import { MapPin, ChevronDown, Search, X, Sparkles, Check, Mic } from 'lucide-react';
import { Locality } from '../types';

interface HeaderProps {
  localities: Locality[];
  selectedLocality: Locality;
  onSelectLocality: (locality: Locality) => void;
  searchQuery: string;
  onSearchChange: (q: string) => void;
  isVegOnly: boolean;
  onToggleVegOnly: () => void;
  onOpenVoiceSearch: () => void;
  onSubmitAISearch: (query: string) => void;
  onOpenFoodieFriend?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  localities,
  selectedLocality,
  onSelectLocality,
  searchQuery,
  onSearchChange,
  isVegOnly,
  onToggleVegOnly,
  onOpenVoiceSearch,
  onSubmitAISearch,
  onOpenFoodieFriend,
}) => {
  const [showLocationDropdown, setShowLocationDropdown] = useState(false);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && searchQuery.trim().length > 0) {
      onSubmitAISearch(searchQuery);
    }
  };

  return (
    <div className="sticky top-0 z-30 bg-white border-b border-zinc-100 shadow-sm">
      {/* Top Location Bar */}
      <div className="px-4 py-2.5 flex items-center justify-between gap-2">
        <button
          onClick={() => setShowLocationDropdown(!showLocationDropdown)}
          className="flex items-center gap-2 text-left group flex-1 min-w-0"
        >
          <div className="w-8 h-8 rounded-full bg-rose-50 flex items-center justify-center text-rose-600 flex-shrink-0 group-hover:bg-rose-100 transition-colors">
            <MapPin className="w-4 h-4 fill-rose-600 text-white" />
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-1">
              <span className="text-xs font-black text-slate-900 tracking-tight truncate flex items-center gap-1">
                {selectedLocality.name}
                <ChevronDown className={`w-3.5 h-3.5 text-slate-600 transition-transform duration-200 ${showLocationDropdown ? 'rotate-180' : ''}`} />
              </span>
            </div>
            <p className="text-[11px] text-slate-500 truncate font-medium">
              {selectedLocality.address}
            </p>
          </div>
        </button>

        {/* Zomato Gold Badge & Foodie Dost Trigger */}
        <div className="flex items-center gap-1.5 flex-shrink-0">
          {onOpenFoodieFriend && (
            <button
              onClick={onOpenFoodieFriend}
              className="px-2.5 py-1 rounded-full bg-gradient-to-r from-rose-500 to-amber-500 text-white text-[11px] font-black flex items-center gap-1 shadow-xs hover:from-rose-600 hover:to-amber-600 active:scale-95 transition-all"
              title="Can't decide what to eat? Ask Gemini Foodie Dost"
            >
              <span>🤖</span>
              <span>Dost AI</span>
            </button>
          )}
          <div className="px-2 py-0.5 rounded-full bg-amber-50 border border-amber-300 text-amber-800 text-[10px] font-extrabold flex items-center gap-1 shadow-sm">
            <Sparkles className="w-3 h-3 text-amber-600 fill-amber-500" />
            <span>GOLD</span>
          </div>
          <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-rose-600 to-rose-400 text-white flex items-center justify-center font-bold text-xs shadow-sm ring-2 ring-rose-100">
            HYD
          </div>
        </div>
      </div>

      {/* Location Dropdown Modal / Bottom Sheet */}
      {showLocationDropdown && (
        <div className="absolute top-full left-0 right-0 bg-white border-b border-zinc-200 shadow-xl z-50 p-3 max-h-80 overflow-y-auto animate-in slide-in-from-top-2 duration-150">
          <div className="flex items-center justify-between pb-2 mb-2 border-b border-zinc-100">
            <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">
              Select Hyderabad Locality
            </span>
            <button
              onClick={() => setShowLocationDropdown(false)}
              className="p-1 text-slate-400 hover:text-slate-600"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
          <div className="space-y-1">
            {localities.map(loc => {
              const isSelected = loc.id === selectedLocality.id;
              return (
                <button
                  key={loc.id}
                  onClick={() => {
                    onSelectLocality(loc);
                    setShowLocationDropdown(false);
                  }}
                  className={`w-full text-left p-2.5 rounded-xl flex items-center justify-between transition-all ${
                    isSelected
                      ? 'bg-rose-50 text-rose-900 border border-rose-200'
                      : 'hover:bg-zinc-50 text-slate-800'
                  }`}
                >
                  <div className="flex items-start gap-2.5">
                    <MapPin className={`w-4 h-4 mt-0.5 flex-shrink-0 ${isSelected ? 'text-rose-600' : 'text-slate-400'}`} />
                    <div>
                      <div className="text-xs font-bold flex items-center gap-1.5">
                        {loc.name}
                        {loc.id === 'jubilee-hills' && (
                          <span className="text-[9px] bg-rose-100 text-rose-700 px-1.5 py-0.2 rounded font-semibold">
                            Default
                          </span>
                        )}
                      </div>
                      <div className="text-[11px] text-slate-500">{loc.address}</div>
                      <div className="text-[10px] text-slate-400 mt-0.5">{loc.tagline}</div>
                    </div>
                  </div>
                  {isSelected && <Check className="w-4 h-4 text-rose-600 flex-shrink-0" />}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Search Bar & Veg Toggle */}
      <div className="px-4 pb-2.5 pt-0.5">
        <div className="flex items-center gap-2">
          <div className="flex-1 relative flex items-center bg-zinc-100 rounded-xl px-2.5 py-1.5 focus-within:ring-2 focus-within:ring-rose-500/30 focus-within:bg-white transition-all border border-transparent focus-within:border-rose-400">
            <button
              onClick={() => searchQuery.trim() && onSubmitAISearch(searchQuery)}
              className="text-rose-600 mr-2 flex-shrink-0 hover:scale-110 transition-transform"
              title="Search with AI"
            >
              <Search className="w-4 h-4" />
            </button>
            <input
              type="text"
              value={searchQuery}
              onChange={e => onSearchChange(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Ask anything: 'Chai under 120', 'Spicy Biryani'..."
              className="w-full text-xs bg-transparent text-slate-800 placeholder-slate-400 focus:outline-none"
            />
            {searchQuery && (
              <button
                onClick={() => onSearchChange('')}
                className="p-0.5 text-slate-400 hover:text-slate-600 mr-1"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}

            {/* Microphone Button with Animated Ring */}
            <button
              onClick={onOpenVoiceSearch}
              className="relative p-1.5 rounded-lg bg-rose-600 text-white hover:bg-rose-700 transition-all flex items-center justify-center flex-shrink-0 shadow-xs active:scale-95 group"
              title="Voice Search (AI Enabled)"
            >
              <Mic className="w-3.5 h-3.5 group-hover:animate-bounce-soft" />
            </button>
          </div>

          {/* Pure Veg Quick Pill */}
          <button
            onClick={onToggleVegOnly}
            className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl border text-[11px] font-bold transition-all flex-shrink-0 ${
              isVegOnly
                ? 'bg-emerald-50 border-emerald-500 text-emerald-800 shadow-sm'
                : 'bg-white border-zinc-200 text-slate-600 hover:border-zinc-300'
            }`}
          >
            <div className="w-3 h-3 rounded-sm border border-emerald-600 flex items-center justify-center p-0.5">
              <div className="w-1.5 h-1.5 rounded-full bg-emerald-600"></div>
            </div>
            <span>Veg</span>
          </button>
        </div>

        {/* Quick Natural Language AI Prompts Pill Bar */}
        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pt-1.5">
          {onOpenFoodieFriend && (
            <button
              onClick={onOpenFoodieFriend}
              className="text-[10px] font-black px-2.5 py-0.5 rounded-full bg-gradient-to-r from-rose-600 to-amber-600 text-white hover:opacity-90 whitespace-nowrap shadow-xs transition-all flex items-center gap-1 flex-shrink-0"
            >
              <span>🤖 Can&apos;t Decide? Ask Dost</span>
            </button>
          )}
          <span className="text-[10px] font-extrabold text-rose-600 flex items-center gap-0.5 flex-shrink-0">
            <Sparkles className="w-2.5 h-2.5 fill-rose-600" />
            AI:
          </span>
          {[
            'Want something light under 250 rupees',
            'Hot Irani chai with Osmania biscuits under 120',
            'Spicy Mutton Dum Biryani',
          ].map(sample => (
            <button
              key={sample}
              onClick={() => {
                onSearchChange(sample);
                onSubmitAISearch(sample);
              }}
              className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-zinc-100 hover:bg-rose-50 text-slate-600 hover:text-rose-700 whitespace-nowrap border border-zinc-200/60 transition-all flex-shrink-0"
            >
              "{sample}"
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};
