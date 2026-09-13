import CheckoutShell from "@/components/checkout/CheckoutShell";
import CartProvider from "@/components/cart/CartProvider";

export default function CheckoutPage() {
  return (
    <CartProvider>
      <CheckoutShell />
    </CartProvider>
  );
}