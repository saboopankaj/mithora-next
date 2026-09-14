"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";

import { useAuth } from "@/components/auth/AuthContext";

import {
  clearCart,
  clearGuestCart,
  getArea,
  getPincode,
  getCartItemCount,
  getCartOwner,
  loadCart,
  loadCartFromServer,
  markGuestCart,
  mergeCarts,
  saveCart,
  saveCartToServer,
  setCartOwner,
  syncCart,
  setPincode as persistPincode,
  type LocalCart,
} from "@/lib/cart";

import type { Address } from "./types";
import type {
  CartItem,
  CartSyncResponse,
  ValidatedCart,
} from "./types";

type CartContextValue = {
  cart: LocalCart;
  validatedCart: ValidatedCart | null;

  loading: boolean;
  validating: boolean;

  itemCount: number;
  pincode: string;
  area: string;

  addItem: (variantId: number | string, qty?: number) => void;
  updateQty: (variantId: number | string, qty: number) => void;
  removeItem: (variantId: number | string) => void;

  setCoupon: (code: string) => void;
  removeCoupon: () => void;

  setPincode: (pin: string, area?: string) => void;

  validate: (
    address?: Address | null
  ) => Promise<CartSyncResponse>;

  persist: () => Promise<void>;

  clear: () => void;
};

const CartContext =
  createContext<CartContextValue | null>(null);

