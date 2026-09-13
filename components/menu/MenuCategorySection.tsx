import type { Category, CategoryAvailability, Product, Cart } from "./types";
import MenuProductCard from "./MenuProductCard";
import { canOrderFromAvailability } from "./menu-utils";

export default function MenuCategorySection({
  category,
  products,
  availability,
  cart,
  onOpen,
  onAdd,
  onNotify,
}: {
  category: Category;
  products: Product[];
  availability?: CategoryAvailability;
  cart: Cart;
  onOpen: (product: Product) => void;
  onAdd: (variantId: number | string, delta: number) => void;
  onNotify: (product: Product) => void;
}) {
  if (!products.length) return null;
  const isOpen = canOrderFromAvailability(availability);
  return (
    <section
      id={`menu-category-${category.id}`}
      className="menu-category-section"
    >
      <div className="menu-category-heading">
        <div className="menu-category-heading-main">
          <div className="menu-category-heading-icon" aria-hidden="true">🍽️</div>
          <div>
            <h2>{category.name}</h2>
            <span>{products.length} {products.length === 1 ? "item" : "items"}</span>
          </div>
        </div>
        <div className="menu-fresh-badge"><span>✓</span>Fresh Every Order</div>
      </div>
      {availability?.user_message && (
        <div className={`menu-availability ${isOpen ? "open" : "closed"}`}>
          <span />
          {availability.user_message}
        </div>
      )}
      <div className="menu-product-grid">
        {products.map((product) => (
          <MenuProductCard
            key={product.id}
            product={product}
            availability={availability}
            cart={cart}
            onOpen={onOpen}
            onAdd={onAdd}
            onNotify={onNotify}
          />
        ))}
      </div>
    </section>
  );
}
