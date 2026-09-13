"use client";

import { useEffect, useMemo, useState } from "react";
import MenuHero from "./MenuHero";
import MenuSearchBar from "./MenuSearchBar";
import MenuCategories from "./MenuCategories";
import FeaturedMenu from "./FeaturedMenu";
import MenuCategorySection from "./MenuCategorySection";
import MenuSearchPage from "./MenuSearch";
import ProductModal from "./ProductModal";
import MenuLoader from "./MenuLoader";
import MenuEmptyState from "./MenuEmptyState";
import type { Category, CategoryAvailability, Product, Cart } from "./types";
import { WHATSAPP_NUMBER, readCart, writeCart, isFeatured } from "./menu-utils";

export default function MenuShell() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [categoryAvailability, setCategoryAvailability] = useState<Record<string, CategoryAvailability>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [searchOpen, setSearchOpen] = useState(false);
  const [modalProduct, setModalProduct] = useState<Product | null>(null);
  const [featuredIndex, setFeaturedIndex] = useState(0);
  const [cartVersion, setCartVersion] = useState(0);

  useEffect(() => {
    const updateMenuOffsets = () => {
      const header = document.getElementById("site-header");
      const controls = document.querySelector<HTMLElement>(".menu-sticky-controls");
      const headerHeight = header?.getBoundingClientRect().height || 56;
      const controlsHeight = controls?.getBoundingClientRect().height || 112;
      document.documentElement.style.setProperty("--menu-header-height", `${Math.round(headerHeight)}px`);
      document.documentElement.style.setProperty("--menu-controls-height", `${Math.round(controlsHeight)}px`);
    };
    updateMenuOffsets();
    const frame = window.requestAnimationFrame(updateMenuOffsets);
    window.addEventListener("resize", updateMenuOffsets);
    return () => { window.cancelAnimationFrame(frame); window.removeEventListener("resize", updateMenuOffsets); };
  }, [categories.length, loading]);

  useEffect(() => {
    const locked = Boolean(modalProduct || searchOpen);
    const html = document.documentElement;
    const body = document.body;
    html.classList.toggle("menu-scroll-locked", locked);
    body.classList.toggle("menu-scroll-locked", locked);
    return () => { html.classList.remove("menu-scroll-locked"); body.classList.remove("menu-scroll-locked"); };
  }, [modalProduct, searchOpen]);

  useEffect(() => {
    let cancelled = false;
    async function loadMenu() {
      try {
        setLoading(true); setError("");
        const [categoriesResponse, productsResponse, availabilityResponse] = await Promise.all([
          fetch("/api/menu/categories?active=1"),
          fetch("/api/menu/products"),
          fetch("/api/menu/category-availability"),
        ]);
        if (!categoriesResponse.ok) throw new Error("Unable to load categories");
        if (!productsResponse.ok) throw new Error("Unable to load products");
        const categoriesData = await categoriesResponse.json();
        const productsData = await productsResponse.json();
        const loadedCategories: Category[] = categoriesData.categories || [];
        const loadedProducts: Product[] = productsData.products || [];
        const loadedAvailability: Record<string, CategoryAvailability> = {};
        if (availabilityResponse.ok) {
          const availabilityData = await availabilityResponse.json();
          (availabilityData.categories || []).forEach((item: CategoryAvailability) => {
            loadedAvailability[String(item.category_id)] = item;
          });
        }
        if (cancelled) return;
        setCategories(loadedCategories); setProducts(loadedProducts); setCategoryAvailability(loadedAvailability);
      } catch (err) {
        console.error("Menu loading failed:", err);
        if (!cancelled) setError("Unable to load the menu right now. Please try again.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    loadMenu();
    return () => { cancelled = true; };
  }, []);

  useEffect(() => {
    const refreshCart = () => setCartVersion((value) => value + 1);
    window.addEventListener("cart:updated", refreshCart);
    return () => window.removeEventListener("cart:updated", refreshCart);
  }, []);

  const featuredProducts = useMemo(() => products.filter((product) => isFeatured(product) && Array.isArray(product.variants) && product.variants.length > 0), [products]);
  const searchText = searchQuery.trim().toLowerCase();
  const filteredProducts = useMemo(() => {
    let result = [...products];
    if (selectedCategory !== "all" && !searchOpen) result = result.filter((product) => String(product.category_id) === String(selectedCategory));
    if (searchText) {
      result = result.filter((product) => {
        const name = product.name?.toLowerCase() || "";
        const description = product.description?.toLowerCase() || "";
        const variants = product.variants?.map((variant) => `${variant.variant_name || ""} ${variant.description || ""}`).join(" ").toLowerCase() || "";
        return name.includes(searchText) || description.includes(searchText) || variants.includes(searchText);
      });
    }
    return result;
  }, [products, selectedCategory, searchText, searchOpen]);

  const cart = useMemo<Cart>(() => { void cartVersion; return readCart(); }, [cartVersion]);

  function openSearch() { setSearchOpen(true); setSelectedCategory("all"); }
  function closeSearch() { setSearchOpen(false); setSearchQuery(""); }

  function selectCategory(categoryId: string) {
    setSelectedCategory(categoryId); setSearchQuery("");
    if (searchOpen) closeSearch();
    window.setTimeout(() => {
      if (categoryId === "all") { window.scrollTo({ top: 0, behavior: "smooth" }); return; }
      const element = document.getElementById(`menu-category-${categoryId}`);
      if (!element) return;
      const header = document.querySelector(".site-header");
      const headerHeight = header?.getBoundingClientRect().height || 80;
      const stickyControls = document.querySelector(".menu-sticky-controls");
      const stickyHeight = stickyControls?.getBoundingClientRect().height || 115;
      const offset = headerHeight + stickyHeight + 20;
      const top = element.getBoundingClientRect().top + window.scrollY - offset;
      window.scrollTo({ top: Math.max(top, 0), behavior: "smooth" });
    }, 100);
  }

  function handleCart(variantId: number | string, delta: number) {
    const currentCart = readCart();
    const existing = currentCart.items.find((item) => String(item.variant_id) === String(variantId));
    if (!existing && delta > 0) currentCart.items.push({ variant_id: variantId, qty: 1 });
    else if (existing) {
      const nextQty = existing.qty + delta;
      if (nextQty <= 0) currentCart.items = currentCart.items.filter((item) => String(item.variant_id) !== String(variantId));
      else existing.qty = nextQty;
    }
    writeCart(currentCart); setCartVersion((value) => value + 1);
  }

  function notifyWhatsApp(product: Product) {
    const message = `I want to be notified when ${product.name} is available.`;
    const url = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(message)}`;
    window.open(url, "_blank", "noopener,noreferrer");
  }

  function moveFeatured(direction: number) {
    if (!featuredProducts.length) return;
    setFeaturedIndex((current) => { const next = current + direction; if (next < 0) return featuredProducts.length - 1; if (next >= featuredProducts.length) return 0; return next; });
  }

  return (
    <section className="menu-page-shell">
      <section className="menu-sticky-controls">
        <div className="menu-shell-container">
          <MenuSearchBar value={searchQuery} onOpen={openSearch} />
          <MenuCategories
  categories={categories}
  activeCategory={selectedCategory}
  onSelect={setSelectedCategory}
/>
        </div>
      </section>

      <MenuHero />

      {loading && <MenuLoader />}
      {!loading && error && (
        <div className="menu-shell-container">
          <div className="menu-error-box">
            <strong>Something went wrong</strong>
            <span>{error}</span>
            <button type="button" onClick={() => window.location.reload()}>TRY AGAIN</button>
          </div>
        </div>
      )}

      {!loading && !error && (
        <>
          {selectedCategory === "all" && !searchText && featuredProducts.length > 0 && (
            <FeaturedMenu products={featuredProducts} index={featuredIndex} availability={categoryAvailability} onPrevious={() => moveFeatured(-1)} onNext={() => moveFeatured(1)} onSelect={setModalProduct} />
          )}
          <main className="menu-content">
            <div className="menu-shell-container">
              {categories.map((category) => {
                const categoryProducts = filteredProducts.filter((product) => String(product.category_id) === String(category.id));
                return <MenuCategorySection key={category.id} category={category} products={categoryProducts} availability={categoryAvailability[String(category.id)]} cart={cart} onOpen={setModalProduct} onAdd={handleCart} onNotify={notifyWhatsApp} />;
              })}
              {filteredProducts.length === 0 && <MenuEmptyState onReset={() => { setSearchQuery(""); setSelectedCategory("all"); }} />}
            </div>
          </main>
        </>
      )}

      {searchOpen && <MenuSearchPage categories={categories} products={filteredProducts} searchQuery={searchQuery} setSearchQuery={setSearchQuery} onBack={closeSearch} onOpenProduct={setModalProduct} availability={categoryAvailability} cart={cart} onAdd={handleCart} onNotify={notifyWhatsApp} />}
      {modalProduct && <ProductModal product={modalProduct} availability={categoryAvailability[String(modalProduct.category_id)]} cart={cart} onClose={() => setModalProduct(null)} onAdd={handleCart} onNotify={notifyWhatsApp} />}
    </section>
  );
}
