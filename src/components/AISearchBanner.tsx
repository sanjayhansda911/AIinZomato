import React from 'react';
import { Sparkles, X, Clock, Plus, Minus, Check, ChevronRight } from 'lucide-react';
import { AISearchResponse, AIMatchedDish, CartItem, Restaurant, MenuItem } from '../types';

interface AISearchBannerProps {
  aiData: AISearchResponse;
  onClear: () => void;
  cartItems: CartItem[];
  onAddToCart: (dish: MenuItem, restaurantId: string, restaurantName: string) => void;
  onUpdateQuantity: (itemId: string, newQty: number) => void;
  onSelectRestaurantById: (restaurantId: string) => void;
}

export const AISearchBanner: React.FC<AISearchBannerProps> = ({
  aiData,
  onClear,
  cartItems,
  onAddToCart,
  onUpdateQuantity,
  onSelectRestaurantById,
}) => {
  const { aiParsed, matchedDishes, source } = aiData;

  const getItemQuantity = (itemId: string) => {
    const itemInCart = cartItems.find(ci => ci.item.id === itemId);
    return itemInCart ? itemInCart.quantity : 0;
  };

  return (
    <div className="mx-4 my-2.5 rounded-2xl bg-gradient-to-br from-rose-50 via-amber-50/40 to-white border border-rose-200/80 shadow-sm overflow-hidden animate-in slide-in-from-top-3 duration-200">
      {/* Banner Header */}
      <div className="p-3.5 pb-2.5 border-b border-rose-100 flex items-start justify-between gap-2">
        <div className="flex items-start gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-rose-600 to-red-500 text-white flex items-center justify-center shadow-md shadow-rose-600/30 flex-shrink-0 mt-0.5">
            <Sparkles className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="text-xs font-black text-slate-900 tracking-tight">
                AI Natural Language Search
              </span>
              <span className="text-[9px] font-mono font-black uppercase px-1.5 py-0.2 rounded bg-rose-600 text-white shadow-xs">
                {source === 'gemini-3.8-flash' ? 'Gemini 3.8 Flash' : 'NLP Intelligence'}
              </span>
            </div>
            <p className="text-[11px] text-slate-700 mt-1 font-medium leading-snug">
              {aiParsed.aiExplanation}
            </p>
          </div>
        </div>

        <button
          onClick={onClear}
          className="p-1 rounded-full text-slate-400 hover:text-slate-700 hover:bg-rose-100 transition-colors flex-shrink-0"
          title="Clear AI Search"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Suggested Filter Badges */}
      {aiParsed.suggestedTags && aiParsed.suggestedTags.length > 0 && (
        <div className="px-3.5 pt-2 flex items-center gap-1.5 overflow-x-auto no-scrollbar">
          {aiParsed.suggestedTags.map(tag => (
            <span
              key={tag}
              className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-white border border-rose-200 text-rose-800 shadow-xs whitespace-nowrap"
            >
              {tag}
            </span>
          ))}
          {aiParsed.dietary && (
            <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-300 uppercase whitespace-nowrap">
              {aiParsed.dietary}
            </span>
          )}
        </div>
      )}

      {/* Matched Dishes Horizontal Carousel */}
      <div className="p-3.5 pt-2.5">
        <div className="flex items-center justify-between mb-2">
          <span className="text-[11px] font-black text-slate-800 uppercase tracking-wider">
            Matched Hyderabad Dishes ({matchedDishes.length})
          </span>
          <span className="text-[10px] text-slate-500 font-semibold">
            Swipe right 👉
          </span>
        </div>

        {matchedDishes.length === 0 ? (
          <div className="text-center py-4 bg-white rounded-xl border border-dashed border-zinc-200">
            <p className="text-xs text-slate-500 font-semibold">
              No dishes found within criteria. Try expanding budget or relaxing dietary filter.
            </p>
          </div>
        ) : (
          <div className="flex gap-3 overflow-x-auto no-scrollbar pb-1">
            {matchedDishes.map(m => {
              const qty = getItemQuantity(m.dish.id);
              return (
                <div
                  key={`${m.restaurantId}-${m.dish.id}`}
                  className="w-56 bg-white rounded-2xl border border-zinc-100 shadow-sm hover:shadow-md transition-all flex flex-col flex-shrink-0 overflow-hidden"
                >
                  {/* Dish Hero Image */}
                  <div className="relative h-28 w-full bg-zinc-200 overflow-hidden">
                    <img
                      src={m.dish.imageUrl}
                      alt={m.dish.name}
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent"></div>

                    {/* Veg / Non-Veg Indicator */}
                    <div className="absolute top-2 left-2 z-10 bg-white/90 backdrop-blur-sm p-1 rounded-md shadow">
                      {m.dish.isVeg ? (
                        <span className="food-veg-symbol scale-75 block"></span>
                      ) : (
                        <span className="food-nonveg-symbol scale-75 block"></span>
                      )}
                    </div>

                    {/* Price Badge */}
                    <div className="absolute bottom-2 left-2 bg-slate-900/90 backdrop-blur-sm text-white text-xs font-black px-2 py-0.5 rounded-lg shadow">
                      ₹{m.dish.price}
                    </div>

                    {/* ETA Badge */}
                    <div className="absolute top-2 right-2 bg-white/90 backdrop-blur-sm text-slate-800 text-[10px] font-bold px-1.5 py-0.5 rounded-md flex items-center gap-1 shadow">
                      <Clock className="w-2.5 h-2.5 text-slate-500" />
                      <span>{m.deliveryTimeMinutes}m</span>
                    </div>
                  </div>

                  {/* Card Content */}
                  <div className="p-2.5 flex-1 flex flex-col justify-between">
                    <div>
                      <h4 className="font-extrabold text-xs text-slate-900 line-clamp-1 leading-snug">
                        {m.dish.name}
                      </h4>

                      <button
                        onClick={() => onSelectRestaurantById(m.restaurantId)}
                        className="text-[10px] font-bold text-rose-600 hover:underline flex items-center gap-0.5 mt-0.5 truncate text-left"
                      >
                        <span className="truncate">{m.restaurantName}</span>
                        <ChevronRight className="w-2.5 h-2.5 flex-shrink-0" />
                      </button>

                      {/* Match Tags */}
                      <div className="mt-1.5 flex flex-wrap gap-1">
                        {m.matchTags.map(tag => (
                          <span
                            key={tag}
                            className="text-[9px] font-bold px-1.5 py-0.2 rounded bg-zinc-100 text-slate-600"
                          >
                            {tag}
                          </span>
                        ))}
                      </div>
                    </div>

                    {/* 1-Tap ADD Button or Quantity Stepper */}
                    <div className="mt-2.5 pt-2 border-t border-zinc-100 flex items-center justify-between">
                      <span className="text-[10px] text-slate-400 font-medium">
                        {m.localityName.split('&')[0]}
                      </span>

                      {qty > 0 ? (
                        <div className="flex items-center gap-1.5 bg-rose-50 border border-rose-200 text-rose-600 rounded-lg px-2 py-0.5 text-xs font-black">
                          <button
                            onClick={() => onUpdateQuantity(m.dish.id, qty - 1)}
                            className="p-0.5 hover:bg-rose-100 rounded"
                          >
                            <Minus className="w-3 h-3" />
                          </button>
                          <span className="w-3 text-center">{qty}</span>
                          <button
                            onClick={() => onUpdateQuantity(m.dish.id, qty + 1)}
                            className="p-0.5 hover:bg-rose-100 rounded"
                          >
                            <Plus className="w-3 h-3" />
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => onAddToCart(m.dish, m.restaurantId, m.restaurantName)}
                          className="bg-rose-600 hover:bg-rose-700 text-white font-extrabold text-[11px] px-3 py-1 rounded-lg shadow-sm shadow-rose-600/20 active:scale-95 transition-all"
                        >
                          + ADD
                        </button>
                      )}
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
