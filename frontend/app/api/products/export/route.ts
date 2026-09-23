import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/server/db";
import { HttpError, requireOrigin, workspaceAccess } from "@/lib/server/auth";
import { apiError, readJson } from "@/lib/server/http";
import { productInput } from "@/lib/server/contracts";
import { templateGaps } from "@/lib/marketplace-template";
import { amazonRow, fillAmazonTemplate, readTemplateSource, zipFiles, TemplateExportError, type ExportTemplate } from "@/lib/server/amazon-export";

export const runtime = "nodejs";
const inputSchema = z.object({
  format: z.enum(["xlsm", "csv"]),
  products: z.array(z.object({ id: z.uuid(), updatedAt: z.iso.datetime() })).min(1).max(100),
});

export async function POST(request: Request) {
  try {
    requireOrigin(request);
    const access = await workspaceAccess();
    const input = inputSchema.parse(await readJson(request));
    if (new Set(input.products.map((p) => p.id)).size !== input.products.length) throw new HttpError(400, "Select each product only once.");
    // Resolve tenant, current revisions and approvals from one database snapshot.
    // No product facts or source file paths are accepted from the download client.
    const groups = await db().$transaction(async (tx) => {
      const products = await tx.product.findMany({
        where: { id: { in: input.products.map((p) => p.id) }, workspaceId: access.workspace.id, deletedAt: null },
        include: {
          variants: { where: { deletedAt: null }, orderBy: { createdAt: "asc" }, include: {
            listings: { include: { config: { include: { template: true } }, revisions: {
              orderBy: { number: "desc" }, take: 1, include: { payload: true, approvals: { where: { revokedAt: null } } },
            } } },
          } },
        },
      });
      if (products.length !== input.products.length) throw new HttpError(404, "A selected product is unavailable.");
      const result = new Map<string, { template: ExportTemplate; rows: string[][] }>();
      let rowCount = 0;
      for (const selected of input.products) {
        const product = products.find((p) => p.id === selected.id)!;
        if (product.updatedAt.toISOString() !== selected.updatedAt) throw new HttpError(409, "A listing changed. Refresh and review it before downloading.");
        if (!product.variants.length) throw new HttpError(400, "No SKU rows are available for export.");
        for (const variant of product.variants) {
          const listing = variant.listings.find((l) => l.platform === "AMAZON");
          const revision = listing?.revisions[0];
          const template = listing?.config?.template as unknown as ExportTemplate | undefined;
          if (!template || !revision?.payload || revision.payload.templateId !== template.id || revision.payload.templateVersion !== template.schemaSha256)
            throw new HttpError(409, "Save every selected listing with an imported Amazon template before downloading.");
          if (!revision.approvals.length) throw new HttpError(409, `Review and approve ${variant.sellerSku} before downloading.`);
          const snapshot = revision.merchantSnapshot as Record<string, unknown>;
          const parsed = productInput.safeParse({ ...snapshot, templateId: template.id, productType: template.productType });
          if (!parsed.success) throw new HttpError(409, "This older listing needs to be saved and reviewed again before export.");
          const savedVariant = parsed.data.variants.find((v) => v.sku === variant.sellerSku);
          if (!savedVariant) throw new HttpError(409, "The saved SKU snapshot is incomplete. Save and review again.");
          const approvedVariant = { ...savedVariant, channelAttributes: revision.payload.rawAttributes as Record<string, string> };
          const approvedProduct = {
            ...parsed.data, title: revision.title, description: revision.description,
            bullets: revision.bulletPoints, keywords: revision.searchKeywords.join(", "),
            browseNodeId: listing!.config!.browseNodeId, variants: [approvedVariant],
          };
          const gaps = templateGaps(approvedProduct, template);
          if (gaps.missing.length || gaps.invalid.length) {
            const gap = [...gaps.missing, ...gaps.invalid][0];
            throw new HttpError(409, `${variant.sellerSku} — ${gap.label}: ${gap.message || "Complete this field with a valid template value."} Save and review again.`);
          }
          const group = result.get(template.id) || { template, rows: [] };
          group.rows.push(amazonRow(approvedProduct, approvedVariant, template));
          result.set(template.id, group);
          if (++rowCount > 1000 || result.size > 10) throw new HttpError(413, "Export at most 1,000 SKUs across 10 template versions at a time.");
        }
      }
      return Array.from(result.values());
    }, { isolationLevel: "RepeatableRead", timeout: 15000 });
    const files: Record<string, Uint8Array> = {};
    let size = 0;
    for (const { template, rows } of groups) {
      const source = await readTemplateSource(template);
      const filename = `Amazon-${template.productType.replace(/[^a-z0-9_-]/gi, "_")}-${template.id}.${input.format}`;
      files[filename] = await fillAmazonTemplate(source, template, rows, input.format);
      size += files[filename].length;
      if (size > 64 * 1024 * 1024) throw new HttpError(413, "Export is too large. Select fewer products.");
    }
    const names = Object.keys(files);
    const filename = names.length === 1 ? names[0] : `Amazon-listings-${input.format}.zip`;
    const bytes = names.length === 1 ? files[names[0]] : await zipFiles(files);
    return new NextResponse(Buffer.from(bytes), { headers: {
      "Content-Type": names.length > 1 ? "application/zip" : input.format === "xlsm" ? "application/vnd.ms-excel.sheet.macroEnabled.12" : "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${filename}"`,
      "Cache-Control": "private, no-store",
      "X-Content-Type-Options": "nosniff",
    } });
  } catch (error) {
    return apiError(error instanceof TemplateExportError ? new HttpError(409, error.message) : error);
  }
}
