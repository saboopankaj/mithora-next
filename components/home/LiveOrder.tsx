export default function LiveOrder() {
  return (
    <section className="live-order-section">
      <div className="live-container">

        <div className="live-status-bar">

          <div className="pulse-wrapper">
            <div className="pulse-dot"></div>

            <span className="status-text">
              Accepting Orders Now
            </span>
          </div>

          <div className="platform-tag">
            Website Live • Available on Zomato 🍽️
          </div>

        </div>


        <div className="live-content">

          <h2 className="live-title">
            Fresh Homemade Food Delivered
          </h2>

          <p className="live-sub">
            Straight from our kitchen in Murlipura to your doorstep. Every meal
            is prepared fresh after you order.
          </p>


          <div className="coupon-grid">

            <div className="coupon-pill">
              <span className="cp-code">
                WELCOME100
              </span>

              <span className="cp-desc">
                ₹100 OFF
              </span>
            </div>

            <div className="coupon-pill">
              <span className="cp-code">
                MK50
              </span>

              <span className="cp-desc">
                ₹50 OFF
              </span>
            </div>

            <div className="coupon-pill">
              <span className="cp-code">
                FLAT30
              </span>

              <span className="cp-desc">
                30% OFF
              </span>
            </div>

          </div>


          <div className="live-action-group">

            <a
              href="/menu"
              className="live-btn primary-btn"
            >
              <i className="ph-shopping-cart-simple-fill"></i>
              Order Online Now
            </a>

            <a
              href="https://wa.me/918657427432?text=Order%20food"
              target="_blank"
              rel="noopener noreferrer"
              className="live-btn whatsapp-btn"
            >
              <i className="ph-whatsapp-logo-fill"></i>
              Order on WhatsApp
            </a>

          </div>


          <div className="live-areas">

            <div className="area-label">
              <i className="ph-map-pin-fill"></i>
              Serving Jaipur Areas:
            </div>

            <div className="area-list">
              <span>Murlipura</span>
              <span className="dot"></span>

              <span>Jhotwara</span>
              <span className="dot"></span>

              <span>Vidhyadhar Nagar</span>
              <span className="dot"></span>

              <span>Bani Park</span>
            </div>

          </div>

        </div>

      </div>
    </section>
  );
}