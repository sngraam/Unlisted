// Real password sign-in. The development account is created only by the explicit seed command.
import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/server/db";
import { createSession, HttpError, requireOrigin } from "@/lib/server/auth";
import { verifyPassword, hashPassword } from "@/lib/server/password";
import { apiError, readJson } from "@/lib/server/http";
export const runtime = "nodejs";
const limits = new Map<string, { count: number; until: number }>();
let dummyHash: Promise<string> | undefined;
export async function POST(request: Request) {
  try {
    requireOrigin(request);
    const input = z
      .object({
        identifier: z
          .string()
          .trim()
          .min(3)
          .max(320)
          .transform((s) => s.toLowerCase()),
        password: z.string().min(1).max(256),
      })
      .parse(await readJson(request));
    for (const [key, value] of Array.from(limits))
      if (value.until < Date.now()) limits.delete(key);
    const attempt = limits.get(input.identifier) || {
      count: 0,
      until: Date.now() + 15 * 60000,
    };
    if (attempt.count >= 10 || limits.size > 5000)
      throw new HttpError(429, "Too many attempts. Try again in 15 minutes.");
    attempt.count++;
    limits.set(input.identifier, attempt);
    const user = await db().user.findFirst({
      where: {
        OR: [{ username: input.identifier }, { email: input.identifier }],
      },
    });
    dummyHash ||= hashPassword("unusable-placeholder-password");
    const valid = await verifyPassword(
      input.password,
      user?.passwordHash || (await dummyHash),
    );
    if (!valid || !user || user.deletedAt || !user.passwordHash)
      throw new HttpError(401, "Login ID or password is incorrect.");
    await createSession(user.id);
    limits.delete(input.identifier);
    return NextResponse.json({ ok: true });
  } catch (error) {
    return apiError(error);
  }
}
