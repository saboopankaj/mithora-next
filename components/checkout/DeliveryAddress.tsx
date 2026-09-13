"use client";

import type { Address } from "./types";

type Props = {
  address: Address | null;
  onChange: () => void;
  onAdd: () => void;
};

export default function DeliveryAddress({ address, onChange, onAdd }: Props) {
  if (!address) {
    return (
      <section className="mk-checkout-card">
        <div className="mk-checkout-card-heading">
          <div>
            <span className="mk-cart-eyebrow">DELIVERY ADDRESS</span>
            <h2>Where should we deliver?</h2>
          </div>
        </div>
        <button type="button" className="mk-primary-button" onClick={onAdd}>
          + ADD ADDRESS
        </button>
      </section>
    );
  }

  return (
    <section className="mk-checkout-card">
      <div className="mk-checkout-card-heading">
        <div>
          <span className="mk-cart-eyebrow">DELIVERY ADDRESS</span>
          <h2>{address.full_name || address.name || "Delivery address"}</h2>
        </div>
        <button type="button" onClick={onChange}>
          CHANGE
        </button>
      </div>

      <div className="mk-address-details">
        <strong>{address.phone}</strong>
        <p>
          {[address.house_flat || address.house, address.street, address.landmark]
            .filter(Boolean)
            .join(", ")}
        </p>
        <p>
          {[address.area || address.area_name, address.city, address.state, address.pincode || address.pin]
            .filter(Boolean)
            .join(", ")}
        </p>
      </div>
    </section>
  );
}
