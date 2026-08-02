import { notFound } from "next/navigation";
import { CheckCircle2, ExternalLink, Lightbulb, ShieldCheck } from "lucide-react";
import { db } from "@/lib/db/client";
import { getIssueSourceContext } from "@/lib/source-mapping/service";
import { getRemediationAdvice } from "@/lib/audit/remediation";
import { Severity } from "@/components/status";
import { GenerateRepairButton } from "@/components/action-buttons";

export const dynamic = "force-dynamic";

export default async function IssuePage({ params }: { params: Promise<{ issueId: string }> }) {
  const id = (await params).issueId;
  const issue = await db.issue.findUnique({ where: { id }, include: { scan: { include: { project: true } }, pageScan: true, repairs: true } });
  if (!issue) notFound();
  const source = await getIssueSourceContext(id);
  const advice = getRemediationAdvice(issue.ruleId);
  const external = issue.scan.project.projectType === "EXTERNAL_AUDIT";

  return <>
    <header className="page-head cinematic-head"><div><p className="eyebrow">Evidence → impact → action</p><h1>{issue.title}</h1><p className="muted">{issue.description}</p></div><Severity value={issue.impact} /></header>
    <section className="recommendation-hero">
      <div className="recommendation-icon"><Lightbulb size={26} /></div>
      <div><p className="eyebrow">Recommended remediation</p><h2>{advice.recommendedChange}</h2><p>{advice.whyItMatters}</p><span className="demo-label">{advice.category}</span> <span className="demo-label">{advice.effort} effort</span></div>
    </section>
    <div className="grid two-col" style={{ marginTop: 18 }}>
      <section className="panel"><h2>Element evidence</h2><p><strong>User impact</strong></p><p className="muted">{issue.failureSummary || advice.whyItMatters}</p><p><strong>Rule</strong> <span className="mono">{issue.ruleId}</span></p><p><strong>Selector</strong></p><p className="mono">{issue.selector}</p><p><strong>HTML snapshot</strong></p><pre className="code evidence-code">{issue.htmlSnippet}</pre>{issue.helpUrl ? <a className="inline-link" href={issue.helpUrl} target="_blank" rel="noreferrer">Official axe rule guidance <ExternalLink size={14} /></a> : null}</section>
      <aside className="panel"><h2>{external ? "Implementation guidance" : "Source mapping"}</h2>{source.available && "relativePath" in source ? <><p><strong>Component</strong> {source.component ?? "Unknown"}</p><p className="mono">{source.relativePath}:{source.line}</p><p>Confidence: {Math.round(source.confidence * 100)}%</p><pre className="code source-preview">{source.code}</pre>{issue.repairAvailable ? <GenerateRepairButton issueId={id} /> : null}</> : <><div className="boundary-note"><ShieldCheck size={19} /><div><strong>{external ? "Read-only external audit" : "Source unavailable"}</strong><p>{source.message}</p></div></div><p className="muted">Apply the recommendation in the website’s CMS or source repository, then run a new AccessForge scan to verify the result.</p></>}</aside>
    </div>
    <section className="panel validation-plan" style={{ marginTop: 18 }}><p className="eyebrow">Verification protocol</p><h2>How to confirm the change</h2><div className="validation-steps">{advice.validationSteps.map((step, index) => <article key={step}><CheckCircle2 size={18} /><span>Step {index + 1}</span><strong>{step}</strong></article>)}</div></section>
  </>;
}
