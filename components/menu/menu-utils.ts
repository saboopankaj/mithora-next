import type { Cart, CartItem, Product } from "./types";
//import type { Product } from "./types";


export const WHATSAPP_NUMBER = "918657427432";
export const CART_KEY = "cart";

export function getNumber(value: unknown): number {
  const n = Number(value);
  return Number.isFinite(n) ? n : 0;
}

export function getDiscount(price: unknown, oldPrice: unknown): number {
  const p = getNumber(price);
  const old = getNumber(oldPrice);
  if (!p || !old || old <= p) return 0;
  return Math.round(((old - p) / old) * 100);
}

export function isFeatured(product: Product): boolean {
  return (
    product.is_featured === 1 ||
    product.is_featured === true
  );
}

export function canOrderFromAvailability(availability?: {
  delivery_type?: string;
  orderable_now?: boolean;
  status?: string;
}): boolean {
  if (!availability) return false;
  return Boolean(
    availability.delivery_type === "SUBSCRIPTION" ||
      availability.orderable_now ||
      availability.status === "OPEN" ||
      availability.status === "NEXT_DAY"
  );
}

export function readCart(): Cart {
  if (typeof window === "undefined") return { items: [] };
  try {
    const raw = localStorage.getItem(CART_KEY);
    if (!raw) return { items: [] };
    const parsed = JSON.parse(raw);
    if (!parsed || !Array.isArray(parsed.items)) return { items: [] };
    return parsed;
  } catch {
    return { items: [] };
  }
}

export function writeCart(cart: Cart) {
  localStorage.setItem(
    CART_KEY,
    JSON.stringify({
      ...cart,
      items: Array.isArray(cart.items) ? cart.items : [],
    })
  );
  window.dispatchEvent(new Event("cart:updated"));
  window.dispatchEvent(new Event("storage"));
}

export function getQuantityForProduct(product: Product, cart: Cart): number {
  return (product.variants || []).reduce((total, variant) => {
    const item = cart.items.find(
      (cartItem) => String(cartItem.variant_id) === String(variant.id)
    );
    return total + (item?.qty || 0);
  }, 0);
}

export function getActiveVariantFromCart(product: Product, cart: Cart) {
  return (product.variants || []).find((variant) =>
    cart.items.some(
      (item) => String(item.variant_id) === String(variant.id) && item.qty > 0
    )
  );
}
