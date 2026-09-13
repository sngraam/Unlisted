// Session checks and membership resolution are authoritative on the server, never in localStorage.
import { createHash, randomBytes } from "node:crypto";
import { cookies } from "next/headers";
import { db } from "./db";
export const SESSION_COOKIE = "listing_session";
export const tokenHash = (token: string) =>
  createHash("sha256").update(token).digest("hex");
export class HttpError extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
    super(message);
  }
}
export function requireOrigin(request: Request) {
  const expected = process.env.APP_ORIGIN || "http://localhost:3000";
  if (request.headers.get("origin") !== expected)
    throw new HttpError(403, "Request origin is not allowed.");
}
export async function currentUser() {
  const token = cookies().get(SESSION_COOKIE)?.value;
  if (!token) return null;
  const session = await db().session.findUnique({
    where: { tokenHash: tokenHash(token) },
    include: { user: true },
  });
  return session && session.expiresAt > new Date() && !session.user.deletedAt
    ? session.user
    : null;
}
export async function workspaceAccess(write = false) {
  const user = await currentUser();
  if (!user) throw new HttpError(401, "Please sign in to continue.");
  const workspace = await db().workspace.findFirst({
    where: {
      archivedAt: null,
      team: { archivedAt: null, memberships: { some: { userId: user.id } } },
    },
    orderBy: { createdAt: "asc" },
    include: {
      brandContext: true,
      team: { include: { memberships: { where: { userId: user.id } } } },
    },
  });
  if (!workspace || !workspace.brandContext)
    throw new HttpError(
      403,
      "No active workspace is assigned to this account.",
    );
  const role = workspace.team.memberships[0].role;
  if (write && !["OWNER", "ADMIN", "EDITOR"].includes(role))
    throw new HttpError(
      403,
      "You do not have permission to edit this workspace.",
    );
  return { user, workspace, role };
}
export async function createSession(userId: string) {
  const token = randomBytes(32).toString("hex");
  const expiresAt = new Date(Date.now() + 7 * 86400000);
  await db().session.create({
    data: { userId, tokenHash: tokenHash(token), expiresAt },
  });
  cookies().set(SESSION_COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: (process.env.APP_ORIGIN || "").startsWith("https://"),
    path: "/",
    expires: expiresAt,
  });
}
