export default function TiffinSection() {
  return (
    <section className="tiffin-section">
      <div className="container">
        <div className="tiffin-content">

          <div className="tiffin-image">
            <img
              src="https://assets.mithora.in/images/tiffin-service-jaipur.webp"
              alt="Mithora Kitchen Tiffin Service Jaipur"
            />

            <div className="tiffin-rating">
              4.9/5 <span>Home Taste</span>
            </div>

            <div className="tiffin-delivery">
              Free Delivery <span>(7km)</span>
            </div>
          </div>

          <div className="tiffin-info">

            <div className="tiffin-tag">
              LUNCH &amp; DINNER
            </div>

            <h2>Daily Tiffin Service</h2>

            <p className="tiffin-description">
              Fresh, healthy, and 100% Pure Veg. Delivered to your home or
              office in Murlipura, Jhotwara &amp; Vidhyadhar Nagar.
            </p>

            <div className="tiffin-plans">

              <div className="tiffin-plan">
                <div>
                  <strong>Single Meal</strong>
                  <span>4 Roti, 2 Sabji, Dal, Rice, Salad &amp; Pickle</span>
                </div>
                <b>₹150</b>
              </div>

              <div className="tiffin-plan featured">
                <div>
                  <strong>Weekly Pack (7 Days)</strong>
                  <span>Special Sunday Menu + Priority Delivery</span>
                </div>
                <b>₹900</b>

                <label>Best Value</label>
              </div>

              <div className="tiffin-plan">
                <div>
                  <strong>Monthly (30 Days)</strong>
                  <span>The most convenient choice for daily needs.</span>
                </div>
                <b>₹3500</b>
              </div>

            </div>

            <div className="tiffin-bottom">
              <a href="/tiffin" className="tiffin-btn">
                View Tiffin Plans →
              </a>

              <div className="tiffin-trust">
                <span>✓ Freshly Cooked</span>
                <span>✓ Pure Veg</span>
                <span>✓ Home Style</span>
              </div>
            </div>

          </div>
        </div>
      </div>
    </section>
  );
}