import { lookup } from "node:dns/promises";
import { isIP } from "node:net";
import { AppError } from "@/lib/errors";

function isPrivateAddress(address: string) {
  const normalized = address.replace(/^::ffff:/, "");
  if (normalized === "::1" || normalized === "0.0.0.0") return true;
  if (isIP(normalized) === 4) {
    const [a = 0, b = 0] = normalized.split(".").map(Number);
    return a === 10 || a === 127 || a === 0 || (a === 169 && b === 254) || (a === 172 && b >= 16 && b <= 31) || (a === 192 && b === 168);
  }
  return normalized.startsWith("fc") || normalized.startsWith("fd") || normalized.startsWith("fe80:");
}

export async function validateTargetUrl(rawUrl: string, bundledDemo: boolean) {
  let url: URL;
  try { url = new URL(rawUrl); } catch { throw new AppError("VALIDATION_ERROR", "Enter a valid website URL."); }
  if (!['http:', 'https:'].includes(url.protocol)) throw new AppError("VALIDATION_ERROR", "Only HTTP and HTTPS websites are supported.");
  url.username = ""; url.password = ""; url.hash = "";
  if (bundledDemo) {
    if (!(url.hostname === "localhost" && url.port === "3001")) throw new AppError("FORBIDDEN", "Bundled demo scans are restricted to NovaMart.", 403);
    return url;
  }
  if (url.hostname === "localhost" || url.hostname.endsWith(".local")) throw new AppError("FORBIDDEN", "Private network targets are not allowed.", 403);
  const results = await lookup(url.hostname, { all: true, verbatim: true });
  if (results.length === 0 || results.some(({ address }) => isPrivateAddress(address))) throw new AppError("FORBIDDEN", "Private network targets are not allowed.", 403);
  return url;
}
