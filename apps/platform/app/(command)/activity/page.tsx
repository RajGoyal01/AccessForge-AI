import { OperationsConsole } from "@/components/operations-console";
import { operationsService } from "@/lib/db/services";

export const dynamic = "force-dynamic";

export default async function ActivityPage() {
  const events = await operationsService.listActivity();
  const succeeded = events.filter((event) => event.status === "SUCCEEDED").length;
  const active = events.filter((event) => event.status === "RUNNING").length;
  return <OperationsConsole
    eyebrow="Immutable audit trail"
    title="Activity Timeline"
    description="A clear, chronological record of explorer, audit, context, repair, evaluation, and reviewer operations. Every item reflects a real persisted event."
    empty="Activity events appear as real operations run."
    mode="activity"
    metrics={[{ label: "Recent events", value: events.length, note: "Latest recorded operations", tone: "cyan" }, { label: "Succeeded", value: succeeded, note: "Confirmed event outcomes", tone: "green" }, { label: "In progress", value: active, note: "Currently recorded stage events", tone: "violet" }, { label: "Projects touched", value: new Set(events.map((event) => event.projectId)).size, note: "With saved audit activity", tone: "amber" }]}
    items={events.map((event) => ({ id: event.id, title: event.message, subtitle: event.project.name, status: event.status, timestamp: event.createdAt.toLocaleString(), fields: [{ label: "Agent", value: event.agent }, { label: "Event", value: event.eventType }, { label: "Project", value: event.project.name }] }))}
  />;
}
