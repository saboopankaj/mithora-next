"use client";

type Props = {
  total: number;
  disabled: boolean;
  loading: boolean;
  onPay: () => void;
};

export default function PaymentFooter({
  total,
  disabled,
  loading,
  onPay,
}: Props) {
  return (
    <footer className="mk-payment-footer">
      <div>
        <span>To Pay</span>
        <strong>₹{Number(total || 0).toFixed(0)}</strong>
      </div>
      <div className="mk-payment-footer-action">
        <small>🔒 Secure payment via Razorpay</small>
        <button
          type="button"
          className="mk-primary-button"
          disabled={disabled || loading}
          onClick={onPay}
        >
          {loading ? "PROCESSING…" : "PLACE ORDER"}
        </button>
      </div>
    </footer>
  );
}
