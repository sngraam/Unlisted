// Integration checks against the explicitly named local database and running Next server.
// Creates isolated test tenants and removes only those test records afterward.
import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { config } from "dotenv";
import { PrismaClient } from "../generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { readFileSync } from "node:fs";
import { hashPassword } from "../lib/server/password";
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
    email,
    password: testPassword,
  });
  assert.equal(result.status, 200);
  return { ...a, cookie: result.cookie };
}
async function main() {
  assert.equal((await api("/api/workspace")).status, 401);
  assert.equal((await api("/api/products", "POST", [])).status, 401);
  const page = await api("/dashboard/skus");
  assert.ok([303, 307].includes(page.status));
  assert.equal(page.location, "/login");
  assert.equal(
    (
      await api("/api/auth/login", "POST", {
        email: "invalid@example.com",
        password: "wrongpass",
      })
    ).status,
    401,
  );
  const owner = await account(),
    viewer = await account("VIEWER");
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
    variants: fixtures.products[0].variants.map((v: object) => ({
      ...v,
      sku: "CHECK-" + randomUUID(),
    })),
  };
  const made = await api("/api/products", "POST", [draft], owner.cookie);
  assert.equal(made.status, 201, JSON.stringify(made.data));
  let p = made.data.state.products[0];
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
  assert.notEqual(saved.data.products[0].status, "Published");
  assert.equal(
    (await api("/api/products/" + p.id, "PUT", p, owner.cookie)).status,
    409,
  );
  p = saved.data.products[0];
  const approved = await api(
    `/api/products/${p.id}/approve`,
    "POST",
    { updatedAt: p.updatedAt },
    owner.cookie,
  );
  assert.equal(approved.status, 200, JSON.stringify(approved.data));
  assert.equal(approved.data.products[0].approved, true);
  p = approved.data.products[0];
  const edit = await api(
    "/api/products/" + p.id,
    "PUT",
    { ...p, title: p.title + " edited" },
    owner.cookie,
  );
  assert.equal(edit.status, 200);
  assert.equal(edit.data.products[0].approved, false);
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
    email: owner.email,
    password: testPassword,
  });
  const reloaded = await api(
    "/api/workspace",
    "GET",
    undefined,
    freshLogin.cookie,
  );
  assert.equal(reloaded.data.products[0].rawText, "Persisted across sessions");
  assert.equal(reloaded.data.brand.tone, updatedBrand.tone);
  assert.equal(
    await prisma.listingRevision.count({
      where: { workspaceId: owner.workspaceId },
    }),
    3,
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
    "PASS: authentication, protected pages/API, origin checks, role/tenant isolation, price/SKU validation, immutable revisions, stale-edit conflict, approval revocation, PostgreSQL persistence across sessions, logout revocation.",
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
      await tx.listingRevision.deleteMany({
        where: { workspaceId: a.workspaceId },
      });
      await tx.marketplaceListing.deleteMany({
        where: { workspaceId: a.workspaceId },
      });
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
