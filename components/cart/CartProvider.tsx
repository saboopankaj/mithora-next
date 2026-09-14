"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { useAuth } from "@/components/auth/AuthContext";
import { clearCart, clearGuestCart, getArea, getPincode, getCartItemCount, getCartOwner, loadCart, loadCartFromServer, markGuestCart, mergeCarts, saveCart, saveCartToServer, setCartOwner, syncCart, setPincode as persistPincode, type LocalCart } from "@/lib/cart";
import type { Address } from "./types";
import type { CartItem, CartSyncResponse, ValidatedCart } from "./types";

type CartContextValue = {
  cart: LocalCart; validatedCart: ValidatedCart | null; loading: boolean; itemCount: number; pincode: string; area: string;
  addItem: (variantId: number | string, qty?: number) => void; updateQty: (variantId: number | string, qty: number) => void; removeItem: (variantId: number | string) => void;
  setCoupon: (code: string) => void; removeCoupon: () => void; setPincode: (pin: string, area?: string) => void;
  validate: (address?: Address | null) => Promise<CartSyncResponse>; persist: () => Promise<void>; clear: () => void;
};

const CartContext = createContext<CartContextValue | null>(null);

export default function CartProvider({ children }: { children: ReactNode }) {
  const { user, isAuthenticated } = useAuth();
  const [cart, setCart] = useState<LocalCart>(() => loadCart());
  const [validatedCart, setValidatedCart] = useState<ValidatedCart | null>(null);
  const [loading, setLoading] = useState(false);
  const [pincode, setPin] = useState("");
  const [area, setArea] = useState("");
  const previousAuthRef = useRef<boolean | null>(null);
  const ownerRef = useRef<string>(getCartOwner());
  const syncingAuthRef = useRef(false);
  const hydratedRef = useRef(false);
  const saveQueueRef = useRef<Promise<void>>(Promise.resolve());

  useEffect(() => {
    setCart(loadCart()); setPin(getPincode()); setArea(getArea());
    const onCart = () => setCart(loadCart());
    const onLocation = () => { setPin(getPincode()); setArea(getArea()); setValidatedCart(null); };
    window.addEventListener("cart:updated", onCart); window.addEventListener("cart:location-updated", onLocation);
    hydratedRef.current = true;
    return () => { window.removeEventListener("cart:updated", onCart); window.removeEventListener("cart:location-updated", onLocation); };
  }, []);

  useEffect(() => {
    if (!hydratedRef.current) return;
    const userId = user?.id != null ? String(user.id) : null;
    const wasAuthenticated = previousAuthRef.current;
    previousAuthRef.current = isAuthenticated;

    if (!isAuthenticated || !userId) {
      if (wasAuthenticated === true) {
        clearGuestCart();
        markGuestCart();
        ownerRef.current = "guest";
        setCart({ items: [], coupon_code: "" });
        setValidatedCart(null); setPin(""); setArea("");
      }
      return;
    }

    if (syncingAuthRef.current) return;
    syncingAuthRef.current = true;

    void (async () => {
      try {
        const local = loadCart();
        const owner = getCartOwner();
        const server = await loadCartFromServer();
        let next: LocalCart;

        if (owner === "guest") {
          next = mergeCarts(server || { items: [], coupon_code: "" }, local);
        } else if (owner === userId) {
          // Same logged-in user: backend is the persistent source of truth.
          next = server || { items: [], coupon_code: "" };
        } else {
          // Different user: never merge another user's cart into this one.
          next = server || { items: [], coupon_code: "" };
        }

        saveCart(next);
        setCartOwner(userId); ownerRef.current = userId;
        setCart(next); setValidatedCart(null);
        if (owner === "guest" || !server) await saveCartToServer(next);
      } catch (error) {
        console.error("Cart account sync failed", error);
        // On a logged-in account, do not silently expose a guest cart as that user's persistent cart.
        if (getCartOwner() !== userId) {
          saveCart({ items: [], coupon_code: "" });
          setCart({ items: [], coupon_code: "" });
          setCartOwner(userId); ownerRef.current = userId;
        }
      } finally { syncingAuthRef.current = false; }
    })();
  }, [isAuthenticated, user?.id]);

  const mutate = useCallback((next: LocalCart) => {
    setCart(next); saveCart(next); setValidatedCart(null);
    if (isAuthenticated && user?.id != null) {
      setCartOwner(user.id); ownerRef.current = String(user.id);
      saveQueueRef.current = saveQueueRef.current
        .then(() => saveCartToServer(next))
        .then(() => undefined)
        .catch(error => console.error("Cart save failed", error));
    }
  }, [isAuthenticated, user?.id]);

  const addItem = useCallback((variantId: number | string, qty = 1) => {
    const next = loadCart(); const existing = next.items.find(i => String(i.variant_id) === String(variantId));
    if (existing) existing.qty += Math.max(1, Math.floor(qty)); else next.items.push({ variant_id: variantId, qty: Math.max(1, Math.floor(qty)) });
    mutate(next);
  }, [mutate]);

  const updateQty = useCallback((variantId: number | string, qty: number) => {
    const next = loadCart(); const item = next.items.find(i => String(i.variant_id) === String(variantId)); if (!item) return;
    if (qty <= 0) next.items = next.items.filter(i => String(i.variant_id) !== String(variantId)); else item.qty = Math.floor(qty);
    mutate(next);
  }, [mutate]);
  const removeItem = useCallback((variantId: number | string) => updateQty(variantId, 0), [updateQty]);
  const setCoupon = useCallback((code: string) => mutate({ ...loadCart(), coupon_code: code.trim().toUpperCase() }), [mutate]);
  const removeCoupon = useCallback(() => mutate({ ...loadCart(), coupon_code: "" }), [mutate]);
  const setPincode = useCallback((pin: string, nextArea = "") => { persistPincode(pin, nextArea); setPin(pin); setArea(nextArea); setValidatedCart(null); }, []);

  const validate = useCallback(async (address?: Address | null) => {
    const current = loadCart(); const currentPin = getPincode();
    if (!current.items.length) { setValidatedCart(null); return { success: true, validatedCart: undefined }; }
    if (!/^\d{6}$/.test(currentPin)) { setValidatedCart(null); return { success: false, error: "Please enter or detect your delivery pincode first." }; }
    setLoading(true);
    try { const response = await syncCart(current, currentPin, address || undefined); if (response.validatedCart) setValidatedCart(response.validatedCart); else setValidatedCart(null); return response; }
    finally { setLoading(false); }
  }, []);

  const persist = useCallback(async () => { if (!isAuthenticated) return; await saveCartToServer(loadCart()); }, [isAuthenticated]);
  const clear = useCallback(() => { clearCart(); setCart({ items: [], coupon_code: "" }); setValidatedCart(null); }, []);

  const value = useMemo(() => ({ cart, validatedCart, loading, itemCount: getCartItemCount(cart), pincode, area, addItem, updateQty, removeItem, setCoupon, removeCoupon, setPincode, validate, persist, clear }), [cart, validatedCart, loading, pincode, area, addItem, updateQty, removeItem, setCoupon, removeCoupon, setPincode, validate, persist, clear]);
  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() { const context = useContext(CartContext); if (!context) throw new Error("useCart must be used inside CartProvider"); return context; }
export type { CartItem };