export default function CartProvider({
  children,
}: {
  children: ReactNode;
}) {
  const { user, isAuthenticated } = useAuth();

  const [cart, setCart] = useState<LocalCart>(
    () => loadCart()
  );

  const [validatedCart, setValidatedCart] =
    useState<ValidatedCart | null>(null);

  /*
   * loading = account/cart loading
   *
   * validating = background cart price/delivery validation
   */
  const [loading, setLoading] = useState(false);
  const [validating, setValidating] = useState(false);

  const [pincode, setPin] = useState("");
  const [area, setArea] = useState("");

  const previousAuthRef =
    useRef<boolean | null>(null);

  const ownerRef = useRef<string>(
    getCartOwner()
  );

  const syncingAuthRef =
    useRef(false);

  const hydratedRef =
    useRef(false);

  const saveQueueRef =
    useRef<Promise<void>>(Promise.resolve());

  /*
   * Hydrate cart/location from localStorage
   */
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

      /*
       * Location changed, so the previous delivery
       * calculation is no longer valid.
       */
      setValidatedCart(null);
    };

    window.addEventListener(
      "cart:updated",
      onCart
    );

    window.addEventListener(
      "cart:location-updated",
      onLocation
    );

    hydratedRef.current = true;

    return () => {
      window.removeEventListener(
        "cart:updated",
        onCart
      );

      window.removeEventListener(
        "cart:location-updated",
        onLocation
      );
    };
  }, []);

  /*
   * Sync cart when authentication changes
   */
  useEffect(() => {
    if (!hydratedRef.current) return;

    const userId =
      user?.id != null
        ? String(user.id)
        : null;

    const wasAuthenticated =
      previousAuthRef.current;

    previousAuthRef.current =
      isAuthenticated;

    /*
     * Logged out
     */
    if (!isAuthenticated || !userId) {
      if (wasAuthenticated === true) {
        clearGuestCart();
        markGuestCart();

        ownerRef.current = "guest";

        setCart({
          items: [],
          coupon_code: "",
        });

        setValidatedCart(null);

        setPin("");
        setArea("");
      }

      return;
    }

    if (syncingAuthRef.current) return;

    syncingAuthRef.current = true;

    void (async () => {
      try {
        const local = loadCart();

        const owner = getCartOwner();

        const server =
          await loadCartFromServer();

        let next: LocalCart;

        if (owner === "guest") {
          /*
           * Guest cart + logged-in user's
           * server cart.
           */
          next = mergeCarts(
            server || {
              items: [],
              coupon_code: "",
            },
            local
          );
        } else if (owner === userId) {
          /*
           * Same logged-in user:
           * backend is the persistent source
           * of truth.
           */
          next =
            server || {
              items: [],
              coupon_code: "",
            };
        } else {
          /*
           * Different user:
           * never merge another user's cart.
           */
          next =
            server || {
              items: [],
              coupon_code: "",
            };
        }

        saveCart(next);

        setCartOwner(userId);

        ownerRef.current = userId;

        setCart(next);

        setValidatedCart(null);

        /*
         * Save merged guest cart or initialize
         * missing server cart.
         */
        if (owner === "guest" || !server) {
          await saveCartToServer(next);
        }
      } catch (error) {
        console.error(
          "Cart account sync failed",
          error
        );

        /*
         * Do not silently expose a guest cart
         * as another user's persistent cart.
         */
        if (getCartOwner() !== userId) {
          saveCart({
            items: [],
            coupon_code: "",
          });

          setCart({
            items: [],
            coupon_code: "",
          });

          setCartOwner(userId);

          ownerRef.current = userId;
        }
      } finally {
        syncingAuthRef.current = false;
      }
    })();
  }, [isAuthenticated, user?.id]);

  /*
   * Cart mutation
   *
   * IMPORTANT:
   * We intentionally DO NOT clear validatedCart here.
   *
   * This allows + / − to update the local cart
   * immediately without making the entire cart
   * disappear while server validation happens.
   */
  const mutate = useCallback(
    (next: LocalCart) => {
      setCart(next);

      saveCart(next);

      if (
        isAuthenticated &&
        user?.id != null
      ) {
        setCartOwner(user.id);

        ownerRef.current =
          String(user.id);

        saveQueueRef.current =
          saveQueueRef.current
            .then(() =>
              saveCartToServer(next)
            )
            .then(() => undefined)
            .catch((error) =>
              console.error(
                "Cart save failed",
                error
              )
            );
      }
    },
    [isAuthenticated, user?.id]
  );

  /*
   * Add item
   */
  const addItem = useCallback(
    (
      variantId: number | string,
      qty = 1
    ) => {
      const next = loadCart();

      const existing =
        next.items.find(
          (item) =>
            String(item.variant_id) ===
            String(variantId)
        );

      if (existing) {
        existing.qty += Math.max(
          1,
          Math.floor(qty)
        );
      } else {
        next.items.push({
          variant_id: variantId,
          qty: Math.max(
            1,
            Math.floor(qty)
          ),
        });
      }

      mutate(next);
    },
    [mutate]
  );

  /*
   * Update quantity
   */
  const updateQty = useCallback(
    (
      variantId: number | string,
      qty: number
    ) => {
      const next = loadCart();

      const item =
        next.items.find(
          (i) =>
            String(i.variant_id) ===
            String(variantId)
        );

      if (!item) return;

      if (qty <= 0) {
        next.items =
          next.items.filter(
            (i) =>
              String(i.variant_id) !==
              String(variantId)
          );
      } else {
        item.qty = Math.floor(qty);
      }

      mutate(next);
    },
    [mutate]
  );

  /*
   * Remove item
   */
  const removeItem = useCallback(
    (variantId: number | string) => {
      updateQty(variantId, 0);
    },
    [updateQty]
  );

  /*
   * Coupon
   */
  const setCoupon = useCallback(
    (code: string) => {
      mutate({
        ...loadCart(),
        coupon_code:
          code.trim().toUpperCase(),
      });
    },
    [mutate]
  );

  const removeCoupon = useCallback(() => {
    mutate({
      ...loadCart(),
      coupon_code: "",
    });
  }, [mutate]);

  /*
   * Pincode/location
   */
  const setPincode = useCallback(
    (
      pin: string,
      nextArea = ""
    ) => {
      persistPincode(
        pin,
        nextArea
      );

      setPin(pin);
      setArea(nextArea);

      /*
       * Delivery calculation must be
       * recalculated for the new location.
       */
      setValidatedCart(null);
    },
    []
  );

  /*
   * Validate cart
   *
   * This runs in the background when quantity,
   * coupon or address changes.
   */
  const validate = useCallback(
    async (
      address?: Address | null
    ) => {
      const current = loadCart();

      const currentPin =
        getPincode();

      if (!current.items.length) {
        setValidatedCart(null);

        return {
          success: true,
          validatedCart: undefined,
        };
      }

      /*
       * No valid pincode yet.
       *
       * We still ask the server for item prices
       * and subtotal, but explicitly remove all
       * delivery-related information from this
       * preview.
       */
      if (
        !/^\d{6}$/.test(
          currentPin
        )
      ) {
        setValidating(true);

        try {
          const response =
            await syncCart(
              current,
              "",
              undefined
            );

          if (response.validatedCart) {
            setValidatedCart({
              ...response.validatedCart,

              shipping: 0,

              is_free_delivery:
                false,

              free_delivery_min: 0,

              free_delivery_remaining: 0,

              is_external_zone:
                false,

              distance_charge: 0,
            });
          } else {
            setValidatedCart(null);
          }

          return response;
        } finally {
          setValidating(false);
        }
      }

      /*
       * Valid pincode/address:
       * perform the real delivery calculation.
       */
      setValidating(true);

      try {
        const response =
          await syncCart(
            current,
            currentPin,
            address || undefined
          );

        if (response.validatedCart) {
          setValidatedCart(
            response.validatedCart
          );
        } else {
          setValidatedCart(null);
        }

        return response;
      } finally {
        setValidating(false);
      }
    },
    []
  );

  /*
   * Persist cart
   */
  const persist = useCallback(
    async () => {
      if (!isAuthenticated) return;

      await saveCartToServer(
        loadCart()
      );
    },
    [isAuthenticated]
  );

  /*
   * Clear cart
   */
  const clear = useCallback(() => {
    clearCart();

    setCart({
      items: [],
      coupon_code: "",
    });

    setValidatedCart(null);
  }, []);

  /*
   * Context value
   */
  const value = useMemo(
    () => ({
      cart,
      validatedCart,

      loading,
      validating,

      itemCount:
        getCartItemCount(cart),

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
      validating,

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
    ]
  );

  return (
    <CartContext.Provider
      value={value}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const context =
    useContext(CartContext);

  if (!context) {
    throw new Error(
      "useCart must be used inside CartProvider"
    );
  }

  return context;
}

export type { CartItem };