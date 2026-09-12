export default function FAQ() {
  return (
    <section className="faq-wrapper">
      <div className="faq-inner">
        <h2 className="faq-heading">
          Frequently Asked Questions
        </h2>

        <p className="faq-subtext">
          Everything you need to know about our home kitchen services in Jaipur.
        </p>

        <div className="faq-container">

          <details className="faq-item" open>
            <summary>What is Mithora Kitchen?</summary>

            <div className="faq-content">
              <p>
                Mithora is a Jaipur-based home kitchen specializing in freshly
                prepared, authentic homemade food. From daily breakfast and
                lunch to dry snacks and party catering, we bring &quot;Ghar Ka
                Swad&quot; to your doorstep.
              </p>
            </div>
          </details>

          <details className="faq-item">
            <summary>Where do you deliver in Jaipur?</summary>

            <div className="faq-content">
              <p>
                We primarily serve{" "}
                <strong>
                  Murlipura, Vidhyadhar Nagar, and Jhotwara
                </strong>
                . For larger party orders or travel food, we extend delivery to
                nearby areas across Jaipur. You can also order specialized
                travel food for train and bus journeys.
              </p>
            </div>
          </details>

          <details className="faq-item">
            <summary>
              Is the food prepared fresh for every order?
            </summary>

            <div className="faq-content">
              <p>
                Absolutely ❤️. We do not mass-produce or keep food in warmers.
                Every meal is started only after your order is confirmed,
                ensuring it reaches you hot and nutritious.
              </p>
            </div>
          </details>

          <details className="faq-item">
            <summary>
              Do you use any preservatives or artificial colors?
            </summary>

            <div className="faq-content">
              <p>
                No. We follow strict home-cooking standards. We use only clean,
                familiar ingredients and spices—exactly how you would cook in
                your own kitchen.
              </p>
            </div>
          </details>

          <details className="faq-item">
            <summary>
              Can I request food without Onion and Garlic?
            </summary>

            <div className="faq-content">
              <p>
                Yes, we specialize in{" "}
                <strong>Sattvic (Jain)</strong> food. Many of our dishes can be
                prepared without onion and garlic upon request. Please mention
                this while ordering via WhatsApp or our website.
              </p>
            </div>
          </details>

          <details className="faq-item">
            <summary>
              Do you take bulk or party orders?
            </summary>

            <div className="faq-content">
              <p>
                Yes, we cater to small gatherings of 10–50 people. Whether
                it&apos;s a birthday, puja, or a small get-together, we provide
                customized menus including Thalis and homemade snacks.
              </p>
            </div>
          </details>

          <details className="faq-item">
            <summary>
              How long does delivery take?
            </summary>

            <div className="faq-content">
              <p>
                Since we cook fresh, our average delivery time is{" "}
                <strong>45–90 minutes</strong> depending on your location and
                the complexity of the dish. Quality and freshness are our
                priorities over speed.
              </p>
            </div>
          </details>

          <details className="faq-item">
            <summary>
              How can I place an order?
            </summary>

            <div className="faq-content">
              <p>
                You can order directly through our website menu or simply
                message us on <strong>WhatsApp</strong> for a quicker response
                and customized meal planning.
              </p>
            </div>
          </details>

        </div>
      </div>
    </section>
  );
}