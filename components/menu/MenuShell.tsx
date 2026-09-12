"use client";

import {
  useEffect,
  useMemo,
  useState,
} from "react";

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

const WHATSAPP_NUMBER = "918657427432";

function canOrder(
  availability?: CategoryAvailability
) {
  if (!availability) return false;

  return Boolean(
    availability.delivery_type ===
      "SUBSCRIPTION" ||
      availability.orderable_now ||
      availability.status === "OPEN" ||
      availability.status === "NEXT_DAY"
  );
}

function validOldPrice(
  oldPrice: unknown,
  price: unknown
) {
  const oldValue = Number(oldPrice || 0);
  const currentValue = Number(price || 0);

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
  if (!validOldPrice(oldPrice, price)) {
    return 0;
  }

  return Math.round(
    ((Number(oldPrice) - Number(price)) /
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

function getWhatsAppUrl(
  productName: string,
  extra = ""
) {
  const message =
    `Hi Mithora Kitchen,\n\n` +
    `I want to know when "${productName}" ` +
    `will be available.${extra}`;

  return `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(
    message
  )}`;
}

export default function MenuShell() {
  const [categories, setCategories] =
    useState<Category[]>([]);

  const [products, setProducts] =
    useState<Product[]>([]);

  const [
    categoryAvailability,
    setCategoryAvailability,
  ] = useState<
    Record<string, CategoryAvailability>
  >({});

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState("");

  const [selectedCategory, setSelectedCategory] =
    useState<string>("all");

  const [searchOpen, setSearchOpen] =
    useState(false);

  const [searchQuery, setSearchQuery] =
    useState("");

  const [modalProduct, setModalProduct] =
    useState<Product | null>(null);

  const [selectedVariantId, setSelectedVariantId] =
    useState<string>("");

  const [modalQty, setModalQty] =
    useState(1);

  const [cartVersion, setCartVersion] =
    useState(0);

  /* =====================================================
     HEADER HEIGHT
     ===================================================== */

  useEffect(() => {
    const updateHeaderHeight = () => {
      const header =
        document.querySelector("header");

      const height = header
        ? header.getBoundingClientRect().height
        : 68;

      document.documentElement.style.setProperty(
        "--mithora-header-height",
        `${height}px`
      );
    };

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

  /* =====================================================
     LOAD MENU
     ===================================================== */

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
          fetch("/api/menu/products"),
          fetch(
            "/api/menu/category-availability"
          ),
        ]);

        if (!categoriesResponse.ok) {
          throw new Error(
            "Failed to load categories"
          );
        }

        if (!productsResponse.ok) {
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
            : { categories: [] };

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

        (
          availabilityData.categories || []
        ).forEach(
          (
            item: CategoryAvailability
          ) => {
            availabilityMap[
              String(item.category_id)
            ] = item;
          }
        );

        if (cancelled) return;

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
          setLoading(false);
        }
      }
    }

    loadMenu();

    return () => {
      cancelled = true;
    };
  }, []);

  /* =====================================================
     CATEGORY SECTIONS
     ===================================================== */

  const categorySections =
    useMemo(() => {
      return categories
        .map((category) => {
          const categoryProducts =
            products.filter(
              (product) =>
                String(
                  product.category_id
                ) === String(category.id)
            );

          return {
            category,
            products:
              categoryProducts,
            availability:
              categoryAvailability[
                String(category.id)
              ],
          };
        })
        .filter(
          (section) =>
            section.products.length > 0
        );
    }, [
      categories,
      products,
      categoryAvailability,
    ]);

  /* =====================================================
     FILTERED SECTIONS
     ===================================================== */

  const visibleSections =
    useMemo(() => {
      if (
        selectedCategory === "all"
      ) {
        return categorySections;
      }

      return categorySections.filter(
        (section) =>
          String(section.category.id) ===
          selectedCategory
      );
    }, [
      categorySections,
      selectedCategory,
    ]);

  /* =====================================================
     SEARCH RESULTS
     ===================================================== */

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
          const productText = [
            product.name,
            product.description,
            ...(product.variants || []).flatMap(
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

          return productText.includes(
            query
          );
        }
      );
    }, [
      products,
      searchQuery,
    ]);

  /* =====================================================
     OPEN PRODUCT MODAL
     ===================================================== */

  function openProduct(
    product: Product
  ) {
    const variants =
      Array.isArray(
        product.variants
      )
        ? product.variants
        : [];

    setModalProduct(product);

    setSelectedVariantId(
      variants.length
        ? String(variants[0].id)
        : ""
    );

    setModalQty(1);
  }

  function closeProduct() {
    setModalProduct(null);
    setSelectedVariantId("");
    setModalQty(1);
  }

  /* =====================================================
     CART
     ===================================================== */

  function addToCart(
    variantId: number | string
  ) {
    try {
      const raw =
        localStorage.getItem(
          "cart"
        );

      let cart = raw
        ? JSON.parse(raw)
        : {
            items: [],
            coupon_code: "",
          };

      if (
        !cart ||
        !Array.isArray(cart.items)
      ) {
        cart = {
          items: [],
          coupon_code: "",
        };
      }

      const existing =
        cart.items.find(
          (item: {
            variant_id: number | string;
            qty: number;
          }) =>
            String(
              item.variant_id
            ) ===
            String(variantId)
        );

      if (existing) {
        existing.qty += 1;
      } else {
        cart.items.push({
          variant_id:
            variantId,
          qty: 1,
        });
      }

      localStorage.setItem(
        "cart",
        JSON.stringify(cart)
      );

      setCartVersion(
        (value) => value + 1
      );
    } catch (err) {
      console.error(
        "Cart update failed:",
        err
      );
    }
  }

  function getCartQty(
    variantId: number | string
  ) {
    void cartVersion;

    try {
      const raw =
        localStorage.getItem(
          "cart"
        );

      if (!raw) return 0;

      const cart =
        JSON.parse(raw);

      if (
        !cart ||
        !Array.isArray(
          cart.items
        )
      ) {
        return 0;
      }

      const item =
        cart.items.find(
          (entry: {
            variant_id:
              | number
              | string;
            qty: number;
          }) =>
            String(
              entry.variant_id
            ) ===
            String(variantId)
        );

      return item
        ? Number(item.qty || 0)
        : 0;
    } catch {
      return 0;
    }
  }

  function addModalVariant() {
    if (!selectedVariantId) {
      return;
    }

    for (
      let i = 0;
      i < modalQty;
      i++
    ) {
      addToCart(
        selectedVariantId
      );
    }

    closeProduct();
  }

  /* =====================================================
     CATEGORY CLICK
     ===================================================== */

  function selectCategory(
    categoryId: string
  ) {
    setSelectedCategory(
      categoryId
    );

    if (
      categoryId !== "all"
    ) {
      requestAnimationFrame(
        () => {
          const element =
            document.getElementById(
              `menu-category-${categoryId}`
            );

          if (element) {
            element.scrollIntoView({
              behavior: "smooth",
              block: "start",
            });
          }
        }
      );
    }
  }

  /* =====================================================
     SEARCH
     ===================================================== */

  function openSearch() {
    setSearchOpen(true);
    setSearchQuery("");

    document.body.classList.add(
      "menu-search-open"
    );
  }

  function closeSearch() {
    setSearchOpen(false);
    setSearchQuery("");

    document.body.classList.remove(
      "menu-search-open"
    );
  }

  /* =====================================================
     RENDER
     ===================================================== */

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

      {/* PAGE INTRO */}
      <div className="menu-header-area">
        <div className="menu-shell-container">

          <div className="menu-heading">
            <span className="menu-eyebrow">
              MITHORA KITCHEN
            </span>

            <h1>
              Our Menu
            </h1>

            <p>
              Homemade food, freshly prepared
              with care.
            </p>
          </div>

        </div>
      </div>

      {/* =================================================
          STICKY SEARCH + CATEGORIES
          ================================================= */}

      <section className="menu-sticky-controls">

        <div className="menu-shell-container">

          <button
            type="button"
            className="menu-search-trigger"
            onClick={openSearch}
          >
            <span className="menu-search-trigger-icon">
              ⌕
            </span>

            <span>
              Search dishes, snacks,
              tiffin & more
            </span>
          </button>

          <div className="menu-sticky-category-row">

            <button
              type="button"
              className={`menu-category ${
                selectedCategory === "all"
                  ? "active"
                  : ""
              }`}
              onClick={() =>
                selectCategory("all")
              }
            >
              All Items
            </button>

            {categories.map(
              (category) => (
                <button
                  type="button"
                  key={category.id}
                  className={`menu-category ${
                    selectedCategory ===
                    String(category.id)
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
                  {category.name}
                </button>
              )
            )}

          </div>

        </div>

      </section>

      {/* =================================================
          MENU CONTENT
          ================================================= */}

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
          visibleSections.map(
            ({
              category,
              products:
                categoryProducts,
              availability,
            }) => (
              <section
                key={category.id}
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
                        {category.name}
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
                        {availability.user_message ||
                          (canOrder(
                            availability
                          )
                            ? "Available now"
                            : "Currently unavailable")}
                      </span>
                    </div>
                  )}

                </div>

                <div className="menu-product-grid">

                  {categoryProducts.map(
                    (product) => (
                      <ProductCard
                        key={product.id}
                        product={product}
                        availability={
                          availability
                        }
                        onOpen={
                          openProduct
                        }
                        onAdd={
                          addToCart
                        }
                        getCartQty={
                          getCartQty
                        }
                      />
                    )
                  )}

                </div>

              </section>
            )
          )}

      </div>

      {/* =================================================
          FULL SCREEN SEARCH
          ================================================= */}

      {searchOpen && (
        <div className="menu-search-overlay">

          <div className="menu-search-panel">

            <div className="menu-search-topbar">

              <button
                type="button"
                className="menu-search-back"
                onClick={
                  closeSearch
                }
                aria-label="Close search"
              >
                ←
              </button>

              <div className="menu-search-input-wrap">

                <span>
                  ⌕
                </span>

                <input
                  autoFocus
                  type="search"
                  value={
                    searchQuery
                  }
                  onChange={(event) =>
                    setSearchQuery(
                      event.target.value
                    )
                  }
                  placeholder="Search dishes..."
                />

                {searchQuery && (
                  <button
                    type="button"
                    onClick={() =>
                      setSearchQuery(
                        ""
                      )
                    }
                    className="menu-search-clear"
                  >
                    ×
                  </button>
                )}

              </div>

            </div>

            <div className="menu-search-body">

              {!searchQuery.trim() && (
                <div className="menu-search-intro">
                  <span>
                    FIND YOUR FAVOURITE
                  </span>

                  <h2>
                    What are you craving?
                  </h2>

                  <p>
                    Search dishes, ingredients,
                    snacks, tiffin and more.
                  </p>
                </div>
              )}

              {searchQuery.trim() && (
                <div className="menu-search-results-header">
                  <strong>
                    Search results
                  </strong>

                  <span>
                    {searchResults.length}{" "}
                    {searchResults.length ===
                    1
                      ? "item"
                      : "items"}
                  </span>
                </div>
              )}

              {/* PREDICTIVE */}
              {searchQuery.trim() && (
                <div className="menu-search-suggestions">

                  {searchResults
                    .slice(0, 6)
                    .map(
                      (product) => (
                        <button
                          type="button"
                          key={product.id}
                          className="menu-search-suggestion"
                          onClick={() =>
                            openProduct(
                              product
                            )
                          }
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

                          <span>
                            <strong>
                              {
                                product.name
                              }
                            </strong>

                            <small>
                              {getSearchPrice(
                                product
                              )}
                            </small>
                          </span>

                        </button>
                      )
                    )}

                </div>
              )}

              {searchQuery.trim() &&
                searchResults.length ===
                  0 && (
                  <div className="menu-search-empty">
                    <span>
                      🍲
                    </span>

                    <strong>
                      Nothing found
                    </strong>

                    <p>
                      Try another dish,
                      ingredient or keyword.
                    </p>
                  </div>
                )}

              {searchQuery.trim() &&
                searchResults.length >
                  0 && (
                  <div className="menu-search-result-grid">

                    {searchResults.map(
                      (product) => (
                        <ProductCard
                          key={
                            product.id
                          }
                          product={
                            product
                          }
                          availability={
                            categoryAvailability[
                              String(
                                product.category_id
                              )
                            ]
                          }
                          onOpen={
                            openProduct
                          }
                          onAdd={
                            addToCart
                          }
                          getCartQty={
                            getCartQty
                          }
                        />
                      )
                    )}

                  </div>
                )}

            </div>

          </div>

        </div>
      )}

      {/* =================================================
          PRODUCT MODAL
          ================================================= */}

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
          selectedVariantId={
            selectedVariantId
          }
          setSelectedVariantId={
            setSelectedVariantId
          }
          quantity={modalQty}
          setQuantity={
            setModalQty
          }
          onClose={
            closeProduct
          }
          onAdd={
            addModalVariant
          }
        />
      )}

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
    variantId: number | string
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

  const activeVariant =
    variants[0];

  const price =
    activeVariant.price;

  const oldPrice =
    activeVariant.old_price;

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

  const quantity =
    getCartQty(
      activeVariant.id
    );

  const notifyUrl =
    getWhatsAppUrl(
      product.name
    );

  return (
    <article
      className="menu-product-card"
    >

      <button
        type="button"
        className="menu-product-image-button"
        onClick={() =>
          onOpen(product)
        }
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
              Mithora Kitchen
            </div>
          )}

          {discount > 0 && (
            <span className="menu-discount-badge">
              {discount}% OFF
            </span>
          )}

        </div>

      </button>

      <div className="menu-product-details">

        <button
          type="button"
          className="menu-product-title-button"
          onClick={() =>
            onOpen(product)
          }
        >

          <div className="menu-product-title-row">

            <h3>
              {product.name}
            </h3>

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

        </button>

        {product.description && (
          <p className="menu-product-description">
            {
              product.description
            }
          </p>
        )}

        <div className="menu-product-bottom">

          <div className="menu-price">

            <strong>
              ₹{price}
            </strong>

            {validOldPrice(
              oldPrice,
              price
            ) && (
              <del>
                ₹{oldPrice}
              </del>
            )}

          </div>

          <div className="menu-product-action">

            {quantity > 0 ? (
              <div className="menu-qty-box">

                <button
                  type="button"
                  onClick={() => {
                    try {
                      const raw =
                        localStorage.getItem(
                          "cart"
                        );

                      if (!raw)
                        return;

                      const cart =
                        JSON.parse(
                          raw
                        );

                      const item =
                        cart.items?.find(
                          (
                            entry: {
                              variant_id:
                                number |
                                string;
                            }
                          ) =>
                            String(
                              entry.variant_id
                            ) ===
                            String(
                              activeVariant.id
                            )
                        );

                      if (!item)
                        return;

                      item.qty -= 1;

                      if (
                        item.qty <=
                        0
                      ) {
                        cart.items =
                          cart.items.filter(
                            (
                              entry: {
                                variant_id:
                                  number |
                                  string;
                              }
                            ) =>
                              String(
                                entry.variant_id
                              ) !==
                              String(
                                activeVariant.id
                              )
                          );
                      }

                      localStorage.setItem(
                        "cart",
                        JSON.stringify(
                          cart
                        )
                      );

                      window.dispatchEvent(
                        new Event(
                          "storage"
                        )
                      );
                    } catch {}
                  }}
                >
                  −
                </button>

                <span>
                  {quantity}
                </span>

                <button
                  type="button"
                  onClick={() =>
                    onAdd(
                      activeVariant.id
                    )
                  }
                >
                  +
                </button>

              </div>
            ) : !orderable ? (
              <a
                href={
                  notifyUrl
                }
                target="_blank"
                rel="noopener noreferrer"
                className="menu-notify-button"
              >
                <span>
                  WhatsApp
                </span>
                <small>
                  Notify
                </small>
              </a>
            ) : isMulti ? (
              <button
                type="button"
                className="menu-view-button"
                onClick={() =>
                  onOpen(product)
                }
              >
                VIEW OPTIONS
              </button>
            ) : (
              <button
                type="button"
                className="menu-add-button"
                onClick={() =>
                  onAdd(
                    activeVariant.id
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

/* =========================================================
   PRODUCT MODAL
   ========================================================= */

function ProductModal({
  product,
  availability,
  selectedVariantId,
  setSelectedVariantId,
  quantity,
  setQuantity,
  onClose,
  onAdd,
}: {
  product: Product;
  availability?: CategoryAvailability;
  selectedVariantId: string;
  setSelectedVariantId: (
    id: string
  ) => void;
  quantity: number;
  setQuantity: (
    value: number
  ) => void;
  onClose: () => void;
  onAdd: () => void;
}) {
  const variants =
    Array.isArray(
      product.variants
    )
      ? product.variants
      : [];

  const selectedVariant =
    variants.find(
      (variant) =>
        String(
          variant.id
        ) ===
        selectedVariantId
    ) || variants[0];

  const price =
    Number(
      selectedVariant?.price || 0
    );

  const oldPrice =
    selectedVariant?.old_price;

  const discount =
    getDiscount(
      oldPrice,
      price
    );

  const orderable =
    canOrder(
      availability
    );

  const total =
    price * quantity;

  const notifyUrl =
    getWhatsAppUrl(
      product.name,
      selectedVariant
        ? `\n\nOption: ${getVariantName(
            selectedVariant,
            0
          )}`
        : ""
    );

  useEffect(() => {
    const handleEscape =
      (event: KeyboardEvent) => {
        if (
          event.key === "Escape"
        ) {
          onClose();
        }
      };

    document.addEventListener(
      "keydown",
      handleEscape
    );

    document.body.classList.add(
      "menu-modal-open"
    );

    return () => {
      document.removeEventListener(
        "keydown",
        handleEscape
      );

      document.body.classList.remove(
        "menu-modal-open"
      );
    };
  }, [onClose]);

  return (
    <div
      className="menu-product-modal-overlay"
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

        <button
          type="button"
          className="menu-modal-close"
          onClick={onClose}
          aria-label="Close"
        >
          ×
        </button>

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
            <div>
              Mithora Kitchen
            </div>
          )}

          {discount > 0 && (
            <span className="menu-modal-discount">
              {discount}% OFF
            </span>
          )}

        </div>

        <div className="menu-modal-body">

          <span className="menu-modal-kicker">
            YOUR SELECTION
          </span>

          <h2>
            {product.name}
          </h2>

          {product.description && (
            <p className="menu-modal-description">
              {
                product.description
              }
            </p>
          )}

          {variants.length >
            0 && (
            <div className="menu-modal-section">

              <div className="menu-modal-section-title">
                Select option
              </div>

              <div className="menu-modal-variants">

                {variants.map(
                  (
                    variant,
                    index
                  ) => {
                    const selected =
                      String(
                        variant.id
                      ) ===
                      selectedVariantId;

                    const variantPrice =
                      Number(
                        variant.price ||
                          0
                      );

                    const variantOldPrice =
                      variant.old_price;

                    return (
                      <button
                        type="button"
                        key={
                          variant.id
                        }
                        className={`menu-modal-variant ${
                          selected
                            ? "selected"
                            : ""
                        }`}
                        onClick={() =>
                          setSelectedVariantId(
                            String(
                              variant.id
                            )
                          )
                        }
                      >

                        <span className="menu-modal-variant-copy">

                          <strong>
                            {getVariantName(
                              variant,
                              index
                            )}
                          </strong>

                          {variant.description && (
                            <small>
                              {
                                variant.description
                              }
                            </small>
                          )}

                        </span>

                        <span className="menu-modal-variant-price">

                          <strong>
                            ₹
                            {
                              variantPrice
                            }
                          </strong>

                          {validOldPrice(
                            variantOldPrice,
                            variantPrice
                          ) && (
                            <del>
                              ₹
                              {
                                variantOldPrice
                              }
                            </del>
                          )}

                        </span>

                      </button>
                    );
                  }
                )}

              </div>

            </div>
          )}

          <div className="menu-modal-quantity">

            <div>
              <strong>
                Quantity
              </strong>

              <small>
                Choose how many you'd like
              </small>
            </div>

            <div className="menu-modal-qty-picker">

              <button
                type="button"
                onClick={() =>
                  setQuantity(
                    Math.max(
                      1,
                      quantity - 1
                    )
                  )
                }
              >
                −
              </button>

              <span>
                {quantity}
              </span>

              <button
                type="button"
                onClick={() =>
                  setQuantity(
                    Math.min(
                      99,
                      quantity + 1
                    )
                  )
                }
              >
                +
              </button>

            </div>

          </div>

        </div>

        <div className="menu-modal-footer">

          <div className="menu-modal-total">

            <small>
              Total
            </small>

            <strong>
              ₹{total}
            </strong>

          </div>

          {!orderable ? (
            <a
              href={
                notifyUrl
              }
              target="_blank"
              rel="noopener noreferrer"
              className="menu-modal-whatsapp"
            >
              WhatsApp — Notify Me
            </a>
          ) : (
            <button
              type="button"
              className="menu-modal-add"
              onClick={
                onAdd
              }
            >
              ADD TO CART
            </button>
          )}

        </div>

      </div>

    </div>
  );
}

/* =========================================================
   SEARCH PRICE
   ========================================================= */

function getSearchPrice(
  product: Product
) {
  const variants =
    Array.isArray(
      product.variants
    )
      ? product.variants
      : [];

  const variant =
    variants[0];

  if (!variant) {
    return "";
  }

  const price =
    Number(
      variant.price || 0
    );

  const oldPrice =
    variant.old_price;

  if (
    validOldPrice(
      oldPrice,
      price
    )
  ) {
    return `₹${price} · ₹${oldPrice}`;
  }

  return `₹${price}`;
}