import Image from 'next/image'
import Link from 'next/link'
import { ArrowLeft, CheckCircle2, ChevronDown, ShieldCheck } from 'lucide-react'

const faqGroups = [
  {
    title: 'Buying a pack',
    description: 'Connecting Xaman, approving payment, and understanding the opening flow.',
    questions: [
      {
        question: 'What do I need before buying a pack?',
        answer:
          'You need Xaman installed and an activated XRP Ledger Mainnet account with enough real XRP for the pack price and network fee. Make sure Xaman is connected to Mainnet before you connect.',
      },
      {
        question: 'How do I connect Xaman?',
        answer:
          'Select Connect Xaman, then scan the QR code with Xaman or use the mobile handoff. Approve only the sign-in request shown by Xaman. Connecting proves control of your public wallet address; it never gives Ledgerborn access to your private keys.',
      },
      {
        question: 'Why is my payment still pending?',
        answer:
          'Keep the Ledgerborn tab open while you approve the request in Xaman. A payment can remain pending while the XRP Ledger validates it or while the browser waits for confirmation. Do not submit a second payment immediately—first check your Xaman transaction history for a validated transaction.',
      },
      {
        question: 'Can I cancel or reverse a payment?',
        answer:
          'An XRP Ledger Mainnet transaction cannot be reversed after validation. You can reject an unsigned request in Xaman, but always confirm that the request uses Mainnet and verify the real-XRP amount and destination before approving payment.',
      },
    ],
  },
  {
    title: 'Cards and delivery',
    description: 'Opening packs, NFT offers, rarity, and duplicate cards.',
    questions: [
      {
        question: 'How many cards are in each pack?',
        answer:
          'Each pack contains three collectible cards from the selected set. The pack page shows the available collection, price, card count, and rarity odds before you approve payment.',
      },
      {
        question: 'How are rarity and pack contents decided?',
        answer:
          'Pack contents are selected using the rarity odds displayed on the pack page. Each reveal is independent, so a rarity tier is never guaranteed unless the pack page explicitly says otherwise. Rarity describes scarcity, not financial value.',
      },
      {
        question: 'Can I receive duplicate cards?',
        answer:
          'Yes. Pack results are independent and duplicates are possible within your wider collection. A previous pull does not remove that card from future pack results.',
      },
      {
        question: 'Where are my NFTs delivered?',
        answer:
          'Cards are delivered to the XRP Ledger wallet connected when you bought the pack. You may need to accept the NFT offers shown after the reveal. Review each offer in Xaman and accept it before it expires.',
      },
      {
        question: 'I paid, but my cards did not appear. What should I do?',
        answer:
          'Return with the same wallet and use the recovery panel on a pack page. It can locate eligible paid orders and resume outstanding NFT claims. Check Xaman for pending offers as well as your wallet collection before trying another purchase.',
      },
    ],
  },
  {
    title: 'Troubleshooting and safety',
    description: 'Common browser, wallet, network, and security questions.',
    questions: [
      {
        question: 'Why does Ledgerborn show the wrong wallet?',
        answer:
          'Disconnect, confirm the active account in Xaman, and reconnect. If you use more than one Xaman account, compare the first and last characters of the address before approving any request.',
      },
      {
        question: 'What should I try if a button or QR code does not work?',
        answer:
          'Wait a moment for the current request to expire, refresh the page once, and reconnect Xaman. Disable aggressive content blockers for Ledgerborn and avoid opening multiple purchase tabs. On mobile, return to the browser after completing the Xaman request.',
      },
      {
        question: 'Does Ledgerborn store my private key or recovery phrase?',
        answer:
          'No. Ledgerborn only uses your public wallet address and public transaction information needed to provide the service. Never enter a private key, family seed, or recovery phrase into this site—or share it with anyone claiming to provide support.',
      },
      {
        question: 'How can I verify a transaction?',
        answer:
          'Open the transaction in Xaman and confirm that it is validated, then note its transaction hash, destination, amount, and timestamp. Public XRP Ledger explorers can also display the same on-ledger details.',
      },
    ],
  },
]

const retryItems = [
  'Confirm the connected public wallet address.',
  'Check whether the transaction is validated in Xaman.',
  'Save the transaction hash and approximate transaction time.',
  'Note the pack or set name you attempted to open.',
  'Check for pending NFT offers before paying again.',
]

