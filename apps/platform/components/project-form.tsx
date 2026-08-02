"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Check, Code2, Globe2, ScanSearch, ShieldCheck } from "lucide-react";

export function ProjectForm() {
  const [type, setType] = useState<"BUNDLED_DEMO" | "EXTERNAL_AUDIT">("EXTERNAL_AUDIT");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const router = useRouter();
  return <form className="form panel project-form" onSubmit={async event => {
    event.preventDefault(); setBusy(true); setError("");
    const data = new FormData(event.currentTarget);
    const body = { name: String(data.get("name")), description: String(data.get("description") ?? ""), projectType: type, ...(type === "EXTERNAL_AUDIT" ? { targetUrl: String(data.get("targetUrl")) } : {}) };
    const response = await fetch("/api/projects", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(body) });
    const result = await response.json();
    if (!response.ok) { setError(result.error?.message ?? "Could not create project"); setBusy(false); return; }
    router.push(`/projects/${result.project.id}`); router.refresh();
  }}>
    <div className="choice-grid">
      <button type="button" className={`choice ${type === "EXTERNAL_AUDIT" ? "selected" : ""}`} onClick={() => setType("EXTERNAL_AUDIT")}><Globe2 size={22} /><strong>Audit a real website</strong><span className="muted">Scan a public URL with a real browser, inspect evidence and receive detailed remediation guidance.</span></button>
      <button type="button" className={`choice ${type === "BUNDLED_DEMO" ? "selected" : ""}`} onClick={() => setType("BUNDLED_DEMO")}><Code2 size={22} /><strong>NovaMart repair lab</strong><span className="muted">Full source mapping, code proposal, human approval, evaluation and rollback.</span></button>
    </div>
    <div className="capability-strip">
      <span><ScanSearch size={15} /> Real axe scan</span><span><Globe2 size={15} /> Screenshot evidence</span><span><Check size={15} /> Prioritized changes</span><span><ShieldCheck size={15} /> Read-only by default</span>
    </div>
    <label>Project name<input className="input" name="name" required minLength={2} placeholder={type === "EXTERNAL_AUDIT" ? "Company website" : "NovaMart"} defaultValue={type === "BUNDLED_DEMO" ? "NovaMart" : ""} /></label>
    <label>Description <span className="optional">Optional</span><textarea className="input" name="description" style={{ height: 90, paddingTop: 12 }} placeholder="What experience or customer journey are you auditing?" /></label>
    {type === "EXTERNAL_AUDIT" ? <><label>Public target URL<input className="input" name="targetUrl" type="url" placeholder="https://example.com" required /></label><p className="boundary-note"><ShieldCheck size={18} /><span>AccessForge will open and analyze this public page. It will not submit forms, log in, modify content or access source code.</span></p></> : <p className="success">NovaMart is fixed to http://localhost:3001 and is the only repairable source tree.</p>}
    {error ? <p className="error" role="alert">{error}</p> : null}
    <button className="button magnetic" disabled={busy}>{busy ? "Creating workspace…" : type === "EXTERNAL_AUDIT" ? "Create live audit workspace" : "Open NovaMart repair lab"}</button>
  </form>;
}
