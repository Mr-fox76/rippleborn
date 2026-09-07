import Image from 'next/image'
import { ExternalLink } from 'lucide-react'
import type { LatestMintedNft } from '@/lib/pack-results'

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
                        unoptimized
                        loading="lazy"
                        sizes="(max-width: 639px) calc(50vw - 1.5rem), (max-width: 1023px) calc(50vw - 2rem), 320px"
                        className="object-cover transition-transform duration-500 group-hover:scale-[1.025]"
                      />
                      <span className="collection-rarity-seal collection-rarity-seal--corner">{nft.rarity}</span>
                      {typeof nft.discovery === 'number' ? (
                        <span className="collection-edition-mark" aria-label={`Edition number ${nft.discovery}`}>
                          {String(nft.discovery).padStart(3, '0')}
                        </span>
                      ) : null}
                      <div className="collection-card-caption flex items-end justify-between gap-2">
                        <div className="flex min-w-0 flex-col gap-1">
                          <h3 className="text-pretty text-sm font-semibold leading-snug text-foreground">{nft.name}</h3>
                          {nft.setCode && typeof nft.cardNumber === 'number' && typeof nft.setSize === 'number' ? (
                            <span className="font-mono text-[0.6rem] uppercase tracking-[0.16em] text-muted-foreground">
                              {nft.setCode} {String(nft.cardNumber).padStart(2, '0')}/{String(nft.setSize).padStart(2, '0')}
                            </span>
                          ) : null}
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
