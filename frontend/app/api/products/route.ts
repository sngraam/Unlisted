// Atomic catalog import/create. Invalid rows or SKU collisions roll back the whole batch.
import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/server/db";
import { workspaceAccess, requireOrigin } from "@/lib/server/auth";
import { apiError, readJson } from "@/lib/server/http";
import { productInput } from "@/lib/server/contracts";
import { saveProduct, readWorkspace } from "@/lib/server/catalog";
export async function POST(request: Request) {
  try {
    requireOrigin(request);
    const access = await workspaceAccess(true);
    const products = z
      .array(productInput)
      .min(1)
      .max(500)
      .parse(await readJson(request));
    const ids = await db().$transaction(
      async (tx) => {
        const ids: string[] = [];
        for (const p of products)
          ids.push(await saveProduct(tx, access, p, true));
        return ids;
      },
      { timeout: 60000, isolationLevel: "Serializable" },
    );
    return NextResponse.json(
      { state: await readWorkspace(access), ids },
      { status: 201 },
    );
  } catch (e) {
    return apiError(e);
  }
}
