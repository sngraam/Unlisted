# Demo dataset contract

`seed-data.json` is the editable source dataset for the local MVP. `seed-contract.ts` validates every value before Prisma opens a transaction, and `seed-local.ts` maps the validated data into normalized PostgreSQL records. `database-snapshot.json` is the safe inspection export after seeding; it excludes password hashes, sessions and marketplace credentials.

## Frontend to Prisma mapping

| Dataset/frontend value | Prisma destination |
| --- | --- |
| `profile.username` | `User.username` |
| `profile.name`, `email`, `type` | `User.displayName`, `email`, `accountType` |
| `profile.team`, `workspace` | `Team.name`, `Workspace.name` |
| Brand fields | `BrandContext` |
| Product `name`, `category`, `rawText` | `Product.name`, `categoryPath`, `rawInputText` |
| Product `brand`, local `image` | `Product.canonicalData` during the MVP; object storage migration is pending |
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
npm run db:seed
npm run db:export:local
```

`db:seed` is restricted to this repository's local PostgreSQL database. It inserts missing stable fixtures, preserves existing product edits, and deliberately resets the local demo account to login ID `sngram`. Do not use this weak demo credential for a hosted or public environment.
