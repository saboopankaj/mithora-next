export default function TasteBox() {
  return (
    <section className="tastebox-exact">

      <div className="tb-inner">

        {/* LEFT — FOOD */}
        <div className="tb-left">

          <div className="tb-heading">

            <span className="tb-eyebrow">
              Freshly Cooked • Homemade • Pure Veg
            </span>

            <h2>
              Fresh Homemade Lunch in Jaipur
            </h2>

            <p className="sub">
              Authentic Dal, Rice &amp; Seasonal Sabzi — Just Like Home
            </p>

          </div>


          {/* FOOD IMAGES */}
          <div className="tb-images">

            <div className="tb-img tb-img-main">
              <img
                src="/images/dal-homemade.webp"
                alt="Homemade Dal in Jaipur"
              />
            </div>

            <div className="tb-img">
              <img
                src="/images/plain-rice-homemade.webp"
                alt="Homemade Plain Rice in Jaipur"
              />
            </div>

            <div className="tb-img">
              <img
                src="/images/aloo-methi-sabzi-homemade.webp"
                alt="Homemade Aloo Methi Sabzi in Jaipur"
              />
            </div>

          </div>

        </div>


        {/* OFFER */}
        <div className="tb-offer">

          <div className="offer-circle">

            <span className="off">
              ₹100 OFF
            </span>

            <span className="min">
              Above ₹500
            </span>

          </div>

        </div>


        {/* RIGHT CONTENT */}
        <div className="tb-right">

          <span className="tb-right-tag">
            TODAY'S HOMEMADE SPECIAL
          </span>

          <h3>
            Nutritious &amp;
            <br />
            Fresh Daily
          </h3>

          <p>
            Enjoy simple, healthy and freshly prepared homemade
            meals made with quality ingredients and traditional
            recipes.
          </p>


          <div className="tb-points">

            <span>
              ✓ Freshly Prepared
            </span>

            <span>
              ✓ 100% Vegetarian
            </span>

            <span>
              ✓ Home Style Cooking
            </span>

          </div>


          <a
            href="/menu"
            className="tb-btn"
          >
            View Today's Menu
            <i className="ph-arrow-right"></i>
          </a>

        </div>

      </div>

    </section>
  );
}