import React, { useState, useEffect } from 'react';
import { X, LineChart, TrendingUp, DollarSign, PieChart, BarChart, Activity, Target, Clock, ArrowUpRight, ArrowDownRight } from 'lucide-react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
} from 'chart.js';
import { Line } from 'react-chartjs-2';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

interface StockDetails {
  symbol: string;
  currentPrice: number;
  change: number;
  changePercent: number;
  volume: number;
  peRatio: number;
  eps: number;
  marketCap: number;
  dayHigh: number;
  dayLow: number;
  openPrice: number;
  previousClose: number;
  fiftyTwoWeekHigh: number;
  fiftyTwoWeekLow: number;
  beta: number;
  dividendYield: number;
  priceHistory: {
    date: string;
    price: number;
  }[];
}

interface StockDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onEdit: () => void;
  item: {
    symbol: string;
    quantity?: number;
    average_price?: number;
    notes?: string;
  };
  type: 'portfolio' | 'watchlist';
}

export function StockDetailsModal({ isOpen, onClose, onEdit, item, type }: StockDetailsModalProps) {
  const [details, setDetails] = useState<StockDetails | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (isOpen) {
      fetchStockDetails();
    }
  }, [isOpen, item.symbol]);

  const fetchStockDetails = async () => {
    setIsLoading(true);
    try {
      // In a real app, this would be an API call to get real stock data
      // For now, we'll use mock data with more realistic values
      const mockDetails: StockDetails = {
        symbol: item.symbol,
        currentPrice: 150.25,
        change: 2.50,
        changePercent: 1.67,
        volume: 1500000,
        peRatio: 25.4,
        eps: 5.92,
        marketCap: 2500000000,
        dayHigh: 152.30,
        dayLow: 149.80,
        openPrice: 150.00,
        previousClose: 147.75,
        fiftyTwoWeekHigh: 165.20,
        fiftyTwoWeekLow: 120.50,
        beta: 1.2,
        dividendYield: 2.5,
        priceHistory: Array.from({ length: 30 }, (_, i) => ({
          date: new Date(Date.now() - (29 - i) * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
          price: 150.25 + (Math.random() - 0.5) * 10
        }))
      };
      setDetails(mockDetails);
    } catch (error) {
      console.error('Error fetching stock details:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const chartData = {
    labels: details?.priceHistory.map(d => d.date) || [],
    datasets: [
      {
        label: 'Price',
        data: details?.priceHistory.map(d => d.price) || [],
        borderColor: 'rgb(59, 130, 246)',
        backgroundColor: 'rgba(59, 130, 246, 0.1)',
        fill: true,
        tension: 0.4,
        pointRadius: 0,
        pointHoverRadius: 6,
        pointHoverBackgroundColor: 'rgb(59, 130, 246)',
        pointHoverBorderColor: '#fff',
        pointHoverBorderWidth: 2
      }
    ]
  };

  const chartOptions = {
    responsive: true,
    animation: {
      duration: 2000
    },
    plugins: {
      legend: {
        display: false
      },
      tooltip: {
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        titleColor: '#fff',
        bodyColor: '#fff',
        padding: 12,
        displayColors: false,
        callbacks: {
          label: function(context: any) {
            return `${context.parsed.y.toFixed(2)} PKR`;
          }
        }
      }
    },
    scales: {
      y: {
        beginAtZero: false,
        grid: {
          display: true,
          color: 'rgba(255, 255, 255, 0.05)'
        },
        ticks: {
          callback: function(value: any) {
            return value.toFixed(2) + ' PKR';
          },
          color: '#94a3b8'
        }
      },
      x: {
        grid: {
          display: false
        },
        ticks: {
          maxRotation: 0,
          autoSkip: true,
          color: '#94a3b8'
        }
      }
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 backdrop-blur-sm">
      <div className="bg-slate-800 rounded-xl shadow-xl max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto transform transition-all duration-300 ease-in-out">
        <div className="p-6">
          <div className="flex justify-between items-start mb-6">
            <div>
              <h2 className="text-2xl font-bold text-white">{item.symbol}</h2>
              <p className="text-sm text-slate-400">
                {type === 'portfolio' ? 'Portfolio Stock' : 'Watchlist Stock'}
              </p>
            </div>
            <button
              onClick={onClose}
              className="text-slate-400 hover:text-slate-300 transition-colors duration-200"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          {isLoading ? (
            <div className="flex justify-center py-8">
              <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
            </div>
          ) : details ? (
            <div className="space-y-6">
              {/* Price Section */}
              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 bg-slate-700/50 rounded-lg border border-slate-600 shadow-sm hover:shadow-md transition-shadow duration-200">
                  <div className="flex items-center gap-2 text-slate-400 mb-1">
                    <DollarSign className="w-4 h-4" />
                    <span className="text-sm">Current Price</span>
                  </div>
                  <div className="text-2xl font-bold text-white">
                    {details.currentPrice.toFixed(2)} PKR
                  </div>
                </div>
                <div className="p-4 bg-slate-700/50 rounded-lg border border-slate-600 shadow-sm hover:shadow-md transition-shadow duration-200">
                  <div className="flex items-center gap-2 text-slate-400 mb-1">
                    <TrendingUp className="w-4 h-4" />
                    <span className="text-sm">Change</span>
                  </div>
                  <div className={`text-2xl font-bold ${details.change >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                    {details.change >= 0 ? '+' : ''}{details.change.toFixed(2)} ({details.changePercent.toFixed(2)}%)
                  </div>
                </div>
              </div>

              {/* Price Chart */}
              <div className="p-4 bg-slate-700/50 rounded-lg border border-slate-600 shadow-sm hover:shadow-md transition-shadow duration-200">
                <h3 className="text-lg font-semibold text-white mb-4">Price History</h3>
                <div className="h-[300px]">
                  <Line data={chartData} options={chartOptions} />
                </div>
              </div>

              {/* Portfolio/Watchlist Specific Info */}
              {type === 'portfolio' && item.quantity && item.average_price && (
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-4 bg-slate-700/50 rounded-lg border border-slate-600 shadow-sm hover:shadow-md transition-shadow duration-200">
                    <div className="text-sm text-slate-400 mb-1">Quantity</div>
                    <div className="text-lg font-semibold text-white">{item.quantity} shares</div>
                  </div>
                  <div className="p-4 bg-slate-700/50 rounded-lg border border-slate-600 shadow-sm hover:shadow-md transition-shadow duration-200">
                    <div className="text-sm text-slate-400 mb-1">Average Price</div>
                    <div className="text-lg font-semibold text-white">{item.average_price.toFixed(2)} PKR</div>
                  </div>
                </div>
              )}

              {/* Trading Info */}
              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 bg-slate-700/50 rounded-lg border border-slate-600 shadow-sm hover:shadow-md transition-shadow duration-200">
                  <div className="flex items-center gap-2 text-slate-400 mb-1">
                    <Activity className="w-4 h-4" />
                    <span className="text-sm">Day Range</span>
                  </div>
                  <div className="text-lg font-semibold text-white">
                    {details.dayLow.toFixed(2)} - {details.dayHigh.toFixed(2)} PKR
                  </div>
                </div>
                <div className="p-4 bg-slate-700/50 rounded-lg border border-slate-600 shadow-sm hover:shadow-md transition-shadow duration-200">
                  <div className="flex items-center gap-2 text-slate-400 mb-1">
                    <Clock className="w-4 h-4" />
                    <span className="text-sm">52 Week Range</span>
                  </div>
                  <div className="text-lg font-semibold text-white">
                    {details.fiftyTwoWeekLow.toFixed(2)} - {details.fiftyTwoWeekHigh.toFixed(2)} PKR
                  </div>
                </div>
              </div>

              {/* Additional Details */}
              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 bg-slate-700/50 rounded-lg border border-slate-600 shadow-sm hover:shadow-md transition-shadow duration-200">
                  <div className="flex items-center gap-2 text-slate-400 mb-1">
                    <BarChart className="w-4 h-4" />
                    <span className="text-sm">Volume</span>
                  </div>
                  <div className="text-lg font-semibold text-white">
                    {details.volume.toLocaleString()}
                  </div>
                </div>
                <div className="p-4 bg-slate-700/50 rounded-lg border border-slate-600 shadow-sm hover:shadow-md transition-shadow duration-200">
                  <div className="flex items-center gap-2 text-slate-400 mb-1">
                    <PieChart className="w-4 h-4" />
                    <span className="text-sm">Market Cap</span>
                  </div>
                  <div className="text-lg font-semibold text-white">
                    {(details.marketCap / 1000000000).toFixed(2)}B PKR
                  </div>
                </div>
              </div>

              {/* Financial Metrics */}
              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 bg-slate-700/50 rounded-lg border border-slate-600 shadow-sm hover:shadow-md transition-shadow duration-200">
                  <div className="text-sm text-slate-400 mb-1">P/E Ratio</div>
                  <div className="text-lg font-semibold text-white">{details.peRatio.toFixed(2)}</div>
                </div>
                <div className="p-4 bg-slate-700/50 rounded-lg border border-slate-600 shadow-sm hover:shadow-md transition-shadow duration-200">
                  <div className="text-sm text-slate-400 mb-1">EPS</div>
                  <div className="text-lg font-semibold text-white">{details.eps.toFixed(2)} PKR</div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 bg-slate-700/50 rounded-lg border border-slate-600 shadow-sm hover:shadow-md transition-shadow duration-200">
                  <div className="text-sm text-slate-400 mb-1">Beta</div>
                  <div className="text-lg font-semibold text-white">{details.beta.toFixed(2)}</div>
                </div>
                <div className="p-4 bg-slate-700/50 rounded-lg border border-slate-600 shadow-sm hover:shadow-md transition-shadow duration-200">
                  <div className="text-sm text-slate-400 mb-1">Dividend Yield</div>
                  <div className="text-lg font-semibold text-white">{details.dividendYield.toFixed(2)}%</div>
                </div>
              </div>

              {/* Notes Section */}
              {item.notes && (
                <div className="p-4 bg-slate-700/50 rounded-lg border border-slate-600 shadow-sm hover:shadow-md transition-shadow duration-200">
                  <div className="text-sm text-slate-400 mb-1">Notes</div>
                  <div className="text-sm text-white">{item.notes}</div>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex gap-4 pt-4">
                <button
                  onClick={onEdit}
                  className="btn bg-blue-500 hover:bg-blue-600 flex-1 hover:scale-105 transition-transform duration-200"
                >
                  Edit {type === 'portfolio' ? 'Position' : 'Watchlist Item'}
                </button>
                <button
                  onClick={onClose}
                  className="btn bg-slate-700 hover:bg-slate-600 flex-1 hover:scale-105 transition-transform duration-200"
                >
                  Close
                </button>
              </div>
            </div>
          ) : (
            <div className="text-center py-8 text-slate-400">
              Failed to load stock details
            </div>
          )}
        </div>
      </div>
    </div>
  );
} 