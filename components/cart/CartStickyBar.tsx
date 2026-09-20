"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useCart } from "./CartProvider";

export default function CartStickyBar() {
  const { itemCount, validatedCart } = useCart();
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    setHydrated(true);
  }, []);

  // Prevent server/client hydration mismatch.
  // Cart data is restored from localStorage on the client.
  if (!hydrated || !itemCount) {
    return null;
  }

  const total =
    validatedCart?.total != null
      ? `₹${validatedCart.total.toFixed(0)}`
      : "";

  return (
    <div className="mk-cart-sticky">
      <div className="mk-cart-sticky-inner">
        <div>
          <strong>
            {itemCount} item{itemCount === 1 ? "" : "s"}
          </strong>

          {total && <span>{total}</span>}
        </div>

        <Link
          href="/cart"
          className="mk-cart-sticky-button"
        >
          VIEW CART
        </Link>
      </div>
    </div>
  );
}