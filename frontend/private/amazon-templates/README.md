# Private Amazon workbook source store

The admin importer archives each original XLSM here as `<sourceSha256>.xlsm`.
Files are private and gitignored. Never place this directory under `public/`.

Run `npm run templates:import:amazon -- --extract-only` from `frontend/` to
archive the supplied inbox workbooks without changing the database. A normal
import archives them and imports versioned category definitions into PostgreSQL.

Export requires the source file matching the listing's pinned template checksum.
Keep old sources when importing new category versions. The exporter never falls
back to an unrelated/latest workbook and never executes macros.

For a deployment, provision these private files in the build environment before
`next build`; output tracing includes them only in `/api/products/export`.
Alternatively, set `AMAZON_TEMPLATE_DIR` to a durable private source directory
accessible to the server and importer. An ephemeral upload directory is not a
production source archive. Shared object storage can replace this file reader
while retaining checksum verification. No source files are committed or deployed
automatically by the import command.
