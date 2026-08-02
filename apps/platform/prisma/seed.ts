import { PrismaClient } from "@prisma/client";
const db = new PrismaClient();

async function main() {
  await db.activityEvent.deleteMany(); await db.evaluation.deleteMany(); await db.repair.deleteMany();
  await db.issue.deleteMany(); await db.pageScan.deleteMany(); await db.scan.deleteMany(); await db.project.deleteMany();
  const project = await db.project.create({ data: { name: "NovaMart", description: "Bundled demo for the complete human-approved accessibility repair workflow.", projectType: "BUNDLED_DEMO", targetUrl: "http://localhost:3001", localSourceRoot: "../novamart", framework: "Next.js App Router", status: "ACTIVE" } });
  const scan = await db.scan.create({ data: { projectId: project.id, status: "COMPLETED", stage: "COMPLETED", originalScore: 72, finalScore: 72, startedAt: new Date("2026-08-01T09:00:00Z"), completedAt: new Date("2026-08-01T09:00:24Z"), duration: 24000 } });
  await db.activityEvent.create({ data: { projectId: project.id, scanId: scan.id, agent: "SYSTEM", eventType: "DEMO_HISTORY", status: "INFO", message: "Historical demo record — not a live scan result.", metadata: { demoOnly: true } } });
}
main().catch((error: unknown) => { console.error(error); process.exitCode = 1; }).finally(async () => db.$disconnect());
