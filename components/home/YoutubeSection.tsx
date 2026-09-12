export default function YoutubeSection() {
  return (
    <section className="yt-section">
      <div className="yt-container">
        <p className="yt-handwritten">
          People love how we cook ❤️
        </p>

        <div className="yt-glass-card">
          <h2 className="yt-title">
            Watch Us Cook — From Start to Serve
          </h2>

          <p className="yt-subtext">
            See how we prepare food just like at home — with time, care, and
            real ingredients.
          </p>

          <div className="yt-video-wrapper">
            <iframe
              className="yt-video"
              src="https://www.youtube.com/embed/8-JfAr-mu5Q"
              title="Murmura Namkeen Recipe"
              frameBorder="0"
              loading="lazy"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            />
          </div>

          <div className="yt-footer">
            <div className="yt-info">
              <h3 className="yt-small-title">
                Quick Recipes &amp; Kitchen Moments ✨
              </h3>

              <p className="yt-small-desc">
                Small glimpses from our home kitchen — real flavors, real love.
              </p>
            </div>

            <a
              href="https://www.youtube.com/@mithorafoods"
              target="_blank"
              rel="noopener noreferrer"
              className="yt-cta-btn"
            >
              <i className="ph-youtube-logo-fill"></i>
              Subscribe on YouTube
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}