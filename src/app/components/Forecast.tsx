import type { ForecastData, ForecastItem } from "../..//helpers/getWeather";
import { getWeatherEmoji } from "../../helpers/getWeather";

interface ForecastProps {
  forecast: ForecastData;
}

function groupByDay(forecast: ForecastData) {
  const days: Record<string, ForecastItem[]> = {};

  forecast.list.forEach((item) => {
    const date = item.dt_txt.split(" ")[0];

    if (!days[date]) {
      days[date] = [];
    }

    days[date].push(item);
  });

  return Object.entries(days).slice(0, 5);
}

function formatDay(date: string) {
  return new Date(`${date}T12:00:00`).toLocaleDateString(
    undefined,
    {
      weekday: "short",
    }
  );
}

function getBestForecast(items: ForecastItem[]) {
  // Prefer the forecast closest to noon
  return items.reduce((best, item) => {
    const hour = new Date(item.dt * 1000).getHours();
    const bestHour = new Date(best.dt * 1000).getHours();

    return Math.abs(hour - 12) <
      Math.abs(bestHour - 12)
      ? item
      : best;
  });
}

export default function Forecast({
  forecast,
}: ForecastProps) {
  const days = groupByDay(forecast);

  return (
    <div
  className="w-[320px] md:w-[440px] rounded-full px-5 py-3 mx-auto"
  style={{
    background: "rgba(255,255,255,0.07)",
    backdropFilter: "blur(20px)",
    WebkitBackdropFilter: "blur(20px)",
    border: "1px solid rgba(178,213,229,0.12)",
  }}
>
  <div className="mb-2">
    <p
      className="text-white/40 uppercase tracking-widest text-center"
      style={{ fontSize: "0.5rem" }}
    >
      5-Day Forecast
    </p>
  </div>

  <div className="grid grid-cols-5 gap-1">
    {days.map(([date, items], index) => {
      const day = getBestForecast(items);

      const high = Math.round(
        Math.max(...items.map((item) => item.main.temp_max))
      );

      const low = Math.round(
        Math.min(...items.map((item) => item.main.temp_min))
      );

      const emoji = getWeatherEmoji(day.weather[0].id);

      return (
        <div
          key={date}
          className="flex flex-col items-center text-center"
        >
          <span className="text-[8px] text-white/50">
            {index === 0 ? "Today" : formatDay(date)}
          </span>

          <span className="text-lg my-1">
            {emoji}
          </span>

          <span className="text-[10px] font-semibold text-white">
            {high}°
            <span className="text-white/35">
              {" "}/ {low}°
            </span>
          </span>
        </div>
      );
    })}
  </div>
</div>
  );
}