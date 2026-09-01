import type { Metadata } from 'next'
import { LegalPage } from '@/components/legal-page'

export const metadata: Metadata = {
  title: 'Privacy Policy | Ledgerborn',
  description: 'How Ledgerborn handles information when you use its XRPL collectible card experience.',
}

const sections = [
  {
    title: '1. Information we process',
    paragraphs: [
      'When you connect Xaman or complete a transaction, we process public XRP Ledger information such as your public wallet address, payment and claim transaction hashes, NFT identifiers, NFT offer identifiers and status, claim timestamps, and pack order details. We do not receive or store your private keys, family seed, recovery phrase, or Xaman credentials.',
      'To deliver packs we keep server-side operational records, including order and payment status, the committed pack result and its cards, mint status and minted NFT identifiers, claim and offer status, and recovery or metadata-replacement records associated with your public wallet address.',
      'We may also collect limited technical information needed to operate and secure the service, including request timestamps, device or browser information, IP-derived security signals, error logs, and aggregate usage counters.',
    ],
  },
  {
    title: '2. How we use information',
    paragraphs: [
      'We use information to prepare packs, verify payments, mint collectibles, create and track destination-restricted NFT offers, power the recovery and retry tools, display your collection, prevent abuse, diagnose errors, and improve the reliability of Ledgerborn.',
      'Public blockchain activity is used only as necessary to deliver the service and verify transactions. We do not sell personal information.',
    ],
  },
  {
    title: '3. Your collection and local storage',
    paragraphs: [
      'The Collection view reads the collectibles publicly held by your connected XRP Ledger wallet. To load faster, Ledgerborn may cache rendered collection data in your browser’s local storage, keyed to your public wallet address. This cache stays on your device.',
      'You can clear this local cache at any time by clearing your browser site data for Ledgerborn or using your browser’s storage controls. Clearing it does not affect the collectibles held on-ledger by your wallet.',
    ],
  },
  {
    title: '4. Public displays',
    paragraphs: [
      'Ledgerborn may show recent on-ledger mint activity, such as latest collectibles, using public XRP Ledger data. This information is already public on the ledger and is displayed to illustrate live activity.',
    ],
  },
  {
    title: '5. Xaman, the XRP Ledger, and other providers',
    paragraphs: [
      'Wallet connection and transaction approval are handled through Xaman, which applies its own privacy terms. Transactions submitted to the XRP Ledger are public, permanent, and outside Ledgerborn’s control; they cannot be altered or deleted by us.',
      'To run the service we also rely on infrastructure such as database and hosting providers, XRP Ledger nodes and public explorers, and hosted services that store collectible metadata and media. These providers process information only as needed to operate Ledgerborn.',
    ],
  },
  {
    title: '6. Cookies and analytics',
    paragraphs: [
      'Ledgerborn may use essential browser storage required for wallet connection, collection caching, and service continuity, plus privacy-conscious analytics to understand aggregate site usage. We do not use advertising cookies.',
    ],
  },
  {
    title: '7. Data retention and security',
    paragraphs: [
      'We retain operational database records only for as long as reasonably needed to provide the service, support recovery, meet legal obligations, resolve disputes, and protect against fraud. Browser-local collection cache remains on your device until you clear it.',
      'We use reasonable technical and organisational safeguards, but no internet, hosting, or blockchain service can guarantee absolute security. Public on-ledger records and any hosted collectible metadata are outside our ability to delete or alter.',
    ],
  },
  {
    title: '8. Your choices and rights',
    paragraphs: [
      'Depending on where you live, you may have rights concerning personal information we control, including access, correction, deletion, or objection. These rights apply to our operational records and do not extend to immutable public XRP Ledger records or already-public on-ledger activity.',
    ],
  },
  {
    title: '9. Changes to this policy',
    paragraphs: [
      'We may update this policy as Ledgerborn evolves. Material changes will be reflected on this page with a revised update date. Continued use after a change means the updated policy applies.',
    ],
  },
]

export default function PrivacyPage() {
  return (
    <LegalPage
      title="Privacy Policy"
      summary="This policy explains what information Ledgerborn processes, why it is used, and the choices available to you."
      updated="1 September 2026"
      sections={sections}
    />
  )
}
