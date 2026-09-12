export default function PartyHighlight() {
  return (
    <section className="party-highlight">
      <div className="container">

        {/* INTRO */}
        <div className="party-intro">

          <div className="party-badge">
            🎉 Jaipur Party Catering Specialists
          </div>

          <h2>
            Party Catering &amp; Bulk Food Orders in Jaipur
          </h2>

          <p>
            Planning a birthday party, anniversary celebration, kitty party,
            family gathering, office lunch, corporate meeting or house party?
            Mithora Kitchen prepares fresh homemade pure vegetarian food for
            small and bulk orders across Jaipur.
          </p>

        </div>


        {/* PARTY TYPES */}
        <div className="party-grid">

          <div className="party-item">
            <h3>🎂 Birthday Parties</h3>
          </div>

          <div className="party-item">
            <h3>💕 Anniversary Celebrations</h3>
          </div>

          <div className="party-item">
            <h3>👨‍👩‍👧 Family Gatherings</h3>
          </div>

          <div className="party-item">
            <h3>🏠 House Parties</h3>
          </div>

          <div className="party-item">
            <h3>🫖 Kitty Parties</h3>
          </div>

          <div className="party-item">
            <h3>🏢 Corporate Lunches</h3>
          </div>

        </div>


        {/* GUEST RANGE */}
        <div className="guest-range">
          Orders Available For 5, 10, 15, 25, 50+ Guests
        </div>


        {/* BENEFITS */}
        <div className="party-features">

          <span>✅ Homemade Taste</span>
          <span>✅ Pure Veg Food</span>
          <span>✅ Jain Options</span>
          <span>✅ Vrat &amp; Satvik Meals</span>
          <span>✅ Fresh Daily Preparation</span>

        </div>


        {/* BUTTONS */}
        <div className="party-buttons">

          <a
            href="/party-orders-jaipur#party-packages"
            className="party-btn-primary"
          >
            View Party Packages
          </a>

          <a
            href="https://api.whatsapp.com/send?phone=918657427432&text=Hi%20Mithora%20Kitchen%2C%20I%20want%20a%20party%20food%20quote."
            className="party-btn-secondary"
            target="_blank"
            rel="noopener noreferrer"
          >
            Get Instant Quote
          </a>

        </div>

      </div>
    </section>
  );
}