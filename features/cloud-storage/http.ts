import { NextResponse } from "next/server";
import { QuotaExceededError } from "@/features/quota/quota";
import { ConflictError, NotFoundError, ValidationError } from "./upload";

/** Map a thrown service error to a JSON response with the right status code. */
export function toErrorResponse(err: unknown): NextResponse {
  if (err instanceof ValidationError) {
    return NextResponse.json({ error: err.message }, { status: 400 });
  }
  if (err instanceof NotFoundError) {
    return NextResponse.json({ error: err.message }, { status: 404 });
  }
  if (err instanceof ConflictError) {
    return NextResponse.json({ error: err.message }, { status: 409 });
  }
  if (err instanceof QuotaExceededError) {
    return NextResponse.json(
      { error: err.message, available: err.available, required: err.required },
      { status: 422 },
    );
  }
  return NextResponse.json({ error: "Internal error." }, { status: 500 });
}
