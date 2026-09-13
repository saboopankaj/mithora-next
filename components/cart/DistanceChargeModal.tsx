"use client";

import type { ValidatedCart } from "./types";

type Props = {
  open: boolean;
  onClose: () => void;
  validatedCart?: ValidatedCart | null;
};

export default function DistanceChargeModal({
  open,
  onClose,
  validatedCart,
}: Props) {
  if (!open) return null;

  const shipping = Number(validatedCart?.shipping || 0);
  const location = validatedCart?.location_info;
  const place =
    location?.area_name ||
    location?.area ||
    location?.city ||
    validatedCart?.pincode_status ||
    "your location";

  return (
    <div className="mk-overlay mk-distance-overlay" role="dialog" aria-modal="true">
      <div className="mk-distance-modal">
        <div className="mk-distance-icon">⌖</div>
        <span className="mk-cart-eyebrow">DELIVERY UPDATE</span>
        <h2>This location is a little farther away</h2>
        <p>
          Delivery to <strong>{place}</strong> may include an additional
          distance-based delivery charge.
        </p>

        {shipping > 0 && (
          <div className="mk-distance-charge">
            <span>Delivery charge</span>
            <strong>₹{shipping.toFixed(0)}</strong>
          </div>
        )}

        <p className="mk-distance-note">
          The final delivery charge and total are calculated by our server and
          will be shown before payment.
        </p>

        <button type="button" className="mk-primary-button" onClick={onClose}>
          CONTINUE
        </button>
      </div>
    </div>
  );
}
