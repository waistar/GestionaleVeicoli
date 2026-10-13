'use client'

/**
 * Utility to extract dominant color from an image client-side using Canvas.
 * Filters out extreme bright whites, deep blacks, and transparent areas
 * to isolate the vibrant motorcycle bodywork / tank / livery colors.
 */
export async function extractDominantColor(imageSource: string | File): Promise<{
  primaryColor: string;
  accentColor: string;
  palette: string[];
}> {
  return new Promise((resolve) => {
    // Default fallback colors
    const fallback = {
      primaryColor: '#f97316', // Orange
      accentColor: '#18181b', // Zinc-900
      palette: ['#f97316', '#0284c7', '#dc2626', '#10b981', '#18181b'],
    };

    if (typeof window === 'undefined') {
      resolve(fallback);
      return;
    }

    const img = new Image();
    img.crossOrigin = 'anonymous';

    let objectUrlToRevoke: string | null = null;
    if (imageSource instanceof File) {
      objectUrlToRevoke = URL.createObjectURL(imageSource);
      img.src = objectUrlToRevoke;
    } else {
      img.src = imageSource;
    }

    img.onload = () => {
      try {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          if (objectUrlToRevoke) URL.revokeObjectURL(objectUrlToRevoke);
          resolve(fallback);
          return;
        }

        // Downsample for fast, smooth performance
        const width = 80;
        const height = 80;
        canvas.width = width;
        canvas.height = height;

        ctx.drawImage(img, 0, 0, width, height);
        const imageData = ctx.getImageData(0, 0, width, height);
        const data = imageData.data;

        // Color bucket map (quantized by 16)
        const colorBuckets: { [hex: string]: { count: number; r: number; g: number; b: number; saturation: number } } = {};

        for (let i = 0; i < data.length; i += 4) {
          const r = data[i];
          const g = data[i + 1];
          const b = data[i + 2];
          const a = data[i + 3];

          // Skip transparent or near-black/near-white background
          if (a < 180) continue;

          const max = Math.max(r, g, b);
          const min = Math.min(r, g, b);
          const delta = max - min;
          const saturation = max === 0 ? 0 : delta / max;
          const brightness = max / 255;

          // Focus on saturated colors typical of motorbike fairings/tanks
          // Penalize pure gray asphalt/white backgrounds
          if (brightness < 0.12 || brightness > 0.95) continue;

          // Quantize to reduce noise
          const qr = Math.round(r / 20) * 20;
          const qg = Math.round(g / 20) * 20;
          const qb = Math.round(b / 20) * 20;

          const hex = `#${((1 << 24) + (qr << 16) + (qg << 8) + qb).toString(16).slice(1)}`;

          if (!colorBuckets[hex]) {
            colorBuckets[hex] = { count: 0, r, g, b, saturation };
          }
          // Give higher weight to colorful/saturated pixels
          colorBuckets[hex].count += 1 + saturation * 3;
        }

        if (objectUrlToRevoke) {
          URL.revokeObjectURL(objectUrlToRevoke);
        }

        const sorted = Object.entries(colorBuckets).sort(
          ([, a], [, b]) => b.count - a.count
        );

        if (sorted.length === 0) {
          resolve(fallback);
          return;
        }

        // Find the most prominent saturated color
        const topSaturated = sorted.find(([, data]) => data.saturation > 0.25) || sorted[0];
        const primaryColor = topSaturated[0];

        // Accent color: darker contrasting tone or second palette entry
        const secondary = sorted.find(([hex, data]) => hex !== primaryColor && data.saturation > 0.2);
        const accentColor = secondary ? secondary[0] : '#18181b';

        const palette = sorted.slice(0, 5).map(([hex]) => hex);

        resolve({
          primaryColor,
          accentColor,
          palette: palette.length > 0 ? palette : fallback.palette,
        });
      } catch (err) {
        console.warn('Dominant color extraction fallback:', err);
        if (objectUrlToRevoke) URL.revokeObjectURL(objectUrlToRevoke);
        resolve(fallback);
      }
    };

    img.onerror = () => {
      if (objectUrlToRevoke) URL.revokeObjectURL(objectUrlToRevoke);
      resolve(fallback);
    };
  });
}
