export default function MenuLoader() {
  const kitchenItems = [
    {
      img: "/images/kitchen/fresh-vegitable.webp",
      text: "Fresh Vegetables",
    },
    {
      img: "/images/kitchen/desi-spices.webp",
      text: "Desi Spices",
    },
    {
      img: "/images/kitchen/pulses-and-grains.webp",
      text: "Handpicked Pulses",
    },
    {
      img: "/images/kitchen/veg-burger.webp",
      text: "Mithora Foods & Snacks",
    },
    {
      img: "/images/kitchen/desi-cow-ghee.webp",
      text: "Desi Ghee",
    },
    {
      img: "/images/kitchen/homemade-tiffin.webp",
      text: "Homemade Tiffin",
    },
  ];

  return (
    <div className="menu-loader-area">
      <div className="menu-loader-card">

        <div className="menu-loader-offer">
          <span>OFFER</span>

          <strong>
            ₹100 OFF
          </strong>

          <b>
            ON YOUR FIRST ORDER
          </b>

          <small>
            Valid on orders above ₹400
          </small>
        </div>

        <div className="menu-loader-heading">

          <div className="menu-loader-icon">
            🍳
          </div>

          <div>
            <h3>
              Preparing the Mithora menu...
            </h3>

            <p>
              Fresh from our kitchen • Jaipur
            </p>
          </div>

        </div>

        <div className="menu-loader-grid">

          {kitchenItems.map(
            (item, index) => (
              <div
                className="menu-loader-item"
                key={item.text}
                style={{
                  animationDelay:
                    `${index * 100}ms`,
                }}
              >
                <div className="menu-loader-image">
                  <img
                    src={item.img}
                    alt={item.text}
                  />
                </div>

                <span>
                  {item.text}
                </span>
              </div>
            )
          )}

        </div>

        <div className="menu-loader-progress">
          <span />
        </div>

      </div>
    </div>
  );
}

/* =====================================================
   CART HELPERS
===================================================== */
