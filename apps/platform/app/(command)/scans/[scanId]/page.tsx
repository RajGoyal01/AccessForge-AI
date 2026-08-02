import Link from "next/link";
import { notFound } from "next/navigation";
import { BarChart3, Download, Globe2, ShieldAlert, Sparkles } from "lucide-react";
import { db } from "@/lib/db/client";
import { buildAuditAnalysis, getRemediationAdvice } from "@/lib/audit/remediation";
import { Status, Severity } from "@/components/status";
import { ScanInspector } from "@/components/scan-inspector";

export const dynamic = "force-dynamic";
const stages = ["Explorer Agent", "Accessibility Audit Agent", "Context Agent", "Repair Agent", "Evaluation Agent"];

export default async function ScanPage({ params }: { params: Promise<{ scanId: string }> }) {
  const scan = await db.scan.findUnique({
    where: { id: (await params).scanId },
    include: { project: true, issues: { orderBy: { createdAt: "asc" } }, activityEvents: { orderBy: { createdAt: "asc" } } },
  });
  if (!scan) notFound();
  const completed = scan.status === "COMPLETED";
  const external = scan.project.projectType === "EXTERNAL_AUDIT";
  const analysis = buildAuditAnalysis(scan.issues, scan.finalScore);

  return <>
    <header className="page-head cinematic-head">
      <div>
        <p className="eyebrow"><Globe2 size={13} /> Live website intelligence</p>
        <h1>{scan.project.name}</h1>
        <p className="mono">Scan {scan.id} · {scan.project.targetUrl}</p>
      </div>
      <div className="head-actions">
        <a className="button-secondary" href={`/api/scans/${scan.id}?format=report`}><Download size={16} /> Download analysis</a>
        <Status value={scan.status} />
        {scan.finalScore !== null ? <span className="score compact-score">{scan.finalScore}<small>/100</small></span> : null}
      </div>
    </header>

    <section className="pipeline" aria-label="Agent pipeline">
      {stages.map((name, index) => {
        const active = !completed && index === 0;
        const done = completed && index < 3;
        const unavailable = external && index >= 2;
        return <article key={name} className={`agent ${active ? "active" : ""} ${done ? "complete" : ""}`}>
          <span className="agent-index">0{index + 1}</span><strong>{name}</strong>
          <span>{unavailable ? "Read-only boundary" : done ? "Completed with evidence" : index >= 3 ? "Waiting for user action" : scan.stage.replaceAll("_", " ")}</span>
        </article>;
      })}
    </section>

    <section className="analysis-deck" aria-labelledby="analysis-title">
      <div className="analysis-title">
        <p className="eyebrow"><Sparkles size={13} /> Detailed analysis</p>
        <h2 id="analysis-title">{analysis.healthBand}</h2>
        <p className="muted">Computed from {analysis.totalAffectedElements} real affected elements. {analysis.disclaimer}</p>
      </div>
      <article className="analysis-card glow-blue"><BarChart3 size={20} /><span>Critical / serious</span><strong>{analysis.severities.critical + analysis.severities.serious}</strong><small>Highest-priority findings</small></article>
      <article className="analysis-card"><ShieldAlert size={20} /><span>Moderate / minor</span><strong>{analysis.severities.moderate + analysis.severities.minor}</strong><small>Usability and quality risks</small></article>
      <article className="analysis-card"><Globe2 size={20} /><span>Categories</span><strong>{analysis.categories.length}</strong><small>Distinct remediation areas</small></article>
    </section>

    <div style={{ marginTop: 18 }}><ScanInspector screenshot={scan.screenshotPath} issues={scan.issues} /></div>

    <div className="grid two-col" style={{ marginTop: 18 }}>
      <section className="panel">
        <p className="eyebrow">Prioritized change plan</p>
        <h2>What to fix first</h2>
        <div className="recommendation-list">
          {analysis.priorityIssues.map((issue, index) => {
            const advice = getRemediationAdvice(issue.ruleId);
            return <Link href={`/issues/${issue.id}`} className="recommendation" key={issue.id}>
              <span className="priority-number">{String(index + 1).padStart(2, "0")}</span>
              <div><Severity value={issue.impact ?? "UNKNOWN"} /><h3>{issue.title}</h3><p>{advice.recommendedChange}</p><small>{advice.category} · {advice.effort} effort</small></div>
            </Link>;
          })}
        </div>
      </section>
      <aside className="panel">
        <p className="eyebrow">Coverage map</p><h2>Issue categories</h2>
        <div className="category-bars">
          {analysis.categories.map(category => <div key={category.name}><span>{category.name}</span><strong>{category.count}</strong><i style={{ width: `${Math.max(12, (category.count / Math.max(analysis.totalAffectedElements, 1)) * 100)}%` }} /></div>)}
        </div>
        {external ? <div className="boundary-note"><ShieldAlert size={18} /><div><strong>Safe external mode</strong><p>AccessForge analyzes this live public website and suggests verified changes. It cannot alter the website or access its source code.</p></div></div> : null}
      </aside>
    </div>

    <section className="panel" style={{ marginTop: 18 }}><p className="eyebrow">Real activity events</p><h2>Agent activity</h2><div className="activity">{scan.activityEvents.map(event => <div className="event" key={event.id}><time>{event.createdAt.toLocaleTimeString()}</time><span>{event.agent}</span><p>{event.message}</p></div>)}</div></section>
  </>;
}
