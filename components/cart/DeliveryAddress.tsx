"use client";

import type { Address } from "./types";

type Props = {
  address: Address | null;
  onChange: () => void;
  onAdd: () => void;
  onLogin: () => void;
  isAuthenticated: boolean;
};

export default function DeliveryAddress({
  address,
  onChange,
  onAdd,
  onLogin,
  isAuthenticated,
}: Props) {
  if (!isAuthenticated) {
    return (
      <section className="mk-cart-address-card mk-address-login-card">
        <div className="mk-address-card-icon">⌖</div>
        <div className="mk-address-card-copy">
          <span className="mk-cart-eyebrow">DELIVERY ADDRESS</span>
          <h2>Login to continue</h2>
          <p>
            Sign in to choose your delivery address and review
            your order.
          </p>
        </div>
        <button
          type="button"
          className="mk-address-card-action"
          onClick={onLogin}
        >
          LOGIN
        </button>
      </section>
    );
  }

  if (!address) {
    return (
      <section className="mk-cart-address-card mk-address-empty-card">
        <div className="mk-address-card-icon">⌖</div>
        <div className="mk-address-card-copy">
          <span className="mk-cart-eyebrow">DELIVERING TO</span>
          <h2>Add a delivery address</h2>
          <p>
            Choose a saved address or add a new one to continue.
          </p>
        </div>
        <button
          type="button"
          className="mk-address-card-action"
          onClick={onAdd}
        >
          ADD ADDRESS
        </button>
      </section>
    );
  }

  return (
    <section className="mk-cart-address-card mk-address-selected-card">
      <div className="mk-address-card-icon">⌖</div>

      <div className="mk-address-card-copy">
        <div className="mk-address-label-row">
          <span className="mk-cart-eyebrow">DELIVERING TO</span>
          {address.is_default ? (
            <span className="mk-default-badge">DEFAULT</span>
          ) : null}
        </div>

        <h2>{address.full_name || address.name || "Delivery address"}</h2>

        <p className="mk-address-primary-line">
          {[
            address.house_flat || address.house,
            address.street,
            address.area || address.area_name,
            address.city,
            address.pincode || address.pin,
          ]
            .filter(Boolean)
            .join(", ")}
        </p>
      </div>

      <button
        type="button"
        className="mk-address-card-action"
        onClick={onChange}
      >
        CHANGE <span>›</span>
      </button>
    </section>
  );
}
