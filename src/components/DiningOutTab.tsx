import React, { useState } from 'react';
import { Utensils, Star, Calendar, Users, Clock, CheckCircle2, X } from 'lucide-react';
import { Restaurant, Locality } from '../types';

interface DiningOutTabProps {
  restaurants: Restaurant[];
  selectedLocality: Locality;
}

export const DiningOutTab: React.FC<DiningOutTabProps> = ({
  restaurants,
  selectedLocality,
}) => {
  const [selectedDiningRestaurant, setSelectedDiningRestaurant] = useState<Restaurant | null>(null);
  const [guestCount, setGuestCount] = useState<number>(2);
  const [selectedDate, setSelectedDate] = useState<string>('Today, 8:00 PM');
  const [bookingSuccess, setBookingSuccess] = useState<boolean>(false);

  const diningRestaurants = restaurants.filter(r => r.tabTypes.includes('dining'));

  const handleBookTable = (e: React.FormEvent) => {
    e.preventDefault();
    setBookingSuccess(true);
    setTimeout(() => {
      setBookingSuccess(false);
      setSelectedDiningRestaurant(null);
    }, 2800);
  };

  return (
    <div className="pb-8">
      {/* Dining Out Hero Banner */}
      <div className="px-4 py-3">
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-stone-900 via-zinc-800 to-amber-950 p-4 text-white shadow-lg border border-amber-900/40">
          <div className="relative z-10">
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-amber-500/20 text-amber-300 text-[10px] font-extrabold uppercase tracking-wider border border-amber-500/30">
              Royal Nizami Dining
            </span>
            <h2 className="text-lg font-black mt-1 leading-tight tracking-tight">
              Dine Out in Hyderabad
            </h2>
            <p className="text-[11px] text-zinc-300 mt-1">
              Reserve tables at iconic heritage venues, rooftops & royal towers with up to 25% OFF
            </p>
          </div>
          <div className="absolute right-1 -bottom-3 text-7xl select-none opacity-40">
            🏰
          </div>
        </div>
      </div>

      {/* Featured Dining Spots List */}
      <div className="px-4 mt-2">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-black text-slate-900">
            Popular Dining Venues Near {selectedLocality.name}
          </h3>
          <span className="text-[11px] font-semibold text-rose-600">
            {diningRestaurants.length} Places
          </span>
        </div>

        <div className="space-y-4">
          {diningRestaurants.map(rest => (
            <div
              key={rest.id}
              className="bg-white rounded-2xl overflow-hidden border border-zinc-100 shadow-sm hover:shadow-md transition-all"
            >
              <div className="relative h-44 w-full bg-zinc-200">
                <img
                  src={rest.heroImage}
                  alt={rest.name}
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent"></div>

                {/* Rating Badge */}
                <div className="absolute top-3 right-3 bg-emerald-700 text-white text-xs font-bold px-2 py-0.5 rounded-lg flex items-center gap-1 shadow">
                  <span>{rest.rating.toFixed(1)}</span>
                  <Star className="w-3 h-3 fill-white" />
                </div>

                {/* Offer tag */}
                {rest.diningOffer && (
                  <div className="absolute bottom-3 left-3 bg-amber-400 text-slate-950 font-extrabold text-[10px] px-2.5 py-1 rounded-lg shadow">
                    ✨ {rest.diningOffer}
                  </div>
                )}
              </div>

              <div className="p-3">
                <div className="flex items-start justify-between">
                  <div>
                    <h4 className="font-extrabold text-sm text-slate-900">{rest.name}</h4>
                    <p className="text-[11px] text-slate-500">{rest.cuisines.join(', ')}</p>
                  </div>
                  <span className="text-xs font-bold text-slate-700">₹{rest.costForTwo} for 2</span>
                </div>

                <p className="text-[11px] text-slate-600 mt-2 line-clamp-1">
                  📍 {rest.address}
                </p>

                <div className="mt-3 pt-2.5 border-t border-zinc-100 flex items-center justify-between gap-2">
                  <div className="text-[10px] text-slate-500 font-medium">
                    🕒 {rest.openingHours}
                  </div>
                  <button
                    onClick={() => setSelectedDiningRestaurant(rest)}
                    className="bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold px-3.5 py-1.5 rounded-xl shadow-sm active:scale-95 transition-transform"
                  >
                    Book Table
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Book Table Modal */}
      {selectedDiningRestaurant && (
        <div className="absolute inset-0 bg-black/60 backdrop-blur-xs z-50 flex items-end justify-center animate-in fade-in duration-150">
          <div className="bg-white w-full rounded-t-3xl p-5 shadow-2xl animate-in slide-in-from-bottom-6 duration-200">
            <div className="flex items-center justify-between pb-3 border-b border-zinc-100">
              <div>
                <h4 className="font-extrabold text-base text-slate-900">Book a Table</h4>
                <p className="text-xs text-rose-600 font-bold">{selectedDiningRestaurant.name}</p>
              </div>
              <button
                onClick={() => setSelectedDiningRestaurant(null)}
                className="p-1 text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {bookingSuccess ? (
              <div className="py-8 text-center animate-in zoom-in-95 duration-200">
                <CheckCircle2 className="w-12 h-12 text-emerald-600 mx-auto mb-2" />
                <h5 className="font-black text-slate-900 text-base">Table Confirmed!</h5>
                <p className="text-xs text-slate-500 mt-1">
                  Booking for {guestCount} guests reserved at {selectedDiningRestaurant.name}
                </p>
                <div className="mt-3 bg-zinc-100 p-2 rounded-xl text-[11px] font-mono font-bold text-slate-700">
                  Confirmation: #HYD-TBL-{Math.floor(1000 + Math.random() * 9000)}
                </div>
              </div>
            ) : (
              <form onSubmit={handleBookTable} className="mt-4 space-y-4">
                {/* Guest Count */}
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1.5">
                    Number of Guests
                  </label>
                  <div className="grid grid-cols-4 gap-2">
                    {[2, 4, 6, 8].map(num => (
                      <button
                        type="button"
                        key={num}
                        onClick={() => setGuestCount(num)}
                        className={`py-2 text-xs font-bold rounded-xl border transition-all ${
                          guestCount === num
                            ? 'bg-rose-600 text-white border-rose-600 shadow'
                            : 'bg-zinc-50 text-slate-700 border-zinc-200'
                        }`}
                      >
                        {num} Guests
                      </button>
                    ))}
                  </div>
                </div>

                {/* Time Slot */}
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1.5">
                    Preferred Slot
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    {['Today, 1:30 PM (Lunch)', 'Today, 8:00 PM (Dinner)', 'Today, 9:30 PM (Late)', 'Tomorrow, 8:00 PM'].map(slot => (
                      <button
                        type="button"
                        key={slot}
                        onClick={() => setSelectedDate(slot)}
                        className={`p-2 text-left text-[11px] font-bold rounded-xl border transition-all ${
                          selectedDate === slot
                            ? 'bg-rose-50 text-rose-700 border-rose-400'
                            : 'bg-zinc-50 text-slate-700 border-zinc-200'
                        }`}
                      >
                        {slot}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Special perks */}
                <div className="bg-amber-50 p-2.5 rounded-xl border border-amber-200 text-[11px] text-amber-900 font-medium">
                  ✨ Instant reservation guaranteed. No cancellation fee.
                </div>

                <button
                  type="submit"
                  className="w-full py-3 rounded-xl bg-gradient-to-r from-rose-600 to-red-600 text-white text-xs font-bold shadow-md shadow-rose-600/20 active:scale-[0.99] transition-all"
                >
                  Confirm Table Reservation
                </button>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
