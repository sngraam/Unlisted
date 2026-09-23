// Integration checks against the explicitly named local database and running Next server.
// Creates isolated test tenants and removes only those test records afterward.
import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { config } from "dotenv";
import { PrismaClient } from "../generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { readFileSync } from "node:fs";
import { hashPassword } from "../lib/server/password";
import { unzipSync, strFromU8 } from "fflate";
config({ path: ".env.local" });
const connection = new URL(process.env.DATABASE_URL || "");
assert.equal(connection.hostname, "127.0.0.1");
assert.equal(connection.pathname, "/listing_agent_local");
const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString: connection.toString() }),
});
const origin = "http://localhost:3000";
const fixtures = JSON.parse(readFileSync("../test/seed-data.json", "utf8"));
const accounts: {
  userId: string;
  workspaceId: string;
  teamId: string;
  email: string;
}[] = [];
const testPassword = "Temporary-" + randomUUID();
async function api(
  path: string,
  method = "GET",
  body?: unknown,
  cookie = "",
  requestOrigin = origin,
) {
  const res = await fetch(origin + path, {
    method,
    redirect: "manual",
    headers: {
      "Content-Type": "application/json",
      Origin: requestOrigin,
      Cookie: cookie,
    },
    ...(body === undefined ? {} : { body: JSON.stringify(body) }),
  });
  const text = await res.text();
  return {
    status: res.status,
    data: text.startsWith("{") ? JSON.parse(text) : text,
    cookie: res.headers.get("set-cookie")?.split(";")[0] || "",
    location: res.headers.get("location"),
  };
}
async function account(role: "OWNER" | "VIEWER" = "OWNER") {
  const userId = randomUUID(),
    teamId = randomUUID(),
    workspaceId = randomUUID(),
    email = `integration-${userId}@example.com`;
  const a = { userId, teamId, workspaceId, email };
  accounts.push(a);
  await prisma.user.create({
    data: {
      id: userId,
      email,
      displayName: "Integration Test",
      passwordHash: await hashPassword(testPassword),
    },
  });
  await prisma.team.create({
    data: {
      id: teamId,
      name: "Integration only",
      createdById: userId,
      memberships: { create: { userId, role } },
    },
  });
  await prisma.workspace.create({
    data: {
      id: workspaceId,
      teamId,
      name: "Integration only",
      brandContext: { create: { name: "Anokhi", bannedTerms: ["miracle"] } },
    },
  });
  const result = await api("/api/auth/login", "POST", {
    identifier: email,
    password: testPassword,
  });
  assert.equal(result.status, 200);
  return { ...a, cookie: result.cookie };
}
async function main() {
  assert.equal((await api("/api/workspace")).status, 401);
  assert.equal((await api("/api/marketplace-templates")).status, 401);
  assert.equal((await api("/api/products/export", "POST", {})).status, 401);
  assert.equal((await api("/api/products", "POST", [])).status, 401);
  const page = await api("/dashboard/skus");
  assert.ok([303, 307].includes(page.status));
  assert.equal(page.location, "/login");
  assert.equal(
    (
      await api("/api/auth/login", "POST", {
        identifier: "invalid@example.com",
        password: "wrongpass",
      })
    ).status,
    401,
  );
  const owner = await account(),
    viewer = await account("VIEWER");
  const templates = await api("/api/marketplace-templates", "GET", undefined, owner.cookie);
  assert.equal(templates.status, 200);
  const summary = templates.data.templates.find((item: { productType: string }) => item.productType === "KURTA");
  assert.ok(summary);
  const detail = await api(`/api/marketplace-templates?id=${summary.id}`, "GET", undefined, owner.cookie);
  assert.equal(detail.status, 200);
  assert.equal(detail.data.template.fields.length, 255);
  assert.equal(detail.data.template.definitionCount, 186);
  assert.equal(detail.data.template.sourceMetadata.definitions.length, 186);
  const materialCells = detail.data.template.fields.filter((f: { attribute: string }) => f.attribute === "material");
  const offerPrice = detail.data.template.fields.find((f: { attribute: string; key: string }) => f.attribute === "purchasable_offer" && f.key.endsWith(".our_price#1.schedule#1.value_with_tax"));
  const productIdType = detail.data.template.fields.find((field: { attribute: string }) => field.attribute === "amzn1.volt.ca.product_id_type").key;
  assert.equal(
    (await api("/api/products", "POST", [], viewer.cookie)).status,
    403,
  );
  assert.equal(
    (
      await api(
        "/api/products",
        "POST",
        [],
        owner.cookie,
        "https://foreign.invalid",
      )
    ).status,
    403,
  );
  const draft = {
    ...fixtures.products[0],
    id: randomUUID(),
    templateId: summary.id,
    variants: fixtures.products[0].variants.map((v: object, index: number) => ({
      ...v,
      sku: "CHECK-" + randomUUID(),
      countryOfOrigin: index === 0 ? "India" : "Japan",
      hsnCode: "6109",
      weightKg: 0.375 + index * 0.25,
      channelAttributes: {
        ...(v as { channelAttributes: Record<string, string> }).channelAttributes,
        [productIdType]: "GTIN Exempt",
        [materialCells[0].key]: "Cotton",
        [materialCells[1].key]: "Nylon",
        [offerPrice.key]: "259.99",
      },
    })),
  };
  const made = await api("/api/products", "POST", [draft], owner.cookie);
  assert.equal(made.status, 201, JSON.stringify(made.data));
  let p = made.data.state.products[0];
  assert.equal(p.productType, "KURTA");
  assert.equal(p.templateId, summary.id);
  assert.equal(p.categoryLocked, true);
  assert.equal(p.variants[0].weightKg, 0.375);
  assert.equal(p.variants[0].channelAttributes[materialCells[0].key], "Cotton");
  assert.equal(p.variants[0].channelAttributes[materialCells[1].key], "Nylon");
  assert.equal(p.variants[0].channelAttributes[offerPrice.key], "259.99");
  assert.equal(p.variants[0].countryOfOrigin, "India");
  assert.equal(p.variants[1].countryOfOrigin, "Japan");
  assert.equal(p.variants[1].weightKg, 0.625);
  const hsnField = detail.data.template.fields.find((f: { label: string }) => f.label === "External Product Information");
  const badHsn = await api("/api/products/" + p.id, "PUT", { ...p, variants: [{ ...p.variants[0], channelAttributes: { ...p.variants[0].channelAttributes, [hsnField.key]: "QUJ85, 610510, 61051010" } }, ...p.variants.slice(1)] }, owner.cookie);
  assert.equal(badHsn.status, 400);
  assert.match(badHsn.data.error, /one 6–8-digit code/);
  const pants = templates.data.templates.find((item: { productType: string }) => item.productType === "PANTS");
  assert.equal((await api("/api/products/" + p.id, "PUT", { ...p, templateId: pants.id, productType: "PANTS" }, owner.cookie)).status, 409);
  assert.equal((await api("/api/products/" + p.id, "PUT", { ...p, templateId: undefined, productType: undefined, browseNodeId: undefined }, owner.cookie)).status, 409);
  assert.equal((await api("/api/products/" + p.id, "PUT", { ...p, variants: [{ ...p.variants[0], channelAttributes: { unknown_key: "bad" } }] }, owner.cookie)).status, 400);
  assert.equal(p.variants[0].channelAttributes[productIdType], "GTIN Exempt");
  assert.equal(
    (await api("/api/workspace", "GET", undefined, viewer.cookie)).data.products
      .length,
    0,
  );
  assert.equal(
    (await api("/api/products/" + p.id, "PUT", p, viewer.cookie)).status,
    403,
  );
  // A different editor has write permission in their own tenant, but cannot access this product.
  await prisma.teamMembership.update({
    where: { teamId_userId: { teamId: viewer.teamId, userId: viewer.userId } },
    data: { role: "OWNER" },
  });
  assert.equal(
    (await api("/api/products/" + p.id, "PUT", p, viewer.cookie)).status,
    404,
  );
  const bad = {
    ...p,
    variants: [{ ...p.variants[0], price: p.variants[0].mrp + 1 }],
  };
  assert.equal(
    (await api("/api/products/" + p.id, "PUT", bad, owner.cookie)).status,
    400,
  );
  assert.equal(
    (await api("/api/products/" + p.id, "PUT", {
      ...p,
      variants: [{ ...p.variants[0], channelAttributes: { ...p.variants[0].channelAttributes, [productIdType]: "invalid-type" } }, ...p.variants.slice(1)],
    }, owner.cookie)).status,
    400,
  );
  assert.equal(
    (await api("/api/products", "POST", [draft], owner.cookie)).status,
    409,
  );
  const saved = await api(
    "/api/products/" + p.id,
    "PUT",
    {
      ...p,
      rawText: "Persisted across sessions",
      approved: true,
      status: "Published",
      score: 999,
    },
    owner.cookie,
  );
  assert.equal(saved.status, 200, JSON.stringify(saved.data));
  assert.equal(saved.data.products[0].approved, false);
  assert.equal(saved.data.products[0].variants[1].countryOfOrigin, "Japan");
  assert.equal(saved.data.products[0].variants[1].weightKg, 0.625);
  assert.equal(saved.data.products[0].variants[0].channelAttributes[materialCells[1].key], "Nylon");
  assert.notEqual(saved.data.products[0].status, "Published");
  assert.equal(
    (await api("/api/products/" + p.id, "PUT", p, owner.cookie)).status,
    409,
  );
  p = saved.data.products[0];
  const exportBody = () => ({ format: "xlsm", products: [{ id: p.id, updatedAt: p.updatedAt }] });
  assert.equal((await api("/api/products/export", "POST", exportBody(), owner.cookie)).status, 409, "unapproved revision cannot export");
  assert.equal((await api("/api/products/export", "POST", exportBody(), viewer.cookie)).status, 404, "other tenant cannot export");
  assert.equal((await api("/api/products/export", "POST", exportBody(), owner.cookie, "https://foreign.invalid")).status, 403);
  const approved = await api(
    `/api/products/${p.id}/approve`,
    "POST",
    { updatedAt: p.updatedAt },
    owner.cookie,
  );
  assert.equal(approved.status, 200, JSON.stringify(approved.data));
  assert.equal(approved.data.products[0].approved, true);
  p = approved.data.products[0];
  const download = await fetch(origin + "/api/products/export", { method: "POST", headers: { "Content-Type": "application/json", Origin: origin, Cookie: owner.cookie }, body: JSON.stringify(exportBody()) });
  assert.equal(download.status, 200, download.status === 200 ? "" : await download.text());
  assert.match(download.headers.get("content-type") || "", /macroEnabled/);
  assert.match(download.headers.get("content-disposition") || "", /KURTA.*\.xlsm/);
  assert.equal(download.headers.get("cache-control"), "private, no-store");
  assert.equal(Buffer.from(await download.arrayBuffer()).subarray(0, 2).toString(), "PK");
  const templateCsv = await api("/api/products/export", "POST", { ...exportBody(), format: "csv" }, owner.cookie);
  assert.equal(templateCsv.status, 200, JSON.stringify(templateCsv.data).slice(0, 200));
  assert.ok(templateCsv.data.includes(p.variants[1].sku));
  assert.ok(templateCsv.data.includes("contribution_sku#1.value"));
  assert.ok(!templateCsv.data.includes("category_attributes_json"));
  const pantsFixture = fixtures.products.find((item: { productType: string }) => item.productType === "PANTS");
  const madePants = await api("/api/products", "POST", [{ ...pantsFixture, id: randomUUID(), templateId: pants.id,
    variants: pantsFixture.variants.map((v: object) => ({ ...v, id: randomUUID(), sku: "CHECK-" + randomUUID() })),
  }], owner.cookie);
  assert.equal(madePants.status, 201);
  let otherProduct = madePants.data.state.products.find((item: { productType: string }) => item.productType === "PANTS");
  const pantsDetail = (await api(`/api/marketplace-templates?id=${pants.id}`, "GET", undefined, owner.cookie)).data.template;
  const riseField = pantsDetail.fields.find((f: { label: string }) => f.label === "Rise Height");
  const regulationField = pantsDetail.fields.find((f: { label: string }) => f.label === "Regulatory Identification");
  const badRise = await api(`/api/products/${otherProduct.id}`, "PUT", { ...otherProduct, variants: [{ ...otherProduct.variants[0], channelAttributes: { ...otherProduct.variants[0].channelAttributes, [riseField.key]: "5, 4" } }, ...otherProduct.variants.slice(1)] }, owner.cookie);
  assert.equal(badRise.status, 400);
  assert.match(badRise.data.error, /one nonnegative number/);
  const validPants = otherProduct;
  const orphan = await api(`/api/products/${otherProduct.id}`, "PUT", { ...otherProduct, variants: [{ ...otherProduct.variants[0], channelAttributes: { ...otherProduct.variants[0].channelAttributes, [regulationField.key]: "VERIFIED-TEST-ID" } }, ...otherProduct.variants.slice(1)] }, owner.cookie);
  assert.equal(orphan.status, 200, "incomplete pairs may be saved as drafts");
  otherProduct = orphan.data.products[0];
  const blockedApproval = await api(`/api/products/${otherProduct.id}/approve`, "POST", { updatedAt: otherProduct.updatedAt }, owner.cookie);
  assert.equal(blockedApproval.status, 400);
  assert.match(blockedApproval.data.error, /Compliance Regulation Type/);
  const fixedPants = await api(`/api/products/${otherProduct.id}`, "PUT", { ...validPants, updatedAt: otherProduct.updatedAt }, owner.cookie);
  assert.equal(fixedPants.status, 200);
  otherProduct = fixedPants.data.products[0];
  const approvedPants = await api(`/api/products/${otherProduct.id}/approve`, "POST", { updatedAt: otherProduct.updatedAt }, owner.cookie);
  assert.equal(approvedPants.status, 200);
  const approvedOther = approvedPants.data.products[0];
  const bulk = await fetch(origin + "/api/products/export", { method: "POST", headers: { "Content-Type": "application/json", Origin: origin, Cookie: owner.cookie }, body: JSON.stringify({ format: "csv", products: [p, approvedOther].map(({ id, updatedAt }: { id: string; updatedAt: string }) => ({ id, updatedAt })) }) });
  assert.equal(bulk.status, 200, bulk.status === 200 ? "" : await bulk.text());
  assert.equal(bulk.headers.get("content-type"), "application/zip");
  const separateFiles = unzipSync(new Uint8Array(await bulk.arrayBuffer()));
  assert.equal(Object.keys(separateFiles).length, 2);
  for (const [name, contents] of Object.entries(separateFiles)) {
    const own = name.includes("KURTA") ? p : approvedOther;
    const other = own === p ? approvedOther : p;
    assert.ok(strFromU8(contents).includes(own.variants[0].sku));
    assert.ok(!strFromU8(contents).includes(other.variants[0].sku), "categories are never merged");
  }
  const edit = await api(
    "/api/products/" + p.id,
    "PUT",
    { ...p, title: p.title + " edited" },
    owner.cookie,
  );
  assert.equal(edit.status, 200);
  assert.equal(edit.data.products[0].approved, false);
  assert.equal((await api("/api/products/export", "POST", exportBody(), owner.cookie)).status, 409, "stale product cannot export");
  assert.equal((await api("/api/products/export", "POST", { format: "csv", products: [{ id: p.id, updatedAt: edit.data.products[0].updatedAt }] }, owner.cookie)).status, 409, "edited revision needs fresh approval");
  const updatedBrand = { ...fixtures.brand, tone: "Simple & practical" };
  assert.equal(
    (
      await api(
        "/api/workspace",
        "PATCH",
        { brand: updatedBrand },
        owner.cookie,
      )
    ).status,
    200,
  );
  const freshLogin = await api("/api/auth/login", "POST", {
    identifier: owner.email,
    password: testPassword,
  });
  const reloaded = await api(
    "/api/workspace",
    "GET",
    undefined,
    freshLogin.cookie,
  );
  assert.equal(reloaded.data.products.find((item: { id: string }) => item.id === p.id).rawText, "Persisted across sessions");
  assert.equal(reloaded.data.brand.tone, updatedBrand.tone);
  assert.equal(
    await prisma.listingRevision.count({
      where: { workspaceId: owner.workspaceId, listing: { variant: { productId: p.id } } },
    }),
    3 * p.variants.length,
  );
  assert.equal(
    (await api("/api/auth/logout", "POST", {}, freshLogin.cookie)).status,
    200,
  );
  assert.equal(
    (await api("/api/workspace", "GET", undefined, freshLogin.cookie)).status,
    401,
  );
  console.log(
    "PASS: authentication, origin/tenant isolation, immutable revisions, XLSM/CSV export, separate-category ZIP, stale and revoked approval export rejection, persistence, logout revocation.",
  );
}
async function cleanup() {
  for (const a of accounts) {
    await prisma.$transaction(async (tx) => {
      await tx.listingApproval.deleteMany({
        where: { workspaceId: a.workspaceId },
      });
      await tx.validationRun.deleteMany({
        where: { workspaceId: a.workspaceId },
      });
      await tx.marketplacePayload.deleteMany({ where: { workspaceId: a.workspaceId } });
      await tx.listingRevision.deleteMany({
        where: { workspaceId: a.workspaceId },
      });
      await tx.marketplaceListing.deleteMany({
        where: { workspaceId: a.workspaceId },
      });
      await tx.productMarketplaceConfig.deleteMany({ where: { workspaceId: a.workspaceId } });
      await tx.productVariant.deleteMany({
        where: { workspaceId: a.workspaceId },
      });
      await tx.product.deleteMany({ where: { workspaceId: a.workspaceId } });
      await tx.brandContext.deleteMany({
        where: { workspaceId: a.workspaceId },
      });
      await tx.workspace.deleteMany({ where: { id: a.workspaceId } });
      await tx.team.deleteMany({ where: { id: a.teamId } });
      await tx.user.deleteMany({ where: { id: a.userId } });
    });
  }
}
main().finally(async () => {
  await cleanup();
  await prisma.$disconnect();
});
