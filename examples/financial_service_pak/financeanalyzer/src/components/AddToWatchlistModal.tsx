import React, { useState } from 'react';
import { X, Star } from 'lucide-react';
import { PAKISTANI_STOCKS, Stock } from '../lib/stocks';
import { supabase } from '../lib/supabase';

interface AddToWatchlistModalProps {
  isOpen: boolean;
  onClose: () => void;
  onStockAdded: () => void;
}

export function AddToWatchlistModal({ isOpen, onClose, onStockAdded }: AddToWatchlistModalProps) {
  const [selectedStock, setSelectedStock] = useState<Stock | null>(null);
  const [notes, setNotes] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedStock) return;

    setIsLoading(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error('Not authenticated');

      const { error } = await supabase
        .from('watchlist')
        .insert([
          {
            user_id: session.user.id,
            symbol: selectedStock.symbol,
            notes: notes.trim() || null,
          },
        ]);

      if (error) throw error;
      onStockAdded();
      onClose();
    } catch (error) {
      console.error('Error adding to watchlist:', error);
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-900 rounded-xl shadow-xl max-w-md w-full mx-4 p-6 relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
        >
          <X className="w-5 h-5" />
        </button>

        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">Add to Watchlist</h2>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Select Stock
            </label>
            <select
              value={selectedStock?.symbol || ''}
              onChange={(e) => {
                const stock = PAKISTANI_STOCKS.find(s => s.symbol === e.target.value);
                setSelectedStock(stock || null);
              }}
              className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">Select a stock...</option>
              {PAKISTANI_STOCKS.map((stock) => (
                <option key={stock.symbol} value={stock.symbol}>
                  {stock.symbol} - {stock.name}
                </option>
              ))}
            </select>
          </div>

          {selectedStock && (
            <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
              <h3 className="font-medium text-gray-900 dark:text-white">{selectedStock.name}</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">{selectedStock.sector}</p>
              <p className="text-sm text-gray-500 dark:text-gray-500 mt-1">{selectedStock.description}</p>
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Notes (Optional)
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Add any notes about why you're watching this stock..."
              className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              rows={3}
            />
          </div>

          <div className="flex justify-end gap-4">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isLoading || !selectedStock}
              className="px-4 py-2 bg-gradient-to-r from-yellow-500 to-orange-500 dark:from-yellow-400 dark:to-orange-400 text-white rounded-lg hover:from-yellow-600 hover:to-orange-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 flex items-center gap-2"
            >
              <Star className="w-4 h-4" />
              {isLoading ? 'Adding...' : 'Add to Watchlist'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
} 