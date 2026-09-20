"use client";

import type { ValidatedCart } from "./types";
import ModalPortal from "./ModalPortal";

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
    <ModalPortal>
      <div className="mk-overlay mk-distance-overlay" role="dialog" aria-modal="true">
        <div className="mk-distance-modal">
          <div className="mk-distance-accent" />
          <div className="mk-distance-icon" aria-hidden="true">🛵</div>

          <h2>Long-distance Delivery</h2>
          <p>
            Our kitchen is in <strong>Murlipura</strong>. Since your location is
            a little farther away, a small distance fee applies to ensure your
            food reaches you fresh and hot! 🥘
          </p>

          {shipping > 0 ? (
            <div className="mk-distance-charge">
              <span>Delivery charge</span>
              <strong>₹{shipping.toFixed(0)}</strong>
            </div>
          ) : null}

          <small className="mk-distance-location">Delivery to {place}</small>

          <button type="button" className="mk-primary-button" onClick={onClose}>
            I UNDERSTAND!
          </button>
        </div>
      </div>
    </ModalPortal>
  );
}
