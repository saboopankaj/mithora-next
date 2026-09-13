"use client";

import Image from "next/image";
import { useCart } from "./CartProvider";
import QuantityControl from "./QuantityControl";
import type { ValidatedCartItem } from "./types";

export default function CartItem({ item }: { item: ValidatedCartItem }) {
  const { updateQty, removeItem } = useCart();

  return (
    <article className="mk-cart-item">
      <div className="mk-cart-item-image">
        {item.image_path ? (
          <Image
            src={item.image_path}
            alt={item.name}
            width={96}
            height={96}
            unoptimized
          />
        ) : (
          <div className="mk-cart-image-placeholder">🍽️</div>
        )}
      </div>

      <div className="mk-cart-item-main">
        <div className="mk-cart-item-title-row">
          <div>
            <h3>{item.name}</h3>
            {item.variant_name && (
              <small>{item.variant_name}</small>
            )}
          </div>

          <button
            type="button"
            className="mk-cart-remove"
            onClick={() => removeItem(item.variant_id)}
          >
            Remove
          </button>
        </div>

        <div className="mk-cart-item-bottom">
          <strong>₹{Number(item.line_total).toFixed(0)}</strong>
          <QuantityControl
            qty={item.qty}
            onChange={(qty) => updateQty(item.variant_id, qty)}
          />
        </div>
      </div>
    </article>
  );
}
