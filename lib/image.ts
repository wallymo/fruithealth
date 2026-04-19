export interface ProcessedImage {
  base64: string;
  mediaType: "image/jpeg";
  thumbnailDataUrl: string;
}

export class ImageQualityError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ImageQualityError";
  }
}

async function fileToImage(file: File): Promise<HTMLImageElement> {
  const url = URL.createObjectURL(file);
  try {
    const img = new Image();
    await new Promise<void>((resolve, reject) => {
      img.onload = () => resolve();
      img.onerror = () => reject(new Error("failed to load image"));
      img.src = url;
    });
    return img;
  } finally {
    URL.revokeObjectURL(url);
  }
}

function drawToJpeg(
  img: HTMLImageElement,
  maxDim: number,
  quality: number,
): { blob: Promise<Blob>; dataUrl: string; canvas: HTMLCanvasElement } {
  const scale = Math.min(1, maxDim / Math.max(img.width, img.height));
  const w = Math.round(img.width * scale);
  const h = Math.round(img.height * scale);
  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("no 2d context");
  ctx.drawImage(img, 0, 0, w, h);
  const dataUrl = canvas.toDataURL("image/jpeg", quality);
  const blob = new Promise<Blob>((resolve, reject) => {
    canvas.toBlob(
      (b) => (b ? resolve(b) : reject(new Error("toBlob failed"))),
      "image/jpeg",
      quality,
    );
  });
  return { blob, dataUrl, canvas };
}

async function blobToBase64(blob: Blob): Promise<string> {
  const buf = await blob.arrayBuffer();
  const bytes = new Uint8Array(buf);
  let binary = "";
  for (let i = 0; i < bytes.length; i++) binary += String.fromCharCode(bytes[i]);
  return btoa(binary);
}

function meanLuminance(canvas: HTMLCanvasElement): number {
  const ctx = canvas.getContext("2d");
  if (!ctx) return 128;
  const { data } = ctx.getImageData(0, 0, canvas.width, canvas.height);
  let sum = 0;
  let count = 0;
  for (let i = 0; i < data.length; i += 16) {
    sum += 0.2126 * data[i] + 0.7152 * data[i + 1] + 0.0722 * data[i + 2];
    count++;
  }
  return sum / count;
}

export async function processImage(file: File): Promise<ProcessedImage> {
  const img = await fileToImage(file);

  if (Math.min(img.width, img.height) < 200) {
    throw new ImageQualityError(
      "Photo is too small. Move closer and retake.",
    );
  }

  const full = drawToJpeg(img, 1024, 0.85);
  const thumb = drawToJpeg(img, 256, 0.75);

  const luminance = meanLuminance(thumb.canvas);
  if (luminance < 30) {
    throw new ImageQualityError("Too dark. Try again with more light.");
  }
  if (luminance > 230) {
    throw new ImageQualityError(
      "Too bright / overexposed. Move out of direct sunlight or glare.",
    );
  }

  const [fullBlob] = await Promise.all([full.blob, thumb.blob]);
  const base64 = await blobToBase64(fullBlob);
  return {
    base64,
    mediaType: "image/jpeg",
    thumbnailDataUrl: thumb.dataUrl,
  };
}
