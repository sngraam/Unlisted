# Demo dataset contract

`seed-data.json` is the editable source dataset for the local MVP. It now contains four clearly fictional Amazon apparel product families (KURTA, PANTS, SHIRT, SHORTS) and eight variants, based on the four imported Seller Central India XLSM **field definitions and allowed choices**. A blank category template does not contain actual merchant product facts; prices, copy and SKUs in this seed are examples, never extracted seller data. `build-template-seed.py` rebuilds the fixtures deterministically from the checked-in macro-free catalogs. `seed-contract.ts` validates every value before Prisma opens a transaction, and `seed-local.ts` maps the validated data into normalized PostgreSQL records. `database-snapshot.json` exports only active demo records, excluding password hashes, sessions and marketplace credentials.

Version 3 uses **Data Definitions → Example** as the requested visual demo. All 790 source examples are available as field guidance. Valid examples populate the four dummy listings; alternate choices use a matching workbook value and repeatable choices use separate slots. Incompatible enum examples remain blank with the original example visible. Category/browse assignments and unique DEMO SKUs are retained. Generic examples may describe SHIRT, boots, unrelated brands, past dates or inconsistent offers; these are intentionally labeled workbook examples, not a coherent real product or an upload-ready listing.

Scalar examples are alternatives: Rise Height uses `5` from `5, 4`, and HSN uses `610510` from `QUJ85, 610510, 61051010`. These are demo values, not product measurements or verified tax classifications. An incompatible compliance type leaves both that type and its regulatory ID blank. To repair only these exact old examples in previously refreshed local samples, run `node --import tsx ../test/fix-workbook-example-values.ts --apply` from frontend. It backs up the affected records, preserves other edits, and creates new revisions requiring review; repeating it makes no further changes.

To refresh the four existing local dummy products explicitly, run `node --import tsx ../test/apply-workbook-examples.ts --apply` from frontend while the local server is running. This backs up current values and saves through the authenticated API, appending revisions and revoking approval. It verifies stable demo IDs/SKUs and the local database and skips already refreshed samples to preserve later edits. It does not reset other products or credentials.

## Frontend to Prisma mapping

| Dataset/frontend value | Prisma destination |
| --- | --- |
| `profile.username` | `User.username` |
| `profile.name`, `email`, `type` | `User.displayName`, `email`, `accountType` |
| `profile.team`, `workspace` | `Team.name`, `Workspace.name` |
| Brand fields | `BrandContext` |
| Product `name`, `category`, `rawText` | `Product.name`, `categoryPath`, `rawInputText` |
| Product `brand`, local `image` | `Product.brandName`, `Product.canonicalData.image`; object storage migration is pending |
| `workbookExample` | Source provenance in `Product.canonicalData`, exposed as an example notice |
| `productType`, `browseNodeId` | Each variant's `MarketplaceListing`; selected from an imported Amazon template |
| `templateSha256`, exact-key `channelAttributes` | Immutable `MarketplacePayload` on each `ListingRevision`, pinned to `MarketplaceTemplate.id` and version |
| Variant SKU, colour, size, prices, stock, HSN, origin, weight | `ProductVariant` |
| `marketplace` | `MarketplaceListing.platform` |
| Title, bullets, description, keywords | Immutable `ListingRevision` |
| `score` | Latest `ValidationRun.score`; fixture score is retained only as seed presentation metadata |
| `approved` | Active `ListingApproval`; the server never trusts the incoming boolean |
| `status` | Derived from listing/job/publication state; fixture status is only historical demo metadata |

The schema deliberately does not copy every screen field into the `products` table. Values with their own lifecycle use variants, listings, revisions, validations and approvals so marketplace state and review history remain auditable.

## Commands

Run from `frontend/`:

```bash
npm run test:dataset
npm run db:migrate:deploy
npm run templates:import:amazon
npm run db:seed
npm run test:templates:local
npm run db:export:local
```

`db:seed` is restricted to this repository's local PostgreSQL database. It archives only the twelve known legacy fixture IDs, inserts missing stable XLSM-backed fixtures, preserves other user-created products and existing edits, and deliberately resets the local demo account to login ID `sngram`. Archive retains history; it is not a database wipe. Rebuilding the source file with `python3 ../test/build-template-seed.py` requires the four catalog JSON files. Do not use this weak demo credential for a hosted or public environment.
