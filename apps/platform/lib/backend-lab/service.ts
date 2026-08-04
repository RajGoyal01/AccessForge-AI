import { TemporaryBackendStatus } from "@prisma/client";
import { db } from "@/lib/db/client";
import { AppError } from "@/lib/errors";
import { parseStoredContract, parseTemporaryBackendInput } from "./validation";

const REQUEST_WINDOW_MS = 60_000;
const MAX_REQUESTS_PER_WINDOW = 120;
const requestWindows = new Map<string, { startedAt: number; count: number }>();

function enforceRequestLimit(backendId: string) {
  const now = Date.now();
  const entry = requestWindows.get(backendId);
  if (!entry || now - entry.startedAt >= REQUEST_WINDOW_MS) {
    requestWindows.set(backendId, { startedAt: now, count: 1 });
    return;
  }
  if (entry.count >= MAX_REQUESTS_PER_WINDOW) {
    throw new AppError("CONFLICT", "This temporary backend is rate-limited. Try again in a minute.", 429);
  }
  entry.count += 1;
}

async function expireBackends() {
  await db.temporaryBackend.updateMany({
    where: { status: "ACTIVE", expiresAt: { lte: new Date() } },
    data: { status: "EXPIRED" },
  });
}

export async function listTemporaryBackends() {
  await expireBackends();
  return db.temporaryBackend.findMany({ orderBy: { createdAt: "desc" }, take: 20 });
}

export async function createTemporaryBackend(input: unknown) {
  const parsed = parseTemporaryBackendInput(input);
  const expiresAt = new Date(Date.now() + parsed.ttlMinutes * 60_000);
  return db.temporaryBackend.create({
    data: {
      name: parsed.name,
      description: parsed.description || null,
      contractJson: parsed.contractJson,
      expiresAt,
    },
  });
}

export async function disableTemporaryBackend(id: string) {
  const existing = await db.temporaryBackend.findUnique({ where: { id } });
  if (!existing) throw new AppError("NOT_FOUND", "Temporary backend not found.", 404);
  if (existing.status !== "ACTIVE") throw new AppError("CONFLICT", "This temporary backend is no longer active.", 409);
  return db.temporaryBackend.update({ where: { id }, data: { status: "DISABLED" } });
}

export async function resolveTemporaryResponse(id: string, method: "GET" | "POST", path: string) {
  enforceRequestLimit(id);
  await expireBackends();
  const backend = await db.temporaryBackend.findUnique({ where: { id } });
  if (!backend || backend.status !== TemporaryBackendStatus.ACTIVE) {
    throw new AppError("NOT_FOUND", "This temporary backend is unavailable or has expired.", 404);
  }
  const endpoint = parseStoredContract(backend.contractJson).endpoints.find((candidate) => candidate.method === method && candidate.path === path);
  if (!endpoint) throw new AppError("NOT_FOUND", "This temporary backend does not expose that endpoint.", 404);
  await db.temporaryBackend.update({ where: { id }, data: { lastAccessedAt: new Date(), requestCount: { increment: 1 } } });
  return { status: endpoint.status, body: endpoint.body, expiresAt: backend.expiresAt };
}
