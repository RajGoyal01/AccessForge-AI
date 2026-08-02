import { repairProposalSchema, type RepairProposalInput } from "@accessforge/shared";
import { db } from "../client";

export const repairService = {
  createProposal: async (projectId: string, input: RepairProposalInput) => {
    const data = repairProposalSchema.parse(input);
    const project = await db.project.findUniqueOrThrow({ where: { id: projectId }, select: { projectType: true } });
    if (project.projectType !== "BUNDLED_DEMO") throw new Error("External websites are audit-only and cannot receive repair proposals.");
    return db.repair.create({ data: { projectId, ...data, status: "PROPOSED" } });
  },
  getForReview: (id: string) => db.repair.findUnique({ where: { id }, include: { issue: true, project: true, evaluations: { orderBy: { createdAt: "desc" } } } }),
};
