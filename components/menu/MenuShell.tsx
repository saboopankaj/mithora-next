"use client";

import { useEffect, useMemo, useState } from "react";
import MenuHero from "./MenuHero";
import MenuSearchBar from "./MenuSearchBar";
import MenuCategories from "./MenuCategories";
import FeaturedMenu from "./FeaturedMenu";
import MenuCategorySection from "./MenuCategorySection";
import MenuSearchPage from "./MenuSearch";
import ProductModal from "./ProductModal";
import MenuEmptyState from "./MenuEmptyState";
import type {
  Category,
  CategoryAvailability,
  Product,
  Cart,
} from "./types";
import { WHATSAPP_NUMBER, isFeatured } from "./menu-utils";
import { useCart } from "@/components/cart/CartProvider";


/* =========================================================
   PRODUCT SKELETON
   ========================================================= */

function ProductSkeletonCard() {
  return (
    <div className="menu-product-skeleton-card">
      <div className="menu-product-skeleton-image" />

      <div className="menu-product-skeleton-content">
        <div className="menu-product-skeleton-line menu-product-skeleton-title" />
        <div className="menu-product-skeleton-line menu-product-skeleton-short" />

        <div className="menu-product-skeleton-bottom">
          <div className="menu-product-skeleton-price" />
          <div className="menu-product-skeleton-button" />
        </div>
      </div>
    </div>
  );
}


function ProductSkeleton() {
  return (
    <section className="menu-product-skeleton-section">
      <div className="menu-shell-container">

        <div className="menu-product-skeleton-heading" />

        <div className="menu-product-skeleton-grid">
          {Array.from({ length: 6 }).map((_, index) => (
            <ProductSkeletonCard key={index} />
          ))}
        </div>

      </div>
    </section>
  );
}


/* =========================================================
   MENU SHELL
   ========================================================= */

