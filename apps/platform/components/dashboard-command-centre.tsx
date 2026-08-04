"use client";

import Link from "next/link";
import { motion, useReducedMotion } from "framer-motion";
import {
  ArrowRight,
  CircleAlert,
  FileSearch,
  Gauge,
  Globe2,
  Layers3,
  Radar,
  ScanSearch,
  ShieldCheck,
  Sparkles,
  Wrench,
} from "lucide-react";
import type { CSSProperties } from "react";
import type { DashboardOverview } from "@/lib/dashboard/service";
import styles from "./dashboard-command-centre.module.css";

const motionProps = { initial: { opacity: 0, y: 16 }, whileInView: { opacity: 1, y: 0 }, viewport: { once: true, amount: 0.12 } };

function formatTimestamp(value: string | null) {
  if (!value) return "No completed scan yet";
  return new Intl.DateTimeFormat("en", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit", hour12: false, timeZone: "UTC" }).format(new Date(value)) + " UTC";
}

function toneFor(status: string) {
  if (["COMPLETED", "VERIFIED", "APPLIED"].includes(status)) return "good";
  if (["FAILED", "CANCELLED", "REJECTED"].includes(status)) return "bad";
  if (["RUNNING", "QUEUED", "GENERATING", "APPLYING"].includes(status)) return "active";
  return "neutral";
}

function scoreDescription(score: number | null) {
  if (score === null) return "Start a real audit to establish a transparent baseline.";
  if (score >= 85) return "Strong baseline. Keep watching for critical regressions.";
  if (score >= 60) return "Improving, with a clear set of high-impact opportunities.";
  return "Needs attention. Begin with the highest-impact barriers below.";
}

function ScoreTrajectory({ points }: { points: DashboardOverview["scoreHistory"] }) {
  if (points.length < 2) {
    return <div className={styles.chartEmpty}><Radar size={22} aria-hidden="true" /><span>Complete two audits to reveal the evidence trajectory.</span></div>;
  }
  const coordinates = points.map((point, index) => {
    const x = (index / (points.length - 1)) * 100;
    const y = 100 - point.score;
    return `${x},${y}`;
  }).join(" ");
  const final = points.at(-1);
  return <div className={styles.chartWrap}>
    <svg viewBox="0 0 100 100" preserveAspectRatio="none" role="img" aria-label={`Accessibility scores range from ${points[0]?.score} to ${final?.score} across ${points.length} completed scans`}>
      <defs><linearGradient id="trajectory" x1="0" x2="1"><stop stopColor="#60dcff" /><stop offset="1" stopColor="#ad81ff" /></linearGradient></defs>
      <path d="M0,75 H100 M0,50 H100 M0,25 H100" className={styles.chartGrid} />
      <polyline points={coordinates} className={styles.chartLine} />
      {points.map((point, index) => {
        const x = (index / (points.length - 1)) * 100;
        const y = 100 - point.score;
        return <circle key={point.id} cx={x} cy={y} r="2.3" className={styles.chartPoint}><title>{`${point.score}/100`}</title></circle>;
      })}
    </svg>
    <div className={styles.chartAxis}><span>{points[0]?.score}</span><span>Latest: {final?.score}</span></div>
  </div>;
}

export function DashboardCommandCentre({ data }: { data: DashboardOverview }) {
  const reduceMotion = useReducedMotion();
  const score = data.latestScore ?? 0;
  const scoreStyle = { "--score": `${score}%` } as CSSProperties;
  const metrics = [
    { label: "Latest score", value: data.latestScore ?? "—", detail: data.latestScore === null ? "No completed audit" : "Weighted engineering signal", icon: Gauge, tone: "cyan" },
    { label: "Active projects", value: data.activeProjectCount, detail: "Live workspaces", icon: Layers3, tone: "violet" },
    { label: "Critical signals", value: data.openCriticalCount, detail: "Open persisted findings", icon: CircleAlert, tone: "rose" },
    { label: "Review queue", value: data.repairProposalCount, detail: "Human approval required", icon: Wrench, tone: "green" },
  ] as const;

  return <div className={styles.dashboard}>
    <motion.header className={styles.hero} {...motionProps} transition={{ duration: 0.45 }}>
      <div className={styles.heroBackdrop} aria-hidden="true"><i /><i /><i /></div>
      <div className={styles.heroCopy}>
        <p className={styles.eyebrow}><span /> MISSION CONTROL · LOCAL EVIDENCE</p>
        <h1>Turn web friction into <em>clear next moves.</em></h1>
        <p>Monitor real accessibility evidence across every workspace, then move from the most urgent barrier to a measured outcome.</p>
        <div className={styles.heroActions}>
          <Link className="button magnetic" href="/projects/new"><ScanSearch size={17} aria-hidden="true" /> Start a real audit</Link>
          <Link className={styles.textAction} href="/projects">Open workspaces <ArrowRight size={15} aria-hidden="true" /></Link>
        </div>
      </div>
      <div className={styles.scoreReactor}>
        <div className={styles.orbit} aria-hidden="true"><i /><i /></div>
        <div className={styles.scoreRing} style={scoreStyle} aria-label={data.latestScore === null ? "No latest accessibility score" : `Latest accessibility score ${data.latestScore} out of 100`}>
          <div><span>LIVE SCORE</span><strong>{data.latestScore ?? "—"}</strong><small>{data.latestScore === null ? "Awaiting audit" : "/ 100"}</small></div>
        </div>
        <p>{scoreDescription(data.latestScore)}</p>
        <span className={styles.lastEvidence}><ShieldCheck size={13} aria-hidden="true" /> {formatTimestamp(data.latestScanAt)}</span>
      </div>
    </motion.header>

    <section className={styles.metrics} aria-label="Workspace health metrics">
      {metrics.map((metric, index) => {
        const Icon = metric.icon;
        return <motion.article key={metric.label} className={styles.metric} data-tone={metric.tone} {...motionProps} transition={{ duration: 0.36, delay: reduceMotion ? 0 : index * 0.05 }}>
          <span className={styles.metricIcon}><Icon size={18} aria-hidden="true" /></span>
          <div><span>{metric.label}</span><strong>{metric.value}</strong><small>{metric.detail}</small></div>
        </motion.article>;
      })}
    </section>

    <section className={styles.intelligenceGrid}>
      <motion.section className={styles.trajectory} {...motionProps} transition={{ duration: 0.4 }} aria-labelledby="trajectory-title">
        <div className={styles.sectionHead}><div><p>MEASURED PROGRESS</p><h2 id="trajectory-title">Accessibility trajectory</h2></div><Link href="/scans">View scans <ArrowRight size={14} aria-hidden="true" /></Link></div>
        <ScoreTrajectory points={data.scoreHistory} />
        <p className={styles.annotation}>Scores are transparent engineering signals from completed scans, not a compliance certification.</p>
      </motion.section>

      <motion.section className={styles.commandPulse} {...motionProps} transition={{ duration: 0.4, delay: reduceMotion ? 0 : 0.06 }} aria-labelledby="pulse-title">
        <div className={styles.sectionHead}><div><p>LIVE WORKSTREAM</p><h2 id="pulse-title">Command pulse</h2></div><span className={styles.liveTag}><i /> Live</span></div>
        {data.recentScans.length ? <ol className={styles.scanTimeline}>{data.recentScans.map((scan, index) => <li key={scan.id}><span className={styles.timelineIndex}>0{index + 1}</span><div><Link href={`/scans/${scan.id}`}>{scan.projectName}</Link><small><Globe2 size={11} aria-hidden="true" /> {scan.projectType === "EXTERNAL_AUDIT" ? "External audit" : "Bundled repair lab"} · {formatTimestamp(scan.startedAt)}</small></div><div className={styles.scanResult}><span data-tone={toneFor(scan.status)}>{scan.status.replaceAll("_", " ")}</span><strong>{scan.score ?? "—"}<small> / 100</small></strong><em>{scan.issueCount} findings</em></div></li>)}</ol> : <div className={styles.emptyPulse}><ScanSearch size={24} aria-hidden="true" /><strong>No evidence yet</strong><span>Create a workspace and run the first controlled scan.</span></div>}
      </motion.section>
    </section>

    <section className={styles.actionGrid}>
      <motion.section className={styles.criticalPanel} {...motionProps} transition={{ duration: 0.4 }} aria-labelledby="critical-title">
        <div className={styles.sectionHead}><div><p>PRIORITY SIGNALS</p><h2 id="critical-title">Critical issues</h2></div><Link href="/scans">See all evidence <ArrowRight size={14} aria-hidden="true" /></Link></div>
        {data.criticalIssues.length ? <div className={styles.issueStack}>{data.criticalIssues.map((issue, index) => <Link href={`/issues/${issue.id}`} key={issue.id} className={styles.criticalIssue}><span>{String(index + 1).padStart(2, "0")}</span><div><strong>{issue.title}</strong><small>{issue.projectName} · {issue.ruleId}</small></div><CircleAlert size={17} aria-hidden="true" /></Link>)}</div> : <div className={styles.emptyPanel}><ShieldCheck size={24} aria-hidden="true" /><strong>No open critical issues</strong><span>Completed scan evidence will surface the highest-priority barriers here.</span></div>}
      </motion.section>

      <motion.section className={styles.repairPanel} {...motionProps} transition={{ duration: 0.4, delay: reduceMotion ? 0 : 0.06 }} aria-labelledby="repair-title">
        <div className={styles.sectionHead}><div><p>HUMAN REVIEW</p><h2 id="repair-title">Repair desk</h2></div><Link href="/repairs">Open centre <ArrowRight size={14} aria-hidden="true" /></Link></div>
        {data.recentRepairs.length ? <div className={styles.repairStack}>{data.recentRepairs.map((repair) => <Link key={repair.id} href={`/repairs/${repair.id}`} className={styles.repairItem}><FileSearch size={17} aria-hidden="true" /><div><strong>{repair.projectName}</strong><span>{repair.status.replaceAll("_", " ")} · {repair.riskLevel.toLowerCase()} risk</span></div><ArrowRight size={15} aria-hidden="true" /></Link>)}</div> : <div className={styles.emptyPanel}><Sparkles size={24} aria-hidden="true" /><strong>Review queue is clear</strong><span>Eligible NovaMart findings can generate bounded proposals for human approval.</span></div>}
      </motion.section>
    </section>
  </div>;
}
