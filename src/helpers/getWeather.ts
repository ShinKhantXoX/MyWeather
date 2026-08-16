export interface WeatherData {
  name: string;
  sys: { country: string; sunrise: number; sunset: number };
  main: {
    temp: number;
    feels_like: number;
    humidity: number;
    pressure: number;
    temp_min: number;
    temp_max: number;
  };
  weather: Array<{ id: number; main: string; description: string; icon: string }>;
  wind: { speed: number; deg: number };
  visibility: number;
  dt: number;
  coord: { lat: number; lon: number };
}

export interface ForecastItem {
  dt: number;
  main: {
    temp: number;
    feels_like: number;
    temp_min: number;
    temp_max: number;
    humidity: number;
  };
  weather: Array<{
    id: number;
    main: string;
    description: string;
    icon: string;
  }>;
  wind: {
    speed: number;
    deg: number;
  };
  pop: number;
  dt_txt: string;
}

export interface ForecastData {
  cod: string;
  message: number;
  cnt: number;
  list: ForecastItem[];
  city: {
    id: number;
    name: string;
    country: string;
    timezone: number;
    sunrise: number;
    sunset: number;
  };
}

export function getWeatherTitle(weatherData: WeatherData | null): string {
  if (!weatherData) return "Your Weather";
  
  const condition = weatherData.weather[0].description;
  const temp = Math.round(weatherData.main.temp);
  const city = weatherData.name;
  
  return `${condition}, ${temp}°C in ${city} | Your Weather`;
}

export function getWeatherEmoji(weatherId: number): string {
  // Thunderstorm
  if (weatherId >= 200 && weatherId < 300) {
    return "⛈️";
  }

  // Drizzle
  if (weatherId >= 300 && weatherId < 400) {
    return "🌦️";
  }

  // Rain
  if (weatherId >= 500 && weatherId < 600) {
    return "🌧️";
  }

  // Snow
  if (weatherId >= 600 && weatherId < 700) {
    return "❄️";
  }

  // Atmosphere: mist, smoke, haze, fog...
  if (weatherId >= 700 && weatherId < 800) {
    return "🌫️";
  }

  // Clear sky
  if (weatherId === 800) {
    return "☀️";
  }

  // Clouds
  if (weatherId === 801) {
    return "🌤️"; // Few clouds
  }

  if (weatherId === 802) {
    return "⛅"; // Scattered clouds
  }

  if (weatherId === 803) {
    return "🌥️"; // Broken clouds
  }

  if (weatherId === 804) {
    return "☁️"; // Overcast clouds
  }

  return "☁️";
}

// Update favicon with emoji
export function updateFavicon(emoji: string) {
  const canvas = document.createElement("canvas");
  canvas.width = 64;
  canvas.height = 64;

  const ctx = canvas.getContext("2d");

  if (!ctx) return;

  ctx.clearRect(0, 0, 64, 64);

  ctx.font = "48px serif";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";

  ctx.fillText(emoji, 32, 34);

  let favicon = document.querySelector<HTMLLinkElement>(
    'link[rel="icon"]'
  );

  if (!favicon) {
    favicon = document.createElement("link");
    favicon.rel = "icon";
    document.head.appendChild(favicon);
  }

  favicon.href = canvas.toDataURL("image/png");
}