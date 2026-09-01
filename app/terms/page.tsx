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
      'By accessing Ledgerborn, connecting a wallet, purchasing a pack, revealing cards, or claiming an NFT, you agree to these Terms and Conditions. If you do not agree, do not use the service. You must be legally able to enter into this agreement and meet any minimum age requirement in your jurisdiction.',
    ],
  },
  {
    title: '2. The service',
    paragraphs: [
      'Ledgerborn offers digital collectible card packs delivered through the XRP Ledger. A pack purchase starts a multi-step process: payment validation, pack preparation, card reveal, NFT minting, creation of destination-restricted NFT offers, and acceptance of those offers by your wallet. Some steps may complete at different times.',
      'Availability, artwork, pack composition, prices, rarity odds, collections, and features may change over time. Ledgerborn is independent and is not affiliated with, endorsed by, or sponsored by Ledger, Ripple, Xaman, or the XRP Ledger Foundation.',
    ],
  },
  {
    title: '3. Wallets and transaction approvals',
    paragraphs: [
      'You are responsible for your Xaman wallet, device security, public address, transaction approvals, and recovery credentials. Ledgerborn will never ask for your private key, family seed, or recovery phrase.',
      'You must review the network, amount, destination, NFT offer, and other transaction details shown in Xaman before approval. Blockchain transactions are generally irreversible. Network fees, delays, outages, expired requests, rejected transactions, and wallet handoff issues may occur outside our control.',
    ],
  },
  {
    title: '4. Purchases and pack contents',
    paragraphs: [
      'Prices are displayed in XRP. A paid order is recognised only after its payment is validated on the XRP Ledger. Do not send a second payment merely because the browser remains pending; first check Xaman and the ledger for the original transaction.',
      'Pack contents are generated according to the rarity information presented for that set. Unless expressly stated otherwise, individual rarities and specific cards are not guaranteed. Pack results are independent, duplicate cards are possible, and rarity describes collectible scarcity rather than financial value.',
    ],
  },
  {
    title: '5. Minting, offers, and claims',
    paragraphs: [
      'A revealed card is not necessarily in your wallet yet. After minting, Ledgerborn creates a destination-restricted NFT offer for the wallet used for the purchase. You must review and accept each available offer in Xaman to complete delivery.',
      'NFT offers and wallet signing requests can expire or be superseded. If an offer is unavailable, use the claim retry or recovery tools rather than paying again. Card metadata and media may be hosted separately from the ledger, while the NFT identifier and ownership remain public on-ledger.',
    ],
  },
  {
    title: '6. Recovery and incomplete delivery',
    paragraphs: [
      'If a confirmed payment does not result in completed claims, reconnect the same purchasing wallet and use the recovery function on a pack page. Recovery may locate eligible orders, resume minting, replace an invalid metadata reference, or create a fresh claim offer where supported.',
      'Recovery is intended for genuine incomplete orders and does not guarantee instant resolution under every network, wallet, metadata-hosting, or infrastructure condition. Keep your validated payment hash and approximate purchase time available when troubleshooting.',
    ],
  },
  {
    title: '7. Refunds and irreversible delivery',
    paragraphs: [
      'XRP Ledger payments and accepted NFT transfers cannot ordinarily be reversed. Refunds are not guaranteed where a collectible has been minted, offered, claimed, transferred, or otherwise delivered, except where required by applicable law.',
      'If you believe a validated payment has not been fulfilled, use the recovery tools and verify pending offers before initiating another purchase. Nothing in this section limits rights that cannot lawfully be excluded.',
    ],
  },
  {
    title: '8. Collection display and public records',
    paragraphs: [
      'The Collection view reflects public holdings reported for the connected XRP Ledger wallet and may use a temporary browser cache. It can take time to reflect a newly accepted offer, a transfer, or a ledger indexing update. Refreshing or clearing the browser cache does not change on-ledger ownership.',
      'Recent mint activity and transaction references shown by Ledgerborn are derived from public ledger data. Public blockchain records are permanent and outside our control.',
    ],
  },
  {
    title: '9. Digital collectibles and risk',
    paragraphs: [
      'Ledgerborn cards are digital collectibles, not investments, securities, financial products, or promises of future value. Rarity does not guarantee market value. XRP and NFTs can be volatile, illiquid, or lose all perceived value. You are responsible for assessing tax, legal, and financial consequences.',
    ],
  },
  {
    title: '10. Acceptable use and intellectual property',
    paragraphs: [
      'You must not interfere with the service, exploit errors, manipulate pack or claim flows, automate abusive requests, evade purchase limits, attempt unauthorised access, or use Ledgerborn unlawfully.',
      'The Ledgerborn name, site design, original artwork, text, and associated materials remain protected by applicable intellectual-property rights. Ownership of an NFT does not transfer copyright or commercial rights in its artwork unless expressly stated.',
    ],
  },
  {
    title: '11. Third-party services and availability',
    paragraphs: [
      'Ledgerborn relies on Xaman, XRP Ledger nodes, hosting, database, metadata, media, and related infrastructure. Their availability, policies, and performance are outside our control. The service is provided on an “as available” basis without a guarantee that it will always be uninterrupted, error-free, or compatible with every device or wallet condition.',
    ],
  },
  {
    title: '12. Limitation of liability',
    paragraphs: [
      'To the fullest extent permitted by law, Ledgerborn is not liable for indirect or consequential loss, loss caused by wallet compromise, incorrect approvals, user error, market changes, third-party services, metadata availability, or XRP Ledger conditions. Nothing in these terms excludes liability that cannot lawfully be excluded.',
    ],
  },
  {
    title: '13. Changes and termination',
    paragraphs: [
      'We may modify, suspend, or discontinue features and may update these terms. We may restrict access where necessary to protect users, comply with law, or prevent misuse. The latest version and update date will remain available on this page.',
    ],
  },
]

export default function TermsPage() {
  return (
    <LegalPage
      title="Terms and Conditions"
      summary="These terms govern Ledgerborn pack payments, card reveals, NFT minting and claims, recovery, and collection use."
      updated="1 September 2026"
      sections={sections}
    />
  )
}
