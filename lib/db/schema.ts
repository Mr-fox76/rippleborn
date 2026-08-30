import { bigint, bigserial, jsonb, smallint, text, timestamp, uniqueIndex } from 'drizzle-orm/pg-core'
import { pgTable } from 'drizzle-orm/pg-core'

export const siteCounters = pgTable('site_counters', {
  counterKey: text('counter_key').primaryKey(),
  visitCount: bigint('visit_count', { mode: 'bigint' }).notNull().default(BigInt(0)),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
})

export const packResults = pgTable(
  'pack_results',
  {
    id: bigserial('id', { mode: 'number' }).primaryKey(),
    orderId: bigint('order_id', { mode: 'number' }).notNull(),
    buyer: text('buyer').notNull(),
    paymentTxHash: text('payment_tx_hash').notNull(),
    cardsJson: jsonb('cards_json').notNull(),
    commitment: text('commitment').notNull(),
    status: text('status').notNull().default('committed'),
    mintResultsJson: jsonb('mint_results_json'),
    errorMessage: text('error_message'),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    uniqueIndex('pack_results_order_id_key').on(table.orderId),
    uniqueIndex('pack_results_payment_tx_hash_key').on(table.paymentTxHash),
  ],
)

export const nftReplacements = pgTable('nft_replacements', {
  originalNftId: text('original_nft_id').primaryKey(),
  ownerAddress: text('owner_address').notNull(),
  cardId: text('card_id').notNull(),
  originalUri: text('original_uri').notNull(),
  replacementNftId: text('replacement_nft_id'),
  replacementOfferId: text('replacement_offer_id'),
  replacementMintTxHash: text('replacement_mint_tx_hash'),
  replacementClaimTxHash: text('replacement_claim_tx_hash'),
  status: text('status').notNull().default('eligible'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
})

export const phoenixEditions = pgTable(
  'phoenix_editions',
  {
    id: bigserial('id', { mode: 'number' }).primaryKey(),
    orderId: bigint('order_id', { mode: 'number' }).notNull(),
    edition: smallint('edition').notNull(),
    buyer: text('buyer').notNull(),
    status: text('status').notNull().default('reserved'),
    metadataUri: text('metadata_uri').notNull(),
    nftId: text('nft_id'),
    offerId: text('offer_id'),
    errorMessage: text('error_message'),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    uniqueIndex('phoenix_editions_order_id_key').on(table.orderId),
    uniqueIndex('phoenix_editions_edition_key').on(table.edition),
  ],
)

export const phoenixCollectionSlots = pgTable(
  'phoenix_collection_slots',
  {
    id: bigserial('id', { mode: 'number' }).primaryKey(),
    setId: text('set_id').notNull(), // ledgerborn | cyborg-cowboy | chromatic-abyss
    slot: smallint('slot').notNull(),
    orderId: bigint('order_id', { mode: 'number' }).notNull(),
    status: text('status').notNull().default('reserved'),
    nftId: text('nft_id'),
    offerId: text('offer_id'),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    uniqueIndex('phoenix_collection_slots_set_slot_key').on(table.setId, table.slot),
    uniqueIndex('phoenix_collection_slots_order_id_key').on(table.orderId),
  ],
)

export const nftClaimOffers = pgTable(
  'nft_claim_offers',
  {
    offerId: text('offer_id').primaryKey(),
    nftId: text('nft_id').notNull(),
    orderId: bigint('order_id', { mode: 'number' }).notNull(),
    buyer: text('buyer').notNull(),
    mintedAt: timestamp('minted_at', { withTimezone: true }).notNull(),
    claimExpiresAt: timestamp('claim_expires_at', { withTimezone: true }).notNull(),
    status: text('status').notNull().default('open'),
    claimTxHash: text('claim_tx_hash'),
    cancelTxHash: text('cancel_tx_hash'),
    cancelledAt: timestamp('cancelled_at', { withTimezone: true }),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [uniqueIndex('nft_claim_offers_nft_id_key').on(table.nftId)],
)
