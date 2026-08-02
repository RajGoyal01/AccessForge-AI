import { z } from "zod";
import { db } from "@/lib/db/client";
import { AppError, errorResponse } from "@/lib/errors";
import { approveAndApply, rejectRepair, rollbackRepair } from "@/lib/repair/service";
import { evaluateRepair } from "@/lib/evaluation/service";

type Context = { params: Promise<{ repairId: string }> };
export async function GET(_: Request, { params }: Context) { try { const repair = await db.repair.findUnique({ where: { id: (await params).repairId }, include: { project: true, issue: { include: { scan: true } }, evaluations: { orderBy: { createdAt: "desc" } } } }); if (!repair) throw new AppError("NOT_FOUND", "Repair not found.", 404); return Response.json({ repair }); } catch (error) { return errorResponse(error); } }
export async function POST(request: Request, { params }: Context) { try { const id = (await params).repairId; const { action } = z.object({ action: z.enum(["approve", "reject", "rollback", "evaluate"]) }).parse(await request.json()); if (action === "approve") return Response.json({ repair: await approveAndApply(id) }); if (action === "reject") return Response.json({ repair: await rejectRepair(id) }); if (action === "rollback") return Response.json({ repair: await rollbackRepair(id) }); return Response.json({ evaluation: await evaluateRepair(id) }); } catch (error) { return errorResponse(error); } }
