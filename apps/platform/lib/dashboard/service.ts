import { db } from "@/lib/db/client";

export type DashboardOverview = {
  activeProjectCount: number;
  openCriticalCount: number;
  repairProposalCount: number;
  latestScore: number | null;
  latestScanAt: string | null;
  recentScans: Array<{
    id: string;
    projectName: string;
    projectType: "BUNDLED_DEMO" | "EXTERNAL_AUDIT";
    status: string;
    score: number | null;
    issueCount: number;
    startedAt: string | null;
  }>;
  scoreHistory: Array<{ id: string; score: number; createdAt: string }>;
  criticalIssues: Array<{
    id: string;
    title: string;
    ruleId: string;
    projectName: string;
    impact: string;
  }>;
  recentRepairs: Array<{
    id: string;
    projectName: string;
    status: string;
    riskLevel: string;
  }>;
};

/** Provides the small, serializable read model consumed by the dashboard client surface. */
export async function getDashboardOverview(): Promise<DashboardOverview> {
  const [activeProjectCount, scans, criticalIssues, recentRepairs] = await Promise.all([
    db.project.count({ where: { status: "ACTIVE" } }),
    db.scan.findMany({
      orderBy: { startedAt: "desc" },
      take: 10,
      include: { project: true, _count: { select: { issues: true } } },
    }),
    db.issue.findMany({
      where: { impact: "CRITICAL", status: "OPEN" },
      orderBy: { createdAt: "desc" },
      take: 5,
      include: { scan: { include: { project: true } } },
    }),
    db.repair.findMany({
      orderBy: { id: "desc" },
      take: 5,
      include: { project: true },
    }),
  ]);

  const latestCompleted = scans.find((scan) => scan.status === "COMPLETED" && scan.finalScore !== null) ?? null;
  const scoreHistory = scans
    .filter((scan): scan is typeof scan & { finalScore: number; startedAt: Date } => scan.finalScore !== null && scan.startedAt !== null)
    .reverse()
    .map((scan) => ({ id: scan.id, score: scan.finalScore, createdAt: scan.startedAt.toISOString() }));

  return {
    activeProjectCount,
    openCriticalCount: criticalIssues.length,
    repairProposalCount: recentRepairs.length,
    latestScore: latestCompleted?.finalScore ?? null,
    latestScanAt: latestCompleted?.completedAt?.toISOString() ?? latestCompleted?.startedAt?.toISOString() ?? null,
    recentScans: scans.slice(0, 5).map((scan) => ({
      id: scan.id,
      projectName: scan.project.name,
      projectType: scan.project.projectType,
      status: scan.status,
      score: scan.finalScore,
      issueCount: scan._count.issues,
      startedAt: scan.startedAt?.toISOString() ?? null,
    })),
    scoreHistory,
    criticalIssues: criticalIssues.map((issue) => ({
      id: issue.id,
      title: issue.title,
      ruleId: issue.ruleId,
      projectName: issue.scan.project.name,
      impact: issue.impact,
    })),
    recentRepairs: recentRepairs.map((repair) => ({
      id: repair.id,
      projectName: repair.project.name,
      status: repair.status,
      riskLevel: repair.riskLevel,
    })),
  };
}
