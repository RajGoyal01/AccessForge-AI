import type { Product } from "@/lib/products";

export function ProductVisual({ product, compact = false, intentionalMissingAlt = false }: { product: Product; compact?: boolean; intentionalMissingAlt?: boolean }) {
  const label = intentionalMissingAlt ? "" : `${product.name} product illustration`;
  return <div className={`product-visual ${compact ? "compact" : ""}`} style={{ "--product-color": product.color, "--product-accent": product.accent } as React.CSSProperties}>
    {/* Intentional WCAG fixture: empty alt on a meaningful product image. */}
    {/* eslint-disable-next-line @next/next/no-img-element */}
    <img src={`/product-placeholder.svg?${product.id}`} alt={label} data-source-file={intentionalMissingAlt ? "components/product-visual.tsx" : undefined} data-source-line={intentionalMissingAlt ? "6" : undefined} data-component-name={intentionalMissingAlt ? "ProductVisual" : undefined} />
  </div>;
}
