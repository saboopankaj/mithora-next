# Integration

## 1. Add CartProvider to the existing AuthProvider tree

In `app/layout.tsx`, keep the existing AuthProvider and add CartProvider inside it:

```tsx
import CartProvider from "@/components/cart/CartProvider";

<AuthProvider>
  <CartProvider>
    {children}
  </CartProvider>
</AuthProvider>
```

The exact nesting can be adjusted to your existing layout. CartProvider does not require authentication.

## 2. Connect the Menu ADD button

The existing menu product card should call:

```tsx
const { addItem } = useCart();

addItem(productVariantId, 1);
```

For a quantity already selected:

```tsx
addItem(productVariantId, qty);
```

The cart provider automatically updates the count and sticky bar.

## 3. Add the sticky cart bar globally

Place this once inside the provider/layout tree:

```tsx
<CartStickyBar />
```

A simple layout arrangement is:

```tsx
<CartProvider>
  {children}
  <CartStickyBar />
</CartProvider>
```

## 4. Header cart icon

The header can later use:

```tsx
const { itemCount } = useCart();
```

and link to:

```text
/cart
```

The same count is already available globally.

## 5. Existing CSS

This dump has `styles/cart.css` and `styles/checkout.css`.

Import them from `app/layout.tsx`:

```tsx
import "@/styles/cart.css";
import "@/styles/checkout.css";
```

## 6. Auth

The checkout page requires a logged-in user.

The implementation checks:

```tsx
getAuthToken()
getCurrentUser()
```

and redirects to `/` while preserving:

```text
?next=/checkout
```

If the existing AuthModal supports a redirect callback, wire that callback to `/checkout`.

## 7. Razorpay

The checkout module loads:

```text
https://checkout.razorpay.com/v1/checkout.js
```

The Worker supplies the Razorpay key and order details.

## 8. Long-distance popup

`DistanceChargeModal` is intentionally shared.

Cart:

```tsx
<DistanceChargeModal
  open={distancePopupOpen}
  onClose={() => setDistancePopupOpen(false)}
  validatedCart={validatedCart}
/>
```

Checkout uses the same component.

The popup is informational. The actual shipping/distance amount is always taken from the server response.

## 9. Backend

Your current `/api/cart/sync` already recalculates:

- item prices
- subtotal
- shipping
- coupon discount
- final total
- pincode/zone information

The payment endpoint should repeat this validation before creating the Razorpay order. See `worker-patch/create-order-security.md`.

