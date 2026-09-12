"use client";

import {
  useEffect,
  useMemo,
  useState,
  type Dispatch,
  type SetStateAction,
} from "react";

/* =========================================================
   TYPES — KEEPING EXISTING MITHORA API STRUCTURE
   ========================================================= */

type Category = {
  id: number | string;
  name: string;
  icon_svg?: string;
  [key: string]: unknown;
};

type Variant = {
  id: number | string;
  variant_name?: string;
  name?: string;
  label?: string;
  description?: string;
  price?: number | string;
  old_price?: number | string;
  [key: string]: unknown;
};

type Product = {
  id: number | string;
  sku?: string;
  name: string;
  slug?: string;
  description?: string;
  category_id: number | string | null;
  is_active?: number | boolean;
  is_featured?: number | boolean;
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

type CartItem = {
  variant_id: number | string;
  qty: number;
};

type Cart = {
  items: CartItem[];
  coupon_code?: string;
  [key: string]: unknown;
};

/* =========================================================
   CONSTANTS
   ========================================================= */

const CART_KEY = "cart";

const WHATSAPP_NUMBER =
  "918657427432";

const KITCHEN_ITEMS = [
  {
    img: "/images/kitchen/fresh-vegitable.webp",
    text: "Fresh Vegetables",
  },
  {
    img: "/images/kitchen/desi-spices.webp",
    text: "Desi Spices",
  },
  {
    img: "/images/kitchen/pulses-and-grains.webp",
    text: "Handpicked Pulses",
  },
  {
    img: "/images/kitchen/veg-burger.webp",
    text: "Mithora Foods & Snacks",
  },
  {
    img: "/images/kitchen/desi-cow-ghee.webp",
    text: "Desi Ghee",
  },
  {
    img: "/images/kitchen/homemade-tiffin.webp",
    text: "Homemade Tiffin",
  },
];

/* =========================================================
   HELPERS
   ========================================================= */

function isValidOldPrice(
  oldPrice: unknown,
  price: unknown
) {
  const oldValue =
    Number(oldPrice || 0);

  const currentValue =
    Number(price || 0);

  return (
    oldValue > 0 &&
    currentValue > 0 &&
    oldValue > currentValue
  );
}

function getDiscount(
  oldPrice: unknown,
  price: unknown
) {
  if (
    !isValidOldPrice(
      oldPrice,
      price
    )
  ) {
    return 0;
  }

  return Math.round(
    ((Number(oldPrice) -
      Number(price)) /
      Number(oldPrice)) *
      100
  );
}

function getVariantName(
  variant: Variant,
  index: number
) {
  return (
    variant.variant_name ||
    variant.name ||
    variant.label ||
    `Option ${index + 1}`
  );
}

function getProductPrice(
  product: Product
) {
  const variant =
    product.variants?.[0];

  return Number(
    variant?.price || 0
  );
}

function canOrder(
  availability?: CategoryAvailability
) {
  if (!availability) {
    return false;
  }

  return Boolean(
    availability.delivery_type ===
      "SUBSCRIPTION" ||
      availability.orderable_now ||
      availability.status === "OPEN" ||
      availability.status ===
        "NEXT_DAY"
  );
}

function getWhatsAppUrl(
  productName: string
) {
  const message =
    `Hi Mithora Kitchen,\n\n` +
    `I want to know when "${productName}" ` +
    `will be available.`;

  return `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(
    message
  )}`;
}

function readCart(): Cart {
  try {
    const raw =
      localStorage.getItem(
        CART_KEY
      );

    if (!raw) {
      return {
        items: [],
      };
    }

    const parsed =
      JSON.parse(raw);

    if (
      !parsed ||
      !Array.isArray(
        parsed.items
      )
    ) {
      return {
        items: [],
      };
    }

    return parsed;
  } catch {
    return {
      items: [],
    };
  }
}

/* =========================================================
   MAIN
   ========================================================= */

export default function MenuShell() {
  const [categories, setCategories] =
    useState<Category[]>([]);

  const [products, setProducts] =
    useState<Product[]>([]);

  const [
    categoryAvailability,
    setCategoryAvailability,
  ] = useState<
    Record<
      string,
      CategoryAvailability
    >
  >({});

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState("");

  const [
    selectedCategory,
    setSelectedCategory,
  ] = useState("all");

  const [searchQuery, setSearchQuery] =
    useState("");

  const [
    searchFocused,
    setSearchFocused,
  ] = useState(false);

  const [
    modalProduct,
    setModalProduct,
  ] = useState<Product | null>(
    null
  );

  const [
    cartVersion,
    setCartVersion,
  ] = useState(0);

  /* =======================================================
     HEADER HEIGHT
     ======================================================= */

  useEffect(() => {
    function updateHeaderHeight() {
      const header =
        document.querySelector(
          "header"
        );

      const height = header
        ? header.getBoundingClientRect()
            .height
        : 68;

      document.documentElement.style.setProperty(
        "--mithora-header-height",
        `${height}px`
      );
    }

    updateHeaderHeight();

    window.addEventListener(
      "resize",
      updateHeaderHeight
    );

    return () => {
      window.removeEventListener(
        "resize",
        updateHeaderHeight
      );
    };
  }, []);

  /* =======================================================
     LOAD MENU
     ======================================================= */

  useEffect(() => {
    let cancelled = false;

    async function loadMenu() {
      try {
        setLoading(true);
        setError("");

        const [
          categoriesResponse,
          productsResponse,
          availabilityResponse,
        ] = await Promise.all([
          fetch(
            "/api/menu/categories?active=1"
          ),
          fetch(
            "/api/menu/products"
          ),
          fetch(
            "/api/menu/category-availability"
          ),
        ]);

        if (
          !categoriesResponse.ok
        ) {
          throw new Error(
            "Failed to load categories"
          );
        }

        if (
          !productsResponse.ok
        ) {
          throw new Error(
            "Failed to load products"
          );
        }

        const categoriesData =
          await categoriesResponse.json();

        const productsData =
          await productsResponse.json();

        const availabilityData =
          availabilityResponse.ok
            ? await availabilityResponse.json()
            : {
                categories: [],
              };

        const loadedCategories =
          Array.isArray(
            categoriesData.categories
          )
            ? categoriesData.categories
            : [];

        const loadedProducts =
          Array.isArray(
            productsData.products
          )
            ? productsData.products
            : [];

        const availabilityMap: Record<
          string,
          CategoryAvailability
        > = {};

        if (
          Array.isArray(
            availabilityData.categories
          )
        ) {
          availabilityData.categories.forEach(
            (
              item: CategoryAvailability
            ) => {
              availabilityMap[
                String(
                  item.category_id
                )
              ] = item;
            }
          );
        }

        if (cancelled) {
          return;
        }

        setCategories(
          loadedCategories
        );

        setProducts(
          loadedProducts
        );

        setCategoryAvailability(
          availabilityMap
        );
      } catch (err) {
        console.error(
          "Menu loading failed:",
          err
        );

        if (!cancelled) {
          setError(
            "Unable to load the menu right now. Please try again."
          );
        }
      } finally {
        if (!cancelled) {
          setTimeout(() => {
            setLoading(false);
          }, 650);
        }
      }
    }

    loadMenu();

    return () => {
      cancelled = true;
    };
  }, []);

  /* =======================================================
     CATEGORY SECTIONS
     ======================================================= */

  const categorySections =
    useMemo(() => {
      return categories
        .map((category) => {
          const categoryProducts =
            products.filter(
              (product) =>
                String(
                  product.category_id
                ) ===
                String(
                  category.id
                )
            );

          return {
            category,
            products:
              categoryProducts,
            availability:
              categoryAvailability[
                String(
                  category.id
                )
              ],
          };
        })
        .filter(
          (section) =>
            section.products
              .length > 0
        );
    }, [
      categories,
      products,
      categoryAvailability,
    ]);

  /* =======================================================
     FEATURED
     ======================================================= */

  const featuredProducts =
    useMemo(() => {
      return products.filter(
        (product) =>
          Number(
            product.is_featured
          ) === 1 &&
          Array.isArray(
            product.variants
          ) &&
          product.variants
            .length > 0
      );
    }, [products]);

  /* =======================================================
     SEARCHED PRODUCTS
     ======================================================= */

  const searchResults =
    useMemo(() => {
      const query =
        searchQuery
          .trim()
          .toLowerCase();

      if (!query) {
        return products;
      }

      return products.filter(
        (product) => {
          const searchableText = [
            product.name,
            product.description,
            ...(product.variants ||
              []).flatMap(
              (variant) => [
                variant.variant_name,
                variant.name,
                variant.label,
                variant.description,
              ]
            ),
          ]
            .filter(Boolean)
            .join(" ")
            .toLowerCase();

          return searchableText.includes(
            query
          );
        }
      );
    }, [
      products,
      searchQuery,
    ]);

  /* =======================================================
     VISIBLE CATEGORY SECTIONS
     ======================================================= */

  const visibleSections =
    useMemo(() => {
      let sections =
        categorySections;

      if (
        selectedCategory !==
        "all"
      ) {
        sections =
          sections.filter(
            (section) =>
              String(
                section.category.id
              ) ===
              selectedCategory
          );
      }

      const query =
        searchQuery
          .trim()
          .toLowerCase();

      if (!query) {
        return sections;
      }

      return sections
        .map((section) => ({
          ...section,
          products:
            section.products.filter(
              (product) =>
                searchResults.some(
                  (result) =>
                    String(
                      result.id
                    ) ===
                    String(
                      product.id
                    )
                )
            ),
        }))
        .filter(
          (section) =>
            section.products
              .length > 0
        );
    }, [
      categorySections,
      selectedCategory,
      searchQuery,
      searchResults,
    ]);

  /* =======================================================
     CART QUANTITY
     ======================================================= */

  function getCartQty(
    variantId: number | string
  ) {
    void cartVersion;

    const cart =
      readCart();

    const item =
      cart.items.find(
        (entry) =>
          String(
            entry.variant_id
          ) ===
          String(variantId)
      );

    return item
      ? Number(item.qty || 0)
      : 0;
  }

  /* =======================================================
     CART UPDATE
     ======================================================= */

  function updateCartQuantity(
    variantId: number | string,
    delta: number
  ) {
    try {
      const existingCart =
        readCart();

      /*
       * Use the existing Cart helper when available.
       * This preserves compatibility with the
       * existing Mithora cart implementation.
       */
      const globalWindow =
        window as typeof window & {
          Cart?: {
            addItem?: (
              id: number | string,
              qty: number
            ) => void;
            updateQty?: (
              id: number | string,
              qty: number
            ) => void;
            removeItem?: (
              id: number | string
            ) => void;
          };
        };

      const existing =
        existingCart.items.find(
          (item) =>
            String(
              item.variant_id
            ) ===
            String(variantId)
        );

      const currentQty =
        existing?.qty || 0;

      const newQty =
        Math.max(
          0,
          currentQty + delta
        );

      if (
        globalWindow.Cart &&
        currentQty === 0 &&
        delta > 0 &&
        globalWindow.Cart
          .addItem
      ) {
        globalWindow.Cart.addItem(
          variantId,
          delta
        );
      } else if (
        globalWindow.Cart &&
        newQty > 0 &&
        globalWindow.Cart
          .updateQty
      ) {
        globalWindow.Cart.updateQty(
          variantId,
          newQty
        );
      } else if (
        globalWindow.Cart &&
        newQty === 0 &&
        currentQty > 0 &&
        globalWindow.Cart
          .removeItem
      ) {
        globalWindow.Cart.removeItem(
          variantId
        );
      } else {
        /*
         * Fallback to the same cart structure
         * used by the existing menu.
         */
        if (existing) {
          existing.qty =
            newQty;
        } else if (
          delta > 0
        ) {
          existingCart.items.push(
            {
              variant_id:
                variantId,
              qty: delta,
            }
          );
        }

        existingCart.items =
          existingCart.items.filter(
            (item) =>
              Number(
                item.qty
              ) > 0
          );

        localStorage.setItem(
          CART_KEY,
          JSON.stringify(
            existingCart
          )
        );
      }

      setCartVersion(
        (value) => value + 1
      );

      window.dispatchEvent(
        new Event(
          "mithora-cart-updated"
        )
      );
    } catch (err) {
      console.error(
        "Cart update failed:",
        err
      );
    }
  }

  /* =======================================================
     CATEGORY
     ======================================================= */

  function selectCategory(
    categoryId: string
  ) {
    setSelectedCategory(
      categoryId
    );

    if (
      categoryId === "all"
    ) {
      window.scrollTo({
        top: 0,
        behavior: "smooth",
      });

      return;
    }

    setTimeout(() => {
      const element =
        document.getElementById(
          `menu-category-${categoryId}`
        );

      if (!element) {
        return;
      }

      const sticky =
        document.querySelector(
          ".menu-sticky-controls"
        );

      const offset =
        (sticky?.getBoundingClientRect()
          .height || 110) +
        20;

      const top =
        element.getBoundingClientRect()
          .top +
        window.scrollY -
        offset;

      window.scrollTo({
        top: Math.max(
          top,
          0
        ),
        behavior: "smooth",
      });
    }, 50);
  }

  /* =======================================================
     PRODUCT MODAL
     ======================================================= */

  function openProduct(
    product: Product
  ) {
    setModalProduct(
      product
    );
  }

  function closeProduct() {
    setModalProduct(
      null
    );
  }

  /* =======================================================
     SEARCH
     ======================================================= */

  function clearSearch() {
    setSearchQuery("");
  }

  const showSuggestions =
    searchFocused &&
    searchQuery.trim()
      .length > 0;

  /* =======================================================
     RENDER
     ======================================================= */

  return (
    <section className="menu-page-shell">

      {/* =================================================
          LOCATION
          ================================================= */}

      <div className="menu-location-bar">
        <div className="menu-shell-container">

          <button
            type="button"
            className="menu-location-button"
          >
            <span className="menu-location-pin">
              📍
            </span>

            <span className="menu-location-copy">
              <span className="menu-location-label">
                Delivering to
              </span>

              <strong>
                Jaipur
              </strong>
            </span>

            <span className="menu-location-change">
              Change
            </span>
          </button>

        </div>
      </div>

      {/* =================================================
          INTRO
          ================================================= */}

      <div className="menu-header-area">
        <div className="menu-shell-container">

          <div className="menu-heading">
            <span className="menu-eyebrow">
              MITHORA KITCHEN
            </span>

            <h1>
              Homemade food,
              <br />
              made with care.
            </h1>

            <p>
              Freshly prepared meals,
              snacks, tiffin and
              festive favourites.
            </p>
          </div>

        </div>
      </div>

      {/* =================================================
          STICKY SEARCH + CATEGORIES
          ================================================= */}

      <section className="menu-sticky-controls">
        <div className="menu-shell-container">

          <div className="menu-search-wrap">

            <div
              className={`menu-search-box ${
                searchFocused
                  ? "focused"
                  : ""
              }`}
            >

              <span className="menu-search-icon">
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.3"
                >
                  <circle
                    cx="11"
                    cy="11"
                    r="7.5"
                  />
                  <path d="m20 20-3.5-3.5" />
                </svg>
              </span>

              <input
                value={
                  searchQuery
                }
                onChange={(event) =>
                  setSearchQuery(
                    event.target.value
                  )
                }
                onFocus={() =>
                  setSearchFocused(
                    true
                  )
                }
                placeholder="Search dishes, snacks, tiffin & more"
                type="search"
                aria-label="Search Mithora menu"
              />

              {searchQuery && (
                <button
                  type="button"
                  className="menu-search-clear"
                  onClick={
                    clearSearch
                  }
                  aria-label="Clear search"
                >
                  ×
                </button>
              )}

            </div>

            {/* PREDICTIVE SEARCH */}
            {showSuggestions && (
              <div className="menu-search-suggestions">

                <div className="menu-search-suggestions-title">
                  <span>
                    SEARCH RESULTS
                  </span>

                  <strong>
                    {searchResults.length}{" "}
                    {searchResults.length ===
                    1
                      ? "item"
                      : "items"}
                  </strong>
                </div>

                {searchResults
                  .slice(0, 6)
                  .map(
                    (product) => (
                      <button
                        type="button"
                        key={
                          product.id
                        }
                        className="menu-search-suggestion"
                        onClick={() => {
                          setSearchFocused(
                            false
                          );

                          const element =
                            document.getElementById(
                              `menu-product-${product.id}`
                            );

                          if (
                            element
                          ) {
                            element.scrollIntoView(
                              {
                                behavior:
                                  "smooth",
                                block:
                                  "center",
                              }
                            );
                          }
                        }}
                      >

                        {product.image_path ? (
                          <img
                            src={
                              product.image_path
                            }
                            alt={
                              product.name
                            }
                          />
                        ) : (
                          <span className="menu-search-suggestion-placeholder">
                            🍲
                          </span>
                        )}

                        <span className="menu-search-suggestion-copy">

                          <strong>
                            {
                              product.name
                            }
                          </strong>

                          <small>
                            {getProductPrice(
                              product
                            ) > 0
                              ? `₹${getProductPrice(
                                  product
                                )}`
                              : "View options"}
                          </small>

                        </span>

                        <span className="menu-search-suggestion-arrow">
                          →
                        </span>

                      </button>
                    )
                  )}

                {searchResults.length >
                  6 && (
                  <div className="menu-search-more">
                    Showing top results — scroll
                    below for all matches
                  </div>
                )}

                {searchResults.length ===
                  0 && (
                  <div className="menu-search-empty-mini">
                    No matching dishes found.
                  </div>
                )}

              </div>
            )}

          </div>

          {/* CATEGORY PILLS */}

          <div className="menu-sticky-category-row">

            <button
              type="button"
              className={`menu-category ${
                selectedCategory ===
                "all"
                  ? "active"
                  : ""
              }`}
              onClick={() =>
                selectCategory(
                  "all"
                )
              }
            >
              All Items
            </button>

            {categories.map(
              (category) => (
                <button
                  type="button"
                  key={
                    category.id
                  }
                  className={`menu-category ${
                    selectedCategory ===
                    String(
                      category.id
                    )
                      ? "active"
                      : ""
                  }`}
                  onClick={() =>
                    selectCategory(
                      String(
                        category.id
                      )
                    )
                  }
                >
                  {
                    category.name
                  }
                </button>
              )
            )}

          </div>

        </div>
      </section>

      {/* =================================================
          MAIN MENU
          ================================================= */}

      <div className="menu-shell-container menu-content">

        {/* LOADER */}

        {loading && (
          <MenuLoader />
        )}

        {!loading &&
          error && (
            <div className="menu-error-card">
              <span>
                Something went wrong
              </span>

              <strong>
                {error}
              </strong>

              <button
                type="button"
                onClick={() =>
                  window.location.reload()
                }
              >
                TRY AGAIN
              </button>
            </div>
          )}

        {!loading &&
          !error && (
            <>
              {/* =========================================
                  FEATURED
                  ========================================= */}

              {selectedCategory ===
                "all" &&
                !searchQuery.trim() &&
                featuredProducts.length >
                  0 && (
                  <FeaturedSection
                    products={
                      featuredProducts
                    }
                    availability={
                      categoryAvailability
                    }
                    onOpen={
                      openProduct
                    }
                    onAdd={
                      updateCartQuantity
                    }
                    getCartQty={
                      getCartQty
                    }
                  />
                )}

              {/* =========================================
                  SEARCH COUNT
                  ========================================= */}

              {searchQuery.trim() && (
                <div className="menu-search-active-summary">

                  <div>
                    <span>
                      SEARCHING FOR
                    </span>

                    <strong>
                      “
                      {
                        searchQuery
                      }
                      ”
                    </strong>
                  </div>

                  <small>
                    {
                      searchResults.length
                    }{" "}
                    matching{" "}
                    {searchResults.length ===
                    1
                      ? "dish"
                      : "dishes"}
                  </small>

                </div>
              )}

              {/* =========================================
                  CATEGORY SECTIONS
                  ========================================= */}

              {visibleSections.map(
                ({
                  category,
                  products:
                    categoryProducts,
                  availability,
                }) => (
                  <section
                    key={
                      category.id
                    }
                    id={`menu-category-${category.id}`}
                    className="menu-category-section"
                  >

                    <div className="menu-category-header">

                      <div className="menu-category-title-wrap">

                        {category.icon_svg && (
                          <span
                            className="menu-category-icon"
                            dangerouslySetInnerHTML={{
                              __html:
                                String(
                                  category.icon_svg
                                ),
                            }}
                          />
                        )}

                        <div>
                          <h2>
                            {
                              category.name
                            }
                          </h2>

                          <span>
                            {
                              categoryProducts.length
                            }{" "}
                            {categoryProducts.length ===
                            1
                              ? "item"
                              : "items"}
                          </span>
                        </div>

                      </div>

                      <div className="menu-category-header-right">

                        <span className="menu-fresh-badge">
                          <span>
                            ✓
                          </span>
                          Fresh Every Order
                        </span>

                      </div>

                    </div>

                    {availability && (
                      <div
                        className={`menu-availability ${
                          canOrder(
                            availability
                          )
                            ? "available"
                            : "closed"
                        }`}
                      >

                        <span className="menu-availability-dot" />

                        <span>
                          {
                            availability.user_message ||
                              (canOrder(
                                availability
                              )
                                ? "Available now"
                                : "Kitchen currently closed")
                          }
                        </span>

                      </div>
                    )}

                    <div className="menu-product-grid">

                      {categoryProducts.map(
                        (product) => (
                          <div
                            key={
                              product.id
                            }
                            id={`menu-product-${product.id}`}
                          >
                            <ProductCard
                              product={
                                product
                              }
                              availability={
                                availability
                              }
                              onOpen={
                                openProduct
                              }
                              onAdd={
                                updateCartQuantity
                              }
                              getCartQty={
                                getCartQty
                              }
                            />
                          </div>
                        )
                      )}

                    </div>

                  </section>
                )
              )}

              {visibleSections.length ===
                0 && (
                <div className="menu-no-results">
                  <div className="menu-no-results-icon">
                    🍲
                  </div>

                  <h2>
                    Nothing found
                  </h2>

                  <p>
                    Try another dish,
                    category or keyword.
                  </p>

                  <button
                    type="button"
                    onClick={() => {
                      clearSearch();
                      setSelectedCategory(
                        "all"
                      );
                    }}
                  >
                    SHOW ALL ITEMS
                  </button>
                </div>
              )}
            </>
          )}

      </div>

      {/* SEARCH BACKDROP */}

      {searchFocused &&
        searchQuery && (
          <button
            type="button"
            className="menu-search-backdrop"
            aria-label="Close search suggestions"
            onClick={() =>
              setSearchFocused(
                false
              )
            }
          />
        )}

      {/* PRODUCT MODAL */}

      {modalProduct && (
        <ProductModal
          product={
            modalProduct
          }
          availability={
            categoryAvailability[
              String(
                modalProduct.category_id
              )
            ]
          }
          getCartQty={
            getCartQty
          }
          onAdd={
            updateCartQuantity
          }
          onClose={
            closeProduct
          }
        />
      )}

    </section>
  );
}

/* =========================================================
   FEATURED SECTION
   ========================================================= */

function FeaturedSection({
  products,
  availability,
  onOpen,
  onAdd,
  getCartQty,
}: {
  products: Product[];
  availability: Record<
    string,
    CategoryAvailability
  >;
  onOpen: (
    product: Product
  ) => void;
  onAdd: (
    variantId: number | string,
    delta: number
  ) => void;
  getCartQty: (
    variantId: number | string
  ) => number;
}) {
  return (
    <section className="menu-featured-section">

      <div className="menu-featured-heading">

        <div>
          <span>
            MITHORA FAVOURITES
          </span>

          <h2>
            Featured for you
          </h2>

          <p>
            Handpicked from our kitchen
          </p>
        </div>

        <div className="menu-featured-scroll-hint">
          Swipe →
        </div>

      </div>

      <div className="menu-featured-track">

        {products.map(
          (product) => (
            <div
              className="menu-featured-card"
              key={
                product.id
              }
            >
              <ProductCard
                product={
                  product
                }
                availability={
                  availability[
                    String(
                      product.category_id
                    )
                  ]
                }
                onOpen={
                  onOpen
                }
                onAdd={
                  onAdd
                }
                getCartQty={
                  getCartQty
                }
              />
            </div>
          )
        )}

      </div>

    </section>
  );
}

/* =========================================================
   PRODUCT CARD
   ========================================================= */

function ProductCard({
  product,
  availability,
  onOpen,
  onAdd,
  getCartQty,
}: {
  product: Product;
  availability?: CategoryAvailability;
  onOpen: (
    product: Product
  ) => void;
  onAdd: (
    variantId: number | string,
    delta: number
  ) => void;
  getCartQty: (
    variantId: number | string
  ) => number;
}) {
  const variants =
    Array.isArray(
      product.variants
    )
      ? product.variants
      : [];

  if (!variants.length) {
    return null;
  }

  const firstVariant =
    variants[0];

  const price =
    Number(
      firstVariant.price || 0
    );

  const oldPrice =
    firstVariant.old_price;

  const discount =
    getDiscount(
      oldPrice,
      price
    );

  const rating =
    Number(
      product.avg_rating || 0
    );

  const reviewCount =
    Number(
      product.review_count || 0
    );

  const orderable =
    canOrder(
      availability
    );

  const isMulti =
    variants.length > 1;

  const qty =
    getCartQty(
      firstVariant.id
    );

  const whatsappUrl =
    getWhatsAppUrl(
      product.name
    );

  const actionText =
    availability?.delivery_type ===
    "SUBSCRIPTION"
      ? "SUBSCRIBE"
      : isMulti
      ? "VIEW OPTIONS"
      : "ADD";

  return (
    <article className="menu-product-card">

      {/* IMAGE */}

      <button
        type="button"
        className="menu-product-image-button"
        onClick={() =>
          onOpen(product)
        }
        aria-label={`View ${product.name}`}
      >

        <div className="menu-product-image-wrap">

          {product.image_path ? (
            <img
              src={
                product.image_path
              }
              alt={
                product.name
              }
              className="menu-product-image"
              loading="lazy"
            />
          ) : (
            <div className="menu-product-image-placeholder">
              <span>
                🍲
              </span>
              Mithora Kitchen
            </div>
          )}

          {discount > 0 && (
            <span className="menu-discount-badge">
              {discount}% OFF
            </span>
          )}

          {Number(
            product.is_featured
          ) === 1 && (
            <span className="menu-featured-badge">
              ★ FEATURED
            </span>
          )}

        </div>

      </button>

      {/* CONTENT */}

      <div className="menu-product-details">

        <div className="menu-product-title-row">

          <button
            type="button"
            className="menu-product-title-button"
            onClick={() =>
              onOpen(product)
            }
          >
            <h3>
              {product.name}
            </h3>
          </button>

          {rating >= 0.5 && (
            <div className="menu-product-rating">

              <span>
                ★
              </span>

              <strong>
                {rating.toFixed(
                  1
                )}
              </strong>

              {reviewCount >
                0 && (
                <small>
                  (
                  {
                    reviewCount
                  }
                  )
                </small>
              )}

            </div>
          )}

        </div>

        {product.description && (
          <p className="menu-product-description">
            {
              product.description
            }
          </p>
        )}

        {isMulti && (
          <div className="menu-option-count">
            {variants.length}{" "}
            OPTIONS AVAILABLE
          </div>
        )}

        <div className="menu-product-bottom">

          <div className="menu-price">

            <strong>
              ₹{price}
            </strong>

            {isValidOldPrice(
              oldPrice,
              price
            ) && (
              <del>
                ₹{oldPrice}
              </del>
            )}

          </div>

          <div className="menu-product-action">

            {qty > 0 ? (
              <QuantityControl
                qty={
                  qty
                }
                onMinus={() =>
                  onAdd(
                    firstVariant.id,
                    -1
                  )
                }
                onPlus={() =>
                  onAdd(
                    firstVariant.id,
                    1
                  )
                }
              />
            ) : !orderable ? (
              <a
                href={
                  whatsappUrl
                }
                target="_blank"
                rel="noopener noreferrer"
                className="menu-whatsapp-button"
              >
                <span className="menu-whatsapp-icon">
                  <WhatsAppIcon />
                </span>

                <span>
                  NOTIFY
                </span>
              </a>
            ) : (
              <button
                type="button"
                className={`menu-primary-action ${
                  isMulti
                    ? "view"
                    : ""
                }`}
                onClick={() => {
                  if (
                    isMulti ||
                    availability?.delivery_type ===
                      "SUBSCRIPTION"
                  ) {
                    onOpen(
                      product
                    );
                  } else {
                    onAdd(
                      firstVariant.id,
                      1
                    );
                  }
                }}
              >
                {actionText}
              </button>
            )}

          </div>

        </div>

      </div>

    </article>
  );
}

/* =========================================================
   QUANTITY
   ========================================================= */

function QuantityControl({
  qty,
  onMinus,
  onPlus,
}: {
  qty: number;
  onMinus: () => void;
  onPlus: () => void;
}) {
  return (
    <div className="menu-qty-box">

      <button
        type="button"
        onClick={onMinus}
        aria-label="Decrease quantity"
      >
        −
      </button>

      <span>
        {qty}
      </span>

      <button
        type="button"
        onClick={onPlus}
        aria-label="Increase quantity"
      >
        +
      </button>

    </div>
  );
}

/* =========================================================
   PRODUCT MODAL
   ========================================================= */

function ProductModal({
  product,
  availability,
  getCartQty,
  onAdd,
  onClose,
}: {
  product: Product;
  availability?: CategoryAvailability;
  getCartQty: (
    variantId: number | string
  ) => number;
  onAdd: (
    variantId: number | string,
    delta: number
  ) => void;
  onClose: () => void;
}) {
  const variants =
    Array.isArray(
      product.variants
    )
      ? product.variants
      : [];

  const orderable =
    canOrder(
      availability
    );

  useEffect(() => {
    const previousOverflow =
      document.body.style
        .overflow;

    document.body.style.overflow =
      "hidden";

    function handleKey(
      event: KeyboardEvent
    ) {
      if (
        event.key ===
        "Escape"
      ) {
        onClose();
      }
    }

    document.addEventListener(
      "keydown",
      handleKey
    );

    return () => {
      document.body.style.overflow =
        previousOverflow;

      document.removeEventListener(
        "keydown",
        handleKey
      );
    };
  }, [onClose]);

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

      <div className="menu-product-modal">

        {/* CLOSE */}

        <button
          type="button"
          className="menu-modal-close"
          onClick={
            onClose
          }
          aria-label="Close product"
        >
          ×
        </button>

        {/* IMAGE */}

        <div className="menu-modal-image">

          {product.image_path ? (
            <img
              src={
                product.image_path
              }
              alt={
                product.name
              }
            />
          ) : (
            <div className="menu-product-image-placeholder">
              <span>
                🍲
              </span>
              Mithora Kitchen
            </div>
          )}

        </div>

        {/* BODY */}

        <div className="menu-modal-body">

          <div className="menu-modal-heading">

            <div>
              <span className="menu-modal-kicker">
                MITHORA KITCHEN
              </span>

              <h2>
                {
                  product.name
                }
              </h2>
            </div>

            {Number(
              product.avg_rating ||
                0
            ) >= 0.5 && (
              <div className="menu-modal-rating">
                ★{" "}
                {Number(
                  product.avg_rating
                ).toFixed(
                  1
                )}
              </div>
            )}

          </div>

          {product.description && (
            <p className="menu-modal-description">
              {
                product.description
              }
            </p>
          )}

          <div className="menu-modal-option-heading">
            <strong>
              Choose your option
            </strong>

            <span>
              {variants.length}{" "}
              {variants.length ===
              1
                ? "option"
                : "options"}
            </span>
          </div>

          {/* VARIANTS */}

          <div className="menu-modal-variants">

            {variants.map(
              (
                variant,
                index
              ) => {
                const price =
                  Number(
                    variant.price ||
                      0
                  );

                const oldPrice =
                  variant.old_price;

                const qty =
                  getCartQty(
                    variant.id
                  );

                const discount =
                  getDiscount(
                    oldPrice,
                    price
                  );

                return (
                  <div
                    className={`menu-modal-variant ${
                      qty > 0
                        ? "selected"
                        : ""
                    }`}
                    key={
                      variant.id
                    }
                  >

                    <div className="menu-modal-variant-info">

                      <div className="menu-modal-variant-name-row">

                        <strong>
                          {getVariantName(
                            variant,
                            index
                          )}
                        </strong>

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

                      {variant.description && (
                        <p>
                          {
                            variant.description
                          }
                        </p>
                      )}

                      <div className="menu-modal-variant-price">

                        <strong>
                          ₹{price}
                        </strong>

                        {isValidOldPrice(
                          oldPrice,
                          price
                        ) && (
                          <del>
                            ₹
                            {
                              oldPrice
                            }
                          </del>
                        )}

                      </div>

                    </div>

                    <div className="menu-modal-variant-action">

                      {!orderable ? (
                        <a
                          href={getWhatsAppUrl(
                            product.name
                          )}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="menu-modal-notify"
                        >
                          <WhatsAppIcon />
                          NOTIFY
                        </a>
                      ) : qty >
                        0 ? (
                        <QuantityControl
                          qty={
                            qty
                          }
                          onMinus={() =>
                            onAdd(
                              variant.id,
                              -1
                            )
                          }
                          onPlus={() =>
                            onAdd(
                              variant.id,
                              1
                            )
                          }
                        />
                      ) : (
                        <button
                          type="button"
                          className="menu-modal-add"
                          onClick={() =>
                            onAdd(
                              variant.id,
                              1
                            )
                          }
                        >
                          ADD
                        </button>
                      )}

                    </div>

                  </div>
                );
              }
            )}

          </div>

        </div>

        {/* FOOTER */}

        <div className="menu-modal-footer">

          <div>
            <span>
              Selected items
            </span>

            <strong>
              {variants.reduce(
                (
                  total,
                  variant
                ) =>
                  total +
                  getCartQty(
                    variant.id
                  ),
                0
              )}
            </strong>
          </div>

          <button
            type="button"
            className="menu-modal-done"
            onClick={
              onClose
            }
          >
            DONE
          </button>

        </div>

      </div>

    </div>
  );
}

