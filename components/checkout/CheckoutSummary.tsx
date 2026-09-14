"use client";

import { useCart } from "@/components/cart/CartProvider";

function money(value: number) {
  return `₹${Number(value || 0).toFixed(0)}`;
}

export default function CheckoutSummary() {
  const { validatedCart } = useCart();

  if (!validatedCart) {
    return (
      <section className="mk-checkout-card">
        <h2>Order Summary</h2>
        <p>Validating your order…</p>
      </section>
    );
  }

  return (
    <section className="mk-checkout-card">
      <div className="mk-checkout-card-heading">
        <div>
          <span className="mk-cart-eyebrow">ORDER SUMMARY</span>
          <h2>{validatedCart.items.length} items</h2>
        </div>
      </div>

      <div className="mk-checkout-order-items">
        {validatedCart.items.map((item) => (
          <div key={String(item.variant_id)}>
            <span>
              {item.name} × {item.qty}
            </span>
            <strong>{money(item.line_total)}</strong>
          </div>
        ))}
      </div>

      <div className="mk-summary-lines">
        <div><span>Item Total</span><strong>{money(validatedCart.subtotal)}</strong></div>
        <div><span>Delivery</span><strong>{validatedCart.is_free_delivery ? "FREE" : money(validatedCart.shipping)}</strong></div>
        {Number(validatedCart.free_delivery_min || 0) > 0 && !validatedCart.is_free_delivery && Number(validatedCart.free_delivery_remaining || 0) > 0 && (
          <div className="mk-free-delivery-message">🚚 Add ₹{Number(validatedCart.free_delivery_remaining).toFixed(0)} more for FREE delivery</div>
        )}
        {Number(validatedCart.free_delivery_min || 0) > 0 && validatedCart.is_free_delivery && (
          <div className="mk-free-delivery-message">🚚 FREE delivery unlocked</div>
        )}
        {validatedCart.discount > 0 && (
          <div className="mk-discount-line">
            <span>Discount</span>
            <strong>−{money(validatedCart.discount)}</strong>
          </div>
        )}
      </div>

      {validatedCart.is_external_zone && (
        <div className="mk-distance-warning">⚠️ Distance charges applied for this location.</div>
      )}

      <div className="mk-summary-total">
        <span>To Pay</span>
        <strong>{money(validatedCart.total)}</strong>
      </div>
    </section>
  );
}
