"use client";
import { useCart } from "@/components/cart/CartProvider";
import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

//import CartProvider from "@/components/cart/CartProvider"; // for gloval cart funtions
import CartItem from "@/components/cart/CartItem";
import CartPincode from "@/components/cart/CartPincode";
import CartSummary from "@/components/cart/CartSummary";
import DistanceChargeModal from "@/components/cart/DistanceChargeModal";

function CartPageContent() {
  const router = useRouter();
  const { cart, validatedCart, validate } = useCart();
  const [distanceOpen, setDistanceOpen] = useState(false);

  useEffect(() => {
    if (cart.items.length && !validatedCart) {
      void validate();
    }
  }, [cart.items.length, validatedCart, validate]);

  useEffect(() => {
    if (validatedCart?.is_external_zone) {
      setDistanceOpen(true);
    }
  }, [validatedCart]);

  if (!cart.items.length) {
    return (
      <main className="mk-cart-page">
        <header className="mk-cart-page-header">
          <button
            type="button"
            onClick={() => router.back()}
            aria-label="Back"
          >
            ←
          </button>

          <h1>Review Order</h1>

          <span />
        </header>

        <section className="mk-cart-empty-page">
          <div className="mk-cart-empty-icon">🛒</div>

          <h2>Your cart is empty</h2>

          <p>Add something delicious from the Mithora menu.</p>

          <Link href="/menu" className="mk-primary-button">
            BROWSE MENU
          </Link>
        </section>
      </main>
    );
  }

  return (
    <main className="mk-cart-page">
      <header className="mk-cart-page-header">
        <button
          type="button"
          onClick={() => router.back()}
          aria-label="Back"
        >
          ←
        </button>

        <h1>Review Order</h1>

        <Link href="/menu" aria-label="Add more items">
          ＋
        </Link>
      </header>

      <div className="mk-cart-layout">
        <div className="mk-cart-main-column">
          <CartPincode onExternalZone={setDistanceOpen} />

          <section className="mk-cart-items-section">
            <div className="mk-cart-section-heading">
              <div>
                <span className="mk-cart-eyebrow">YOUR ORDER</span>

                <h2>
                  {cart.items.reduce(
                    (sum, item) => sum + item.qty,
                    0,
                  )}{" "}
                  items
                </h2>
              </div>
            </div>

            {validatedCart?.items?.length ? (
              <div className="mk-cart-items">
                {validatedCart.items.map((item) => (
                  <CartItem
                    key={String(item.variant_id)}
                    item={item}
                  />
                ))}
              </div>
            ) : (
              <div className="mk-cart-validation-loading">
                {validatedCart === null
                  ? "Validating your order…"
                  : "No valid items found."}
              </div>
            )}

            <Link href="/menu" className="mk-add-more">
              + Add more items
            </Link>
          </section>
        </div>

        <aside className="mk-cart-side-column">
          <CartSummary />
        </aside>
      </div>

      <DistanceChargeModal
        open={distanceOpen}
        onClose={() => setDistanceOpen(false)}
        validatedCart={validatedCart}
      />
    </main>
  );
}

/*export default function CartPage() {
  return (
    <CartProvider>
      <CartPageContent />
    </CartProvider>
  );
}*/ // to manage global cart from layout.tsx

export default function CartPage() {
  return <CartPageContent />;
}