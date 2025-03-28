import React, { useState } from 'react';
import { X } from 'lucide-react';
import { PAKISTANI_STOCKS, Stock } from '../lib/stocks';
import { supabase } from '../lib/supabase';

interface AddStockModalProps {
  isOpen: boolean;
  onClose: () => void;
  onStockAdded: () => void;
}

export function AddStockModal({ isOpen, onClose, onStockAdded }: AddStockModalProps) {
  const [selectedStock, setSelectedStock] = useState<Stock | null>(null);
  const [quantity, setQuantity] = useState<number>(0);
  const [averagePrice, setAveragePrice] = useState<number>(0);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedStock || quantity <= 0 || averagePrice <= 0) return;

    setIsLoading(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error('Not authenticated');

      const { error } = await supabase
        .from('portfolios')
        .insert([
          {
            user_id: session.user.id,
            symbol: selectedStock.symbol,
            quantity,
            average_price: averagePrice,
          },
        ]);

      if (error) throw error;
      onStockAdded();
      onClose();
    } catch (error) {
      console.error('Error adding stock:', error);
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

        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">Add Stock to Portfolio</h2>

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
              Quantity
            </label>
            <input
              type="number"
              min="1"
              value={quantity}
              onChange={(e) => setQuantity(Number(e.target.value))}
              className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Average Price (PKR)
            </label>
            <input
              type="number"
              min="0"
              step="0.01"
              value={averagePrice}
              onChange={(e) => setAveragePrice(Number(e.target.value))}
              className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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
              disabled={isLoading || !selectedStock || quantity <= 0 || averagePrice <= 0}
              className="px-4 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 dark:from-blue-500 dark:to-indigo-500 text-white rounded-lg hover:from-blue-700 hover:to-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
            >
              {isLoading ? 'Adding...' : 'Add to Portfolio'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
} 