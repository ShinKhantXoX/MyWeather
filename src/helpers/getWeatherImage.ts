import { WEATHER_IMAGES } from "../app/App";

export function getWeatherImage(weatherId: number): string {
  if (weatherId >= 200 && weatherId < 300) {
    return WEATHER_IMAGES.thunderstorm;
  }

  if (weatherId >= 300 && weatherId < 400) {
    return WEATHER_IMAGES.drizzle;
  }

  if (weatherId >= 500 && weatherId < 600) {
    return WEATHER_IMAGES.rain;
  }

  if (weatherId >= 600 && weatherId < 700) {
    return WEATHER_IMAGES.snow;
  }

  if (weatherId >= 700 && weatherId < 800) {
    return WEATHER_IMAGES.atmosphere;
  }

  if (weatherId === 800) {
    return WEATHER_IMAGES.clear;
  }

  return WEATHER_IMAGES.clouds;
}