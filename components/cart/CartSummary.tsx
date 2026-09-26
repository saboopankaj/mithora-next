"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useAuth } from "@/components/auth/AuthContext";
import { useCart } from "./CartProvider";
import CouponDrawer from "./CouponDrawer";

function money(value: number | undefined) {
  return `₹${Number(value || 0).toFixed(0)}`;
}

type Props = {
  onAddAddress?: () => void;
  onPlaceOrder?: () => void;
  canPlaceOrder?: boolean;
  paymentLoading?: boolean;
  addressReady?: boolean;
};

export default function CartSummary({
  onAddAddress,
  addressReady,
}: Props) {
  const { isAuthenticated } = useAuth();

  const {
    cart,
    validatedCart,
    loading,
    setCoupon,
    removeCoupon,
    validate,
  } = useCart();

  const [couponOpen, setCouponOpen] = useState(false);
  const [couponMessage, setCouponMessage] =
    useState("");

  const displaySubtotal = validatedCart
    ? validatedCart.items.reduce((total, item) => {
        const localItem = cart.items.find(
          (local) =>
            String(local.variant_id) ===
            String(item.variant_id)
        );

        if (!localItem) return total;

        return (
          total +
          Number(item.price || 0) *
            localItem.qty
        );
      }, 0)
    : 0;

const hasAvailableItems = validatedCart?.items?.some(
  (item) => item.available !== false
) ?? false;

  const displayTotal = hasAvailableItems
    ? Math.max(
        0,
        displaySubtotal -
          Number(validatedCart?.discount || 0)
      )
    : 0;

  const couponInfo = validatedCart?.coupon_info;
  const couponInvalid =
    !!cart.coupon_code && couponInfo?.status === "error";

  const couponMinimum = Number(
    couponInfo?.min_order_amount ??
      couponInfo?.minimum_order_amount ??
      couponInfo?.min_order ??
      0
  );

  const couponRemaining = Number(
    couponInfo?.remaining_amount ??
      couponInfo?.amount_remaining ??
      couponInfo?.remaining ??
      0
  );

  const couponUnlockAmount =
    couponRemaining > 0
      ? couponRemaining
      : couponMinimum > displaySubtotal
        ? couponMinimum - displaySubtotal
        : 0;

  useEffect(() => {
    if (!cart.coupon_code || !validatedCart) return;

    const info = validatedCart.coupon_info;
    const discount = Number(
      validatedCart.discount || 0
    );

    if (info?.status === "error") {
      setCouponMessage(
        info.message ||
          (couponUnlockAmount > 0
            ? `Add ₹${couponUnlockAmount.toFixed(0)} more to unlock ${cart.coupon_code}.`
            : "Add more to unlock this coupon.")
      );
      return;
    }

    setCouponMessage(
      discount > 0
        ? `🎉 You saved ${money(discount)} with ${cart.coupon_code}.`
        : "Coupon applied successfully."
    );
  }, [cart.coupon_code, validatedCart, couponUnlockAmount]);

  async function applyCoupon(code: string) {
    setCouponMessage("");
    setCoupon(code);

    const response = await validate();

    if (!response.validatedCart) {
      setCouponMessage(
        response.error ||
          response.message ||
          "Coupon could not be applied."
      );
      return;
    }

    const info = response.validatedCart.coupon_info;
    const discount = Number(
      response.validatedCart.discount || 0
    );

    if (info?.status === "error") {
      setCouponMessage(
        info.message ||
          "Coupon is not applicable."
      );
      return;
    }

    setCouponMessage(
      discount > 0
        ? `🎉 You saved ${money(discount)} with ${code}.`
        : "Coupon applied successfully."
    );

    setCouponOpen(false);
  }

  if (!validatedCart) {
    return (
      <section className="mk-cart-summary">
        <div className="mk-summary-header">
          <div>
            <span className="mk-cart-eyebrow">
              CHECKOUT
            </span>
            <h2>Order summary</h2>
          </div>

          {loading ? <span>Updating…</span> : null}
        </div>

        {!isAuthenticated && cart.items.length ? (
          <div className="mk-summary-updating">
            <span>Order totals appear after a delivery address is added.</span>
          </div>
        ) : cart.items.length ? (
          <div className="mk-summary-updating">
            <span>Calculating your order…</span>
          </div>
        ) : (
          <>
            <p className="mk-summary-empty">
              Your cart is empty.
            </p>
            <Link
              href="/menu"
              className="mk-primary-button"
            >
              BROWSE MENU
            </Link>
          </>
        )}
      </section>
    );
  }

  const deliveryFee = hasAvailableItems
    ? Number(validatedCart.shipping || 0)
    : 0;
  const discount = Number(
    validatedCart.discount || 0
  );
  const total =
    addressReady
      ? displayTotal + deliveryFee
      : displayTotal;

  return (
    <section className="mk-cart-summary">
      <div className="mk-summary-header">
        <div>
          <span className="mk-cart-eyebrow">
            CHECKOUT
          </span>
          <h2>Order summary</h2>
        </div>

        {loading ? <span>Updating…</span> : null}
      </div>

      <div className="mk-summary-lines">
        <div>
          <span>Item total</span>
          <strong>{money(displaySubtotal)}</strong>
        </div>

        <div>
          <span>Delivery fee</span>
          <strong>
            {!addressReady
              ? "Add address"
              : validatedCart.delivery_charge_type === "CUSTOMER_PAY"
                ? "Pay separately"
                : validatedCart.is_free_delivery
                  ? "FREE"
                  : money(deliveryFee)}
          </strong>
        </div>

        {addressReady &&
        validatedCart.delivery_message ? (
          <div className="mk-delivery-note">
            {validatedCart.delivery_message}
          </div>
        ) : null}

        {discount > 0 ? (
          <div className="mk-discount-line">
            <span>Coupon savings</span>
            <strong>−{money(discount)}</strong>
          </div>
        ) : null}
      </div>

      {addressReady &&
      Number(validatedCart.free_delivery_min || 0) >
        0 &&
      Number(
        validatedCart.free_delivery_remaining || 0
      ) > 0 &&
      !validatedCart.is_free_delivery ? (
        <div className="mk-free-delivery-message">
          <span>🚚</span>
          <div>
            <strong>
              ₹
              {Number(
                validatedCart.free_delivery_remaining
              ).toFixed(0)}{" "}
              away from FREE delivery
            </strong>
            <small>
              Add a little more to unlock it.
            </small>
          </div>
        </div>
      ) : null}

      {addressReady &&
      validatedCart.is_free_delivery &&
      validatedCart.delivery_charge_type !== "CUSTOMER_PAY" ? (
        <div className="mk-free-delivery-message is-unlocked">
          <span>✓</span>
          <div>
            <strong>FREE delivery unlocked</strong>
            <small>Nice — delivery is on us.</small>
          </div>
        </div>
      ) : null}

      {addressReady &&
      validatedCart.is_external_zone ? (
        <div className="mk-distance-warning">
          <span>⚠</span>
          <div>
            <strong>Distance charges may apply</strong>
            <small>
              Final delivery charges are calculated
              before payment.
            </small>
          </div>
        </div>
      ) : null}

      <div className="mk-offer-card">
        <div className="mk-offer-icon">%</div>

        <div className="mk-offer-copy">
          <strong>Offers & coupons</strong>
          {cart.coupon_code ? (
            <small>
              {couponInvalid
                ? couponUnlockAmount > 0
                  ? `Add ₹${couponUnlockAmount.toFixed(0)} more to unlock`
                  : "Add more to unlock this offer"
                : `${cart.coupon_code} applied`}
            </small>
          ) : (
            <small>Save more on this order</small>
          )}
        </div>

        <button
          type="button"
          onClick={() => setCouponOpen(true)}
        >
          {cart.coupon_code
            ? "VIEW"
            : "VIEW OFFERS"}
        </button>
      </div>

      {cart.coupon_code ? (
        <div
          className={`mk-applied-coupon${
            couponInvalid ? " is-locked" : ""
          }`}
        >
          <div>
            <span>{couponInvalid ? "Coupon saved" : "Applied coupon"}</span>
            <strong>{cart.coupon_code}</strong>
            {couponInvalid ? (
              <small>
                {couponUnlockAmount > 0
                  ? `Add ₹${couponUnlockAmount.toFixed(0)} more to unlock`
                  : "Add more items to unlock this offer"}
              </small>
            ) : null}
          </div>

          <button
            type="button"
            onClick={async () => {
              removeCoupon();
              setCouponMessage("Coupon removed.");
              await validate();
            }}
          >
            REMOVE
          </button>
        </div>
      ) : null}

      {couponMessage ? (
        <p className="mk-coupon-message">
          {couponMessage}
        </p>
      ) : null}

      {!hasAvailableItems ? (
        <div className="mk-all-items-unavailable">
          <strong>No available items</strong>
          <small>
            Remove unavailable items or add another item from the menu to
            continue.
          </small>
        </div>
      ) : null}

      <div className="mk-summary-total">
        <span>To pay</span>
        <strong>{money(total)}</strong>
      </div>

      <div className="mk-summary-note">
        🔒 Secure checkout • Razorpay
      </div>

      <CouponDrawer
        open={couponOpen}
        onClose={() => setCouponOpen(false)}
        currentCode={cart.coupon_code}
        subtotal={displaySubtotal}
        onApply={applyCoupon}
      />
    </section>
  );
}
