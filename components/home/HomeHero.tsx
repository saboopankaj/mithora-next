export default function HomeHero() {
  return (
    <section className="video-hero">
      {/* Background Video */}
      <video
        className="hero-video"
        autoPlay
        muted
        loop
        playsInline
        preload="auto"
      >
        <source
          src="https://assets.mithora.in/videos/mithora-kitchen-ghar-ka-swad-cooking.webm"
          type="video/webm"
        />
        <source
          src="https://assets.mithora.in/videos/mithora-kitchen-ghar-ka-swad-cooking.mp4"
          type="video/mp4"
        />
      </video>

      {/* Dark overlay */}
      <div className="hero-overlay" />

      {/* Hero Content */}
      <div className="hero-content">
        {/* Badges */}
        <div className="hero-badge-container">
          <div className="hero-badge">
            <i className="ph-heart-fill" />
            Homemade
          </div>

          <div className="hero-badge">
            <i className="ph-map-pin-fill" />
            Murlipura, Jaipur
          </div>
        </div>

        {/* Main Heading */}
        <h1 className="hero-title">
          Homemade Food in Jaipur
          <br />

          <span className="highlight-text">
            Party Catering, Bulk Food Orders &amp; Tiffin
          </span>
        </h1>

        {/* Description */}
        <p className="hero-subtitle">
          Homemade party catering, bulk food orders, daily tiffin, vrat meals
          and snacks delivered across Jaipur. Hygienic and 100% natural.
        </p>

        {/* SEO Text */}
        <div className="hero-seo-glass">
          <p>
            <strong>
              Pure Veg Catering &amp; Tiffin Service in Jaipur
            </strong>{" "}
            • Serving Murlipura, Vidhyadhar Nagar &amp; Vaishali Nagar.
            <br className="mobile-hide" /> High-quality Tiffin service &amp;
            Party snacks.
          </p>
        </div>

        {/* Buttons */}
        <div className="hero-buttons">
          <a
            href="/party-orders-jaipur#party-packages"
            className="btn btn-primary"
          >
            View Party Menu
          </a>

          <a
            href="https://api.whatsapp.com/send?phone=918657427432&text=Hi%20Mithora%20Kitchen%2C%20muje%20homemade%20food%20ke%20liye%20enquire%20karna%20tha.%20Can%20you%20share%20the%20menu%20and%20details%3F"
            className="btn btn-wa-green"
            target="_blank"
            rel="noopener noreferrer"
          >
            <i className="ph-whatsapp-logo-fill" />
            <span>Enquire on WhatsApp</span>
          </a>
        </div>
      </div>

      {/* Scroll indicator */}
      <div className="scroll-indicator">
        <div className="mouse" />
      </div>
    </section>
  );
}