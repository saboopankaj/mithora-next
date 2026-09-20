import { apiFetch } from "./api";

export const CART_STORAGE_KEY = "mithora_cart";
export const CART_OWNER_KEY = "mithora_cart_owner";
export const USER_PINCODE_KEY = "user_pincode";
export const USER_AREA_KEY = "user_area";
export const CART_PRICE_SNAPSHOT_KEY = "mithora_cart_price_snapshot";

export type LocalCartItem = { variant_id: number | string; qty: number };
export type LocalCart = { items: LocalCartItem[]; coupon_code: string };

export type CartPriceSnapshot = Record<string, number>;

export function loadCartPriceSnapshot(): CartPriceSnapshot {
  if (typeof window === "undefined") return {};
  try {
    const raw = localStorage.getItem(CART_PRICE_SNAPSHOT_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== "object") return {};
    return Object.fromEntries(
      Object.entries(parsed).filter(([, value]) => Number.isFinite(Number(value)))
        .map(([key, value]) => [key, Number(value)])
    );
  } catch {
    return {};
  }
}

export function saveCartPriceSnapshot(snapshot: CartPriceSnapshot) {
  if (typeof window === "undefined") return;
  localStorage.setItem(CART_PRICE_SNAPSHOT_KEY, JSON.stringify(snapshot));
}

const emptyCart = (): LocalCart => ({ items: [], coupon_code: "" });

export function loadCart(): LocalCart {
  if (typeof window === "undefined") return emptyCart();
  try {
    const raw = localStorage.getItem(CART_STORAGE_KEY);
    if (!raw) return emptyCart();
    const parsed = JSON.parse(raw);
    if (!parsed || !Array.isArray(parsed.items)) return emptyCart();
    return {
      items: parsed.items
        .filter((item: unknown): item is LocalCartItem => !!item && typeof item === "object" && "variant_id" in item && "qty" in item && Number((item as LocalCartItem).qty) > 0)
        .map((item: LocalCartItem) => ({ variant_id: item.variant_id, qty: Math.max(1, Math.floor(Number(item.qty))) })),
      coupon_code: typeof parsed.coupon_code === "string" ? parsed.coupon_code : "",
    };
  } catch { return emptyCart(); }
}

export function saveCart(cart: LocalCart) {
  if (typeof window === "undefined") return;
  localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(cart));
  window.dispatchEvent(new CustomEvent("cart:updated"));
}

export function getCartOwner(): string {
  if (typeof window === "undefined") return "guest";
  return localStorage.getItem(CART_OWNER_KEY) || "guest";
}

export function setCartOwner(owner: string | number) {
  if (typeof window === "undefined") return;
  localStorage.setItem(CART_OWNER_KEY, String(owner));
}

export function markGuestCart() { setCartOwner("guest"); }

export function getCartItemCount(cart = loadCart()) {
  return cart.items.reduce((sum, item) => sum + item.qty, 0);
}

export function getPincode() {
  if (typeof window === "undefined") return "";
  return localStorage.getItem(USER_PINCODE_KEY) || "";
}

export function getArea() {
  if (typeof window === "undefined") return "";
  return localStorage.getItem(USER_AREA_KEY) || "";
}

export function setPincode(pin: string, area = "") {
  if (typeof window === "undefined") return;
  localStorage.setItem(USER_PINCODE_KEY, pin);
  if (area) localStorage.setItem(USER_AREA_KEY, area);
  else localStorage.removeItem(USER_AREA_KEY);
  window.dispatchEvent(new CustomEvent("cart:location-updated"));
}

export function clearCart() {
  if (typeof window === "undefined") return;
  localStorage.removeItem(CART_STORAGE_KEY);
  window.dispatchEvent(new CustomEvent("cart:updated"));
}

export function clearGuestCart() {
  if (typeof window === "undefined") return;
  localStorage.removeItem(CART_STORAGE_KEY);
  localStorage.removeItem(CART_OWNER_KEY);
  localStorage.removeItem(USER_PINCODE_KEY);
  localStorage.removeItem(USER_AREA_KEY);
  window.dispatchEvent(new CustomEvent("cart:updated"));
  window.dispatchEvent(new CustomEvent("cart:location-updated"));
}

export function mergeCarts(first: LocalCart, second: LocalCart): LocalCart {
  const items = first.items.map(item => ({ ...item }));
  for (const incoming of second.items) {
    const existing = items.find(item => String(item.variant_id) === String(incoming.variant_id));
    if (existing) existing.qty += Math.max(1, Math.floor(Number(incoming.qty)));
    else items.push({ variant_id: incoming.variant_id, qty: Math.max(1, Math.floor(Number(incoming.qty))) });
  }
  return { items, coupon_code: second.coupon_code || first.coupon_code || "" };
}

export async function loadCartFromServer(): Promise<LocalCart | null> {
  const response = await apiFetch<{ cart?: LocalCart | null }>("/api/cart/load");
  return response.cart || null;
}

export async function syncCart(cart: LocalCart, pincode?: string, address?: unknown) {
  return apiFetch<import("../components/cart/types").CartSyncResponse>("/api/cart/sync", {
    method: "POST",
    body: JSON.stringify({ items: cart.items, coupon_code: cart.coupon_code || "", pincode: pincode || getPincode() || "", ...(address ? { address } : {}) }),
  });
}

export async function saveCartToServer(cart: LocalCart) {
  return apiFetch<{ success?: boolean; ok?: boolean }>("/api/cart/save", {
    method: "POST",
    body: JSON.stringify({ items: cart.items, coupon_code: cart.coupon_code || "" }),
  });
}
