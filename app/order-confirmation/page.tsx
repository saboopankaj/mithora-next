"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense } from "react";

function OrderConfirmationContent() {
  const searchParams = useSearchParams();

  const orderNo =
    searchParams.get("order_no") ||
    searchParams.get("order_id") ||
    "";

  return (
    <main className="mk-order-confirmation">
      <div className="mk-order-confirmation-card">

        <div className="mk-order-success-icon">
          ✓
        </div>

        <h1>Thank You!</h1>

        <h2>Your Order Has Been Received</h2>

        <p className="mk-order-confirmation-message">
          Your payment was successful and your order has been confirmed.
        </p>

        {orderNo && (
          <div className="mk-order-number">
            <span>Order ID</span>
            <strong>{orderNo}</strong>
          </div>
        )}

        <p className="mk-order-track-message">
          You can track your order anytime from your profile under
          <strong> Orders</strong>.
        </p>

        <div className="mk-order-confirmation-actions">
          <Link href="/account" className="mk-order-primary-btn">
            View My Orders
          </Link>

          <Link href="/menu" className="mk-order-secondary-btn">
            Continue Shopping
          </Link>
        </div>

      </div>
    </main>
  );
}

export default function OrderConfirmationPage() {
  return (
    <Suspense fallback={null}>
      <OrderConfirmationContent />
    </Suspense>
  );
}