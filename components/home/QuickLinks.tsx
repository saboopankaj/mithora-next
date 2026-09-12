export default function QuickLinks() {
  return (
    <nav className="quick-links-bar" aria-label="Menu Categories">
      <div className="ql-container">
        <a href="/tiffin" className="ql-item">
          <i className="ph-package-fill" />
          <span>Tiffin Service</span>
        </a>

        <a href="/party-orders-jaipur" className="ql-item">
          <i className="ph-confetti-fill" />
          <span>Party Orders</span>
        </a>

        <a href="/vrat-specials" className="ql-item">
          <i className="ph-leaf-fill" />
          <span>Vrat Special</span>
        </a>

        <a
          href="/homemade-snacks-namkeen-jaipur"
          className="ql-item"
        >
          <i className="ph-cookie-fill" />
          <span>Homemade Snacks</span>
        </a>
      </div>
    </nav>
  );
}