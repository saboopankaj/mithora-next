"use client";

type Props = {
  total: number;
  disabled: boolean;
  loading: boolean;
  loginRequired: boolean;
  onPay: () => void;
};

export default function PaymentFooter({
  total,
  disabled,
  loading,
  loginRequired,
  onPay,
}: Props) {
  const actionDisabled = loginRequired
    ? loading
    : disabled || loading;

  return (
    <div className="mk-payment-footer">
      <div className="mk-payment-total">
        {loginRequired ? (
          <>
            <span>ORDER TOTAL</span>
            <strong className="mk-payment-total-pending">
              Sign in to see your total
            </strong>
          </>
        ) : (
          <>
            <span>Total to pay</span>
            <strong>₹{Number(total || 0).toFixed(0)}</strong>
          </>
        )}
      </div>

      <div className="mk-payment-footer-action">
        <small>
          {loginRequired
            ? "Your cart is saved"
            : "🔒 Secure payment via Razorpay"}
        </small>

        <button
          type="button"
          className="mk-primary-button"
          disabled={actionDisabled}
          onClick={onPay}
        >
          {loading
            ? "PROCESSING…"
            : loginRequired
              ? "SIGN IN TO CONTINUE"
              : "PLACE ORDER"}
          {!loading ? <span>→</span> : null}
        </button>
      </div>
    </div>
  );
}
