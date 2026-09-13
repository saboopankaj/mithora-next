"use client";
import type {
  CartItem,
  CategoryAvailability,
  Product,
  ProductBadge,
  ProductTag,
} from "./types";
import QuantityControl from "./QuantityControl";
import { canOrderFromAvailability, getDiscount, getNumber } from "./menu-utils";

export default function ProductModal({
  product,
  availability,
  cart,
  onClose,
  onAdd,
  onNotify,
}: {
  product: Product;
  availability?: CategoryAvailability;
  cart: {
    items: CartItem[];
  };
  onClose: () => void;
  onAdd: (
    variantId: number | string,
    delta: number
  ) => void;
  onNotify: (
    product: Product
  ) => void;
}) {
  const variants =
    product.variants || [];

  const canOrder =
    canOrderFromAvailability(
      availability
    );

  const subscription =
    availability?.delivery_type ===
    "SUBSCRIPTION";

const productBadges: ProductBadge[] = Array.isArray(product.badges)
  ? product.badges
  : [];

const productTags: ProductTag[] = Array.isArray(product.tags)
  ? product.tags
  : [];

const primaryBadge =
  [...productBadges].sort(
    (a, b) => (a.priority ?? 999) - (b.priority ?? 999)
  )[0];

  return (
    <div
      className="menu-modal-overlay"
      onMouseDown={(event) => {
        if (
          event.target ===
          event.currentTarget
        ) {
          onClose();
        }
      }}
    >
      <div
        className="menu-product-modal"
        role="dialog"
        aria-modal="true"
      >

        <button
          type="button"
          className="menu-modal-close"
          onClick={onClose}
        >
          ×
        </button>

        <div className="menu-modal-image">
          <img
            src={
              product.image_path ||
              "/images/placeholder.png"
            }
            alt={product.name}
          />
        </div>

        <div className="menu-modal-content">

          <div className="menu-modal-title-row">

            <div>
              <span className="menu-modal-label">
                MITHORA KITCHEN
              </span>

              <h2>
                {product.name}
              </h2>

{primaryBadge && (
  <div className="menu-modal-badge">
    {primaryBadge.icon ? `${primaryBadge.icon} ` : "★ "}
    {primaryBadge.display_text}
  </div>
)}

{productTags.length > 0 && (
  <div className="menu-modal-tags">
    {productTags.map((tag) => (
      <span
        key={String(tag.id)}
        className="menu-modal-tag"
      >
        {tag.name}
      </span>
    ))}
  </div>
)}

            </div>

            {getNumber(
              product.avg_rating
            ) >= 0.5 && (
              <div className="menu-modal-rating">
                ★{" "}
                {getNumber(
                  product.avg_rating
                ).toFixed(1)}

                <small>
                  (
                  {getNumber(
                    product.review_count
                  )}
                  )
                </small>
              </div>
            )}

          </div>

          {product.description && (
            <p className="menu-modal-description">
              {product.description}
            </p>
          )}

          <div className="menu-variant-list">

            {variants.map(
              (variant) => {
                const item =
                  cart.items.find(
                    (cartItem) =>
                      String(
                        cartItem.variant_id
                      ) ===
                      String(
                        variant.id
                      )
                  );

                const quantity =
                  item?.qty || 0;

                const price =
                  getNumber(
                    variant.price
                  );

                const oldPrice =
                  getNumber(
                    variant.old_price
                  );

                const discount =
                  getDiscount(
                    price,
                    oldPrice
                  );

                return (
                  <div
                    key={
                      variant.id
                    }
                    className={`menu-variant-row ${
                      quantity > 0
                        ? "selected"
                        : ""
                    }`}
                  >

                    <div className="menu-variant-info">

                      <strong>
                        {variant.variant_name ||
                          "Regular"}
                      </strong>

                      {variant.description && (
                        <p>
                          {
                            variant.description
                          }
                        </p>
                      )}

                      <div className="menu-variant-price">

                        <strong>
                          ₹{price}
                        </strong>

                        {oldPrice >
                          price && (
                          <del>
                            ₹
                            {
                              oldPrice
                            }
                          </del>
                        )}

                        {discount >
                          0 && (
                          <span>
                            {
                              discount
                            }%
                            OFF
                          </span>
                        )}

                      </div>
                    </div>

                    <div className="menu-variant-action">

                      {quantity >
                      0 ? (
                        <QuantityControl
                          quantity={
                            quantity
                          }
                          onDecrease={() =>
                            onAdd(
                              variant.id,
                              -1
                            )
                          }
                          onIncrease={() =>
                            onAdd(
                              variant.id,
                              1
                            )
                          }
                        />
                      ) : !canOrder ? (
                        <button
                          type="button"
                          className="menu-btn-notify"
                          onClick={() =>
                            onNotify(
                              product
                            )
                          }
                        >
                          NOTIFY
                        </button>
                      ) : (
                        <button
                          type="button"
                          className="menu-btn-primary menu-variant-add"
                          onClick={() =>
                            onAdd(
                              variant.id,
                              1
                            )
                          }
                        >
                          {subscription
                            ? "SUBSCRIBE"
                            : "ADD"}
                        </button>
                      )}

                    </div>

                  </div>
                );
              }
            )}

          </div>

          <button
            type="button"
            className="menu-modal-done"
            onClick={onClose}
          >
            DONE
          </button>

        </div>
      </div>
    </div>
  );
}

/* =====================================================
   LOADER
===================================================== */
