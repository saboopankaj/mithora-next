"use client";

import type { Category, CategoryAvailability, Product, CartItem } from "./types";
import ProductCard from "./MenuProductCard";

export default function MenuSearchPage({
  categories,
  products,
  searchQuery,
  setSearchQuery,
  onBack,
  onOpenProduct,
  availability,
  cart,
  onAdd,
  onNotify,
}: {
  categories: Category[];
  products: Product[];
  searchQuery: string;
  setSearchQuery: (
    value: string
  ) => void;
  onBack: () => void;
  onOpenProduct: (
    product: Product
  ) => void;
  availability: Record<
    string,
    CategoryAvailability
  >;
  cart: {
    items: CartItem[];
  };
  onAdd: (
    variantId: number | string,
    delta: number
  ) => void;
  onNotify: (
    product: Product
  ) => void;
}) {
   return (
    <div className="menu-search-page">

      <div className="menu-search-page-top">

        <button
          type="button"
          className="menu-search-back"
          onClick={onBack}
          aria-label="Back"
        >
          <svg
            viewBox="0 0 24 24"
            aria-hidden="true"
          >
            <path d="M19 12H5" />
            <path d="m12 19-7-7 7-7" />
          </svg>
        </button>

        <div className="menu-search-page-input">
          <svg
            viewBox="0 0 24 24"
            aria-hidden="true"
          >
            <circle
              cx="11"
              cy="11"
              r="7"
            />
            <path d="m20 20-4-4" />
          </svg>

          <input
            autoFocus
            type="search"
            value={searchQuery}
            onChange={(event) =>
              setSearchQuery(event.target.value)
            }
            placeholder="Search dishes, snacks, tiffin & more"
          />

          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery("")}
            >
              ×
            </button>
          )}
        </div>
      </div>

      <div className="menu-search-page-content">

        <div className="menu-search-all-title">
          <div>
            <span>MENU</span>
            <h2>All Items</h2>
          </div>

          <small>
            {products.length}{" "}
            {products.length === 1 ? "item" : "items"}
          </small>
        </div>

        <div className="menu-search-category-row">
          <span>Browse</span>

          {categories.map((category) => (
            <button
              key={category.id}
              type="button"
              onClick={() => {
                onBack();

                window.setTimeout(() => {
                  const element = document.getElementById(
                    `menu-category-${category.id}`
                  );

                  if (element) {
                    element.scrollIntoView({
                      behavior: "smooth",
                      block: "start",
                    });
                  }
                }, 100);
              }}
            >
              {category.name}
            </button>
          ))}
        </div>

        {products.length > 0 ? (
          <div className="menu-product-grid">
            {products.map((product) => (
              <ProductCard
                key={product.id}
                product={product}
                availability={
                  availability[String(product.category_id)]
                }
                cart={cart}
                onOpen={onOpenProduct}
                onAdd={onAdd}
                onNotify={onNotify}
              />
            ))}
          </div>
        ) : (
          <div className="menu-empty-state">
            <div className="menu-empty-icon">
              🍲
            </div>

            <h2>No dishes found</h2>

            <p>Try another search.</p>
          </div>
        )}

      </div>
    </div>
  );
}
