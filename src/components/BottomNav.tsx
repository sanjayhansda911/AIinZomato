import React from 'react';
import { Bike, UtensilsCrossed, Wine, ShoppingBag, ArrowRight } from 'lucide-react';
import { CartItem } from '../types';

interface BottomNavProps {
  activeTab: 'delivery' | 'dining' | 'nightlife' | 'cart';
  onSelectTab: (tab: 'delivery' | 'dining' | 'nightlife' | 'cart') => void;
  cartItems: CartItem[];
  cartTotal: number;
  onOpenCart: () => void;
}

export const BottomNav: React.FC<BottomNavProps> = ({
  activeTab,
  onSelectTab,
  cartItems,
  cartTotal,
  onOpenCart,
}) => {
  const totalQuantity = cartItems.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <div className="sticky bottom-0 z-40 bg-white/95 backdrop-blur-md border-t border-zinc-200">
      {/* Floating Mini Cart Bar when Cart has items and user is on another tab */}
      {totalQuantity > 0 && activeTab !== 'cart' && (
        <div className="px-3 pt-2 pb-1 bg-gradient-to-r from-rose-600 to-rose-700 text-white shadow-lg animate-in slide-in-from-bottom-2 duration-200">
          <button
            onClick={onOpenCart}
            className="w-full flex items-center justify-between py-2 px-3 bg-white/10 hover:bg-white/20 rounded-xl transition-all active:scale-[0.99]"
          >
            <div className="flex items-center gap-2">
              <span className="bg-white text-rose-600 text-[11px] font-black w-5 h-5 rounded-full flex items-center justify-center">
                {totalQuantity}
              </span>
              <div className="text-left">
                <span className="text-xs font-bold block leading-none">
                  ₹{cartTotal}
                </span>
                <span className="text-[10px] text-rose-100 block mt-0.5">
                  Plus taxes & delivery
                </span>
              </div>
            </div>

            <div className="flex items-center gap-1 text-xs font-bold tracking-wide">
              <span>View Cart</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </div>
          </button>
        </div>
      )}

      {/* 4 Core Navigation Tabs */}
      <nav className="flex items-center justify-around px-2 py-1.5 select-none">
        {/* 1. Delivery */}
        <button
          onClick={() => onSelectTab('delivery')}
          className={`flex flex-col items-center justify-center py-1 px-3 rounded-xl transition-all ${
            activeTab === 'delivery'
              ? 'text-rose-600 font-extrabold'
              : 'text-zinc-500 hover:text-zinc-800 font-medium'
          }`}
        >
          <div className="relative">
            <Bike className={`w-5 h-5 transition-transform ${activeTab === 'delivery' ? 'scale-110' : ''}`} />
            {activeTab === 'delivery' && (
              <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-rose-600"></span>
            )}
          </div>
          <span className="text-[10px] mt-1 tracking-tight">Delivery</span>
        </button>

        {/* 2. Dining Out */}
        <button
          onClick={() => onSelectTab('dining')}
          className={`flex flex-col items-center justify-center py-1 px-3 rounded-xl transition-all ${
            activeTab === 'dining'
              ? 'text-rose-600 font-extrabold'
              : 'text-zinc-500 hover:text-zinc-800 font-medium'
          }`}
        >
          <div className="relative">
            <UtensilsCrossed className={`w-5 h-5 transition-transform ${activeTab === 'dining' ? 'scale-110' : ''}`} />
            {activeTab === 'dining' && (
              <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-rose-600"></span>
            )}
          </div>
          <span className="text-[10px] mt-1 tracking-tight">Dining Out</span>
        </button>

        {/* 3. Nightlife */}
        <button
          onClick={() => onSelectTab('nightlife')}
          className={`flex flex-col items-center justify-center py-1 px-3 rounded-xl transition-all ${
            activeTab === 'nightlife'
              ? 'text-rose-600 font-extrabold'
              : 'text-zinc-500 hover:text-zinc-800 font-medium'
          }`}
        >
          <div className="relative">
            <Wine className={`w-5 h-5 transition-transform ${activeTab === 'nightlife' ? 'scale-110' : ''}`} />
            {activeTab === 'nightlife' && (
              <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-rose-600"></span>
            )}
          </div>
          <span className="text-[10px] mt-1 tracking-tight">Nightlife</span>
        </button>

        {/* 4. Cart */}
        <button
          onClick={() => onSelectTab('cart')}
          className={`flex flex-col items-center justify-center py-1 px-3 rounded-xl relative transition-all ${
            activeTab === 'cart'
              ? 'text-rose-600 font-extrabold'
              : 'text-zinc-500 hover:text-zinc-800 font-medium'
          }`}
        >
          <div className="relative">
            <ShoppingBag className={`w-5 h-5 transition-transform ${activeTab === 'cart' ? 'scale-110' : ''}`} />
            {totalQuantity > 0 && (
              <span className="absolute -top-1.5 -right-2 bg-rose-600 text-white font-black text-[9px] w-4 h-4 rounded-full flex items-center justify-center shadow-sm animate-pulse-subtle">
                {totalQuantity}
              </span>
            )}
            {activeTab === 'cart' && (
              <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-rose-600"></span>
            )}
          </div>
          <span className="text-[10px] mt-1 tracking-tight">Cart</span>
        </button>
      </nav>
    </div>
  );
};
