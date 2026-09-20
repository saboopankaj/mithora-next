"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { useCart } from "./CartProvider";

export default function CartStickyBar() {
  const pathname = usePathname();
  const { itemCount, validatedCart } = useCart();
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    setHydrated(true);
  }, []);

  if (pathname === "/cart") return null;
  if (!hydrated || !itemCount) return null;

  const total =
    validatedCart?.total != null
      ? `₹${validatedCart.total.toFixed(0)}`
      : "";

  return (
    <div className="mk-cart-sticky">
      <div className="mk-cart-sticky-inner">
        <div className="mk-cart-sticky-info">
          <span className="mk-cart-sticky-count">
            {itemCount} {itemCount === 1 ? "item" : "items"}
          </span>
          {total ? (
            <>
              <span className="mk-cart-sticky-dot">•</span>
              <strong>{total}</strong>
            </>
          ) : null}
        </div>

        <Link
          href="/cart"
          className="mk-cart-sticky-button"
        >
          VIEW CART <span>›</span>
        </Link>
      </div>
    </div>
  );
}
