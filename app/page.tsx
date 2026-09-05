'use client';

import { useRef, useState } from 'react';
import Image from 'next/image';
import {
  Check,
  Download,
  Images,
  LayoutGrid,
  Loader2,
  PackageCheck,
  RefreshCcw,
  ShieldCheck,
  SlidersHorizontal,
  Upload,
  WandSparkles,
  X,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Slider } from '@/components/ui/slider';
import {
  alphaForPixel,
  outputSize,
  safeBaseName,
  type BackgroundMode,
} from '@/lib/cutout';

type Asset = {
  id: string;
  name: string;
  original: string;
  processed: string;
  status: 'processing' | 'ready' | 'failed';
};
const bgColors: Record<BackgroundMode, string | null> = {
  white: '#ffffff',
  transparent: null,
  mint: '#cce8d9',
  coral: '#ffb29f',
};

function loadImage(src: string) {
  return new Promise<HTMLImageElement>((resolve, reject) => {
    const image = new window.Image();
    image.onload = () => resolve(image);
    image.onerror = reject;
    image.src = src;
  });
}
function dataUrl(file: File) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () =>
      typeof reader.result === 'string'
        ? resolve(reader.result)
        : reject(new Error('Unreadable image'));
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}
export default function Home() {
  const [assets, setAssets] = useState<Asset[]>([]);
  const [selected, setSelected] = useState<string | null>(null);
  const [threshold, setThreshold] = useState(24);
  const [padding, setPadding] = useState(8);
  const [background, setBackground] = useState<BackgroundMode>('white');
  const [ratio, setRatio] = useState<'square' | 'portrait'>('square');
  const [notice, setNotice] = useState(
    'Import product photos taken on a plain, light background.',
  );
  const [exporting, setExporting] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const generation = useRef(0);
  const active = assets.find((item) => item.id === selected) ?? assets[0];
  const readyCount = assets.filter((item) => item.status === 'ready').length;

  async function render(src: string) {
    const image = await loadImage(src);
    const previewEdge = 900;
    const scale = Math.min(
      1,
      previewEdge / Math.max(image.width, image.height),
    );
    const source = document.createElement('canvas');
    source.width = Math.max(1, Math.round(image.width * scale));
    source.height = Math.max(1, Math.round(image.height * scale));
    const sourceCtx = source.getContext('2d', { willReadFrequently: true });
    if (!sourceCtx) throw new Error('Canvas unavailable');
    sourceCtx.drawImage(image, 0, 0, source.width, source.height);
    const pixels = sourceCtx.getImageData(0, 0, source.width, source.height);
    for (let i = 0; i < pixels.data.length; i += 4)
      pixels.data[i + 3] = alphaForPixel(
        pixels.data[i],
        pixels.data[i + 1],
        pixels.data[i + 2],
        threshold,
      );
    sourceCtx.putImageData(pixels, 0, 0);
    const { width, height } = outputSize(ratio, 900);
    const output = document.createElement('canvas');
    output.width = width;
    output.height = height;
    const ctx = output.getContext('2d');
    if (!ctx) throw new Error('Canvas unavailable');
    const fill = bgColors[background];
    if (fill) {
      ctx.fillStyle = fill;
      ctx.fillRect(0, 0, width, height);
    }
    const availableW = width * (1 - padding / 50);
    const availableH = height * (1 - padding / 50);
    const fit = Math.min(availableW / source.width, availableH / source.height);
    const drawW = source.width * fit;
    const drawH = source.height * fit;
    ctx.drawImage(
      source,
      (width - drawW) / 2,
      (height - drawH) / 2,
      drawW,
      drawH,
    );
    return output.toDataURL('image/png');
  }
  async function rerenderAll() {
    const run = ++generation.current;
    if (!assets.length) return;
    setAssets((current) =>
      current.map((item) => ({ ...item, status: 'processing' })),
    );
    const next = await Promise.all(
      assets.map(async (asset) => {
        try {
          const processed = await render(asset.original);
          return { ...asset, processed, status: 'ready' as const };
        } catch {
          return { ...asset, status: 'failed' as const };
        }
      }),
    );
    if (run === generation.current) {
      setAssets(next);
      setNotice(
        `${next.filter((item) => item.status === 'ready').length} photos ready for review.`,
      );
    }
  }
  async function importFiles(files: FileList | null) {
    const selectedFiles = Array.from(files ?? [])
      .filter((file) => file.type.startsWith('image/'))
      .slice(0, 40);
    if (!selectedFiles.length) return;
    const incoming = await Promise.all(
      selectedFiles.map(async (file) => ({
        id: crypto.randomUUID(),
        name: file.name,
        original: await dataUrl(file),
        processed: '',
        status: 'processing' as const,
      })),
    );
    setAssets(incoming);
    setSelected(incoming[0]?.id ?? null);
    setNotice(`Processing ${incoming.length} photos locally…`);
    const next = await Promise.all(
      incoming.map(async (asset) => {
        try {
          return {
            ...asset,
            processed: await render(asset.original),
            status: 'ready' as const,
          };
        } catch {
          return { ...asset, status: 'failed' as const };
        }
      }),
    );
    setAssets(next);
    setNotice(
      `${next.filter((item) => item.status === 'ready').length} photos ready. Review edges before export.`,
    );
  }
  async function exportBatch() {
    const ready = assets.filter(
      (item) => item.status === 'ready' && item.processed,
    );
    if (!ready.length) return;
    setExporting(true);
    const { default: JSZip } = await import('jszip');
    const zip = new JSZip();
    for (const [index, asset] of ready.entries()) {
      const response = await fetch(asset.processed);
      zip.file(
        `${String(index + 1).padStart(2, '0')}-${safeBaseName(asset.name)}-${ratio}.png`,
        await response.blob(),
      );
    }
    zip.file(
      'manifest.csv',
      `filename,ratio,background,padding\n${ready.map((asset, index) => `${String(index + 1).padStart(2, '0')}-${safeBaseName(asset.name)}-${ratio}.png,${ratio},${background},${padding}`).join('\n')}`,
    );
    const blob = await zip.generateAsync({ type: 'blob' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'snapfoundry-listing-pack.zip';
    a.click();
    URL.revokeObjectURL(url);
    setExporting(false);
    setNotice('Listing pack exported with a CSV manifest.');
  }

  return (
    <main className="min-h-screen bg-background text-foreground">
      <header className="sticky top-0 z-30 border-b bg-background/90 backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-[94rem] items-center gap-3 px-4 sm:px-7">
          <span className="grid size-9 place-items-center rounded-xl bg-primary text-primary-foreground">
            <Images className="size-4" />
          </span>
          <p className="text-xl font-bold tracking-[-.045em]">SnapFoundry</p>
          <Badge variant="outline" className="ml-auto hidden sm:flex">
            <ShieldCheck data-icon="inline-start" /> Local workshop
          </Badge>
          <Input
            ref={fileRef}
            type="file"
            multiple
            accept="image/*"
            className="hidden"
            onChange={(event) => void importFiles(event.target.files)}
          />
          <Button onClick={() => fileRef.current?.click()}>
            <Upload data-icon="inline-start" /> Import batch
          </Button>
        </div>
      </header>
      <div className="mx-auto grid max-w-[94rem] xl:grid-cols-[17rem_minmax(0,1fr)_20rem]">
        <aside className="border-b bg-sidebar p-4 xl:min-h-[calc(100vh-4rem)] xl:border-b-0 xl:border-r xl:p-5">
          <div className="flex items-center gap-2">
            <LayoutGrid className="size-4" />
            <h2 className="font-semibold">Batch</h2>
            <Badge variant="secondary" className="ml-auto">
              {assets.length}
            </Badge>
          </div>
          <div className="mt-4 grid grid-cols-3 gap-2 xl:grid-cols-2">
            {assets.map((asset) => (
              <button
                key={asset.id}
                onClick={() => setSelected(asset.id)}
                className={`relative aspect-square overflow-hidden rounded-xl border-2 bg-card ${active?.id === asset.id ? 'border-primary' : 'border-transparent'}`}
              >
                {asset.processed ? (
                  <Image
                    src={asset.processed}
                    alt=""
                    fill
                    unoptimized
                    className="object-cover"
                  />
                ) : (
                  <Loader2 className="absolute left-1/2 top-1/2 size-5 -translate-x-1/2 -translate-y-1/2 animate-spin" />
                )}
                {asset.status === 'ready' && (
                  <span className="absolute right-1.5 top-1.5 grid size-5 place-items-center rounded-full bg-emerald-600 text-white">
                    <Check className="size-3" />
                  </span>
                )}
              </button>
            ))}
          </div>
          {assets.length > 0 && (
            <Button
              variant="ghost"
              className="mt-4 w-full justify-start"
              onClick={() => {
                generation.current++;
                setAssets([]);
                setSelected(null);
                setNotice('Batch cleared.');
              }}
            >
              <X data-icon="inline-start" /> Clear batch
            </Button>
          )}
        </aside>
        <section className="min-w-0 p-4 sm:p-7">
          <div className="mb-5 flex flex-wrap items-end justify-between gap-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[.18em] text-primary">
                Listing workshop
              </p>
              <h1 className="mt-2 text-3xl font-bold tracking-[-.05em] sm:text-5xl">
                Forge a cleaner first impression.
              </h1>
              <p
                aria-live="polite"
                className="mt-2 text-sm text-muted-foreground"
              >
                {notice}
              </p>
            </div>
            <Button
              disabled={!readyCount || exporting}
              onClick={() => void exportBatch()}
            >
              <Download data-icon="inline-start" />{' '}
              {exporting ? 'Packing…' : `Export ${readyCount || ''}`}
            </Button>
          </div>
          {active ? (
            <div className="grid gap-4 lg:grid-cols-2">
              <figure className="overflow-hidden rounded-[1.6rem] border bg-card p-3">
                <figcaption className="mb-3 flex items-center justify-between px-1 text-sm font-semibold">
                  Original <Badge variant="secondary">Source locked</Badge>
                </figcaption>
                <div className="relative aspect-square overflow-hidden rounded-xl bg-[linear-gradient(45deg,#ddd_25%,transparent_25%),linear-gradient(-45deg,#ddd_25%,transparent_25%),linear-gradient(45deg,transparent_75%,#ddd_75%),linear-gradient(-45deg,transparent_75%,#ddd_75%)] bg-[length:20px_20px] bg-[position:0_0,0_10px,10px_-10px,-10px_0px]">
                  <Image
                    src={active.original}
                    alt={`Original ${active.name}`}
                    fill
                    unoptimized
                    className="object-contain"
                  />
                </div>
              </figure>
              <figure className="overflow-hidden rounded-[1.6rem] border-2 border-primary bg-card p-3 shadow-lg">
                <figcaption className="mb-3 flex items-center justify-between px-1 text-sm font-semibold">
                  Listing preview{' '}
                  <Badge className="bg-emerald-700">
                    <PackageCheck data-icon="inline-start" /> {active.status}
                  </Badge>
                </figcaption>
                <div className="relative aspect-square overflow-hidden rounded-xl bg-white">
                  <Image
                    src={active.processed || active.original}
                    alt={`Processed ${active.name}`}
                    fill
                    unoptimized
                    className="object-contain"
                  />
                </div>
              </figure>
            </div>
          ) : (
            <button
              onClick={() => fileRef.current?.click()}
              className="grid min-h-[32rem] w-full place-items-center rounded-[2rem] border-2 border-dashed bg-card/60 p-5 text-center"
            >
              <div className="max-w-lg">
                <Image
                  src="/og.png"
                  alt="SnapFoundry batch product-photo workflow"
                  width={420}
                  height={221}
                  className="mx-auto mb-5 rounded-2xl border object-cover shadow-sm"
                />
                <span className="mx-auto grid size-14 place-items-center rounded-2xl bg-secondary">
                  <Upload className="size-6" />
                </span>
                <h2 className="mt-4 text-xl font-bold">
                  Drop in a product-photo batch
                </h2>
                <p className="mt-2 text-sm text-muted-foreground">
                  PNG, JPEG, WebP, or HEIC supported by your browser · up to 40
                </p>
                <p className="mt-1 text-xs text-muted-foreground">
                  Quick cutout works best on plain white or light backgrounds.
                </p>
              </div>
            </button>
          )}
        </section>
        <aside className="border-t bg-sidebar p-5 xl:border-l xl:border-t-0">
          <div className="flex items-center gap-2">
            <SlidersHorizontal className="size-4" />
            <h2 className="font-semibold">Batch recipe</h2>
          </div>
          <div className="mt-6 space-y-6">
            <label className="block text-sm font-medium">
              Background
              <div className="mt-2 grid grid-cols-2 gap-2">
                {(Object.keys(bgColors) as BackgroundMode[]).map((value) => (
                  <Button
                    key={value}
                    variant={background === value ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setBackground(value)}
                    className="capitalize"
                  >
                    {value}
                  </Button>
                ))}
              </div>
            </label>
            <label className="block text-sm font-medium">
              Edge cleanup · {threshold}
              <Slider
                className="mt-3"
                value={[threshold]}
                min={4}
                max={70}
                step={1}
                onValueChange={(value) =>
                  setThreshold(
                    typeof value === 'number' ? value : (value[0] ?? 24),
                  )
                }
              />
              <span className="mt-2 block text-xs font-normal leading-5 text-muted-foreground">
                Higher values remove more light background. Review pale products
                carefully.
              </span>
            </label>
            <label className="block text-sm font-medium">
              Canvas padding · {padding}%
              <Slider
                className="mt-3"
                value={[padding]}
                min={0}
                max={20}
                step={1}
                onValueChange={(value) =>
                  setPadding(
                    typeof value === 'number' ? value : (value[0] ?? 8),
                  )
                }
              />
            </label>
            <label className="block text-sm font-medium">
              Output ratio
              <select
                value={ratio}
                onChange={(event) =>
                  setRatio(event.target.value as 'square' | 'portrait')
                }
                className="mt-2 h-10 w-full rounded-xl border bg-card px-3"
              >
                <option value="square">Square · 1:1</option>
                <option value="portrait">Portrait · 4:5</option>
              </select>
            </label>
            <Button
              variant="outline"
              className="w-full justify-start"
              onClick={() => void rerenderAll()}
              disabled={!assets.length}
            >
              <RefreshCcw data-icon="inline-start" /> Rebuild previews
            </Button>
          </div>
          <div className="mt-8 rounded-2xl bg-primary p-4 text-primary-foreground">
            <p className="flex items-center gap-2 text-sm font-semibold">
              <WandSparkles className="size-4 text-accent" /> Honest edges
            </p>
            <p className="mt-2 text-xs leading-5 opacity-75">
              This first build uses deterministic light-background removal—not a
              hidden cloud model. Transparent, furry, and pale edges need
              careful review.
            </p>
          </div>
        </aside>
      </div>
    </main>
  );
}
