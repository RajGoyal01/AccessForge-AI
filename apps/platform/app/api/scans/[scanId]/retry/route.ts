import { db } from "@/lib/db/client";
import { AppError, errorResponse } from "@/lib/errors";
import { dispatchQueuedScan, queueProjectScan } from "@/lib/scans/orchestrator";

export async function POST(_: Request, { params }: { params: Promise<{ scanId: string }> }) {
  try {
    const scan = await db.scan.findUnique({ where: { id: (await params).scanId } });
    if (!scan) throw new AppError("NOT_FOUND", "Scan not found.", 404);
    if (scan.status !== "FAILED") {
      throw new AppError("CONFLICT", "Only failed scans can be retried.", 409);
    }

    const retry = await queueProjectScan(scan.projectId);
    dispatchQueuedScan(retry.id);
    return Response.json({ scan: retry }, { status: 202 });
  } catch (error) {
    return errorResponse(error);
  }
}
