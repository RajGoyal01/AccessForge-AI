import { createScanSchema, type CreateScanInput } from "@accessforge/shared";
import { db } from "../client";

export const scanService = {
  create: (input: CreateScanInput) => db.scan.create({ data: createScanSchema.parse(input) }),
  getWithResults: (id: string) => db.scan.findUnique({ where: { id }, include: { pageScans: true, issues: { orderBy: [{ impact: "asc" }, { createdAt: "asc" }] }, activityEvents: { orderBy: { createdAt: "asc" } } } }),
};
