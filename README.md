# SnapFoundry

Listing photos, forged in batches.

SnapFoundry is a private browser-based product-photo workshop for marketplace sellers. It imports a local batch, removes light backgrounds deterministically, applies consistent canvas recipes, previews every result, and exports a ZIP with a manifest.

![SnapFoundry preview](public/og.png)

## Working today

- Up to 40 local images per batch
- Deterministic light-background removal without cloud processing
- White, transparent, mint, and coral output backgrounds
- Edge-threshold and canvas-padding controls
- Square and 4:5 marketplace ratios
- Original-versus-result review
- Batch ZIP export with predictable filenames and CSV manifest
- No accounts, credits, or uploads

The first cutout engine works best with products photographed against plain light backgrounds. It does not pretend to match a trained segmentation model on fur, glass, pale products, or complex scenes; those results require careful review.

## Develop

Requires Node.js 22.13 or later.

```bash
npm install
npm run dev
```

Run `npm run check` and `npm audit` before contributing.

## Architecture

React 19, TypeScript, browser Canvas, JSZip, Vinext/Vite, Tailwind CSS, and shadcn components. Pixel classification and output geometry are tested with Vitest.

SnapFoundry is independent and is not affiliated with PhotoRoom or any marketplace.

## License

MIT
