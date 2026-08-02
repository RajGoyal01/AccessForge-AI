import { db } from "@/lib/db/client";
import type { AgentName, EventStatus, Prisma } from "@prisma/client";

export async function writeActivity(input: { projectId: string; scanId?: string; repairId?: string; agent: AgentName; eventType: string; status: EventStatus; message: string; metadata?: Record<string, unknown> }) {
  return db.activityEvent.create({ data: { projectId: input.projectId, scanId: input.scanId ?? null, repairId: input.repairId ?? null, agent: input.agent, eventType: input.eventType, status: input.status, message: input.message, ...(input.metadata ? { metadata: input.metadata as Prisma.InputJsonValue } : {}) } });
}
