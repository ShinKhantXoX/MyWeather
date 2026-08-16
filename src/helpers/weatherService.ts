import type {
  WeatherData,
  ForecastData,
} from "../helpers/getWeather";

// Cache configuration
const CACHE_KEY = 'weather_cache';
const CACHE_DURATION = 10 * 60 * 1000; // 10 minutes in milliseconds

interface CacheData {
  data: WeatherData;
  timestamp: number;
  city?: string;
  lat?: number;
  lon?: number;
}

class WeatherService {
  private cache: CacheData | null = null;

  private apiKey: string = "";

  setApiKey(key: string) {
    this.apiKey = key;
  }

  constructor() {
    // Load cache from localStorage on init
    this.loadCache();
  }

  private loadCache() {
    try {
      const cached = localStorage.getItem(CACHE_KEY);
      if (cached) {
        this.cache = JSON.parse(cached);
        
        // Check if cache is expired
        if (this.cache && Date.now() - this.cache.timestamp > CACHE_DURATION) {
          this.cache = null;
          localStorage.removeItem(CACHE_KEY);
        }
      }
    } catch (error) {
      console.error('Failed to load cache:', error);
    }
  }

  private saveCache(data: WeatherData, city?: string, lat?: number, lon?: number) {
    this.cache = {
      data,
      timestamp: Date.now(),
      city,
      lat,
      lon,
    };
    localStorage.setItem(CACHE_KEY, JSON.stringify(this.cache));
  }

  private getCacheKey(city?: string, lat?: number, lon?: number): string {
    if (city) return `city:${city.toLowerCase()}`;
    if (lat && lon) return `coords:${lat},${lon}`;
    return 'unknown';
  }

  isCacheValid(city?: string, lat?: number, lon?: number): boolean {
    if (!this.cache) return false;
    
    const isExpired = Date.now() - this.cache.timestamp > CACHE_DURATION;
    if (isExpired) {
      localStorage.removeItem(CACHE_KEY);
      this.cache = null;
      return false;
    }

    // Check if cache is for the same location
    if (city && this.cache.city?.toLowerCase() === city.toLowerCase()) {
      return true;
    }
    if (lat && lon && this.cache.lat === lat && this.cache.lon === lon) {
      return true;
    }

    return false;
  }

  getCachedData(): WeatherData | null {
    return this.cache?.data || null;
  }

  async fetchWeatherByCity(city: string): Promise<WeatherData> {
     if (!this.apiKey) throw new Error('API key not set');
    // Check cache first
    if (this.isCacheValid(city)) {
      console.log('✅ Using cached data for:', city);
      return this.cache!.data;
    }

    console.log('🔄 Fetching fresh data for:', city);
    const response = await fetch(
      `https://api.openweathermap.org/data/2.5/weather?q=${encodeURIComponent(city)}&appid=${this.apiKey}&units=metric`
    );

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'City not found');
    }

    const data = await response.json();
    this.saveCache(data, city);
    return data;
  }

  async fetchWeatherByCoords(lat: number, lon: number): Promise<WeatherData> {
     if (!this.apiKey) throw new Error('API key not set');
    // Check cache first
    if (this.isCacheValid(undefined, lat, lon)) {
      console.log('✅ Using cached data for coordinates:', lat, lon);
      return this.cache!.data;
    }

    console.log('🔄 Fetching fresh data for coordinates:', lat, lon);
    const response = await fetch(
      `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&appid=${this.apiKey}&units=metric`
    );

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to fetch weather');
    }

    const data = await response.json();
    this.saveCache(data, undefined, lat, lon);
    return data;
  }

  async fetchForecastByCoords(
    lat: number,
    lon: number
    ): Promise<ForecastData> {
    if (!this.apiKey) {
        throw new Error("API key not set");
    }

    const response = await fetch(
        `https://api.openweathermap.org/data/2.5/forecast?lat=${lat}&lon=${lon}&appid=${this.apiKey}&units=metric`
    );

    if (!response.ok) {
        const error = await response.json();
        throw new Error(
        error.message || "Failed to fetch forecast"
        );
    }

    return response.json();
    }
  
    async fetchForecastByCity(
    city: string
    ): Promise<ForecastData> {
    if (!this.apiKey) {
        throw new Error("API key not set");
    }

    const response = await fetch(
        `https://api.openweathermap.org/data/2.5/forecast?q=${encodeURIComponent(
        city
        )}&appid=${this.apiKey}&units=metric`
    );

    if (!response.ok) {
        const error = await response.json();
        throw new Error(
        error.message || "Failed to fetch forecast"
        );
    }

    return response.json();
}

  clearCache() {
    this.cache = null;
    localStorage.removeItem(CACHE_KEY);
  }

  getCacheAge(): number | null {
    if (!this.cache) return null;
    return Math.floor((Date.now() - this.cache.timestamp) / 1000 / 60); // in minutes
  }
}

export const weatherService = new WeatherService();