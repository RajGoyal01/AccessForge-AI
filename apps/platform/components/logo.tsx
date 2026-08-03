import Link from "next/link";
import { ShieldCheck } from "lucide-react";

export function Logo() {
  return (
    <Link className="logo" href="/" aria-label="AccessForge AI home">
      <span className="logo-mark" aria-hidden="true"><ShieldCheck size={18} /></span>
      <span className="logo-wordmark">AccessForge <span>AI</span></span>
    </Link>
  );
}
