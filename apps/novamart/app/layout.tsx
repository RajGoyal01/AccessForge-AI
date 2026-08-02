import type { Metadata } from "next";
import "./globals.css";
export const metadata: Metadata = { title: "NovaMart Demo", description: "Bundled accessibility repair target for AccessForge AI." };
export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) { return <html lang="en"><body>{children}</body></html>; }