export default function MenuShell() {

  const [categories, setCategories] =
    useState<Category[]>([]);

  const [products, setProducts] =
    useState<Product[]>([]);

  const [categoryAvailability, setCategoryAvailability] =
    useState<Record<string, CategoryAvailability>>({});

  /*
   * Category loading is independent from product loading.
   */
  const [categoriesLoading, setCategoriesLoading] =
    useState(true);

  const [productsLoading, setProductsLoading] =
    useState(true);

  const [error, setError] =
    useState("");

  const [searchQuery, setSearchQuery] =
    useState("");

  const [selectedCategory, setSelectedCategory] =
    useState("all");

  const [searchOpen, setSearchOpen] =
    useState(false);

  const [modalProduct, setModalProduct] =
    useState<Product | null>(null);

  const [featuredIndex, setFeaturedIndex] =
    useState(0);


  /* =========================================================
     MENU HEADER / STICKY OFFSET
     ========================================================= */

  useEffect(() => {

    const updateMenuOffsets = () => {

      const header =
        document.getElementById("site-header");

      const controls =
        document.querySelector<HTMLElement>(
          ".menu-sticky-controls"
        );

      const headerHeight =
        header?.getBoundingClientRect().height || 56;

      const controlsHeight =
        controls?.getBoundingClientRect().height || 112;

      document.documentElement.style.setProperty(
        "--menu-header-height",
        `${Math.round(headerHeight)}px`
      );

      document.documentElement.style.setProperty(
        "--menu-controls-height",
        `${Math.round(controlsHeight)}px`
      );
    };

    updateMenuOffsets();

    const frame =
      window.requestAnimationFrame(
        updateMenuOffsets
      );

    window.addEventListener(
      "resize",
      updateMenuOffsets
    );

    return () => {
      window.cancelAnimationFrame(frame);

      window.removeEventListener(
        "resize",
        updateMenuOffsets
      );
    };

  }, [categories.length, productsLoading]);


  /* =========================================================
     LOCK PAGE SCROLL WHEN SEARCH / MODAL IS OPEN
     ========================================================= */

  useEffect(() => {

    const locked =
      Boolean(modalProduct || searchOpen);

    const html =
      document.documentElement;

    const body =
      document.body;

    html.classList.toggle(
      "menu-scroll-locked",
      locked
    );

    body.classList.toggle(
      "menu-scroll-locked",
      locked
    );

    return () => {

      html.classList.remove(
        "menu-scroll-locked"
      );

      body.classList.remove(
        "menu-scroll-locked"
      );

    };

  }, [modalProduct, searchOpen]);


  /* =========================================================
     LOAD MENU
     
     IMPORTANT:
     
     1. Categories load FIRST.
     2. Categories are rendered immediately.
     3. Products + availability load AFTER categories.
     4. Products and availability load in parallel.
     ========================================================= */

  useEffect(() => {

    let cancelled = false;

    async function loadMenu() {

      try {

        setError("");

        setCategoriesLoading(true);
        setProductsLoading(true);


        /* =====================================================
           STEP 1 — CATEGORIES FIRST
           ===================================================== */

        const categoriesResponse =
          await fetch(
            "/api/menu/categories?active=1"
          );

        if (!categoriesResponse.ok) {
          throw new Error(
            "Unable to load categories"
          );
        }

        const categoriesData =
          await categoriesResponse.json();

        const loadedCategories:
          Category[] =
            categoriesData.categories || [];


        if (cancelled) return;


        /*
         * IMPORTANT:
         *
         * Categories are committed immediately.
         *
         * We do NOT wait for products or availability.
         */
        setCategories(
          loadedCategories
        );

        setCategoriesLoading(false);


        /* =====================================================
           STEP 2 — PRODUCTS + AVAILABILITY
           
           These can now load together.
           ===================================================== */

        const [
          productsResponse,
          availabilityResponse,
        ] = await Promise.all([

          fetch(
            "/api/menu/products"
          ),

          fetch(
            "/api/menu/category-availability"
          ),

        ]);


        /* =====================================================
           PRODUCTS
           ===================================================== */

        if (!productsResponse.ok) {

          throw new Error(
            "Unable to load products"
          );

        }

        const productsData =
          await productsResponse.json();

        const loadedProducts:
          Product[] =
            productsData.products || [];


        /* =====================================================
           CATEGORY AVAILABILITY
           ===================================================== */

        const loadedAvailability:
          Record<
            string,
            CategoryAvailability
          > = {};


        /*
         * Availability failure does NOT prevent the
         * menu products from displaying.
         */

        if (availabilityResponse.ok) {

          const availabilityData =
            await availabilityResponse.json();

          (
            availabilityData.categories || []
          ).forEach(
            (
              item: CategoryAvailability
            ) => {

              loadedAvailability[
                String(item.category_id)
              ] = item;

            }
          );

        }


        if (cancelled) return;


        /* =====================================================
           FINAL PRODUCT STATE
           ===================================================== */

        setProducts(
          loadedProducts
        );

        setCategoryAvailability(
          loadedAvailability
        );

        setProductsLoading(false);


      } catch (err) {

        console.error(
          "Menu loading failed:",
          err
        );


        if (!cancelled) {

          setError(
            err instanceof Error
              ? err.message
              : "Unable to load the menu right now. Please try again."
          );

          setProductsLoading(false);
          setCategoriesLoading(false);

        }

      }

    }


    loadMenu();


    return () => {
      cancelled = true;
    };

  }, []);


  /* =========================================================
     FEATURED PRODUCTS
     ========================================================= */

  const featuredProducts =
    useMemo(
      () =>
        products.filter(
          (product) =>
            isFeatured(product) &&
            Array.isArray(product.variants) &&
            product.variants.length > 0
        ),
      [products]
    );


  /* =========================================================
     SEARCH
     ========================================================= */

  const searchText =
    searchQuery.trim().toLowerCase();


  const filteredProducts =
    useMemo(() => {

      let result = [...products];


      /*
       * Category filtering
       */

      if (
        selectedCategory !== "all" &&
        !searchOpen
      ) {

        result =
          result.filter(
            (product) =>
              String(
                product.category_id
              ) ===
              String(
                selectedCategory
              )
          );

      }


      /*
       * Text search
       */

      if (searchText) {

        result =
          result.filter(
            (product) => {

              const name =
                product.name?.toLowerCase() ||
                "";

              const description =
                product.description?.toLowerCase() ||
                "";

              const variants =
                product.variants
                  ?.map(
                    (variant) =>
                      `${
                        variant.variant_name ||
                        ""
                      } ${
                        variant.description ||
                        ""
                      }`
                  )
                  .join(" ")
                  .toLowerCase() ||
                "";

              return (
                name.includes(searchText) ||
                description.includes(searchText) ||
                variants.includes(searchText)
              );

            }
          );

      }


      return result;

    }, [
      products,
      selectedCategory,
      searchText,
      searchOpen,
    ]);


  /* =========================================================
     CART
     ========================================================= */

  const {
    cart,
    addItem,
    updateQty,
  } = useCart();


  /* =========================================================
     SEARCH OPEN / CLOSE
     ========================================================= */

  function openSearch() {

    setSearchOpen(true);

    setSelectedCategory("all");

  }


  function closeSearch() {

    setSearchOpen(false);

    setSearchQuery("");

  }


  /* =========================================================
     CATEGORY SELECT
     ========================================================= */

  function selectCategory(
    categoryId: string
  ) {

    setSelectedCategory(
      categoryId
    );

    setSearchQuery("");


    if (searchOpen) {
      closeSearch();
    }


    /*
     * Keep existing scroll behavior.
     */

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
          ".site-header"
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


  /* =========================================================
     CART HANDLER
     ========================================================= */

  function handleCart(
    variantId: number | string,
    delta: number,
  ) {

    const currentItem =
      cart.items.find(
        (item) =>
          String(item.variant_id) ===
          String(variantId)
      );


    const currentQty =
      currentItem?.qty || 0;


    const nextQty =
      currentQty + delta;


    if (nextQty <= 0) {

      updateQty(
        variantId,
        0
      );

      return;

    }


    if (delta > 0) {

      addItem(
        variantId,
        delta
      );

      return;

    }


    updateQty(
      variantId,
      nextQty
    );

  }


  /* =========================================================
     WHATSAPP NOTIFICATION
     ========================================================= */

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


  /* =========================================================
     FEATURED SLIDER
     ========================================================= */

  function moveFeatured(
    direction: number
  ) {

    if (!featuredProducts.length) {
      return;
    }


    setFeaturedIndex(
      (current) => {

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

      }
    );

  }


  /* =========================================================
     RENDER
     ========================================================= */

  return (

    <section className="menu-page-shell">

      {/* =====================================================
          SEARCH + CATEGORIES
          These are NOT blocked by product loading.
          ===================================================== */}

      <section className="menu-sticky-controls">

        <div className="menu-shell-container">

          <MenuSearchBar
            value={searchQuery}
            onOpen={openSearch}
          />


          <MenuCategories
            categories={categories}
            activeCategory={selectedCategory}
            onSelect={selectCategory}
          />

        </div>

      </section>


      {/* =====================================================
          HERO
          ===================================================== */}

      <MenuHero />


      {/* =====================================================
          PRODUCT ERROR
          ===================================================== */}

      {!productsLoading &&
        error && (

          <div className="menu-shell-container">

            <div className="menu-error-box">

              <strong>
                Something went wrong
              </strong>

              <span>
                {error}
              </span>

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


      {/* =====================================================
          PRODUCT SKELETON
          Categories are already visible above.
          ===================================================== */}

      {productsLoading &&
        !error && (
          <ProductSkeleton />
        )}


      {/* =====================================================
          REAL MENU
          ===================================================== */}

      {!productsLoading &&
        !error && (

          <>

            {/* =================================================
                FEATURED
                ================================================= */}

            {selectedCategory === "all" &&
              !searchText &&
              featuredProducts.length > 0 && (

                <FeaturedMenu
                  products={featuredProducts}
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
                  onSelect={
                    setModalProduct
                  }
                />

              )}


            {/* =================================================
                CATEGORY PRODUCTS
                ================================================= */}

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
                          String(
                            category.id
                          )
                      );


                    return (

                      <MenuCategorySection
                        key={category.id}
                        category={category}
                        products={
                          categoryProducts
                        }
                        availability={
                          categoryAvailability[
                            String(
                              category.id
                            )
                          ]
                        }
                        cart={cart}
                        onOpen={
                          setModalProduct
                        }
                        onAdd={
                          handleCart
                        }
                        onNotify={
                          notifyWhatsApp
                        }
                      />

                    );

                  }
                )}


                {filteredProducts.length === 0 && (

                  <MenuEmptyState
                    onReset={() => {

                      setSearchQuery("");
                      setSelectedCategory(
                        "all"
                      );

                    }}
                  />

                )}

              </div>

            </main>

          </>

        )}


      {/* =====================================================
          SEARCH PAGE
          ===================================================== */}

      {searchOpen && (

        <MenuSearchPage
          categories={categories}
          products={filteredProducts}
          searchQuery={searchQuery}
          setSearchQuery={
            setSearchQuery
          }
          onBack={closeSearch}
          onOpenProduct={
            setModalProduct
          }
          availability={
            categoryAvailability
          }
          cart={cart}
          onAdd={handleCart}
          onNotify={notifyWhatsApp}
        />

      )}


      {/* =====================================================
          PRODUCT MODAL
          ===================================================== */}

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
          onClose={() =>
            setModalProduct(null)
          }
          onAdd={handleCart}
          onNotify={
            notifyWhatsApp
          }
        />

      )}


      {/* =====================================================
          PRODUCT SKELETON STYLES
          ===================================================== */}

      <style jsx>{`

        .menu-product-skeleton-section {
          width: 100%;
          padding: 20px 0 40px;
        }

        .menu-product-skeleton-heading {
          width: 180px;
          height: 22px;
          margin-bottom: 18px;
          border-radius: 8px;

          background:
            linear-gradient(
              90deg,
              #f1e7dc 25%,
              #faf1e8 50%,
              #f1e7dc 75%
            );

          background-size: 200% 100%;

          animation:
            mithora-product-shimmer
            1.4s
            ease-in-out
            infinite;
        }

        .menu-product-skeleton-grid {
          display: grid;

          grid-template-columns:
            repeat(
              2,
              minmax(0, 1fr)
            );

          gap: 16px;
        }

        .menu-product-skeleton-card {
          display: flex;
          flex-direction: column;

          min-width: 0;

          overflow: hidden;

          background: #fffaf4;

          border: 1px solid #f1e3d7;

          border-radius: 16px;
        }

        .menu-product-skeleton-image {
          width: 100%;
          aspect-ratio: 1 / 0.82;

          background:
            linear-gradient(
              90deg,
              #f1e7dc 25%,
              #faf1e8 50%,
              #f1e7dc 75%
            );

          background-size: 200% 100%;

          animation:
            mithora-product-shimmer
            1.4s
            ease-in-out
            infinite;
        }

        .menu-product-skeleton-content {
          padding: 12px;
        }

        .menu-product-skeleton-line,
        .menu-product-skeleton-price,
        .menu-product-skeleton-button {
          background:
            linear-gradient(
              90deg,
              #f1e7dc 25%,
              #faf1e8 50%,
              #f1e7dc 75%
            );

          background-size: 200% 100%;

          animation:
            mithora-product-shimmer
            1.4s
            ease-in-out
            infinite;
        }

        .menu-product-skeleton-line {
          height: 12px;
          border-radius: 999px;
        }

        .menu-product-skeleton-title {
          width: 78%;
        }

        .menu-product-skeleton-short {
          width: 55%;
          margin-top: 8px;
        }

        .menu-product-skeleton-bottom {
          display: flex;
          align-items: center;
          justify-content: space-between;

          margin-top: 16px;
        }

        .menu-product-skeleton-price {
          width: 52px;
          height: 16px;
          border-radius: 999px;
        }

        .menu-product-skeleton-button {
          width: 58px;
          height: 30px;
          border-radius: 999px;
        }

        @keyframes mithora-product-shimmer {

          0% {
            background-position: 200% 0;
          }

          100% {
            background-position: -200% 0;
          }

        }

        @media (min-width: 768px) {

          .menu-product-skeleton-grid {
            grid-template-columns:
              repeat(
                3,
                minmax(0, 1fr)
              );

            gap: 20px;
          }

          .menu-product-skeleton-section {
            padding-top: 28px;
          }

        }

        @media (min-width: 1200px) {

          .menu-product-skeleton-grid {
            grid-template-columns:
              repeat(
                4,
                minmax(0, 1fr)
              );

            gap: 22px;
          }

        }

        @media (max-width: 767px) {

          .menu-product-skeleton-section {
            padding:
              16px
              0
              32px;
          }

          .menu-product-skeleton-heading {
            width: 150px;
            height: 20px;
            margin-bottom: 14px;
          }

          .menu-product-skeleton-grid {
            gap: 12px;
          }

          .menu-product-skeleton-content {
            padding: 10px;
          }

          .menu-product-skeleton-card {
            border-radius: 14px;
          }

          .menu-product-skeleton-bottom {
            margin-top: 13px;
          }

        }

      `}</style>

    </section>

  );
}