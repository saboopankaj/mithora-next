export default function VratSection() {
  return (
    <section className="vrat-split-wrapper">
      <div className="vrat-custom-container">

        {/* LEFT CONTENT */}
        <div className="vrat-content-column">

          <span className="vrat-top-tag">
            🪔 100% Sattvic Kitchen
          </span>

          <h2 className="vrat-section-title">
            Shuddh Vrat &amp; Sattvic Food
          </h2>

          <p className="vrat-section-desc">
            Authentic fasting meals prepared with{" "}
            <strong>Sendha Namak and Desi Ghee</strong> in a separate,
            sanctified environment. Perfect for Ekadashi, Navratri, and
            Shivratri festivals in Jaipur.
          </p>

          <div className="vrat-sacred-divider">
            <span>ॐ</span>
          </div>

          <div className="vrat-plan-stack">

            <div className="vrat-plan-card">
              <div className="vrat-plan-info">
                <span className="vrat-plan-symbol">🌿</span>
                <div>
                  <h4>Sabudana Khichdi</h4>
                  <p>
                    Non-sticky, peanut-rich, served with fresh Dahi
                  </p>
                </div>
              </div>

              <div className="vrat-plan-price">
                ₹100
              </div>
            </div>

            <div className="vrat-plan-card vrat-featured-plan">

              <div className="vrat-plan-info">
                <span className="vrat-plan-symbol">🪔</span>

                <div>
                  <h4>Premium Vrat Thali</h4>
                  <p>
                    Rajgiri Puri, Aloo Sabzi, Sabudana Khichdi &amp; Aloo Halwa
                  </p>
                </div>
              </div>

              <div className="vrat-plan-price">
                ₹249
              </div>

              <span className="vrat-value-badge">
                Most Ordered
              </span>

            </div>

          </div>

          <div className="vrat-action-area">

            <a
              href="/vrat-specials"
              className="vrat-primary-btn"
            >
              <i className="ph-hands-praying"></i>
              Order Vrat Food
            </a>

            <div className="vrat-trust-labels">

              <span>
                <i className="ph-shield-check-fill"></i>
                Separate Utensils Used
              </span>

              <span>
                <i className="ph-leaf-fill"></i>
                No Onion or Garlic
              </span>

            </div>

          </div>

        </div>


        {/* RIGHT VISUAL */}
        <div className="vrat-visual-column">

          <div className="vrat-image-card">

            <img
              src="/images/vrat-thali.webp"
              alt="Mithora Vrat Thali Jaipur"
              className="vrat-main-img"
              loading="lazy"
            />

            <div className="vrat-image-overlay"></div>

            <div className="vrat-rating-floating">
              <i className="ph-star-fill"></i>

              <span>
                <strong>4.9/5</strong>
                Shuddhata
              </span>
            </div>

            <div className="vrat-special-tag">
              <i className="ph-calendar-check"></i>
              Pre-book for Ekadashi
            </div>

            <div className="vrat-om-mark">
              ॐ
            </div>

          </div>

        </div>

      </div>
    </section>
  );
}