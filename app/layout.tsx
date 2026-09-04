import { Analytics } from '@vercel/analytics/next'
import type { Metadata, Viewport } from 'next'
import { JetBrains_Mono, Space_Grotesk } from 'next/font/google'
import { XamanWalletProvider } from '@/components/xaman-wallet-provider'
import './globals.css'

const _spaceGrotesk = Space_Grotesk({ subsets: ['latin'] })
const _jetBrainsMono = JetBrains_Mono({ subsets: ['latin'] })

export const metadata: Metadata = {
  metadataBase: new URL('https://ledgerborn.app'),
  title: {
    default: 'Ledgerborn | XRP Ledger NFT Card Packs',
    template: '%s | Ledgerborn',
  },
  description:
    'Open Ledgerborn digital collectible card packs and claim three original NFTs on the XRP Ledger for 5 XRP using Xaman.',
  applicationName: 'Ledgerborn',
  category: 'Digital collectibles',
  keywords: [
    'Ledgerborn',
    'XRPL NFTs',
    'XRP Ledger NFT',
    'NFT card packs',
    'digital collectible cards',
    'Xaman NFT',
    'XRP collectibles',
  ],
  authors: [{ name: 'Ledgerborn', url: 'https://ledgerborn.app' }],
  creator: 'Ledgerborn',
  publisher: 'Ledgerborn',
  alternates: {
    canonical: '/',
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-image-preview': 'large',
      'max-snippet': -1,
      'max-video-preview': -1,
    },
  },
  generator: 'v0.app',
  openGraph: {
    type: 'website',
    url: 'https://ledgerborn.app',
    siteName: 'Ledgerborn',
    title: 'Ledgerborn — XRPL NFT Card Packs',
    description:
      'Open the ledger. Pull the myth. Discover collectible XRPL NFT card packs.',
    images: [
      {
        url: '/images/cyborg-card-style-sample.png',
        width: 1024,
        height: 1024,
        alt: 'Cyborg cowboy collectible artwork from Ledgerborn',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Ledgerborn — XRPL NFT Card Packs',
    description:
      'Open the ledger. Pull the myth. Discover collectible XRPL NFT card packs.',
    images: ['/images/cyborg-card-style-sample.png'],
  },
  icons: {
    icon: {
      url: '/icon.svg',
      type: 'image/svg+xml',
    },
    shortcut: '/icon.svg',
    apple: '/apple-icon.png',
  },
}

export const viewport: Viewport = {
  colorScheme: 'dark',
  themeColor: '#07171d',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" className="bg-background">
      <body className="antialiased">
        <XamanWalletProvider>{children}</XamanWalletProvider>
        {process.env.NODE_ENV === 'production' && <Analytics />}
      </body>
    </html>
  )
}
