"use client";
import { useAuth } from "@/components/auth/AuthContext";
import { useEffect, useState } from "react";
import { apiFetch } from "@/lib/api";
import type { Coupon } from "./types";

type Props = {
  open: boolean;
  onClose: () => void;
  currentCode?: string;
  onApply: (code: string) => Promise<void> | void;
};

export default function CouponDrawer({
  open,
  onClose,
  currentCode,
  onApply,
}: Props) {
  const { isAuthenticated } = useAuth();
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [loading, setLoading] = useState(false);
  const [manual, setManual] = useState("");

  useEffect(() => {
    if (!open) return;

    setLoading(true);
    apiFetch<unknown>("/api/coupons")
      .then((response) => {
        const list =
          Array.isArray(response)
            ? response
            : response &&
                typeof response === "object" &&
                "coupons" in response &&
                Array.isArray((response as { coupons: unknown[] }).coupons)
              ? (response as { coupons: Coupon[] }).coupons
              : [];

        setCoupons(list);
      })
      .catch(() => setCoupons([]))
      .finally(() => setLoading(false));
  }, [open]);

  if (!open) return null;

  return (
    <div className="mk-overlay" onClick={onClose}>
      <aside
        className="mk-coupon-drawer"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="mk-drawer-header">
          <div>
            <span className="mk-cart-eyebrow">OFFERS</span>
            <h2>Coupons & discounts</h2>
          </div>
          <button type="button" onClick={onClose} aria-label="Close">
            ×
          </button>
        </div>

        <div className="mk-coupon-manual">
          <input
            value={manual}
            onChange={(event) => setManual(event.target.value.toUpperCase())}
            placeholder="Enter coupon code"
          />
          <button
            type="button"
            disabled={!manual.trim()}
            onClick={async () => {
              await onApply(manual.trim());
              onClose();
            }}
          >
            APPLY
          </button>
        </div>

        {loading ? (
          <div className="mk-coupon-loading">Loading available coupons…</div>
        ) : coupons.length ? (
          <div className="mk-coupon-list">
            {coupons.map((coupon) => {
  const minimumOrder = Number(
    coupon.min_order_amount ??
      coupon.min_order_value ??
      coupon.min_order ??
      0,
  );

  const discountValue = Number(
    coupon.discount_value ?? coupon.discount ?? 0,
  );

  const discountText =
    coupon.discount_type === "percentage"
      ? `${discountValue}% OFF`
      : discountValue > 0
        ? `₹${discountValue} OFF`
        : "Special offer";

  return (
    <div
      key={coupon.id ?? coupon.code}
      className="mk-coupon-card"
    >
      <div className="mk-coupon-card-main">
        <div>
          <strong>{coupon.code}</strong>

          <div className="mk-coupon-discount">
            {discountText}
          </div>

          {coupon.description && (
            <p>{coupon.description}</p>
          )}

          {minimumOrder > 0 && (
            <small>
              Minimum order: ₹{minimumOrder.toFixed(0)}
            </small>
          )}
        </div>

        <button
          type="button"
          disabled={currentCode === coupon.code}
          onClick={() => onApply(coupon.code)}
        >
          {currentCode === coupon.code ? "APPLIED" : "APPLY"}
        </button>
      </div>
    </div>
  );
})}
          </div>
        ) : (
          <div className="mk-coupon-empty">
  {isAuthenticated ? (
    <>
      <strong>No available offers</strong>
      <span>
        There are no coupons currently linked to your account.
      </span>
    </>
  ) : (
    <>
      <strong>Log in to see available coupons & offers</strong>
      <span>
        Sign in to view coupons linked to your account and apply them to your order.
      </span>
    </>
  )}
</div>
        )}
      </aside>
    </div>
  );
}
