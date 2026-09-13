import type { CategoryAvailability, Product } from "./types";
import { getDiscount, getNumber } from "./menu-utils";

export default function FeaturedMenu({
  products,
  index,
  availability,
  onPrevious,
  onNext,
  onSelect,
}: {
  products: Product[];
  index: number;
  availability: Record<
    string,
    CategoryAvailability
  >;
  onPrevious: () => void;
  onNext: () => void;
  onSelect: (
    product: Product
  ) => void;
}) {
  const product =
    products[index] || products[0];

  if (!product) return null;

  const variant =
    product.variants?.[0];

  if (!variant) return null;

  const price = getNumber(
    variant.price
  );

  const oldPrice = getNumber(
    variant.old_price
  );

  const discount =
    getDiscount(
      price,
      oldPrice
    );

  const rating = getNumber(
    product.avg_rating
  );

  const categoryAvailability =
    availability[
      String(product.category_id)
    ];

  return (
    <section className="menu-featured-wrap">
      <div className="menu-shell-container">

        <div className="menu-featured-card">

          <div className="menu-featured-top">
            <span>
              ★ HANDPICKED FOR YOU
            </span>

            <small>
              {index + 1} /{" "}
              {products.length}
            </small>
          </div>

          <div className="menu-featured-content">

            <button
              type="button"
              className="menu-featured-image"
              onClick={() =>
                onSelect(product)
              }
            >
              <img
                src={
                  product.image_path ||
                  "/images/placeholder.png"
                }
                alt={product.name}
              />
            </button>

            <div className="menu-featured-details">

              <span className="menu-featured-eyebrow">
                MITHORA FAVOURITE
              </span>

              <h2>
                {product.name}
              </h2>

              {product.description && (
                <p>
                  {product.description}
                </p>
              )}

              <div className="menu-featured-meta">

                {rating >= 0.5 && (
                  <span>
                    ★{" "}
                    {rating.toFixed(1)}
                  </span>
                )}

                {discount > 0 && (
                  <span>
                    {discount}% OFF
                  </span>
                )}

                {categoryAvailability?.orderable_now && (
                  <span>
                    ● Available now
                  </span>
                )}

              </div>

              <div className="menu-featured-price">
                <strong>
                  ₹{price}
                </strong>

                {oldPrice > price && (
                  <del>
                    ₹{oldPrice}
                  </del>
                )}
              </div>

              <button
                type="button"
                className="menu-featured-cta"
                onClick={() =>
                  onSelect(product)
                }
              >
                {product.variants &&
                product.variants.length > 1
                  ? "CUSTOMIZE"
                  : "ADD"}
              </button>

            </div>
          </div>

          {products.length > 1 && (
            <>
              <button
                type="button"
                className="menu-featured-arrow left"
                onClick={
                  onPrevious
                }
                aria-label="Previous"
              >
                ‹
              </button>

              <button
                type="button"
                className="menu-featured-arrow right"
                onClick={
                  onNext
                }
                aria-label="Next"
              >
                ›
              </button>

              <div className="menu-featured-dots">
                {products.map(
                  (item, dotIndex) => (
                    <button
                      type="button"
                      key={item.id}
                      className={
                        dotIndex ===
                        index
                          ? "active"
                          : ""
                      }
                      onClick={() =>
                        onSelect(
                          item
                        )
                      }
                      aria-label={`Featured item ${
                        dotIndex + 1
                      }`}
                    />
                  )
                )}
              </div>
            </>
          )}

        </div>
      </div>
    </section>
  );
}

/* =====================================================
   QUANTITY
===================================================== */
