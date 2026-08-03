import Link from "next/link";
import { ArrowLeft, Radar } from "lucide-react";
import { Logo } from "@/components/logo";

export default function NotFound() {
  return (
    <div className="landing">
      <header className="topbar landing-nav"><Logo /></header>
      <main id="main-content" className="landing-section">
        <section className="panel route-state">
          <div className="route-state-icon" aria-hidden="true"><Radar size={28} /></div>
          <p className="eyebrow">Route not found</p>
          <h1>This workspace signal does not exist</h1>
          <p className="muted">The project, scan, or page may have moved. Return to the command centre to continue with persisted data.</p>
          <div className="route-state-actions"><Link className="button" href="/dashboard"><ArrowLeft size={16} /> Return to dashboard</Link></div>
        </section>
      </main>
    </div>
  );
}
