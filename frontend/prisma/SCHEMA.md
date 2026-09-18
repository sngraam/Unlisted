## Table `_prisma_migrations`

### Columns

| Name | Type | Constraints |
|------|------|-------------|
| `id` | `varchar` | Primary |
| `checksum` | `varchar` |  |
| `finished_at` | `timestamptz` |  Nullable |
| `migration_name` | `varchar` |  |
| `logs` | `text` |  Nullable |
| `rolled_back_at` | `timestamptz` |  Nullable |
| `started_at` | `timestamptz` |  |
| `applied_steps_count` | `int4` |  |

## Table `users`

### Columns

| Name | Type | Constraints |
|------|------|-------------|
| `id` | `uuid` | Primary |
| `email` | `varchar` |  |
| `display_name` | `varchar` |  |
| `password_hash` | `text` |  Nullable |
| `account_type` | `AccountType` |  |
| `email_verified_at` | `timestamptz` |  Nullable |
| `created_at` | `timestamptz` |  |
| `updated_at` | `timestamptz` |  |
| `deleted_at` | `timestamptz` |  Nullable |
| `username` | `varchar` |  Nullable |

## Table `auth_identities`

### Columns

| Name | Type | Constraints |
|------|------|-------------|
| `id` | `uuid` | Primary |
| `user_id` | `uuid` |  |
| `provider` | `IdentityProvider` |  |
| `subject` | `varchar` |  |
| `created_at` | `timestamptz` |  |

## Table `teams`

### Columns

| Name | Type | Constraints |
|------|------|-------------|
| `id` | `uuid` | Primary |
| `name` | `varchar` |  |
| `created_by_id` | `uuid` |  |
| `created_at` | `timestamptz` |  |
| `updated_at` | `timestamptz` |  |
| `archived_at` | `timestamptz` |  Nullable |

## Table `team_memberships`

### Columns

| Name | Type | Constraints |
|------|------|-------------|
| `team_id` | `uuid` | Primary |
| `user_id` | `uuid` | Primary |
| `role` | `TeamRole` |  |
| `created_at` | `timestamptz` |  |
| `updated_at` | `timestamptz` |  |

## Table `invitations`

### Columns

| Name | Type | Constraints |
|------|------|-------------|
| `id` | `uuid` | Primary |
| `team_id` | `uuid` |  |
| `inviter_id` | `uuid` |  |
| `email` | `varchar` |  |
| `role` | `TeamRole` |  |
| `token_hash` | `varchar` |  |
| `status` | `InvitationStatus` |  |
| `expires_at` | `timestamptz` |  |
| `accepted_at` | `timestamptz` |  Nullable |
| `accepted_by_id` | `uuid` |  Nullable |
| `created_at` | `timestamptz` |  |

## Table `folders`

### Columns

| Name | Type | Constraints |
|------|------|-------------|
| `id` | `uuid` | Primary |
| `team_id` | `uuid` |  |
| `name` | `varchar` |  |
| `created_at` | `timestamptz` |  |
| `updated_at` | `timestamptz` |  |

## Table `workspaces`

### Columns

| Name | Type | Constraints |
|------|------|-------------|
| `id` | `uuid` | Primary |
| `team_id` | `uuid` |  |
| `folder_id` | `uuid` |  Nullable |
| `name` | `varchar` |  |
| `created_at` | `timestamptz` |  |
| `updated_at` | `timestamptz` |  |
| `archived_at` | `timestamptz` |  Nullable |

## Table `brand_contexts`

### Columns

| Name | Type | Constraints |
|------|------|-------------|
| `id` | `uuid` | Primary |
| `workspace_id` | `uuid` |  |
| `name` | `varchar` |  |
| `tone` | `varchar` |  |
| `glossary` | `jsonb` |  |
| `banned_terms` | `_text` |  Nullable |
| `pain_points` | `text` |  Nullable |
| `embedding` | `vector` |  Nullable |
| `embedding_model` | `varchar` |  Nullable |
| `embedded_at` | `timestamptz` |  Nullable |
| `created_at` | `timestamptz` |  |
| `updated_at` | `timestamptz` |  |

## Table `marketplace_connections`

### Columns

| Name | Type | Constraints |
|------|------|-------------|
| `id` | `uuid` | Primary |
| `workspace_id` | `uuid` |  |
| `platform` | `Marketplace` |  |
| `seller_id` | `varchar` |  |
| `label` | `varchar` |  Nullable |
| `status` | `ConnectionStatus` |  |
| `encrypted_access_token` | `text` |  Nullable |
| `encrypted_refresh_token` | `text` |  Nullable |
| `token_expires_at` | `timestamptz` |  Nullable |
| `scopes` | `_text` |  Nullable |
| `created_at` | `timestamptz` |  |
| `updated_at` | `timestamptz` |  |

## Table `products`

### Columns

