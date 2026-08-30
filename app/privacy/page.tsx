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
      'When you connect Xaman or complete a transaction, we process public XRP Ledger information such as your public wallet address, transaction hash, NFT offer status, and pack order details. We do not receive or store your private keys, recovery phrase, or Xaman credentials.',
      'We may also collect limited technical information needed to operate and secure the service, including request timestamps, device or browser information, IP-derived security signals, error logs, and aggregate usage analytics.',
    ],
  },
  {
    title: '2. How we use information',
    paragraphs: [
      'We use information to prepare packs, verify payments, create and track NFT offers, provide recovery tools, prevent abuse, diagnose errors, and improve the reliability of Ledgerborn.',
      'Public blockchain activity is used only as necessary to deliver the service and verify transactions. We do not sell personal information.',
    ],
  },
  {
    title: '3. Xaman and the XRP Ledger',
    paragraphs: [
      'Wallet connection and transaction approval are handled through Xaman. Xaman applies its own privacy terms. Transactions submitted to the XRP Ledger are public, permanent, and outside Ledgerborn’s control; they cannot be altered or deleted by us.',
    ],
  },
  {
    title: '4. Cookies and analytics',
    paragraphs: [
      'Ledgerborn may use essential browser storage required for wallet connection and service continuity, plus privacy-conscious analytics to understand aggregate site usage. We do not use advertising cookies.',
    ],
  },
  {
    title: '5. Data retention and security',
    paragraphs: [
      'We retain operational records only for as long as reasonably needed to provide the service, meet legal obligations, resolve disputes, and protect against fraud. We use reasonable technical and organisational safeguards, but no internet or blockchain service can guarantee absolute security.',
    ],
  },
  {
    title: '6. Your choices and rights',
    paragraphs: [
      'Depending on where you live, you may have rights concerning personal information we control, including access, correction, deletion, or objection. These rights do not extend to immutable public XRP Ledger records.',
    ],
  },
  {
    title: '7. Changes to this policy',
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
      updated="30 August 2026"
      sections={sections}
    />
  )
}
