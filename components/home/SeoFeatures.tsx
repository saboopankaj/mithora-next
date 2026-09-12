export default function SeoFeatures() {
  return (
    <section className="seo-features">
      <div className="container">

        {/* SECTION INTRO */}
        <div className="seo-header">
          <span className="seo-tagline">
            Authentic • Hygienic • Local
          </span>

          <h2 className="seo-main-title">
            Pure Homemade Taste in{" "}
            <span className="text-gold">
              Murlipura, Jaipur
            </span>
          </h2>
        </div>


        {/* FEATURE CARDS */}
        <div className="seo-bento-grid">

          {/* MAIN TIFFIN CARD */}
          <article className="seo-card bento-main">

            <div className="card-image-wrapper">
              <img
                src="/images/mithora-tiffin-services.jpeg"
                alt="Homemade Tiffin Service in Jaipur"
              />

              <div className="status-badge">
                <span className="dot"></span>
                Accepting Orders
              </div>
            </div>

            <div className="card-content">

              <div className="card-label">
                Daily Essentials
              </div>

              <h3>
                Premium Tiffin Service
              </h3>

              <p>
                Relish 100%{" "}
                <strong>Pure Vegetarian</strong> Satvik meals
                delivered to{" "}
                <strong>
                  Vidyadhar Nagar, Jhotwara, &amp; Murlipura
                </strong>
                . Prepared with zero preservatives.
              </p>

              <a
                href="/menu"
                className="card-cta"
              >
                Check Today's Menu
                <i className="ph-arrow-right"></i>
              </a>

            </div>
          </article>


          {/* PARTY CARD */}
          <article className="seo-card">

            <div className="card-image-wrapper compact">
              <img
                src="/images/reviews/birthday-office-party-thali-10-15-person.webp"
                alt="Party Catering and Thali Orders in Jaipur"
              />

              <div className="seo-icon-overlay">
                <i className="ph-cooking-pot"></i>
              </div>
            </div>

            <div className="card-content">

              <div className="card-label">
                Celebrations
              </div>

              <h3>
                Party &amp; Events
              </h3>

              <p>
                Customized{" "}
                <strong>Rajasthani Thalis</strong> and snacks
                for birthdays, kitty parties &amp; office meetings.
              </p>

            </div>
          </article>


          {/* DELIVERY CARD */}
          <article className="seo-card">

            <div className="card-image-wrapper compact">
              <img
                src="https://assets.mithora.in/images/party-order/mix-veg.webp"
                alt="Homemade Food Delivery Areas in Jaipur"
              />

              <div className="seo-icon-overlay">
                <i className="ph-map-pin-line"></i>
              </div>
            </div>

            <div className="card-content">

              <div className="card-label">
                Jaipur Delivery
              </div>

              <h3>
                Express Delivery
              </h3>

              <p>
                Hot homemade food delivered across{" "}
                <strong>
                  Murlipura, Vidyadhar Nagar, Vaishali Nagar,
                  C-Scheme, Tonk Road
                </strong>{" "}
                and nearby areas.
              </p>

            </div>
          </article>

        </div>


        {/* SEO FOOTER */}
        <div className="seo-footer-text">
          <p>
            Experience the true <em>"Ghar ka Swad"</em> with
            Mithora Kitchen — your reliable{" "}
            <strong>tiffin service near me</strong> for quality
            homemade food.
          </p>
        </div>

      </div>
    </section>
  );
}