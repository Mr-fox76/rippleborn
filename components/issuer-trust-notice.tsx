import Image from 'next/image'
import { ExternalLink, ShieldCheck } from 'lucide-react'
import type { LatestMintedNft } from '@/lib/pack-results'

const ISSUER_ADDRESS = 'rhjYMiwkvVMmDXNZGG2EXg8fnNLiM9Mgwv'

export function IssuerTrustNotice({ latestNfts }: { latestNfts: LatestMintedNft[] }) {
  return (
    <aside aria-labelledby="issuer-notice-heading" className="mx-auto flex w-full max-w-7xl flex-col gap-4 rounded-lg border border-gold/35 bg-card/70 p-4 backdrop-blur-md sm:p-5">
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
        <div className="flex flex-col gap-3 border-t border-border/70 pt-4">
          <p className="font-mono text-[0.68rem] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
            Latest NFTs on-ledger
          </p>
          <ul className="grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-3 lg:grid-cols-5">
            {latestNfts.map((nft) => {
              const rarityClass = `rarity-${nft.rarity.toLowerCase().replace(/[^a-z]+/g, '-')}`

              return (
                <li key={nft.nftId} className={rarityClass}>
                  <a
                    href={`https://bithomp.com/nft/${nft.nftId}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label={`View ${nft.name} NFT ${nft.nftId} on Bithomp`}
                    className="collection-display-card group block h-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  >
                    <div className="collection-display-art relative aspect-[2/3] overflow-hidden bg-background">
                      <Image
                        src={nft.image}
                        alt={`${nft.name} NFT artwork`}
                        fill
                        loading="lazy"
                        sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 20vw"
                        className="object-cover transition-transform duration-500 group-hover:scale-[1.025]"
                      />
                      <div className="collection-display-sheen" aria-hidden="true" />
                      {nft.discoveryNumber && nft.discoveredTotal ? (
                        <span className="collection-discovery-mark">
                          {nft.discoveryNumber} of {nft.discoveredTotal} discovered
                        </span>
                      ) : null}
                      <span className="collection-edition-mark" aria-hidden="true">LB</span>
                      <div className="collection-card-caption flex items-end justify-between gap-2">
                        <div className="flex min-w-0 flex-col gap-1">
                          <h3 className="text-pretty text-sm font-semibold leading-snug text-foreground">{nft.name}</h3>
                          <span className="collection-rarity-seal">{nft.rarity}</span>
                        </div>
                        <ExternalLink className="size-4 shrink-0 text-foreground/70 transition-colors group-hover:text-[var(--rarity-color)]" aria-hidden="true" />
                      </div>
                    </div>
                  </a>
                </li>
              )
            })}
          </ul>
        </div>
      ) : null}
    </aside>
  )
}
