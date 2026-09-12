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
  description?: string;
  price?: number | string;
  old_price?: number | string | null;
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
  is_featured?: number | boolean | string;
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

const WHATSAPP_NUMBER = "918657427432";
const CART_KEY = "cart";

function getNumber(value: unknown): number {
  const n = Number(value);
  return Number.isFinite(n) ? n : 0;
}

function getDiscount(price: unknown, oldPrice: unknown): number {
  const p = getNumber(price);
  const old = getNumber(oldPrice);

  if (!p || !old || old <= p) return 0;

  return Math.round(((old - p) / old) * 100);
}

function isFeatured(product: Product): boolean {
  return (
    product.is_featured === true ||
    product.is_featured === 1 ||
    product.is_featured === "1" ||
    product.is_featured === "true"
  );
}

function canOrderFromAvailability(
  availability?: CategoryAvailability
): boolean {
  if (!availability) return false;

  return Boolean(
    availability.delivery_type === "SUBSCRIPTION" ||
      availability.orderable_now ||
      availability.status === "OPEN" ||
      availability.status === "NEXT_DAY"
  );
}

function readCart(): { items: CartItem[]; coupon_code?: string } {
  if (typeof window === "undefined") {
    return { items: [] };
  }

  try {
    const raw = localStorage.getItem(CART_KEY);

    if (!raw) return { items: [] };

    const parsed = JSON.parse(raw);

    if (!parsed || !Array.isArray(parsed.items)) {
      return { items: [] };
    }

    return parsed;
  } catch {
    return { items: [] };
  }
}

function writeCart(cart: {
  items: CartItem[];
  coupon_code?: string;
}) {
  localStorage.setItem(
    CART_KEY,
    JSON.stringify({
      ...cart,
      items: Array.isArray(cart.items)
        ? cart.items
        : [],
    })
  );

  window.dispatchEvent(new Event("cart:updated"));
  window.dispatchEvent(new Event("storage"));
}

