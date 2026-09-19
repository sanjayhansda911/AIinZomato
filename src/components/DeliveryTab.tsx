import React, { useState } from 'react';
import { Star, Clock, Flame, Percent, Sparkles, Heart } from 'lucide-react';
import { Restaurant, Locality } from '../types';

interface DeliveryTabProps {
  restaurants: Restaurant[];
  selectedLocality: Locality;
  onSelectRestaurant: (restaurant: Restaurant) => void;
  activeFilter: string;
  onFilterChange: (filter: string) => void;
  selectedCuisine: string | null;
  onSelectCuisine: (cuisine: string | null) => void;
}

export const DeliveryTab: React.FC<DeliveryTabProps> = ({
  restaurants,
  selectedLocality,
  onSelectRestaurant,
  activeFilter,
  onFilterChange,
  selectedCuisine,
  onSelectCuisine,
}) => {
  const [favorites, setFavorites] = useState<Record<string, boolean>>({});

  const toggleFavorite = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setFavorites(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const hyderabadCategories = [
    { name: 'Biryani', icon: '🍲', cuisine: 'Biryani' },
    { name: 'Irani Chai', icon: '☕', cuisine: 'Irani Chai' },
    { name: 'Babai Dosa', icon: '🥞', cuisine: 'South Indian' },
    { name: 'GI Haleem', icon: '🥣', cuisine: 'Haleem' },
    { name: 'Rayalaseema', icon: '🌶️', cuisine: 'Rayalaseema' },
    { name: 'Bakery', icon: '🍪', cuisine: 'Bakery' },
    { name: 'Patisserie', icon: '🍰', cuisine: 'French Patisserie' },
    { name: 'Mughlai', icon: '🍢', cuisine: 'Mughlai' },
    { name: 'Craft Beer', icon: '🍺', cuisine: 'Craft Beer' },
  ];

  return (
    <div className="pb-6">
      {/* Hyderabad Biryani Festival Banner */}
      <div className="px-4 py-3">
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-rose-600 via-rose-700 to-amber-600 p-4 text-white shadow-md">
          <div className="relative z-10 max-w-[240px]">
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-white/20 text-[10px] font-extrabold uppercase tracking-wide">
              <Sparkles className="w-3 h-3 text-amber-300" />
              Hyderabad Food Trail
            </span>
            <h2 className="text-lg font-black mt-1 leading-tight tracking-tight">
              Authentic Dum Biryani & Haleem
            </h2>
            <p className="text-[11px] text-rose-100 mt-1">
              Delivering to <strong className="text-white">{selectedLocality.name}</strong> in {selectedLocality.estimatedDeliveryMinutes} mins
            </p>
            <div className="mt-2.5 flex items-center gap-2">
              <span className="bg-amber-400 text-slate-900 font-extrabold text-[11px] px-2.5 py-1 rounded-lg shadow-sm">
                Code: HYD50
              </span>
              <span className="text-[10px] text-rose-100 font-medium">50% OFF up to ₹100</span>
            </div>
          </div>

          <div className="absolute right-[-15px] -bottom-2 text-7xl select-none opacity-90 transform rotate-12">
            🍛
          </div>
        </div>
      </div>

      {/* Categories Horizontal Carousel */}
      <div className="mt-1">
        <div className="px-4 flex items-center justify-between mb-2">
          <h3 className="text-xs font-black uppercase tracking-wider text-slate-500">
            Eat What Hyderabad Loves
          </h3>
          {selectedCuisine && (
            <button
              onClick={() => onSelectCuisine(null)}
              className="text-[11px] font-bold text-rose-600 hover:underline"
            >
              Clear
            </button>
          )}
        </div>

        <div className="flex gap-3 px-4 overflow-x-auto no-scrollbar pb-2">
          {hyderabadCategories.map(cat => {
            const isSelected = selectedCuisine === cat.cuisine;
            return (
              <button
                key={cat.name}
                onClick={() => onSelectCuisine(isSelected ? null : cat.cuisine)}
                className="flex flex-col items-center flex-shrink-0 group focus:outline-none"
              >
                <div
                  className={`w-14 h-14 rounded-full flex items-center justify-center text-2xl transition-all shadow-sm ${
                    isSelected
                      ? 'bg-rose-600 ring-2 ring-rose-500 ring-offset-2 scale-105 shadow-rose-200'
                      : 'bg-zinc-100 group-hover:bg-rose-50 group-hover:scale-105'
                  }`}
                >
                  <span>{cat.icon}</span>
                </div>
                <span
                  className={`text-[10px] mt-1.5 font-bold tracking-tight text-center max-w-[62px] truncate ${
                    isSelected ? 'text-rose-600' : 'text-slate-700'
                  }`}
                >
                  {cat.name}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Filter Chips Bar */}
      <div className="flex items-center gap-2 px-4 py-2 overflow-x-auto no-scrollbar border-y border-zinc-100 mt-2 bg-zinc-50/50">
        {[
          { id: 'all', label: 'All' },
          { id: 'rating', label: 'Rating 4.5+' },
          { id: 'fast', label: 'Fast Delivery (<30m)' },
          { id: 'offers', label: 'Great Offers' },
          { id: 'gold', label: 'Zomato Gold' },
        ].map(filter => {
          const isActive = activeFilter === filter.id;
          return (
            <button
              key={filter.id}
              onClick={() => onFilterChange(filter.id)}
              className={`text-[11px] font-bold px-3 py-1 rounded-full whitespace-nowrap transition-all border ${
                isActive
                  ? 'bg-slate-900 text-white border-slate-900 shadow-sm'
                  : 'bg-white text-slate-600 border-zinc-200 hover:border-zinc-300'
              }`}
            >
              {filter.label}
            </button>
          );
        })}
      </div>

      {/* Restaurant List Section */}
      <div className="px-4 mt-4">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-extrabold text-slate-900 flex items-center gap-1.5">
            <span>{restaurants.length} Restaurants Delivering Near You</span>
          </h3>
          <span className="text-[10px] font-semibold text-slate-500">
            {selectedLocality.name}
          </span>
        </div>

        {restaurants.length === 0 ? (
          <div className="text-center py-12 px-4 bg-zinc-50 rounded-2xl border border-dashed border-zinc-200">
            <div className="text-4xl mb-2">🍽️</div>
            <h4 className="text-xs font-bold text-slate-700">No restaurants match your filters</h4>
            <p className="text-[11px] text-slate-400 mt-1">Try resetting the cuisine or rating filter</p>
            <button
              onClick={() => {
                onFilterChange('all');
                onSelectCuisine(null);
              }}
              className="mt-3 text-xs font-bold text-rose-600 hover:underline"
            >
              Reset all filters
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {restaurants.map(rest => {
              const isFav = !!favorites[rest.id];
              return (
                <div
                  key={rest.id}
                  onClick={() => onSelectRestaurant(rest)}
                  className="bg-white rounded-2xl overflow-hidden border border-zinc-100 shadow-sm hover:shadow-md transition-all cursor-pointer group active:scale-[0.99]"
                >
                  {/* Hero Image Container */}
                  <div className="relative h-44 w-full overflow-hidden bg-zinc-200">
                    <img
                      src={rest.heroImage}
                      alt={rest.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />

                    {/* Gradient Overlay for bottom text */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-black/20 pointer-events-none"></div>

                    {/* Top Badges */}
                    <div className="absolute top-2.5 left-2.5 flex items-center gap-1.5">
                      {rest.isPureVeg && (
                        <span className="px-2 py-0.5 rounded bg-emerald-600 text-white text-[9px] font-black uppercase tracking-wider shadow">
                          PURE VEG
                        </span>
                      )}
                      {rest.isGoldPartner && (
                        <span className="px-2 py-0.5 rounded bg-amber-400 text-slate-950 text-[9px] font-black uppercase tracking-wider flex items-center gap-1 shadow">
                          <Sparkles className="w-2.5 h-2.5 fill-slate-950" />
                          GOLD
                        </span>
                      )}
                    </div>

                    {/* Favorite Heart Button */}
                    <button
                      onClick={e => toggleFavorite(rest.id, e)}
                      className="absolute top-2.5 right-2.5 w-7 h-7 rounded-full bg-white/80 backdrop-blur-sm flex items-center justify-center text-slate-700 hover:bg-white shadow transition-colors"
                    >
                      <Heart className={`w-4 h-4 ${isFav ? 'text-rose-600 fill-rose-600' : ''}`} />
                    </button>

                    {/* Bottom Promo Tag on Image */}
                    {rest.discountOffer && (
                      <div className="absolute bottom-2.5 left-2.5 flex items-center gap-1 bg-rose-600/95 backdrop-blur-sm text-white text-[10px] font-extrabold px-2.5 py-1 rounded-lg shadow">
                        <Percent className="w-3 h-3" />
                        <span>{rest.discountOffer}</span>
                      </div>
                    )}
                  </div>

                  {/* Info Card Content */}
                  <div className="p-3">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <h4 className="font-extrabold text-sm text-slate-900 leading-tight group-hover:text-rose-600 transition-colors">
                          {rest.name}
                        </h4>
                        <p className="text-[11px] text-slate-500 truncate mt-0.5">
                          {rest.cuisines.join(', ')}
                        </p>
                      </div>

                      {/* Rating Badge */}
                      <div className="flex items-center gap-0.5 bg-emerald-700 text-white text-xs font-bold px-1.5 py-0.5 rounded-lg flex-shrink-0 shadow-sm">
                        <span>{rest.rating.toFixed(1)}</span>
                        <Star className="w-2.5 h-2.5 fill-white" />
                      </div>
                    </div>

                    {/* ETA, Distance, Price for two */}
                    <div className="flex items-center justify-between mt-2 pt-2 border-t border-zinc-100 text-[11px] text-slate-500 font-medium">
                      <div className="flex items-center gap-1 text-slate-700 font-semibold">
                        <Clock className="w-3.5 h-3.5 text-slate-400" />
                        <span>{rest.deliveryTimeMinutes} mins</span>
                        <span className="text-zinc-300">•</span>
                        <span>{rest.distanceKm} km</span>
                      </div>
                      <div>
                        ₹{rest.costForTwo} for two
                      </div>
                    </div>

                    {/* Locality Tagline */}
                    <div className="mt-1.5 flex items-center gap-1 text-[10px] text-zinc-400">
                      <span className="w-1.5 h-1.5 rounded-full bg-rose-500"></span>
                      <span className="truncate">{rest.tagline}</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
