import { lookup } from "node:dns/promises";
import { isIP } from "node:net";
import { AppError } from "@/lib/errors";

const MAX_URL_LENGTH = 2_048;
const PRIVATE_HOST_SUFFIXES = [".localhost", ".local", ".internal", ".home", ".lan"];

export type HostResolver = (hostname: string) => Promise<readonly { address: string }[]>;

const defaultResolver: HostResolver = (hostname) =>
  lookup(hostname, { all: true, verbatim: true });

function normalizeIpLiteral(address: string) {
  return address.replace(/^\[|\]$/g, "").replace(/^::ffff:/i, "").toLowerCase();
}

/** Returns true for non-public address ranges that a scan must never contact. */
export function isPrivateAddress(address: string) {
  const normalized = normalizeIpLiteral(address);

  if (isIP(normalized) === 4) {
    const [a = 0, b = 0, c = 0] = normalized.split(".").map(Number);
    return (
      a === 0 ||
      a === 10 ||
      a === 127 ||
      (a === 100 && b >= 64 && b <= 127) ||
      (a === 169 && b === 254) ||
      (a === 172 && b >= 16 && b <= 31) ||
      (a === 192 && b === 0 && c === 0) ||
      (a === 192 && b === 0 && c === 2) ||
      (a === 192 && b === 168) ||
      (a === 198 && (b === 18 || b === 19)) ||
      (a === 198 && b === 51 && c === 100) ||
      (a === 203 && b === 0 && c === 113) ||
      a >= 224
    );
  }

  if (isIP(normalized) === 6) {
    const first = normalized.split(":", 1)[0] ?? "";
    return (
      normalized === "::" ||
      normalized === "::1" ||
      /^f[cd][0-9a-f]{2}$/i.test(first) ||
      /^fe[89ab][0-9a-f]$/i.test(first) ||
      /^fe[c-f][0-9a-f]$/i.test(first) ||
      normalized.startsWith("2001:db8:") ||
      first === "ff"
    );
  }

  return false;
}

/** Accepts friendly host input while keeping URL validation strict and server-side. */
export function normalizeTargetUrlInput(rawUrl: string) {
  const value = rawUrl.trim();
  if (!value) throw new AppError("VALIDATION_ERROR", "Enter a website address.");
  if (value.length > MAX_URL_LENGTH) {
    throw new AppError("VALIDATION_ERROR", "The website address is too long.");
  }

  if (value.startsWith("//")) return `https:${value}`;
  if (!/^[a-z][a-z\d+.-]*:/i.test(value)) return `https://${value}`;
  return value;
}

function normalizedHostname(url: URL) {
  return url.hostname.replace(/^\[|\]$/g, "").replace(/\.$/, "").toLowerCase();
}

export async function validateTargetUrl(
  rawUrl: string,
  bundledDemo: boolean,
  options: { resolver?: HostResolver } = {},
) {
  let url: URL;
  try {
    url = new URL(normalizeTargetUrlInput(rawUrl));
  } catch (error) {
    if (error instanceof AppError) throw error;
    throw new AppError("VALIDATION_ERROR", "Enter a valid website address.");
  }

  if (!['http:', 'https:'].includes(url.protocol)) {
    throw new AppError("VALIDATION_ERROR", "Only HTTP and HTTPS websites are supported.");
  }
  if (url.username || url.password) {
    throw new AppError("VALIDATION_ERROR", "Website addresses containing credentials are not supported.");
  }

  url.hash = "";
  const hostname = normalizedHostname(url);

  if (bundledDemo) {
    if (url.protocol !== "http:" || hostname !== "localhost" || url.port !== "3001") {
      throw new AppError("FORBIDDEN", "Bundled demo scans are restricted to NovaMart.", 403);
    }
    return url;
  }

  if (
    hostname === "localhost" ||
    PRIVATE_HOST_SUFFIXES.some((suffix) => hostname.endsWith(suffix)) ||
    isPrivateAddress(hostname)
  ) {
    throw new AppError("FORBIDDEN", "Private network targets are not allowed.", 403);
  }

  let results: readonly { address: string }[];
  try {
    results = await (options.resolver ?? defaultResolver)(hostname);
  } catch {
    throw new AppError(
      "TARGET_UNAVAILABLE",
      "The website address could not be resolved. Check the address and try again.",
      422,
      { reason: "DNS_LOOKUP_FAILED", retryable: true },
    );
  }

  if (results.length === 0) {
    throw new AppError(
      "TARGET_UNAVAILABLE",
      "The website address could not be resolved. Check the address and try again.",
      422,
      { reason: "DNS_LOOKUP_FAILED", retryable: true },
    );
  }
  if (results.some(({ address }) => isPrivateAddress(address))) {
    throw new AppError("FORBIDDEN", "Private network targets are not allowed.", 403);
  }

  return url;
}
