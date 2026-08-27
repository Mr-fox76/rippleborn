import { bigint, bigserial, smallint, text, timestamp, uniqueIndex } from 'drizzle-orm/pg-core'
import { pgTable } from 'drizzle-orm/pg-core'

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
