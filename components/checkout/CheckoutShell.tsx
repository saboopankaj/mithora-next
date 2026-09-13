"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

import { getCurrentUser, getAuthToken } from "@/lib/auth";
import { fetchAddresses, setDefaultAddress, createCheckoutOrder } from "@/lib/checkout";
import { useCart } from "@/components/cart/CartProvider";

import DeliveryAddress from "./DeliveryAddress";
import AddressForm from "./AddressForm";
import AddressPicker from "./AddressPicker";
import CheckoutSummary from "./CheckoutSummary";
import PaymentFooter from "./PaymentFooter";
import DistanceChargeModal from "@/components/cart/DistanceChargeModal";
import type { Address, Customer } from "./types";

declare global {
  interface Window {
    Razorpay?: new (options: Record<string, unknown>) => {
      open: () => void;
    };
  }
}

function loadRazorpay(): Promise<void> {
  return new Promise((resolve, reject) => {
    if (window.Razorpay) {
      resolve();
      return;
    }

    const existing = document.querySelector<HTMLScriptElement>(
      'script[src="https://checkout.razorpay.com/v1/checkout.js"]',
    );

    if (existing) {
      existing.addEventListener("load", () => resolve(), { once: true });
      existing.addEventListener("error", () => reject(new Error("Razorpay failed to load.")), { once: true });
      return;
    }

    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.async = true;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error("Razorpay failed to load."));
    document.body.appendChild(script);
  });
}

