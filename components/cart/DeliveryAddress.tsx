"use client";
import type { Address } from "./types";

type Props = { address: Address | null; onChange: () => void; onAdd: () => void; onLogin: () => void; isAuthenticated: boolean };

export default function DeliveryAddress({ address, onChange, onAdd, onLogin, isAuthenticated }: Props) {
  if (!isAuthenticated) return (
    <section className="mk-cart-address-card">
      <span className="mk-cart-eyebrow">DELIVERY ADDRESS</span>
      <h2>Login to add your delivery address</h2>
      <p>Your cart is saved safely. Sign in to continue with delivery details and payment.</p>
      <button type="button" className="mk-primary-button" onClick={onLogin}>LOGIN TO REVIEW CART</button>
    </section>
  );
  if (!address) return (
    <section className="mk-cart-address-card">
      <div className="mk-cart-section-heading"><div><span className="mk-cart-eyebrow">DELIVERY ADDRESS</span><h2>Where should we deliver?</h2></div></div>
      <p className="mk-address-help">Start with your pincode. We’ll check delivery, then you can fill the address manually or use your location.</p>
      <button type="button" className="mk-primary-button" onClick={onAdd}>+ ADD DELIVERY ADDRESS</button>
    </section>
  );
  return (
    <section className="mk-cart-address-card">
      <div className="mk-cart-section-heading"><div><span className="mk-cart-eyebrow">DELIVERY ADDRESS</span><h2>{address.full_name || address.name || "Delivery address"}</h2></div><button type="button" onClick={onChange}>CHANGE</button></div>
      <div className="mk-address-details"><strong>{address.phone}</strong><p>{[address.house_flat || address.house, address.street, address.landmark].filter(Boolean).join(", ")}</p><p>{[address.area || address.area_name, address.city, address.state, address.pincode || address.pin].filter(Boolean).join(", ")}</p></div>
    </section>
  );
}