| Name | Type | Constraints |
|------|------|-------------|
| `id` | `uuid` | Primary |
| `workspace_id` | `uuid` |  |
| `brand_context_id` | `uuid` |  |
| `import_batch_id` | `uuid` |  Nullable |
| `name` | `varchar` |  |
| `category_path` | `text` |  Nullable |
| `raw_input_text` | `text` |  Nullable |
| `canonical_data` | `jsonb` |  |
| `attributes` | `jsonb` |  |
| `description_template` | `text` |  Nullable |
| `created_at` | `timestamptz` |  |
| `updated_at` | `timestamptz` |  |
| `deleted_at` | `timestamptz` |  Nullable |

## Table `product_variants`

### Columns

| Name | Type | Constraints |
|------|------|-------------|
| `id` | `uuid` | Primary |
| `product_id` | `uuid` |  |
| `workspace_id` | `uuid` |  |
| `seller_sku` | `varchar` |  |
| `name` | `varchar` |  Nullable |
| `color` | `varchar` |  Nullable |
| `size` | `varchar` |  Nullable |
| `attributes` | `jsonb` |  |
| `currency` | `bpchar` |  |
| `mrp` | `numeric` |  |
| `selling_price` | `numeric` |  |
| `stock` | `int4` |  |
| `hsn_code` | `varchar` |  Nullable |
| `country_of_origin` | `varchar` |  Nullable |
| `weight_kg` | `numeric` |  Nullable |
| `length_cm` | `numeric` |  Nullable |
| `breadth_cm` | `numeric` |  Nullable |
| `height_cm` | `numeric` |  Nullable |
| `tax_code` | `varchar` |  Nullable |
| `manufacturer_details` | `text` |  Nullable |
| `packer_details` | `text` |  Nullable |
| `importer_details` | `text` |  Nullable |
| `created_at` | `timestamptz` |  |
| `updated_at` | `timestamptz` |  |
| `deleted_at` | `timestamptz` |  Nullable |

## Table `marketplace_listings`

### Columns

| Name | Type | Constraints |
|------|------|-------------|
| `id` | `uuid` | Primary |
| `workspace_id` | `uuid` |  |
| `variant_id` | `uuid` |  |
| `connection_id` | `uuid` |  Nullable |
| `platform` | `Marketplace` |  |
| `marketplace_region` | `varchar` |  |
| `external_id` | `varchar` |  Nullable |
| `product_url` | `text` |  Nullable |
| `status` | `ListingStatus` |  |
| `publication_status` | `PublicationStatus` |  |
| `created_at` | `timestamptz` |  |
| `updated_at` | `timestamptz` |  |

## Table `listing_revisions`

### Columns

| Name | Type | Constraints |
|------|------|-------------|
| `id` | `uuid` | Primary |
| `listing_id` | `uuid` |  |
| `workspace_id` | `uuid` |  |
| `number` | `int4` |  |
| `created_by_id` | `uuid` |  Nullable |
| `generation_job_id` | `uuid` |  Nullable |
| `title` | `text` |  |
| `description` | `text` |  |
| `bullet_points` | `_text` |  Nullable |
| `search_keywords` | `_text` |  Nullable |
| `target_keywords` | `jsonb` |  |
| `aplus_content` | `jsonb` |  |
| `merchant_snapshot` | `jsonb` |  |
| `brand_context_snapshot` | `jsonb` |  |
| `generation_metadata` | `jsonb` |  |
| `created_at` | `timestamptz` |  |

## Table `marketplace_payloads`

### Columns

| Name | Type | Constraints |
|------|------|-------------|
| `id` | `uuid` | Primary |
| `revision_id` | `uuid` |  |
| `workspace_id` | `uuid` |  |
| `category_code` | `varchar` |  Nullable |
| `template_version` | `varchar` |  Nullable |
| `raw_attributes` | `jsonb` |  |
| `created_at` | `timestamptz` |  |

## Table `generation_jobs`

### Columns

| Name | Type | Constraints |
|------|------|-------------|
| `id` | `uuid` | Primary |
| `listing_id` | `uuid` |  |
| `workspace_id` | `uuid` |  |
| `requested_by_id` | `uuid` |  Nullable |
| `queue_job_id` | `varchar` |  Nullable |
| `status` | `JobStatus` |  |
| `attempts` | `int4` |  |
| `max_attempts` | `int4` |  |
| `input_snapshot` | `jsonb` |  |
| `error_report` | `jsonb` |  Nullable |
| `created_at` | `timestamptz` |  |
| `started_at` | `timestamptz` |  Nullable |
| `completed_at` | `timestamptz` |  Nullable |

## Table `validation_runs`

### Columns

| Name | Type | Constraints |
|------|------|-------------|
| `id` | `uuid` | Primary |
| `revision_id` | `uuid` |  |
| `workspace_id` | `uuid` |  |
| `status` | `ValidationStatus` |  |
| `ruleset_version` | `varchar` |  |
| `score` | `int4` |  Nullable |
| `errors` | `jsonb` |  |
| `warnings` | `jsonb` |  |
| `auto_fix_applied` | `bool` |  |
| `created_at` | `timestamptz` |  |
| `completed_at` | `timestamptz` |  Nullable |

## Table `listing_approvals`

### Columns

