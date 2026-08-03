import { db } from "@/lib/db/client";
import { errorResponse } from "@/lib/errors";
import { dispatchQueuedScan, queueProjectScan } from "@/lib/scans/orchestrator";

type Context = { params: Promise<{ projectId: string }> };

export async function GET(_: Request, { params }: Context) {
  return Response.json({
    scans: await db.scan.findMany({
      where: { projectId: (await params).projectId },
      orderBy: { createdAt: "desc" },
      take: 25,
    }),
  });
}

export async function POST(_: Request, { params }: Context) {
  try {
    const scan = await queueProjectScan((await params).projectId);
    dispatchQueuedScan(scan.id);
    return Response.json({ scan }, { status: 202 });
  } catch (error) {
    return errorResponse(error);
  }
}
