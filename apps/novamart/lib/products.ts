export interface Product { id: string; name: string; category: string; price: number; description: string; color: string; accent: string }
export const products: Product[] = [
  { id: "halo-lamp", name: "Halo Ambient Lamp", category: "Lighting", price: 129, description: "A sculptural desk lamp with warm, adjustable illumination.", color: "#f3c98b", accent: "#8a5b2b" },
  { id: "orbit-speaker", name: "Orbit Mini Speaker", category: "Audio", price: 89, description: "Room-filling sound in a compact recycled-aluminium enclosure.", color: "#8fb7c9", accent: "#244c5e" },
  { id: "arc-keyboard", name: "Arc Mechanical Keyboard", category: "Workspace", price: 159, description: "Low-profile tactile switches and a solid precision-milled frame.", color: "#b9a7d8", accent: "#574377" },
  { id: "drift-carafe", name: "Drift Glass Carafe", category: "Kitchen", price: 64, description: "Hand-finished borosilicate glass for an elegant daily ritual.", color: "#91c6bd", accent: "#285f57" },
];
export const getProduct = (id: string) => products.find((product) => product.id === id);
