"use client";

import type { Address } from "./types";
import ModalPortal from "./ModalPortal";

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
    <ModalPortal>
      <div
      className="mk-overlay mk-address-overlay"
      onClick={onClose}
    >
      <aside
        className="mk-address-drawer"
        onClick={(event) => event.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-label="Saved addresses"
      >
        <div className="mk-address-drawer-topbar">
          <button
            type="button"
            className="mk-drawer-back"
            onClick={onClose}
            aria-label="Back"
          >
            ←
          </button>

          <div>
            <span className="mk-cart-eyebrow">
              DELIVERY ADDRESS
            </span>
            <h2>Saved addresses</h2>
          </div>

          <button
            type="button"
            className="mk-drawer-close"
            onClick={onClose}
            aria-label="Close"
          >
            ×
          </button>
        </div>

        <div className="mk-address-drawer-body">
          {addresses.length ? (
            <div className="mk-address-list">
              {addresses.map((address, index) => {
                const id = address.id ?? index;
                const selected =
                  selectedId != null &&
                  String(selectedId) === String(id);

                return (
                  <div
                    key={String(id)}
                    className={`mk-address-option ${
                      selected ? "is-selected" : ""
                    }`}
                  >
                    <button
                      type="button"
                      className="mk-address-option-main"
                      onClick={() => onSelect(address)}
                    >
                      <div className="mk-address-option-title">
                        <strong>
                          {address.full_name ||
                            address.name ||
                            "Address"}
                        </strong>

                        {address.is_default ? (
                          <span className="mk-default-badge">
                            DEFAULT
                          </span>
                        ) : null}
                      </div>

                      <p>
                        {[
                          address.house_flat ||
                            address.house,
                          address.street,
                          address.area ||
                            address.area_name,
                          address.city,
                          address.state,
                          address.pincode ||
                            address.pin,
                        ]
                          .filter(Boolean)
                          .join(", ")}
                      </p>
                    </button>

                    <div className="mk-address-option-footer">
                      <span
                        className={
                          selected
                            ? "mk-address-selected-label"
                            : "mk-address-select-label"
                        }
                      >
                        {selected ? "✓ Selected" : "Select"}
                      </span>

                      {address.id != null &&
                      !address.is_default ? (
                        <button
                          type="button"
                          className="mk-set-default"
                          onClick={() =>
                            onSetDefault(address.id!)
                          }
                        >
                          Make default
                        </button>
                      ) : null}
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="mk-address-empty-list">
              <div>⌖</div>
              <strong>No saved addresses yet</strong>
              <span>
                Add your first delivery address to continue.
              </span>
            </div>
          )}
        </div>

        <div className="mk-address-drawer-footer">
          <button
            type="button"
            className="mk-primary-button mk-full-button"
            onClick={onAdd}
          >
            ＋ ADD NEW ADDRESS
          </button>
        </div>
      </aside>
      </div>
    </ModalPortal>
  );
}