export default function CheckoutShell() {
  const router = useRouter();
  const {
    cart,
    validatedCart,
    validate,
    persist,
    clear,
  } = useCart();

  const [addresses, setAddresses] = useState<Address[]>([]);
  const [selected, setSelected] = useState<Address | null>(null);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [formOpen, setFormOpen] = useState(false);
  const [distanceOpen, setDistanceOpen] = useState(false);
  const [paymentLoading, setPaymentLoading] = useState(false);
  const [error, setError] = useState("");

  const loadAddresses = useCallback(async () => {
    const result = await fetchAddresses();
    const list = result.addresses || [];
    setAddresses(list);

    const defaultAddress =
      list.find((address) => address.is_default) || list[0] || null;

    setSelected(defaultAddress);
    return defaultAddress;
  }, []);

  useEffect(() => {
    if (!getAuthToken() || !getCurrentUser()) {
      router.replace(`/?next=${encodeURIComponent("/checkout")}`);
      return;
    }

    if (!cart.items.length) {
      router.replace("/cart");
      return;
    }

    void (async () => {
      try {
        const address = await loadAddresses();
        const response = await validate(address);

        if (response.validatedCart?.is_external_zone) {
          setDistanceOpen(true);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : "Unable to load checkout.");
      }
    })();
  }, [cart.items.length, loadAddresses, router, validate]);

  async function selectAddress(address: Address) {
    setSelected(address);
    setPickerOpen(false);
    setError("");

    const response = await validate(address);
    if (response.validatedCart?.is_external_zone) {
      setDistanceOpen(true);
    }
  }

  async function saveNewAddress(address: Address) {
    setAddresses((current) => {
      const exists = address.id != null &&
        current.some((entry) => String(entry.id) === String(address.id));

      if (exists) {
        return current.map((entry) =>
          String(entry.id) === String(address.id) ? address : entry,
        );
      }

      return [...current, address];
    });

    setSelected(address);
    setFormOpen(false);

    const response = await validate(address);
    if (response.validatedCart?.is_external_zone) {
      setDistanceOpen(true);
    }
  }

  async function makeDefault(id: number | string) {
    try {
      await setDefaultAddress(id);
      await loadAddresses();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to set default address.");
    }
  }

  async function placeOrder() {
    if (!selected || !validatedCart) {
      setError("Please select a delivery address.");
      return;
    }

    setPaymentLoading(true);
    setError("");

    try {
      // Refresh from the server immediately before payment.
      const latest = await validate(selected);
      const freshCart = latest.validatedCart;

      if (!freshCart) {
        throw new Error("Unable to validate your cart.");
      }

      await persist();
      await loadRazorpay();

      const customer: Customer = {
        name: selected.full_name || selected.name,
        phone: selected.phone,
        email: getCurrentUser()?.email,
      };

      const result = await createCheckoutOrder({
        validatedCart: freshCart,
        address: selected,
        customer,
      });

      if (!result.order?.id || !result.key) {
        throw new Error("Payment order could not be created.");
      }

      const RazorpayConstructor = window.Razorpay;
      if (!RazorpayConstructor) {
        throw new Error("Razorpay is not available.");
      }

      const razorpay = new RazorpayConstructor({
        key: result.key,
        amount: result.order.amount,
        currency: result.order.currency || "INR",
        order_id: result.order.id,
        name: "Mithora Kitchen",
        description: "Mithora Kitchen Order",
        prefill: {
          name: customer.name || "",
          email: customer.email || "",
          contact: customer.phone || "",
        },
        theme: {
          color: "#FF6B35",
        },
        handler: async (payment: {
          razorpay_payment_id?: string;
          razorpay_order_id?: string;
          razorpay_signature?: string;
        }) => {
          clear();

          const params = new URLSearchParams();
          if (result.order?.id) params.set("order_id", result.order.id);
          if (result.order_no) params.set("order_no", result.order_no);
          if (payment.razorpay_payment_id) {
            params.set("payment_id", payment.razorpay_payment_id);
          }

          router.replace(`/order-success?${params.toString()}`);
        },
        modal: {
          ondismiss: () => setPaymentLoading(false),
        },
      });

      razorpay.open();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Payment could not be started.");
      setPaymentLoading(false);
    }
  }

  const canPay = !!selected && !!validatedCart && !formOpen;

  const customerName = useMemo(
    () => getCurrentUser()?.name || "",
    [],
  );

  if (!getAuthToken()) return null;

  return (
    <main className="mk-checkout-page">
      <header className="mk-checkout-header">
        <button type="button" onClick={() => router.back()} aria-label="Back">←</button>
        <div>
          <span className="mk-cart-eyebrow">MITHORA KITCHEN</span>
          <h1>Checkout</h1>
        </div>
        <span />
      </header>

      <div className="mk-checkout-layout">
        <div className="mk-checkout-main">
          {!formOpen ? (
            <DeliveryAddress
              address={selected}
              onChange={() => setPickerOpen(true)}
              onAdd={() => setFormOpen(true)}
            />
          ) : (
            <section className="mk-checkout-card">
              <div className="mk-checkout-card-heading">
                <div>
                  <span className="mk-cart-eyebrow">NEW ADDRESS</span>
                  <h2>Add delivery address</h2>
                </div>
              </div>
              <AddressForm
                initial={selected}
                onSaved={saveNewAddress}
                onCancel={() => setFormOpen(false)}
              />
            </section>
          )}

          {customerName && (
            <div className="mk-checkout-note">
              Ordering as <strong>{customerName}</strong>
            </div>
          )}

          <CheckoutSummary />

          {error && <div className="mk-checkout-error">{error}</div>}

          <Link href="/cart" className="mk-edit-cart-link">
            ← Edit cart
          </Link>
        </div>
      </div>

      <PaymentFooter
        total={validatedCart?.total || 0}
        disabled={!canPay}
        loading={paymentLoading}
        onPay={placeOrder}
      />

      <AddressPicker
        open={pickerOpen}
        addresses={addresses}
        selectedId={selected?.id}
        onClose={() => setPickerOpen(false)}
        onSelect={selectAddress}
        onAdd={() => {
          setPickerOpen(false);
          setFormOpen(true);
        }}
        onSetDefault={makeDefault}
      />

      <DistanceChargeModal
        open={distanceOpen}
        onClose={() => setDistanceOpen(false)}
        validatedCart={validatedCart}
      />
    </main>
  );
}
