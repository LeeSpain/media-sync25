// Lightweight client-side slideshow assembler using Canvas + MediaRecorder
// This avoids heavy ffmpeg.wasm and works across modern browsers.

export interface AssembleOptions {
  imageUrls: string[];
  audioUrl: string;
  width?: number;
  height?: number;
  fps?: number;
}

export async function assembleSlideshowVideo({
  imageUrls,
  audioUrl,
  width = 1280,
  height = 720,
  fps = 30,
}: AssembleOptions): Promise<Blob> {
  if (!imageUrls.length) throw new Error("No images provided");

  // Prepare audio element and wait for metadata
  const audio = new Audio();
  audio.src = audioUrl;
  audio.crossOrigin = "anonymous";
  await new Promise<void>((resolve, reject) => {
    audio.addEventListener("loadedmetadata", () => resolve(), { once: true });
    audio.addEventListener("error", () => reject(new Error("Failed to load audio")), { once: true });
  });

  const totalDuration = audio.duration; // seconds
  if (!isFinite(totalDuration) || totalDuration <= 0) throw new Error("Invalid audio duration");
  const perScene = totalDuration / imageUrls.length;

  // Prepare canvas
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas 2D context not available");

  // Preload images
  const images = await Promise.all(
    imageUrls.map(
      (url) =>
        new Promise<HTMLImageElement>((resolve, reject) => {
          const img = new Image();
          img.crossOrigin = "anonymous";
          img.onload = () => resolve(img);
          img.onerror = () => reject(new Error("Failed to load image"));
          img.src = url;
        })
    )
  );

  // Prepare streams
  const canvasStream = (canvas as HTMLCanvasElement).captureStream(fps);
  const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
  const trackDest = audioCtx.createMediaStreamDestination();

  // Hook audio element into AudioContext for capture
  const source = audioCtx.createMediaElementSource(audio);
  source.connect(trackDest);
  source.connect(audioCtx.destination); // optional: also play through speakers

  const mixedStream = new MediaStream([
    ...canvasStream.getVideoTracks(),
    ...trackDest.stream.getAudioTracks(),
  ]);

  const recordedChunks: BlobPart[] = [];
  const recorder = new MediaRecorder(mixedStream, { mimeType: "video/webm;codecs=vp9,opus" });
  recorder.ondataavailable = (e) => {
    if (e.data && e.data.size > 0) recordedChunks.push(e.data);
  };

  let rafId = 0;
  const startTime = performance.now();

  function drawFrame(timeMs: number) {
    const t = (timeMs - startTime) / 1000; // seconds since start
    const sceneIndex = Math.min(Math.floor(t / perScene), images.length - 1);
    const img = images[sceneIndex];

    // Cover fit
    const scale = Math.max(width / img.width, height / img.height);
    const sw = img.width * scale;
    const sh = img.height * scale;
    const sx = (width - sw) / 2;
    const sy = (height - sh) / 2;

    ctx.clearRect(0, 0, width, height);
    ctx.drawImage(img, sx, sy, sw, sh);
  }

  function tick(time: number) {
    drawFrame(time);
    if (!audio.paused && !audio.ended) {
      rafId = requestAnimationFrame(tick);
    }
  }

  // Start recording and playback
  recorder.start(250);
  await audioCtx.resume();
  audio.play();
  rafId = requestAnimationFrame(tick);

  await new Promise<void>((resolve) => {
    audio.addEventListener(
      "ended",
      () => {
        cancelAnimationFrame(rafId);
        resolve();
      },
      { once: true }
    );
  });

  recorder.stop();
  await new Promise<void>((resolve) => (recorder.onstop = () => resolve()));

  return new Blob(recordedChunks, { type: "video/webm" });
}
