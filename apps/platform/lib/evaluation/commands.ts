import { execFile } from "node:child_process";
import path from "node:path";
import { promisify } from "node:util";

const run = promisify(execFile);
const workspaceRoot = process.cwd().endsWith("platform") ? path.resolve(process.cwd(), "../..") : process.cwd();

export async function runPredefinedCheck(check: "typecheck" | "test") {
  const npmArguments = ["run", check, "-w", "@accessforge/novamart"];
  const executable = process.platform === "win32" ? (process.env.ComSpec ?? "C:\\Windows\\System32\\cmd.exe") : "npm";
  const args = process.platform === "win32" ? ["/d", "/s", "/c", ["npm.cmd", ...npmArguments].join(" ")] : npmArguments;
  try {
    const result = await run(executable, args, { cwd: workspaceRoot, timeout: 60_000, maxBuffer: 200_000, windowsHide: true });
    return { passed: true, output: (result.stdout + result.stderr).slice(-4000) };
  } catch (error) {
    return { passed: false, output: error instanceof Error ? error.message.slice(-4000) : "Validation command failed." };
  }
}
