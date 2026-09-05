import type { Metadata } from 'next';
import { Geist, Geist_Mono } from 'next/font/google';
import './globals.css';

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
});

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
});

const siteUrl = 'https://snapfoundry.nex3sss.chatgpt.site';

export const metadata: Metadata = {
  title: 'SnapFoundry — Open-source batch product photos, no uploads',
  description:
    'Free private product-photo workshop and PhotoRoom alternative. Remove light backgrounds in the browser, apply marketplace recipes, export a ZIP with a manifest.',
  keywords: [
    'open source photoroom alternative',
    'batch background removal',
    'marketplace product photos',
    'local image processing',
    'etsy listing photos',
  ],
  authors: [{ name: 'SnapFoundry contributors' }],
  category: 'photography',
  metadataBase: new URL(siteUrl),
  alternates: { canonical: siteUrl },
  openGraph: {
    type: 'website',
    url: siteUrl,
    title: 'SnapFoundry — Listing photos, forged in batches',
    description: 'Private in-browser batch product-photo workshop. No accounts or uploads.',
    images: ['/og.png'],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'SnapFoundry — Listing photos, forged in batches',
    description: 'Private in-browser batch product-photo workshop. No accounts or uploads.',
    images: ['/og.png'],
  },
};

const jsonLd = {
  '@context': 'https://schema.org',
  '@type': 'SoftwareApplication',
  name: 'SnapFoundry',
  applicationCategory: 'MultimediaApplication',
  operatingSystem: 'Web',
  offers: { '@type': 'Offer', price: '0', priceCurrency: 'USD' },
  description:
    'Private browser-based batch product-photo workshop for marketplace sellers.',
  url: siteUrl,
  downloadUrl: 'https://github.com/Satwik-P28/snapfoundry',
  license: 'https://opensource.org/licenses/MIT',
  isAccessibleForFree: true,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
        {children}
      </body>
    </html>
  );
}
