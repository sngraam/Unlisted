# Amazon XLSM category catalog

The 2026-09-19 [field-by-field review](field-review.json) and [catalog design](../../frontend/CATALOG-DESIGN.md) distinguish stable typed product facts from category-specific answers. Regenerate the review from the actual inbox files with `python3 test/review-amazon-templates.py` from the project root. Saved products now share an immutable category/template assignment across their variants; template changes require an explicit future upgrade workflow.

The four seller-downloaded India templates in `inbox/` are **private, gitignored inputs**. Their normalized, macro-free definitions in `catalog/` are inspectable reference data. `bottle.json` is a separate unverified draft; no BOTTLE XLSM was supplied in this batch.

| Product type from `Valid Values` | Data Definitions | Export columns | Browse nodes | Required definitions |
| --- | ---: | ---: | ---: | ---: |
| KURTA | 186 | 255 | 7 | 9 |
| PANTS | 197 | 252 | 2 | 9 |
| SHIRT | 190 | 253 | 4 | 9 |
| SHORTS | 217 | 277 | 70 | 10 |

The editor counts definitions, groups repeated slots with Add another, and preserves all exact export keys. Source examples and row numbers are stored in `sourceMetadata` separately from the pinned v2 schema. The same source hash may enrich an older import once; SQL then prevents changing that evidence. Dropdown lists without a stopping worksheet validation error are suggestions, not closed enums (notably price cells with a Delete Offer suggestion). UI, API, SQL and Python validation use this distinction. Requiredness is checked once per definition; the workbook does not specify executable repeat-count or conditional rules.

Amazon's example row says `SHIRT` in **all four** files. It is sample data, not the allowed product type. The importer identifies the type from the `Valid Values` sheet, derives the marketplace and language from exact field keys, reads labels/requirements from `Data Definitions`, choices from `Dropdown Lists`, browse nodes from `Browse Data`, and preserves row-5 header order from `Template`. Repeated columns use a shared `pattern` (`#*`) for semantic matching while keeping their distinct exact keys and column positions.

Across these files, 149 normalized field patterns are shared. KURTA has 18 unique patterns, PANTS 16, SHIRT 5 and SHORTS 41. This is why canonical facts should be mapped once while category-only answers stay keyed to their exact template columns.

To ingest another category or a new template version:

1. Put its official seller-downloaded `.xlsm` in `test/amazon-templates/inbox/`. Do not execute its macros. Install Python 3.10+ with `openpyxl>=3.1.5,<4` and frontend npm dependencies.
2. Apply the additive Prisma migration to the target PostgreSQL database using its private `DIRECT_URL`: `cd frontend && npm run db:migrate:deploy`.
3. Run `cd frontend && npm run templates:import:amazon`. The command scans the inbox, extracts JSON catalogs, archives original workbooks by source SHA-256 in `frontend/private/amazon-templates/` (or `AMAZON_TEMPLATE_DIR`), then merges definitions into the database chosen by `DIRECT_URL` (or `DATABASE_URL`). Use `-- --extract-only` to extract and archive files without database writes. Paths may also be supplied after `--` instead of scanning the inbox.
4. Review the printed database hostname, product type, column counts and warnings. A repeated semantic hash is `unchanged`; a new hash activates a new immutable version for that marketplace/product-type/language scope. Historical payloads continue pointing to their original version. Re-importing an older version does not roll back the active one.

The database catalog is shared reference data, while products, variants, listings and payloads remain workspace-scoped. New product types require **no new Prisma columns or migrations**. `MarketplaceTemplate.fields` is ordered JSONB, with each field's exact key, semantic attribute/pattern, label, requirement, choices and any explicitly curated canonical mapping. `MarketplaceListing.productType` and `browseNodeId` identify the seller's choice. Each saved templated listing revision now gets a `MarketplacePayload` with `templateId`, `templateVersion` (semantic SHA-256), `categoryCode` and exact-key `rawAttributes`; the FK prevents deleting a version used by history. The authenticated frontend API exposes safe template metadata, and the SKU editor renders category/browse-node selection and searchable per-variant attributes from it.

`backend/modules/data_bridge/amazon_row.py` prepares an ordered candidate row from shared facts plus exact-key category answers. The implemented Node exporter, `frontend/lib/server/amazon-export.ts`, uses the frontend's shared field mapping and the immutable approved snapshots. It fills the original Template sheet from row 7 and preserves rows 1–6, including the frozen source example. XLSM keeps all ten source sheets and their native features; CSV contains the same Template rows and column order. Different pinned categories/versions are downloaded as separate files in a ZIP. `npm run test:export` verifies all four sources and exact column values. **Local approval is not Amazon approval**: conditional dependencies, seller/category permissions, GTIN exemptions, images, offers and marketplace processing still need account-aware validation. Direct API submission is not connected.

Do not commit the raw XLSM files: they can contain seller-specific settings and macro code. The extracted JSON omits row-1 settings and workbook macros. It includes the Data Definitions Example column as clearly labeled guidance, never automatic seller facts. The local four dummy listings use these examples only at the user's explicit request. Incompatible examples remain visible as guidance rather than bypassing closed-enum validation. Treat changed Amazon layouts as a parser-review event, not a reason to silently guess field meanings.
