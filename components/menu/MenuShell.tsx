"use client";

import { useEffect, useMemo, useState } from "react";

type Category = {
  id: number | string;
  name: string;
  icon_svg?: string;
  [key: string]: unknown;
};

type Variant = {
  id: number | string;
  variant_name?: string;
  price?: number | string;
  old_price?: number | string;
  [key: string]: unknown;
};

type Product = {
  id: number | string;
  category_id: number | string;
  name: string;
  description?: string;
  image_path?: string;
  avg_rating?: number | string;
  review_count?: number | string;
  variants?: Variant[];
  [key: string]: unknown;
};

type CategoryAvailability = {
  category_id: number | string;
  status?: string;
  orderable_now?: boolean;
  delivery_type?: string;
  user_message?: string;
  [key: string]: unknown;
};

export default function MenuShell() {
  const [sticky, setSticky] = useState(false);

  const [categories, setCategories] = useState<Category[]>([]);
  const [products, setProducts] = useState<Product[]>([]);

  const [categoryAvailability, setCategoryAvailability] =
    useState<Record<string, CategoryAvailability>>({});

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const handleScroll = () => {
      setSticky(window.scrollY > 140);
    };

    window.addEventListener("scroll", handleScroll, {
      passive: true,
    });

    return () => {
      window.removeEventListener("scroll", handleScroll);
    };
  }, []);

  useEffect(() => {
    let cancelled = false;

    async function loadMenu() {
      try {
        setLoading(true);
        setError("");

        const [
          categoriesResponse,
          productsResponse,
        ] = await Promise.all([
          fetch("/api/menu/categories?active=1"),
          fetch("/api/menu/products"),
        ]);

        if (!categoriesResponse.ok) {
          throw new Error("Failed to load categories");
        }

        if (!productsResponse.ok) {
          throw new Error("Failed to load products");
        }

        const categoriesData =
          await categoriesResponse.json();

        const productsData =
          await productsResponse.json();

        const loadedCategories: Category[] =
          categoriesData.categories || [];

        const loadedProducts: Product[] =
          productsData.products || [];

        let loadedAvailability: Record<
          string,
          CategoryAvailability
        > = {};

        try {
          const availabilityResponse = await fetch(
            "/api/menu/category-availability"
          );

          if (availabilityResponse.ok) {
            const availabilityData =
              await availabilityResponse.json();

            (availabilityData.categories || []).forEach(
              (category: CategoryAvailability) => {
                loadedAvailability[
                  String(category.category_id)
                ] = category;
              }
            );
          }
        } catch (availabilityError) {
          console.error(
            "Category availability failed:",
            availabilityError
          );
        }

        if (cancelled) return;

        setCategories(loadedCategories);
        setProducts(loadedProducts);
        setCategoryAvailability(
          loadedAvailability
        );
      } catch (err) {
        console.error("Menu loading failed:", err);

        if (!cancelled) {
          setError(
            "Unable to load the menu right now."
          );
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    loadMenu();

    return () => {
      cancelled = true;
    };
  }, []);

  /*
   * Group products using the existing category_id
   * relationship from the Mithora menu data.
   */
  const categorySections = useMemo(() => {
    return categories
      .map((category) => {
        const categoryProducts = products.filter(
          (product) =>
            String(product.category_id) ===
            String(category.id)
        );

        return {
          category,
          products: categoryProducts,
          availability:
            categoryAvailability[
              String(category.id)
            ],
        };
      })
      .filter(
        (section) => section.products.length > 0
      );
  }, [
    categories,
    products,
    categoryAvailability,
  ]);

  return (
    <section className="menu-page-shell">

      {/* LOCATION */}
      <div className="menu-location-bar">
        <div className="menu-shell-container">
          <button
            type="button"
            className="menu-location-button"
          >
            <span className="menu-location-pin">
              ⌖
            </span>

            <span className="menu-location-copy">
              <span className="menu-location-label">
                Delivering to
              </span>

              <strong>Jaipur</strong>
            </span>

            <span className="menu-location-change">
              Change
            </span>
          </button>
        </div>
      </div>

      {/* HEADER */}
      <div className="menu-header-area">
        <div className="menu-shell-container">

          <div className="menu-heading">
            <span className="menu-eyebrow">
              MITHORA KITCHEN
            </span>

            <h1>Our Menu</h1>

            <p>
              Homemade food, freshly prepared with care.
            </p>
          </div>

          <MenuControls
            categories={categories}
          />

        </div>
      </div>

      {/* STICKY HEADER */}
      <div
        className={`menu-sticky-bar ${
          sticky
            ? "menu-sticky-bar-visible"
            : ""
        }`}
      >
        <div className="menu-shell-container menu-sticky-inner">

          <div className="menu-sticky-search">
            <span>⌕</span>

            <span>
              Search dishes, snacks, tiffin & more
            </span>
          </div>

          <nav className="menu-sticky-categories">

            <button
              type="button"
              className="menu-category active"
            >
              All Items
            </button>

            {categories.map((category) => (
              <button
                type="button"
                key={category.id}
                className="menu-category"
              >
                {category.name}
              </button>
            ))}

          </nav>

        </div>
      </div>

      {/* CONTENT */}
      <div className="menu-shell-container menu-content">

        {loading && (
          <div className="menu-loading">
            <div className="menu-loading-card">
              Loading Mithora menu...
            </div>
          </div>
        )}

        {!loading && error && (
          <div className="menu-error">
            {error}
          </div>
        )}

        {!loading &&
          !error &&
          categorySections.map(
            ({
              category,
              products,
              availability,
            }) => (
              <section
                className="menu-category-section"
                key={category.id}
                id={`menu-category-${category.id}`}
              >

                {/* CATEGORY HEADER */}
                <div className="menu-category-header">

                  <div className="menu-category-title-wrap">

                    {category.icon_svg && (
                      <span
                        className="menu-category-icon"
                        dangerouslySetInnerHTML={{
                          __html:
                            category.icon_svg,
                        }}
                      />
                    )}

                    <div>
                      <h2>
                        {category.name}
                      </h2>

                      <span>
                        {products.length}{" "}
                        {products.length === 1
                          ? "item"
                          : "items"}
                      </span>
                    </div>

                  </div>

                  {availability && (
                    <div
                      className={`menu-availability ${
                        availability.orderable_now
                          ? "available"
                          : "closed"
                      }`}
                    >
                      <span className="menu-availability-dot" />

                      <span>
                        {availability.user_message ||
                          (availability.orderable_now
                            ? "Available now"
                            : "Currently unavailable")}
                      </span>
                    </div>
                  )}

                </div>

                {/* PRODUCTS */}
                <div className="menu-product-grid">

                  {products.map((product) => (
                    <ProductCard
                      key={product.id}
                      product={product}
                      availability={
                        availability
                      }
                    />
                  ))}

                </div>

              </section>
            )
          )}

      </div>

    </section>
  );
}

function MenuControls({
  categories,
}: {
  categories: Category[];
}) {
  return (
    <div className="menu-controls">

      <div className="menu-search-box">

        <span className="menu-search-icon">
          ⌕
        </span>

        <input
          type="text"
          placeholder="Search dishes, snacks, tiffin & more"
        />

        <button
          type="button"
          className="menu-filter-button"
          aria-label="Filter menu"
        >
          ☷
        </button>

      </div>

      <div className="menu-category-row">

        <button
          type="button"
          className="menu-category active"
        >
          All Items
        </button>

        {categories.map((category) => (
          <button
            type="button"
            key={category.id}
            className="menu-category"
          >
            {category.name}
          </button>
        ))}

      </div>

    </div>
  );
}

function ProductCard({
  product,
  availability,
}: {
  product: Product;
  availability?: CategoryAvailability;
}) {
  const variants = Array.isArray(
    product.variants
  )
    ? product.variants
    : [];

  if (variants.length === 0) {
    return null;
  }

  const firstVariant = variants[0];

  const price = firstVariant?.price;

  const oldPrice =
    firstVariant?.old_price;

  const rating = Number(
    product.avg_rating || 0
  );

  const reviewCount = Number(
    product.review_count || 0
  );

  const canOrder = availability
    ? Boolean(
        availability.orderable_now ||
          availability.status ===
            "OPEN" ||
          availability.status ===
            "NEXT_DAY" ||
          availability.delivery_type ===
            "SUBSCRIPTION"
      )
    : true;

  const discount =
    oldPrice && Number(oldPrice) > Number(price)
      ? Math.round(
          ((Number(oldPrice) -
            Number(price)) /
            Number(oldPrice)) *
            100
        )
      : 0;

  return (
    <article className="menu-product-card">

      {/* IMAGE */}
      <div className="menu-product-image-wrap">

        {product.image_path ? (
          <img
            src={product.image_path}
            alt={product.name}
            className="menu-product-image"
          />
        ) : (
          <div className="menu-product-image-placeholder">
            Mithora Kitchen
          </div>
        )}

        {discount > 0 && (
          <span className="menu-discount-badge">
            {discount}% OFF
          </span>
        )}

      </div>

      {/* DETAILS */}
      <div className="menu-product-details">

        <div className="menu-product-title-row">

          <h3>
            {product.name}
          </h3>

          {rating >= 0.5 && (
            <div className="menu-product-rating">
              <span>★</span>
              <strong>
                {rating.toFixed(1)}
              </strong>

              {reviewCount > 0 && (
                <small>
                  ({reviewCount})
                </small>
              )}
            </div>
          )}

        </div>

        {product.description && (
          <p className="menu-product-description">
            {product.description}
          </p>
        )}

        <div className="menu-product-bottom">

          <div className="menu-price">

            <strong>
              ₹{price}
            </strong>

            {oldPrice && (
              <del>
                ₹{oldPrice}
              </del>
            )}

          </div>

          <button
            type="button"
            className={
              canOrder
                ? "menu-add-button"
                : "menu-notify-button"
            }
          >
            {canOrder
              ? variants.length > 1
                ? "VIEW"
                : "ADD"
              : "NOTIFY"}
          </button>

        </div>

      </div>

    </article>
  );
}