"use client";
import { useState } from "react";
import type { Product } from "@/lib/products";

export function QuickView({ product }: { product: Product }) {
  const [open, setOpen] = useState(false);
  return <><div className="quick-view-trigger" role="button" onClick={() => setOpen(true)} data-source-file="components/quick-view.tsx" data-source-line="7" data-component-name="QuickView">Quick view</div>{open ? <div className="modal-backdrop" onClick={() => setOpen(false)}><section className="quick-modal" role="dialog" aria-modal="true" aria-labelledby="quick-title" onClick={(event) => event.stopPropagation()} data-source-file="components/quick-view.tsx" data-source-line="7" data-component-name="QuickViewModal"><button className="modal-close" onClick={() => setOpen(false)}>×<span className="sr-only">Close</span></button><p className="eyebrow">Quick view</p><h2 id="quick-title">{product.name}</h2><p>{product.description}</p><strong>${product.price}.00</strong></section></div> : null}</>;
}
