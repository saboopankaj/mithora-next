export default function Services() {
  return (
    <section className="mithora-services">
      <div className="container">

        {/* SECTION HEADER */}
        <div className="service-header">
          <span className="gold-tag">
            What are you looking for today?
          </span>

          <h2 className="main-title">
            Fresh Homemade{" "}
            <span className="text-gold">
              Goodness
            </span>
          </h2>
        </div>


        {/* SERVICES */}
        <div className="services-grid">

          {/* DAILY TIFFIN */}
          <a
            href="/tiffin"
            className="service-card"
          >
            <img
              src="https://assets.mithora.in/images/party-order/dal-makhani.webp"
              alt="Tiffin Service"
            />

            <div className="card-overlay">
              <div className="card-info">

                <h3>
                  Daily Tiffin
                </h3>

                <p>
                  Ghar ka Swad, Daily
                </p>

                <span className="order-link">
                  View Menu
                  <i className="ph-arrow-right"></i>
                </span>

              </div>
            </div>
          </a>


          {/* PARTY ORDERS — FEATURED */}
          <a
            href="/party-orders-jaipur"
            className="service-card tall"
          >
            <img
              src="https://assets.mithora.in/images/party-order/starter-plate.webp"
              alt="Party Orders"
            />

            <div className="card-overlay">
              <div className="card-info">

                <h3>
                  Party Orders
                </h3>

                <p>
                  Birthday &amp; Events
                </p>

                <span className="order-link">
                  Plan Party
                  <i className="ph-arrow-right"></i>
                </span>

              </div>
            </div>
          </a>


          {/* VRAT */}
          <a
            href="/vrat-specials"
            className="service-card"
          >
            <img
              src="/images/vrat-thali.webp"
              alt="Vrat Food"
            />

            <div className="card-overlay">
              <div className="card-info">

                <h3>
                  Vrat &amp; Tyohar
                </h3>

                <p>
                  Satvik &amp; Pure Veg
                </p>

                <span className="order-link">
                  Order Now
                  <i className="ph-arrow-right"></i>
                </span>

              </div>
            </div>
          </a>


          {/* SNACKS */}
          <a
            href="/homemade-snacks-namkeen-jaipur"
            className="service-card"
          >
            <img
              src="/images/home-made-snacks/namak-pare.webp"
              alt="Homemade Snacks"
            />

            <div className="card-overlay">
              <div className="card-info">

                <h3>
                  Ghar ke Snacks
                </h3>

                <p>
                  Fresh &amp; Crispy
                </p>

                <span className="order-link">
                  Browse
                  <i className="ph-arrow-right"></i>
                </span>

              </div>
            </div>
          </a>


          {/* FRUIT BOWLS */}
          <a
            href="/fruit-bowl-delivery-jaipur"
            className="service-card"
          >
            <img
              src="/images/fruit-bowl-jaipur.webp"
              alt="Desserts and Fruits"
            />

            <div className="card-overlay">
              <div className="card-info">

                <h3>
                  Fruit Bowls
                </h3>

                <p>
                  Healthy &amp; Fresh
                </p>

                <span className="order-link">
                  Order
                  <i className="ph-arrow-right"></i>
                </span>

              </div>
            </div>
          </a>

        </div>

      </div>
    </section>
  );
}