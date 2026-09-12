"use client";

import { useState } from "react";

type CategoryKey = "breakfast" | "lunch" | "snacks" | "vrat";

const foodCategories: Record<
  CategoryKey,
  {
    title: string;
    desc: string;
    img: string;
    label: string;
  }
> = {
  breakfast: {
    title: "Light Indori Poha",
    desc: "Start your morning with light, fresh, and healthy options. Our Poha is steamed fresh with Indori Jeeravan and crunchy sev.",
    img: "/images/menu/breakfast/poha.webp",
    label: "Breakfast",
  },

  lunch: {
    title: "Daily Veg Thali",
    desc: "Wholesome homemade Thalis delivered fresh. Includes 4 Ghee Rotis, Seasonal Sabji, Dal, and Rice. Pure ghar ka khana.",
    img: "/images/menu/all-day-meal/sattu-paratha.webp",
    label: "Lunch",
  },

  snacks: {
    title: "Homemade Mathri",
    desc: "Traditional tea-time namkeens made in small batches. Perfect crispiness using pure groundnut oil and spices.",
    img: "/images/menu/snacks/mathari.webp",
    label: "Snacks",
  },

  vrat: {
    title: "Satvik Vrat Thali",
    desc: "Hygienic and pure food for fasts. Prepared with Sendha Namak and special ingredients for your religious needs.",
    img: "/images/vrat-thali.webp",
    label: "Vrat Special",
  },
};

export default function FoodCategories() {
  const [activeTab, setActiveTab] =
    useState<CategoryKey>("breakfast");

  const data = foodCategories[activeTab];

  return (
    <section className="categories-section">

      <div className="container">

        {/* HEADER */}
        <div className="cat-heading">

          <span className="cat-eyebrow">
            Explore Our Menu
          </span>

          <h2>
            Homemade Food Categories
          </h2>

          <p>
            Something fresh and homemade for every craving.
          </p>

        </div>


        {/* CATEGORY TABS */}
        <div className="cat-tabs-wrapper">

          <div
            className="cat-tabs"
            role="tablist"
            aria-label="Food categories"
          >

            {(Object.keys(foodCategories) as CategoryKey[]).map(
              (category) => (
                <button
                  key={category}
                  type="button"
                  role="tab"
                  aria-selected={activeTab === category}
                  className={`cat-tab ${
                    activeTab === category ? "active" : ""
                  }`}
                  onClick={() => setActiveTab(category)}
                >
                  {foodCategories[category].label}
                </button>
              )
            )}

          </div>

        </div>


        {/* FEATURED FOOD */}
        <div className="cat-display-box">

          <div
            className="cat-card"
            key={activeTab}
          >

            {/* IMAGE */}
            <div className="cat-card-img-wrapper">

              <img
                src={data.img}
                alt={`${data.title} - ${data.label}`}
              />

              <div className="cat-label">
                {data.label}
              </div>

            </div>


            {/* CONTENT */}
            <div className="cat-card-content">

              <span className="cat-content-eyebrow">
                Freshly Prepared
              </span>

              <h3>
                {data.title}
              </h3>

              <p>
                {data.desc}
              </p>

              <a
                href="/menu"
                className="cat-link"
              >
                Explore Full Menu
                <i className="ph-arrow-right"></i>
              </a>

            </div>

          </div>

        </div>

      </div>

    </section>
  );
}