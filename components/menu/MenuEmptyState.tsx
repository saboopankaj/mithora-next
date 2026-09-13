"use client";

export default function MenuEmptyState({ onReset }: { onReset: () => void }) {
  return (
    <div className="menu-empty-state">
      <div className="menu-empty-icon">🍲</div>
      <h2>Nothing found</h2>
      <p>Try another dish, category or keyword.</p>
      <button type="button" onClick={onReset}>SHOW ALL ITEMS</button>
    </div>
  );
}
