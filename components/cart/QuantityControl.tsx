"use client";

type Props = {
  qty: number;
  onChange: (qty: number) => void;
};

export default function QuantityControl({ qty, onChange }: Props) {
  return (
    <div className="mk-cart-qty" onClick={(event) => event.stopPropagation()}>
      <button type="button" onClick={() => onChange(qty - 1)} aria-label="Decrease">
        −
      </button>
      <span>{qty}</span>
      <button type="button" onClick={() => onChange(qty + 1)} aria-label="Increase">
        +
      </button>
    </div>
  );
}
