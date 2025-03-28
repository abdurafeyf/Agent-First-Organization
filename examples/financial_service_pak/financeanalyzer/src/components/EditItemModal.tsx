import React, { useState } from 'react';
import { X, Trash2, Save } from 'lucide-react';
import { supabase } from '../lib/supabase';

interface EditItemModalProps {
  isOpen: boolean;
  onClose: () => void;
  onItemUpdated: () => void;
  item: {
    symbol: string;
    quantity?: number;
    average_price?: number;
    notes?: string;
  };
  type: 'portfolio' | 'watchlist';
}

export function EditItemModal({ isOpen, onClose, onItemUpdated, item, type }: EditItemModalProps) {
  const [quantity, setQuantity] = useState(item.quantity?.toString() || '');
  const [averagePrice, setAveragePrice] = useState(item.average_price?.toString() || '');
  const [notes, setNotes] = useState(item.notes || '');
  const [isLoading, setIsLoading] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      if (type === 'portfolio') {
        const { error } = await supabase
          .from('portfolios')
          .update({
            quantity: parseInt(quantity),
            average_price: parseFloat(averagePrice),
          })
          .eq('symbol', item.symbol);

        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('watchlist')
          .update({
            notes,
          })
          .eq('symbol', item.symbol);

        if (error) throw error;
      }

      onItemUpdated();
      onClose();
    } catch (error) {
      console.error('Error updating item:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete this item?')) return;

    setIsLoading(true);

    try {
      const { error } = await supabase
        .from(type)
        .delete()
        .eq('symbol', item.symbol);

      if (error) throw error;

      onItemUpdated();
      onClose();
    } catch (error) {
      console.error('Error deleting item:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-md p-6 relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-500 hover:text-gray-700"
        >
          <X className="w-5 h-5" />
        </button>

        <h2 className="text-xl font-semibold text-gray-900 mb-4">
          Edit {type === 'portfolio' ? 'Portfolio' : 'Watchlist'} Item
        </h2>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Symbol
            </label>
            <input
              type="text"
              value={item.symbol}
              disabled
              className="input bg-gray-50"
            />
          </div>

          {type === 'portfolio' ? (
            <>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Quantity
                </label>
                <input
                  type="number"
                  value={quantity}
                  onChange={(e) => setQuantity(e.target.value)}
                  className="input"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Average Price (PKR)
                </label>
                <input
                  type="number"
                  value={averagePrice}
                  onChange={(e) => setAveragePrice(e.target.value)}
                  className="input"
                  required
                />
              </div>
            </>
          ) : (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Notes
              </label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="input min-h-[100px] resize-none"
                placeholder="Add notes about this stock..."
              />
            </div>
          )}

          <div className="flex gap-3 pt-4">
            <button
              type="submit"
              disabled={isLoading}
              className="btn flex-1 flex items-center justify-center gap-2"
            >
              {isLoading ? (
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <Save className="w-5 h-5" />
              )}
              Save Changes
            </button>

            <button
              type="button"
              onClick={handleDelete}
              disabled={isLoading}
              className="btn bg-red-500 hover:bg-red-600 flex items-center justify-center gap-2"
            >
              <Trash2 className="w-5 h-5" />
              Delete
            </button>
          </div>
        </form>
      </div>
    </div>
  );
} 