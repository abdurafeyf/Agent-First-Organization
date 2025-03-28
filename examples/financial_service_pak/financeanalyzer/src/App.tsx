import React, { useState, useRef, useEffect } from 'react';
import { Send, Bot, User, LineChart, Star, LogOut, Moon, Sun, Plus, Bell } from 'lucide-react';
import { supabase } from './lib/supabase';
import { AuthModal } from './components/AuthModal';
import { AddStockModal } from './components/AddStockModal';
import { AddToWatchlistModal } from './components/AddToWatchlistModal';
import { NotificationsPanel } from './components/NotificationsPanel';
import { getCurrentUser, signOut } from './lib/auth';
import { EditItemModal } from './components/EditItemModal';
import { StockDetailsModal } from './components/StockDetailsModal';

interface Message {
  content: string;
  role: 'user' | 'assistant';
  timestamp: Date;
}

interface Portfolio {
  symbol: string;
  quantity: number;
  average_price: number;
}

interface WatchlistItem {
  symbol: string;
  notes: string | null;
}

function App() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [portfolio, setPortfolio] = useState<Portfolio[]>([]);
  const [watchlist, setWatchlist] = useState<WatchlistItem[]>([]);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [isAddStockModalOpen, setIsAddStockModalOpen] = useState(false);
  const [isAddWatchlistModalOpen, setIsAddWatchlistModalOpen] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [isDarkMode, setIsDarkMode] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<any>(null);
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<any>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    checkUser();
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      if (session?.user) {
        fetchUserData();
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [isDarkMode]);

  const checkUser = async () => {
    try {
      const user = await getCurrentUser();
      setUser(user);
      if (user) {
        fetchUserData();
      }
    } catch (error) {
      console.error('Error checking user:', error);
    }
  };

  const fetchUserData = async () => {
    const { data: portfolioData } = await supabase
      .from('portfolios')
      .select('symbol, quantity, average_price');
    
    const { data: watchlistData } = await supabase
      .from('watchlist')
      .select('symbol, notes');

    if (portfolioData) setPortfolio(portfolioData);
    if (watchlistData) setWatchlist(watchlistData);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || !user) return;
  
    const userMessage: Message = {
      content: input,
      role: 'user',
      timestamp: new Date(),
    };
  
    // Append the user's message to the chat history
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);
  
    try {
      // Send request to the local /chat endpoint
      const response = await fetch('http://127.0.0.1:8000/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        // Here we send the text and the current chat history (excluding the new message, if desired)
        body: JSON.stringify({
          text: input,
          history: messages,
          parameters: {}, // Include any additional parameters if needed
          // Optionally add "tools" and "workers" if your server expects these fields:
          // tools: [...],
          // workers: [...],
        }),
      });
  
      if (!response.ok) {
        const errorData = await response.json().catch(() => null);
        console.error('Local API Error:', {
          status: response.status,
          statusText: response.statusText,
          error: errorData,
        });
        throw new Error(`Failed to get response from local API: ${response.status} ${response.statusText}`);
      }
  
      const data = await response.json();
      console.log('Local API Response:', data);
  
      const assistantMessage: Message = {
        content: data.answer || "I apologize, but I'm unable to process your request at the moment.",
        role: 'assistant',
        timestamp: new Date(),
      };
  
      setMessages(prev => [...prev, assistantMessage]);
    } catch (error) {
      console.error('Error details:', error);
      const errorMessage: Message = {
        content: "I apologize, but I'm unable to process your request at the moment. Please try again later.",
        role: 'assistant',
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };
  

  const handleSignOut = async () => {
    try {
      await signOut();
      setMessages([]);
      setPortfolio([]);
      setWatchlist([]);
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  const handleStockAdded = async () => {
    await fetchUserData();
  };

  const handleFileUpload = async (file: File) => {
    if (!user) return;

    setIsLoading(true);

    try {
      // Read file content
      const fileContent = await file.text();

      const userMessage: Message = {
        content: `[File Uploaded] ${file.name}`,
        role: 'user',
        timestamp: new Date(),
      };

      setMessages(prev => [...prev, userMessage]);

      // Send to OpenAI for analysis
      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${import.meta.env.VITE_OPENAI_API_KEY}`,
        },
        body: JSON.stringify({
          model: 'gpt-4-turbo-preview',
          messages: [
            {
              role: 'system',
              content: 'You are a financial document analyzer. Analyze the given document and provide insights about financial data, market trends, or investment opportunities mentioned in it.'
            },
            {
              role: 'user',
              content: `Please analyze this document titled "${file.name}":\n\n${fileContent}`
            }
          ],
          temperature: 0.7,
          max_tokens: 1000,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to analyze document');
      }

      const data = await response.json();
      
      const assistantMessage: Message = {
        content: data.choices[0].message.content,
        role: 'assistant',
        timestamp: new Date(),
      };

      setMessages(prev => [...prev, assistantMessage]);
    } catch (error) {
      console.error('Error analyzing file:', error);
      const errorMessage: Message = {
        content: "I apologize, but I'm unable to analyze this document at the moment. Please try again later.",
        role: 'assistant',
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleEditItem = (item: any, type: 'portfolio' | 'watchlist') => {
    setEditingItem({ ...item, type });
    setIsEditModalOpen(true);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-800 transition-colors duration-300">
      {/* Header */}
      <header className="bg-slate-800/95 backdrop-blur-sm shadow-lg sticky top-0 z-10 border-b border-slate-700">
        <div className="max-w-5xl mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center gap-8">
            <div>
              <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent">
                Marfyy
              </h1>
              <p className="text-xs text-slate-400 mt-1">AI Agent built using Arklex</p>
            </div>
            <nav className="hidden md:flex items-center gap-6">
              <a href="#" className="text-sm font-medium text-slate-300 hover:text-white transition-colors relative group">
                Dashboard
                <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-blue-400 group-hover:w-full transition-all duration-300"></span>
              </a>
              <a href="#" className="text-sm font-medium text-slate-300 hover:text-white transition-colors relative group">
                Market
                <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-blue-400 group-hover:w-full transition-all duration-300"></span>
              </a>
              <a href="#" className="text-sm font-medium text-slate-300 hover:text-white transition-colors relative group">
                News
                <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-blue-400 group-hover:w-full transition-all duration-300"></span>
              </a>
              <a href="#" className="text-sm font-medium text-slate-300 hover:text-white transition-colors relative group">
                Research
                <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-blue-400 group-hover:w-full transition-all duration-300"></span>
              </a>
            </nav>
          </div>
          <div className="flex items-center gap-4">
            {user && <NotificationsPanel />}
            {user ? (
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-slate-700/50 border border-slate-600 shadow-sm hover:shadow-md transition-all duration-200">
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-400/20 to-cyan-400/20 flex items-center justify-center">
                    <span className="text-sm font-medium text-blue-400">
                      {user.email?.[0].toUpperCase()}
                    </span>
                  </div>
                  <span className="text-sm text-slate-300 hidden md:block">{user.email}</span>
                </div>
                <button
                  onClick={handleSignOut}
                  className="btn bg-red-500 hover:bg-red-600 hover:scale-105 transition-all duration-200"
                >
                  <LogOut className="w-4 h-4" />
                  <span className="hidden md:inline">Sign Out</span>
                </button>
              </div>
            ) : (
              <button
                onClick={() => setIsAuthModalOpen(true)}
                className="btn bg-blue-500 hover:bg-blue-600 hover:scale-105 transition-all duration-200"
              >
                Sign In
              </button>
            )}
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-6xl mx-auto p-6">
        {user ? (
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 h-[calc(100vh-5rem)]">
            {/* Sidebar */}
            <div className="lg:col-span-1 space-y-4">
              {/* Portfolio Section */}
              <div className="card p-4 bg-slate-800 border border-slate-700 shadow-sm hover:shadow-md transition-all duration-200 h-[calc(50%-0.5rem)] flex flex-col">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-gradient-to-br from-blue-400/20 to-cyan-400/20 rounded-lg">
                      <LineChart className="w-5 h-5 text-blue-400" />
                    </div>
                    <h2 className="text-lg font-semibold text-white">Your Portfolio</h2>
                  </div>
                  <button
                    onClick={() => setIsAddStockModalOpen(true)}
                    className="btn bg-blue-500 hover:bg-blue-600 hover:scale-105 transition-all duration-200"
                  >
                    <Plus className="w-5 h-5" />
                  </button>
                </div>
                <div className="flex-1 overflow-y-auto pr-2 space-y-2">
                  {portfolio.map((item) => (
                    <div 
                      key={item.symbol} 
                      className="group flex items-center justify-between p-3 rounded-lg bg-slate-700/50 border border-slate-600 hover:border-slate-500 hover:shadow-sm transition-all duration-200 cursor-pointer"
                      onClick={() => {
                        setSelectedItem({ ...item, type: 'portfolio' });
                        setIsDetailsModalOpen(true);
                      }}
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-400/20 to-cyan-400/20 flex items-center justify-center">
                          <span className="text-sm font-medium text-blue-400">{item.symbol}</span>
                        </div>
                        <div>
                          <span className="text-sm font-medium text-white block">{item.quantity} shares</span>
                          <span className="text-xs text-slate-400">{item.average_price.toLocaleString()} PKR</span>
                        </div>
                      </div>
                      <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                        <div className="w-6 h-6 rounded-full bg-slate-600 flex items-center justify-center shadow-sm">
                          <svg className="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                          </svg>
                        </div>
                      </div>
                    </div>
                  ))}
                  {portfolio.length === 0 && (
                    <p className="text-sm text-slate-400 text-center py-4">No stocks in portfolio</p>
                  )}
                </div>
              </div>

              {/* Watchlist Section */}
              <div className="card p-4 bg-slate-800 border border-slate-700 shadow-sm hover:shadow-md transition-all duration-200 h-[calc(50%-0.5rem)] flex flex-col">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-gradient-to-br from-purple-400/20 to-pink-400/20 rounded-lg">
                      <Star className="w-5 h-5 text-purple-400" />
                    </div>
                    <h2 className="text-lg font-semibold text-white">Watchlist</h2>
                  </div>
                  <button
                    onClick={() => setIsAddWatchlistModalOpen(true)}
                    className="btn bg-purple-500 hover:bg-purple-600 hover:scale-105 transition-all duration-200"
                  >
                    <Plus className="w-5 h-5" />
                  </button>
                </div>
                <div className="flex-1 overflow-y-auto pr-2 space-y-2">
                  {watchlist.map((item) => (
                    <div 
                      key={item.symbol} 
                      className="group flex items-center justify-between p-3 rounded-lg bg-slate-700/50 border border-slate-600 hover:border-slate-500 hover:shadow-sm transition-all duration-200 cursor-pointer"
                      onClick={() => {
                        setSelectedItem({ ...item, type: 'watchlist' });
                        setIsDetailsModalOpen(true);
                      }}
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-purple-400/20 to-pink-400/20 flex items-center justify-center">
                          <span className="text-sm font-medium text-purple-400">{item.symbol}</span>
                        </div>
                        <div>
                          <span className="text-sm font-medium text-white block">{item.symbol}</span>
                          {item.notes && (
                            <span className="text-xs text-slate-400 line-clamp-1">{item.notes}</span>
                          )}
                        </div>
                      </div>
                      <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                        <div className="w-6 h-6 rounded-full bg-slate-600 flex items-center justify-center shadow-sm">
                          <svg className="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                          </svg>
                        </div>
                      </div>
                    </div>
                  ))}
                  {watchlist.length === 0 && (
                    <p className="text-sm text-slate-400 text-center py-4">No stocks in watchlist</p>
                  )}
                </div>
              </div>
            </div>

            {/* Chat Container */}
            <div className="lg:col-span-3 h-full">
              <div className="card h-full flex flex-col bg-slate-800 border border-slate-700 shadow-sm hover:shadow-md transition-all duration-200">
                {/* Messages */}
                <div className="flex-1 p-6 overflow-y-auto">
                  {messages.length === 0 && (
                    <div className="text-center text-slate-400 mt-12">
                      <div className="w-16 h-16 mx-auto mb-6 bg-gradient-to-br from-blue-400/20 to-cyan-400/20 rounded-full flex items-center justify-center animate-pulse">
                        <Bot className="w-8 h-8 text-blue-400" />
                      </div>
                      <p className="text-xl font-medium text-white">Welcome to Marfyy!</p>
                      <p className="mt-3 text-slate-400">Ask me about market trends, investment strategies, or specific companies.</p>
                    </div>
                  )}
                  
                  {messages.map((message, index) => (
                    <div
                      key={index}
                      className={`flex items-start gap-3 mb-6 animate-fade-in ${
                        message.role === 'user' ? 'flex-row-reverse' : ''
                      }`}
                    >
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                        message.role === 'user' 
                          ? 'bg-gradient-to-br from-blue-400/20 to-cyan-400/20' 
                          : 'bg-slate-700/50'
                      }`}>
                        {message.role === 'user' ? (
                          <User className="w-6 h-6 text-blue-400" />
                        ) : (
                          <Bot className="w-6 h-6 text-slate-400" />
                        )}
                      </div>
                      <div className={`max-w-[80%] rounded-2xl px-4 py-3 ${
                        message.role === 'user' 
                          ? 'bg-gradient-to-r from-blue-500 to-cyan-500 text-white' 
                          : 'bg-slate-700/50 text-white'
                      }`}>
                        <p className="text-sm leading-relaxed">{message.content}</p>
                        <span className="text-xs mt-1 block opacity-70">
                          {message.timestamp.toLocaleTimeString()}
                        </span>
                      </div>
                    </div>
                  ))}
                  <div ref={messagesEndRef} />
                </div>

                {/* Input Form */}
                <form onSubmit={handleSubmit} className="p-4 border-t border-slate-700">
                  <div className="flex flex-col gap-3">
                    <div className="flex gap-4">
                      <input
                        type="text"
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        placeholder="Ask about stocks, market trends, or investment advice..."
                        className="input flex-1 bg-slate-700/50 border-slate-600 text-white placeholder-slate-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                        disabled={isLoading}
                      />
                      <button
                        type="submit"
                        disabled={isLoading}
                        className="btn bg-blue-500 hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 hover:scale-105 transition-all duration-200"
                      >
                        {isLoading ? (
                          <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        ) : (
                          <Send className="w-5 h-5" />
                        )}
                        Send
                      </button>
                    </div>
                    <div className="flex items-center gap-2">
                      <label className="flex items-center gap-2 text-sm text-slate-400 cursor-pointer hover:text-slate-300 transition-colors">
                        <input
                          type="file"
                          className="hidden"
                          accept=".pdf,.doc,.docx,.txt,.csv,.xlsx"
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) {
                              handleFileUpload(file);
                            }
                          }}
                        />
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
                        </svg>
                        Attach File
                      </label>
                      <span className="text-xs text-slate-500">(PDF, DOC, TXT, CSV, XLSX)</span>
                    </div>
                  </div>
                </form>
              </div>
            </div>
          </div>
        ) : (
          <div className="text-center py-12">
            <div className="w-20 h-20 mx-auto mb-6 bg-gradient-to-br from-blue-400/20 to-cyan-400/20 rounded-full flex items-center justify-center animate-pulse">
              <Bot className="w-10 h-10 text-blue-400" />
            </div>
            <h2 className="text-2xl font-bold bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent mb-4">Welcome to Marfyy</h2>
            <p className="text-slate-400 mb-8">Sign in to get personalized financial advice and market insights.</p>
            <button
              onClick={() => setIsAuthModalOpen(true)}
              className="btn bg-blue-500 hover:bg-blue-600 hover:scale-105 transition-all duration-200"
            >
              Get Started
            </button>
          </div>
        )}
      </main>

      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
      />

      <AddStockModal
        isOpen={isAddStockModalOpen}
        onClose={() => setIsAddStockModalOpen(false)}
        onStockAdded={handleStockAdded}
      />

      <AddToWatchlistModal
        isOpen={isAddWatchlistModalOpen}
        onClose={() => setIsAddWatchlistModalOpen(false)}
        onStockAdded={handleStockAdded}
      />

      {editingItem && (
        <EditItemModal
          isOpen={isEditModalOpen}
          onClose={() => {
            setIsEditModalOpen(false);
            setEditingItem(null);
          }}
          onItemUpdated={handleStockAdded}
          item={editingItem}
          type={editingItem.type}
        />
      )}

      {selectedItem && (
        <StockDetailsModal
          isOpen={isDetailsModalOpen}
          onClose={() => {
            setIsDetailsModalOpen(false);
            setSelectedItem(null);
          }}
          onEdit={() => {
            setIsDetailsModalOpen(false);
            handleEditItem(selectedItem, selectedItem.type);
          }}
          item={selectedItem}
          type={selectedItem.type}
        />
      )}
    </div>
  );
}

export default App;