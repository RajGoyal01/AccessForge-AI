"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { Activity, ArrowUpRight, CheckCircle2, FileCode2, Grid2X2, Layers3, List, Search, ShieldCheck, Sparkles } from "lucide-react";
import styles from "./operations-console.module.css";

type Metric = { label: string; value: number | string; note: string; tone?: "cyan" | "violet" | "green" | "amber" };
type OperationItem = {
  id: string;
  href?: string;
  title: string;
  subtitle?: string;
  status: string;
  timestamp?: string;
  fields: Array<{ label: string; value: string | number; mono?: boolean }>;
  score?: number | null;
  issues?: number;
};

type OperationsConsoleProps = {
  eyebrow: string;
  title: string;
  description: string;
  empty: string;
  action?: { href: string; label: string };
  metrics: Metric[];
  items: OperationItem[];
  mode: "projects" | "scans" | "activity" | "repairs";
};

function prettyStatus(value: string) {
  return value.replaceAll("_", " ").toLowerCase();
}

function statusTone(value: string) {
  const normalized = value.toLowerCase();
  if (normalized.includes("failed") || normalized.includes("rejected")) return "danger";
  if (normalized.includes("running") || normalized.includes("active") || normalized.includes("waiting")) return "live";
  if (normalized.includes("rolled") || normalized.includes("disabled") || normalized.includes("archived")) return "quiet";
  return "success";
}

function iconFor(mode: OperationsConsoleProps["mode"]) {
  if (mode === "projects") return Layers3;
  if (mode === "scans") return Activity;
  if (mode === "repairs") return FileCode2;
  return ShieldCheck;
}

export function OperationsConsole({ eyebrow, title, description, empty, action, metrics, items, mode }: OperationsConsoleProps) {
  const reduceMotion = useReducedMotion();
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState("all");
  const [layout, setLayout] = useState<"grid" | "list">("list");
  const statuses = useMemo(() => [...new Set(items.map((item) => item.status))], [items]);
  const visibleItems = useMemo(() => {
    const lowered = query.trim().toLowerCase();
    return items.filter((item) => (filter === "all" || item.status === filter) && (!lowered || [item.title, item.subtitle ?? "", item.status, ...item.fields.map((field) => String(field.value))].join(" ").toLowerCase().includes(lowered)));
  }, [filter, items, query]);
  const Icon = iconFor(mode);

  return <div className={styles.console} data-mode={mode}>
    <motion.header className={styles.hero} initial={reduceMotion ? false : { opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.42 }}>
      <div className={styles.heroBeam} aria-hidden="true" />
      <div className={styles.heroCopy}>
        <p className={styles.eyebrow}><Sparkles size={14} aria-hidden="true" /> {eyebrow}</p>
        <h1>{title}</h1>
        <p>{description}</p>
      </div>
      <div className={styles.heroVisual} aria-hidden="true">
        <div className={styles.ringOne} /><div className={styles.ringTwo} /><div className={styles.core}><Icon size={30} /><span>LIVE DATA</span></div>
      </div>
      {action ? <Link href={action.href} className={`button ${styles.action}`}><Sparkles size={16} aria-hidden="true" />{action.label}<ArrowUpRight size={15} aria-hidden="true" /></Link> : null}
    </motion.header>

    <section className={styles.metrics} aria-label={`${title} summary`}>
      {metrics.map((metric, index) => <motion.article className={styles.metric} data-tone={metric.tone ?? "cyan"} key={metric.label} initial={reduceMotion ? false : { opacity: 0, y: 11 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: reduceMotion ? 0 : 0.05 + index * 0.05 }}><span>{metric.label}</span><strong>{metric.value}</strong><small>{metric.note}</small></motion.article>)}
    </section>

    <section className={styles.workbench} aria-label={`${title} controls`}>
      <div className={styles.search}><Search size={16} aria-hidden="true" /><label><span className="sr-only">Search {title}</span><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder={`Search ${title.toLowerCase()}...`} /></label></div>
      <div className={styles.filters} aria-label="Filter records"><button className={filter === "all" ? styles.selected : ""} type="button" onClick={() => setFilter("all")}>All <span>{items.length}</span></button>{statuses.map((status) => <button className={filter === status ? styles.selected : ""} type="button" key={status} onClick={() => setFilter(status)}>{prettyStatus(status)} <span>{items.filter((item) => item.status === status).length}</span></button>)}</div>
      <div className={styles.layouts} aria-label="Choose layout"><button className={layout === "list" ? styles.selected : ""} type="button" aria-pressed={layout === "list"} onClick={() => setLayout("list")}><List size={15} aria-hidden="true" /><span className="sr-only">List view</span></button><button className={layout === "grid" ? styles.selected : ""} type="button" aria-pressed={layout === "grid"} onClick={() => setLayout("grid")}><Grid2X2 size={15} aria-hidden="true" /><span className="sr-only">Grid view</span></button></div>
    </section>

    <p className="sr-only" aria-live="polite">Showing {visibleItems.length} of {items.length} {title.toLowerCase()}.</p>
    {visibleItems.length ? <div className={layout === "grid" ? styles.grid : styles.list}>{visibleItems.map((item, index) => <motion.article key={item.id} className={styles.record} initial={reduceMotion ? false : { opacity: 0, y: 9 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.28, delay: reduceMotion ? 0 : Math.min(index, 8) * 0.035 }}>
      <div className={styles.recordRail}><span className={styles.indicator} data-tone={statusTone(item.status)} /><span>{String(index + 1).padStart(2, "0")}</span></div>
      <div className={styles.recordMain}>{item.href ? <Link href={item.href} className={styles.recordLink}>{item.title}<ArrowUpRight size={15} aria-hidden="true" /></Link> : <h2>{item.title}</h2>}{item.subtitle ? <p>{item.subtitle}</p> : null}{item.timestamp ? <time>{item.timestamp}</time> : null}</div>
      <div className={styles.fields}>{item.fields.map((field) => <div key={field.label}><span>{field.label}</span><strong className={field.mono ? "mono" : ""}>{field.value}</strong></div>)}</div>
      {typeof item.score === "number" ? <div className={styles.score} data-score={item.score >= 75 ? "good" : item.score >= 40 ? "watch" : "risk"}><span>Score</span><strong>{item.score}</strong><small>/100</small></div> : null}
      {typeof item.issues === "number" ? <div className={styles.issueCount}><span>Findings</span><strong>{item.issues}</strong></div> : null}
      <span className={styles.status} data-tone={statusTone(item.status)}><CheckCircle2 size={13} aria-hidden="true" /> {prettyStatus(item.status)}</span>
    </motion.article>)}</div> : <div className={styles.empty}><Icon size={30} aria-hidden="true" /><strong>{query || filter !== "all" ? "No matching records" : empty}</strong><span>{query || filter !== "all" ? "Try a broader search or clear the current filter." : "When real operations run, their evidence will appear here."}</span></div>}
  </div>;
}
