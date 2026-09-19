import React, { useState } from 'react';
import { ArrowLeft, Star, Clock, MapPin, Search, Plus, Minus, Sparkles, Check, ArrowRight } from 'lucide-react';
import { Restaurant, MenuItem, CartItem } from '../types';

interface RestaurantDetailModalProps {
  restaurant: Restaurant;
  onClose: () => void;
  cartItems: CartItem[];
  onAddToCart: (item: MenuItem, restaurant: Restaurant) => void;
  onUpdateQuantity: (itemId: string, newQty: number) => void;
  onOpenCart?: () => void;
}

export const RestaurantDetailModal: React.FC<RestaurantDetailModalProps> = ({
  restaurant,
  onClose,
  cartItems,
  onAddToCart,
  onUpdateQuantity,
  onOpenCart,
}) => {
  const [selectedCategory, setSelectedCategory] = useState<string>(
    restaurant.menuCategories[0]?.name || ''
  );
  const [menuSearch, setMenuSearch] = useState<string>('');
  const [vegOnlyFilter, setVegOnlyFilter] = useState<boolean>(false);

  const getItemQuantity = (itemId: string) => {
    const itemInCart = cartItems.find(ci => ci.item.id === itemId);
    return itemInCart ? itemInCart.quantity : 0;
  };

  const totalCartCount = cartItems.reduce((s, it) => s + it.quantity, 0);
  const cartSubtotal = cartItems.reduce((s, it) => s + it.item.price * it.quantity, 0);

  return (
    <div className="absolute inset-0 z-50 bg-white flex flex-col overflow-hidden animate-in slide-in-from-right duration-200">
      {/* Top Header */}
      <div className="sticky top-0 z-20 bg-white/95 backdrop-blur-md px-3 py-2.5 flex items-center justify-between border-b border-zinc-100">
        <button
          onClick={onClose}
          className="w-8 h-8 rounded-full bg-zinc-100 flex items-center justify-center text-slate-700 hover:bg-zinc-200 active:scale-95 transition-all"
        >
          <ArrowLeft className="w-4 h-4" />
        </button>

        <div className="text-center truncate px-2 flex-1">
          <h3 className="font-extrabold text-xs text-slate-900 truncate">{restaurant.name}</h3>
          <p className="text-[10px] text-slate-500 truncate">{restaurant.localityName}</p>
        </div>

        <div className="w-8"></div>
      </div>

      {/* Scrollable Restaurant Content */}
      <div className="flex-1 overflow-y-auto no-scrollbar pb-24">
        {/* Restaurant Hero Info */}
        <div className="p-4 border-b border-zinc-100 bg-gradient-to-b from-zinc-50 to-white">
          <div className="flex items-start justify-between gap-2">
            <div>
              <h2 className="text-lg font-black text-slate-900">{restaurant.name}</h2>
              <p className="text-xs text-slate-500 mt-0.5">{restaurant.cuisines.join(', ')}</p>
              <div className="flex items-center gap-1 text-[11px] text-slate-600 mt-1">
                <MapPin className="w-3 h-3 text-rose-500" />
                <span>{restaurant.address}</span>
              </div>
            </div>

            <div className="text-right flex-shrink-0">
              <div className="inline-flex items-center gap-1 bg-emerald-700 text-white text-xs font-black px-2 py-1 rounded-xl shadow-sm">
                <span>{restaurant.rating.toFixed(1)}</span>
                <Star className="w-3 h-3 fill-white" />
              </div>
              <div className="text-[10px] text-slate-400 mt-1">{restaurant.ratingCount}</div>
            </div>
          </div>

          {/* Delivery stats bar */}
          <div className="mt-3 pt-2.5 border-t border-zinc-200/60 flex items-center justify-between text-xs font-semibold text-slate-700">
            <div className="flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-slate-400" />
              <span>{restaurant.deliveryTimeMinutes} mins</span>
              <span className="text-zinc-300">•</span>
              <span>{restaurant.distanceKm} km away</span>
            </div>
            <div>
              ₹{restaurant.costForTwo} for two
            </div>
          </div>

          {/* Discount Offer Pill */}
          {restaurant.discountOffer && (
            <div className="mt-2.5 bg-rose-50 border border-rose-200 text-rose-800 text-[11px] font-bold p-2 rounded-xl flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-rose-600" />
              <span>{restaurant.discountOffer}</span>
            </div>
          )}
        </div>

        {/* Menu Search & Veg Filter */}
        <div className="p-3 bg-white border-b border-zinc-100 sticky top-0 z-10 flex items-center gap-2">
          <div className="flex-1 relative flex items-center bg-zinc-100 rounded-xl px-2.5 py-1.5 border border-transparent focus-within:border-rose-400 focus-within:bg-white">
            <Search className="w-3.5 h-3.5 text-slate-400 mr-1.5" />
            <input
              type="text"
              value={menuSearch}
              onChange={e => setMenuSearch(e.target.value)}
              placeholder="Search dishes in menu..."
              className="w-full text-xs bg-transparent text-slate-800 placeholder-slate-400 focus:outline-none"
            />
          </div>

          <button
            onClick={() => setVegOnlyFilter(!vegOnlyFilter)}
            className={`flex items-center gap-1 px-2.5 py-1.5 rounded-xl border text-[11px] font-bold transition-all ${
              vegOnlyFilter
                ? 'bg-emerald-50 border-emerald-500 text-emerald-800'
                : 'bg-white border-zinc-200 text-slate-600'
            }`}
          >
            <div className="food-veg-symbol scale-75"></div>
            <span>Veg</span>
          </button>
        </div>

        {/* Menu Categories Horizontal Nav */}
        <div className="flex gap-2 p-3 overflow-x-auto no-scrollbar border-b border-zinc-100 bg-zinc-50/50">
          {restaurant.menuCategories.map(cat => (
            <button
              key={cat.name}
              onClick={() => setSelectedCategory(cat.name)}
              className={`text-[11px] font-bold px-3 py-1 rounded-full whitespace-nowrap transition-all ${
                selectedCategory === cat.name
                  ? 'bg-slate-900 text-white shadow-sm'
                  : 'bg-white text-slate-600 border border-zinc-200'
              }`}
            >
              {cat.name} ({cat.items.length})
            </button>
          ))}
        </div>

        {/* Menu Items List */}
        <div className="divide-y divide-zinc-100">
          {restaurant.menuCategories
            .filter(cat => !selectedCategory || cat.name === selectedCategory)
            .map(cat => (
              <div key={cat.name} className="p-4">
                <h3 className="text-sm font-black text-slate-900 mb-3 flex items-center gap-1.5">
                  <span>{cat.name}</span>
                </h3>

                <div className="space-y-4">
                  {cat.items
                    .filter(item => {
                      if (vegOnlyFilter && !item.isVeg) return false;
                      if (menuSearch) {
                        const q = menuSearch.toLowerCase();
                        return (
                          item.name.toLowerCase().includes(q) ||
                          item.description.toLowerCase().includes(q)
                        );
                      }
                      return true;
                    })
                    .map(item => {
                      const qty = getItemQuantity(item.id);
                      return (
                        <div key={item.id} className="flex items-start justify-between gap-3 pt-2">
                          <div className="flex-1">
                            {/* Veg / Non-Veg Icon & Bestseller */}
                            <div className="flex items-center gap-1.5 mb-1">
                              {item.isVeg ? (
                                <span className="food-veg-symbol"></span>
                              ) : (
                                <span className="food-nonveg-symbol"></span>
                              )}
                              {item.isBestseller && (
                                <span className="text-[9px] font-extrabold bg-amber-100 text-amber-800 px-1.5 py-0.2 rounded uppercase">
                                  Bestseller
                                </span>
                              )}
                            </div>

                            <h4 className="font-bold text-xs text-slate-900">{item.name}</h4>
                            <div className="text-xs font-black text-slate-900 mt-0.5">
                              ₹{item.price}
                            </div>

                            {item.rating && (
                              <div className="flex items-center gap-1 mt-1 text-[10px] text-emerald-700 font-bold">
                                <span>★ {item.rating}</span>
                                <span className="text-slate-400">({item.votes})</span>
                              </div>
                            )}

                            <p className="text-[11px] text-slate-500 mt-1 line-clamp-2 leading-relaxed">
                              {item.description}
                            </p>
                          </div>

                          {/* Item Image with Add / Stepper button */}
                          <div className="relative w-24 flex-shrink-0 flex flex-col items-center">
                            <div className="w-24 h-24 rounded-2xl overflow-hidden bg-zinc-100 shadow-sm border border-zinc-100">
                              <img
                                src={item.imageUrl}
                                alt={item.name}
                                className="w-full h-full object-cover"
                              />
                            </div>

                            {/* Add Button or Quantity Stepper */}
                            <div className="absolute -bottom-2 bg-white rounded-xl shadow-md border border-rose-200 overflow-hidden z-10">
                              {qty > 0 ? (
                                <div className="flex items-center gap-2 px-2 py-1 text-xs font-black text-rose-600">
                                  <button
                                    onClick={() => onUpdateQuantity(item.id, qty - 1)}
                                    className="p-0.5 hover:bg-rose-50 rounded"
                                  >
                                    <Minus className="w-3.5 h-3.5" />
                                  </button>
                                  <span className="w-4 text-center">{qty}</span>
                                  <button
                                    onClick={() => onUpdateQuantity(item.id, qty + 1)}
                                    className="p-0.5 hover:bg-rose-50 rounded"
                                  >
                                    <Plus className="w-3.5 h-3.5" />
                                  </button>
                                </div>
                              ) : (
                                <button
                                  onClick={() => onAddToCart(item, restaurant)}
                                  className="px-4 py-1 text-xs font-extrabold text-rose-600 uppercase tracking-wide hover:bg-rose-50 active:scale-95 transition-all"
                                >
                                  ADD
                                </button>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                </div>
              </div>
            ))}
        </div>
      </div>

      {/* Sticky Bottom View Cart Bar inside phone screen when items are added */}
      {totalCartCount > 0 && (
        <div className="p-3 bg-white/95 backdrop-blur-md border-t border-zinc-200 shadow-xl z-30 animate-in slide-in-from-bottom-2 duration-200">
          <button
            onClick={() => {
              if (onOpenCart) {
                onOpenCart();
              } else {
                onClose();
              }
            }}
            className="w-full flex items-center justify-between py-2.5 px-4 bg-rose-600 hover:bg-rose-700 active:scale-[0.98] text-white rounded-2xl shadow-lg shadow-rose-600/30 transition-all"
          >
            <div className="flex items-center gap-2">
              <span className="bg-white text-rose-600 text-xs font-black w-6 h-6 rounded-full flex items-center justify-center">
                {totalCartCount}
              </span>
              <div className="text-left">
                <span className="text-xs font-black block leading-none">
                  ₹{cartSubtotal}
                </span>
                <span className="text-[10px] text-rose-100 block mt-0.5">
                  Plus taxes & delivery
                </span>
              </div>
            </div>

            <div className="flex items-center gap-1 text-xs font-black tracking-wide">
              <span>View Cart</span>
              <ArrowRight className="w-4 h-4" />
            </div>
          </button>
        </div>
      )}
    </div>
  );
};
