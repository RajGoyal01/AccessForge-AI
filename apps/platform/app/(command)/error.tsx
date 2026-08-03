"use client";

import { AlertTriangle, RefreshCw, ShieldCheck } from "lucide-react";

export default function CommandError({ reset }: { reset: () => void }) {
  return (
    <section className="panel route-state" role="alert">
      <div className="route-state-icon error" aria-hidden="true"><AlertTriangle size={28} /></div>
      <p className="eyebrow">Workspace interrupted</p>
      <h1>AccessForge could not load this view</h1>
      <p className="muted">Your persisted data has not been changed. Retry the request, then check scanner and database readiness if it continues.</p>
      <div className="route-state-actions">
        <button className="button" type="button" onClick={reset}><RefreshCw size={16} /> Retry safely</button>
        <a className="button-secondary" href="/settings"><ShieldCheck size={16} /> Open readiness</a>
      </div>
    </section>
  );
}
