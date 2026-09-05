export type BackgroundMode = 'white' | 'transparent' | 'mint' | 'coral';

export function colorDistance(
  r: number,
  g: number,
  b: number,
  target = [255, 255, 255],
) {
  return Math.sqrt(
    (r - target[0]) ** 2 + (g - target[1]) ** 2 + (b - target[2]) ** 2,
  );
}

export function alphaForPixel(
  r: number,
  g: number,
  b: number,
  threshold: number,
  feather = 25,
) {
  const distance = colorDistance(r, g, b);
  if (distance <= threshold) return 0;
  if (distance >= threshold + feather) return 255;
  return Math.round(((distance - threshold) / feather) * 255);
}

export function outputSize(ratio: 'square' | 'portrait', longEdge: number) {
  return ratio === 'square'
    ? { width: longEdge, height: longEdge }
    : { width: Math.round(longEdge * 0.8), height: longEdge };
}

export function safeBaseName(filename: string) {
  return (
    filename
      .replace(/\.[^.]+$/, '')
      .replace(/[^a-z0-9]+/gi, '-')
      .replace(/^-|-$/g, '')
      .toLowerCase() || 'listing-photo'
  );
}
