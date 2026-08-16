import { toPng } from "html-to-image";

export async function createWeatherImage() {
  const element = document.getElementById(
    "weather-share-card"
  );

  if (!element) {
    throw new Error("Weather card not found");
  }

  return await toPng(element, {
    width: 1080,
    height: 1350,
    pixelRatio: 1,
    cacheBust: true,
  });
}

export async function shareWeatherImage() {
  const dataUrl = await createWeatherImage();

  const response = await fetch(dataUrl);
  const blob = await response.blob();

  const file = new File(
    [blob],
    "my-weather.png",
    {
      type: "image/png",
    }
  );

  if (
    navigator.share &&
    navigator.canShare?.({ files: [file] })
  ) {
    await navigator.share({
      title: "My Weather",
      text: "Check out my current weather",
      files: [file],
    });

    return;
  }

  // Desktop fallback
  const link = document.createElement("a");

  link.download = "my-weather.png";
  link.href = dataUrl;

  link.click();
}