/* =========================================================
   LOADER
   ========================================================= */

function MenuLoader() {
  return (
    <div className="menu-loader-area">

      <div className="menu-loader-card">

        <div className="menu-loader-offer">

          <span>
            SPECIAL OFFER
          </span>

          <strong>
            <small>
              ₹
            </small>
            100 OFF
          </strong>

          <p>
            ON YOUR FIRST ORDER
          </p>

          <em>
            Valid on orders above ₹400
          </em>

        </div>

        <div className="menu-loader-title">

          <div className="menu-loader-chef">
            👨‍🍳
          </div>

          <div>
            <h3>
              Preparing your menu...
            </h3>

            <p>
              Mithora Kitchen • Jaipur
            </p>
          </div>

        </div>

        <div className="menu-loader-images">

          {KITCHEN_ITEMS.map(
            (item, index) => (
              <div
                className="menu-loader-item"
                key={
                  item.text
                }
                style={{
                  animationDelay: `${index *
                    80}ms`,
                }}
              >
                <div>
                  <img
                    src={
                      item.img
                    }
                    alt={
                      item.text
                    }
                  />
                </div>

                <span>
                  {
                    item.text
                  }
                </span>
              </div>
            )
          )}

        </div>

        <div className="menu-loader-message">
          Freshly prepared with care.
        </div>

        <div className="menu-loader-progress">
          <span />
        </div>

      </div>

    </div>
  );
}

