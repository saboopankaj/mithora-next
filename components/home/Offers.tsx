export default function Offers() {
  return (
    <section className="offers-section">
      <div className="offers-container">

        <div className="offers-header">
          <span className="offers-tag">
            Fresh Deals
          </span>

          <h2 className="offers-title">
            Today&apos;s Kitchen Offers
          </h2>

          <p className="offers-subtitle">
            Save more on your favorite homemade food.
          </p>
        </div>

        <div className="offers-grid">

          <div className="offer-card">
            <div className="offer-card-content">
              <span className="offer-badge">
                WELCOME OFFER
              </span>

              <h3>₹100 OFF</h3>

              <p>
                Get ₹100 off on orders above ₹499.
              </p>

              <div className="offer-code">
                WELCOME100
              </div>
            </div>
          </div>

          <div className="offer-card">
            <div className="offer-card-content">
              <span className="offer-badge">
                SPECIAL OFFER
              </span>

              <h3>₹50 OFF</h3>

              <p>
                Get ₹50 off on orders above ₹299.
              </p>

              <div className="offer-code">
                MK50
              </div>
            </div>
          </div>

          <div className="offer-card">
            <div className="offer-card-content">
              <span className="offer-badge">
                FLAT DISCOUNT
              </span>

              <h3>30% OFF</h3>

              <p>
                Flat 30% off on orders above ₹199.
              </p>

              <div className="offer-code">
                SAVE30
              </div>
            </div>
          </div>

        </div>

        <div className="offers-footer">
          <a
            href="/offers-and-coupons"
            className="offers-btn"
          >
            View All Offers
            <i className="ph-arrow-right"></i>
          </a>
        </div>

      </div>
    </section>
  );
}