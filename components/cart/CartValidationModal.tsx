"use client";

import ModalPortal from "./ModalPortal";
import type { CartValidationNotice } from "./types";

type Props = {
  notice: CartValidationNotice | null;
  onClose: () => void;
};

export default function CartValidationModal({ notice, onClose }: Props) {
  if (!notice?.changes.length) return null;

  const priceChanges = notice.changes.filter((change) => change.type === "price");
  const unavailableChanges = notice.changes.filter(
    (change) => change.type === "unavailable"
  );

  return (
    <ModalPortal>
      <div className="mk-cart-validation-overlay" role="dialog" aria-modal="true">
        <div className="mk-cart-validation-modal">
          <div className="mk-cart-validation-icon">!</div>

          <div className="mk-cart-validation-header">
            <span className="mk-cart-eyebrow">CART UPDATED</span>
            <h2>Your cart has been updated</h2>
            <p>
              We checked the latest item details. Please review the changes
              before placing your order.
            </p>
          </div>

          {priceChanges.length > 0 && (
            <section className="mk-cart-change-section">
              <h3>Price updated</h3>
              {priceChanges.map((change) => (
                <div
                  className="mk-cart-change-row"
                  key={`${change.variant_id}-${change.oldPrice}-${change.newPrice}`}
                >
                  <div>
                    <strong>{change.name}</strong>
                    <small>Current price has changed</small>
                  </div>
                  <div className="mk-cart-price-change">
                    <span>₹{Number(change.oldPrice || 0).toFixed(0)}</span>
                    <b>→</b>
                    <strong>₹{Number(change.newPrice || 0).toFixed(0)}</strong>
                  </div>
                </div>
              ))}
            </section>
          )}

          {unavailableChanges.length > 0 && (
            <section className="mk-cart-change-section is-unavailable">
              <h3>Item unavailable</h3>
              {unavailableChanges.map((change) => (
                <div
                  className="mk-cart-change-row"
                  key={`${change.variant_id}-unavailable`}
                >
                  <div>
                    <strong>{change.name}</strong>
                    <small>
                      {change.reason ||
                        "This item is no longer available for your selected delivery window."}
                    </small>
                  </div>
                </div>
              ))}
            </section>
          )}

          <div className="mk-cart-validation-note">
            Your order total has been recalculated. Unavailable items are not
            included in the total.
          </div>

          <button
            type="button"
            className="mk-primary-button mk-full-button"
            onClick={onClose}
          >
            REVIEW UPDATED CART
          </button>
        </div>
      </div>
    </ModalPortal>
  );
}
