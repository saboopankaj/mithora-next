export default function CateringSection() {
  return (
    <section className="catering-parent-section">
      <div className="container">

        {/* INTRO */}
        <div className="section-intro">
          <span className="badge-gold">
            NO ADVANCE PAYMENT REQUIRED
          </span>

          <h2 className="main-title">
            Pure Veg Party Catering
          </h2>

          <p className="sub-title">
            Homemade taste for 10 to 100 people in Murlipura, Jhotwara &amp;
            nearby areas.
          </p>
        </div>

        {/* PACKAGE CARDS */}
        <div className="package-grid">

          {/* STANDARD */}
          <div className="menu-card">
            <div className="card-tag">
              Budget Friendly
            </div>

            <h3>Standard Menu</h3>

            <div className="price-box">
              <span className="currency">₹</span>
              <span className="amount">180</span>
              <span className="per">/plate</span>
            </div>

            <ul className="item-list">
              <li>
                <i className="ph-check-circle-fill"></i>
                3 Tawa Roti (Atta)
              </li>

              <li>
                <i className="ph-check-circle-fill"></i>
                Seasonal Mix Veg
              </li>

              <li>
                <i className="ph-check-circle-fill"></i>
                Yellow Dal Tadka
              </li>

              <li>
                <i className="ph-check-circle-fill"></i>
                Steamed Rice / Jeera Rice
              </li>

              <li>
                <i className="ph-check-circle-fill"></i>
                Boondi Raita &amp; Salad
              </li>
            </ul>

            <a
              href="https://wa.me/918657427432?text=Enquiry%20for%20180%20Plan"
              target="_blank"
              rel="noopener noreferrer"
              className="card-btn"
            >
              Get Quote on WhatsApp
            </a>
          </div>

          {/* EXECUTIVE */}
          <div className="menu-card featured">
            <div className="best-value">
              Most Popular
            </div>

            <div className="card-tag gold">
              Premium Taste
            </div>

            <h3>Executive Menu</h3>

            <div className="price-box">
              <span className="currency">₹</span>
              <span className="amount">235</span>
              <span className="per">/plate</span>
            </div>

            <ul className="item-list">
              <li>
                <i className="ph-star-fill"></i>
                Shahi Paneer / Kadai Paneer
              </li>

              <li>
                <i className="ph-star-fill"></i>
                1 Seasonal Special Sabji
              </li>

              <li>
                <i className="ph-star-fill"></i>
                Choice of Sweet (Gulab Jamun)
              </li>

              <li>
                <i className="ph-star-fill"></i>
                Veg Pulao &amp; Special Raita
              </li>

              <li>
                <i className="ph-star-fill"></i>
                2 Snacks/Starters
              </li>
            </ul>

            <a
              href="https://wa.me/918657427432?text=Enquiry%20for%20235%20Plan"
              target="_blank"
              rel="noopener noreferrer"
              className="card-btn gold-btn"
            >
              Get Quote on WhatsApp
            </a>
          </div>

          {/* CELEBRATION */}
          <div className="menu-card">
            <div className="card-tag purple">
              Royal Feast
            </div>

            <h3>Celebration Menu</h3>

            <div className="price-box">
              <span className="currency">₹</span>
              <span className="amount">275</span>
              <span className="per">/plate</span>
            </div>

            <ul className="item-list">
              <li>
                <i className="ph-crown-fill"></i>
                2 Paneer &amp; 2 Special Veg
              </li>

              <li>
                <i className="ph-crown-fill"></i>
                Ghee Paratha &amp; Missi Roti
              </li>

              <li>
                <i className="ph-crown-fill"></i>
                2 Premium Sweets
              </li>

              <li>
                <i className="ph-crown-fill"></i>
                Welcome Drink / Aamras
              </li>

              <li>
                <i className="ph-crown-fill"></i>
                Full Chaat Counter items
              </li>
            </ul>

            <a
              href="https://wa.me/918657427432?text=Enquiry%20for%20275%20Plan"
              target="_blank"
              rel="noopener noreferrer"
              className="card-btn"
            >
              Get Quote on WhatsApp
            </a>
          </div>

        </div>

        {/* SIGNATURE SPECIAL */}
        <div className="signature-card">

          <div className="signature-content">

            <div className="signature-badge">
              <span className="pulse-icon"></span>
              Jaipur&apos;s Authentic Best
            </div>

            <h3 className="signature-title">
              Authentic Dal Baati Churma
            </h3>

            <p className="signature-description">
              Experience the soul of Rajasthan. Our hand-rolled Baatis are
              slow-baked and dipped in <strong>Shuddh Desi Ghee</strong>.
              Served with traditional Panchmel Dal, spicy Lahsun Chutney,
              and your choice of Besan or Rose Churma.
            </p>

            <div className="signature-features">

              <div className="feature-item">
                <i className="ph-fire-fill"></i>
                <span>Fresh Tandoor Baati</span>
              </div>

              <div className="feature-item">
                <i className="ph-drop-half-bottom-fill"></i>
                <span>Pure Desi Ghee</span>
              </div>

            </div>

            <div className="signature-action">
              <a
                href="/party-orders-jaipur"
                className="primary-signature-btn"
              >
                View Full Menu
                <i className="ph-arrow-right"></i>
              </a>
            </div>

          </div>

          <div className="signature-image-wrapper">
            <img
              src="/images/menu/all-day-meal/dal-bati-churma-jaipur.webp"
              alt="Dal Baati Jaipur"
              className="signature-img"
            />

            <div className="image-overlay-card">
              <span className="overlay-price">
                From ₹249
              </span>
            </div>
          </div>

        </div>

        {/* ESTIMATOR */}
        <div className="estimator-banner">

          <div className="est-text">
            <h4>Not sure about the cost?</h4>

            <p>
              Use our Estimator Tool to check exact food quantity and price
              for your guests.
            </p>
          </div>

          <a
            href="/party-orders-jaipur?estimator=1"
            className="est-btn"
          >
            <i className="ph-calculator"></i>
            Open Estimator
          </a>

        </div>

      </div>
    </section>
  );
}