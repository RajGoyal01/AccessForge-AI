"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type { ActivityEvent, Issue, ProjectType, ScanStage, ScanStatus } from "@prisma/client";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import {
  Activity,
  ArrowUpRight,
  Bot,
  Box,
  Braces,
  Check,
  CircleDot,
  Eye,
  EyeOff,
  FileSearch,
  Filter,
  Radar,
  Search,
  ShieldCheck,
  Sparkles,
  TriangleAlert,
} from "lucide-react";
import { Severity } from "./status";
import styles from "./scan-inspector.module.css";

type ClientIssue = Pick<
  Issue,
  | "id"
  | "impact"
  | "title"
  | "selector"
  | "ruleId"
  | "repairAvailable"
  | "boundingX"
  | "boundingY"
  | "boundingWidth"
  | "boundingHeight"
>;

export type SafeActivityEvent = Pick<
  ActivityEvent,
  "id" | "agent" | "eventType" | "status" | "message"
> & { createdAt: Date | string };

type LiveScan = {
  status: ScanStatus;
  stage: ScanStage;
  screenshotPath: string | null;
  finalScore: number | null;
  issues: ClientIssue[];
  activityEvents: SafeActivityEvent[];
  pageScans: Array<{ viewportWidth: number; viewportHeight: number }>;
  project: { projectType: ProjectType };
};

type AgentState = "waiting" | "active" | "completed" | "failed" | "approval" | "unavailable";

const TERMINAL_STATUSES = new Set<ScanStatus>(["COMPLETED", "FAILED", "CANCELLED"]);
const STAGE_ORDER: ScanStage[] = [
  "QUEUED",
  "INITIALIZING",
  "EXPLORING",
  "AUDITING",
  "PROCESSING_RESULTS",
  "MAPPING",
  "REPAIRING",
  "AWAITING_APPROVAL",
  "EVALUATING",
  "COMPLETED",
];

const AGENTS = [
  { key: "EXPLORER", name: "Explorer", description: "Opens the page and captures browser evidence", icon: Radar },
  { key: "AUDIT", name: "Accessibility Audit", description: "Runs deterministic axe checks", icon: ShieldCheck },
  { key: "CONTEXT", name: "Context", description: "Maps eligible evidence to source context", icon: FileSearch },
  { key: "REPAIR", name: "Repair", description: "Prepares a proposal for human review", icon: Braces },
  { key: "EVALUATION", name: "Evaluation", description: "Rechecks an approved bundled repair", icon: Check },
] as const;

const EVIDENCE_LENSES = [
  { icon: Radar, label: "Browser reality", detail: "Fresh Chromium session, rendered DOM, title, viewport, and navigation evidence." },
  { icon: ShieldCheck, label: "Deterministic audit", detail: "Pinned axe-core rules produce inspectable findings instead of model guesses." },
  { icon: Eye, label: "Visual context", detail: "A full-page capture and element coordinates connect each finding to what people see." },
] as const;

function stageAtLeast(stage: ScanStage, expected: ScanStage) {
  return STAGE_ORDER.indexOf(stage) >= STAGE_ORDER.indexOf(expected);
}

function stateFromEvents(agent: (typeof AGENTS)[number]["key"], events: SafeActivityEvent[]): AgentState | null {
  const event = [...events].reverse().find(candidate => candidate.agent === agent);
  if (!event) return null;
  if (event.status === "FAILED") return "failed";
  if (event.status === "RUNNING") return "active";
  if (event.status === "SUCCEEDED") return "completed";
  if (event.status === "WAITING") return agent === "REPAIR" ? "approval" : "waiting";
  return null;
}

function getAgentState(
  agent: (typeof AGENTS)[number]["key"],
  scanStatus: ScanStatus,
  stage: ScanStage,
  projectType: ProjectType,
  events: SafeActivityEvent[],
): AgentState {
  if (projectType === "EXTERNAL_AUDIT" && ["CONTEXT", "REPAIR", "EVALUATION"].includes(agent)) return "unavailable";

  const eventState = stateFromEvents(agent, events);
  if (eventState) return eventState;

  if (agent === "EXPLORER") {
    if (scanStatus === "FAILED" && !stageAtLeast(stage, "AUDITING")) return "failed";
    if (["INITIALIZING", "EXPLORING"].includes(stage)) return "active";
    if (stageAtLeast(stage, "AUDITING")) return "completed";
  }
  if (agent === "AUDIT") {
    if (scanStatus === "FAILED" && stage === "AUDITING") return "failed";
    if (stage === "AUDITING") return "active";
    if (stageAtLeast(stage, "PROCESSING_RESULTS")) return "completed";
  }
  if (agent === "CONTEXT" && stage === "MAPPING") return "active";
  if (agent === "REPAIR" && stage === "REPAIRING") return "active";
  if (agent === "REPAIR" && stage === "AWAITING_APPROVAL") return "approval";
  if (agent === "EVALUATION" && stage === "EVALUATING") return "active";
  return "waiting";
}

