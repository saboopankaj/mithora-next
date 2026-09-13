"use client";

import type { Address } from "./types";

type Props = {
  open: boolean;
  addresses: Address[];
  selectedId?: number | string;
  onClose: () => void;
  onSelect: (address: Address) => void;
  onAdd: () => void;
  onSetDefault: (id: number | string) => void;
};

export default function AddressPicker({
  open,
  addresses,
  selectedId,
  onClose,
  onSelect,
  onAdd,
  onSetDefault,
}: Props) {
  if (!open) return null;

  return (
    <div className="mk-overlay" onClick={onClose}>
      <aside
        className="mk-address-drawer"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="mk-drawer-header">
          <div>
            <span className="mk-cart-eyebrow">SAVED ADDRESSES</span>
            <h2>Choose delivery address</h2>
          </div>
          <button type="button" onClick={onClose} aria-label="Close">×</button>
        </div>

        <div className="mk-address-list">
          {addresses.map((address, index) => {
            const id = address.id ?? index;
            const selected =
              selectedId != null && String(selectedId) === String(id);

            return (
              <button
                type="button"
                key={String(id)}
                className={`mk-address-option ${selected ? "is-selected" : ""}`}
                onClick={() => onSelect(address)}
              >
                <div>
                  <strong>{address.full_name || address.name || "Address"}</strong>
                  {address.is_default && <span className="mk-default-badge">DEFAULT</span>}
                </div>
                <p>
                  {[
                    address.house_flat || address.house,
                    address.street,
                    address.area || address.area_name,
                    address.city,
                    address.pincode || address.pin,
                  ].filter(Boolean).join(", ")}
                </p>

                {address.id != null && !address.is_default && (
                  <span
                    className="mk-set-default"
                    onClick={(event) => {
                      event.stopPropagation();
                      onSetDefault(address.id!);
                    }}
                  >
                    Mark Default
                  </span>
                )}
              </button>
            );
          })}
        </div>

        <button type="button" className="mk-primary-button mk-full-button" onClick={onAdd}>
          + ADD NEW ADDRESS
        </button>
      </aside>
    </div>
  );
}
