import React, { useState } from 'react';
import { ShoppingBag, ArrowLeft, Plus, Minus, Tag, Check, Sparkles, MapPin, ShieldCheck, Heart } from 'lucide-react';
import confetti from 'canvas-confetti';
import { CartItem, Locality, Coupon } from '../types';

interface CartDrawerProps {
  items: CartItem[];
  locality: Locality;
  coupons: Coupon[];
  appliedCoupon: string | null;
  onApplyCoupon: (code: string | null) => void;
  onUpdateQuantity: (itemId: string, newQty: number) => void;
  onClose: () => void;
  onPlaceOrder: (notes: string) => Promise<void>;
}

export const CartDrawer: React.FC<CartDrawerProps> = ({
  items,
  locality,
  coupons,
  appliedCoupon,
  onApplyCoupon,
  onUpdateQuantity,
  onClose,
  onPlaceOrder,
}) => {
  const [deliveryNote, setDeliveryNote] = useState<string>('Leave at door');
  const [selectedTip, setSelectedTip] = useState<number>(30);
  const [customCouponInput, setCustomCouponInput] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  const subtotal = items.reduce((sum, ci) => sum + ci.item.price * ci.quantity, 0);

  let discount = 0;
  const activeCouponObj = coupons.find(c => c.code === appliedCoupon);
  if (activeCouponObj && subtotal >= activeCouponObj.minOrder) {
    discount = Math.min(activeCouponObj.maxDiscount, Math.round((subtotal * activeCouponObj.discountPercent) / 100));
  }

  const deliveryFee = appliedCoupon === 'ZOMATOGOLD' || subtotal === 0 ? 0 : locality.deliveryFee;
  const platformFee = subtotal > 0 ? 5 : 0;
  const taxes = Math.round(subtotal * 0.05);
  const grandTotal = Math.max(0, subtotal + deliveryFee + platformFee + taxes + selectedTip - discount);

  const handlePlaceOrderClick = async () => {
    if (items.length === 0) return;
    setIsSubmitting(true);
    try {
      // Fire confetti burst!
      confetti({
        particleCount: 80,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#E23744', '#FFB800', '#24963F', '#ffffff'],
      });
      await onPlaceOrder(deliveryNote);
    } catch (err) {
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (items.length === 0) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-6 text-center bg-white">
        <div className="w-20 h-20 rounded-full bg-rose-50 flex items-center justify-center text-rose-500 mb-3 shadow-inner">
          <ShoppingBag className="w-10 h-10" />
        </div>
        <h3 className="text-base font-black text-slate-900">Your Cart is Empty</h3>
        <p className="text-xs text-slate-500 mt-1 max-w-[240px]">
          Explore Hyderabad’s iconic biryanis, kebabs, and Irani chai from top restaurants.
        </p>
        <button
          onClick={onClose}
          className="mt-5 px-6 py-2.5 bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs rounded-xl shadow-md shadow-rose-600/20 active:scale-95 transition-all"
        >
          Explore Restaurants
        </button>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col bg-zinc-50 overflow-hidden">
      {/* Top Header */}
      <div className="bg-white px-4 py-3 border-b border-zinc-100 flex items-center justify-between sticky top-0 z-20">
        <div className="flex items-center gap-2">
          <button
            onClick={onClose}
            className="w-7 h-7 rounded-full bg-zinc-100 flex items-center justify-center text-slate-600 hover:bg-zinc-200"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div>
            <h3 className="text-xs font-black text-slate-900 leading-none">
              {items[0]?.restaurantName}
            </h3>
            <p className="text-[10px] text-slate-500 mt-0.5 font-medium">
              Delivering in ~{locality.estimatedDeliveryMinutes} mins
            </p>
          </div>
        </div>

        <span className="text-xs font-extrabold text-rose-600 bg-rose-50 px-2 py-0.5 rounded-full border border-rose-100">
          {items.reduce((s, it) => s + it.quantity, 0)} Items
        </span>
      </div>

      {/* Main Cart Items Scrollable View */}
      <div className="flex-1 overflow-y-auto no-scrollbar p-3 space-y-3">
        {/* Hyderabad Delivery Address Card */}
        <div className="bg-white rounded-2xl p-3.5 border border-zinc-100 shadow-sm flex items-start gap-2.5">
          <div className="w-8 h-8 rounded-full bg-rose-50 flex items-center justify-center text-rose-600 flex-shrink-0 mt-0.5">
            <MapPin className="w-4 h-4 fill-rose-600 text-white" />
          </div>
          <div className="flex-1">
            <div className="text-xs font-black text-slate-900 flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <span>Delivery Address</span>
                <span className="text-[9px] bg-rose-100 text-rose-700 px-1.5 py-0.2 rounded font-extrabold uppercase">
                  Hyderabad 🇮🇳
                </span>
              </span>
              <span className="text-[10px] font-bold text-rose-600">Change</span>
            </div>
            <p className="text-[11px] text-slate-700 font-semibold mt-0.5">
              {locality.address}
            </p>

            {/* Delivery Instructions Selector */}
            <div className="mt-2.5 pt-2 border-t border-zinc-100">
              <span className="text-[10px] text-slate-500 font-bold block mb-1">
                Delivery Instructions
              </span>
              <div className="flex flex-wrap gap-1.5">
                {[
                  'Leave at door',
                  'Leave with security',
                  'Call upon arrival',
                  'Avoid ringing bell',
                ].map(instruction => (
                  <button
                    key={instruction}
                    type="button"
                    onClick={() => setDeliveryNote(instruction)}
                    className={`text-[10px] font-bold px-2 py-0.5 rounded-lg border transition-all ${
                      deliveryNote === instruction
                        ? 'bg-rose-50 border-rose-400 text-rose-700 shadow-xs'
                        : 'bg-zinc-50 border-zinc-200 text-slate-600 hover:border-zinc-300'
                    }`}
                  >
                    {deliveryNote === instruction ? '✓ ' : ''}{instruction}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Cart Items List */}
        <div className="bg-white rounded-2xl p-3.5 border border-zinc-100 shadow-sm space-y-3">
          <div className="flex items-center justify-between border-b border-zinc-100 pb-2">
            <h4 className="text-xs font-black text-slate-900">
              Order Items ({items.reduce((s, ci) => s + ci.quantity, 0)})
            </h4>
            <span className="text-[10px] text-slate-400 font-medium">
              From {items[0]?.restaurantName}
            </span>
          </div>

          {items.map(ci => (
            <div key={ci.item.id} className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2 min-w-0">
                {ci.item.isVeg ? (
                  <span className="food-veg-symbol scale-75 flex-shrink-0"></span>
                ) : (
                  <span className="food-nonveg-symbol scale-75 flex-shrink-0"></span>
                )}
                <div className="min-w-0">
                  <div className="text-xs font-bold text-slate-800 truncate">
                    {ci.item.name}
                  </div>
                  <div className="text-[11px] text-slate-500 font-semibold">
                    ₹{ci.item.price} x {ci.quantity} = ₹{ci.item.price * ci.quantity}
                  </div>
                </div>
              </div>

              {/* Quantity Stepper */}
              <div className="flex items-center gap-2 border border-rose-200 rounded-lg px-2 py-0.5 bg-rose-50/50 flex-shrink-0">
                <button
                  onClick={() => onUpdateQuantity(ci.item.id, ci.quantity - 1)}
                  className="text-rose-600 hover:text-rose-800 p-0.5 font-black active:scale-95"
                  title={ci.quantity === 1 ? 'Remove item' : 'Decrease'}
                >
                  <Minus className="w-3 h-3" />
                </button>
                <span className="text-xs font-black text-rose-600 w-3 text-center">
                  {ci.quantity}
                </span>
                <button
                  onClick={() => onUpdateQuantity(ci.item.id, ci.quantity + 1)}
                  className="text-rose-600 hover:text-rose-800 p-0.5 font-black active:scale-95"
                >
                  <Plus className="w-3 h-3" />
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Coupons & Promo Codes Section with Custom Entry */}
        <div className="bg-white rounded-2xl p-3.5 border border-zinc-100 shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <h4 className="text-xs font-black text-slate-900 flex items-center gap-1.5">
              <Tag className="w-3.5 h-3.5 text-rose-600" />
              <span>Coupons & Offers</span>
            </h4>
            {appliedCoupon && (
              <button
                onClick={() => onApplyCoupon(null)}
                className="text-[10px] font-bold text-rose-600 hover:underline"
              >
                Remove ({appliedCoupon})
              </button>
            )}
          </div>

          {/* Custom Coupon Redemption Input Box */}
          <div className="flex items-center gap-2 mb-3">
            <div className="flex-1 relative flex items-center bg-zinc-50 border border-zinc-200 rounded-xl px-2.5 py-1.5 focus-within:border-rose-400 focus-within:bg-white">
              <input
                type="text"
                value={customCouponInput}
                onChange={e => setCustomCouponInput(e.target.value.toUpperCase())}
                placeholder="Enter HYDERABAD50 or ZOMATOGOLD"
                className="w-full text-xs font-mono font-bold uppercase tracking-wider bg-transparent text-slate-800 placeholder-slate-400 focus:outline-none"
              />
              {customCouponInput && (
                <button
                  onClick={() => setCustomCouponInput('')}
                  className="p-0.5 text-slate-400 hover:text-slate-600"
                >
                  <X className="w-3 h-3" />
                </button>
              )}
            </div>
            <button
              onClick={() => {
                const code = customCouponInput.trim().toUpperCase();
                if (!code) return;
                const match = coupons.find(c => c.code === code);
                if (!match) {
                  alert(`Coupon code "${code}" is invalid. Try "HYDERABAD50" or "ZOMATOGOLD".`);
                } else if (subtotal < match.minOrder) {
                  alert(`Add items worth ₹${match.minOrder - subtotal} more to redeem ${match.code} (Min order: ₹${match.minOrder}).`);
                } else {
                  onApplyCoupon(code);
                  setCustomCouponInput('');
                }
              }}
              className="px-3.5 py-2 bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold rounded-xl shadow-xs active:scale-95 transition-all"
            >
              Apply
            </button>
          </div>

          {/* Available Coupon Cards */}
          <div className="space-y-2">
            {coupons.map(coupon => {
              const isApplied = appliedCoupon === coupon.code;
              const isEligible = subtotal >= coupon.minOrder;
              return (
                <div
                  key={coupon.code}
                  onClick={() => {
                    if (isEligible) {
                      onApplyCoupon(isApplied ? null : coupon.code);
                    } else {
                      alert(`Add items worth ₹${coupon.minOrder - subtotal} more to apply ${coupon.code}!`);
                    }
                  }}
                  className={`p-2.5 rounded-xl border flex items-center justify-between transition-all cursor-pointer ${
                    isApplied
                      ? 'bg-emerald-50 border-emerald-400 text-emerald-900 shadow-xs'
                      : isEligible
                      ? 'bg-zinc-50 border-zinc-200 text-slate-800 hover:border-rose-300'
                      : 'bg-zinc-50/60 border-zinc-200 text-slate-400 opacity-70'
                  }`}
                >
                  <div className="min-w-0 pr-2">
                    <div className="flex items-center gap-1.5">
                      <span className="text-xs font-black tracking-wider text-rose-600 font-mono">
                        {coupon.code}
                      </span>
                      {isApplied && (
                        <span className="text-[9px] bg-emerald-600 text-white font-extrabold px-1.5 py-0.2 rounded">
                          APPLIED ✓
                        </span>
                      )}
                    </div>
                    <p className="text-[10px] text-slate-600 mt-0.5">
                      {coupon.description}
                    </p>
                    {!isEligible && (
                      <p className="text-[9px] text-amber-700 font-bold mt-0.5">
                        Add ₹{coupon.minOrder - subtotal} more to unlock
                      </p>
                    )}
                  </div>
                  <div className="text-right flex-shrink-0">
                    <span className={`text-[11px] font-bold ${isApplied ? 'text-emerald-700' : 'text-rose-600'}`}>
                      {isApplied ? 'Applied' : isEligible ? 'Apply' : 'Locked'}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Delivery Partner Tip */}
        <div className="bg-white rounded-2xl p-3.5 border border-zinc-100 shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <h4 className="text-xs font-black text-slate-900 flex items-center gap-1">
              <Heart className="w-3.5 h-3.5 text-rose-500 fill-rose-500" />
              <span>Say thanks with a Tip</span>
            </h4>
            <span className="text-[10px] text-slate-500">100% goes to driver</span>
          </div>
          <div className="grid grid-cols-4 gap-2">
            {[0, 20, 30, 50].map(amt => (
              <button
                key={amt}
                onClick={() => setSelectedTip(amt)}
                className={`py-1.5 text-xs font-bold rounded-xl border transition-all ${
                  selectedTip === amt
                    ? 'bg-rose-50 border-rose-500 text-rose-600 font-black'
                    : 'bg-zinc-50 border-zinc-200 text-slate-700'
                }`}
              >
                {amt === 0 ? 'No Tip' : `₹${amt}`}
              </button>
            ))}
          </div>
        </div>

        {/* Bill Breakdown */}
        <div className="bg-white rounded-2xl p-3.5 border border-zinc-100 shadow-sm space-y-2 text-xs">
          <h4 className="font-black text-slate-900 border-b border-zinc-100 pb-2">
            Bill Details
          </h4>

          <div className="flex justify-between text-slate-600 font-medium">
            <span>Item Total</span>
            <span>₹{subtotal}</span>
          </div>

          <div className="flex justify-between text-slate-600 font-medium">
            <span className="flex items-center gap-1">
              <span>Delivery Partner Fee</span>
              {appliedCoupon === 'ZOMATOGOLD' && (
                <span className="text-[9px] font-bold text-amber-600 bg-amber-50 px-1 rounded">
                  GOLD FREE
                </span>
              )}
            </span>
            <span className={deliveryFee === 0 ? 'text-emerald-600 font-bold' : ''}>
              {deliveryFee === 0 ? 'FREE' : `₹${deliveryFee}`}
            </span>
          </div>

          <div className="flex justify-between text-slate-600 font-medium">
            <span>Platform Fee</span>
            <span>₹{platformFee}</span>
          </div>

          <div className="flex justify-between text-slate-600 font-medium">
            <span>GST & Restaurant Charges (5%)</span>
            <span>₹{taxes}</span>
          </div>

          {selectedTip > 0 && (
            <div className="flex justify-between text-slate-600 font-medium">
              <span>Rider Tip</span>
              <span>₹{selectedTip}</span>
            </div>
          )}

          {discount > 0 && (
            <div className="flex justify-between text-emerald-600 font-bold">
              <span>Coupon Savings ({appliedCoupon})</span>
              <span>-₹{discount}</span>
            </div>
          )}

          <div className="border-t border-zinc-200 pt-2.5 flex justify-between text-sm font-black text-slate-900">
            <span>Grand Total</span>
            <span>₹{grandTotal}</span>
          </div>
        </div>

        {/* Safety & Hygiene guarantee */}
        <div className="p-2.5 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center gap-2 text-emerald-900 text-[11px] font-medium">
          <ShieldCheck className="w-4 h-4 text-emerald-600 flex-shrink-0" />
          <span>FSSAI Certified hygiene kitchens & tamper-proof food packaging</span>
        </div>
      </div>

      {/* Sticky Bottom Place Order Bar */}
      <div className="bg-white p-3.5 border-t border-zinc-200 shadow-xl">
        <div className="flex items-center justify-between gap-3">
          <div>
            <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider block leading-none">
              To Pay
            </span>
            <span className="text-base font-black text-slate-900 mt-0.5 block leading-tight">
              ₹{grandTotal}
            </span>
          </div>

          <button
            onClick={handlePlaceOrderClick}
            disabled={isSubmitting}
            className="flex-1 py-3 rounded-xl bg-gradient-to-r from-rose-600 to-red-600 text-white font-extrabold text-xs tracking-wide shadow-md shadow-rose-600/30 hover:from-rose-500 hover:to-red-500 active:scale-[0.98] transition-all disabled:opacity-50 cursor-pointer text-center"
          >
            {isSubmitting ? 'Placing Order...' : 'Place Order • Pay with UPI / COD'}
          </button>
        </div>
      </div>
    </div>
  );
};
