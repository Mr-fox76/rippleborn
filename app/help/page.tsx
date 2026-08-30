import type { Metadata } from 'next'
import { HelpPage } from '@/components/help-page'

export const metadata: Metadata = {
  title: 'Help & Support | Ledgerborn',
  description: 'Answers to common questions about Ledgerborn packs, Xaman payments, NFT delivery, rarity, and recovery.',
}

export default function SupportPage() {
  return <HelpPage />
}
