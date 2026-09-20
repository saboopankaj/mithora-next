"use client";

type Props = {
  qty: number;
  onChange: (qty: number) => void;
  disabled?: boolean;
};

export default function QuantityControl({
  qty,
  onChange,
  disabled = false,
}: Props) {
  return (
    <div
      className={`mk-cart-qty${disabled ? " is-disabled" : ""}`}
      onClick={(event) => event.stopPropagation()}
    >
      <button
        type="button"
        onClick={() => onChange(qty - 1)}
        aria-label="Decrease quantity"
        disabled={disabled}
      >
        −
      </button>
      <span>{qty}</span>
      <button
        type="button"
        onClick={() => onChange(qty + 1)}
        aria-label="Increase quantity"
        disabled={disabled}
      >
        +
      </button>
    </div>
  );
}
