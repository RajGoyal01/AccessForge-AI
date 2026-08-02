import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = { title: "AccessForge AI", description: "From accessibility issues to verified code fixes." };

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="en"><body>{children}</body></html>;
}
