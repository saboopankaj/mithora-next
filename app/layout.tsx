import "./globals.css";
import "@/styles/layout.css";
import "@/styles/home.css";
import "@/styles/auth.css";
import "@/styles/account.css";
import "@/styles/menu.css";
import "@/styles/cart.css";
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