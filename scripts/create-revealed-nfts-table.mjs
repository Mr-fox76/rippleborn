import { Pool } from 'pg'

const pool = new Pool({ connectionString: process.env.DATABASE_URL })

async function main() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS revealed_nfts (
      nft_id text PRIMARY KEY,
      revealed_at timestamptz NOT NULL DEFAULT now()
    )
  `)
  console.log('[v0] revealed_nfts table ready')

  // Backfill every already-minted NFT as revealed. These were surfaced in the public feed
  // long ago, so there is no spoiler — gating only applies to new mints from here on.
  const { rows } = await pool.query(
    `SELECT mint_results_json FROM pack_results WHERE status = 'fulfilled'`,
  )
  const nftIds = new Set()
  for (const row of rows) {
    const results = Array.isArray(row.mint_results_json) ? row.mint_results_json : []
    for (const card of results) {
      if (card && card.mintStatus === 'minted' && typeof card.nftId === 'string') {
        nftIds.add(card.nftId)
      }
    }
  }

  const ids = [...nftIds]
  if (ids.length > 0) {
    await pool.query(
      `INSERT INTO revealed_nfts (nft_id)
       SELECT unnest($1::text[])
       ON CONFLICT (nft_id) DO NOTHING`,
      [ids],
    )
  }
  console.log(`[v0] backfilled ${ids.length} existing minted NFTs as revealed`)
}

main()
  .then(() => pool.end())
  .catch((error) => {
    console.error('[v0] migration failed:', error)
    return pool.end().finally(() => process.exit(1))
  })
