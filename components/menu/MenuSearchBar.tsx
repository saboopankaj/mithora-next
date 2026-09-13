"use client";

export default function MenuSearchBar({
  value,
  onOpen,
}: {
  value: string;
  onOpen: () => void;
}) {
  return (
    <button type="button" className="menu-search-trigger" onClick={onOpen}>
      <span className="menu-search-icon">
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <circle cx="11" cy="11" r="7" />
          <path d="m20 20-4-4" />
        </svg>
      </span>
      <span>{value || "Search dishes, snacks, tiffin & more"}</span>
    </button>
  );
}
