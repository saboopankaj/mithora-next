import type { Metadata } from "next";
import "./globals.css";
import "../styles/layout.css";
import "../styles/home.css";

import Header from "../components/Header";
import Footer from "../components/Footer";

export const metadata: Metadata = {
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
        <Header />

        {children}

        <Footer />
      </body>
    </html>
  );
}