import Link from "next/link";
import { ArrowRight, CheckCircle2, Eye, GitCompare, Globe2, Radar, ScanSearch, ShieldCheck, Sparkles, WandSparkles, type LucideIcon } from "lucide-react";
import { Logo } from "@/components/logo";

const capabilities: Array<{ icon: LucideIcon; title: string; text: string }> = [
  { icon: Globe2, title: "Scan real public websites", text: "A controlled Chromium session captures real DOM, screenshot and axe evidence." },
  { icon: Eye, title: "See every affected element", text: "Numbered markers connect the full-page capture to the exact finding." },
  { icon: Sparkles, title: "Detailed change intelligence", text: "Receive prioritized, rule-specific remediation and validation steps." },
  { icon: ShieldCheck, title: "Safe external boundary", text: "Public sites are inspected read-only and are never modified by AccessForge." },
  { icon: WandSparkles, title: "Human-controlled repairs", text: "The bundled source lab demonstrates reviewed patches, backup and rollback." },
  { icon: GitCompare, title: "Measured verification", text: "Tests and a comparable rescan separate resolved issues from regressions." },
];

export default function Landing() {
  return <div className="landing"><header className="topbar landing-nav" style={{ position: "relative" }}><Logo /><nav><a href="#capabilities">Capabilities</a><a href="#workflow">Workflow</a><Link className="button-secondary" href="/dashboard">Open Command Centre</Link></nav></header><main id="main-content">
    <section className="hero cinematic-hero">
      <div className="hero-copy"><div className="signal-pill"><span /> ACCESSIBILITY INTELLIGENCE ONLINE</div><p className="eyebrow">Autonomous evidence. Human control.</p><h1>See the web through <span>every user’s experience.</span></h1><p className="muted">Scan real websites with a real browser. Reveal accessibility barriers visually. Turn every finding into a clear, prioritized engineering action.</p><div className="hero-actions"><Link className="button magnetic" href="/projects/new">Audit a real website <ArrowRight size={17} /></Link><Link className="button-secondary" href="/projects">Explore workspaces</Link></div><div className="trust-row"><span><CheckCircle2 size={15}/> Real axe evidence</span><span><CheckCircle2 size={15}/> No fake scores</span><span><CheckCircle2 size={15}/> Read-only external audits</span></div></div>
      <div className="hero-stage" aria-label="AccessForge website scan visualization"><div className="orbit orbit-one"/><div className="orbit orbit-two"/><div className="radar-core"><Radar size={38}/><span>LIVE SCAN</span></div><div className="site-window"><div className="window-bar"><i/><i/><i/><span>https://your-website.com</span></div><div className="site-content"><div className="site-nav"/><div className="site-title"/><div className="site-copy"/><div className="site-actions"/><b className="issue-ping ping-one">01</b><b className="issue-ping ping-two">02</b><b className="issue-ping ping-three">03</b><div className="scan-line"/></div></div><div className="floating-readout readout-one"><span>ACCESSIBILITY SCORE</span><strong>Live evidence</strong></div><div className="floating-readout readout-two"><span>ANALYSIS ENGINE</span><strong>Prioritized changes</strong></div></div>
    </section>
    <section className="signal-marquee" aria-label="Platform capabilities"><div>PLAYWRIGHT <i/> AXE-CORE <i/> VISUAL EVIDENCE <i/> SOURCE CONTEXT <i/> HUMAN APPROVAL <i/> REGRESSION DETECTION <i/> SAFE ROLLBACK</div></section>
    <section id="capabilities" className="landing-section"><p className="eyebrow">One platform. Two safe modes.</p><h2 className="section-title">Real website intelligence with a controlled repair laboratory.</h2><div className="grid capabilities">{capabilities.map((item, index) => { const Icon = item.icon; return <article className="panel capability-card" key={item.title}><span className="card-number">0{index + 1}</span><Icon size={23} /><h3>{item.title}</h3><p className="muted">{item.text}</p></article>; })}</div></section>
    <section id="workflow" className="landing-section workflow-section"><div><p className="eyebrow">From URL to action plan</p><h2 className="section-title">A transparent workflow judges and engineers can trust.</h2></div><div className="workflow-rail">{["Open target", "Capture evidence", "Run axe", "Analyze impact", "Suggest changes", "Verify again"].map((step, index) => <div key={step}><span>{String(index + 1).padStart(2, "0")}</span><strong>{step}</strong></div>)}</div><Link className="button" href="/projects/new"><ScanSearch size={17}/> Start a real website audit</Link></section>
  </main></div>;
}
