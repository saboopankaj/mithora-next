export default function Discovery() {
  return (
    <section className="discovery-section">
      <div className="discovery-container">

        <div className="discovery-header">
          <span className="discovery-eyebrow">
            From Our Kitchen
          </span>

          <h2 className="discovery-heading">
            Explore Blogs &amp; Recipes
          </h2>

          <p className="discovery-subtext">
            Stories, recipes, and simple ideas from our love for homemade food.
          </p>
        </div>

        <div className="discovery-scroll-container">

          <article className="discovery-card discovery-blog-card">
            <span className="discovery-card-tag">
              Blog
            </span>

            <div className="discovery-card-image">
              <img
                src="/assets/images/blog/litti-chokha-jaipur.webp"
                alt="Regional Comfort Foods"
                loading="lazy"
              />
            </div>

            <div className="discovery-card-content">
              <h3>Regional Comfort Foods</h3>

              <p>
                Litti Chokha, Dal Baati &amp; Sattu Paratha — authentic taste.
              </p>

              <a
                href="/blog/regional-indian-comfort-foods"
                className="discovery-card-btn"
              >
                Read Story
                <i className="ph-arrow-right"></i>
              </a>
            </div>
          </article>


          <article className="discovery-card discovery-recipe-card">
            <span className="discovery-card-tag">
              Recipe
            </span>

            <div className="discovery-card-image">
              <img
                src="/recipes/images/baati-onion-garlic-aloo-sabji.webp"
                alt="Dal Baati Recipe"
                loading="lazy"
              />
            </div>

            <div className="discovery-card-content">
              <h3>Dal Baati Churma</h3>

              <p>
                Learn the secrets of making authentic Rajasthani Baatis at home.
              </p>

              <a
                href="/recipes/dal-baati-churma"
                className="discovery-card-btn"
              >
                View Recipe
                <i className="ph-arrow-right"></i>
              </a>
            </div>
          </article>


          <article className="discovery-card discovery-blog-card">
            <span className="discovery-card-tag">
              Blog
            </span>

            <div className="discovery-card-image">
              <img
                src="/assets/images/blog/bajra-roti-lehsun-chutney.webp"
                alt="Winter Foods Jaipur"
                loading="lazy"
              />
            </div>

            <div className="discovery-card-content">
              <h3>Winter Specials</h3>

              <p>
                Bajra, Sarson ka Saag &amp; Makki ki Roti in Jaipur winters.
              </p>

              <a
                href="/blog/blog-winter-foods-in-jaipur"
                className="discovery-card-btn"
              >
                Read Story
                <i className="ph-arrow-right"></i>
              </a>
            </div>
          </article>


          <article className="discovery-card discovery-recipe-card">
            <span className="discovery-card-tag">
              Recipe
            </span>

            <div className="discovery-card-image">
              <img
                src="/recipes/images/indori-poha.jpg"
                alt="Poha Recipe"
                loading="lazy"
              />
            </div>

            <div className="discovery-card-content">
              <h3>Indori Poha</h3>

              <p>
                A quick, light, and healthy breakfast recipe for busy mornings.
              </p>

              <a
                href="/recipes/poha"
                className="discovery-card-btn"
              >
                View Recipe
                <i className="ph-arrow-right"></i>
              </a>
            </div>
          </article>


          <article className="discovery-card discovery-blog-card">
            <span className="discovery-card-tag">
              Blog
            </span>

            <div className="discovery-card-image">
              <img
                src="/assets/images/blog/sattu-paratha-jaipur.webp"
                alt="Fresh Food Benefits"
                loading="lazy"
              />
            </div>

            <div className="discovery-card-content">
              <h3>Easy to Digest</h3>

              <p>
                Why freshly made home food is better for your gut health.
              </p>

              <a
                href="/blog/blog-freshly-made-easier-to-digest"
                className="discovery-card-btn"
              >
                Read Story
                <i className="ph-arrow-right"></i>
              </a>
            </div>
          </article>


          <article className="discovery-card discovery-recipe-card">
            <span className="discovery-card-tag">
              Recipe
            </span>

            <div className="discovery-card-image">
              <img
                src="/recipes/images/upma.webp"
                alt="Upma Recipe"
                loading="lazy"
              />
            </div>

            <div className="discovery-card-content">
              <h3>Vegetable Upma</h3>

              <p>
                Simple rava upma tempered with curry leaves and mustard.
              </p>

              <a
                href="/recipes/upma"
                className="discovery-card-btn"
              >
                View Recipe
                <i className="ph-arrow-right"></i>
              </a>
            </div>
          </article>

        </div>

      </div>
    </section>
  );
}