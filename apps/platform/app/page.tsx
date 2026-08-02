import Link from "next/link";
import { ArrowRight, Eye, GitCompare, ScanSearch, ShieldCheck, WandSparkles, type LucideIcon } from "lucide-react";
import { Logo } from "@/components/logo";

const capabilities: Array<{ icon: LucideIcon; title: string; text: string }> = [
  { icon: ScanSearch, title: "Real browser audits", text: "Playwright and axe collect inspectable evidence." },
  { icon: Eye, title: "Visual issue inspector", text: "Markers connect findings to affected elements." },
  { icon: WandSparkles, title: "Safe proposals", text: "Deterministic or structured AI repair planning." },
  { icon: ShieldCheck, title: "Human approval", text: "No canonical change before explicit confirmation." },
  { icon: GitCompare, title: "Verified evaluation", text: "Tests and a real rescan compare outcomes." },
  { icon: ArrowRight, title: "External audit boundary", text: "External websites are never modified." },
];

export default function Landing() {
  return <><header className="topbar" style={{ position: "relative" }}><Logo /><Link className="button-secondary" href="/dashboard">Open Command Centre</Link></header><main id="main-content"><section className="hero"><div><p className="eyebrow">Autonomous accessibility engineering</p><h1>Detect. Repair. Verify. Ship accessible software.</h1><p className="muted">AccessForge AI transforms real accessibility findings into reviewable code fixes and measurable engineering outcomes.</p><div className="hero-actions"><Link className="button" href="/projects">Launch Guided Demo <ArrowRight size={17} /></Link><Link className="button-secondary" href="/dashboard">Open Command Centre</Link></div><p className="muted" style={{ fontSize: 13 }}>Human-reviewed fixes · Measurable evaluations · Safe rollback</p></div><div className="hero-preview" aria-label="AccessForge product preview"><div className="preview-browser"><div className="preview-bar">● ● ● &nbsp; NovaMart scan</div><div className="preview-copy"><p className="eyebrow">Live browser audit</p><h2>Shape your everyday.</h2><span className="severity critical">Contrast issue</span></div><div className="scan-line" /></div><div className="metrics" style={{ display: "grid", marginTop: 12 }}><div className="panel metric"><span>Before</span><strong>Real scan</strong></div><div className="panel metric"><span>After evaluation</span><strong>Measured</strong></div><div className="panel metric"><span>Approval</span><strong>Required</strong></div><div className="panel metric"><span>External sites</span><strong>Audit only</strong></div></div></div></section><section className="landing-section"><p className="eyebrow">A complete engineering loop</p><h2 style={{ fontSize: 40 }}>Evidence, source context and human control.</h2><div className="grid capabilities" style={{ marginTop: 30 }}>{capabilities.map(item => { const Icon = item.icon; return <article className="panel" key={item.title}><Icon size={21} color="var(--blue)" /><h3>{item.title}</h3><p className="muted">{item.text}</p></article>; })}</div></section></main></>;
}