| Name | Type | Constraints |
|------|------|-------------|
| `id` | `uuid` | Primary |
| `revision_id` | `uuid` |  |
| `workspace_id` | `uuid` |  |
| `validation_run_id` | `uuid` |  |
| `approved_by_id` | `uuid` |  |
| `approved_at` | `timestamptz` |  |
| `revoked_at` | `timestamptz` |  Nullable |
| `revocation_reason` | `text` |  Nullable |

## Table `publish_jobs`

### Columns

| Name | Type | Constraints |
|------|------|-------------|
| `id` | `uuid` | Primary |
| `listing_id` | `uuid` |  |
| `platform` | `Marketplace` |  |
| `connection_id` | `uuid` |  Nullable |
| `revision_id` | `uuid` |  |
| `workspace_id` | `uuid` |  |
| `approval_id` | `uuid` |  |
| `route` | `PublishRoute` |  |
| `status` | `PublishStatus` |  |
| `idempotency_key` | `varchar` |  |
| `submission_id` | `varchar` |  Nullable |
| `export_asset_id` | `uuid` |  Nullable |
| `target_snapshot` | `jsonb` |  |
| `response_payload` | `jsonb` |  |
| `error_report` | `jsonb` |  Nullable |
| `attempts` | `int4` |  |
| `created_at` | `timestamptz` |  |
| `started_at` | `timestamptz` |  Nullable |
| `submitted_at` | `timestamptz` |  Nullable |
| `completed_at` | `timestamptz` |  Nullable |
| `published_at` | `timestamptz` |  Nullable |

## Table `media_assets`

### Columns

| Name | Type | Constraints |
|------|------|-------------|
| `id` | `uuid` | Primary |
| `workspace_id` | `uuid` |  |
| `uploaded_by_id` | `uuid` |  Nullable |
| `kind` | `AssetKind` |  |
| `storage_key` | `text` |  |
| `original_name` | `varchar` |  |
| `mime_type` | `varchar` |  |
| `size_bytes` | `int8` |  |
| `created_at` | `timestamptz` |  |
| `deleted_at` | `timestamptz` |  Nullable |

## Table `product_media`

### Columns

| Name | Type | Constraints |
|------|------|-------------|
| `id` | `uuid` | Primary |
| `product_id` | `uuid` |  |
| `workspace_id` | `uuid` |  |
| `variant_id` | `uuid` |  Nullable |
| `asset_id` | `uuid` |  |
| `role` | `MediaRole` |  |
| `position` | `int4` |  |
| `alt_text` | `varchar` |  Nullable |

## Table `import_batches`

### Columns

| Name | Type | Constraints |
|------|------|-------------|
| `id` | `uuid` | Primary |
| `workspace_id` | `uuid` |  |
| `source_asset_id` | `uuid` |  |
| `requested_by_id` | `uuid` |  Nullable |
| `status` | `JobStatus` |  |
| `queue_job_id` | `varchar` |  Nullable |
| `total_rows` | `int4` |  |
| `imported_rows` | `int4` |  |
| `failed_rows` | `int4` |  |
| `error_report` | `jsonb` |  |
| `created_at` | `timestamptz` |  |
| `completed_at` | `timestamptz` |  Nullable |

## Table `sessions`

### Columns

| Name | Type | Constraints |
|------|------|-------------|
| `id` | `uuid` | Primary |
| `token_hash` | `varchar` |  |
| `user_id` | `uuid` |  |
| `expires_at` | `timestamptz` |  |
| `created_at` | `timestamptz` |  |

## Custom Types / Enums

### `AccountType`

`INDIVIDUAL` | `AGENCY` | `FREELANCE`

### `TeamRole`

`OWNER` | `ADMIN` | `EDITOR` | `REVIEWER` | `PUBLISHER` | `VIEWER`

### `IdentityProvider`

`GOOGLE`

### `InvitationStatus`

`PENDING` | `ACCEPTED` | `REVOKED` | `EXPIRED`

### `Marketplace`

`AMAZON` | `FLIPKART`

### `ConnectionStatus`

`NOT_CONNECTED` | `CONNECTED` | `EXPIRED` | `REVOKED` | `ERROR`

### `ListingStatus`

`DRAFT` | `REVIEW_PENDING` | `READY` | `ARCHIVED`

### `PublicationStatus`

`NEVER_PUBLISHED` | `PENDING` | `LIVE` | `REJECTED` | `INACTIVE`

### `JobStatus`

`QUEUED` | `PROCESSING` | `COMPLETED` | `FAILED` | `CANCELLED`

### `ValidationStatus`

`PENDING` | `PASSED` | `FAILED` | `ERROR`

### `PublishRoute`

`FLAT_FILE_CSV` | `DIRECT_API`

### `PublishStatus`

`QUEUED` | `PROCESSING` | `EXPORT_READY` | `SUBMITTED` | `PUBLISHED` | `FAILED` | `CANCELLED`

### `AssetKind`

`IMAGE` | `VIDEO` | `CSV` | `DOCUMENT`

### `MediaRole`

`MAIN_IMAGE` | `GALLERY_IMAGE` | `SWATCH_IMAGE` | `VIDEO`

