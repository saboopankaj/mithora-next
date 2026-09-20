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
  loadCartPriceSnapshot,
  saveCartPriceSnapshot,
  type LocalCart,
} from "@/lib/cart";

import type { Address } from "./types";
import type {
  CartItem,
  CartSyncResponse,
  ValidatedCart,
  CartValidationNotice,
} from "./types";

type CartContextValue = {
  cart: LocalCart;
  validatedCart: ValidatedCart | null;
  validationNotice: CartValidationNotice | null;
  dismissValidationNotice: () => void;

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
  const validatedCartRef = useRef<ValidatedCart | null>(null);

  const [validationNotice, setValidationNotice] =
    useState<CartValidationNotice | null>(null);

  const acknowledgedChangesRef = useRef<Set<string>>(new Set());

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
      validatedCartRef.current = null;
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

        validatedCartRef.current = null;
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

        validatedCartRef.current = null;
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
      validatedCartRef.current = null;
    setValidatedCart(null);
    },
    []
  );

  const normalizeValidationResponse = useCallback(
    (response: CartSyncResponse, current: LocalCart): CartSyncResponse => {
      if (!response.validatedCart) return response;

      const previousItems = validatedCartRef.current?.items || [];
      const items = current.items.map((localItem) => {
        const serverItem = response.validatedCart!.items.find(
          (item) => String(item.variant_id) === String(localItem.variant_id)
        );
        if (serverItem) {
          return {
            ...serverItem,
            qty: localItem.qty,
            line_total:
              serverItem.available === false
                ? 0
                : Number(serverItem.price || 0) * localItem.qty,
          };
        }

        const previousItem = previousItems.find(
          (item) => String(item.variant_id) === String(localItem.variant_id)
        );

        return {
          variant_id: localItem.variant_id,
          product_id: previousItem?.product_id || localItem.variant_id,
          name: previousItem?.name || `Item ${localItem.variant_id}`,
          variant_name: previousItem?.variant_name || null,
          image_path: previousItem?.image_path || null,
          qty: localItem.qty,
          price: 0,
          line_total: 0,
          available: false,
          price_changed: false,
          availability_reason:
            "This item is no longer available for your selected delivery window.",
        };
      });

      return {
        ...response,
        validatedCart: {
          ...response.validatedCart,
          items,
          subtotal: items.reduce(
            (sum, item) =>
              sum +
              (item.available === false ? 0 : Number(item.price || 0) * item.qty),
            0
          ),
        },
      };
    },
    []
  );

  const detectValidationChanges = useCallback(
    (response: CartSyncResponse, current: LocalCart) => {
      const serverItems = response.validatedCart?.items || [];
      const previousValidatedItems = validatedCartRef.current?.items || [];
      const snapshot = loadCartPriceSnapshot();
      const changes: CartValidationNotice["changes"] = [];

      for (const localItem of current.items) {
        const serverItem = serverItems.find(
          (item) => String(item.variant_id) === String(localItem.variant_id)
        );

        const previousItem = previousValidatedItems.find(
          (item) => String(item.variant_id) === String(localItem.variant_id)
        );

        // Older API responses dropped unavailable variants. Preserve them
        // in the UI so the customer can see and remove the affected item.
        if (!serverItem) {
          const key = `${localItem.variant_id}:unavailable`;
          if (!acknowledgedChangesRef.current.has(key)) {
            changes.push({
              variant_id: localItem.variant_id,
              name: previousItem?.name || `Item ${localItem.variant_id}`,
              type: "unavailable",
              reason:
                "This item is no longer available for your selected delivery window.",
            });
          }
          continue;
        }

        if (serverItem.available === false) {
          const key = `${localItem.variant_id}:unavailable`;
          if (!acknowledgedChangesRef.current.has(key)) {
            changes.push({
              variant_id: localItem.variant_id,
              name: serverItem.name,
              type: "unavailable",
              reason:
                serverItem.availability_reason ||
                "This item is no longer available for your selected delivery window.",
            });
          }
          continue;
        }

        const currentPrice = Number(serverItem.price || 0);
        const oldPrice = Number(
          snapshot[String(localItem.variant_id)] ??
          (serverItem.old_price != null ? serverItem.old_price : NaN)
        );

        if (
          Number.isFinite(oldPrice) &&
          oldPrice !== currentPrice
        ) {
          const key = `${localItem.variant_id}:price:${oldPrice}:${currentPrice}`;
          if (!acknowledgedChangesRef.current.has(key)) {
            changes.push({
              variant_id: localItem.variant_id,
              name: serverItem.name,
              type: "price",
              oldPrice,
              newPrice: currentPrice,
            });
          }
        }
      }

      // Establish a snapshot for new cart items, and keep it current for
      // unchanged/available items. This snapshot is only informational;
      // the server remains authoritative.
      const nextSnapshot = { ...snapshot };
      for (const item of serverItems) {
        if (item.available === false) continue;
        const price = Number(item.price || 0);
        if (Number.isFinite(price)) {
          nextSnapshot[String(item.variant_id)] = price;
        }
      }
      saveCartPriceSnapshot(nextSnapshot);

      if (changes.length) {
        setValidationNotice({ changes });
      }

      return changes;
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
        validatedCartRef.current = null;
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
          const normalizedResponse =
            normalizeValidationResponse(response, current);

          if (normalizedResponse.validatedCart) {
            const changes = detectValidationChanges(normalizedResponse, current);
            normalizedResponse.changes = changes;
            const nextValidated = {
              ...normalizedResponse.validatedCart,

              shipping: 0,

              is_free_delivery:
                false,

              free_delivery_min: 0,

              free_delivery_remaining: 0,

              is_external_zone:
                false,

              distance_charge: 0,
            };
            validatedCartRef.current = nextValidated;
            setValidatedCart(nextValidated);
          } else {
            validatedCartRef.current = null;
            setValidatedCart(null);
          }

          return normalizedResponse;
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
        const normalizedResponse =
          normalizeValidationResponse(response, current);

        if (normalizedResponse.validatedCart) {
          const changes = detectValidationChanges(normalizedResponse, current);
          normalizedResponse.changes = changes;
          validatedCartRef.current = normalizedResponse.validatedCart;
          setValidatedCart(
            normalizedResponse.validatedCart
          );
        } else {
          validatedCartRef.current = null;
          setValidatedCart(null);
        }

        return normalizedResponse;
      } finally {
        setValidating(false);
      }
    },
    [detectValidationChanges, normalizeValidationResponse]
  );

  const dismissValidationNotice = useCallback(() => {
    if (!validationNotice) return;

    const snapshot = loadCartPriceSnapshot();
    for (const change of validationNotice.changes) {
      if (change.type === "price" && change.newPrice != null) {
        snapshot[String(change.variant_id)] = Number(change.newPrice);
        const oldKey = `${change.variant_id}:price:${change.oldPrice}:${change.newPrice}`;
        acknowledgedChangesRef.current.add(oldKey);
      } else {
        acknowledgedChangesRef.current.add(
          `${change.variant_id}:unavailable`
        );
      }
    }
    saveCartPriceSnapshot(snapshot);
    setValidationNotice(null);
  }, [validationNotice]);

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

    validatedCartRef.current = null;
    setValidatedCart(null);
  }, []);

  /*
   * Context value
   */
  const value = useMemo(
    () => ({
      cart,
      validatedCart,
      validationNotice,
      dismissValidationNotice,

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
      validationNotice,
      dismissValidationNotice,

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