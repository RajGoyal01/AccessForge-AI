import { createTemporaryBackend, listTemporaryBackends } from "@/lib/backend-lab/service";
import { AppError, errorResponse } from "@/lib/errors";

const MAX_REQUEST_BYTES = 32_000;

export async function GET() {
  try {
    return Response.json({ backends: await listTemporaryBackends() });
  } catch (error) {
    return errorResponse(error);
  }
}

export async function POST(request: Request) {
  try {
    const contentLength = Number(request.headers.get("content-length") ?? "0");
    if (Number.isFinite(contentLength) && contentLength > MAX_REQUEST_BYTES) {
      throw new AppError("VALIDATION_ERROR", "The temporary API contract request is too large.");
    }
    return Response.json({ backend: await createTemporaryBackend(await request.json()) }, { status: 201 });
  } catch (error) {
    return errorResponse(error);
  }
}
