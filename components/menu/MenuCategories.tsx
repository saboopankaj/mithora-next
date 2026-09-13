"use client";

import type { Category } from "./types";

export default function MenuCategories({
  categories,
  activeCategory,
  onSelect,
}: {
  categories: Category[];
  activeCategory: string;
  onSelect: (categoryId: string) => void;
}) {
  return (
    <div className="menu-categories-wrapper">
      <div className="menu-categories">

        {/* ALL ITEMS */}

        <button
          type="button"
          className={`menu-category-item ${
            activeCategory === "all"
              ? "active"
              : ""
          }`}
          onClick={() => onSelect("all")}
        >
          <div className="menu-category-image">
            <img
              src="/images/menu/categories/all-items.png"
              alt="All Items"
            />
          </div>

          <span>All Items</span>
        </button>


        {/* API CATEGORIES */}

        {categories.map((category) => (
          <button
            type="button"
            key={String(category.id)}
            className={`menu-category-item ${
              activeCategory ===
              String(category.id)
                ? "active"
                : ""
            }`}
            onClick={() =>
              onSelect(
                String(category.id)
              )
            }
          >

            <div className="menu-category-image">

              <img
                src={
                  typeof category.image_path ===
                  "string"
                    ? category.image_path
                    : "/images/menu/categories/default.png"
                }
                alt={category.name}
              />

            </div>

            <span>
              {category.name}
            </span>

          </button>
        ))}

      </div>
    </div>
  );
}