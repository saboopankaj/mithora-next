"use client";

import type {
  CartItem,
  CategoryAvailability,
  Product,
  ProductBadge,
  ProductTag,
} from "./types";

import QuantityControl from "./QuantityControl";

import {
  canOrderFromAvailability,
  getActiveVariantFromCart,
  getDiscount,
  getNumber,
  getQuantityForProduct,
  isFeatured,
} from "./menu-utils";

export default function MenuProductCard({
  product,
  availability,
  cart,
  onOpen,
  onAdd,
  onNotify,
}: {
  product: Product;
  availability?: CategoryAvailability;

  cart: {
    items: CartItem[];
  };

  onOpen: (product: Product) => void;

  onAdd: (
    variantId: number | string,
    delta: number
  ) => void;

  onNotify: (
    product: Product
  ) => void;
}) {
  const variants = product.variants || [];

  if (!variants.length) {
    return null;
  }

  const activeVariant =
    getActiveVariantFromCart(
      product,
      cart
    ) || variants[0];

  const quantity =
    getQuantityForProduct(
      product,
      cart
    );

  const canOrder =
    canOrderFromAvailability(
      availability
    );

  const isSubscription =
    availability?.delivery_type ===
    "SUBSCRIPTION";

  const isMulti =
    variants.length > 1;

  const price =
    getNumber(activeVariant.price);

  const oldPrice =
    getNumber(activeVariant.old_price);

  const discount =
    getDiscount(
      price,
      oldPrice
    );

  const rating =
    getNumber(product.avg_rating);

  const reviewCount =
    getNumber(product.review_count);

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
    <article
      className="menu-product-card"
      onClick={() =>
        onOpen(product)
      }
    >

      {/* =================================================
          IMAGE
          ================================================= */}

      <div className="menu-product-image">

        <img
          src={
            product.image_path ||
            "/images/placeholder.png"
          }
          alt={product.name}
          loading="lazy"
        />

{primaryBadge && (
  <span className="menu-card-featured-badge">
    {primaryBadge.icon ? `${primaryBadge.icon} ` : "★ "}
    {primaryBadge.display_text}
  </span>
)}

      </div>


      {/* =================================================
          CONTENT
          ================================================= */}

      <div className="menu-product-body">

        {/* PRODUCT NAME */}

        <h3 className="menu-product-title">
          {product.name}
        </h3>


        {/* TAGS */}

{productTags.length > 0 && (
  <div className="menu-product-tags">
    {productTags.map((tag) => (
      <span
        key={String(tag.id)}
        className="menu-product-tag"
      >
        {tag.name}
      </span>
    ))}
  </div>
)}


        {/* DESCRIPTION */}

        <div className="menu-description-area">

          <p className="menu-product-description">
            {product.description || ""}
          </p>

          {product.description && (
            <button
              type="button"
              className="menu-read-more"
              onClick={(event) => {
                event.stopPropagation();
                onOpen(product);
              }}
            >
              Read more
            </button>
          )}

        </div>


        {/* =================================================
            PRICE + ACTION
            ================================================= */}

        <div
          className="menu-product-bottom"
          onClick={(event) =>
            event.stopPropagation()
          }
        >

          {/* PRICE */}

          <div className="menu-price-block">

            <div className="menu-price-top">

              {oldPrice > price && (
                <span className="menu-old-price">
                  ₹{oldPrice}
                </span>
              )}

              {discount > 0 && (
                <span className="menu-discount-inline">
                  {discount}% OFF
                </span>
              )}

            </div>

            <strong className="menu-selling-price">
              ₹{price}
            </strong>

          </div>


          {/* ACTION */}

          <div
            className="menu-product-action"
            onClick={(event) =>
              event.stopPropagation()
            }
          >

            {quantity > 0 ? (

              <QuantityControl
                quantity={quantity}
                onDecrease={() =>
                  onAdd(
                    activeVariant.id,
                    -1
                  )
                }
                onIncrease={() =>
                  onAdd(
                    activeVariant.id,
                    1
                  )
                }
              />

            ) : !canOrder ? (

              <button
                type="button"
                className="menu-btn-primary"
                onClick={() =>
                  onNotify(product)
                }
              >
                NOTIFY ME
              </button>

            ) : isSubscription ? (

              <button
                type="button"
                className="menu-btn-primary"
                onClick={() =>
                  onOpen(product)
                }
              >
                SUBSCRIBE
              </button>

            ) : isMulti ? (

              <button
                type="button"
                className="menu-btn-primary"
                onClick={() =>
                  onOpen(product)
                }
              >
                CUSTOMIZE
              </button>

            ) : (

              <button
                type="button"
                className="menu-btn-primary"
                onClick={() =>
                  onAdd(
                    activeVariant.id,
                    1
                  )
                }
              >
                ADD
              </button>

            )}

          </div>

        </div>

      </div>

    </article>
  );
}