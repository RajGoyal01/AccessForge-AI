import { disableTemporaryBackend } from "@/lib/backend-lab/service";
import { errorResponse } from "@/lib/errors";

export async function DELETE(_: Request, { params }: { params: Promise<{ backendId: string }> }) {
  try {
    return Response.json({ backend: await disableTemporaryBackend((await params).backendId) });
  } catch (error) {
    return errorResponse(error);
  }
}
