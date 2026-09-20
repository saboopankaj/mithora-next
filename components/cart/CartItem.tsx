"use client";

import Image from "next/image";
import { useCart } from "./CartProvider";
import QuantityControl from "./QuantityControl";
import type { ValidatedCartItem } from "./types";

export default function CartItem({
  item,
}: {
  item: ValidatedCartItem;
}) {
  const { updateQty, removeItem } = useCart();
  const unavailable = item.available === false;

  return (
    <article className={`mk-cart-item${unavailable ? " is-unavailable" : ""}`}>
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
          <div className="mk-cart-item-copy">
            <h3>{item.name}</h3>
            {item.variant_name ? <small>{item.variant_name}</small> : null}
          </div>
        </div>

        {unavailable ? (
          <div className="mk-cart-item-unavailable">
            <div>
              <strong>Currently unavailable</strong>
              <small>
                {item.availability_reason ||
                  "No longer available for your selected delivery window."}
              </small>
            </div>
            <button
              type="button"
              onClick={() => removeItem(item.variant_id)}
            >
              REMOVE
            </button>
          </div>
        ) : (
          <div className="mk-cart-item-bottom">
            <strong>₹{Number(item.price).toFixed(0)}</strong>

            <QuantityControl
              qty={item.qty}
              onChange={(qty) => updateQty(item.variant_id, qty)}
            />
          </div>
        )}
      </div>
    </article>
  );
}
