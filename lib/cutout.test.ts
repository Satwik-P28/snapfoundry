import { describe, expect, it } from 'vitest';
import { alphaForPixel, outputSize, safeBaseName } from './cutout';

describe('cutout helpers', () => {
  it('removes near-white pixels', () =>
    expect(alphaForPixel(252, 252, 252, 18)).toBe(0));
  it('keeps dark subject pixels', () =>
    expect(alphaForPixel(20, 40, 30, 18)).toBe(255));
  it('creates marketplace ratios', () =>
    expect(outputSize('portrait', 2000)).toEqual({
      width: 1600,
      height: 2000,
    }));
  it('creates safe filenames', () =>
    expect(safeBaseName('Vintage Lamp (1).JPG')).toBe('vintage-lamp-1'));
});
