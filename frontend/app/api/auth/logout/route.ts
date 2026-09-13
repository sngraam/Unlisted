// Revoke the current session in PostgreSQL before clearing the browser cookie.
import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { db } from "@/lib/server/db";
import { requireOrigin, SESSION_COOKIE, tokenHash } from "@/lib/server/auth";
import { apiError } from "@/lib/server/http";
export async function POST(request: Request) {
  try {
    requireOrigin(request);
    const token = cookies().get(SESSION_COOKIE)?.value;
    if (token)
      await db().session.deleteMany({ where: { tokenHash: tokenHash(token) } });
    cookies().delete(SESSION_COOKIE);
    return NextResponse.json({ ok: true });
  } catch (error) {
    return apiError(error);
  }
}
