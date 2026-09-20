"use client";

import { useAuth } from "@/components/auth/AuthContext";
import { useEffect, useState } from "react";
import { apiFetch } from "@/lib/api";
import type { Coupon } from "./types";
import ModalPortal from "./ModalPortal";

type Props = {
  open: boolean;
  onClose: () => void;
  currentCode?: string;
  onApply: (code: string) => Promise<void> | void;
  subtotal?: number;
};

export default function CouponDrawer({
  open,
  onClose,
  currentCode,
  onApply,
  subtotal = 0,
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
                Array.isArray(
                  (response as { coupons: unknown[] })
                    .coupons
                )
              ? (response as { coupons: Coupon[] })
                  .coupons
              : [];

        setCoupons(list);
      })
      .catch(() => setCoupons([]))
      .finally(() => setLoading(false));
  }, [open]);

  if (!open) return null;

  return (
    <ModalPortal>
      <div
      className="mk-overlay mk-coupon-overlay"
      onClick={onClose}
    >
      <aside
        className="mk-coupon-drawer"
        onClick={(event) =>
          event.stopPropagation()
        }
        role="dialog"
        aria-modal="true"
        aria-label="Offers and coupons"
      >
        <div className="mk-coupon-drawer-topbar">
          <button
            type="button"
            className="mk-drawer-back"
            onClick={onClose}
            aria-label="Back"
          >
            ←
          </button>

          <div>
            <span className="mk-cart-eyebrow">
              OFFERS
            </span>
            <h2>Coupons & discounts</h2>
          </div>

          <button
            type="button"
            className="mk-drawer-close"
            onClick={onClose}
            aria-label="Close"
          >
            ×
          </button>
        </div>

        <div className="mk-coupon-drawer-body">
          <div className="mk-coupon-manual">
            <div className="mk-coupon-input-wrap">
              <span>🏷</span>
              <input
                value={manual}
                onChange={(event) =>
                  setManual(
                    event.target.value.toUpperCase()
                  )
                }
                placeholder="Have a coupon code?"
                aria-label="Coupon code"
              />
            </div>

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

          <div className="mk-offers-heading">
            <div>
              <span className="mk-cart-eyebrow">
                AVAILABLE OFFERS
              </span>
              <strong>Save on your order</strong>
            </div>
          </div>

          {loading ? (
            <div className="mk-coupon-loading">
              Loading available offers…
            </div>
          ) : coupons.length ? (
            <div className="mk-coupon-list">
              {coupons.map((coupon) => {
                const minimumOrder = Number(
                  coupon.min_order_amount ??
                    coupon.min_order_value ??
                    coupon.min_order ??
                    0
                );

                const discountValue = Number(
                  coupon.discount_value ??
                    coupon.discount ??
                    0
                );

                const isPercentage =
                  coupon.discount_type ===
                    "percent" ||
                  coupon.discount_type ===
                    "percentage";

                const discountText =
                  isPercentage
                    ? `${discountValue}% OFF`
                    : discountValue > 0
                      ? `₹${discountValue} OFF`
                      : "SPECIAL OFFER";

                const locked =
                  minimumOrder > subtotal;

                const isCurrent =
                  currentCode?.toUpperCase() ===
                  String(coupon.code).toUpperCase();

                const currentButLocked =
                  isCurrent && locked;

                return (
                  <div
                    key={
                      coupon.id ??
                      coupon.code
                    }
                    className="mk-coupon-card"
                  >
                    <div className="mk-coupon-card-main">
                      <div className="mk-coupon-tag">
                        {discountText}
                      </div>

                      <div className="mk-coupon-code-row">
                        <strong>
                          {coupon.code}
                        </strong>
                        <span>
                          {currentButLocked
                            ? "SAVED"
                            : isCurrent
                              ? "APPLIED"
                              : "OFFER"}
                        </span>
                      </div>

                      {coupon.description ? (
                        <p>
                          {coupon.description}
                        </p>
                      ) : null}

                      {minimumOrder > 0 ? (
                        <small>
                          Min. order ₹
                          {minimumOrder.toFixed(
                            0
                          )}
                        </small>
                      ) : null}

                      {locked ? (
                        <div className="mk-coupon-locked-message">
                          Add ₹
                          {(
                            minimumOrder -
                            subtotal
                          ).toFixed(0)}{" "}
                          more to unlock
                        </div>
                      ) : null}
                    </div>

                    <button
                      type="button"
                      disabled={
                        isCurrent ||
                        locked
                      }
                      onClick={() =>
                        onApply(coupon.code)
                      }
                    >
                      {currentButLocked
                        ? "LOCKED"
                        : isCurrent
                          ? "APPLIED"
                          : locked
                            ? "LOCKED"
                            : "APPLY"}
                    </button>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="mk-coupon-empty">
              <div>🏷</div>
              <strong>
                {isAuthenticated
                  ? "No available offers"
                  : "Login to see available offers"}
              </strong>
              <span>
                {isAuthenticated
                  ? "There are no coupons currently available for your account."
                  : "Sign in to view coupons linked to your account."}
              </span>
            </div>
          )}
        </div>
      </aside>
      </div>
    </ModalPortal>
  );
}
