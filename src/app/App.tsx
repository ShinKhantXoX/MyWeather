import { useState, useEffect, useCallback, useRef } from "react";
import type { ReactNode } from "react";
import { motion } from "motion/react";
import {
  Search,
  MapPin,
  Wind,
  Droplets,
  Eye,
  Gauge,
  Key,
  RefreshCw,
  Loader2,
  X,
} from "lucide-react";
import { getWeatherEmoji, updateFavicon, WeatherData } from "../helpers/getWeather";
import { weatherService } from "../helpers/weatherService";

function getWeatherCategory(id: number): string {
  if (id >= 200 && id < 300) return "thunderstorm";
  if (id >= 300 && id < 400) return "drizzle";
  if (id >= 500 && id < 600) return "rain";
  if (id >= 600 && id < 700) return "snow";
  if (id >= 700 && id < 800) return "atmosphere";
  if (id === 800) return "clear";
  return "clouds";
}

const WEATHER_IMAGES: Record<string, string> = {
  thunderstorm: "/thunderstorm.jpg",
  drizzle: "/drizzle.jpg",
  rain: "/rain.jpg",
  snow: "/snow.jpg",
  atmosphere: "/atmosphere.jpg",
  clouds: "/clouds.jpg",
  clear: "/clear.jpg",
};

const WEATHER_OVERLAYS: Record<string, string> = {
  thunderstorm:
    "linear-gradient(160deg, rgba(8,8,20,0.82) 0%, rgba(4,4,14,0.93) 100%)",
  drizzle:
    "linear-gradient(160deg, rgba(18,38,78,0.72) 0%, rgba(10,22,58,0.86) 100%)",
  rain:
    "linear-gradient(160deg, rgba(14,32,68,0.76) 0%, rgba(7,16,46,0.90) 100%)",
  snow:
    "linear-gradient(160deg, rgba(72,96,138,0.52) 0%, rgba(38,58,98,0.68) 100%)",
  atmosphere:
    "linear-gradient(160deg, rgba(44,50,62,0.70) 0%, rgba(22,26,38,0.84) 100%)",
  clouds:
    "linear-gradient(160deg, rgba(36,46,68,0.66) 0%, rgba(18,24,42,0.82) 100%)",
  clear:
    "linear-gradient(160deg, rgba(6,42,92,0.36) 0%, rgba(4,20,54,0.60) 100%)",
};

const THEME = "#B2D5E5";
const THEME_DARK = "#0a1a2e";

function celsiusToFahrenheit(c: number): number {
  return (c * 9) / 5 + 32;
}

function formatTime(ts: number): string {
  return new Date(ts * 1000).toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  });
}

function getWindDir(deg: number): string {
  const dirs = ["N", "NE", "E", "SE", "S", "SW", "W", "NW"];
  return dirs[Math.round(deg / 45) % 8];
}

function getInitialApiKey(): string {
  try {
    const env = (import.meta as any).env?.VITE_OPENWEATHER_API_KEY;
    if (env) return env;
  } catch {}
  return localStorage.getItem("owm_api_key") || "";
}

// ─── Stat Card ────────────────────────────────────────────────────────────────

interface StatCardProps {
  icon: ReactNode;
  label: string;
  value: string;
  sub?: string;
}

function StatCard({ icon, label, value, sub }: StatCardProps) {
  return (
    <div className="flex flex-col items-center gap-1 text-center">
      <div style={{ color: THEME }}>{icon}</div>
      <div
        className="font-semibold text-white leading-tight"
        style={{ fontSize: "clamp(0.85rem, 2.5vw, 1.15rem)", fontVariantNumeric: "tabular-nums" }}
      >
        {value}
      </div>
      {sub && (
        <div
          className="text-white/40 text-xs"
          style={{ fontFamily: "'DM Mono', monospace" }}
        >
          {sub}
        </div>
      )}
      <div className="text-white/45 uppercase tracking-widest" style={{ fontSize: "0.6rem" }}>
        {label}
      </div>
    </div>
  );
}

// ─── Glass Button ─────────────────────────────────────────────────────────────

