import { OperationsConsole } from "@/components/operations-console";
import { operationsService } from "@/lib/db/services";

export const dynamic = "force-dynamic";

export default async function Scans() {
  const scans = await operationsService.listScans();
  const completed = scans.filter((scan) => scan.status === "COMPLETED");
  return <OperationsConsole
    eyebrow="Browser evidence archive"
    title="Scan Observatory"
    description="Trace every controlled browser audit from launch through evidence capture. Scores and findings below are calculated from completed scans - never simulated."
    empty="No browser scans have run yet."
    mode="scans"
    metrics={[{ label: "Total scans", value: scans.length, note: "Last 50 recorded runs", tone: "cyan" }, { label: "Completed", value: completed.length, note: "Audit evidence persisted", tone: "green" }, { label: "Average score", value: completed.length ? Math.round(completed.reduce((total, scan) => total + (scan.finalScore ?? 0), 0) / completed.length) : "-", note: "Transparent engineering signal", tone: "violet" }, { label: "Affected elements", value: scans.reduce((total, scan) => total + scan._count.issues, 0), note: "Across recorded audits", tone: "amber" }]}
    items={scans.map((scan) => ({ id: scan.id, href: `/scans/${scan.id}`, title: `Scan ${scan.id.slice(-10)}`, subtitle: scan.project.name, status: scan.status, timestamp: scan.startedAt ? `Started ${scan.startedAt.toLocaleString()}` : "Queued without a start time", fields: [{ label: "Stage", value: scan.stage }, { label: "Project", value: scan.project.name }, { label: "Target", value: scan.project.targetUrl, mono: true }], score: scan.finalScore, issues: scan._count.issues }))}
  />;
}
