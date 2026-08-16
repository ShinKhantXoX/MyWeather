import { getWeatherEmoji, WeatherData } from "../../helpers/getWeather";
import { getWeatherImage } from "../../helpers/getWeatherImage";

interface WeatherShareCardProps {
  weather: WeatherData;
  unit: "C" | "F";
}

export default function WeatherShareCard({
  weather,
  unit,
}: WeatherShareCardProps) {
  const weatherId = weather.weather[0].id;
  

  const backgroundImage = getWeatherImage(weatherId);
  const emoji = getWeatherEmoji(weatherId);
  

  const temp =
    unit === "C"
      ? Math.round(weather.main.temp)
      : Math.round((weather.main.temp * 9) / 5 + 32);

  const feelsLike =
    unit === "C"
      ? Math.round(weather.main.feels_like)
      : Math.round((weather.main.feels_like * 9) / 5 + 32);

  return (
    <div
        id="weather-share-card"
        className="relative h-[1350px] w-[1080px] overflow-hidden rounded-[56px] text-white"
        style={{
            fontFamily: "Inter, sans-serif",
        }}
        >
        {/* Background photo */}
        <div
            className="absolute inset-0 scale-105"
            style={{
            backgroundImage: `url(${backgroundImage})`,
            backgroundSize: "cover",
            backgroundPosition: "center",
            filter: "blur(4px)",
            }}
        />

      {/* Dark overlay */}
      <div className="absolute inset-0 bg-black/40" />

      {/* Content */}
      <div className="relative z-10 flex h-full flex-col p-20">

        {/* Header */}
        <div className="flex items-start justify-between">
          <div>
            <p className="text-xl uppercase tracking-[0.3em] text-white/60">
              Your Weather
            </p>

            <h1 className="mt-5 text-6xl font-semibold">
              {weather.name}
            </h1>

            <p className="mt-2 text-2xl capitalize text-white/60">
              {weather.weather[0].description}
            </p>
          </div>

           <img
                src={`https://openweathermap.org/img/wn/${weather.weather[0].icon}@2x.png`}
                alt={weather.weather[0].description}
                className="h-24 w-24 object-contain"
            />
        </div>

        {/* Temperature */}
        <div className="mt-auto">
          <div className="flex items-end gap-5">
            <span className="text-[180px] font-light leading-none">
              {temp}°
            </span>

            <span className="pb-6 text-4xl text-white/60">
              {unit}
            </span>
          </div>

          <p className="mt-5 text-3xl text-white/70">
            Feels like {feelsLike}°
          </p>
        </div>

        {/* Stats */}
        <div className="mt-16 grid grid-cols-2 gap-5">
          <ShareStat
            label="Humidity"
            value={`${weather.main.humidity}%`}
          />

          <ShareStat
            label="Wind"
            value={`${Math.round(weather.wind.speed * 3.6)} km/h`}
          />

          <ShareStat
            label="Visibility"
            value={`${(weather.visibility / 1000).toFixed(1)} km`}
          />

          <ShareStat
            label="Pressure"
            value={`${weather.main.pressure} hPa`}
          />
        </div>

        {/* Footer */}
        <div className="mt-12 border-t border-white/20 pt-6">
          <p className="text-lg text-white/50">
            {new Date(weather.dt * 1000).toLocaleString()}
          </p>
        </div>
      </div>
    </div>
  );
}

function ShareStat({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-3xl bg-black/25 p-6 backdrop-blur-md">
      <p className="text-lg uppercase tracking-widest text-white/50">
        {label}
      </p>

      <p className="mt-2 text-3xl font-semibold">
        {value}
      </p>
    </div>
  );
}