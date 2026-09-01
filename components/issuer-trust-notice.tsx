import Image from 'next/image'
import { ExternalLink, ShieldCheck } from 'lucide-react'
import type { LatestMintedNft } from '@/lib/pack-results'

const ISSUER_ADDRESS = 'rhjYMiwkvVMmDXNZGG2EXg8fnNLiM9Mgwv'

export function IssuerTrustNotice({ latestNfts }: { latestNfts: LatestMintedNft[] }) {
  return (
    <aside aria-labelledby="issuer-notice-heading" className="mx-auto flex w-full max-w-7xl flex-col gap-5">
      {latestNfts.length > 0 ? (
        <div className="flex flex-col gap-3">
          <p className="font-mono text-[0.68rem] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
            Latest NFTs on-ledger
          </p>
          <ul className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
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
                    <div className="collection-display-art relative aspect-[2/3] overflow-hidden bg-background" data-card-name={nft.name}>
                      <Image
                        src={nft.image}
                        alt={`${nft.name} NFT artwork`}
                        fill
                        loading="lazy"
                        quality={70}
                        sizes="(max-width: 639px) calc(50vw - 1.5rem), (max-width: 767px) calc(33vw - 1.5rem), (max-width: 1023px) calc(33vw - 1.5rem), 240px"
                        className="object-cover transition-transform duration-500 group-hover:scale-[1.025]"
                      />
                      {nft.cardIdentifier ? (
                        <span className="collection-discovery-mark" aria-label={`Card identifier ${nft.cardIdentifier}`}>
                          {nft.cardIdentifier}
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

      <div className="mx-auto flex max-w-3xl flex-col items-center gap-2 px-2 text-center">
        <ShieldCheck aria-hidden="true" className="size-4 shrink-0 text-muted-foreground" />
        <div className="flex min-w-0 flex-col items-center gap-1">
          <h2 id="issuer-notice-heading" className="shrink-0 font-sans text-sm font-medium text-foreground">
            Built openly as we grow
          </h2>
          <p className="text-sm leading-relaxed text-muted-foreground">
            Ledgerborn and our XRPL issuer are new. We want to earn your trust through visible on-ledger activity, clear signing details, and no hidden promises. Xaman may show an automated notice while our transaction history grows; you can independently review every issuer transaction on{' '}
            <a
              href={`https://bithomp.com/explorer/${ISSUER_ADDRESS}`}
              target="_blank"
              rel="noopener noreferrer"
              className="font-medium text-foreground underline decoration-border underline-offset-4 transition-colors hover:text-muted-foreground"
            >
              Bithomp
              <ExternalLink aria-hidden="true" className="ml-1 inline size-3.5" />
            </a>
            .
          </p>
        </div>
      </div>
    </aside>
  )
}
