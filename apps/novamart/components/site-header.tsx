import Link from "next/link";

export function SiteHeader() {
  return <header className="site-header"><Link className="brand" href="/">NOVA<span>MART</span></Link><nav aria-label="Primary navigation"><Link href="/products">Products</Link><Link href="/account/sign-in">Account</Link></nav><Link href="/cart" className="cart-icon" data-source-file="components/site-header.tsx" data-source-line="4" data-component-name="SiteHeader"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M3 4h2l2.2 10.2a2 2 0 0 0 2 1.6h7.7a2 2 0 0 0 1.9-1.4L21 7H6"/><circle cx="10" cy="20" r="1"/><circle cx="18" cy="20" r="1"/></svg></Link></header>;
}
