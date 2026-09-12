export default function SignatureDishes() {
  return (
    <section className="signature-dishes-section">
      <div className="container">

        <div className="signature-header">
          <span className="signature-tag">
            Regional Comfort Foods
          </span>

          <h2 className="signature-heading">
            Regional &amp; Signature Dishes
          </h2>

          <p className="signature-subtext">
            Authentic Indian comfort food prepared fresh in our Murlipura
            home kitchen.
          </p>
        </div>

        <div className="signature-grid">

          <a
            href="/menu"
            className="signature-dish-card"
          >
            <div className="signature-dish-image">
              <img
                src="/images/menu/all-day-meal/litti-chokha.webp"
                alt="Litti Chokha Jaipur"
                loading="lazy"
              />
            </div>

            <div className="signature-dish-content">
              <h3>Litti Chokha</h3>
              <p>
                Authentic Bihar-style litti served with smoky chokha.
              </p>
              <span>
                Explore Menu <i className="ph-arrow-right"></i>
              </span>
            </div>
          </a>

          <a
            href="/menu"
            className="signature-dish-card"
          >
            <div className="signature-dish-image">
              <img
                src="/images/menu/all-day-meal/dal-bati-churma-jaipur.webp"
                alt="Dal Baati Churma Jaipur"
                loading="lazy"
              />
            </div>

            <div className="signature-dish-content">
              <h3>Dal Baati Churma</h3>
              <p>
                Traditional Rajasthani baati served with dal and sweet churma.
              </p>
              <span>
                Explore Menu <i className="ph-arrow-right"></i>
              </span>
            </div>
          </a>

          <a
            href="/menu"
            className="signature-dish-card"
          >
            <div className="signature-dish-image">
              <img
                src="/images/menu/all-day-meal/sattu-paratha.webp"
                alt="Sattu Paratha Jaipur"
                loading="lazy"
              />
            </div>

            <div className="signature-dish-content">
              <h3>Sattu Paratha</h3>
              <p>
                Homestyle stuffed paratha prepared with traditional sattu
                filling.
              </p>
              <span>
                Explore Menu <i className="ph-arrow-right"></i>
              </span>
            </div>
          </a>

        </div>

      </div>
    </section>
  );
}