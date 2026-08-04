import { OperationsConsole } from "@/components/operations-console";
import { operationsService } from "@/lib/db/services";

export const dynamic = "force-dynamic";

export default async function Projects() {
  const projects = await operationsService.listProjects();
  const bundled = projects.filter((project) => project.projectType === "BUNDLED_DEMO").length;
  return <OperationsConsole
    eyebrow="Workspace intelligence"
    title="Project Command Deck"
    description="Every target is a live workspace. Bundled NovaMart projects support the full verified repair loop; external targets are deliberately audit-only."
    empty="Create your first accessibility workspace."
    action={{ href: "/projects/new", label: "Create project" }}
    mode="projects"
    metrics={[{ label: "Workspaces", value: projects.length, note: "Configured website targets", tone: "cyan" }, { label: "Repair-capable", value: bundled, note: "Bundled demo workspaces", tone: "violet" }, { label: "Audit-only", value: projects.length - bundled, note: "External public targets", tone: "amber" }, { label: "Recorded scans", value: projects.reduce((total, project) => total + project._count.scans, 0), note: "Real saved audit runs", tone: "green" }]}
    items={projects.map((project) => ({ id: project.id, href: `/projects/${project.id}`, title: project.name, subtitle: project.projectType === "BUNDLED_DEMO" ? "Verified source mapping, approval and evaluation enabled." : "External audit only - no source access or code modification.", status: project.status, fields: [{ label: "Capability", value: project.projectType === "BUNDLED_DEMO" ? "Full repair loop" : "Accessibility audit" }, { label: "Target", value: project.targetUrl, mono: true }, { label: "Repairs", value: project._count.repairs }], issues: project._count.scans }))}
  />;
}
