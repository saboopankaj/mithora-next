"use client";

import { useState } from "react";
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

  async function applyCoupon(code: string) {
    setCoupon(code);
    const response = await validate();

    if (!response.validatedCart) {
      setCouponMessage(response.error || response.message || "Coupon could not be applied.");
      return;
    }

    if (
      response.validatedCart.coupon_info &&
      response.validatedCart.coupon_info.status === "error"
    ) {
      setCouponMessage(
        response.validatedCart.coupon_info.message || "Coupon is not applicable.",
      );
      return;
    }

    setCouponMessage("Coupon applied.");
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
            <button type="button" onClick={async () => {
              removeCoupon();
              await validate();
            }}>
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
        onApply={applyCoupon}
      />
    </>
  );
}
