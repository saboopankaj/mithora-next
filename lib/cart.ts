import { apiFetch } from "./api";

export const CART_STORAGE_KEY = "mithora_cart";
export const USER_PINCODE_KEY = "user_pincode";
export const USER_AREA_KEY = "user_area";

export type LocalCartItem = {
  variant_id: number | string;
  qty: number;
};

export type LocalCart = {
  items: LocalCartItem[];
  coupon_code: string;
};

const emptyCart = (): LocalCart => ({
  items: [],
  coupon_code: "",
});

export function loadCart(): LocalCart {
  if (typeof window === "undefined") return emptyCart();

  try {
    const raw = localStorage.getItem(CART_STORAGE_KEY);
    if (!raw) return emptyCart();

    const parsed = JSON.parse(raw);

    if (!parsed || !Array.isArray(parsed.items)) {
      return emptyCart();
    }

    return {
      items: parsed.items
        .filter(
          (item: unknown): item is LocalCartItem =>
            !!item &&
            typeof item === "object" &&
            "variant_id" in item &&
            "qty" in item &&
            Number((item as LocalCartItem).qty) > 0,
        )
.map((item: LocalCartItem) => ({
          variant_id: item.variant_id,
          qty: Math.max(1, Number(item.qty)),
        })),
      coupon_code:
        typeof parsed.coupon_code === "string" ? parsed.coupon_code : "",
    };
  } catch {
    return emptyCart();
  }
}

export function saveCart(cart: LocalCart) {
  if (typeof window === "undefined") return;
  localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(cart));
  window.dispatchEvent(new CustomEvent("cart:updated"));
}

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

export async function syncCart(
  cart: LocalCart,
  pincode?: string,
  address?: unknown,
) {
  return apiFetch<import("../components/cart/types").CartSyncResponse>(
    "/api/cart/sync",
    {
      method: "POST",
      body: JSON.stringify({
        items: cart.items,
        coupon_code: cart.coupon_code || "",
        pincode: pincode || getPincode() || "",
        ...(address ? { address } : {}),
      }),
    },
  );
}

export async function saveCartToServer(cart: LocalCart) {
  return apiFetch<{ success?: boolean }>("/api/cart/save", {
    method: "POST",
    body: JSON.stringify(cart),
  });
}