const STATE_COPY: Record<AgentState, string> = {
  waiting: "Waiting",
  active: "Active",
  completed: "Completed with evidence",
  failed: "Failed",
  approval: "Waiting for approval",
  unavailable: "Audit-only boundary",
};

export function LiveAgentPipeline({
  scanId,
  status,
  stage,
  projectType,
  activityEvents,
}: {
  scanId: string;
  status: ScanStatus;
  stage: ScanStage;
  projectType: ProjectType;
  activityEvents: SafeActivityEvent[];
}) {
  const reduceMotion = useReducedMotion();
  const router = useRouter();
  const [snapshot, setSnapshot] = useState({ status, stage, activityEvents });
  const terminalRefreshSent = useRef(TERMINAL_STATUSES.has(status));

  useEffect(() => {
    if (TERMINAL_STATUSES.has(snapshot.status)) return;
    let stopped = false;
    let timer: ReturnType<typeof setTimeout> | undefined;
    const controller = new AbortController();

    async function refreshPipeline() {
      try {
        const response = await fetch(`/api/scans/${encodeURIComponent(scanId)}`, { cache: "no-store", signal: controller.signal });
        if (!response.ok) throw new Error("Scan status unavailable");
        const payload = (await response.json()) as { scan: Pick<LiveScan, "status" | "stage" | "activityEvents"> };
        if (stopped) return;
        setSnapshot(payload.scan);
        if (TERMINAL_STATUSES.has(payload.scan.status)) {
          if (!terminalRefreshSent.current) {
            terminalRefreshSent.current = true;
            router.refresh();
          }
          return;
        }
      } catch (error) {
        if (stopped || (error instanceof DOMException && error.name === "AbortError")) return;
      }
      timer = setTimeout(refreshPipeline, 1400);
    }

    timer = setTimeout(refreshPipeline, 900);
    return () => {
      stopped = true;
      controller.abort();
      if (timer) clearTimeout(timer);
    };
  }, [router, scanId, snapshot.status]);

  const states = AGENTS.map(agent => ({ ...agent, state: getAgentState(agent.key, snapshot.status, snapshot.stage, projectType, snapshot.activityEvents) }));
  const activeAgent = states.find(agent => agent.state === "active");
  const announcement = activeAgent
    ? `${activeAgent.name} agent active. ${liveStageCopy(snapshot.status, snapshot.stage)}`
    : `${snapshot.status.replaceAll("_", " ")}. ${liveStageCopy(snapshot.status, snapshot.stage)}`;

  return (
    <section className={styles.pipelineShell} aria-labelledby="evidence-pipeline-title">
      <p className={styles.srOnly} aria-live="polite" aria-atomic="true">{announcement}</p>
      <div className={styles.pipelineHeading}>
        <div>
          <p className={styles.kicker}><Bot size={13} aria-hidden="true" /> Evidence pipeline</p>
          <h2 id="evidence-pipeline-title">Real agents, clear boundaries</h2>
        </div>
        <div className={styles.liveState} data-active={Boolean(activeAgent)}>
          <span aria-hidden="true" />
          {activeAgent ? `${activeAgent.name} active` : snapshot.status === "COMPLETED" ? "Scan evidence ready" : snapshot.status.replaceAll("_", " ")}
        </div>
      </div>

      <ol className={styles.agentRail}>
        {states.map((agent, index) => {
          const Icon = agent.icon;
          return (
            <motion.li
              key={agent.key}
              className={styles.agentStep}
              data-state={agent.state}
              initial={reduceMotion ? false : { opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: reduceMotion ? 0 : index * 0.045, duration: 0.25 }}
            >
              <div className={styles.agentIcon} aria-hidden="true"><Icon size={18} /></div>
              <div className={styles.agentCopy}>
                <span>0{index + 1}</span>
                <strong>{agent.name}</strong>
                <small>{agent.description}</small>
              </div>
              <span className={styles.agentState}>
                {agent.state === "active" ? <CircleDot size={12} aria-hidden="true" /> : null}
                {STATE_COPY[agent.state]}
              </span>
            </motion.li>
          );
        })}
      </ol>
      <div className={styles.evidenceLenses} aria-label="Multimodal scan evidence">
        {EVIDENCE_LENSES.map((lens, index) => {
          const Icon = lens.icon;
          return (
            <motion.div
              key={lens.label}
              className={styles.evidenceLens}
              initial={reduceMotion ? false : { opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: reduceMotion ? 0 : 0.12 + index * 0.05, duration: 0.24 }}
            >
              <Icon size={15} aria-hidden="true" />
              <div><strong>{lens.label}</strong><span>{lens.detail}</span></div>
            </motion.div>
          );
        })}
      </div>
      {projectType === "EXTERNAL_AUDIT" ? (
        <p className={styles.boundaryMessage}>
          <ShieldCheck size={16} aria-hidden="true" /> External websites are inspected and reported only. Source mapping, repair application, and evaluation remain disabled.
        </p>
      ) : null}
    </section>
  );
}

