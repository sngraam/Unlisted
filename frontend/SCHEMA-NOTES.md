# Frontend findings for the future Prisma schema

These are the earlier frontend design notes. The implemented schema and migration now live in [`prisma/schema.prisma`](prisma/schema.prisma) and [`prisma/README.md`](prisma/README.md); use that guide as the current source of truth. `test/data.prisma` is preserved. The user's latest preference is **Prisma**; the earlier SQLAlchemy scaffold is not a reason to override that preference.

## Suggested normalized model boundaries

| UI concept                     | Suggested Prisma model(s)                           | Important boundary                                                                                                                                         |
| ------------------------------ | --------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Person and account type        | User                                                | Identity is separate from workspace permissions.                                                                                                           |
| Team and user roles            | Team, TeamMembership                                | Use memberships rather than both `users.teams` text and a single `team_id`; a role belongs to a membership.                                                |
| Invitation                     | Invitation                                          | Team/workspace scope, inviter, email, role, token hash, expiry, acceptedAt.                                                                                |
| Workspace and optional folders | Workspace, Folder                                   | Scope folders to a team/workspace. Avoid folders that can attach arbitrary teams' workspaces.                                                              |
| Brand voice                    | BrandContext                                        | Workspace-owned name, tone, glossary, banned terms, pain points; separately decide whether a workspace has one or multiple brands.                         |
| Marketplace account            | MarketplaceConnection                               | Workspace, platform, seller ID, encrypted credentials, expiry, connection state. Never expose tokens to client components.                                 |
| Shared product identity        | Product                                             | Workspace, brand, category, raw notes, shared media, soft deletion.                                                                                        |
| Sellable option                | ProductVariant                                      | Product, seller SKU, attributes, money/currency, stock, logistics. Enforce SKU uniqueness in the intended tenant scope.                                    |
| Channel-specific listing       | MarketplaceListing                                  | Variant plus connection/platform, external ASIN/FSN, title, bullets, description, keywords, lifecycle. One variant can have multiple marketplace listings. |
| Platform-specific attributes   | MarketplacePayload                                  | Owned by the channel listing, with validated JSON attributes and a schema/template version.                                                                |
| Generated content and edits    | ListingRevision                                     | Versioned copy and generation provenance; parent descriptions can be templates, but approved output belongs to a specific revision.                        |
| Generation workflow            | GenerationJob                                       | Queue ID, target/revision, state, attempts, error details, start/finish timestamps.                                                                        |
| Validation results             | ValidationRun, ValidationIssue (or structured JSON) | Ruleset/version, target revision, pass/fail/warnings and timestamps.                                                                                       |
| Human approval                 | ListingApproval                                     | User, revision, timestamp; edits require approval again.                                                                                                   |
| Export/API submission          | PublishJob                                          | Exact approved revision, route, channel connection, output file/submission ID, progress, errors, confirmed publication time.                               |
| Images/video/exports           | MediaAsset                                          | Object storage key, MIME type, size, owner, ordering/role; avoid production base64 blobs in relational records.                                            |

## Corrections to reconcile in the supplied drafts

1. Remove the circular `product_variants.marketplace_payload_id` / `marketplace_payloads.product_variant_id` pair. Put the owning foreign key on the child/channel listing, and support one variant on multiple marketplaces.
2. Keep ASIN/FSN on the channel-specific listing, not a single field on the universal variant.
3. Separate generation state, content readiness, approval, validation, and marketplace publication. A CSV download is not publication; a submitted API job is not confirmed live.
4. Represent INR consistently as integer paise or a fixed-precision Decimal with currency. The current UI edits INR amounts; its JavaScript numbers are not the production accounting representation.
5. Brand name/attributes should reference authoritative product data. Avoid using generated text to overwrite merchant facts.
6. Apparel fields such as neckline and sleeve length should be category-dependent attributes unless the product is intentionally apparel-only. Define structured category schemas rather than one universal wide table.
7. Track approval against the exact revision that was reviewed. Saving changed copy must invalidate that approval.
8. The screenshots have compact setup; the prototype uses Profile → Workspace → Brand → Connect, because a marketplace connection requires an existing workspace/brand context.
9. Do not adopt a universal 120-character title limit or a fixed marketplace column count from the examples. Define marketplace/category rules using the eventual real template contracts. The demo's 200-character title check is illustrative.
10. The current frontend simplifies a product to one selected marketplace and one content draft. Treat that as the prototype scope, not the final one-to-many relational model.

## Decisions to make after reviewing the frontend

- One brand per workspace, or multiple brands within one workspace?
- Can users belong to several teams? Which roles can edit, approve, and publish?
- Are variants listed independently on both marketplaces, and which copy is shared?
- Which first product category and marketplace template will define the initial validation contract?
- Does the Next.js server own Prisma calls, or will a separate Node service expose database operations to the Python AI worker/backend?

Prisma is a Node-side integration decision. Its client should not be imported into browser components, and the existing Python FastAPI app cannot use the JavaScript client directly. Decide the server boundary before replacing the draft schema.
