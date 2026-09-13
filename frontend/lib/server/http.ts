// Shared JSON errors: validation details are safe; internal database errors stay on the server.
import { NextResponse } from "next/server";
import { ZodError } from "zod";
import { HttpError } from "./auth";
export function apiError(error: unknown) {
  if (error instanceof HttpError)
    return NextResponse.json(
      { error: error.message },
      { status: error.status },
    );
  if (error instanceof ZodError)
    return NextResponse.json(
      { error: error.issues[0]?.message || "Invalid request." },
      { status: 400 },
    );
  const code = (error as { code?: string })?.code;
  if (["P2002", "P2004", "P2034"].includes(code || ""))
    return NextResponse.json(
      {
        error:
          "This SKU already exists or the record changed. Refresh and try again.",
      },
      { status: 409 },
    );
  console.error(
    "Workspace API failed",
    error instanceof Error ? error.name : "Unknown error",
  );
  return NextResponse.json(
    {
      error:
        "Could not save or load your data. Check the local database and try again.",
    },
    { status: 500 },
  );
}
export async function readJson(request: Request) {
  const raw = await request.text();
  if (Buffer.byteLength(raw) > 4 * 1024 * 1024)
    throw new HttpError(413, "Request exceeds the 4 MB limit.");
  try {
    return JSON.parse(raw);
  } catch {
    throw new HttpError(400, "Invalid JSON request.");
  }
}
