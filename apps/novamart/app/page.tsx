import Link from "next/link";
import { StoreShell } from "@/components/shell";
import { ProductCard } from "@/components/product-card";
import { Newsletter } from "@/components/newsletter";
import { products } from "@/lib/products";

export default function Home() { return <StoreShell><section className="hero"><div className="hero-copy"><p className="eyebrow">New collection · 2026</p><h1>Shape your everyday.</h1><p>Considered objects for calmer homes, focused work and everyday rituals.</p><Link className="primary-link" href="/products">Explore the collection</Link></div><div className="hero-art" aria-label="Abstract green sculptural object"><div className="orb" /></div></section><section className="section" aria-labelledby="featured"><div className="section-head"><div><p className="eyebrow">Editor’s selection</p><h2 id="featured">Objects with purpose</h2></div><Link href="/products">View all products →</Link></div><div className="product-grid">{products.map((product,index)=><ProductCard key={product.id} product={product} first={index===0}/>)}</div></section><Newsletter /></StoreShell>; }
