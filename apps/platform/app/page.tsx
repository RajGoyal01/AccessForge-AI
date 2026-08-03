"use client";

import Link from "next/link";
import { motion, useReducedMotion } from "framer-motion";
import {
  ArrowRight,
  CheckCircle2,
  Eye,
  GitCompare,
  Globe2,
  Radar,
  ScanSearch,
  ShieldCheck,
  Sparkles,
  WandSparkles,
  type LucideIcon,
} from "lucide-react";
import { Logo } from "@/components/logo";

const capabilities: Array<{ icon: LucideIcon; title: string; text: string }> = [
  { icon: Globe2, title: "Scan real public websites", text: "A controlled Chromium session captures real DOM, screenshot, and axe evidence." },
  { icon: Eye, title: "See every affected element", text: "Numbered markers connect the full-page capture to the exact finding." },
  { icon: Sparkles, title: "Detailed change intelligence", text: "Receive prioritized, rule-specific remediation and validation steps." },
  { icon: ShieldCheck, title: "Safe external boundary", text: "Public sites are inspected read-only and are never modified by AccessForge." },
  { icon: WandSparkles, title: "Human-controlled repairs", text: "The bundled source lab demonstrates reviewed patches, backups, and rollback." },
  { icon: GitCompare, title: "Measured verification", text: "Tests and a comparable rescan separate resolved issues from regressions." },
];

const workflow = ["Open target", "Capture evidence", "Run axe", "Analyze impact", "Suggest changes", "Verify again"];

export default function Landing() {
  const reduceMotion = useReducedMotion();
  const reveal = reduceMotion ? {} : { initial: { opacity: 0, y: 24 }, whileInView: { opacity: 1, y: 0 } };

  return (
    <div className="landing">
      <header className="topbar landing-nav">
        <Logo />
        <nav aria-label="Landing page navigation">
          <a href="#capabilities">Capabilities</a>
          <a href="#workflow">Workflow</a>
          <Link className="button-secondary" href="/dashboard">Open Command Centre</Link>
        </nav>
      </header>

      <main id="main-content">
        <section className="hero cinematic-hero">
          <motion.div
            className="hero-copy"
            initial={reduceMotion ? false : { opacity: 0, x: -24 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.65, ease: "easeOut" }}
          >
            <div className="signal-pill"><span aria-hidden="true" /> ACCESSIBILITY INTELLIGENCE ONLINE</div>
            <p className="eyebrow">Autonomous evidence. Human control.</p>
            <h1>See the web through <span>every user&apos;s experience.</span></h1>
            <p className="hero-lede">Scan real websites with a real browser. Reveal accessibility barriers visually. Turn every finding into a clear, prioritized engineering action.</p>
            <div className="hero-actions">
              <Link className="button magnetic" href="/projects/new">Audit a real website <ArrowRight size={17} aria-hidden="true" /></Link>
              <Link className="button-secondary" href="/projects">Explore workspaces</Link>
            </div>
            <div className="trust-row" aria-label="Platform guarantees">
              <span><CheckCircle2 size={15} aria-hidden="true" /> Real axe evidence</span>
              <span><CheckCircle2 size={15} aria-hidden="true" /> No fake scores</span>
              <span><CheckCircle2 size={15} aria-hidden="true" /> Read-only external audits</span>
            </div>
          </motion.div>

          <motion.div
            className="hero-stage"
            aria-label="Illustration of AccessForge scanning a website and locating three issues"
            initial={reduceMotion ? false : { opacity: 0, scale: 0.96, x: 20 }}
            animate={{ opacity: 1, scale: 1, x: 0 }}
            transition={{ duration: 0.8, delay: 0.12, ease: "easeOut" }}
          >
            <div className="stage-glow" aria-hidden="true" />
            <div className="orbit orbit-one" aria-hidden="true" />
            <div className="orbit orbit-two" aria-hidden="true" />
            <div className="radar-core" aria-hidden="true"><Radar size={38} /><span>LIVE SCAN</span></div>
            <div className="site-window" aria-hidden="true">
              <div className="window-bar"><i /><i /><i /><span>https://your-website.com</span></div>
              <div className="site-content">
                <div className="site-nav" /><div className="site-title" /><div className="site-copy" /><div className="site-actions" />
                <b className="issue-ping ping-one">01</b><b className="issue-ping ping-two">02</b><b className="issue-ping ping-three">03</b><div className="scan-line" />
              </div>
            </div>
            <div className="floating-readout readout-one" aria-hidden="true"><span>ACCESSIBILITY SCORE</span><strong>Live evidence</strong></div>
            <div className="floating-readout readout-two" aria-hidden="true"><span>ANALYSIS ENGINE</span><strong>Prioritized changes</strong></div>
          </motion.div>
        </section>

        <div className="signal-marquee" aria-hidden="true"><div>PLAYWRIGHT <i /> AXE-CORE <i /> VISUAL EVIDENCE <i /> SOURCE CONTEXT <i /> HUMAN APPROVAL <i /> REGRESSION DETECTION <i /> SAFE ROLLBACK <i /> PLAYWRIGHT <i /> AXE-CORE <i /> VISUAL EVIDENCE <i /> SOURCE CONTEXT <i /> HUMAN APPROVAL <i /> REGRESSION DETECTION <i /> SAFE ROLLBACK</div></div>

        <motion.section id="capabilities" className="landing-section" {...reveal} viewport={{ once: true, amount: 0.18 }} transition={{ duration: 0.55 }}>
          <p className="eyebrow">One platform. Two safe modes.</p>
          <h2 className="section-title">Real website intelligence with a controlled repair laboratory.</h2>
          <div className="grid capabilities">
            {capabilities.map((item, index) => {
              const Icon = item.icon;
              return (
                <motion.article
                  className="panel capability-card"
                  key={item.title}
                  initial={reduceMotion ? false : { opacity: 0, y: 18 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, amount: 0.25 }}
                  transition={{ duration: 0.4, delay: reduceMotion ? 0 : index * 0.06 }}
                >
                  <span className="card-number">0{index + 1}</span><span className="capability-icon"><Icon size={23} aria-hidden="true" /></span><h3>{item.title}</h3><p className="muted">{item.text}</p>
                </motion.article>
              );
            })}
          </div>
        </motion.section>

        <motion.section id="workflow" className="landing-section workflow-section" {...reveal} viewport={{ once: true, amount: 0.2 }} transition={{ duration: 0.55 }}>
          <div><p className="eyebrow">From URL to action plan</p><h2 className="section-title">A transparent workflow judges and engineers can trust.</h2><p className="muted workflow-copy">Every state is tied to real browser, audit, and validation evidence—never invented progress.</p></div>
          <div className="workflow-rail">{workflow.map((step, index) => <div key={step}><span>{String(index + 1).padStart(2, "0")}</span><strong>{step}</strong></div>)}</div>
          <Link className="button" href="/projects/new"><ScanSearch size={17} aria-hidden="true" /> Start a real website audit</Link>
        </motion.section>

        <section className="landing-cta" aria-labelledby="launch-title">
          <div><p className="eyebrow">Evidence starts here</p><h2 id="launch-title">Turn an inaccessible experience into an engineering plan.</h2></div>
          <Link className="button" href="/projects/new">Launch AccessForge <ArrowRight size={17} aria-hidden="true" /></Link>
        </section>
      </main>
    </div>
  );
}
