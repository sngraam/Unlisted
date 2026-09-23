// Save a product only if its database version still matches the editor's version.
import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/server/db";
import { workspaceAccess, requireOrigin } from "@/lib/server/auth";
import { apiError, readJson } from "@/lib/server/http";
import { productInput } from "@/lib/server/contracts";
import { saveProduct, readWorkspace } from "@/lib/server/catalog";
export async function PUT(
  request: Request,
  { params }: { params: { id: string } },
) {
  try {
    requireOrigin(request);
    const access = await workspaceAccess(true);
    const input = productInput.parse(await readJson(request));
    input.id = z.uuid().parse(params.id);
    await db().$transaction((tx) => saveProduct(tx, access, input, false), {
      timeout: 30000,
      isolationLevel: "Serializable",
    });
    return NextResponse.json(await readWorkspace(access, [input.id]));
  } catch (e) {
    return apiError(e);
  }
}
