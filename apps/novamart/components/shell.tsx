import { SiteHeader } from "./site-header";
export function StoreShell({ children }: { children: React.ReactNode }) { return <><SiteHeader /><main>{children}</main><footer><strong>NOVAMART</strong><p>Thoughtful objects. Simple living.</p><span>© 2026 NovaMart demo</span></footer></>; }
