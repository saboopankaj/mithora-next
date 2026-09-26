"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { useCart } from "./CartProvider";

export default function CartStickyBar() {
  const pathname = usePathname();
  const { itemCount } = useCart();
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    setHydrated(true);
  }, []);

  if (pathname === "/cart") return null;
  if (!hydrated || !itemCount) return null;

  return (
    <div className="mk-cart-sticky" aria-label="Cart">
      <Link href="/cart" className="mk-cart-sticky-button">
        <span className="mk-cart-sticky-count">
          {itemCount} {itemCount === 1 ? "item" : "items"}
        </span>

        <span className="mk-cart-sticky-label">
          VIEW CART
        </span>

        <span className="mk-cart-sticky-arrow" aria-hidden="true">
          →
        </span>
      </Link>
    </div>
  );
}