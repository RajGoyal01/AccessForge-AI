import Link from "next/link"; import { StoreShell } from "@/components/shell";
export default function Success(){return <StoreShell><div className="signin"><p className="eyebrow">Order confirmed</p><h1>Thank you.</h1><p>This is a harmless demo order. No payment or personal information was processed.</p><Link href="/">Return home</Link></div></StoreShell>}
