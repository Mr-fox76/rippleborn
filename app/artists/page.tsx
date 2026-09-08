import type { Metadata } from 'next'
import { ArtistsPage } from '@/components/artists-page'

export const metadata: Metadata = {
  title: 'Artists | Ledgerborn',
  description: 'Ledgerborn works with one artist per set on the XRP Ledger. See what you get, what we handle, and how to start a set.',
}

export default function Page() {
  return <ArtistsPage />
}
