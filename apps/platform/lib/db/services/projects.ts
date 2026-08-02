import { createProjectSchema, type CreateProjectInput } from "@accessforge/shared";
import { db } from "../client";

export const projectService = {
  list: () => db.project.findMany({ orderBy: { updatedAt: "desc" }, include: { _count: { select: { scans: true, repairs: true } } } }),
  getById: (id: string) => db.project.findUnique({ where: { id }, include: { scans: { orderBy: { startedAt: "desc" }, take: 10 } } }),
  create: (input: CreateProjectInput) => {
    const parsed = createProjectSchema.parse(input);
    return db.project.create({
      data: {
        name: parsed.name,
        projectType: parsed.projectType,
        targetUrl: parsed.targetUrl,
        status: parsed.status,
        description: parsed.description ?? null,
        localSourceRoot: parsed.localSourceRoot ?? null,
        framework: parsed.framework ?? null,
      },
    });
  },
};