export default function MenuShell() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [products, setProducts] = useState<Product[]>([]);

  const [categoryAvailability, setCategoryAvailability] =
    useState<Record<string, CategoryAvailability>>({});

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] =
    useState("all");

  const [searchOpen, setSearchOpen] = useState(false);

  const [modalProduct, setModalProduct] =
    useState<Product | null>(null);

  const [featuredIndex, setFeaturedIndex] = useState(0);

  const [cartVersion, setCartVersion] = useState(0);

  /* -----------------------------------------------------
     LOAD MENU
  ----------------------------------------------------- */

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
          fetch("/api/menu/categories?active=1"),
          fetch("/api/menu/products"),
          fetch("/api/menu/category-availability"),
        ]);

        if (!categoriesResponse.ok) {
          throw new Error(
            "Unable to load categories"
          );
        }

        if (!productsResponse.ok) {
          throw new Error(
            "Unable to load products"
          );
        }

        const categoriesData =
          await categoriesResponse.json();

        const productsData =
          await productsResponse.json();

        const loadedCategories: Category[] =
          categoriesData.categories || [];

        const loadedProducts: Product[] =
          productsData.products || [];

        const loadedAvailability: Record<
          string,
          CategoryAvailability
        > = {};

        if (availabilityResponse.ok) {
          const availabilityData =
            await availabilityResponse.json();

          (
            availabilityData.categories || []
          ).forEach(
            (item: CategoryAvailability) => {
              loadedAvailability[
                String(item.category_id)
              ] = item;
            }
          );
        }

        if (cancelled) return;

        setCategories(loadedCategories);
        setProducts(loadedProducts);
        setCategoryAvailability(
          loadedAvailability
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

  /* -----------------------------------------------------
     CART LISTENER
  ----------------------------------------------------- */

  useEffect(() => {
    const refreshCart = () => {
      setCartVersion((value) => value + 1);
    };

    window.addEventListener(
      "cart:updated",
      refreshCart
    );

    return () => {
      window.removeEventListener(
        "cart:updated",
        refreshCart
      );
    };
  }, []);

  /* -----------------------------------------------------
     FEATURED
     
     IMPORTANT:
     NO AUTO SLIDER HERE.
     User controls it manually.
  ----------------------------------------------------- */

  const featuredProducts = useMemo(() => {
    return products.filter(
      (product) =>
        isFeatured(product) &&
        Array.isArray(product.variants) &&
        product.variants.length > 0
    );
  }, [products]);

  /* -----------------------------------------------------
     SEARCH
  ----------------------------------------------------- */

  const searchText =
    searchQuery.trim().toLowerCase();

  const filteredProducts = useMemo(() => {
    let result = [...products];

    if (
      selectedCategory !== "all" &&
      !searchOpen
    ) {
      result = result.filter(
        (product) =>
          String(product.category_id) ===
          String(selectedCategory)
      );
    }

    if (searchText) {
      result = result.filter((product) => {
        const name =
          product.name?.toLowerCase() || "";

        const description =
          product.description?.toLowerCase() ||
          "";

        const variants =
          product.variants
            ?.map(
              (variant) =>
                `${variant.variant_name || ""} ${
                  variant.description || ""
                }`
            )
            .join(" ")
            .toLowerCase() || "";

        return (
          name.includes(searchText) ||
          description.includes(searchText) ||
          variants.includes(searchText)
        );
      });
    }

    return result;
  }, [
    products,
    selectedCategory,
    searchText,
    searchOpen,
  ]);

  /* -----------------------------------------------------
     SEARCH OPEN
  ----------------------------------------------------- */

  function openSearch() {
    setSearchOpen(true);
    setSelectedCategory("all");

    document.body.style.overflow = "hidden";
  }

  function closeSearch() {
    setSearchOpen(false);
    setSearchQuery("");

    document.body.style.overflow = "";
  }

  /* -----------------------------------------------------
     CATEGORY
  ----------------------------------------------------- */

  function selectCategory(
    categoryId: string
  ) {
    setSelectedCategory(categoryId);
    setSearchQuery("");

    if (searchOpen) {
      closeSearch();
    }

    window.setTimeout(() => {
      if (categoryId === "all") {
        window.scrollTo({
          top: 0,
          behavior: "smooth",
        });

        return;
      }

      const element =
        document.getElementById(
          `menu-category-${categoryId}`
        );

      if (!element) return;

      const header =
        document.querySelector(
          "#site-header"
        );

      const headerHeight =
        header?.getBoundingClientRect()
          .height || 80;

      const stickyControls =
        document.querySelector(
          ".menu-sticky-controls"
        );

      const stickyHeight =
        stickyControls?.getBoundingClientRect()
          .height || 115;

      const offset =
        headerHeight +
        stickyHeight +
        20;

      const top =
        element.getBoundingClientRect().top +
        window.scrollY -
        offset;

      window.scrollTo({
        top: Math.max(top, 0),
        behavior: "smooth",
      });
    }, 100);
  }

  /* -----------------------------------------------------
     CART
  ----------------------------------------------------- */

  const cart = useMemo(() => {
    void cartVersion;

    return readCart();
  }, [cartVersion]);

  function handleCart(
    variantId: number | string,
    delta: number
  ) {
    const currentCart = readCart();

    const existing =
      currentCart.items.find(
        (item) =>
          String(item.variant_id) ===
          String(variantId)
      );

    if (!existing && delta > 0) {
      currentCart.items.push({
        variant_id: variantId,
        qty: 1,
      });
    } else if (existing) {
      const nextQty =
        existing.qty + delta;

      if (nextQty <= 0) {
        currentCart.items =
          currentCart.items.filter(
            (item) =>
              String(item.variant_id) !==
              String(variantId)
          );
      } else {
        existing.qty = nextQty;
      }
    }

    writeCart(currentCart);

    setCartVersion(
      (value) => value + 1
    );
  }

  /* -----------------------------------------------------
     PRODUCT
  ----------------------------------------------------- */

  function openProduct(
    product: Product
  ) {
    setModalProduct(product);
    document.body.style.overflow = "hidden";
  }

  function closeProduct() {
    setModalProduct(null);

    if (!searchOpen) {
      document.body.style.overflow = "";
    }
  }

  function notifyWhatsApp(
    product: Product
  ) {
    const message =
      `I want to be notified when ${product.name} is available.`;

    const url =
      `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(
        message
      )}`;

    window.open(
      url,
      "_blank",
      "noopener,noreferrer"
    );
  }

  /* -----------------------------------------------------
     FEATURED MANUAL NAVIGATION
  ----------------------------------------------------- */

  function moveFeatured(
    direction: number
  ) {
    if (!featuredProducts.length) {
      return;
    }

    setFeaturedIndex((current) => {
      const next =
        current + direction;

      if (next < 0) {
        return (
          featuredProducts.length - 1
        );
      }

      if (
        next >=
        featuredProducts.length
      ) {
        return 0;
      }

      return next;
    });
  }

  /* =====================================================
     RENDER
  ===================================================== */

  return (
    <section className="menu-page-shell">

      {/* =================================================
          SHORT HERO
      ================================================= */}

      <section className="menu-hero">
        <div className="menu-shell-container">
          <span className="menu-hero-eyebrow">
            Fresh from the MITHORA kitchen
          </span>

          <h1>
            Homemade food,
            <br />
            made with care.
          </h1>

          <p>
            Freshly prepared meals, snacks, tiffin and festive favourites.
          </p>

          <div className="menu-hero-badges">
            <span>✦ 100% pure veg</span>
            <span>⊘ No preservatives</span>
            <span>♨ Made fresh daily</span>
          </div>
        </div>
      </section>

      {/* =================================================
          NORMAL SEARCH + CATEGORY BAR

          Search is now BELOW the fixed header.
      ================================================= */}

      <section className="menu-sticky-controls">
        <div className="menu-shell-container">

          <button
            type="button"
            className="menu-search-trigger"
            onClick={openSearch}
          >
            <span className="menu-search-icon">
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
            </span>

            <span>
              {searchQuery ||
                "Search dishes, snacks, tiffin & more"}
            </span>
          </button>

          <div className="menu-category-scroll">

            <button
              type="button"
              className={`menu-category-pill ${
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
                  className={`menu-category-pill ${
                    String(
                      selectedCategory
                    ) ===
                    String(category.id)
                      ? "active"
                      : ""
                  }`}
                  onClick={() =>
                    selectCategory(
                      String(category.id)
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
          LOADING
      ================================================= */}

      {loading && <MenuLoader />}

      {/* =================================================
          ERROR
      ================================================= */}

      {!loading && error && (
        <div className="menu-shell-container">
          <div className="menu-error-box">
            <strong>
              Something went wrong
            </strong>

            <span>{error}</span>

            <button
              type="button"
              onClick={() =>
                window.location.reload()
              }
            >
              TRY AGAIN
            </button>
          </div>
        </div>
      )}

      {/* =================================================
          MAIN MENU
      ================================================= */}

      {!loading && !error && (
        <>
          {selectedCategory === "all" &&
            !searchText &&
            featuredProducts.length > 0 && (
              <FeaturedCarousel
                products={
                  featuredProducts
                }
                index={featuredIndex}
                availability={
                  categoryAvailability
                }
                onPrevious={() =>
                  moveFeatured(-1)
                }
                onNext={() =>
                  moveFeatured(1)
                }
                onSelect={openProduct}
              />
            )}

          <main className="menu-content">
            <div className="menu-shell-container">

              {categories.map(
                (category) => {
                  const categoryProducts =
                    filteredProducts.filter(
                      (product) =>
                        String(
                          product.category_id
                        ) ===
                        String(category.id)
                    );

                  if (
                    !categoryProducts.length
                  ) {
                    return null;
                  }

                  const availability =
                    categoryAvailability[
                      String(category.id)
                    ];

                  const isOpen =
                    canOrderFromAvailability(
                      availability
                    );

                  return (
                    <section
                      key={category.id}
                      id={`menu-category-${category.id}`}
                      className="menu-category-section"
                    >
                      <div className="menu-category-heading">
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

                        <div className="menu-fresh-badge">
                          <span>✓</span>
                          Fresh every order
                        </div>
                      </div>

                      {availability?.user_message && (
                        <div
                          className={`menu-availability ${
                            isOpen
                              ? "open"
                              : "closed"
                          }`}
                        >
                          <span />

                          {
                            availability.user_message
                          }
                        </div>
                      )}

                      <div className="menu-product-grid">
                        {categoryProducts.map(
                          (product) => (
                            <ProductCard
                              key={
                                product.id
                              }
                              product={
                                product
                              }
                              availability={
                                availability
                              }
                              cart={cart}
                              onOpen={
                                openProduct
                              }
                              onAdd={
                                handleCart
                              }
                              onNotify={
                                notifyWhatsApp
                              }
                            />
                          )
                        )}
                      </div>
                    </section>
                  );
                }
              )}

              {filteredProducts.length ===
                0 && (
                <div className="menu-empty-state">
                  <div className="menu-empty-icon">
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
                      setSearchQuery("");
                      setSelectedCategory(
                        "all"
                      );
                    }}
                  >
                    SHOW ALL ITEMS
                  </button>
                </div>
              )}

            </div>
          </main>
        </>
      )}

      {/* =================================================
          SEARCH PAGE
      ================================================= */}

      {searchOpen && (
        <SearchPage
          categories={categories}
          products={filteredProducts}
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
          onBack={closeSearch}
          onOpenProduct={
            openProduct
          }
          availability={
            categoryAvailability
          }
          cart={cart}
          onAdd={handleCart}
          onNotify={
            notifyWhatsApp
          }
        />
      )}

      {/* =================================================
          PRODUCT MODAL
      ================================================= */}

      {modalProduct && (
        <ProductModal
          product={modalProduct}
          availability={
            categoryAvailability[
              String(
                modalProduct.category_id
              )
            ]
          }
          cart={cart}
          onClose={closeProduct}
          onAdd={handleCart}
          onNotify={
            notifyWhatsApp
          }
        />
      )}

    </section>
  );
}

/* =====================================================
   SEARCH PAGE
===================================================== */

function SearchPage({
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
              setSearchQuery(
                event.target.value
              )
            }
            placeholder="Search dishes, snacks, tiffin & more"
          />

          {searchQuery && (
            <button
              type="button"
              onClick={() =>
                setSearchQuery("")
              }
            >
              ×
            </button>
          )}
        </div>
      </div>

      <div className="menu-search-page-content">

        {/* ALL ITEMS DIRECTLY BELOW SEARCH */}

        <div className="menu-search-all-title">
          <div>
            <span>MENU</span>
            <h2>
              All Items
            </h2>
          </div>

          <small>
            {products.length}{" "}
            {products.length === 1
              ? "item"
              : "items"}
          </small>
        </div>

        <div className="menu-search-category-row">
          <span>
            Browse
          </span>

          {categories.map(
            (category) => (
              <button
                key={category.id}
                type="button"
                onClick={() => {
                  onBack();

                  window.setTimeout(
                    () => {
                      const element =
                        document.getElementById(
                          `menu-category-${category.id}`
                        );

                      if (
                        element
                      ) {
                        element.scrollIntoView(
                          {
                            behavior:
                              "smooth",
                            block:
                              "start",
                          }
                        );
                      }
                    },
                    100
                  );
                }}
              >
                {category.name}
              </button>
            )
          )}
        </div>

        {products.length > 0 ? (
          <div className="menu-product-grid">
            {products.map(
              (product) => (
                <ProductCard
                  key={product.id}
                  product={product}
                  availability={
                    availability[
                      String(
                        product.category_id
                      )
                    ]
                  }
                  cart={cart}
                  onOpen={
                    onOpenProduct
                  }
                  onAdd={onAdd}
                  onNotify={
                    onNotify
                  }
                />
              )
            )}
          </div>
        ) : (
          <div className="menu-empty-state">
            <div className="menu-empty-icon">
              🍲
            </div>

            <h2>
              No dishes found
            </h2>

            <p>
              Try another search.
            </p>
          </div>
        )}

      </div>
    </div>
  );
}

/* =====================================================
   PRODUCT CARD
===================================================== */

function ProductCard({
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
  onOpen: (
    product: Product
  ) => void;
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

  const rating = getNumber(
    product.avg_rating
  );

  const reviewCount =
    getNumber(
      product.review_count
    );

  return (
    <article className="menu-product-card">

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
            ★ FEATURED
          </span>
        )}
      </button>

      <div className="menu-product-body">

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

        {product.description && (
          <p className="menu-product-description">
            {product.description}
          </p>
        )}

        <div className="menu-product-bottom">

          <div className="menu-price-block">
            <strong>
              ₹{price}
            </strong>

            {oldPrice > price && (
              <span>
                ₹{oldPrice}
              </span>
            )}
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
                WHATSAPP NOTIFY
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
                  : "VIEW OPTIONS"}
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

        {isMulti &&
          quantity === 0 && (
            <button
              type="button"
              className="menu-options-link"
              onClick={() =>
                onOpen(product)
              }
            >
              {variants.length}{" "}
              options available
            </button>
          )}

      </div>
    </article>
  );
}

/* =====================================================
   FEATURED
===================================================== */

function FeaturedCarousel({
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
                  ? "VIEW OPTIONS"
                  : "ORDER NOW"}
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

function QuantityControl({
  quantity,
  onDecrease,
  onIncrease,
}: {
  quantity: number;
  onDecrease: () => void;
  onIncrease: () => void;
}) {
  return (
    <div className="menu-quantity-control">

      <button
        type="button"
        onClick={onDecrease}
      >
        −
      </button>

      <strong>
        {quantity}
      </strong>

      <button
        type="button"
        onClick={onIncrease}
      >
        +
      </button>

    </div>
  );
}

/* =====================================================
   PRODUCT MODAL
===================================================== */

function ProductModal({
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

function MenuLoader() {
  const kitchenItems = [
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

  return (
    <div className="menu-loader-area">
      <div className="menu-loader-card">

        <div className="menu-loader-offer">
          <span>OFFER</span>

          <strong>
            ₹100 OFF
          </strong>

          <b>
            ON YOUR FIRST ORDER
          </b>

          <small>
            Valid on orders above ₹400
          </small>
        </div>

        <div className="menu-loader-heading">

          <div className="menu-loader-icon">
            🍳
          </div>

          <div>
            <h3>
              Preparing the Mithora menu...
            </h3>

            <p>
              Fresh from our kitchen • Jaipur
            </p>
          </div>

        </div>

        <div className="menu-loader-grid">

          {kitchenItems.map(
            (item, index) => (
              <div
                className="menu-loader-item"
                key={item.text}
                style={{
                  animationDelay:
                    `${index * 100}ms`,
                }}
              >
                <div className="menu-loader-image">
                  <img
                    src={item.img}
                    alt={item.text}
                  />
                </div>

                <span>
                  {item.text}
                </span>
              </div>
            )
          )}

        </div>

        <div className="menu-loader-progress">
          <span />
        </div>

      </div>
    </div>
  );
}

/* =====================================================
   CART HELPERS
===================================================== */

function getQuantityForProduct(
  product: Product,
  cart: {
    items: CartItem[];
  }
): number {
  const variants =
    product.variants || [];

  for (const variant of variants) {
    const item =
      cart.items.find(
        (cartItem) =>
          String(
            cartItem.variant_id
          ) ===
          String(variant.id)
      );

    if (
      item &&
      item.qty > 0
    ) {
      return item.qty;
    }
  }

  return 0;
}

function getActiveVariantFromCart(
  product: Product,
  cart: {
    items: CartItem[];
  }
): Variant | null {
  const variants =
    product.variants || [];

  for (const variant of variants) {
    const item =
      cart.items.find(
        (cartItem) =>
          String(
            cartItem.variant_id
          ) ===
          String(variant.id)
      );

    if (
      item &&
      item.qty > 0
    ) {
      return variant;
    }
  }

  return null;
}