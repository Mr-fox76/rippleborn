import { ExternalLink, ShieldCheck } from 'lucide-react'
import type { LatestMintedNft } from '@/lib/pack-results'

const ISSUER_ADDRESS = 'rhjYMiwkvVMmDXNZGG2EXg8fnNLiM9Mgwv'

function shortenedNftId(nftId: string) {
  return `${nftId.slice(0, 8)}…${nftId.slice(-6)}`
}

export function IssuerTrustNotice({ latestNfts }: { latestNfts: LatestMintedNft[] }) {
  return (
    <aside aria-labelledby="issuer-notice-heading" className="mx-auto flex w-full max-w-4xl flex-col gap-4 rounded-lg border border-gold/35 bg-card/70 p-4 backdrop-blur-md sm:p-5">
      <div className="flex items-start gap-3">
        <ShieldCheck aria-hidden="true" className="mt-0.5 size-5 shrink-0 text-gold" />
        <div className="flex min-w-0 flex-col gap-1">
          <h2 id="issuer-notice-heading" className="font-sans text-sm font-semibold text-foreground">
            New XRPL issuer
          </h2>
          <p className="text-sm leading-relaxed text-muted-foreground">
            Xaman may show a warning while the issuer builds transaction history. Verify Ledgerborn and its activity independently on{' '}
            <a
              href={`https://bithomp.com/explorer/${ISSUER_ADDRESS}`}
              target="_blank"
              rel="noopener noreferrer"
              className="font-medium text-gold underline underline-offset-4 transition-colors hover:text-foreground"
            >
              Bithomp
              <ExternalLink aria-hidden="true" className="ml-1 inline size-3.5" />
            </a>
            .
          </p>
        </div>
      </div>

      {latestNfts.length > 0 ? (
        <div className="flex flex-col gap-2 border-t border-border/70 pt-4 sm:flex-row sm:items-center sm:justify-between">
          <p className="shrink-0 font-mono text-[0.68rem] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
            Latest NFTs on-ledger
          </p>
          <ul className="flex flex-wrap gap-2">
            {latestNfts.map((nft) => (
              <li key={nft.nftId}>
                <a
                  href={`https://bithomp.com/nft/${nft.nftId}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={`View ${nft.name} NFT ${nft.nftId} on Bithomp`}
                  className="interface-chip inline-flex items-center gap-1.5 border border-border px-2.5 py-1.5 font-mono text-[0.68rem] text-foreground transition-colors hover:border-gold/60 hover:text-gold"
                >
                  <span className="max-w-36 truncate">{nft.name}</span>
                  <span className="text-muted-foreground">{shortenedNftId(nft.nftId)}</span>
                  <ExternalLink aria-hidden="true" className="size-3" />
                </a>
              </li>
            ))}
          </ul>
        </div>
      ) : null}
    </aside>
  )
}
