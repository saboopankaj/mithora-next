import MenuShell from "@/components/menu/MenuShell";
import CartProvider from "@/components/cart/CartProvider";

export default function MenuPage() {
  return (
    <CartProvider>
      <MenuShell />
    </CartProvider>
  );
}