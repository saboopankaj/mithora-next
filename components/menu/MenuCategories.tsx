"use client";

import type { Category } from "./types";

export default function MenuCategories({
  categories,
  selectedCategory,
  onSelect,
}: {
  categories: Category[];
  selectedCategory: string;
  onSelect: (categoryId: string) => void;
}) {
  return (
    <div className="menu-category-scroll">
      <button
        type="button"
        className={`menu-category-pill ${selectedCategory === "all" ? "active" : ""}`}
        onClick={() => onSelect("all")}
      >
        <span>All Items</span>
      </button>
      {categories.map((category) => (
        <button
          type="button"
          key={category.id}
          className={`menu-category-pill ${String(selectedCategory) === String(category.id) ? "active" : ""}`}
          onClick={() => onSelect(String(category.id))}
        >
          <span>{category.name}</span>
        </button>
      ))}
    </div>
  );
}
