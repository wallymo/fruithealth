export interface ProcessedImage {
  base64: string;
  mediaType: "image/jpeg";
  thumbnailDataUrl: string;
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
): { blob: Promise<Blob>; dataUrl: string } {
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
  return { blob, dataUrl };
}

async function blobToBase64(blob: Blob): Promise<string> {
  const buf = await blob.arrayBuffer();
  const bytes = new Uint8Array(buf);
  let binary = "";
  for (let i = 0; i < bytes.length; i++) binary += String.fromCharCode(bytes[i]);
  return btoa(binary);
}

export async function processImage(file: File): Promise<ProcessedImage> {
  const img = await fileToImage(file);
  const full = drawToJpeg(img, 1024, 0.85);
  const thumb = drawToJpeg(img, 256, 0.75);
  const [fullBlob] = await Promise.all([full.blob, thumb.blob]);
  const base64 = await blobToBase64(fullBlob);
  return {
    base64,
    mediaType: "image/jpeg",
    thumbnailDataUrl: thumb.dataUrl,
  };
}
