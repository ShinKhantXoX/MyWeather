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

export function getWeatherTitle(weatherData: WeatherData | null): string {
  if (!weatherData) return "Your Weather";
  
  const condition = weatherData.weather[0].description;
  const temp = Math.round(weatherData.main.temp);
  const city = weatherData.name;
  
  return `${condition}, ${temp}°C in ${city} | Your Weather`;
}

export function getWeatherEmoji(weatherId: number): string {
  if (weatherId >= 200 && weatherId < 300) return "⛈️"; // Thunderstorm
  if (weatherId >= 300 && weatherId < 400) return "🌦️"; // Drizzle
  if (weatherId >= 500 && weatherId < 600) return "🌧️"; // Rain
  if (weatherId >= 600 && weatherId < 700) return "❄️"; // Snow
  if (weatherId >= 700 && weatherId < 800) return "🌫️"; // Atmosphere
  if (weatherId === 800) return "☀️"; // Clear
  return "☁️"; // Clouds
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