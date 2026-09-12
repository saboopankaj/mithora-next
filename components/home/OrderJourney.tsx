export default function OrderJourney() {
  return (
    <section className="oj-wrapper">
      <div className="oj-container">

        <div className="oj-sub">
          Made With Patience
        </div>

        <h2 className="oj-title">
          Freshly Cooked, Not Pre-Packed
        </h2>

        <p className="oj-desc">
          We don&apos;t keep food ready in warmers. Every meal is started only
          after you place your order to ensure true{" "}
          <strong>Ghar Jaisa Swad</strong>.
        </p>

        <div className="oj-flow">

          <div className="oj-step">
            <div className="oj-icon">1</div>
            <h4>Place Order</h4>
            <p>Website or WhatsApp</p>
            <div className="oj-time">2 Mins</div>
          </div>

          <div className="oj-step">
            <div className="oj-icon">2</div>
            <h4>Kitchen Prep</h4>
            <p>Fresh Ingredients</p>
            <div className="oj-time">5 Mins</div>
          </div>

          <div className="oj-step active-step">
            <div className="oj-icon">3</div>
            <h4>Slow Cooking</h4>
            <p>Authentic Home Style</p>
            <div className="oj-time">30–40 Mins</div>
          </div>

          <div className="oj-step">
            <div className="oj-icon">4</div>
            <h4>Safe Packing</h4>
            <p>Eco-friendly &amp; Sealed</p>
            <div className="oj-time">10 Mins</div>
          </div>

          <div className="oj-step">
            <div className="oj-icon">5</div>
            <h4>Doorstep Delivery</h4>
            <p>Served Fresh &amp; Hot</p>
            <div className="oj-time">20 Mins</div>
          </div>

        </div>

        <div className="oj-delivery-box">

          <div className="oj-row">
            <span className="oj-label">
              Estimated Delivery Time
            </span>

            <span className="oj-time-large">
              45–90 Mins
            </span>
          </div>

          <div className="oj-small">
            <i className="ph-info-fill"></i>{" "}
            Quality takes time. We prioritize freshness over fast-food speed.
          </div>

        </div>

      </div>
    </section>
  );
}