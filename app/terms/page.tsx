import type { Metadata } from 'next'
import { LegalPage } from '@/components/legal-page'

export const metadata: Metadata = {
  title: 'Terms and Conditions | Ledgerborn',
  description: 'Terms governing use of Ledgerborn and its XRPL collectible card packs.',
}

const sections = [
  {
    title: '1. Acceptance of these terms',
    paragraphs: [
      'By accessing Ledgerborn, connecting a wallet, purchasing a pack, or claiming an NFT, you agree to these Terms and Conditions. If you do not agree, do not use the service. You must be legally able to enter into this agreement and meet any minimum age requirement in your jurisdiction.',
    ],
  },
  {
    title: '2. The service',
    paragraphs: [
      'Ledgerborn offers digital collectible card packs delivered through the XRP Ledger. Pack contents are selected according to the rarity information presented before purchase. Availability, artwork, pack composition, and features may change over time.',
      'Ledgerborn is independent and is not affiliated with, endorsed by, or sponsored by Ledger, Ripple, Xaman, or the XRP Ledger Foundation.',
    ],
  },
  {
    title: '3. Wallets and transactions',
    paragraphs: [
      'You are responsible for your Xaman wallet, device security, public address, transaction approvals, and recovery credentials. Ledgerborn will never ask for your private key or recovery phrase.',
      'Blockchain transactions are generally irreversible. You must review the amount, destination, and transaction details shown in Xaman before approval. Network fees, delays, outages, and rejected transactions may occur outside our control.',
    ],
  },
  {
    title: '4. Purchases, claims, and availability',
    paragraphs: [
      'Prices are displayed in XRP. A purchase is complete only after payment is validated and the pack is successfully prepared. You are responsible for promptly accepting NFT offers presented through the claim flow before they expire.',
      'If a technical issue prevents delivery after a confirmed payment, use the recovery function made available in the service. Refunds are not guaranteed where a digital collectible has been delivered, claimed, or transferred, except where required by applicable law.',
    ],
  },
  {
    title: '5. Digital collectibles and risk',
    paragraphs: [
      'Ledgerborn cards are digital collectibles, not investments, securities, financial products, or promises of future value. Rarity does not guarantee market value. XRP and NFTs can be volatile, illiquid, or lose all perceived value. You are solely responsible for assessing tax, legal, and financial consequences.',
    ],
  },
  {
    title: '6. Acceptable use and intellectual property',
    paragraphs: [
      'You must not interfere with the service, exploit errors, automate abusive requests, evade purchase limits, attempt unauthorised access, or use Ledgerborn unlawfully.',
      'The Ledgerborn name, site design, original artwork, text, and associated materials remain protected by applicable intellectual-property rights. Ownership of an NFT does not transfer copyright or commercial rights in its artwork unless expressly stated.',
    ],
  },
  {
    title: '7. Availability and liability',
    paragraphs: [
      'The service is provided on an “as available” basis. To the extent permitted by law, we make no guarantee that it will always be uninterrupted, error-free, or compatible with every wallet or network condition.',
      'To the fullest extent permitted by law, Ledgerborn is not liable for indirect or consequential loss, loss caused by wallet compromise, user error, market changes, third-party services, or XRP Ledger conditions. Nothing in these terms excludes liability that cannot lawfully be excluded.',
    ],
  },
  {
    title: '8. Changes and termination',
    paragraphs: [
      'We may modify, suspend, or discontinue features and may update these terms. We may restrict access where necessary to protect users, comply with law, or prevent misuse. The latest version and update date will remain available on this page.',
    ],
  },
]

export default function TermsPage() {
  return (
    <LegalPage
      title="Terms and Conditions"
      summary="These terms govern your use of Ledgerborn, pack purchases, Xaman approvals, and XRP Ledger collectibles."
      updated="30 August 2026"
      sections={sections}
    />
  )
}