export function HelpPage() {
  return (
    <div className="table-surface flex min-h-svh flex-col">
      <header className="relative z-10 border-b border-border/40 px-4 py-4 sm:px-6">
        <div className="mx-auto flex w-full max-w-5xl items-center justify-between gap-4">
          <Link href="/" className="inline-flex items-center gap-2 font-mono text-xs uppercase tracking-[0.16em] text-muted-foreground transition-colors hover:text-primary">
            <ArrowLeft className="size-4" aria-hidden="true" />
            Pack store
          </Link>
          <Link href="/" aria-label="Ledgerborn home" className="inline-flex items-center gap-2">
            <Image src="/images/ledgerborn-symbol.png" alt="" width={48} height={42} className="h-9 w-10 object-contain" />
            <span className="hidden font-sans text-sm font-semibold tracking-[0.12em] text-foreground sm:inline">LEDGERBORN</span>
          </Link>
          <p className="font-mono text-[0.65rem] uppercase tracking-[0.2em] text-gold">Support</p>
        </div>
      </header>

      <main className="relative z-10 mx-auto flex w-full max-w-5xl flex-1 flex-col gap-12 px-4 py-10 sm:px-6 sm:py-16">
        <section aria-labelledby="help-heading" className="flex flex-col gap-5 border-b border-border/40 pb-10">
          <p className="font-mono text-xs uppercase tracking-[0.24em] text-gold">Help centre</p>
          <h1 id="help-heading" className="max-w-3xl font-sans text-4xl font-semibold tracking-tight text-balance sm:text-6xl">
            Answers before your next reveal.
          </h1>
          <p className="max-w-2xl text-base leading-relaxed text-muted-foreground sm:text-lg">
            Find guidance for Xaman connections, pack payments, card delivery, recovery, and safe use of Ledgerborn.
          </p>
        </section>

        <div className="flex flex-col gap-12">
          {faqGroups.map((group) => (
            <section key={group.title} aria-labelledby={`faq-${group.title.toLowerCase().replaceAll(' ', '-')}`} className="grid gap-6 lg:grid-cols-[17rem_1fr] lg:gap-10">
              <div className="flex flex-col gap-2">
                <h2 id={`faq-${group.title.toLowerCase().replaceAll(' ', '-')}`} className="font-sans text-xl font-semibold text-foreground">
                  {group.title}
                </h2>
                <p className="text-sm leading-relaxed text-muted-foreground">{group.description}</p>
              </div>
              <div className="support-faq-list flex flex-col border-t border-border/50">
                {group.questions.map((item) => (
                  <details key={item.question} className="support-faq border-b border-border/50">
                    <summary className="flex cursor-pointer list-none items-center justify-between gap-4 py-5 font-sans text-base font-semibold text-foreground transition-colors hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-4 focus-visible:ring-offset-background sm:text-lg">
                      <span>{item.question}</span>
                      <ChevronDown className="support-faq-icon size-5 shrink-0 text-primary" aria-hidden="true" />
                    </summary>
                    <p className="max-w-3xl pb-6 text-sm leading-relaxed text-muted-foreground sm:text-base">{item.answer}</p>
                  </details>
                ))}
              </div>
            </section>
          ))}
        </div>

        <section aria-labelledby="retry-heading" className="grid gap-8 border border-primary/30 bg-card/45 p-6 sm:p-8 lg:grid-cols-[1fr_1.35fr] lg:p-10">
          <div className="flex flex-col items-start gap-4">
            <ShieldCheck className="size-8 text-primary" aria-hidden="true" />
            <div className="flex flex-col gap-2">
              <p className="font-mono text-xs uppercase tracking-[0.2em] text-gold">Before you retry</p>
              <h2 id="retry-heading" className="font-sans text-2xl font-semibold text-balance sm:text-3xl">Pause before sending another payment.</h2>
            </div>
            <p className="text-sm leading-relaxed text-muted-foreground sm:text-base">
              These details help you confirm what happened and use the built-in recovery flow without creating a duplicate purchase.
            </p>
          </div>
          <ul className="flex flex-col gap-4" aria-label="Retry checklist">
            {retryItems.map((item) => (
              <li key={item} className="flex items-start gap-3 text-sm leading-relaxed text-foreground sm:text-base">
                <CheckCircle2 className="mt-0.5 size-5 shrink-0 text-primary" aria-hidden="true" />
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </section>
      </main>

      <footer className="relative z-10 border-t border-border/40 px-6 py-6">
        <nav aria-label="Footer navigation" className="flex flex-wrap items-center justify-center gap-4 font-mono text-xs uppercase tracking-[0.14em]">
          <Link href="/" className="text-muted-foreground underline-offset-4 transition-colors hover:text-foreground hover:underline">Store</Link>
          <Link href="/help" aria-current="page" className="text-foreground underline-offset-4">Help</Link>
          <Link href="/privacy" className="text-muted-foreground underline-offset-4 transition-colors hover:text-foreground hover:underline">Privacy policy</Link>
          <Link href="/terms" className="text-muted-foreground underline-offset-4 transition-colors hover:text-foreground hover:underline">Terms &amp; conditions</Link>
        </nav>
      </footer>
    </div>
  )
}
