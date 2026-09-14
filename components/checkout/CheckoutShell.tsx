"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

import { getCurrentUser, getAuthToken } from "@/lib/auth";
import { useAuth } from "@/components/auth/AuthContext";
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
  const { isAuthenticated, openAuth } = useAuth();
  const {
    cart,
    validatedCart,
    validate,
    pincode,
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
    const list = Array.isArray(result) ? result : (result.addresses || []);
    setAddresses(list);

    const matching = /^\d{6}$/.test(pincode)
      ? list.find((address) => String(address.pincode || address.pin || "") === pincode)
      : null;
    const defaultAddress = matching || list.find((address) => address.is_default) || list[0] || null;

    setSelected(defaultAddress);
    return defaultAddress;
  }, [pincode]);

  useEffect(() => {
    if (!isAuthenticated || !getAuthToken() || !getCurrentUser()) {
      if (typeof window !== "undefined") sessionStorage.setItem("mithora_after_login", "/checkout");
      openAuth("mobile");
      return;
    }

    if (!cart.items.length) { router.replace("/cart"); return; }
    if (!/^\d{6}$/.test(pincode)) { return; }

    void (async () => {
      try {
        const address = await loadAddresses();
        if (address && String(address.pincode || address.pin || "") !== pincode) {
          // Keep the cart-selected delivery pincode as the checkout gate; the user can choose a matching address.
        }
        const response = await validate(address);
        if (response.validatedCart?.is_external_zone) setDistanceOpen(true);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Unable to load checkout.");
      }
    })();
  }, [cart.items.length, loadAddresses, router, validate, isAuthenticated, openAuth, pincode]);

  async function selectAddress(address: Address) {
    const addressPin = String(address.pincode || address.pin || "");
    if (/^\d{6}$/.test(pincode) && addressPin && addressPin !== pincode) {
      setError("This address has a different pincode. Please change the delivery location on Review Order first.");
      return;
    }
    setSelected(address);
    setPickerOpen(false);
    setError("");

    const response = await validate(address);
    if (response.validatedCart?.is_external_zone) {
      setDistanceOpen(true);
    }
  }

  async function saveNewAddress(address: Address) {
    const addressPin = String(address.pincode || address.pin || "");
    if (/^\d{6}$/.test(pincode) && addressPin && addressPin !== pincode) {
      setError("The new address pincode must match the delivery location selected on Review Order.");
      return;
    }

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
    if (!selected || !selected.id) { setError("Please select a saved delivery address."); return; }
    if (!/^\d{6}$/.test(pincode)) { setError("Please enter or detect your delivery pincode first."); return; }
    if (!cart.items.length) { setError("Your cart is empty."); return; }

    setPaymentLoading(true); setError("");
    try {
      // Server revalidates the raw cart, current DB prices, coupon, shipping and final amount.
      const result = await createCheckoutOrder({
        items: cart.items,
        coupon_code: cart.coupon_code || "",
        address_id: selected.id,
        customer: { name: selected.full_name || selected.name, phone: selected.phone, email: getCurrentUser()?.email },
      });

      const order = result.order || result.razorpay_order;
      const key = result.key || result.razorpay_key_id;
      if (!order?.id || !key) throw new Error("Payment order could not be created.");

      await loadRazorpay();
      const RazorpayConstructor = window.Razorpay;
      if (!RazorpayConstructor) throw new Error("Razorpay is not available.");

      const customer: Customer = { name: selected.full_name || selected.name, phone: selected.phone, email: getCurrentUser()?.email };
      const razorpay = new RazorpayConstructor({
        key, amount: order.amount, currency: order.currency || "INR", order_id: order.id,
        name: "Mithora Kitchen", description: "Mithora Kitchen Order",
        prefill: { name: customer.name || "", email: customer.email || "", contact: customer.phone || "" },
        theme: { color: "#FF6B35" },
        handler: (payment: { razorpay_payment_id?: string }) => {
          // Local cart is cleared after Razorpay success; the webhook also clears the server cart after capture.
          clear();
          const params = new URLSearchParams();
          if (order.id) params.set("order_id", order.id);
          if (result.order_no) params.set("order_no", result.order_no);
          if (payment.razorpay_payment_id) params.set("payment_id", payment.razorpay_payment_id);
          router.replace(`/order-success?${params.toString()}`);
        },
        modal: { ondismiss: () => setPaymentLoading(false) },
      });
      razorpay.open();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Payment could not be started.");
      setPaymentLoading(false);
    }
  }

  const canPay = !!isAuthenticated && !!selected?.id && /^\d{6}$/.test(pincode) && !!validatedCart && !formOpen && !paymentLoading;

  const customerName = useMemo(
    () => getCurrentUser()?.name || "",
    [],
  );

  if (!isAuthenticated || !getAuthToken()) {
    return (
      <main className="mk-checkout-page">
        <section className="mk-checkout-card mk-checkout-auth-gate">
          <span className="mk-cart-eyebrow">LOGIN REQUIRED</span>
          <h2>Please login to continue</h2>
          <p>Your cart is kept safely on this device until you sign in.</p>
          <button type="button" className="mk-primary-button" onClick={() => openAuth("mobile")}>LOGIN / SIGN UP</button>
        </section>
      </main>
    );
  }

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

          {!/^\d{6}$/.test(pincode) && (
            <section className="mk-checkout-card mk-checkout-location-gate">
              <span className="mk-cart-eyebrow">DELIVERY LOCATION</span>
              <h2>Add your pincode on Review Order</h2>
              <p>Checkout and payment will be enabled after your delivery location is detected or entered.</p>
              <Link href="/cart" className="mk-primary-button">← GO TO REVIEW ORDER</Link>
            </section>
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
