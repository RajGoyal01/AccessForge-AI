"use client";

import { useState } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { Braces, Check, Clock3, Copy, DatabaseZap, Globe2, LockKeyhole, Plus, ServerCog, ShieldCheck, Trash2 } from "lucide-react";
import type { TemporaryBackendContract } from "@/lib/backend-lab/validation";
import styles from "./backend-lab.module.css";

type BackendSummary = {
  id: string;
  name: string;
  description: string | null;
  status: "ACTIVE" | "EXPIRED" | "DISABLED";
  expiresAt: string;
  requestCount: number;
  endpoints: Array<{ method: "GET" | "POST"; path: string }>;
};

const exampleContract = JSON.stringify({
  version: 1,
  endpoints: [
    { method: "GET", path: "/products", status: 200, body: [{ id: "p-01", name: "Aurora Lamp", price: 89 }] },
    { method: "POST", path: "/checkout", status: 201, body: { orderId: "demo-order-01", status: "accepted" } },
  ],
}, null, 2);

function formatExpiry(value: string) {
  return new Intl.DateTimeFormat("en", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit", hour12: false, timeZone: "UTC" }).format(new Date(value)) + " UTC";
}

export function BackendLab({ initialBackends }: { initialBackends: BackendSummary[] }) {
  const reduceMotion = useReducedMotion();
  const [backends, setBackends] = useState(initialBackends);
  const [name, setName] = useState("");
  const [ttlMinutes, setTtlMinutes] = useState<30 | 60 | 180>(60);
  const [contractText, setContractText] = useState(exampleContract);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [busy, setBusy] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  async function createBackend(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setNotice("");
    let contract: TemporaryBackendContract;
    try {
      contract = JSON.parse(contractText) as TemporaryBackendContract;
    } catch {
      setError("The endpoint contract must be valid JSON.");
      return;
    }
    setBusy(true);
    try {
      const response = await fetch("/api/backend-labs", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ name, ttlMinutes, contract }) });
      const payload = (await response.json()) as { backend?: Omit<BackendSummary, "endpoints">; error?: { message?: string } };
      if (!response.ok || !payload.backend) throw new Error(payload.error?.message ?? "Could not create a temporary backend.");
      setBackends((current) => [{ ...payload.backend!, endpoints: contract.endpoints.map(({ method, path }) => ({ method, path })) }, ...current]);
      setName("");
      setNotice("Temporary backend created. Copy an endpoint URL into your frontend.");
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Could not create a temporary backend.");
    } finally {
      setBusy(false);
    }
  }

  async function disableBackend(id: string) {
    setError("");
    try {
      const response = await fetch(`/api/backend-labs/${encodeURIComponent(id)}`, { method: "DELETE" });
      const payload = (await response.json()) as { error?: { message?: string } };
      if (!response.ok) throw new Error(payload.error?.message ?? "Could not disable the temporary backend.");
      setBackends((current) => current.map((backend) => backend.id === id ? { ...backend, status: "DISABLED" } : backend));
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Could not disable the temporary backend.");
    }
  }

  async function copyEndpoint(id: string, path: string) {
    const value = `${window.location.origin}/api/temporary/${id}${path}`;
    await navigator.clipboard.writeText(value).catch(() => undefined);
    setCopiedId(id);
    window.setTimeout(() => setCopiedId((current) => current === id ? null : current), 1_600);
  }

  return <div className={styles.lab}>
    <motion.header className={styles.hero} initial={reduceMotion ? false : { opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.42 }}>
      <div className={styles.heroGlyph} aria-hidden="true"><ServerCog size={32} /><i /><i /></div>
      <div><p>FRONTEND COMPLETION LAB</p><h1>Give your frontend a safe, temporary API.</h1><span>Define the endpoints your UI needs. AccessForge hosts a validated mock backend with automatic expiry—without executing uploaded code or touching a real database.</span></div>
      <div className={styles.heroFacts}><span><Clock3 size={15} aria-hidden="true" /> 30 min–3 hr expiry</span><span><ShieldCheck size={15} aria-hidden="true" /> JSON contracts only</span><span><LockKeyhole size={15} aria-hidden="true" /> No secrets or real data</span></div>
    </motion.header>

    <div className={styles.grid}>
      <motion.section className={styles.builder} initial={reduceMotion ? false : { opacity: 0, x: -12 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.35, delay: reduceMotion ? 0 : 0.04 }} aria-labelledby="contract-title">
        <div className={styles.sectionHeading}><span><Braces size={17} aria-hidden="true" /> Contract builder</span><small>Endpoint contract v1</small></div>
        <h2 id="contract-title">Describe the API your frontend expects.</h2>
        <p>Use GET and POST endpoints with JSON responses. Responses are fixed mock data—not an executable backend or a connection to your production systems.</p>
        <form onSubmit={createBackend} className={styles.form}>
          <label>Backend name<input className="input" value={name} onChange={(event) => setName(event.target.value)} required minLength={2} maxLength={80} placeholder="Storefront prototype API" /></label>
          <fieldset><legend>Lifetime</legend><div className={styles.ttlChoices}>{([30, 60, 180] as const).map((minutes) => <label key={minutes}><input type="radio" checked={ttlMinutes === minutes} onChange={() => setTtlMinutes(minutes)} /> <span>{minutes < 60 ? "30 minutes" : `${minutes / 60} hour${minutes > 60 ? "s" : ""}`}</span></label>)}</div></fieldset>
          <label>Endpoint contract<textarea className={styles.contractInput} value={contractText} onChange={(event) => setContractText(event.target.value)} spellCheck={false} aria-describedby="contract-help" /></label>
          <p id="contract-help" className={styles.help}>Maximum six endpoints. Allowed methods: GET and POST. Supported response payloads must be JSON-serializable.</p>
          {error ? <p className="error" role="alert">{error}</p> : null}
          {notice ? <p className="success" role="status">{notice}</p> : null}
          <button className="button magnetic" disabled={busy}>{busy ? "Creating temporary backend…" : <><Plus size={17} aria-hidden="true" /> Create temporary backend</>}</button>
        </form>
      </motion.section>

      <motion.aside className={styles.safety} initial={reduceMotion ? false : { opacity: 0, x: 12 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.35, delay: reduceMotion ? 0 : 0.08 }}>
        <div className={styles.safetyIcon}><ShieldCheck size={21} aria-hidden="true" /></div><p>SAFETY BOUNDARY</p><h2>Temporary by design.</h2>
        <ul><li><Check size={15} aria-hidden="true" /> Static JSON responses only</li><li><Check size={15} aria-hidden="true" /> Fixed 120 requests/minute limit</li><li><Check size={15} aria-hidden="true" /> Auto-expires without manual cleanup</li><li><Check size={15} aria-hidden="true" /> No uploads, shell commands, or external database access</li></ul>
        <div className={styles.warning}><Globe2 size={16} aria-hidden="true" /><span>Temporary endpoints use permissive CORS so a prototype frontend can call them. Never put personal, secret, or production data into a contract.</span></div>
      </motion.aside>
    </div>

    <section className={styles.instances} aria-labelledby="instances-title">
      <div className={styles.instanceHead}><div><p>ACTIVE EXPERIMENTS</p><h2 id="instances-title">Temporary backend instances</h2></div><span><DatabaseZap size={15} aria-hidden="true" /> {backends.filter((backend) => backend.status === "ACTIVE").length} active</span></div>
      {backends.length ? <div className={styles.instanceList}>{backends.map((backend, index) => <motion.article key={backend.id} className={styles.instance} initial={reduceMotion ? false : { opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: reduceMotion ? 0 : index * 0.04 }} data-active={backend.status === "ACTIVE"}>
        <div className={styles.instanceTitle}><div><span data-status={backend.status}>{backend.status.toLowerCase()}</span><h3>{backend.name}</h3><p>Expires {formatExpiry(backend.expiresAt)} · {backend.requestCount} requests</p></div>{backend.status === "ACTIVE" ? <button type="button" className={styles.disable} onClick={() => disableBackend(backend.id)}><Trash2 size={14} aria-hidden="true" /> Disable</button> : null}</div>
        <div className={styles.endpointList}>{backend.endpoints.map((endpoint) => <div key={`${endpoint.method}${endpoint.path}`} className={styles.endpoint}><b data-method={endpoint.method}>{endpoint.method}</b><code>/api/temporary/{backend.id}{endpoint.path}</code>{backend.status === "ACTIVE" ? <button type="button" onClick={() => copyEndpoint(backend.id, endpoint.path)} aria-label={`Copy ${endpoint.method} ${endpoint.path} endpoint`}>{copiedId === backend.id ? <Check size={14} aria-hidden="true" /> : <Copy size={14} aria-hidden="true" />}</button> : null}</div>)}</div>
      </motion.article>)}</div> : <div className={styles.empty}><ServerCog size={28} aria-hidden="true" /><strong>No temporary backends yet</strong><span>Create a contract above, then point your frontend&apos;s fetch calls at the generated endpoint URLs.</span></div>}
    </section>
  </div>;
}
