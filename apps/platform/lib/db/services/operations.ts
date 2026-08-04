import { db } from "../client";

export const operationsService = {
  listProjects: () => db.project.findMany({
    orderBy: { updatedAt: "desc" },
    include: { _count: { select: { scans: true, repairs: true } } },
  }),
  listScans: () => db.scan.findMany({
    orderBy: { startedAt: "desc" },
    take: 50,
    include: { project: true, _count: { select: { issues: true } } },
  }),
  listRepairs: () => db.repair.findMany({
    orderBy: { id: "desc" },
    include: { project: true, issue: true, evaluations: { take: 1, orderBy: { createdAt: "desc" } } },
  }),
  listActivity: () => db.activityEvent.findMany({
    orderBy: { createdAt: "desc" },
    take: 100,
    include: { project: true },
  }),
};