/* =========================================================
   WHATSAPP ICON
   ========================================================= */

function WhatsAppIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="currentColor"
      aria-hidden="true"
    >
      <path d="M20.52 3.48A11.78 11.78 0 0 0 12.06 0C5.5 0 .16 5.34.16 11.9c0 2.1.55 4.15 1.6 5.96L.06 24l6.29-1.65a11.86 11.86 0 0 0 5.7 1.45h.01c6.55 0 11.89-5.34 11.89-11.9 0-3.18-1.24-6.16-3.43-8.42ZM12.06 21.8h-.01a9.88 9.88 0 0 1-5.03-1.38l-.36-.21-3.73.98.99-3.64-.24-.37a9.86 9.86 0 0 1-1.51-5.28c0-5.47 4.46-9.92 9.94-9.92 2.65 0 5.14 1.03 7.01 2.91a9.85 9.85 0 0 1 2.9 7.02c0 5.47-4.46 9.92-9.96 9.92Zm5.44-7.43c-.3-.15-1.76-.87-2.03-.97-.27-.1-.47-.15-.67.15-.2.3-.77.97-.94 1.17-.17.2-.35.22-.65.07-.3-.15-1.25-.46-2.38-1.47-.88-.79-1.48-1.76-1.65-2.06-.17-.3-.02-.46.13-.61.13-.13.3-.35.45-.52.15-.17.2-.3.3-.5.1-.2.05-.37-.02-.52-.07-.15-.67-1.62-.92-2.22-.24-.58-.49-.5-.67-.51h-.57c-.2 0-.52.07-.8.37-.27.3-1.04 1.02-1.04 2.49s1.07 2.89 1.22 3.09c.15.2 2.1 3.21 5.09 4.5.71.31 1.27.5 1.7.64.72.23 1.37.2 1.89.12.58-.09 1.76-.72 2.01-1.42.25-.7.25-1.3.17-1.42-.07-.12-.27-.2-.57-.35Z" />
    </svg>
  );
}