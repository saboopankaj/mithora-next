"use client";

import { useState } from "react";
import type {
  CartItem,
  CategoryAvailability,
  Product,
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
  const [descriptionExpanded, setDescriptionExpanded] =
    useState(false);

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

  const subscription =
    availability?.delivery_type ===
    "SUBSCRIPTION";

  const isMulti =
    variants.length > 1;

  const price = getNumber(
    activeVariant.price
  );

  const oldPrice = getNumber(
    activeVariant.old_price
  );

  const discount =
    getDiscount(
      price,
      oldPrice
    );

  const rating =
    getNumber(
      product.avg_rating
    );

  const reviewCount =
    getNumber(
      product.review_count
    );

  return (
    <article className="menu-product-card">

      {/* IMAGE */}
      <button
        type="button"
        className="menu-product-image-button"
        onClick={() =>
          onOpen(product)
        }
      >
        <img
          src={
            product.image_path ||
            "/images/placeholder.png"
          }
          alt={product.name}
          loading="lazy"
        />

        {discount > 0 && (
          <span className="menu-discount-badge">
            {discount}% OFF
          </span>
        )}

        {isFeatured(product) && (
          <span className="menu-card-featured-badge">
            ★ BESTSELLER
          </span>
        )}
      </button>


      {/* CONTENT */}
      <div className="menu-product-body">

        {/* TITLE */}
        <div className="menu-product-title-row">

          <h3>
            {product.name}
          </h3>

          {rating >= 0.5 && (
            <div className="menu-rating">
              <span>★</span>

              <strong>
                {rating.toFixed(1)}
              </strong>

              <small>
                ({reviewCount})
              </small>
            </div>
          )}

        </div>


        {/* DESCRIPTION */}
        <div className="menu-description-area">

          <p
            className={`menu-product-description ${
              descriptionExpanded
                ? "expanded"
                : ""
            }`}
          >
            {product.description || ""}
          </p>

          {product.description && (
            <button
              type="button"
              className="menu-read-more"
              onClick={() =>
                setDescriptionExpanded(
                  (value) => !value
                )
              }
            >
              {descriptionExpanded
                ? "Read less"
                : "Read more"}
            </button>
          )}

        </div>


        {/* PRICE + BUTTON */}
        <div className="menu-product-bottom">

          <div className="menu-price-block">

            {oldPrice > price && (
              <span>
                ₹{oldPrice}
              </span>
            )}

            <strong>
              ₹{price}
            </strong>

          </div>


          <div className="menu-product-action">

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
                className="menu-btn-notify"
                onClick={() =>
                  onNotify(product)
                }
              >
                NOTIFY ME
              </button>

            ) : isMulti ? (

              <button
                type="button"
                className="menu-btn-primary"
                onClick={() =>
                  onOpen(product)
                }
              >
                {subscription
                  ? "SUBSCRIBE"
                  : "CUSTOMIZE"}
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
                CUSTOMIZE
              </button>

            )}

          </div>

        </div>

      </div>

    </article>
  );
}