export default function Footer() {
  return (
    <footer id="site-footer">

      <div className="footer-container">

        {/* BRAND */}
        <div className="footer-brand">

          <a href="/" className="footer-logo">
            <img
              src="/images/logo/mithora-light.webp"
              alt="Mithora Kitchen"
            />
          </a>

          <h3>Ghar Ka Swad, Delivered ❤️</h3>

          <p>
            Fresh homemade vegetarian food prepared with care
            and delivered across Jaipur.
          </p>

          <a
            href="https://wa.me/918657427432?text=Hello%20Mithora%20Kitchen,%20I%20would%20like%20to%20place%20an%20order."
            target="_blank"
            rel="noopener noreferrer"
            className="footer-order-btn"
          >
            Order on WhatsApp →
          </a>

          <div className="footer-social">

            <a
              href="https://wa.me/918657427432"
              target="_blank"
              rel="noopener noreferrer"
              className="social-btn"
              aria-label="WhatsApp"
            >
              WA
            </a>

            <a
              href="#"
              className="social-btn"
              aria-label="Instagram"
            >
              IG
            </a>

            <a
              href="https://www.youtube.com/@mithorafoods"
              target="_blank"
              rel="noopener noreferrer"
              className="social-btn"
              aria-label="YouTube"
            >
              YT
            </a>

          </div>
        </div>


        {/* QUICK LINKS */}
        <div className="footer-column">
          <h4>Quick Links</h4>

          <ul className="footer-links">
            <li><a href="/menu">Menu</a></li>
            <li><a href="/tiffin">Tiffin Service</a></li>
            <li><a href="/party-orders-jaipur">Party Orders</a></li>
            <li><a href="/offers-and-coupons">Offers &amp; Coupons</a></li>
            <li><a href="/about">About Us</a></li>
            <li><a href="/contact">Contact</a></li>
          </ul>
        </div>


        {/* SPECIALS */}
        <div className="footer-column">
          <h4>Our Specials</h4>

          <ul className="footer-links">
            <li>
              <a href="/vrat-specials">
                Vrat Specials
              </a>
            </li>

            <li>
              <a href="/vrat-udyapan-food-box-jaipur">
                Satvik Food Box
              </a>
            </li>

            <li>
              <a href="/homemade-snacks-namkeen-jaipur">
                Homemade Snacks
              </a>
            </li>

            <li>
              <a href="/fruit-bowl-delivery-jaipur">
                Fruit Bowls
              </a>
            </li>

            <li>
              <a href="/pre-cut-vegetables-jaipur">
                Fresh Cut Vegetables
              </a>
            </li>

            <li>
              <a href="/blog">
                Blog &amp; Recipes
              </a>
            </li>
          </ul>
        </div>


        {/* INFORMATION */}
        <div className="footer-column">
          <h4>Information</h4>

          <ul className="footer-links">
            <li>
              <a href="/privacy-policy">
                Privacy Policy
              </a>
            </li>

            <li>
              <a href="/terms-and-conditions">
                Terms &amp; Conditions
              </a>
            </li>

            <li>
              <a href="/return-policy">
                Return Policy
              </a>
            </li>
          </ul>

          <div className="footer-contact">
            <strong>Need Help?</strong>

            <a href="tel:+918657427432">
              +91 86574 27432
            </a>
          </div>
        </div>


        {/* DELIVERY */}
        <div className="footer-delivery">

          <div className="delivery-area">

            <span className="delivery-label">
              DELIVERY AREAS
            </span>

            <h4>Jaipur • Rajasthan</h4>

            <p>
              <strong>Currently serving</strong>
            </p>

            <p>
              Murlipura • Jhotwara
              <br />
              Vidhyadhar Nagar • Bani Park
              <br />
              Vaishali Nagar • Mansarovar
            </p>

            <p className="delivery-note">
              Delivery availability may vary by location.
            </p>

          </div>

        </div>

      </div>


      {/* BOTTOM */}
      <div className="footer-bottom">

        <p className="copyright">
          © 2026 Mithora Kitchen • Homemade Food Delivery in Jaipur
        </p>

        <p className="privacy-note">
          Homemade vegetarian food prepared fresh in small batches.
          No compromise on taste, hygiene or quality.
        </p>

      </div>

    </footer>
  );
}