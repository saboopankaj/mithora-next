export default function SnacksSection() {
  return (
    <section className="snacks-section">
      <h2 className="snacks-heading">
        Homemade Snacks &amp; Namkeen
      </h2>

      <p className="snacks-subtext">
        Freshly prepared dry snacks from our Murlipura home kitchen. Made in{" "}
        <strong>small batches</strong> using pure ingredients—no preservatives,
        no artificial colors, just authentic <strong>Ghar Ka Swad</strong>.
      </p>

      <div className="snacks-grid">

        <div className="snacks-card">
          <div className="snacks-img-wrapper">
            <img
              src="/images/home-made-snacks/aata-mathri.webp"
              alt="Homemade mathri namkeen Jaipur"
              loading="lazy"
            />
            <span className="snacks-tag">
              Tea-time Classic
            </span>
          </div>

          <div className="snacks-card-body">
            <h3>Crispy Mathri</h3>

            <p>
              Flaky, handmade mathri prepared with ajwain and pure oil. The
              perfect companion for your evening chai.
            </p>

            <a
              href="/homemade-snacks-namkeen-jaipur"
              className="snacks-link"
            >
              View Menu <i className="ph-arrow-right"></i>
            </a>
          </div>
        </div>

        <div className="snacks-card">
          <div className="snacks-img-wrapper">
            <img
              src="/images/home-made-snacks/chana-dal.webp"
              alt="Chana dal namkeen Jaipur"
              loading="lazy"
            />
            <span className="snacks-tag">
              Protein Rich
            </span>
          </div>

          <div className="snacks-card-body">
            <h3>Chana Dal Namkeen</h3>

            <p>
              Crunchy, roasted chana dal tossed in a balanced blend of homemade
              masalas. Light and healthy.
            </p>

            <a
              href="/homemade-snacks-namkeen-jaipur"
              className="snacks-link"
            >
              View Menu <i className="ph-arrow-right"></i>
            </a>
          </div>
        </div>

        <div className="snacks-card">
          <div className="snacks-img-wrapper">
            <img
              src="/images/home-made-snacks/chini-petha.jpg"
              alt="Homemade chini petha Jaipur"
              loading="lazy"
            />
            <span className="snacks-tag">
              Traditional Sweet
            </span>
          </div>

          <div className="snacks-card-body">
            <h3>Chini Petha</h3>

            <p>
              Soft and mildly sweet chini petha. A traditional delight made
              with high-quality ingredients.
            </p>

            <a
              href="/homemade-snacks-namkeen-jaipur"
              className="snacks-link"
            >
              View Menu <i className="ph-arrow-right"></i>
            </a>
          </div>
        </div>

      </div>

      <div className="snacks-delivery-note">
        <i className="ph-house-line-fill"></i>{" "}
        Freshly delivered across Murlipura, Vidyadhar Nagar, and nearby Jaipur
        areas.
      </div>
    </section>
  );
}