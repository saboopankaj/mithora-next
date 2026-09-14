import "./globals.css";
//import "@/styles/layout.css";
import "@/styles/common/header.css";
import "@/styles/common/footer.css";
//import "@/styles/home.css";
import "../styles/home/home-catering.css";
import "../styles/home/home-discovery.css";
import "../styles/home/home-faq.css";
import "../styles/home/home-food-categories.css";
import "../styles/home/home-global.css";
import "../styles/home/home-hero.css";
import "../styles/home/home-live-order.css";
import "../styles/home/home-offers.css";
import "../styles/home/home-party.css";
import "../styles/home/home-quick-links.css";
import "../styles/home/home-seo-features.css";
import "../styles/home/home-services.css";
import "../styles/home/home-signature.css";
import "../styles/home/home-snacks.css";
import "../styles/home/home-taste-box.css";
import "../styles/home/home-vrat.css";
import "../styles/home/home-why-mithora.css";
import "../styles/home/home-youtube.css";
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