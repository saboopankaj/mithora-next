"use client";

import { useEffect, useState } from "react";

type Category = {
  id: number | string;
  name: string;
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
  variants?: unknown[];
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
  const [categoryAvailability, setCategoryAvailability] = useState<
    Record<string, CategoryAvailability>
  >({});

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const handleScroll = () => {
      setSticky(window.scrollY > 140);
    };

    window.addEventListener("scroll", handleScroll, { passive: true });

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

        /*
         * Keep the same API structure as the existing Mithora menu:
         *
         * /api/menu/categories?active=1
         *      -> { categories: [...] }
         *
         * /api/menu/products
         *      -> { products: [...] }
         *
         * /api/menu/category-availability
         *      -> { categories: [...] }
         */

        const [categoriesResponse, productsResponse] =
          await Promise.all([
            fetch("/api/menu/categories?active=1"),
            fetch("/api/menu/products"),
          ]);

        if (!categoriesResponse.ok) {
          throw new Error("Failed to load menu categories");
        }

        if (!productsResponse.ok) {
          throw new Error("Failed to load menu products");
        }

        const categoriesData = await categoriesResponse.json();
        const productsData = await productsResponse.json();

        /*
         * Existing menu.js uses:
         *
         * data[key] || []
         *
         * So preserve that exact response handling.
         */
        const loadedCategories: Category[] =
          categoriesData.categories || [];

        const loadedProducts: Product[] =
          productsData.products || [];

        /*
         * Category availability is a separate API.
         */
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

            /*
             * Existing menu.js:
             *
             * Menu.categoryAvailability[c.category_id] = c;
             */
            (availabilityData.categories || []).forEach(
              (category: CategoryAvailability) => {
                loadedAvailability[String(category.category_id)] =
                  category;
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
        setCategoryAvailability(loadedAvailability);
      } catch (err) {
        console.error("Menu loading failed:", err);

        if (!cancelled) {
          setError(
            "Unable to load the menu right now. Please try again."
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

  return (
    <section className="menu-page-shell">
      {/* Location */}
      <div className="menu-location-bar">
        <div className="menu-shell-container">
          <button
            type="button"
            className="menu-location-button"
          >
            <span className="menu-location-pin">⌖</span>

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

      {/* Main menu header */}
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

          <MenuControls categories={categories} />
        </div>
      </div>

      {/* Sticky search + categories */}
      <div
        className={`menu-sticky-bar ${
          sticky ? "menu-sticky-bar-visible" : ""
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

      {/* Temporary data verification area */}
      <div className="menu-shell-container menu-placeholder-content">
        {loading && (
          <div className="menu-placeholder-card">
            <span>Loading Mithora menu...</span>
            <strong>
              Fetching categories, dishes & availability
            </strong>
          </div>
        )}

        {!loading && error && (
          <div className="menu-placeholder-card">
            <span>Menu loading error</span>
            <strong>{error}</strong>
          </div>
        )}

        {!loading && !error && (
          <div className="menu-placeholder-card">
            <span>Live Mithora menu connected</span>

            <strong>
              {categories.length} categories ·{" "}
              {products.length} products ·{" "}
              {Object.keys(categoryAvailability).length}{" "}
              availability records
            </strong>
          </div>
        )}

        <div className="menu-placeholder-space" />
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
        <span className="menu-search-icon">⌕</span>

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