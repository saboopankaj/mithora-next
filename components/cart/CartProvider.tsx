"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

import {
  clearCart,
  getArea,
  getPincode,
  getCartItemCount,
  loadCart,
  saveCart,
  saveCartToServer,
  syncCart,
  setPincode as persistPincode,
  type LocalCart,
} from "@/lib/cart";

import type { Address } from "@/components/checkout/types";
import type {
  CartItem,
  CartSyncResponse,
  ValidatedCart,
} from "./types";

type CartContextValue = {
  cart: LocalCart;
  validatedCart: ValidatedCart | null;
  loading: boolean;
  itemCount: number;
  pincode: string;
  area: string;
  addItem: (variantId: number | string, qty?: number) => void;
  updateQty: (variantId: number | string, qty: number) => void;
  removeItem: (variantId: number | string) => void;
  setCoupon: (code: string) => void;
  removeCoupon: () => void;
  setPincode: (pin: string, area?: string) => void;
  validate: (address?: Address | null) => Promise<CartSyncResponse>;
  persist: () => Promise<void>;
  clear: () => void;
};

const CartContext = createContext<CartContextValue | null>(null);

export default function CartProvider({ children }: { children: ReactNode }) {
  const [cart, setCart] = useState<LocalCart>(() => loadCart());
  const [validatedCart, setValidatedCart] =
    useState<ValidatedCart | null>(null);
  const [loading, setLoading] = useState(false);
  const [pincode, setPin] = useState("");
  const [area, setArea] = useState("");

  useEffect(() => {
    setCart(loadCart());
    setPin(getPincode());
    setArea(getArea());

    const onCart = () => {
      setCart(loadCart());
    };
    const onLocation = () => {
      setPin(getPincode());
      setArea(getArea());
      setValidatedCart(null);
    };

    window.addEventListener("cart:updated", onCart);
    window.addEventListener("cart:location-updated", onLocation);

    return () => {
      window.removeEventListener("cart:updated", onCart);
      window.removeEventListener("cart:location-updated", onLocation);
    };
  }, []);

  const mutate = useCallback((next: LocalCart) => {
    setCart(next);
    saveCart(next);
    setValidatedCart(null);
  }, []);

  const addItem = useCallback(
    (variantId: number | string, qty = 1) => {
      const next = loadCart();
      const existing = next.items.find(
        (item) => String(item.variant_id) === String(variantId),
      );

      if (existing) {
        existing.qty += Math.max(1, qty);
      } else {
        next.items.push({
          variant_id: variantId,
          qty: Math.max(1, qty),
        });
      }

      mutate(next);
    },
    [mutate],
  );

  const updateQty = useCallback(
    (variantId: number | string, qty: number) => {
      const next = loadCart();
      const item = next.items.find(
        (entry) => String(entry.variant_id) === String(variantId),
      );

      if (!item) return;

      if (qty <= 0) {
        next.items = next.items.filter(
          (entry) => String(entry.variant_id) !== String(variantId),
        );
      } else {
        item.qty = qty;
      }

      mutate(next);
    },
    [mutate],
  );

  const removeItem = useCallback(
    (variantId: number | string) => updateQty(variantId, 0),
    [updateQty],
  );

  const setCoupon = useCallback(
    (code: string) => {
      mutate({
        ...loadCart(),
        coupon_code: code.trim().toUpperCase(),
      });
    },
    [mutate],
  );

  const removeCoupon = useCallback(() => {
    mutate({
      ...loadCart(),
      coupon_code: "",
    });
  }, [mutate]);

  const setPincode = useCallback((pin: string, nextArea = "") => {
    persistPincode(pin, nextArea);
    setPin(pin);
    setArea(nextArea);
    setValidatedCart(null);
  }, []);

  const validate = useCallback(
    async (address?: Address | null) => {
      const current = loadCart();

if (!current.items.length) {
  setValidatedCart(null);
  return { success: true };
}

      setLoading(true);
      try {
        const response = await syncCart(current, getPincode(), address || undefined);
        if (response.validatedCart) {
          setValidatedCart(response.validatedCart);
        }
        return response;
      } finally {
        setLoading(false);
      }
    },
    [],
  );

  const persist = useCallback(async () => {
    await saveCartToServer(loadCart());
  }, []);

  const clear = useCallback(() => {
    clearCart();
    setCart({ items: [], coupon_code: "" });
    setValidatedCart(null);
  }, []);

  const value = useMemo<CartContextValue>(
    () => ({
      cart,
      validatedCart,
      loading,
      itemCount: getCartItemCount(cart),
      pincode,
      area,
      addItem,
      updateQty,
      removeItem,
      setCoupon,
      removeCoupon,
      setPincode,
      validate,
      persist,
      clear,
    }),
    [
      cart,
      validatedCart,
      loading,
      pincode,
      area,
      addItem,
      updateQty,
      removeItem,
      setCoupon,
      removeCoupon,
      setPincode,
      validate,
      persist,
      clear,
    ],
  );

  return (
    <CartContext.Provider value={value}>
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error("useCart must be used inside CartProvider");
  }
  return context;
}

export type { CartItem };
