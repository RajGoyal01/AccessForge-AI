import { Radar, ScanSearch, ShieldCheck } from "lucide-react";

export default function CommandLoading() {
  return (
    <section className="panel route-state route-state-loading" aria-live="polite" aria-busy="true">
      <div className="route-state-radar" aria-hidden="true">
        <Radar size={32} />
        <span />
      </div>
      <p className="eyebrow"><ScanSearch size={13} /> Loading verified workspace</p>
      <h1>Preparing the command centre</h1>
      <p className="muted">AccessForge is retrieving persisted projects, evidence, and agent activity.</p>
      <div className="route-state-lines" aria-hidden="true"><i /><i /><i /></div>
      <span className="route-state-note"><ShieldCheck size={14} /> No results are simulated while data is loading.</span>
    </section>
  );
}
