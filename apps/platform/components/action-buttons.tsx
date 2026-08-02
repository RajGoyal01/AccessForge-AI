"use client";
import { useRouter } from "next/navigation";
import { useState } from "react";

export function StartScanButton({ projectId }: { projectId: string }) {
  const [busy, setBusy] = useState(false), [error, setError] = useState("");
  const router = useRouter();
  return <div><button className="button magnetic" disabled={busy} onClick={async () => { setBusy(true); setError(""); try { const response = await fetch(`/api/projects/${projectId}`, { method: "POST" }); const data = await response.json(); if (!response.ok) throw new Error(data.error?.message ?? "Scan failed"); router.push(`/scans/${data.scan.id}`); router.refresh(); } catch (error) { setError(error instanceof Error ? error.message : "Scan failed"); setBusy(false); } }}>{busy ? "Running real scan…" : "Start Accessibility Audit"}</button>{error ? <p className="error">{error}</p> : null}</div>;
}

export function GenerateRepairButton({ issueId }: { issueId: string }) {
  const [busy, setBusy] = useState(false), [error, setError] = useState("");
  const router = useRouter();
  return <div><button className="button" disabled={busy} onClick={async () => { setBusy(true); try { const response = await fetch(`/api/issues/${issueId}`, { method: "POST" }); const data = await response.json(); if (!response.ok) throw new Error(data.error?.message ?? "Proposal failed"); router.push(`/repairs/${data.repair.id}`); } catch (error) { setError(error instanceof Error ? error.message : "Proposal failed"); setBusy(false); } }}>{busy ? "Preparing proposal…" : "Generate repair proposal"}</button>{error ? <p className="error">{error}</p> : null}</div>;
}
