import Link from "next/link";
import { notFound } from "next/navigation";
import { BarChart3, Globe2, ShieldCheck, Sparkles } from "lucide-react";
import { projectService } from "@/lib/db/services/projects";
import { db } from "@/lib/db/client";
import { Status, Severity } from "@/components/status";
import { StartScanButton } from "@/components/action-buttons";

export const dynamic = "force-dynamic";
export default async function ProjectPage({ params }: { params: Promise<{ projectId: string }> }) {
  const id = (await params).projectId;
  const [project, stats] = await Promise.all([projectService.getById(id), projectService.stats(id)]);
  if (!project) notFound();
  const [issues, repairs, evaluations, activity] = await Promise.all([
    db.issue.findMany({ where: { scan: { projectId: id } }, orderBy: { createdAt: "desc" }, take: 8 }),
    db.repair.findMany({ where: { projectId: id }, orderBy: { id: "desc" }, take: 8 }),
    db.evaluation.findMany({ where: { repair: { projectId: id } }, orderBy: { createdAt: "desc" }, take: 8 }),
    db.activityEvent.findMany({ where: { projectId: id }, orderBy: { createdAt: "desc" }, take: 8 }),
  ]);
  const external = project.projectType === "EXTERNAL_AUDIT";
  return <>
    <header className="page-head cinematic-head"><div><p className="eyebrow">{external ? <><Globe2 size={13}/> Live public website · read-only</> : <><Sparkles size={13}/> Bundled repair laboratory</>}</p><h1>{project.name}</h1><p className="mono">{project.targetUrl}</p></div><StartScanButton projectId={id} /></header>
    {external ? <section className="external-mode-banner"><div className="radar-mini"><Globe2 size={22}/></div><div><strong>Real website analysis mode</strong><p>AccessForge opens this public page in an isolated browser, captures actual accessibility evidence and creates a prioritized remediation plan. No form submission or website modification occurs.</p></div><span><ShieldCheck size={16}/> Safe boundary</span></section> : null}
    <div className="grid metrics"><article className="panel metric"><span>Latest score</span><strong>{stats?.latestScore ?? "—"}</strong><small>Transparent weighted signal</small></article><article className="panel metric"><span>Completed scans</span><strong>{stats?.scanCount ?? 0}</strong><small>Persisted browser audits</small></article><article className="panel metric"><span>Detected elements</span><strong>{issues.length}</strong><small>Most recent evidence</small></article><article className="panel metric"><span>Capability</span><strong className="metric-label">{external ? "Analyze + advise" : "Repair + rollback"}</strong><small>{external ? "No source modification" : "Human approval required"}</small></article></div>
    <div className="grid two-col" style={{ marginTop: 18 }}><section className="panel"><div className="section-row"><div><p className="eyebrow">Audit history</p><h2>Recent scans</h2></div><BarChart3 size={20}/></div>{project.scans.length ? <table className="table"><tbody>{project.scans.map(scan => <tr key={scan.id}><td><Link href={`/scans/${scan.id}`}>{scan.id.slice(-8)}</Link></td><td><Status value={scan.status}/></td><td>{scan.finalScore ?? "—"}</td></tr>)}</tbody></table> : <div className="empty">No evidence yet. Start the first real browser audit.</div>}<h2>Latest findings</h2>{issues.length ? issues.map(issue => <Link className="issue-card" href={`/issues/${issue.id}`} key={issue.id}><Severity value={issue.impact}/><strong>{issue.title}</strong><span className="mono">{issue.ruleId}</span></Link>) : <div className="empty">Findings appear after a completed scan.</div>}</section><aside className="panel"><h2>{external ? "Recommended workflow" : "Repair and evaluation"}</h2>{external ? <ol className="action-timeline"><li><span>01</span><div><strong>Run the live audit</strong><p>Capture DOM, screenshot and axe evidence.</p></div></li><li><span>02</span><div><strong>Review prioritized changes</strong><p>Open findings for impact and implementation advice.</p></div></li><li><span>03</span><div><strong>Implement in your source</strong><p>Make the suggested change in your authorized CMS or repository.</p></div></li><li><span>04</span><div><strong>Rescan to verify</strong><p>Measure resolved findings and remaining risk.</p></div></li></ol> : repairs.length ? repairs.map(repair => <Link className="issue-card" href={`/repairs/${repair.id}`} key={repair.id}><Status value={repair.status}/><strong>{repair.targetFile}</strong></Link>) : <div className="empty">Repair proposals appear after source mapping.</div>}<h2>Activity</h2><div className="activity">{activity.map(event => <div className="event" key={event.id}><time>{event.createdAt.toLocaleTimeString()}</time><span>{event.agent}</span><p>{event.message}</p></div>)}</div>{evaluations.length ? <Link className="inline-link" href={`/evaluations/${evaluations[0]!.id}`}>Open latest evaluation →</Link> : null}</aside></div>
  </>;
}
