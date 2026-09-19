import React, { useState } from 'react';
import { Wine, Star, Sparkles, Music, Beer, CheckCircle2 } from 'lucide-react';
import { Restaurant, Locality } from '../types';

interface NightlifeTabProps {
  restaurants: Restaurant[];
  selectedLocality: Locality;
}

export const NightlifeTab: React.FC<NightlifeTabProps> = ({
  restaurants,
  selectedLocality,
}) => {
  const [reservedPass, setReservedPass] = useState<string | null>(null);
  const nightlifeVenues = restaurants.filter(r => r.tabTypes.includes('nightlife'));

  return (
    <div className="pb-8">
      {/* Nightlife Hero Banner */}
      <div className="px-4 py-3">
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-purple-950 via-indigo-950 to-zinc-950 p-4 text-white shadow-lg border border-purple-900/40">
          <div className="relative z-10">
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-purple-500/20 text-purple-300 text-[10px] font-extrabold uppercase tracking-wider border border-purple-500/30">
              <Music className="w-3 h-3 text-purple-400" />
              Jubilee Hills & Gachibowli Nights
            </span>
            <h2 className="text-lg font-black mt-1 leading-tight tracking-tight">
              Hyderabad Breweries & Lounges
            </h2>
            <p className="text-[11px] text-zinc-300 mt-1">
              Fresh craft beers, rooftop gigs & energetic dancefloors near Road No. 36 & 45
            </p>
          </div>
          <div className="absolute right-0 -bottom-2 text-7xl select-none opacity-40">
            🍸
          </div>
        </div>
      </div>

      {/* Featured Microbrewery Highlights */}
      <div className="px-4 mt-2">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-black text-slate-900">
            Microbreweries & Pubs
          </h3>
          <span className="text-[11px] font-bold text-purple-600">
            Near {selectedLocality.name}
          </span>
        </div>

        <div className="space-y-4">
          {nightlifeVenues.map(venue => (
            <div
              key={venue.id}
              className="bg-white rounded-2xl overflow-hidden border border-zinc-100 shadow-sm hover:shadow-md transition-all"
            >
              <div className="relative h-44 w-full bg-zinc-900">
                <img
                  src={venue.heroImage}
                  alt={venue.name}
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/30 to-transparent"></div>

                <div className="absolute top-3 right-3 bg-purple-600 text-white text-xs font-bold px-2 py-0.5 rounded-lg flex items-center gap-1 shadow">
                  <span>{venue.rating.toFixed(1)}</span>
                  <Star className="w-3 h-3 fill-white" />
                </div>

                {venue.nightlifeOffer && (
                  <div className="absolute bottom-3 left-3 bg-purple-500 text-white font-extrabold text-[10px] px-2.5 py-1 rounded-lg shadow flex items-center gap-1">
                    <Sparkles className="w-3 h-3" />
                    <span>{venue.nightlifeOffer}</span>
                  </div>
                )}
              </div>

              <div className="p-3">
                <div className="flex items-start justify-between">
                  <div>
                    <h4 className="font-extrabold text-sm text-slate-900">{venue.name}</h4>
                    <p className="text-[11px] text-slate-500">{venue.cuisines.join(', ')}</p>
                  </div>
                  <span className="text-xs font-bold text-slate-700">₹{venue.costForTwo} for 2</span>
                </div>

                <p className="text-[11px] text-slate-600 mt-2 line-clamp-1">
                  📍 {venue.address}
                </p>

                {/* Craft Beers Available Preview */}
                <div className="mt-2.5 p-2 bg-purple-50 rounded-xl border border-purple-100 flex items-center justify-between">
                  <div className="flex items-center gap-1.5 text-[11px] font-bold text-purple-900">
                    <Beer className="w-4 h-4 text-purple-600" />
                    <span>On Tap: Belgian Wit, Stout & Cider</span>
                  </div>
                  <span className="text-[10px] font-semibold text-purple-700">Brewed Fresh</span>
                </div>

                <div className="mt-3 pt-2.5 border-t border-zinc-100 flex items-center justify-between gap-2">
                  <div className="text-[10px] text-slate-500 font-medium">
                    🕒 {venue.openingHours}
                  </div>
                  <button
                    onClick={() => setReservedPass(venue.id)}
                    className="bg-purple-700 hover:bg-purple-800 text-white text-xs font-bold px-3.5 py-1.5 rounded-xl shadow-sm active:scale-95 transition-transform"
                  >
                    {reservedPass === venue.id ? 'Entry Pass Reserved ✓' : 'Get Entry Pass'}
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
