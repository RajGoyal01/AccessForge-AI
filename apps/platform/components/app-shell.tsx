"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { Activity, FolderKanban, Gauge, Menu, Plus, ScanSearch, ServerCog, Settings, Wrench, X } from "lucide-react";
import { Logo } from "./logo";
import { GuidedDemo } from "./guided-demo";

const nav = [
  { href: "/dashboard", label: "Dashboard", icon: Gauge },
  { href: "/projects", label: "Projects", icon: FolderKanban },
  { href: "/scans", label: "Scans", icon: ScanSearch },
  { href: "/repairs", label: "Repair Centre", icon: Wrench },
  { href: "/backend-lab", label: "Backend Lab", icon: ServerCog },
  { href: "/activity", label: "Activity", icon: Activity },
  { href: "/settings", label: "Settings", icon: Settings },
];

export function AppShell({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  const [demo, setDemo] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    if (!open) return;
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", closeOnEscape);
    return () => window.removeEventListener("keydown", closeOnEscape);
  }, [open]);

  return (
    <div className="shell">
      <aside id="primary-navigation" aria-label="Primary application sidebar" className={`sidebar ${open ? "open" : ""}`}>
        <div className="sidebar-brand"><Logo /><button className="sidebar-close" aria-label="Close navigation" onClick={() => setOpen(false)}><X size={18} /></button></div>
        <Link className="quick-audit" href="/projects/new" onClick={() => setOpen(false)}><Plus size={16} aria-hidden="true" /> New website audit</Link>
        <p className="nav-label">Workspace</p>
        <nav className="nav" aria-label="Application">
          {nav.map((item) => {
            const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
            return <Link aria-current={active ? "page" : undefined} className={active ? "active" : ""} key={item.href} href={item.href} onClick={() => setOpen(false)}><item.icon size={17} aria-hidden="true" /><span>{item.label}</span></Link>;
          })}
        </nav>
        <div className="side-bottom"><p className="side-caption">BUNDLED REPAIR LAB</p><button className="demo-launch" onClick={() => setDemo(true)}><span className="demo-orb" aria-hidden="true" />Launch Guided Demo</button></div>
      </aside>

      {open ? <button className="nav-backdrop" aria-label="Close navigation" onClick={() => setOpen(false)} /> : null}

      <div className="workspace">
        <header className="topbar workspace-topbar">
          <button className="button-secondary mobile-toggle" aria-label={open ? "Close navigation" : "Open navigation"} aria-expanded={open} aria-controls="primary-navigation" onClick={() => setOpen((value) => !value)}>{open ? <X size={18} /> : <Menu size={18} />}</button>
          <p className="engine-state"><span className="live-pulse" aria-hidden="true" /> Website intelligence engine</p>
          <div className="topbar-actions"><Link href="/projects/new">Audit a website</Link><span className="status active">System ready</span></div>
        </header>
        <main id="main-content" className="content">{children}</main>
      </div>
      {demo ? <GuidedDemo onClose={() => setDemo(false)} /> : null}
    </div>
  );
}
