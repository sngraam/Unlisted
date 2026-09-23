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

function normalizedOrigin(value: string | null) {
  if (!value) return null;
  try {
    const url = new URL(value);
    return ["http:", "https:"].includes(url.protocol) ? url.origin : null;
  } catch {
    return null;
  }
}

// Accept the origin that actually served this request. Vercel overwrites these forwarded
// headers with the public alias/custom domain, so preview and production aliases stay usable.
function requestOrigin(request: Request) {
  const origins = new Set<string>();
  const direct = normalizedOrigin(request.url);
  if (direct) origins.add(direct);
  if (process.env.VERCEL === "1") {
    const host = request.headers
      .get("x-forwarded-host")
      ?.split(",")[0]
      .trim();
    const protocol = request.headers
      .get("x-forwarded-proto")
      ?.split(",")[0]
      .trim();
    const forwarded = normalizedOrigin(
      host && protocol ? `${protocol}://${host}` : null,
    );
    if (forwarded) origins.add(forwarded);
  }
  const configured = normalizedOrigin(process.env.APP_ORIGIN || null);
  if (configured) origins.add(configured);
  return origins;
}

export function requireOrigin(request: Request) {
  const supplied = normalizedOrigin(request.headers.get("origin"));
  if (!supplied || !requestOrigin(request).has(supplied))
    throw new HttpError(403, "Request origin is not allowed.");
}

export function isSecureRequest(request: Request) {
  return Array.from(requestOrigin(request)).some((origin) =>
    origin.startsWith("https://"),
  );
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
      onboarding: true,
      team: { include: { memberships: { where: { userId: user.id } } } },
    },
  });
  if (!workspace)
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
export async function createSession(userId: string, secure: boolean) {
  const token = randomBytes(32).toString("hex");
  const expiresAt = new Date(Date.now() + 7 * 86400000);
  await db().session.create({
    data: { userId, tokenHash: tokenHash(token), expiresAt },
  });
  cookies().set(SESSION_COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure,
    path: "/",
    expires: expiresAt,
  });
}
