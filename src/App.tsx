import React, { useState, useEffect } from 'react';
import { Search, MapPin, Heart, History, LogIn, LogOut, Loader2, Wind, Cloud, Navigation } from 'lucide-react';
import { auth, db, loginWithGoogle, logout } from './firebase';
import { onAuthStateChanged, User } from 'firebase/auth';
import { collection, addDoc, query, where, onSnapshot, deleteDoc, doc, serverTimestamp, orderBy, limit } from 'firebase/firestore';
import axios from 'axios';
import { WeatherData, PollutionData, LocationData, Favorite } from './types';
import { AtmosphericCard } from './components/AtmosphericCard';
import { AtmosphericMap } from './components/Map';
import { motion, AnimatePresence } from 'motion/react';

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [pollution, setPollution] = useState<PollutionData | null>(null);
  const [location, setLocation] = useState<LocationData | null>(null);
  const [favorites, setFavorites] = useState<Favorite[]>([]);
  const [history, setHistory] = useState<any[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (u) => {
      setUser(u);
      if (u) {
        // Fetch favorites
        const qFav = query(collection(db, 'favorites'), where('uid', '==', u.uid));
        const unsubFav = onSnapshot(qFav, (snapshot) => {
          setFavorites(snapshot.docs.map(d => ({ id: d.id, ...d.data() } as Favorite)));
        });

        // Fetch history
        const qHist = query(collection(db, 'searchHistory'), where('uid', '==', u.uid), orderBy('timestamp', 'desc'), limit(5));
        const unsubHist = onSnapshot(qHist, (snapshot) => {
          setHistory(snapshot.docs.map(d => ({ id: d.id, ...d.data() })));
        });

        return () => {
          unsubFav();
          unsubHist();
        };
      } else {
        setFavorites([]);
        setHistory([]);
      }
    });
    return () => unsubscribe();
  }, []);

  const handleSearch = async (e?: React.FormEvent, cityOverride?: string) => {
    e?.preventDefault();
    const queryStr = cityOverride || searchQuery;
    if (!queryStr) return;

    setLoading(true);
    setError(null);
    try {
      const res = await axios.get(`/api/weather?city=${queryStr}`);
      setWeather(res.data.weather);
      setPollution(res.data.pollution);
      setLocation(res.data.location);

      if (user) {
        await addDoc(collection(db, 'searchHistory'), {
          uid: user.uid,
          query: queryStr,
          timestamp: serverTimestamp()
        });
      }
    } catch (err: any) {
      if (err.response?.status === 500 && err.response?.data?.error?.includes("API Key")) {
        setError("OpenWeather API Key is missing. Please add it to your secrets in the AI Studio settings.");
      } else {
        setError(err.response?.data?.error || "Failed to find city. Please check the name.");
      }
    } finally {
      setLoading(false);
    }
  };

  const toggleFavorite = async () => {
    if (!user || !location) return;
    
    const existing = favorites.find(f => f.cityName === location.name);
    if (existing) {
      await deleteDoc(doc(db, 'favorites', existing.id!));
    } else {
      await addDoc(collection(db, 'favorites'), {
        uid: user.uid,
        cityName: location.name,
        lat: location.lat,
        lon: location.lon,
        createdAt: serverTimestamp()
      });
    }
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-slate-900 font-sans selection:bg-blue-100">
      {/* Navigation */}
      <nav className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center shadow-lg shadow-blue-200">
              <Wind className="text-white w-6 h-6" />
            </div>
            <h1 className="text-xl font-bold tracking-tight text-slate-800 hidden sm:block">Atmospheric Explorer</h1>
          </div>

          <div className="flex items-center gap-4">
            {user ? (
              <div className="flex items-center gap-4">
                <div className="hidden md:block text-right">
                  <p className="text-sm font-semibold text-slate-700">{user.displayName}</p>
                  <p className="text-xs text-slate-400">Traveler</p>
                </div>
                <img src={user.photoURL || ''} alt="Profile" className="w-10 h-10 rounded-full border-2 border-slate-100" />
                <button onClick={logout} className="p-2 text-slate-400 hover:text-red-500 transition-colors">
                  <LogOut className="w-5 h-5" />
                </button>
              </div>
            ) : (
              <button 
                onClick={loginWithGoogle}
                className="flex items-center gap-2 px-5 py-2.5 bg-slate-900 text-white rounded-full font-medium hover:bg-slate-800 transition-all shadow-md active:scale-95"
              >
                <LogIn className="w-4 h-4" />
                Sign In
              </button>
            )}
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-6 py-12 space-y-12">
        {/* Hero Search */}
        <section className="max-w-2xl mx-auto text-center space-y-8">
          <div className="space-y-4">
            <h2 className="text-5xl font-extrabold tracking-tight text-slate-900 leading-tight">
              Explore the Air <br/> <span className="text-blue-600">Before You Travel.</span>
            </h2>
            <p className="text-slate-500 text-lg max-w-lg mx-auto">
              Real-time atmospheric data and air quality insights for over 200,000 cities worldwide.
            </p>
          </div>

          <form onSubmit={handleSearch} className="relative group">
            <div className="absolute inset-y-0 left-6 flex items-center pointer-events-none">
              <Search className="w-5 h-5 text-slate-400 group-focus-within:text-blue-500 transition-colors" />
            </div>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search for a destination (e.g. Tokyo, Paris...)"
              className="w-full pl-14 pr-32 py-5 bg-white border border-slate-200 rounded-3xl shadow-xl shadow-slate-200/50 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-lg"
            />
            <button 
              type="submit"
              disabled={loading}
              className="absolute right-3 top-3 bottom-3 px-8 bg-blue-600 text-white rounded-2xl font-bold hover:bg-blue-700 transition-all disabled:opacity-50 flex items-center gap-2"
            >
              {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Search'}
            </button>
          </form>

          {error && (
            <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-red-500 font-medium text-sm">
              {error}
            </motion.p>
          )}
        </section>

        <div className="grid lg:grid-cols-12 gap-12">
          {/* Left Column: Data & Map */}
          <div className="lg:col-span-8 space-y-12">
            <AnimatePresence mode="wait">
              {weather && pollution && location ? (
                <motion.div
                  key={location.name}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  className="space-y-8"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-slate-400">
                      <MapPin className="w-4 h-4" />
                      <span className="text-sm font-medium uppercase tracking-widest">Current Destination</span>
                    </div>
                    {user && (
                      <button 
                        onClick={toggleFavorite}
                        className={`flex items-center gap-2 px-4 py-2 rounded-full border transition-all ${
                          favorites.find(f => f.cityName === location.name) 
                          ? 'bg-rose-50 border-rose-100 text-rose-500' 
                          : 'bg-white border-slate-200 text-slate-400 hover:border-rose-200 hover:text-rose-400'
                        }`}
                      >
                        <Heart className={`w-4 h-4 ${favorites.find(f => f.cityName === location.name) ? 'fill-current' : ''}`} />
                        <span className="text-sm font-bold">Favorite</span>
                      </button>
                    )}
                  </div>

                  <div className="grid md:grid-cols-2 gap-8">
                    <AtmosphericCard weather={weather} pollution={pollution} />
                    <div className="space-y-6">
                      <AtmosphericMap lat={location.lat} lon={location.lon} cityName={location.name} />
                      <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm">
                        <h4 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-4 flex items-center gap-2">
                          <Navigation className="w-4 h-4" />
                          Travel Insight
                        </h4>
                        <p className="text-slate-600 leading-relaxed">
                          {pollution.main.aqi <= 2 
                            ? "This destination is currently in the 'Atmospheric Safe Zone'. Great for outdoor exploration and long walks." 
                            : "Atmospheric conditions are suboptimal. We recommend planning indoor activities or carrying a protective mask."}
                        </p>
                      </div>
                    </div>
                  </div>
                </motion.div>
              ) : (
                <div className="h-[600px] flex flex-col items-center justify-center text-center space-y-6 bg-white rounded-[40px] border-2 border-dashed border-slate-200">
                  <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center">
                    <Cloud className="w-10 h-10 text-slate-300" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-slate-800">No Destination Selected</h3>
                    <p className="text-slate-400 max-w-xs mx-auto mt-2">Search for a city above to see real-time atmospheric conditions and travel advice.</p>
                  </div>
                </div>
              )}
            </AnimatePresence>
          </div>

          {/* Right Column: Favorites & History */}
          <div className="lg:col-span-4 space-y-12">
            {user ? (
              <>
                {/* Favorites */}
                <section className="space-y-6">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                      <Heart className="w-5 h-5 text-rose-500" />
                      Favorites
                    </h3>
                    <span className="text-xs font-bold text-slate-400 bg-slate-100 px-2 py-1 rounded-md">{favorites.length}</span>
                  </div>
                  <div className="space-y-3">
                    {favorites.length > 0 ? favorites.map(fav => (
                      <button
                        key={fav.id}
                        onClick={() => handleSearch(undefined, fav.cityName)}
                        className="w-full p-4 bg-white rounded-2xl border border-slate-100 shadow-sm hover:shadow-md hover:border-blue-200 transition-all text-left flex items-center justify-between group"
                      >
                        <span className="font-semibold text-slate-700">{fav.cityName}</span>
                        <Navigation className="w-4 h-4 text-slate-300 group-hover:text-blue-500 transition-colors" />
                      </button>
                    )) : (
                      <p className="text-sm text-slate-400 italic">No favorites saved yet.</p>
                    )}
                  </div>
                </section>

                {/* History */}
                <section className="space-y-6">
                  <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                    <History className="w-5 h-5 text-blue-500" />
                    Recent Searches
                  </h3>
                  <div className="space-y-3">
                    {history.map(item => (
                      <button
                        key={item.id}
                        onClick={() => handleSearch(undefined, item.query)}
                        className="w-full flex items-center gap-3 p-3 text-sm text-slate-500 hover:text-blue-600 transition-colors"
                      >
                        <Search className="w-4 h-4 opacity-40" />
                        {item.query}
                      </button>
                    ))}
                  </div>
                </section>
              </>
            ) : (
              <div className="bg-blue-600 rounded-[32px] p-8 text-white space-y-6 shadow-xl shadow-blue-200">
                <h3 className="text-2xl font-bold leading-tight">Save your favorite destinations.</h3>
                <p className="text-blue-100 text-sm leading-relaxed">
                  Sign in to keep track of air quality in your favorite cities and access your search history across devices.
                </p>
                <button 
                  onClick={loginWithGoogle}
                  className="w-full py-4 bg-white text-blue-600 rounded-2xl font-bold hover:bg-blue-50 transition-all shadow-lg"
                >
                  Get Started
                </button>
              </div>
            )}
          </div>
        </div>
      </main>

      <footer className="border-t border-slate-200 py-12 mt-24">
        <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row justify-between items-center gap-8">
          <div className="flex items-center gap-2 opacity-50">
            <Wind className="w-5 h-5" />
            <span className="font-bold">Atmospheric Explorer</span>
          </div>
          <div className="flex gap-8 text-sm font-medium text-slate-400">
            <a href="#" className="hover:text-slate-600">Privacy Policy</a>
            <a href="#" className="hover:text-slate-600">Terms of Service</a>
            <a href="#" className="hover:text-slate-600">API Documentation</a>
          </div>
          <p className="text-sm text-slate-400">© 2026 Atmospheric Explorer. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
