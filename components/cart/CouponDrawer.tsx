"use client";

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
            {coupons.map((coupon, index) => {
              const code = String(coupon.code || "");
              const minimum =
                coupon.min_order_value ?? coupon.min_order ?? 0;
              const discount =
                coupon.discount_value ?? coupon.discount ?? "";

              return (
                <div className="mk-coupon-card" key={`${code}-${index}`}>
                  <div>
                    <strong>{code}</strong>
                    <p>{coupon.description || "Special savings on your order."}</p>
                    {discount !== "" && (
                      <small>
                        {coupon.discount_type === "percent"
                          ? `${discount}% off`
                          : `₹${discount} off`}
                        {minimum ? ` · Min order ₹${minimum}` : ""}
                      </small>
                    )}
                  </div>
                  <button
                    type="button"
                    onClick={async () => {
                      await onApply(code);
                      onClose();
                    }}
                  >
                    {currentCode === code ? "APPLIED" : "APPLY"}
                  </button>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="mk-coupon-empty">No coupons available right now.</div>
        )}
      </aside>
    </div>
  );
}
