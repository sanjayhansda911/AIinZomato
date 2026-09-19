import React from 'react';
import { AlertCircle, Trash2, X } from 'lucide-react';
import { MenuItem, Restaurant } from '../types';

interface CartConflictModalProps {
  conflict: {
    existingRestaurantName: string;
    newItem: MenuItem;
    newRestaurant: Restaurant;
  } | null;
  onConfirmDiscard: () => void;
  onCancel: () => void;
}

export const CartConflictModal: React.FC<CartConflictModalProps> = ({
  conflict,
  onConfirmDiscard,
  onCancel,
}) => {
  if (!conflict) return null;

  return (
    <div className="absolute inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-end justify-center animate-in fade-in duration-150">
      <div className="bg-white w-full rounded-t-3xl p-5 shadow-2xl animate-in slide-in-from-bottom-4 duration-200">
        
        {/* Header with Warning Icon */}
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center flex-shrink-0 border border-amber-200">
              <AlertCircle className="w-5 h-5" />
            </div>
            <div>
              <h4 className="font-black text-sm text-slate-900 leading-tight">
                Replace cart items?
              </h4>
              <p className="text-[11px] text-slate-500 mt-0.5">
                Single-restaurant order policy
              </p>
            </div>
          </div>

          <button
            onClick={onCancel}
            className="p-1 text-slate-400 hover:text-slate-600 rounded-full"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Conflict Description */}
        <div className="mt-4 p-3 bg-zinc-50 rounded-2xl border border-zinc-100 text-xs text-slate-700 leading-relaxed">
          Your cart currently contains dishes from <strong className="text-slate-900 font-extrabold">{conflict.existingRestaurantName}</strong>.
          <p className="mt-1 text-slate-500">
            Do you want to discard them and start a fresh order with <strong className="text-rose-600 font-bold">{conflict.newItem.name}</strong> from <strong className="text-slate-900 font-bold">{conflict.newRestaurant.name}</strong>?
          </p>
        </div>

        {/* Action Buttons */}
        <div className="mt-5 grid grid-cols-2 gap-2.5">
          <button
            onClick={onCancel}
            className="py-2.5 rounded-xl border border-zinc-200 text-xs font-bold text-slate-700 hover:bg-zinc-100 active:scale-95 transition-all"
          >
            Cancel
          </button>

          <button
            onClick={onConfirmDiscard}
            className="py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold shadow-md shadow-rose-600/20 active:scale-95 transition-all flex items-center justify-center gap-1.5"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Discard & Add</span>
          </button>
        </div>

      </div>
    </div>
  );
};