function liveStageCopy(status: ScanStatus, stage: ScanStage) {
  if (status === "FAILED") return "The scan stopped. Preserved events explain the last confirmed stage.";
  if (status === "CANCELLED") return "The scan was cancelled and browser resources are being released.";
  if (status === "COMPLETED") return "Evidence capture and deterministic accessibility checks are complete.";
  const copy: Partial<Record<ScanStage, string>> = {
    QUEUED: "Waiting for a controlled browser session.",
    INITIALIZING: "Preparing an isolated Chromium browser context.",
    EXPLORING: "Opening the approved target and capturing page evidence.",
    AUDITING: "Running deterministic axe checks against the rendered page.",
    PROCESSING_RESULTS: "Normalizing findings, selectors, and element locations.",
    MAPPING: "Checking approved source metadata for eligible findings.",
    REPAIRING: "Preparing a bounded proposal for human review.",
    AWAITING_APPROVAL: "The proposed change is paused for explicit human approval.",
    EVALUATING: "Running predefined checks and a comparable rescan.",
  };
  return copy[stage] ?? "Waiting for the next confirmed stage.";
}

function screenshotName(path: string | null) {
  if (!path) return null;
  return path.replaceAll("\\", "/").split("/").at(-1) ?? null;
}

export function ScanInspector({ scanId, projectType, screenshot, issues }: { scanId: string; projectType: ProjectType; screenshot: string | null; issues: Issue[] }) {
  const reduceMotion = useReducedMotion();
  const [filter, setFilter] = useState("ALL");
  const [query, setQuery] = useState("");
  const [markers, setMarkers] = useState(true);
  const [selectedIssue, setSelectedIssue] = useState<string | null>(null);
  const [imageSize, setImageSize] = useState<{ width: number; height: number } | null>(null);
  const [liveScan, setLiveScan] = useState<LiveScan | null>(null);
  const [connection, setConnection] = useState<"connecting" | "live" | "interrupted">("connecting");

  useEffect(() => {
    if (!scanId) return;
    let stopped = false;
    let timer: ReturnType<typeof setTimeout> | undefined;
    const controller = new AbortController();

    async function refresh() {
      try {
        const response = await fetch(`/api/scans/${encodeURIComponent(scanId!)}`, { cache: "no-store", signal: controller.signal });
        if (!response.ok) throw new Error("Scan status unavailable");
        const payload = (await response.json()) as { scan: LiveScan };
        if (stopped) return;
        setLiveScan(payload.scan);
        setConnection("live");
        if (!TERMINAL_STATUSES.has(payload.scan.status)) timer = setTimeout(refresh, 1400);
      } catch (error) {
        if (stopped || (error instanceof DOMException && error.name === "AbortError")) return;
        setConnection("interrupted");
        timer = setTimeout(refresh, 3000);
      }
    }

    void refresh();
    return () => {
      stopped = true;
      controller.abort();
      if (timer) clearTimeout(timer);
    };
  }, [scanId]);

  const currentIssues = liveScan?.issues ?? issues;
  const currentScreenshot = liveScan?.screenshotPath ?? screenshot;
  const viewportWidth = liveScan?.pageScans[0]?.viewportWidth ?? 1440;
  const viewportHeight = liveScan?.pageScans[0]?.viewportHeight ?? null;
  const currentStatus = liveScan?.status ?? "COMPLETED";
  const currentStage = liveScan?.stage ?? "COMPLETED";
  const isRunning = !TERMINAL_STATUSES.has(currentStatus);
  const external = (liveScan?.project.projectType ?? projectType) === "EXTERNAL_AUDIT";
  const screenshotFile = screenshotName(currentScreenshot);

  const shown = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    return currentIssues.filter(issue => {
      const severityMatch = filter === "ALL" || issue.impact === filter;
      const queryMatch = !normalizedQuery || [issue.title, issue.selector, issue.ruleId].some(value => value.toLowerCase().includes(normalizedQuery));
      return severityMatch && queryMatch;
    });
  }, [currentIssues, filter, query]);

  const evidence = useMemo(() => ({
    elements: currentIssues.length,
    located: currentIssues.filter(issue => issue.boundingX !== null && issue.boundingY !== null).length,
    rules: new Set(currentIssues.map(issue => issue.ruleId)).size,
    repairable: currentIssues.filter(issue => issue.repairAvailable).length,
  }), [currentIssues]);

  const announcement = `${currentStage.replaceAll("_", " ")}. ${liveStageCopy(currentStatus, currentStage)}`;

  return (
    <div className={styles.commandCentre}>
      <p className={styles.srOnly} aria-live="polite" aria-atomic="true">{announcement}</p>

      <section className={styles.signalDeck} aria-label="Live scan evidence">
        <div className={styles.stageSignal} data-running={isRunning}>
          <div className={styles.radarGlyph} aria-hidden="true">
            <Radar size={25} />
            {isRunning && !reduceMotion ? <motion.i animate={{ scale: [0.75, 1.45], opacity: [0.75, 0] }} transition={{ duration: 1.8, repeat: Infinity, ease: "easeOut" }} /> : null}
          </div>
          <div>
            <p className={styles.kicker}><Activity size={13} aria-hidden="true" /> Confirmed stage</p>
            <h2>{currentStage.replaceAll("_", " ")}</h2>
            <p>{liveStageCopy(currentStatus, currentStage)}</p>
          </div>
          <span className={styles.connection} data-state={connection}>
            <i aria-hidden="true" /> {connection === "live" ? "Live data" : connection === "interrupted" ? "Reconnecting" : "Connecting"}
          </span>
        </div>

        <div className={styles.evidenceGrid}>
          <EvidenceMetric icon={TriangleAlert} label="Affected elements" value={evidence.elements} />
          <EvidenceMetric icon={Box} label="Elements located" value={evidence.located} />
          <EvidenceMetric icon={Sparkles} label="Distinct axe rules" value={evidence.rules} />
          <EvidenceMetric icon={ShieldCheck} label={external ? "External repair" : "Repair candidates"} value={external ? "Disabled" : evidence.repairable} />
        </div>
      </section>

      <div className={styles.workspace}>
        <section className={styles.viewerPanel} aria-labelledby="visual-inspector-title">
          <div className={styles.panelHead}>
            <div>
              <p className={styles.kicker}><Eye size={13} aria-hidden="true" /> Visual evidence</p>
              <h2 id="visual-inspector-title">Captured website</h2>
              {viewportHeight ? <span>{viewportWidth} × {viewportHeight} viewport · full-page capture</span> : <span>Secure browser capture</span>}
            </div>
            <button className={styles.toolButton} type="button" aria-pressed={markers} onClick={() => setMarkers(value => !value)}>
              {markers ? <EyeOff size={15} aria-hidden="true" /> : <Eye size={15} aria-hidden="true" />}
              {markers ? "Hide markers" : "Show markers"}
            </button>
          </div>

          {screenshotFile ? (
            <div className={styles.screenshotFrame}>
              <div className={styles.browserBar} aria-hidden="true"><i /><i /><i /><span>Captured page evidence</span></div>
              <div className={styles.screenshot}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={`/api/screenshots/${encodeURIComponent(screenshotFile)}`}
                  alt="Full-page screenshot captured during this accessibility scan"
                  onLoad={event => setImageSize({ width: event.currentTarget.naturalWidth, height: event.currentTarget.naturalHeight })}
                />
                <AnimatePresence>
                  {markers && imageSize ? shown.map((issue, index) => issue.boundingX !== null && issue.boundingY !== null ? (
                    <motion.button
                      type="button"
                      className={styles.marker}
                      data-selected={selectedIssue === issue.id}
                      aria-label={`Select issue ${index + 1}: ${issue.title}`}
                      key={issue.id}
                      onClick={() => setSelectedIssue(issue.id)}
                      style={{
                        left: `${(((issue.boundingX ?? 0) + (issue.boundingWidth ?? 0) / 2) / Math.max(imageSize.width, 1)) * 100}%`,
                        top: `${(((issue.boundingY ?? 0) + (issue.boundingHeight ?? 0) / 2) / Math.max(imageSize.height, 1)) * 100}%`,
                      }}
                      initial={reduceMotion ? false : { scale: 0, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      exit={{ scale: 0, opacity: 0 }}
                    >
                      {index + 1}
                    </motion.button>
                  ) : null) : null}
                </AnimatePresence>
              </div>
            </div>
          ) : isRunning ? (
            <div className={styles.capturePending} data-animated={!reduceMotion}>
              <div className={styles.pendingGrid} aria-hidden="true"><span /></div>
              <Radar size={32} aria-hidden="true" />
              <strong>Browser evidence is being collected</strong>
              <p>The screenshot appears only after the capture is confirmed by the scanner.</p>
            </div>
          ) : (
            <div className={styles.emptyEvidence}>Screenshot unavailable for this scan. Issue evidence remains available in the findings panel.</div>
          )}
        </section>

        <aside className={styles.issuesPanel} aria-labelledby="issue-panel-title">
          <div className={styles.panelHead}>
            <div>
              <p className={styles.kicker}><Filter size={13} aria-hidden="true" /> Evidence findings</p>
              <h2 id="issue-panel-title">{shown.length} affected elements</h2>
              <span>Results from the current filters</span>
            </div>
          </div>

          <div className={styles.filters}>
            <label className={styles.searchField}>
              <span className={styles.srOnly}>Search issues</span>
              <Search size={15} aria-hidden="true" />
              <input value={query} onChange={event => setQuery(event.target.value)} placeholder="Search rule, issue, selector…" />
            </label>
            <label>
              <span className={styles.srOnly}>Filter by severity</span>
              <select value={filter} onChange={event => setFilter(event.target.value)}>
                <option value="ALL">All severities</option>
                <option value="CRITICAL">Critical</option>
                <option value="SERIOUS">Serious</option>
                <option value="MODERATE">Moderate</option>
                <option value="MINOR">Minor</option>
                <option value="UNKNOWN">Unknown</option>
              </select>
            </label>
          </div>

          <div className={styles.issueList}>
            <AnimatePresence initial={false}>
              {shown.length ? shown.map((issue, index) => (
                <motion.article
                  className={styles.issueCard}
                  data-selected={selectedIssue === issue.id}
                  key={issue.id}
                  layout={!reduceMotion}
                  initial={reduceMotion ? false : { opacity: 0, y: 5 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                >
                  <button type="button" onClick={() => setSelectedIssue(issue.id)} aria-label={`Select issue ${index + 1}: ${issue.title}`}>
                    <span className={styles.issueNumber}>{String(index + 1).padStart(2, "0")}</span>
                    <Severity value={issue.impact} />
                    <strong>{issue.title}</strong>
                    <span className={styles.rule}>{issue.ruleId}</span>
                    <span className={styles.selector}>{issue.selector}</span>
                    {issue.boundingX === null || issue.boundingY === null ? <span className={styles.unlocated}>No screenshot coordinate</span> : null}
                  </button>
                  <Link href={`/issues/${issue.id}`} className={styles.openIssue}>
                    Review evidence <ArrowUpRight size={14} aria-hidden="true" />
                  </Link>
                </motion.article>
              )) : <motion.div className={styles.emptyEvidence} initial={{ opacity: 0 }} animate={{ opacity: 1 }}>No issues match these filters.</motion.div>}
            </AnimatePresence>
          </div>
        </aside>
      </div>
    </div>
  );
}

function EvidenceMetric({ icon: Icon, label, value }: { icon: typeof Activity; label: string; value: number | string }) {
  return (
    <article className={styles.evidenceMetric}>
      <Icon size={17} aria-hidden="true" />
      <span>{label}</span>
      <strong>{value}</strong>
    </article>
  );
}
