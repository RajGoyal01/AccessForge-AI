import { OperationsConsole } from "@/components/operations-console";
import { operationsService } from "@/lib/db/services";

export const dynamic = "force-dynamic";

export default async function Repairs() {
  const repairs = await operationsService.listRepairs();
  const waiting = repairs.filter((repair) => repair.status === "WAITING_FOR_APPROVAL" || repair.status === "PROPOSED").length;
  const verified = repairs.filter((repair) => repair.status === "VERIFIED").length;
  return <OperationsConsole
    eyebrow="Human review queue"
    title="Repair Review Centre"
    description="Every proposal stays inert until a reviewer approves the exact evaluated replacement. The application never performs silent source changes."
    empty="Generate a proposal from a source-mapped NovaMart issue."
    mode="repairs"
    metrics={[{ label: "Proposals", value: repairs.length, note: "Persisted repair candidates", tone: "cyan" }, { label: "Needs review", value: waiting, note: "Waiting for a human decision", tone: "amber" }, { label: "Verified", value: verified, note: "Passed evaluation checks", tone: "green" }, { label: "Backed up", value: repairs.filter((repair) => Boolean(repair.backupPath)).length, note: "With rollback evidence", tone: "violet" }]}
    items={repairs.map((repair) => ({ id: repair.id, href: `/repairs/${repair.id}`, title: repair.issue.title, subtitle: `${repair.project.name} - ${repair.generatedBy === "OPENAI" ? "OpenAI structured proposal" : "Deterministic demo recipe"}`, status: repair.status, timestamp: repair.appliedAt ? `Applied ${repair.appliedAt.toLocaleString()}` : repair.approvedAt ? `Approved ${repair.approvedAt.toLocaleString()}` : undefined, fields: [{ label: "Target file", value: repair.targetFile, mono: true }, { label: "Risk", value: repair.riskLevel }, { label: "Provider", value: repair.generatedBy }], score: Math.round(repair.confidence * 100) }))}
  />;
}
