"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useCart } from "./CartProvider";
import CouponDrawer from "./CouponDrawer";

function money(value: number | undefined) {
  return `₹${Number(value || 0).toFixed(0)}`;
}

export default function CartSummary() {
  const {
    cart,
    validatedCart,
    loading,
    setCoupon,
    removeCoupon,
    validate,
  } = useCart();

  const [couponOpen, setCouponOpen] = useState(false);
  const [couponMessage, setCouponMessage] = useState("");

useEffect(() => {
  if (!cart.coupon_code || !validatedCart) return;

  const couponInfo = validatedCart.coupon_info;
  const discount = Number(validatedCart.discount || 0);

  if (couponInfo?.status === "error") {
    setCouponMessage(
      couponInfo.message ||
        "⚠️ Add more to use this coupon, or remove it to check other offers.",
    );
    return;
  }

  if (discount > 0) {
    setCouponMessage(
      `🎉 Yay! You saved ${money(discount)} with ${cart.coupon_code}.`,
    );
    return;
  }

  setCouponMessage(
    "⚠️ Add more to use this coupon, or remove it to check other offers.",
  );
}, [cart.coupon_code, validatedCart]);

useEffect(() => {
  if (!cart.coupon_code || validatedCart) return;

  validate();
}, [cart.coupon_code, validatedCart, validate]);

async function applyCoupon(code: string) {
  setCouponMessage("");
  setCoupon(code);

  const response = await validate();

  if (!response.validatedCart) {
    setCouponMessage(
      response.error ||
        response.message ||
        "Coupon could not be applied.",
    );
    return;
  }

  const couponInfo = response.validatedCart.coupon_info;
  const discount = Number(response.validatedCart.discount || 0);

  if (couponInfo?.status === "error") {
    setCouponMessage(
      couponInfo.message || "Coupon is not applicable.",
    );
    return;
  }

  if (discount > 0) {
    setCouponMessage(
      `🎉 Yay! You saved ${money(discount)} with ${code}.`,
    );
  } else {
    setCouponMessage("Coupon applied successfully.");
  }
}

  if (!validatedCart) {
    return (
      <section className="mk-cart-summary">
        <div className="mk-summary-header">
          <h2>Order Summary</h2>
        </div>
        <p className="mk-summary-empty">
          {cart.items.length
            ? "Check your pincode to calculate your total."
            : "Your cart is empty."}
        </p>
        <Link href="/menu" className="mk-primary-button">
          {cart.items.length ? "CHECK DELIVERY" : "BROWSE MENU"}
        </Link>
      </section>
    );
  }

  return (
    <>
      <section className="mk-cart-summary">
        <div className="mk-summary-header">
          <h2>Order Summary</h2>
          {loading && <span>Updating…</span>}
        </div>

        <div className="mk-summary-lines">
          <div><span>Item Total</span><strong>{money(validatedCart.subtotal)}</strong></div>
          <div>
  <span>Delivery Fee</span>
  <strong>
    {validatedCart.is_free_delivery
      ? "FREE"
      : money(validatedCart.shipping)}
  </strong>
</div>

{Number(validatedCart.free_delivery_min || 0) > 0 &&
  !validatedCart.is_free_delivery &&
  Number(validatedCart.free_delivery_remaining || 0) > 0 && (
    <div className="mk-free-delivery-message">
      🚚 Add ₹
      {Number(validatedCart.free_delivery_remaining).toFixed(0)}
      {" "}more for FREE delivery
    </div>
  )}

{Number(validatedCart.free_delivery_min || 0) > 0 &&
  validatedCart.is_free_delivery && (
    <div className="mk-free-delivery-message">
      🚚 FREE delivery unlocked
    </div>
  )}
          {validatedCart.discount > 0 && (
            <div className="mk-discount-line">
              <span>Coupon Discount</span>
              <strong>−{money(validatedCart.discount)}</strong>
            </div>
          )}
        </div>

{validatedCart.is_external_zone && (
  <div className="mk-distance-warning">
    ⚠️ Distance charges applied for this location.
  </div>
)}

        {cart.coupon_code ? (
          <div className="mk-applied-coupon">
            <span>Coupon <strong>{cart.coupon_code}</strong></span>
<button
  type="button"
  onClick={async () => {
    removeCoupon();
    setCouponMessage("Coupon removed. You can apply another offer anytime.");
    await validate();
  }}
>
  REMOVE
</button>
          </div>
        ) : (
          <button
            type="button"
            className="mk-coupon-trigger"
            onClick={() => setCouponOpen(true)}
          >
            🏷 Apply coupon
          </button>
        )}

        {couponMessage && <p className="mk-coupon-message">{couponMessage}</p>}

        <div className="mk-summary-total">
          <span>To Pay</span>
          <strong>{money(validatedCart.total)}</strong>
        </div>

        <Link href="/checkout" className="mk-primary-button mk-full-button">
          Review & Checkout →
        </Link>
      </section>

<CouponDrawer
  open={couponOpen}
  onClose={() => setCouponOpen(false)}
  currentCode={cart.coupon_code}
  subtotal={validatedCart?.subtotal ?? 0}
  onApply={applyCoupon}
/>
    </>
  );
}
