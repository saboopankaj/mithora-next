"use client";

export default function QuantityControl({
  quantity,
  onDecrease,
  onIncrease,
}: {
  quantity: number;
  onDecrease: () => void;
  onIncrease: () => void;
}) {
  return (
    <div className="menu-quantity-control">

      <button
        type="button"
        onClick={onDecrease}
      >
        −
      </button>

      <strong>
        {quantity}
      </strong>

      <button
        type="button"
        onClick={onIncrease}
      >
        +
      </button>

    </div>
  );
}

/* =====================================================
   PRODUCT MODAL
===================================================== */