function GlassBtn({
  onClick,
  children,
  className = "",
}: {
  onClick?: () => void;
  children: ReactNode;
  className?: string;
}) {
  return (
    <button
      onClick={onClick}
      className={`p-2 rounded-full transition-all hover:scale-105 active:scale-95 ${className}`}
      style={{
        background: "rgba(255,255,255,0.10)",
        border: "1px solid rgba(255,255,255,0.18)",
      }}
    >
      {children}
    </button>
  );
}

// ─── App ──────────────────────────────────────────────────────────────────────

export default function App() {
  const [apiKey, setApiKey] = useState<string>(getInitialApiKey);
  const [apiKeyInput, setApiKeyInput] = useState(getInitialApiKey);
  const [showApiModal, setShowApiModal] = useState(false);

  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [searchInput, setSearchInput] = useState("");
  const [showSearch, setShowSearch] = useState(false);
  const [isCelsius, setIsCelsius] = useState(true);

  // Background crossfade state
  const [displayBg, setDisplayBg] = useState(WEATHER_IMAGES.clear);
  const [targetBg, setTargetBg] = useState(WEATHER_IMAGES.clear);
  const [bgOpacity, setBgOpacity] = useState(1);

  const weatherCat = weather?.weather[0]
    ? getWeatherCategory(weather.weather[0].id)
    : "clear";

  const refreshIntervalRef = useRef<number | null>(null);
  const currentLocationRef = useRef<{ lat?: number; lon?: number; city?: string } | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  const [lastRefresh, setLastRefresh] = useState<number>(0);

  // Crossfade when target changes
  useEffect(() => {
    if (targetBg === displayBg) return;
    setBgOpacity(0);
    const t = setTimeout(() => {
      setDisplayBg(targetBg);
      setBgOpacity(1);
    }, 600);
    return () => clearTimeout(t);
  }, [targetBg]);

 useEffect(() => {
  if (weather) {
    const emoji = getWeatherEmoji(weather.weather[0].id);
    const condition = weather.weather[0].description;
    const temp = Math.round(weather.main.temp);
    const city = weather.name;

    document.title = `${condition}, ${temp}°C in ${city}`;
    updateFavicon(emoji);
  } else {
    document.title = "Your Weather";
    updateFavicon("🌤️");
  }
}, [weather]);

  const applyWeatherData = (data: WeatherData) => {
    setWeather(data);
    setLastUpdated(new Date());
    const cat = getWeatherCategory(data.weather[0].id);
    setTargetBg(WEATHER_IMAGES[cat]);
  };

  const fetchByCoords = useCallback(async (lat: number, lon: number, key: string) => {
    if (!key) { setShowApiModal(true); return; }
    setLoading(true);
    setError(null);
    try {
      // Use the service with caching
      const data = await weatherService.fetchWeatherByCoords(lat, lon);
      applyWeatherData(data);
      currentLocationRef.current = { lat, lon };
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchByCity = useCallback(async (city: string, key: string) => {
    if (!key) { setShowApiModal(true); return; }
    if (!city.trim()) return;
    setLoading(true);
    setError(null);
    try {
      // Use the service with caching
      const data = await weatherService.fetchWeatherByCity(city);
      applyWeatherData(data);
      currentLocationRef.current = { city };
      setShowSearch(false);
      setSearchInput("");
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, []);

  // Auto-locate on mount / key change
  useEffect(() => {
    if (!apiKey) { setShowApiModal(true); return; }
    if (!navigator.geolocation) {
      setError("Geolocation unavailable. Search for a city to start.");
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => fetchByCoords(pos.coords.latitude, pos.coords.longitude, apiKey),
      () => setError("Location access denied. Search for a city to start.")
    );
  }, [apiKey]);

  // Set up auto-refresh interval
  useEffect(() => {
    // Clear any existing interval
    if (refreshIntervalRef.current) {
      clearInterval(refreshIntervalRef.current);
      refreshIntervalRef.current = null;
    }

    // Only set up interval if we have weather data
    if (!weather) return;

    // Refresh every 10 minutes (600,000 ms)
    const REFRESH_INTERVAL = 10 * 60 * 1000;
    
    refreshIntervalRef.current = window.setInterval(() => {
      if (currentLocationRef.current) {
        console.log('🔄 Auto-refreshing weather data...');
        if (currentLocationRef.current.city) {
          fetchByCity(currentLocationRef.current.city, apiKey);
        } else if (currentLocationRef.current.lat && currentLocationRef.current.lon) {
          fetchByCoords(
            currentLocationRef.current.lat,
            currentLocationRef.current.lon,
            apiKey
          );
        }
      }
    }, REFRESH_INTERVAL);

    // Cleanup interval on unmount or when weather changes
    return () => {
      if (refreshIntervalRef.current) {
        clearInterval(refreshIntervalRef.current);
        refreshIntervalRef.current = null;
      }
    };
  }, [weather, apiKey, fetchByCity, fetchByCoords]);

  // Display cache info in UI
  const getCacheInfo = () => {
    const age = weatherService.getCacheAge();
    if (age !== null) {
      return `📊 Cache: ${age} min old`;
    }
    return '📊 Live data';
  };

  const saveApiKey = () => {
    const k = apiKeyInput.trim();
    if (!k) return;
    localStorage.setItem("owm_api_key", k);
    setApiKey(k);
    weatherService.setApiKey(k);
    setShowApiModal(false);
    setApiKeyInput("");
  };

  useEffect(() => {
    saveApiKey()
  }, []);

  const displayTemp = (c: number) =>
    Math.round(isCelsius ? c : celsiusToFahrenheit(c));

  const unit = isCelsius ? "°C" : "°F";

// Modified refresh function with cooldown
const handleRefresh = useCallback(() => {
  const now = Date.now();
  const cooldown = 30000; // 30 seconds cooldown
  
  if (now - lastRefresh < cooldown) {
    setError(`Please wait ${Math.ceil((cooldown - (now - lastRefresh)) / 1000)}s before refreshing`);
    return;
  }
  
  setLastRefresh(now);
  
  if (currentLocationRef.current) {
    if (currentLocationRef.current.city) {
      fetchByCity(currentLocationRef.current.city, apiKey);
    } else if (currentLocationRef.current.lat && currentLocationRef.current.lon) {
      fetchByCoords(
        currentLocationRef.current.lat,
        currentLocationRef.current.lon,
        apiKey
      );
    }
  }
}, [lastRefresh, fetchByCity, fetchByCoords, apiKey]);

  return (
    <div
      className="relative h-screen w-full overflow-hidden select-none"
      style={{ fontFamily: "'Outfit', sans-serif" }}
    >
      {/* ── Background image ── */}
      <div
        className="absolute inset-0 bg-sky-950"
        style={{
          backgroundImage: `url(${displayBg})`,
          backgroundSize: "cover",
          backgroundPosition: "center",
          opacity: bgOpacity,
          transition: "opacity 0.7s ease-in-out",
        }}
      />

      {/* ── Weather-adaptive overlay ── */}
      <div
        className="absolute inset-0"
        style={{
          background: WEATHER_OVERLAYS[weatherCat],
          transition: "background 1.2s ease-in-out",
        }}
      />

      {/* ── Bottom vignette for stat card legibility ── */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            "linear-gradient(to top, rgba(0,0,0,0.45) 0%, transparent 50%)",
        }}
      />

      {/* ── API Key Modal ── */}
      {showApiModal && (
        <div className="absolute inset-0 z-50 flex items-center justify-center p-5 bg-black/55 backdrop-blur-sm">
          <motion.div
            initial={{ opacity: 0, scale: 0.94 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.25 }}
            className="w-full max-w-sm text-white"
            style={{
              background: "rgba(10,20,40,0.70)",
              backdropFilter: "blur(28px)",
              border: "1px solid rgba(178,213,229,0.22)",
              borderRadius: "24px",
              padding: "32px 28px",
            }}
          >
            <div className="flex items-center gap-3 mb-2">
              <Key size={20} style={{ color: THEME }} />
              <h2 className="text-base font-semibold">OpenWeatherMap Key</h2>
            </div>
            <p className="text-sm text-white/50 mb-1">
              Get a free key at{" "}
              <span style={{ color: THEME }}>openweathermap.org</span>
            </p>
            <p className="text-xs text-white/30 mb-5">
              Stored locally · never shared
            </p>
            <input
              type="text"
              value={apiKeyInput}
              onChange={(e) => setApiKeyInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && saveApiKey()}
              placeholder="Paste your API key…"
              autoFocus
              className="w-full rounded-xl px-4 py-3 text-sm text-white placeholder-white/30 outline-none mb-3"
              style={{
                background: "rgba(255,255,255,0.07)",
                border: "1px solid rgba(178,213,229,0.22)",
                fontFamily: "'DM Mono', monospace",
                letterSpacing: "0.04em",
              }}
            />
            <button
              onClick={saveApiKey}
              className="w-full rounded-xl py-3 text-sm font-semibold transition-opacity hover:opacity-90 active:opacity-80"
              style={{ background: THEME, color: THEME_DARK }}
            >
              Save &amp; Get Weather
            </button>
            {apiKey && (
              <button
                onClick={() => setShowApiModal(false)}
                className="w-full mt-2 py-2 text-xs text-white/35 hover:text-white/60 transition-colors"
              >
                Cancel
              </button>
            )}
          </motion.div>
        </div>
      )}

      {/* ── Main UI ── */}
      <div className="relative z-10 h-full flex flex-col text-white px-5 py-6 sm:px-8 sm:py-7 gap-3">

        {/* Top bar */}
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2 min-w-0">
            <MapPin size={14} style={{ color: THEME, flexShrink: 0 }} />
            <span className="text-sm text-white/75 truncate font-medium">
              {loading && !weather
                ? "Locating…"
                : weather
                ? `${weather.name}, ${weather.sys.country}`
                : "Weather"}
            </span>
          </div>

          <div className="flex items-center gap-1.5 flex-shrink-0">
            {/* Unit toggle */}
            <button
              onClick={() => setIsCelsius(!isCelsius)}
              className="text-xs rounded-full px-3 py-1 transition-all hover:scale-105 active:scale-95"
              style={{
                background: "rgba(255,255,255,0.10)",
                border: "1px solid rgba(255,255,255,0.18)",
                fontFamily: "'DM Mono', monospace",
                color: THEME,
              }}
            >
              {isCelsius ? "°F" : "°C"}
            </button>

            <GlassBtn onClick={() => setShowSearch(!showSearch)}>
              {showSearch ? <X size={14} /> : <Search size={14} />}
            </GlassBtn>

            <GlassBtn onClick={handleRefresh}>
              <RefreshCw
                size={14}
                className={loading ? "animate-spin" : ""}
                style={{ color: loading ? THEME : undefined }}
              />
            </GlassBtn>

          </div>
        </div>

        {/* for the dev mode */}
        {/* {weather && (
          <div className="absolute bottom-2 right-3 text-white/20 text-xs">
            {getCacheInfo()} • Updated: {lastUpdated?.toLocaleTimeString()}
          </div>
        )} */}

        {/* Search bar */}
        {showSearch && (
          <motion.form
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.2 }}
            onSubmit={(e) => { e.preventDefault(); fetchByCity(searchInput, apiKey); }}
            className="flex gap-2"
          >
            <input
              type="text"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder="Search city… Tokyo, Paris, São Paulo"
              autoFocus
              className="flex-1 rounded-2xl px-4 py-2.5 text-sm text-white placeholder-white/35 outline-none"
              style={{
                background: "rgba(255,255,255,0.10)",
                border: "1px solid rgba(255,255,255,0.20)",
                backdropFilter: "blur(12px)",
              }}
            />
            <button
              type="submit"
              className="px-4 py-2.5 rounded-2xl text-sm font-semibold transition-opacity hover:opacity-90"
              style={{ background: THEME, color: THEME_DARK }}
            >
              <Search size={15} />
            </button>
          </motion.form>
        )}

        {/* Error inline (when we already have weather loaded) */}
        {error && weather && (
          <div className="text-xs text-red-300/80 text-center">{error}</div>
        )}

        {/* Center: main weather display */}
        <div className="flex-1 flex items-center justify-center">
          {loading && !weather ? (
            <div className="flex flex-col items-center gap-3">
              <Loader2 size={36} className="animate-spin text-white/40" />
              <p className="text-sm text-white/40">Fetching weather…</p>
            </div>
          ) : error && !weather ? (
            <div className="flex flex-col items-center gap-4 text-center max-w-xs">
              <span className="text-5xl">🌤</span>
              <p className="text-sm text-white/60 leading-relaxed">{error}</p>
              <button
                onClick={() => setShowSearch(true)}
                className="rounded-full px-6 py-2.5 text-sm font-semibold transition-opacity hover:opacity-90"
                style={{ background: THEME, color: THEME_DARK }}
              >
                Search a city
              </button>
            </div>
          ) : weather ? (
            <motion.div
              key={`${weather.name}-${weather.weather[0].id}`}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.45 }}
              className="flex flex-col items-center text-center"
            >
              {/* OWM icon */}
              <img
                src={`https://openweathermap.org/img/wn/${weather.weather[0].icon}@4x.png`}
                alt={weather.weather[0].description}
                className="w-24 h-24 sm:w-32 sm:h-32 drop-shadow-2xl -mb-3"
              />

              {/* Temperature */}
              <div className="flex items-start leading-none">
                <span
                  className="font-bold tracking-tighter text-white"
                  style={{
                    fontSize: "clamp(4.5rem, 20vw, 9.5rem)",
                    fontVariantNumeric: "tabular-nums",
                    textShadow: "0 4px 32px rgba(0,0,0,0.4)",
                  }}
                >
                  {displayTemp(weather.main.temp)}
                </span>
                <span
                  className="font-light text-white/55 ml-1"
                  style={{ fontSize: "clamp(1.5rem, 5vw, 2.5rem)", marginTop: "clamp(0.6rem, 2.5vw, 1.4rem)" }}
                >
                  {unit}
                </span>
              </div>

              {/* Condition label */}
              <p
                className="font-medium text-white/90 capitalize mt-1"
                style={{ fontSize: "clamp(1rem, 4vw, 1.5rem)" }}
              >
                {weather.weather[0].description}
              </p>

              {/* Feels like + hi/lo */}
              <div
                className="flex items-center gap-3 mt-2 text-white/50"
                style={{ fontSize: "clamp(0.7rem, 2vw, 0.875rem)" }}
              >
                <span>Feels {displayTemp(weather.main.feels_like)}{unit}</span>
                <span className="opacity-40">·</span>
                <span>
                  H:{displayTemp(weather.main.temp_max)}{unit} &nbsp;
                  L:{displayTemp(weather.main.temp_min)}{unit}
                </span>
              </div>
            </motion.div>
          ) : null}
        </div>

        {/* Bottom: stats glass card */}
        {weather && (
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.12 }}
            className="rounded-3xl"
            style={{
              background: "rgba(255,255,255,0.07)",
              backdropFilter: "blur(24px)",
              WebkitBackdropFilter: "blur(24px)",
              border: "1px solid rgba(178,213,229,0.14)",
              padding: "clamp(14px, 3vw, 22px)",
            }}
          >
            <div className="grid grid-cols-4 gap-2 sm:gap-5">
              <StatCard
                icon={<Droplets size={16} />}
                label="Humidity"
                value={`${weather.main.humidity}%`}
              />
              <StatCard
                icon={<Wind size={16} />}
                label="Wind"
                value={`${Math.round(weather.wind.speed * 3.6)}`}
                sub={`km/h · ${getWindDir(weather.wind.deg)}`}
              />
              <StatCard
                icon={<Eye size={16} />}
                label="Visibility"
                value={`${(weather.visibility / 1000).toFixed(1)}`}
                sub="km"
              />
              <StatCard
                icon={<Gauge size={16} />}
                label="Pressure"
                value={`${weather.main.pressure}`}
                sub="hPa"
              />
            </div>

            <div
              className="mt-3 pt-3 flex justify-between text-white/38"
              style={{
                borderTop: "1px solid rgba(255,255,255,0.07)",
                fontSize: "0.68rem",
                fontFamily: "'DM Mono', monospace",
              }}
            >
              <span>🌅 {formatTime(weather.sys.sunrise)}</span>
              <span className="text-white/25">upd. {formatTime(weather.dt)}</span>
              <span>🌇 {formatTime(weather.sys.sunset)}</span>
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
}
