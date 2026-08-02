"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

interface RepairControlsProps {
  repairId: string;
  status: string;
  evaluationId: string | undefined;
}

export function RepairControls({ repairId, status, evaluationId }: RepairControlsProps) {
  const [busy, setBusy] = useState("");
  const [message, setMessage] = useState("");
  const router = useRouter();

  async function action(name: string, confirmation?: string) {
    if (confirmation && !window.confirm(confirmation)) return;
    setBusy(name);
    setMessage("");
    const response = await fetch(`/api/repairs/${repairId}/${name}`, { method: "POST" });
    const data = await response.json();
    if (!response.ok) {
      setMessage(data.error?.message ?? "Operation failed");
      setBusy("");
      return;
    }
    if (name === "evaluate") router.push(`/evaluations/${data.evaluation.id}`);
    else {
      setMessage(name === "approve" ? "Approved replacement applied after backup creation." : name === "rollback" ? "Verified backup restored." : "Proposal rejected without source changes.");
      router.refresh();
      setBusy("");
    }
  }

  return <div className="panel"><p className="eyebrow">Human control</p><h2>Review decision</h2><p className="muted">Approval is deliberate. The server revalidates the file hash, creates a backup and applies only the exact displayed replacement.</p><div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
    {status === "WAITING_FOR_APPROVAL" ? <><button className="button" disabled={Boolean(busy)} onClick={() => action("approve", "Approve this exact file replacement? A timestamped backup will be created and rollback will remain available.")}>{busy === "approve" ? "Validating and applying…" : "Approve and Apply"}</button><button className="button-danger" disabled={Boolean(busy)} onClick={() => action("reject")}>Reject</button></> : null}
    {status === "APPLIED" ? <button className="button" disabled={Boolean(busy)} onClick={() => action("evaluate")}>{busy === "evaluate" ? "Running tests and rescan…" : "Run evaluation"}</button> : null}
    {["APPLIED", "VERIFIED", "FAILED"].includes(status) ? <button className="button-secondary" disabled={Boolean(busy)} onClick={() => action("rollback", "Restore the verified backup and discard the applied change?")}>Rollback</button> : null}
    {evaluationId ? <a className="button-secondary" href={`/evaluations/${evaluationId}`}>Open evaluation</a> : null}
  </div>{message ? <p className={message.includes("failed") ? "error" : "success"} role="status">{message}</p> : null}</div>;
}
