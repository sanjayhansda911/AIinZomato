import React, { useState, useEffect } from 'react';
import {
  X,
  Sparkles,
  CloudRain,
  Sun,
  Moon,
  Wind,
  RefreshCw,
  Plus,
  Check,
  ShoppingBag,
  MapPin,
  Clock,
} from 'lucide-react';
import { Locality, Restaurant, FoodieFriendResponse, FoodieFriendDish, CartItem } from '../types';
import { RESTAURANTS } from '../data/hyderabadData';
import { clientFoodieFriendSuggest } from '../utils/localApiFallback';

interface FoodieFriendModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedLocality: Locality;
  restaurants: Restaurant[];
  cartItems: CartItem[];
  onAddToCart: (item: any, restaurant: Restaurant) => void;
  onOpenCart: () => void;
}

const WEATHER_OPTIONS = [
  { id: 'rainy', label: 'Monsoon Drizzle', icon: CloudRain, emoji: '🌧️' },
  { id: 'breezy', label: 'Breezy Evening', icon: Wind, emoji: '🍃' },
  { id: 'sunny', label: 'Warm Afternoon', icon: Sun, emoji: '☀️' },
  { id: 'late_night', label: 'Late Night Cravings', icon: Moon, emoji: '🌙' },
];

export const FoodieFriendModal: React.FC<FoodieFriendModalProps> = ({
  isOpen,
  onClose,
  selectedLocality,
  restaurants,
  cartItems,
  onAddToCart,
  onOpenCart,
}) => {
  const [selectedWeather, setSelectedWeather] = useState<string>('rainy');
  const [loading, setLoading] = useState<boolean>(false);
  const [friendData, setFriendData] = useState<FoodieFriendResponse | null>(null);
  const [addedItemIds, setAddedItemIds] = useState<Record<string, boolean>>({});

  const fetchSuggestions = async (weather: string) => {
    setLoading(true);
    try {
      const res = await fetch('/api/ai/friend-suggest', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          weather,
          localityId: selectedLocality.id,
          timeOfDay: 'auto',
          userHistory: {
            pastOrders: ['Chicken Dum Biryani', 'Irani Chai'],
          },
        }),
      });

      if (res.ok) {
        const data = await res.json();
        if (data.success && data.suggestedDishes?.length > 0) {
          setFriendData(data);
          setLoading(false);
          return;
        }
      }
      throw new Error('API fallback');
    } catch (err) {
      console.info('Using local Foodie Friend fallback:', err);
      const fallback = clientFoodieFriendSuggest({
        weather,
        localityId: selectedLocality.id,
        userHistory: { pastOrders: ['Chicken Dum Biryani', 'Irani Chai'] },
      });
      setFriendData(fallback);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchSuggestions(selectedWeather);
    }
  }, [isOpen, selectedWeather, selectedLocality.id]);

  if (!isOpen) return null;

  const handleAddDish = (dishObj: FoodieFriendDish) => {
    let rest = restaurants.find(r => r.id === dishObj.restaurantId);
    if (!rest) {
      rest = RESTAURANTS.find(r => r.id === dishObj.restaurantId);
    }
    if (!rest) {
      rest = {
        id: dishObj.restaurantId,
        name: dishObj.restaurantName,
        tagline: 'Hyderabadi Specialty',
        localityId: selectedLocality.id,
        localityName: dishObj.localityName,
        cuisines: ['Hyderabadi'],
        rating: 4.8,
        ratingCount: '10k+ ratings',
        deliveryTimeMinutes: dishObj.deliveryTimeMinutes,
        distanceKm: 2.5,
        costForTwo: 350,
        heroImage: dishObj.dish.imageUrl,
        tabTypes: ['delivery'],
        address: `${dishObj.restaurantName}, ${dishObj.localityName}, Hyderabad`,
        openingHours: '10:00 AM - 11:30 PM',
        menuCategories: [],
      };
    }

    onAddToCart(dishObj.dish, rest);
    setAddedItemIds(prev => ({ ...prev, [dishObj.dish.id]: true }));
    setTimeout(() => {
      setAddedItemIds(prev => ({ ...prev, [dishObj.dish.id]: false }));
    }, 1800);
  };

  const isDishInCart = (dishId: string) => cartItems.some(ci => ci.item.id === dishId);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-3 sm:p-4 animate-fade-in">
      <div className="relative w-full max-w-lg max-h-[92vh] flex flex-col bg-white rounded-3xl shadow-2xl overflow-hidden border border-rose-100">
        {/* Header with Hyderabad Foodie Dost theme */}
        <div className="relative bg-gradient-to-br from-rose-600 via-rose-700 to-amber-600 px-5 pt-5 pb-4 text-white">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-10 h-10 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center text-xl shadow-inner border border-white/30">
                🤖
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  <h2 className="text-lg font-black tracking-tight leading-tight">Foodie Friend</h2>
                  <span className="px-1.5 py-0.5 rounded-md bg-amber-400 text-rose-950 text-[10px] font-black uppercase tracking-wider">
                    Gemini AI
                  </span>
                </div>
                <p className="text-xs text-rose-100 flex items-center gap-1">
                  <MapPin className="w-3 h-3 text-amber-300" />
                  Hyderabad Dost • {selectedLocality.name}
                </p>
              </div>
            </div>

            <button
              onClick={onClose}
              className="w-8 h-8 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center text-white transition-colors"
              aria-label="Close"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <p className="mt-2.5 text-xs text-rose-100 leading-relaxed">
            Can&apos;t decide what to eat? Tell me your vibe or the weather outside, and I&apos;ll pick the absolute best authentic Hyderabadi cravings for you right now!
          </p>

          {/* Weather & Vibe Selector Chips */}
          <div className="mt-3.5 flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
            {WEATHER_OPTIONS.map(opt => {
              const Icon = opt.icon;
              const isActive = selectedWeather === opt.id;
              return (
                <button
                  key={opt.id}
                  onClick={() => setSelectedWeather(opt.id)}
                  className={`flex-shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold transition-all ${
                    isActive
                      ? 'bg-white text-rose-700 shadow-md scale-105 ring-2 ring-amber-300'
                      : 'bg-white/15 text-white hover:bg-white/25'
                  }`}
                >
                  <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-rose-600' : 'text-amber-300'}`} />
                  <span>{opt.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4 bg-slate-50">
          {loading ? (
            <div className="py-16 flex flex-col items-center justify-center text-center">
              <div className="relative">
                <div className="w-14 h-14 rounded-full border-4 border-rose-200 border-t-rose-600 animate-spin flex items-center justify-center" />
                <Sparkles className="w-5 h-5 text-amber-500 absolute inset-0 m-auto animate-pulse" />
              </div>
              <p className="mt-4 text-sm font-bold text-gray-800">Sniffing out Hyderabad&apos;s best aromas...</p>
              <p className="text-xs text-gray-500 mt-1">Consulting Gemini & local delicacies for {selectedWeather} weather</p>
            </div>
          ) : friendData ? (
            <>
              {/* Dost Speech Bubble Card */}
              <div className="bg-white rounded-2xl p-4 shadow-sm border border-rose-100 relative">
                <div className="flex items-start gap-3">
                  <div className="w-9 h-9 rounded-full bg-rose-100 flex items-center justify-center flex-shrink-0 text-lg border border-rose-200 shadow-sm">
                    🍛
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-black uppercase text-rose-600 tracking-wider">
                        Dost&apos;s Honest Advice
                      </span>
                      <span className="text-[10px] font-semibold text-gray-400">
                        {friendData.source.includes('gemini') ? '✨ Gemini 3.8 Flash' : '⚡ Hyderabadi Local Dost'}
                      </span>
                    </div>
                    <h3 className="text-sm font-black text-gray-900 mt-0.5 leading-snug">
                      {friendData.headline}
                    </h3>
                    <p className="text-xs text-gray-600 mt-1.5 leading-relaxed bg-rose-50/70 p-2.5 rounded-xl border border-rose-100/70 italic">
                      &ldquo;{friendData.friendAdvice}&rdquo;
                    </p>

                    {friendData.vibeTags && friendData.vibeTags.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-2.5">
                        {friendData.vibeTags.map((tag, i) => (
                          <span
                            key={i}
                            className="px-2 py-0.5 rounded-full bg-rose-50 text-rose-700 text-[10px] font-bold border border-rose-100"
                          >
                            {tag}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Recommended Dishes Title */}
              <div className="flex items-center justify-between pt-1">
                <div className="flex items-center gap-1.5">
                  <Sparkles className="w-4 h-4 text-amber-500" />
                  <h4 className="text-xs font-black uppercase text-gray-700 tracking-wider">
                    Handpicked Dishes Just For You
                  </h4>
                </div>
                <span className="text-[11px] font-semibold text-gray-400">
                  {friendData.suggestedDishes.length} choices
                </span>
              </div>

              {/* Dishes List */}
              <div className="space-y-3">
                {friendData.suggestedDishes.map(rec => {
                  const inCart = isDishInCart(rec.dish.id);
                  const isJustAdded = addedItemIds[rec.dish.id];

                  return (
                    <div
                      key={rec.dish.id}
                      className="bg-white rounded-2xl p-3.5 shadow-sm border border-gray-100 hover:border-rose-200 transition-all flex flex-col gap-2.5"
                    >
                      <div className="flex items-start gap-3">
                        {/* Dish Image */}
                        <div className="relative w-20 h-20 rounded-xl overflow-hidden flex-shrink-0 bg-gray-100">
                          <img
                            src={rec.dish.imageUrl}
                            alt={rec.dish.name}
                            className="w-full h-full object-cover"
                            loading="lazy"
                          />
                          <div className="absolute top-1 left-1">
                            <span
                              className={`w-3.5 h-3.5 rounded-sm border flex items-center justify-center bg-white ${
                                rec.dish.isVeg ? 'border-emerald-600' : 'border-rose-600'
                              }`}
                            >
                              <span
                                className={`w-1.5 h-1.5 rounded-full ${
                                  rec.dish.isVeg ? 'bg-emerald-600' : 'bg-rose-600'
                                }`}
                              />
                            </span>
                          </div>
                          {rec.dish.isBestseller && (
                            <span className="absolute bottom-1 left-1 px-1 py-0.2 rounded bg-amber-500 text-white text-[9px] font-black uppercase tracking-tight">
                              Best
                            </span>
                          )}
                        </div>

                        {/* Dish Details */}
                        <div className="flex-1 min-w-0">
                          <h5 className="text-sm font-black text-gray-900 leading-snug line-clamp-1">
                            {rec.dish.name}
                          </h5>
                          <p className="text-[11px] font-medium text-gray-500 line-clamp-1">
                            {rec.restaurantName} • <span className="text-gray-400">{rec.localityName}</span>
                          </p>

                          <div className="flex items-center gap-2 mt-1">
                            <span className="text-sm font-black text-gray-900">
                              ₹{rec.price}
                            </span>
                            <span className="inline-flex items-center gap-0.5 text-[10px] font-semibold text-gray-500">
                              <Clock className="w-3 h-3 text-gray-400" />
                              {rec.deliveryTimeMinutes} mins
                            </span>
                          </div>
                        </div>

                        {/* Add to Cart Button */}
                        <button
                          onClick={() => handleAddDish(rec)}
                          className={`flex-shrink-0 px-3 py-2 rounded-xl text-xs font-black transition-all flex items-center gap-1 shadow-sm ${
                            isJustAdded
                              ? 'bg-emerald-600 text-white scale-105'
                              : inCart
                              ? 'bg-rose-50 text-rose-600 border border-rose-300 hover:bg-rose-100'
                              : 'bg-rose-600 text-white hover:bg-rose-700'
                          }`}
                        >
                          {isJustAdded ? (
                            <>
                              <Check className="w-3.5 h-3.5" /> Added!
                            </>
                          ) : inCart ? (
                            <>
                              <Plus className="w-3.5 h-3.5" /> Add More
                            </>
                          ) : (
                            <>
                              <Plus className="w-3.5 h-3.5" /> ADD
                            </>
                          )}
                        </button>
                      </div>

                      {/* Friend's Personal Reasoning */}
                      <div className="bg-amber-50/80 rounded-xl px-2.5 py-1.5 border border-amber-200/60 flex items-start gap-1.5">
                        <span className="text-xs">💡</span>
                        <p className="text-[11px] text-amber-900 font-medium leading-relaxed">
                          <strong className="font-bold text-amber-950">Why Dost picked this:</strong>{' '}
                          {rec.friendReason}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </>
          ) : null}
        </div>

        {/* Footer Actions */}
        <div className="px-4 py-3 bg-white border-t border-gray-100 flex items-center justify-between gap-2">
          <button
            onClick={() => fetchSuggestions(selectedWeather)}
            disabled={loading}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-gray-200 text-gray-700 text-xs font-bold hover:bg-gray-50 transition-colors disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 text-gray-500 ${loading ? 'animate-spin' : ''}`} />
            <span>Ask Dost Again 🎲</span>
          </button>

          {cartItems.length > 0 ? (
            <button
              onClick={() => {
                onClose();
                onOpenCart();
              }}
              className="flex-1 max-w-[200px] flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl bg-gradient-to-r from-rose-600 to-rose-700 text-white text-xs font-black shadow-md hover:from-rose-700 hover:to-rose-800 transition-all"
            >
              <ShoppingBag className="w-4 h-4" />
              <span>View Cart ({cartItems.reduce((acc, it) => acc + it.quantity, 0)})</span>
            </button>
          ) : (
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-gray-100 text-gray-700 text-xs font-bold hover:bg-gray-200 transition-colors"
            >
              Done
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
