import { useEffect, useState } from "react";
import { Download, Share2, X } from "lucide-react";
import type { WeatherData } from "../../helpers/getWeather";
import WeatherShareCard from "./WeatherShareCard";
import {
  createWeatherImage,
  shareWeatherImage,
} from "../../helpers/createWeatherImage";

interface ShareWeatherModalProps {
  weather: WeatherData;
  unit: "C" | "F";
  onClose: () => void;
}

export default function ShareWeatherModal({
  weather,
  unit,
  onClose,
}: ShareWeatherModalProps) {
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let cancelled = false;

    const generatePreview = async () => {
      setLoading(true);
      setPreviewImage(null);

      try {
        // Give React time to render the latest weather card
        await new Promise((resolve) =>
          requestAnimationFrame(() => resolve(null))
        );

        const dataUrl = await createWeatherImage();

        if (!cancelled) {
          setPreviewImage(dataUrl);
        }
      } catch (error) {
        console.error("Failed to generate preview:", error);
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    generatePreview();

    return () => {
      cancelled = true;
    };
  }, [weather, unit]);

  const handleDownload = async () => {
    const dataUrl = await createWeatherImage();

    const link = document.createElement("a");
    link.download = "my-weather.png";
    link.href = dataUrl;
    link.click();
  };

  const handleShare = async () => {
    await shareWeatherImage();
  };

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center p-4"
      style={{
        background: "rgba(5, 10, 18, 0.7)",
        backdropFilter: "blur(16px)",
        WebkitBackdropFilter: "blur(16px)",
      }}
    >
      <div className="relative flex max-h-[95vh] w-full max-w-4xl flex-col overflow-hidden rounded-[32px] border border-white/10 bg-black/30">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-white/10 px-5 py-4">
          <div>
            <p className="text-sm font-medium text-white">
              Share Weather
            </p>

            <p className="text-xs text-white/40">
              Preview your weather card
            </p>
          </div>

          <button
            onClick={onClose}
            className="rounded-full p-2 text-white/50 hover:bg-white/10 hover:text-white"
          >
            <X size={18} />
          </button>
        </div>

        {/* Preview */}
        <div className="flex flex-1 items-center justify-center overflow-auto p-6">
          <div className="w-full max-w-[500px] overflow-hidden rounded-[28px] shadow-2xl">
            {loading && (
              <div className="flex aspect-[4/5] items-center justify-center bg-white/5">
                <span className="text-sm text-white/40">
                  Generating preview...
                </span>
              </div>
            )}

            {!loading && previewImage && (
              <img
                src={previewImage}
                alt="Weather preview"
                className="block h-auto w-full"
              />
            )}
          </div>
        </div>

        {/* Actions */}
        <div className="flex justify-end gap-3 border-t border-white/10 px-5 py-4">
          <button
            onClick={handleDownload}
            className="flex items-center gap-2 rounded-full bg-white/10 px-5 py-2.5 text-sm text-white/70 hover:bg-white/20 hover:text-white"
          >
            <Download size={16} />
            Download
          </button>

          <button
            onClick={handleShare}
            className="flex items-center gap-2 rounded-full bg-white px-5 py-2.5 text-sm font-medium text-black hover:bg-white/90"
          >
            <Share2 size={16} />
            Share
          </button>
        </div>
      </div>

      {/* IMPORTANT:
          Keep the real 1080x1350 card mounted for html-to-image.
      */}
      <div
        style={{
          position: "fixed",
          left: "-10000px",
          top: 0,
        }}
      >
        <WeatherShareCard
          key={`${weather.dt}-${weather.name}-${unit}`}
          weather={weather}
          unit={unit}
        />
      </div>
    </div>
  );
}