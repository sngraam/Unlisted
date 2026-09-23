// Focused CSRF-origin checks for local, canonical and Vercel alias requests.
import assert from "node:assert/strict";
import { HttpError, isSecureRequest, requireOrigin } from "../lib/server/auth";

function request(url: string, origin?: string, forwarded?: string) {
  return new Request(url, {
    headers: {
      ...(origin ? { Origin: origin } : {}),
      ...(forwarded
        ? {
            "X-Forwarded-Host": forwarded,
            "X-Forwarded-Proto": "https",
          }
        : {}),
    },
  });
}

const originalVercel = process.env.VERCEL;
const originalOrigin = process.env.APP_ORIGIN;
try {
  process.env.APP_ORIGIN = "https://catalog.example.com/";

  requireOrigin(
    request("http://localhost:3000/api/auth/login", "http://localhost:3000"),
  );
  requireOrigin(
    request("https://internal.invalid/api/auth/login", "https://catalog.example.com"),
  );

  process.env.VERCEL = "1";
  const preview = request(
    "https://internal.invalid/api/auth/login",
    "https://feature-unlisted.vercel.app",
    "feature-unlisted.vercel.app",
  );
  requireOrigin(preview);
  assert.equal(isSecureRequest(preview), true);

  assert.throws(
    () =>
      requireOrigin(
        request(
          "https://catalog.example.com/api/auth/login",
          "https://foreign.invalid",
          "catalog.example.com",
        ),
      ),
    (error) => error instanceof HttpError && error.status === 403,
  );
  assert.throws(
    () => requireOrigin(request("https://catalog.example.com/api/auth/login")),
    (error) => error instanceof HttpError && error.status === 403,
  );
  console.log(
    "PASS: direct, configured and Vercel alias origins are accepted; missing and foreign origins are rejected.",
  );
} finally {
  if (originalVercel === undefined) delete process.env.VERCEL;
  else process.env.VERCEL = originalVercel;
  if (originalOrigin === undefined) delete process.env.APP_ORIGIN;
  else process.env.APP_ORIGIN = originalOrigin;
}
