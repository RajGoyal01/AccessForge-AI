import Link from "next/link";
import type { Product } from "@/lib/products";
import { ProductVisual } from "./product-visual";
import { QuickView } from "./quick-view";

export function ProductCard({ product, first = false }: { product: Product; first?: boolean }) {
  return <article className="product-card"><div className="visual-wrap"><ProductVisual product={product} compact intentionalMissingAlt={first} /><QuickView product={product} /></div><p className="product-category">{product.category}</p><h3><Link href={`/products/${product.id}`}>{product.name}</Link></h3><div className="product-row"><span>${product.price}.00</span><button className="secondary-action" data-source-file={first ? "components/product-card.tsx" : undefined} data-source-line={first ? "7" : undefined} data-component-name={first ? "ProductCard" : undefined}>Save</button></div></article>;
}
