import "./globals.css";
import "@/styles/layout.css";
import "@/styles/home.css";
import "@/styles/auth.css";
import "@/styles/account.css";
import "@/styles/menu.css";
//import "@/styles/cart.css";
import "../styles/cart/cart-page.css";
import "../styles/cart/cart-items.css";
import "../styles/cart/cart-summary.css";
import "../styles/cart/cart-address.css";
import "../styles/cart/cart-coupon.css";
import "../styles/cart/cart-distance.css";
import "../styles/cart/cart-payment.css";
import "../styles/order-confirmation.css";
import Header from "@/components/common/Header";
import Footer from "@/components/common/Footer";
import { AuthProvider } from "@/components/auth/AuthContext";
import CartProvider from "@/components/cart/CartProvider";
import CartStickyBar from "@/components/cart/CartStickyBar";
export const metadata = {
  title: "Mithora Kitchen | Homemade Food in Jaipur",
  description:
    "Homemade food, party catering, bulk food orders and tiffin service in Jaipur.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>
<AuthProvider>
  <CartProvider>
    <Header />

    {children}

    <CartStickyBar />

    <Footer />
  </CartProvider>
</AuthProvider>
      </body>
    </html>
  );
}