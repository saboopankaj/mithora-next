/* =========================================================
   MITHORA MENU
   Premium food ordering interface
========================================================= */

:root {
  --menu-orange: #ff642f;
  --menu-orange-dark: #e95120;
  --menu-orange-soft: #fff0e9;

  --menu-brown: #2d1b14;
  --menu-brown-soft: #604b42;

  --menu-cream: #fffaf5;
  --menu-white: #ffffff;
  --menu-border: #eaded5;

  --menu-green: #1f7a3b;
  --menu-green-soft: #eaf6ed;

  --menu-shadow: 0 16px 45px rgba(45, 27, 20, 0.08);
}
"use client";

import { useEffect, useMemo, useState } from "react";
/* =========================================================
   PAGE
========================================================= */

.menu-page-shell {
  min-height: 100vh;
  background:
    radial-gradient(
      circle at 10% 15%,
      rgba(255, 213, 179, 0.18),
      transparent 28%
    ),
    radial-gradient(
      circle at 90% 35%,
      rgba(255, 190, 150, 0.12),
      transparent 28%
    ),
    var(--menu-cream);

  color: var(--menu-brown);
}

.menu-shell-container {
  width: min(1380px, calc(100% - 48px));
  margin: 0 auto;
}

/* =========================================================
   SHORT HERO
========================================================= */

.menu-hero {
  padding: 48px 0 38px;
  background:
    linear-gradient(
      180deg,
      #fff9f0 0%,
      #fffaf5 100%
    );

  border-bottom: 1px solid
    rgba(234, 222, 213, 0.8);
}

.menu-hero h1 {
  max-width: 780px;
  margin: 0;

  font-size: clamp(42px, 5vw, 72px);
  line-height: 0.98;
  letter-spacing: -0.045em;
  font-weight: 900;

  color: var(--menu-brown);
}

.menu-hero p {
  max-width: 700px;

  margin: 16px 0 0;

  font-size: 18px;
  line-height: 1.55;

  color: #8b7165;
}

/* =========================================================
   SEARCH + CATEGORY BAR
========================================================= */

.menu-sticky-controls {
  position: sticky;
  top: 0;

  z-index: 90;

  padding: 18px 0 15px;

  background:
    rgba(255, 250, 245, 0.96);

  border-bottom: 1px solid
    rgba(226, 211, 201, 0.9);

  backdrop-filter: blur(18px);
  -webkit-backdrop-filter: blur(18px);

  transition:
    padding 0.25s ease,
    box-shadow 0.25s ease;
}

.menu-sticky-controls-scrolled {
  padding-top: 12px;
  padding-bottom: 12px;

  box-shadow:
    0 10px 35px rgba(45, 27, 20, 0.09);
}

.menu-search-box {
  height: 60px;

  display: flex;
  align-items: center;

  padding: 0 10px 0 20px;

  background: #ffffff;

  border: 1px solid
    var(--menu-border);

  border-radius: 18px;

  box-shadow:
    0 5px 20px rgba(45, 27, 20, 0.04);

  transition:
    border-color 0.2s ease,
    box-shadow 0.2s ease;
}

.menu-search-box-focused {
  border-color: var(--menu-orange);

  box-shadow:
    0 0 0 4px
      rgba(255, 100, 47, 0.09),
    0 8px 24px rgba(45, 27, 20, 0.06);
}

.menu-search-icon {
  width: 25px;
  height: 25px;

  display: flex;
  align-items: center;
  justify-content: center;

  flex: 0 0 auto;

  color: var(--menu-orange);
}

.menu-search-icon svg {
  width: 22px;
  height: 22px;

  fill: none;

  stroke: currentColor;
  stroke-width: 2;
  stroke-linecap: round;
}

.menu-search-box input {
  min-width: 0;
  flex: 1;

  height: 100%;

  border: 0;
  outline: 0;

  background: transparent;

  padding: 0 15px;

  font: inherit;
  font-size: 16px;

  color: var(--menu-brown);
}

.menu-search-box input::placeholder {
  color: #a28f86;
}

.menu-search-clear {
  width: 40px;
  height: 40px;

  border: 0;

  border-radius: 50%;

  background: var(--menu-orange-soft);

  color: var(--menu-orange);

  font-size: 25px;
  line-height: 1;

  cursor: pointer;

  display: flex;
  align-items: center;
  justify-content: center;

  transition:
    background 0.2s ease,
    transform 0.2s ease;
}

.menu-search-clear:hover {
  background: #ffe2d6;
  transform: scale(1.05);
}

/* =========================================================
   CATEGORY PILLS
========================================================= */

.menu-category-scroll {
  display: flex;

  gap: 10px;

  margin-top: 12px;

  overflow-x: auto;

  scrollbar-width: none;

  padding: 1px 1px 3px;
}

.menu-category-scroll::-webkit-scrollbar {
  display: none;
}

.menu-category-pill {
  flex: 0 0 auto;

  min-height: 42px;

  padding: 0 19px;

  border-radius: 999px;

  border: 1px solid
    var(--menu-border);

  background: #ffffff;

  color: #75635b;

  font-size: 13px;
  font-weight: 800;

  cursor: pointer;

  white-space: nowrap;

  transition:
    background 0.2s ease,
    color 0.2s ease,
    border-color 0.2s ease,
    transform 0.2s ease;
}

.menu-category-pill:hover {
  border-color: var(--menu-orange);
  color: var(--menu-orange);

  transform: translateY(-1px);
}

.menu-category-pill.active {
  background: var(--menu-orange);

  border-color: var(--menu-orange);

  color: white;

  box-shadow:
    0 7px 18px
      rgba(255, 100, 47, 0.22);
}

/* =========================================================
   SEARCH SUMMARY
========================================================= */

.menu-search-result-summary {
  margin-top: 30px;

  padding: 20px 24px;

  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 20px;

  border-radius: 18px;

  border: 1px solid
    #f0dcd0;

  background:
    linear-gradient(
      135deg,
      #fff6ef,
      #fffaf7
    );
}

.menu-search-result-summary div {
  display: flex;
  align-items: baseline;
  gap: 15px;
}

.menu-search-result-summary span {
  font-size: 11px;
  font-weight: 900;

  letter-spacing: 0.12em;

  color: var(--menu-orange);
}

.menu-search-result-summary strong {
  font-size: 17px;
}

.menu-search-result-summary button {
  border: 0;
  background: transparent;

  color: var(--menu-orange);

  font-size: 12px;
  font-weight: 900;

  cursor: pointer;
}

/* =========================================================
   FEATURED CAROUSEL
========================================================= */

.menu-featured-wrap {
  padding: 42px 0 15px;
}

.menu-featured-card {
  position: relative;

  overflow: hidden;

  border-radius: 30px;

  padding: 28px;

  background:
    linear-gradient(
      135deg,
      #261811 0%,
      #432719 45%,
      #71331f 100%
    );

  box-shadow:
    0 25px 65px
      rgba(45, 27, 20, 0.18);

  color: white;
}

.menu-featured-card::before {
  content: "";

  position: absolute;

  width: 380px;
  height: 380px;

  right: -160px;
  bottom: -220px;

  border-radius: 50%;

  background:
    rgba(255, 150, 77, 0.18);
}

.menu-featured-top {
  position: relative;
  z-index: 2;

  display: flex;
  align-items: center;
  justify-content: space-between;

  margin-bottom: 20px;
}

.menu-featured-top span {
  display: inline-flex;

  padding: 10px 15px;

  border-radius: 999px;

  background:
    rgba(255, 100, 47, 0.96);

  font-size: 11px;
  font-weight: 900;

  letter-spacing: 0.04em;
}

.menu-featured-top small {
  font-size: 12px;

  color: rgba(255, 255, 255, 0.65);
}

.menu-featured-content {
  position: relative;
  z-index: 2;

  display: grid;

  grid-template-columns:
    minmax(0, 1.05fr)
    minmax(0, 0.95fr);

  min-height: 410px;

  gap: 35px;

  align-items: center;
}

.menu-featured-image {
  display: block;

  width: 100%;
  height: 410px;

  padding: 0;

  border: 0;

  border-radius: 24px;

  overflow: hidden;

  background: #5b3b2c;

  cursor: pointer;
}

.menu-featured-image img {
  width: 100%;
  height: 100%;

  object-fit: cover;

  display: block;

  transition:
    transform 0.6s ease;
}

.menu-featured-image:hover img {
  transform: scale(1.035);
}

.menu-featured-details {
  padding: 20px 45px 20px 10px;
}

.menu-featured-eyebrow {
  display: block;

  margin-bottom: 12px;

  font-size: 11px;
  font-weight: 900;

  font-style: italic;

  letter-spacing: 0.1em;

  color: #ffb183;
}

.menu-featured-details h2 {
  margin: 0;

  font-size: clamp(34px, 4vw, 56px);
  line-height: 1.02;

  letter-spacing: -0.035em;

  color: white;
}

.menu-featured-details p {
  max-width: 580px;

  margin: 18px 0 0;

  color:
    rgba(255, 255, 255, 0.73);

  font-size: 17px;
  line-height: 1.65;
}

.menu-featured-meta {
  display: flex;
  flex-wrap: wrap;

  gap: 9px;

  margin-top: 22px;
}

.menu-featured-meta span {
  padding: 7px 11px;

  border-radius: 999px;

  background:
    rgba(255, 255, 255, 0.1);

  border: 1px solid
    rgba(255, 255, 255, 0.14);

  font-size: 12px;
  font-weight: 800;
}

.menu-featured-price {
  display: flex;
  align-items: baseline;

  gap: 12px;

  margin-top: 22px;
}

.menu-featured-price strong {
  font-size: 36px;
  color: #ffd15a;
}

.menu-featured-price del {
  font-size: 16px;

  color:
    rgba(255, 255, 255, 0.45);
}

.menu-featured-cta {
  min-width: 220px;

  margin-top: 20px;

  padding: 15px 24px;

  border: 0;

  border-radius: 15px;

  background:
    linear-gradient(
      135deg,
      #ffb900,
      #ff7a28
    );

  color: #28150e;

  font-size: 14px;
  font-weight: 900;

  cursor: pointer;

  box-shadow:
    0 12px 25px
      rgba(255, 113, 39, 0.25);

  transition:
    transform 0.2s ease,
    box-shadow 0.2s ease;
}

.menu-featured-cta:hover {
  transform: translateY(-2px);

  box-shadow:
    0 17px 32px
      rgba(255, 113, 39, 0.34);
}

.menu-featured-arrow {
  position: absolute;

  top: 50%;

  z-index: 5;

  width: 48px;
  height: 48px;

  margin-top: 15px;

  border-radius: 50%;

  border: 1px solid
    rgba(255, 255, 255, 0.22);

  background:
    rgba(0, 0, 0, 0.28);

  color: white;

  font-size: 30px;

  cursor: pointer;

  display: flex;
  align-items: center;
  justify-content: center;

  backdrop-filter: blur(8px);

  transform: translateY(-50%);

  transition:
    background 0.2s ease,
    transform 0.2s ease;
}

.menu-featured-arrow:hover {
  background:
    rgba(255, 100, 47, 0.9);

  transform:
    translateY(-50%) scale(1.05);
}

.menu-featured-arrow.left {
  left: 20px;
}

.menu-featured-arrow.right {
  right: 20px;
}

.menu-featured-dots {
  position: absolute;

  z-index: 5;

  bottom: 20px;
  left: 50%;

  display: flex;
  gap: 6px;

  transform: translateX(-50%);
}

.menu-featured-dots span {
  width: 7px;
  height: 7px;

  border-radius: 999px;

  background:
    rgba(255, 255, 255, 0.32);

  transition:
    width 0.25s ease,
    background 0.25s ease;
}

.menu-featured-dots span.active {
  width: 24px;

  background:
    #ffbd36;
}

/* =========================================================
   MAIN CONTENT
========================================================= */

.menu-content {
  padding: 28px 0 90px;
}

.menu-category-section {
  scroll-margin-top: 150px;

  padding: 32px 0 15px;
}

.menu-category-heading {
  display: flex;
  align-items: flex-end;
  justify-content: space-between;

  gap: 20px;

  margin-bottom: 14px;

  padding-bottom: 16px;

  border-bottom: 1px solid
    #eaded5;
}

.menu-category-heading h2 {
  margin: 0;

  font-size: 30px;
  line-height: 1.1;

  letter-spacing: -0.025em;

  color: var(--menu-brown);
}

.menu-category-heading span {
  display: block;

  margin-top: 5px;

  color: #9b877e;

  font-size: 13px;
}

.menu-fresh-badge {
  display: inline-flex;
  align-items: center;

  gap: 7px;

  padding: 8px 12px;

  border-radius: 999px;

  background:
    var(--menu-green-soft);

  color: var(--menu-green);

  font-size: 11px;
  font-weight: 900;

  white-space: nowrap;
}

.menu-fresh-badge span {
  margin: 0;

  color: var(--menu-green);

  font-size: 12px;
}

/* =========================================================
   AVAILABILITY
========================================================= */

.menu-availability {
  width: fit-content;

  display: inline-flex;
  align-items: center;

  gap: 8px;

  margin: 0 0 18px;

  padding: 8px 13px;

  border-radius: 999px;

  font-size: 11px;
  font-weight: 800;
}

.menu-availability span {
  width: 7px;
  height: 7px;

  border-radius: 50%;

  background: currentColor;
}

.menu-availability.open {
  color: #267440;
  background: #eaf7ed;
}

.menu-availability.closed {
  color: #c84a36;
  background: #fff0ec;
}

/* =========================================================
   PRODUCT GRID
========================================================= */

.menu-product-grid {
  display: grid;

  grid-template-columns:
    repeat(3, minmax(0, 1fr));

  gap: 22px;
}

/* =========================================================
   PRODUCT CARD
========================================================= */

.menu-product-card {
  overflow: hidden;

  background: white;

  border: 1px solid
    var(--menu-border);

  border-radius: 22px;

  box-shadow:
    0 8px 28px
      rgba(45, 27, 20, 0.055);

  transition:
    transform 0.25s ease,
    box-shadow 0.25s ease,
    border-color 0.25s ease;
}

.menu-product-card:hover {
  transform: translateY(-4px);

  border-color: #e8cabc;

  box-shadow:
    0 18px 40px
      rgba(45, 27, 20, 0.1);
}

.menu-product-image-button {
  position: relative;

  display: block;

  width: 100%;

  height: 285px;

  padding: 0;

  border: 0;

  overflow: hidden;

  background: #f5eee9;

  cursor: pointer;
}

.menu-product-image-button img {
  width: 100%;
  height: 100%;

  object-fit: cover;

  display: block;

  transition:
    transform 0.45s ease;
}

.menu-product-card:hover
  .menu-product-image-button img {
  transform: scale(1.035);
}

.menu-discount-badge {
  position: absolute;

  top: 14px;
  left: 14px;

  padding: 7px 10px;

  border-radius: 8px;

  background:
    var(--menu-green);

  color: white;

  font-size: 10px;
  font-weight: 900;

  box-shadow:
    0 5px 14px
      rgba(0, 0, 0, 0.14);
}

.menu-card-featured-badge {
  position: absolute;

  right: 14px;
  top: 14px;

  padding: 7px 10px;

  border-radius: 8px;

  background:
    rgba(255, 255, 255, 0.94);

  color: #82511f;

  font-size: 9px;
  font-weight: 900;
}

/* =========================================================
   PRODUCT BODY
========================================================= */

.menu-product-body {
  padding: 19px 20px 20px;
}

.menu-product-title-row {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;

  gap: 12px;
}

.menu-product-title-row h3 {
  min-width: 0;

  margin: 0;

  font-size: 20px;
  line-height: 1.2;

  letter-spacing: -0.02em;

  color: var(--menu-brown);
}

.menu-rating {
  flex: 0 0 auto;

  display: inline-flex;
  align-items: center;

  gap: 3px;

  color: #4b3d36;

  font-size: 12px;
}

.menu-rating span {
  color: #ed9c00;
}

.menu-rating strong {
  font-size: 12px;
}

.menu-rating small {
  color: #9b8a82;

  font-size: 10px;
}

.menu-product-description {
  display: -webkit-box;

  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;

  overflow: hidden;

  min-height: 43px;

  margin: 10px 0 0;

  color: #806f66;

  font-size: 13px;
  line-height: 1.6;
}

.menu-product-bottom {
  display: flex;
  align-items: center;
  justify-content: space-between;

  gap: 15px;

  margin-top: 19px;
}

.menu-price-block {
  display: flex;
  align-items: baseline;

  flex-wrap: wrap;

  gap: 8px;
}

.menu-price-block strong {
  font-size: 23px;

  color: #21140f;
}

.menu-price-block span {
  color: #a38e84;

  font-size: 13px;

  text-decoration: line-through;
}

.menu-product-action {
  flex: 0 0 auto;
}

.menu-btn-primary,
.menu-btn-notify {
  min-width: 116px;

  min-height: 43px;

  padding: 0 16px;

  border-radius: 12px;

  font-size: 11px;
  font-weight: 900;

  cursor: pointer;

  transition:
    transform 0.2s ease,
    box-shadow 0.2s ease,
    background 0.2s ease;
}

.menu-btn-primary {
  border: 1px solid
    var(--menu-orange);

  background: var(--menu-orange);

  color: white;

  box-shadow:
    0 7px 16px
      rgba(255, 100, 47, 0.2);
}

.menu-btn-primary:hover {
  background:
    var(--menu-orange-dark);

  transform: translateY(-2px);

  box-shadow:
    0 10px 20px
      rgba(255, 100, 47, 0.27);
}

.menu-btn-notify {
  border: 1px solid
    #27a34b;

  background: #f0faf2;

  color: #237b3a;
}

.menu-btn-notify:hover {
  background: #e2f5e7;

  transform: translateY(-2px);
}

.menu-options-link {
  margin-top: 10px;

  padding: 0;

  border: 0;

  background: transparent;

  color: var(--menu-orange);

  font-size: 11px;
  font-weight: 800;

  cursor: pointer;
}

/* =========================================================
   QUANTITY
========================================================= */

.menu-quantity-control {
  display: flex;
  align-items: center;

  height: 43px;

  overflow: hidden;

  border-radius: 12px;

  border: 1px solid
    var(--menu-orange);

  background:
    var(--menu-orange);

  color: white;

  box-shadow:
    0 7px 16px
      rgba(255, 100, 47, 0.18);
}

.menu-quantity-control button {
  width: 37px;
  height: 100%;

  border: 0;

  background: transparent;

  color: white;

  font-size: 21px;
  font-weight: 700;

  cursor: pointer;
}

.menu-quantity-control button:hover {
  background:
    rgba(0, 0, 0, 0.1);
}

.menu-quantity-control strong {
  min-width: 29px;

  text-align: center;

  font-size: 13px;
}

/* =========================================================
   EMPTY
========================================================= */

.menu-empty-state {
  min-height: 430px;

  display: flex;
  flex-direction: column;

  align-items: center;
  justify-content: center;

  text-align: center;

  padding: 60px 20px;
}

.menu-empty-icon {
  width: 82px;
  height: 82px;

  display: flex;
  align-items: center;
  justify-content: center;

  margin-bottom: 20px;

  border-radius: 50%;

  background:
    var(--menu-orange-soft);

  font-size: 34px;
}

.menu-empty-state h2 {
  margin: 0;

  font-size: 27px;
}

.menu-empty-state p {
  margin: 8px 0 22px;

  color: #927f75;

  font-size: 14px;
}

.menu-empty-state button {
  padding: 13px 19px;

  border: 0;

  border-radius: 11px;

  background: var(--menu-orange);

  color: white;

  font-size: 11px;
  font-weight: 900;

  cursor: pointer;
}

/* =========================================================
   ERROR
========================================================= */

.menu-error-box {
  margin: 55px auto;

  max-width: 600px;

  padding: 35px;

  display: flex;
  flex-direction: column;

  gap: 9px;

  align-items: center;

  text-align: center;

  border: 1px solid #f0d5ca;

  border-radius: 20px;

  background: white;

  box-shadow: var(--menu-shadow);
}

.menu-error-box strong {
  font-size: 21px;
}

.menu-error-box span {
  color: #89766c;

  font-size: 14px;
}

.menu-error-box button {
  margin-top: 12px;

  padding: 12px 18px;

  border: 0;

  border-radius: 10px;

  background: var(--menu-orange);

  color: white;

  font-size: 11px;
  font-weight: 900;

  cursor: pointer;
}

/* =========================================================
   MODAL
========================================================= */

.menu-modal-overlay {
  position: fixed;

  inset: 0;

  z-index: 500;

  display: flex;
  align-items: center;
  justify-content: center;

  padding: 30px;

  background:
    rgba(34, 20, 14, 0.58);

  backdrop-filter: blur(7px);
  -webkit-backdrop-filter: blur(7px);

  animation:
    menuOverlayIn 0.2s ease;
}

.menu-product-modal {
  position: relative;

  width: min(720px, 100%);

  max-height:
    min(850px, 92vh);

  overflow-y: auto;

  border-radius: 26px;

  background: white;

  box-shadow:
    0 30px 90px
      rgba(0, 0, 0, 0.28);

  animation:
    menuModalIn 0.25s ease;
}

.menu-modal-close {
  position: absolute;

  z-index: 5;

  top: 15px;
  right: 15px;

  width: 40px;
  height: 40px;

  border: 0;

  border-radius: 50%;

  background:
    rgba(255, 255, 255, 0.94);

  color: #4d3930;

  font-size: 24px;

  cursor: pointer;

  box-shadow:
    0 5px 18px
      rgba(0, 0, 0, 0.12);
}

.menu-modal-image {
  height: 300px;

  background: #f4ede8;
}

.menu-modal-image img {
  width: 100%;
  height: 100%;

  display: block;

  object-fit: cover;
}

.menu-modal-content {
  padding: 27px;
}

.menu-modal-title-row {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;

  gap: 20px;
}

.menu-modal-label {
  display: block;

  margin-bottom: 7px;

  color: var(--menu-orange);

  font-size: 10px;
  font-weight: 900;

  letter-spacing: 0.1em;
}

.menu-modal-title-row h2 {
  margin: 0;

  font-size: 30px;
  line-height: 1.12;

  letter-spacing: -0.025em;
}

.menu-modal-rating {
  flex: 0 0 auto;

  padding: 8px 10px;

  border-radius: 9px;

  background: #fff6dd;

  color: #b27400;

  font-size: 12px;
  font-weight: 900;
}

.menu-modal-rating small {
  color: #a18b78;

  margin-left: 3px;
}

.menu-modal-description {
  margin: 13px 0 23px;

  color: #806f66;

  font-size: 14px;
  line-height: 1.6;
}

.menu-variant-list {
  display: flex;
  flex-direction: column;

  gap: 10px;
}

.menu-variant-row {
  display: flex;
  align-items: center;
  justify-content: space-between;

  gap: 20px;

  padding: 17px;

  border-radius: 16px;

  border: 1px solid
    #eaded5;

  background: #fffdfb;
}

.menu-variant-row.selected {
  border-color:
    rgba(255, 100, 47, 0.5);

  background:
    #fff7f2;
}

.menu-variant-info {
  min-width: 0;
}

.menu-variant-info > strong {
  display: block;

  font-size: 15px;
}

.menu-variant-info p {
  margin: 4px 0 8px;

  color: #8b7970;

  font-size: 12px;
}

.menu-variant-price {
  display: flex;
  align-items: baseline;

  gap: 8px;
}

.menu-variant-price > strong {
  color: #23150f;

  font-size: 17px;
}

.menu-variant-price del {
  color: #a39087;

  font-size: 11px;
}

.menu-variant-price span {
  padding: 3px 6px;

  border-radius: 5px;

  background: #eaf6ed;

  color: #24763a;

  font-size: 9px;
  font-weight: 900;
}

.menu-variant-action {
  flex: 0 0 auto;
}

.menu-variant-add {
  min-width: 90px;
}

.menu-modal-done {
  width: 100%;

  margin-top: 18px;

  min-height: 48px;

  border: 0;

  border-radius: 13px;

  background: var(--menu-orange);

  color: white;

  font-size: 12px;
  font-weight: 900;

  cursor: pointer;
}

/* =========================================================
   LOADER
========================================================= */

.menu-loader-area {
  min-height: 520px;

  display: flex;
  align-items: center;
  justify-content: center;

  padding: 55px 20px;
}

.menu-loader-card {
  width: min(690px, 100%);

  padding: 27px;

  border-radius: 26px;

  background: white;

  border: 1px solid
    var(--menu-border);

  box-shadow:
    0 22px 65px
      rgba(45, 27, 20, 0.1);

  animation:
    loaderCardIn 0.45s ease;
}

.menu-loader-offer {
  padding: 18px 20px;

  border-radius: 17px;

  background:
    linear-gradient(
      135deg,
      #fff1e7,
      #fff9f4
    );

  border: 1px solid #f2d8ca;

  text-align: center;
}

.menu-loader-offer span {
  display: block;

  margin-bottom: 3px;

  color: var(--menu-orange);

  font-size: 10px;
  font-weight: 900;

  letter-spacing: 0.12em;
}

.menu-loader-offer strong {
  display: block;

  color: var(--menu-brown);

  font-size: 28px;
}

.menu-loader-offer b {
  display: block;

  margin-top: 3px;

  font-size: 11px;
}

.menu-loader-offer small {
  display: block;

  margin-top: 5px;

  color: #927e74;

  font-size: 10px;
}

.menu-loader-heading {
  display: flex;
  align-items: center;

  gap: 14px;

  margin: 24px 0 20px;
}

.menu-loader-icon {
  width: 52px;
  height: 52px;

  flex: 0 0 auto;

  display: flex;
  align-items: center;
  justify-content: center;

  border-radius: 16px;

  background:
    var(--menu-orange-soft);

  font-size: 27px;

  animation:
    loaderPulse 1.5s ease infinite;
}

.menu-loader-heading h3 {
  margin: 0;

  font-size: 18px;
}

.menu-loader-heading p {
  margin: 4px 0 0;

  color: #97837a;

  font-size: 12px;
}

.menu-loader-grid {
  display: grid;

  grid-template-columns:
    repeat(3, 1fr);

  gap: 12px;
}

.menu-loader-item {
  opacity: 0;

  animation:
    loaderItemIn 0.55s ease forwards;
}

.menu-loader-image {
  overflow: hidden;

  height: 105px;

  border-radius: 13px;

  background: #f5ede8;
}

.menu-loader-image img {
  width: 100%;
  height: 100%;

  object-fit: cover;

  display: block;
}

.menu-loader-item span {
  display: block;

  margin-top: 7px;

  color: #75635b;

  font-size: 10px;
  font-weight: 800;

  text-align: center;
}

.menu-loader-progress {
  height: 4px;

  overflow: hidden;

  margin-top: 22px;

  border-radius: 999px;

  background: #f1e4dc;
}

.menu-loader-progress span {
  display: block;

  width: 35%;
  height: 100%;

  border-radius: inherit;

  background:
    linear-gradient(
      90deg,
      var(--menu-orange),
      #ffb32e
    );

  animation:
    loaderProgress 1.4s ease-in-out infinite;
}

/* =========================================================
   ANIMATIONS
========================================================= */

@keyframes menuOverlayIn {
  from {
    opacity: 0;
  }

  to {
    opacity: 1;
  }
}

@keyframes menuModalIn {
  from {
    opacity: 0;
    transform: translateY(20px)
      scale(0.98);
  }

  to {
    opacity: 1;
    transform: translateY(0)
      scale(1);
  }
}

@keyframes loaderCardIn {
  from {
    opacity: 0;
    transform: translateY(15px);
  }

  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@keyframes loaderItemIn {
  from {
    opacity: 0;
    transform: translateY(8px);
  }

  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@keyframes loaderPulse {
  0%,
  100% {
    transform: scale(1);
  }

  50% {
    transform: scale(1.07);
  }
}

@keyframes loaderProgress {
  0% {
    transform: translateX(-120%);
  }

  100% {
    transform: translateX(320%);
  }
}

/* =========================================================
   TABLET
========================================================= */

@media (max-width: 1100px) {
  .menu-product-grid {
    grid-template-columns:
      repeat(2, minmax(0, 1fr));
  }

  .menu-featured-content {
    grid-template-columns:
      minmax(0, 1fr)
      minmax(0, 0.9fr);

    min-height: 360px;
  }

  .menu-featured-image {
    height: 360px;
  }

  .menu-featured-details {
    padding-right: 25px;
  }
}

/* =========================================================
   MOBILE
========================================================= */

@media (max-width: 700px) {
  .menu-shell-container {
    width: min(
      100% - 24px,
      1380px
    );
  }

  .menu-hero {
    padding: 27px 0 23px;
  }

  .menu-hero h1 {
    max-width: 100%;

    font-size: 36px;
    line-height: 1.02;

    display: -webkit-box;
    -webkit-box-orient: vertical;
    -webkit-line-clamp: 2;

    overflow: hidden;
  }

  .menu-hero p {
    margin-top: 10px;

    max-width: 100%;

    font-size: 14px;
    line-height: 1.45;

    display: -webkit-box;
    -webkit-box-orient: vertical;
    -webkit-line-clamp: 2;

    overflow: hidden;
  }

  .menu-sticky-controls {
    top: 0;

    padding: 10px 0 10px;
  }

  .menu-search-box {
    height: 52px;

    padding-left: 14px;

    border-radius: 15px;
  }

  .menu-search-clear {
    width: 36px;
    height: 36px;

    font-size: 23px;
  }

  .menu-category-scroll {
    gap: 7px;

    margin-top: 9px;
  }

  .menu-category-pill {
    min-height: 37px;

    padding: 0 14px;

    font-size: 11px;
  }

  .menu-search-result-summary {
    margin-top: 18px;

    padding: 14px 15px;

    align-items: flex-start;
    flex-direction: column;

    gap: 11px;
  }

  .menu-search-result-summary div {
    gap: 8px;
  }

  .menu-featured-wrap {
    padding-top: 20px;
  }

  .menu-featured-card {
    padding: 13px;

    border-radius: 22px;
  }

  .menu-featured-top {
    margin-bottom: 11px;
  }

  .menu-featured-top span {
    padding: 8px 10px;

    font-size: 9px;
  }

  .menu-featured-content {
    display: flex;
    flex-direction: column;

    gap: 0;

    min-height: 0;
  }

  .menu-featured-image {
    width: 100%;
    height: 250px;

    border-radius: 17px;
  }

  .menu-featured-details {
    padding: 20px 12px 30px;
  }

  .menu-featured-eyebrow {
    margin-bottom: 7px;

    font-size: 9px;
  }

  .menu-featured-details h2 {
    font-size: 29px;
  }

  .menu-featured-details p {
    margin-top: 10px;

    font-size: 13px;

    line-height: 1.5;

    display: -webkit-box;
    -webkit-line-clamp: 3;
    -webkit-box-orient: vertical;

    overflow: hidden;
  }

  .menu-featured-meta {
    margin-top: 13px;

    gap: 6px;
  }

  .menu-featured-meta span {
    padding: 5px 8px;

    font-size: 9px;
  }

  .menu-featured-price {
    margin-top: 14px;
  }

  .menu-featured-price strong {
    font-size: 27px;
  }

  .menu-featured-cta {
    width: 100%;

    min-width: 0;

    margin-top: 14px;

    min-height: 48px;

    border-radius: 13px;
  }

  .menu-featured-arrow {
    top: 130px;

    width: 36px;
    height: 36px;

    margin-top: 0;

    font-size: 24px;
  }

  .menu-featured-arrow.left {
    left: 21px;
  }

  .menu-featured-arrow.right {
    right: 21px;
  }

  .menu-featured-dots {
    bottom: 11px;
  }

  .menu-content {
    padding-top: 5px;
  }

  .menu-category-section {
    scroll-margin-top: 125px;

    padding-top: 27px;
  }

  .menu-category-heading {
    align-items: flex-start;

    margin-bottom: 11px;

    padding-bottom: 12px;
  }

  .menu-category-heading h2 {
    font-size: 24px;
  }

  .menu-category-heading span {
    font-size: 11px;
  }

  .menu-fresh-badge {
    display: none;
  }

  .menu-availability {
    margin-bottom: 13px;

    padding: 7px 10px;

    font-size: 9px;
  }

  .menu-product-grid {
    grid-template-columns: 1fr;

    gap: 14px;
  }

  .menu-product-card {
    border-radius: 18px;
  }

  .menu-product-image-button {
    height: 250px;
  }

  .menu-product-body {
    padding: 15px 16px 17px;
  }

  .menu-product-title-row h3 {
    font-size: 18px;
  }

  .menu-product-description {
    min-height: 0;

    margin-top: 7px;

    font-size: 12px;
    line-height: 1.5;
  }

  .menu-product-bottom {
    margin-top: 15px;
  }

  .menu-price-block strong {
    font-size: 21px;
  }

  .menu-btn-primary,
  .menu-btn-notify {
    min-width: 110px;

    min-height: 43px;

    padding: 0 12px;

    font-size: 10px;
  }

  .menu-quantity-control {
    height: 43px;
  }

  .menu-quantity-control button {
    width: 35px;
  }

  .menu-options-link {
    margin-top: 8px;
  }

  /* Modal */
  .menu-modal-overlay {
    align-items: flex-end;

    padding: 0;
  }

  .menu-product-modal {
    width: 100%;

    max-height: 93vh;

    border-radius:
      25px 25px 0 0;

    animation:
      menuModalMobileIn
        0.25s ease;
  }

  .menu-modal-image {
    height: 230px;
  }

  .menu-modal-content {
    padding: 20px 16px 18px;
  }

  .menu-modal-title-row h2 {
    font-size: 25px;
  }

  .menu-modal-rating {
    font-size: 10px;
  }

  .menu-variant-row {
    padding: 13px;

    gap: 10px;
  }

  .menu-variant-info > strong {
    font-size: 13px;
  }

  .menu-variant-info p {
    font-size: 10px;
  }

  .menu-variant-price > strong {
    font-size: 15px;
  }

  .menu-variant-action
    .menu-btn-notify {
    min-width: 72px;
  }

  .menu-variant-add {
    min-width: 72px;
  }

  .menu-modal-done {
    min-height: 45px;
  }

  /* Loader */
  .menu-loader-area {
    min-height: 430px;

    padding: 30px 12px;
  }

  .menu-loader-card {
    padding: 18px;

    border-radius: 21px;
  }

  .menu-loader-offer {
    padding: 13px;
  }

  .menu-loader-offer strong {
    font-size: 24px;
  }

  .menu-loader-heading {
    margin: 18px 0 15px;
  }

  .menu-loader-heading h3 {
    font-size: 15px;
  }

  .menu-loader-grid {
    grid-template-columns:
      repeat(3, 1fr);

    gap: 7px;
  }

  .menu-loader-image {
    height: 75px;

    border-radius: 9px;
  }

  .menu-loader-item span {
    font-size: 8px;
  }

  .menu-empty-state {
    min-height: 350px;
  }
}

@keyframes menuModalMobileIn {
  from {
    opacity: 0;
    transform: translateY(40px);
  }

  to {
    opacity: 1;
    transform: translateY(0);
  }
}

/* =========================================================
   SMALL MOBILE
========================================================= */

@media (max-width: 390px) {
  .menu-shell-container {
    width: calc(100% - 18px);
  }

  .menu-hero h1 {
    font-size: 31px;
  }

  .menu-hero p {
    font-size: 13px;
  }

  .menu-product-image-button {
    height: 225px;
  }

  .menu-product-title-row h3 {
    font-size: 17px;
  }

  .menu-btn-primary,
  .menu-btn-notify {
    min-width: 100px;

    padding-left: 9px;
    padding-right: 9px;
  }
}

/* =========================================================
   FINAL MENU CORRECTIONS
   Added after the existing menu CSS
========================================================= */

/* ---------------------------------------------------------
   1. SMALLER HERO HEADING
--------------------------------------------------------- */

.menu-hero {
  padding: 30px 0 28px;
}

.menu-hero h1 {
  max-width: 900px;

  font-size: clamp(34px, 4vw, 58px);
  line-height: 1.02;
  letter-spacing: -0.04em;
}

.menu-hero p {
  margin-top: 10px;

  font-size: 16px;
}


/* ---------------------------------------------------------
   2. STICKY SEARCH BELOW EXISTING HEADER
--------------------------------------------------------- */

/*
   Header is already fixed/sticky.
   Keep menu controls underneath it instead
   of allowing them to hide behind the header.
*/

.menu-sticky-controls {
  position: sticky;

  /*
     Desktop header is approximately 80px.
     This keeps the search/category bar
     directly underneath it.
  */
  top: 80px;

  z-index: 100;

  background:
    rgba(255, 250, 245, 0.97);

  backdrop-filter: blur(18px);
  -webkit-backdrop-filter: blur(18px);
}


/* ---------------------------------------------------------
   SEARCH IS NOW A BUTTON / TRIGGER
--------------------------------------------------------- */

.menu-search-trigger {
  width: 100%;
  height: 60px;

  display: flex;
  align-items: center;

  padding: 0 20px;

  border: 1px solid
    var(--menu-border);

  border-radius: 18px;

  background: #ffffff;

  color: #9b887f;

  font: inherit;
  font-size: 16px;

  text-align: left;

  cursor: text;

  box-shadow:
    0 5px 20px
      rgba(45, 27, 20, 0.04);

  transition:
    border-color 0.2s ease,
    box-shadow 0.2s ease;
}

.menu-search-trigger:hover {
  border-color:
    var(--menu-orange);

  box-shadow:
    0 0 0 4px
      rgba(255, 100, 47, 0.07);
}

.menu-search-trigger
  .menu-search-icon {
  margin-right: 12px;
}


/* ---------------------------------------------------------
   3. FEATURED DOES NOT AUTO MOVE
--------------------------------------------------------- */

/*
   There is deliberately NO animation/interval
   applied to the featured carousel.
*/

.menu-featured-card {
  animation: none !important;
}

.menu-featured-dots span {
  cursor: pointer;
}


/* ---------------------------------------------------------
   4. INNER CTA = WHITE + ORANGE BORDER + BLACK TEXT
--------------------------------------------------------- */

.menu-btn-primary {
  border: 1.5px solid
    var(--menu-orange);

  background: #ffffff;

  color: #18110d;

  box-shadow: none;
}

.menu-btn-primary:hover {
  border-color:
    var(--menu-orange-dark);

  background:
    #fff7f2;

  color: #18110d;

  transform: translateY(-1px);

  box-shadow:
    0 6px 16px
      rgba(255, 100, 47, 0.12);
}


/*
   Featured CTA remains filled orange.
*/

.menu-featured-cta {
  border: 1px solid
    var(--menu-orange);

  background:
    var(--menu-orange);

  color: #ffffff;
}


/* ---------------------------------------------------------
   5. PRODUCT MODAL ABOVE EVERYTHING
--------------------------------------------------------- */

.menu-modal-overlay {
  position: fixed;

  inset: 0;

  z-index: 99999;

  padding: 24px;

  overflow-y: auto;

  align-items: center;
}

.menu-product-modal {
  position: relative;

  z-index: 100000;

  margin: auto;

  max-height: calc(100vh - 48px);
}


/* ---------------------------------------------------------
   6. SEARCH PAGE / SEARCH OVERLAY
--------------------------------------------------------- */

.menu-search-page {
  position: fixed;

  /*
     Leave the existing site header visible.
  */
  top: 80px;
  right: 0;
  bottom: 0;
  left: 0;

  z-index: 9000;

  overflow-y: auto;

  background:
    var(--menu-cream);

  animation:
    menuSearchPageIn
    0.18s ease;
}

.menu-search-page-top {
  position: sticky;

  top: 0;

  z-index: 10;

  width: min(
    100%,
    1380px
  );

  margin: 0 auto;

  padding: 18px 24px;

  display: flex;
  align-items: center;

  gap: 15px;

  background:
    rgba(255, 250, 245, 0.97);

  border-bottom: 1px solid
    var(--menu-border);

  backdrop-filter: blur(18px);
  -webkit-backdrop-filter: blur(18px);
}

.menu-search-back {
  width: 48px;
  height: 48px;

  flex: 0 0 auto;

  display: flex;
  align-items: center;
  justify-content: center;

  border: 1px solid
    var(--menu-border);

  border-radius: 14px;

  background: #ffffff;

  color: var(--menu-brown);

  cursor: pointer;

  transition:
    background 0.2s ease,
    border-color 0.2s ease;
}

.menu-search-back:hover {
  border-color:
    var(--menu-orange);

  background:
    var(--menu-orange-soft);
}

.menu-search-back svg {
  width: 22px;
  height: 22px;

  fill: none;

  stroke: currentColor;

  stroke-width: 2;

  stroke-linecap: round;
  stroke-linejoin: round;
}

.menu-search-page-input {
  flex: 1;

  height: 54px;

  display: flex;
  align-items: center;

  padding: 0 12px 0 17px;

  background: white;

  border: 1.5px solid
    var(--menu-orange);

  border-radius: 15px;

  box-shadow:
    0 0 0 4px
      rgba(255, 100, 47, 0.07);
}

.menu-search-page-input > svg {
  width: 21px;
  height: 21px;

  flex: 0 0 auto;

  fill: none;

  stroke:
    var(--menu-orange);

  stroke-width: 2;

  stroke-linecap: round;
}

.menu-search-page-input input {
  min-width: 0;
  flex: 1;

  height: 100%;

  padding: 0 13px;

  border: 0;
  outline: 0;

  background: transparent;

  color: var(--menu-brown);

  font: inherit;

  font-size: 16px;
}

.menu-search-page-input input::placeholder {
  color: #a28f86;
}

.menu-search-page-input button {
  width: 36px;
  height: 36px;

  border: 0;

  border-radius: 50%;

  background:
    var(--menu-orange-soft);

  color:
    var(--menu-orange);

  font-size: 22px;

  cursor: pointer;
}

.menu-search-page-content {
  width: min(
    1380px,
    calc(100% - 48px)
  );

  margin: 0 auto;

  padding: 28px 0 80px;
}


/* ---------------------------------------------------------
   ALL ITEMS DIRECTLY BELOW SEARCH
--------------------------------------------------------- */

.menu-search-all-title {
  display: flex;
  align-items: flex-end;
  justify-content: space-between;

  gap: 20px;

  margin-bottom: 18px;

  padding-bottom: 15px;

  border-bottom: 1px solid
    var(--menu-border);
}

.menu-search-all-title span {
  display: block;

  margin-bottom: 4px;

  color:
    var(--menu-orange);

  font-size: 10px;
  font-weight: 900;

  letter-spacing: 0.12em;
}

.menu-search-all-title h2 {
  margin: 0;

  font-size: 30px;

  letter-spacing: -0.025em;
}

.menu-search-all-title small {
  color: #958078;

  font-size: 12px;
}


/* ---------------------------------------------------------
   SEARCH PAGE CATEGORY BROWSE
--------------------------------------------------------- */

.menu-search-category-row {
  display: flex;
  align-items: center;

  gap: 8px;

  margin-bottom: 24px;

  overflow-x: auto;

  scrollbar-width: none;
}

.menu-search-category-row::-webkit-scrollbar {
  display: none;
}

.menu-search-category-row > span {
  flex: 0 0 auto;

  margin-right: 3px;

  color: #9a867c;

  font-size: 11px;
  font-weight: 800;
}

.menu-search-category-row button {
  flex: 0 0 auto;

  padding: 8px 13px;

  border: 1px solid
    var(--menu-border);

  border-radius: 999px;

  background: #ffffff;

  color: #6e5b52;

  font-size: 10px;
  font-weight: 800;

  cursor: pointer;
}

.menu-search-category-row button:hover {
  border-color:
    var(--menu-orange);

  color:
    var(--menu-orange);
}


/* ---------------------------------------------------------
   SEARCH PAGE ANIMATION
--------------------------------------------------------- */

@keyframes menuSearchPageIn {
  from {
    opacity: 0;
    transform: translateY(8px);
  }

  to {
    opacity: 1;
    transform: translateY(0);
  }
}


/* =========================================================
   MOBILE
========================================================= */

@media (max-width: 700px) {

  /* Smaller hero */
  .menu-hero {
    padding: 22px 0 20px;
  }

  .menu-hero h1 {
    max-width: 100%;

    font-size: 30px;

    line-height: 1.04;

    letter-spacing: -0.035em;
  }

  .menu-hero p {
    margin-top: 8px;

    font-size: 13px;

    line-height: 1.45;
  }


  /* Sticky below mobile header */
  .menu-sticky-controls {
    top: 64px;

    padding-top: 9px;
    padding-bottom: 9px;
  }

  .menu-search-trigger {
    height: 50px;

    padding-left: 14px;

    border-radius: 14px;

    font-size: 13px;
  }

  .menu-category-scroll {
    margin-top: 8px;
  }


  /* Search page */
  .menu-search-page {
    top: 64px;
  }

  .menu-search-page-top {
    width: 100%;

    padding: 10px 12px;

    gap: 9px;
  }

  .menu-search-back {
    width: 43px;
    height: 43px;

    border-radius: 12px;
  }

  .menu-search-page-input {
    height: 46px;

    border-radius: 12px;
  }

  .menu-search-page-input input {
    font-size: 14px;

    padding-left: 9px;
  }

  .menu-search-page-content {
    width: calc(100% - 24px);

    padding-top: 19px;
  }

  .menu-search-all-title {
    align-items: center;

    margin-bottom: 13px;
  }

  .menu-search-all-title h2 {
    font-size: 24px;
  }

  .menu-search-category-row {
    margin-bottom: 18px;
  }


  /* Modal above mobile header too */
  .menu-modal-overlay {
    z-index: 99999;

    padding: 0;

    align-items: flex-end;
  }

  .menu-product-modal {
    z-index: 100000;

    max-height: 94vh;

    margin: 0;

    border-radius:
      25px 25px 0 0;
  }


  /* Inner CTA stays white */
  .menu-btn-primary {
    background: #ffffff;

    color: #18110d;

    border:
      1.5px solid
      var(--menu-orange);
  }

  .menu-featured-cta {
    background:
      var(--menu-orange);

    color: #ffffff;
  }
}


/* =========================================================
   VERY SMALL MOBILE
========================================================= */

@media (max-width: 390px) {

  .menu-hero h1 {
    font-size: 27px;
  }

  .menu-hero p {
    font-size: 12px;
  }

  .menu-sticky-controls {
    top: 60px;
  }

  .menu-search-page {
    top: 60px;
  }
}
/* =========================================================
   MITHORA MENU — CORRECTIONS ONLY
   Do not change anything else
========================================================= */


/* =========================================================
   1. HERO HEADING — SMALLER
========================================================= */

.menu-page-shell .menu-hero {
  padding: 28px 0 24px !important;
}

.menu-page-shell .menu-hero h1 {
  max-width: 760px !important;

  font-size: clamp(32px, 3.6vw, 52px) !important;
  line-height: 1.02 !important;
  letter-spacing: -0.035em !important;

  margin: 0 !important;
}

.menu-page-shell .menu-hero p {
  margin-top: 9px !important;

  font-size: 15px !important;
  line-height: 1.45 !important;
}


/* =========================================================
   2. FEATURED CAROUSEL — NEVER AUTO MOVE
========================================================= */

.menu-featured-card,
.menu-featured-content,
.menu-featured-image img {
  animation: none !important;
}


/* =========================================================
   3. MENU SEARCH + CATEGORY — STICKY
      Header = #site-header
========================================================= */

.menu-page-shell .menu-sticky-controls {
  position: sticky !important;

  top: 78px !important;

  z-index: 900 !important;

  background:
    rgba(255, 250, 245, 0.98) !important;

  backdrop-filter: blur(18px);
  -webkit-backdrop-filter: blur(18px);

  box-shadow:
    0 6px 22px
      rgba(45, 27, 20, 0.08);
}


/*
   Keep the search and categories together.
*/

.menu-page-shell .menu-category-scroll {
  position: relative;

  display: flex;

  overflow-x: auto;

  white-space: nowrap;

  scrollbar-width: none;
}

.menu-page-shell .menu-category-scroll::-webkit-scrollbar {
  display: none;
}


/* =========================================================
   4. PRODUCT MODAL — ABOVE HEADER BUT START BELOW IT
========================================================= */

.menu-page-shell .menu-modal-overlay {
  position: fixed !important;

  inset: 0 !important;

  z-index: 2000 !important;

  display: flex !important;

  align-items: flex-start !important;
  justify-content: center !important;

  padding:
    96px 24px 24px !important;

  overflow-y: auto !important;

  background:
    rgba(34, 20, 14, 0.62) !important;

  backdrop-filter: blur(7px);
  -webkit-backdrop-filter: blur(7px);
}

.menu-page-shell .menu-product-modal {
  position: relative !important;

  z-index: 2001 !important;

  width: min(720px, 100%) !important;

  max-height:
    calc(100vh - 120px) !important;

  margin: 0 auto !important;

  overflow-y: auto !important;
}


/* =========================================================
   5. INNER CTA
      WHITE + ORANGE BORDER + BLACK TEXT
========================================================= */

.menu-page-shell .menu-btn-primary {
  min-height: 44px;

  border:
    1.5px solid
    var(--menu-orange) !important;

  background:
    #ffffff !important;

  color:
    #18110d !important;

  box-shadow: none !important;
}

.menu-page-shell .menu-btn-primary:hover {
  background:
    #fff7f2 !important;

  color:
    #18110d !important;

  border-color:
    var(--menu-orange-dark) !important;
}


/*
   Featured CTA stays filled.
*/

.menu-page-shell .menu-featured-cta {
  border:
    1px solid
    var(--menu-orange) !important;

  background:
    var(--menu-orange) !important;

  color:
    #ffffff !important;
}


/* =========================================================
   6. SEARCH — OPEN AS FULL PAGE
========================================================= */

.menu-page-shell .menu-search-page {
  position: fixed !important;

  inset: 0 !important;

  top: 0 !important;

  z-index: 3000 !important;

  width: 100vw !important;
  height: 100vh !important;

  overflow-y: auto !important;

  background:
    var(--menu-cream) !important;
}


/*
   Search page header stays at top while scrolling.
*/

.menu-page-shell .menu-search-page-top {
  position: sticky !important;

  top: 0 !important;

  z-index: 20 !important;

  width: 100% !important;

  padding:
    18px 24px !important;

  background:
    rgba(255, 250, 245, 0.98) !important;

  border-bottom:
    1px solid
    var(--menu-border) !important;

  backdrop-filter: blur(18px);
  -webkit-backdrop-filter: blur(18px);
}


/*
   Back arrow is clearly on the left.
*/

.menu-page-shell .menu-search-back {
  flex: 0 0 48px;

  width: 48px !important;
  height: 48px !important;

  display: flex !important;

  align-items: center;
  justify-content: center;

  border:
    1px solid
    var(--menu-border) !important;

  border-radius: 14px;

  background:
    #ffffff !important;

  color:
    var(--menu-brown) !important;
}


/*
   All Items immediately below search.
*/

.menu-page-shell .menu-search-page-content {
  width: min(
    1380px,
    calc(100% - 48px)
  ) !important;

  margin: 0 auto !important;

  padding:
    26px 0 80px !important;
}


/* =========================================================
   7. MOBILE — HEADER + STICKY MENU
========================================================= */

@media (max-width: 768px) {

  /* Hero */
  .menu-page-shell .menu-hero {
    padding:
      18px 0 17px !important;
  }

  .menu-page-shell .menu-hero h1 {
    max-width: 100% !important;

    font-size:
      28px !important;

    line-height:
      1.04 !important;

    letter-spacing:
      -0.03em !important;
  }

  .menu-page-shell .menu-hero p {
    margin-top:
      7px !important;

    font-size:
      12px !important;

    line-height:
      1.4 !important;
  }


  /* -------------------------------------------------------
     MOBILE STICKY SEARCH + CATEGORIES
     Header is approximately 50–56px
  ------------------------------------------------------- */

  .menu-page-shell .menu-sticky-controls {
    position: sticky !important;

    top: 56px !important;

    z-index: 900 !important;

    padding:
      8px 0 !important;
  }

  .menu-page-shell .menu-search-trigger {
    height:
      48px !important;

    border-radius:
      13px !important;

    font-size:
      13px !important;
  }

  .menu-page-shell .menu-category-scroll {
    margin-top:
      7px !important;

    padding-bottom:
      1px;
  }


  /* -------------------------------------------------------
     MOBILE SEARCH PAGE
     Covers the header and behaves like a separate page.
  ------------------------------------------------------- */

  .menu-page-shell .menu-search-page {
    top: 0 !important;

    z-index: 3000 !important;
  }

  .menu-page-shell .menu-search-page-top {
    padding:
      10px 12px !important;

    gap:
      9px !important;
  }

  .menu-page-shell .menu-search-back {
    width:
      43px !important;

    height:
      43px !important;

    flex-basis:
      43px !important;

    border-radius:
      12px !important;
  }

  .menu-page-shell .menu-search-page-input {
    height:
      46px !important;

    border-radius:
      12px !important;
  }

  .menu-page-shell .menu-search-page-content {
    width:
      calc(100% - 24px) !important;

    padding:
      18px 0 60px !important;
  }


  /* -------------------------------------------------------
     MOBILE MODAL
     Keep it above everything.
  ------------------------------------------------------- */

  .menu-page-shell .menu-modal-overlay {
    z-index: 4000 !important;

    padding:
      58px 0 0 !important;

    align-items:
      flex-end !important;
  }

  .menu-page-shell .menu-product-modal {
    z-index: 4001 !important;

    width:
      100% !important;

    max-height:
      calc(100vh - 58px) !important;

    margin:
      0 !important;

    border-radius:
      25px 25px 0 0 !important;
  }


  /* Inner CTA */
  .menu-page-shell .menu-btn-primary {
    background:
      #ffffff !important;

    color:
      #18110d !important;

    border:
      1.5px solid
      var(--menu-orange) !important;
  }

  /* Featured CTA */
  .menu-page-shell .menu-featured-cta {
    background:
      var(--menu-orange) !important;

    color:
      #ffffff !important;
  }
}


/* =========================================================
   8. VERY SMALL MOBILE
========================================================= */

@media (max-width: 390px) {

  .menu-page-shell .menu-hero h1 {
    font-size:
      26px !important;
  }

  .menu-page-shell .menu-sticky-controls {
    top:
      54px !important;
  }
}

/* =========================================================
   FINAL MITHORA MENU POLISH
   Header-safe / smooth sticky / Probow-inspired hero /
   contained mobile product modal
========================================================= */

/* The global Mithora header is fixed. Keep menu content below it. */
.menu-page-shell {
  padding-top: 78px !important;
}

/* ---------------------------------------------------------
   HERO — centered, clean, Probow-inspired
--------------------------------------------------------- */
.menu-page-shell .menu-hero {
  padding: 48px 0 42px !important;
  text-align: center;
}

.menu-page-shell .menu-hero .menu-shell-container {
  display: flex;
  flex-direction: column;
  align-items: center;
}

.menu-page-shell .menu-hero-eyebrow {
  display: block;
  margin: 0 0 13px;
  color: var(--menu-green);
  font-size: 16px;
  line-height: 1.3;
  font-weight: 700;
  font-style: italic;
  letter-spacing: 0.01em;
}

.menu-page-shell .menu-hero h1 {
  max-width: 900px !important;
  margin: 0 !important;
  font-size: clamp(46px, 5vw, 68px) !important;
  line-height: 1.02 !important;
  letter-spacing: -0.045em !important;
}

.menu-page-shell .menu-hero p {
  max-width: 760px !important;
  margin: 17px auto 0 !important;
  font-size: 17px !important;
  line-height: 1.55 !important;
}

.menu-hero-badges {
  display: flex;
  justify-content: center;
  flex-wrap: wrap;
  gap: 10px;
  margin-top: 22px;
}

.menu-hero-badges span {
  display: inline-flex;
  align-items: center;
  min-height: 38px;
  padding: 0 14px;
  border: 1px solid rgba(234, 222, 213, 0.95);
  border-radius: 999px;
  background: #fff;
  color: #3b2d26;
  font-size: 12px;
  font-weight: 800;
  box-shadow: 0 4px 14px rgba(45, 27, 20, 0.035);
}

/* ---------------------------------------------------------
   SEARCH + CATEGORIES — one stable sticky block
   No scroll-state padding changes = no jerky jump.
--------------------------------------------------------- */
.menu-page-shell .menu-sticky-controls {
  position: sticky !important;
  top: 78px !important;
  z-index: 900 !important;
  padding: 12px 0 13px !important;
  margin: 0 !important;
  transform: none !important;
  transition: none !important;
}

.menu-page-shell .menu-sticky-controls-scrolled {
  padding: 12px 0 13px !important;
  box-shadow: 0 10px 30px rgba(45, 27, 20, 0.07) !important;
}

.menu-page-shell .menu-category-scroll {
  overscroll-behavior-x: contain;
  -webkit-overflow-scrolling: touch;
}

/* ---------------------------------------------------------
   MOBILE
--------------------------------------------------------- */
@media (max-width: 768px) {
  .menu-page-shell {
    padding-top: 50px !important;
  }

  .menu-page-shell .menu-hero {
    padding: 34px 0 30px !important;
  }

  .menu-page-shell .menu-hero-eyebrow {
    margin-bottom: 9px;
    font-size: 13px;
  }

  .menu-page-shell .menu-hero h1 {
    font-size: 34px !important;
    line-height: 1.03 !important;
  }

  .menu-page-shell .menu-hero p {
    max-width: 355px !important;
    margin-top: 10px !important;
    font-size: 13px !important;
    line-height: 1.5 !important;
  }

  .menu-hero-badges {
    gap: 7px;
    margin-top: 16px;
  }

  .menu-hero-badges span {
    min-height: 32px;
    padding: 0 10px;
    font-size: 9px;
  }

  /* Header ends at ~50px on mobile. Keep the menu block exactly there. */
  .menu-page-shell .menu-sticky-controls {
    top: 50px !important;
    z-index: 900 !important;
    padding: 8px 0 9px !important;
    transition: none !important;
  }

  .menu-page-shell .menu-sticky-controls-scrolled {
    padding: 8px 0 9px !important;
  }

  .menu-page-shell .menu-search-trigger {
    height: 48px !important;
    border-radius: 14px !important;
  }

  .menu-page-shell .menu-category-scroll {
    margin-top: 7px !important;
    padding-bottom: 2px !important;
  }

  /* Keep the existing desktop-style vertical cards on mobile. */
  .menu-page-shell .menu-product-card {
    border-radius: 18px !important;
  }

  .menu-page-shell .menu-product-image-button {
    height: 250px !important;
  }

  /* -------------------------------------------------------
     MOBILE PRODUCT MODAL
     Bottom sheet, contained below header, no page scrolling.
  ------------------------------------------------------- */
  body:has(.menu-page-shell .menu-product-modal) {
    overflow: hidden !important;
    overscroll-behavior: none !important;
  }

  .menu-page-shell .menu-modal-overlay {
    position: fixed !important;
    inset: 0 !important;
    z-index: 4000 !important;
    display: flex !important;
    align-items: flex-end !important;
    justify-content: center !important;
    padding: 0 !important;
    overflow: hidden !important;
    overscroll-behavior: none !important;
    touch-action: none;
  }

  .menu-page-shell .menu-product-modal {
    position: relative !important;
    z-index: 4001 !important;
    width: 100% !important;
    max-height: 78vh !important;
    margin: 0 !important;
    overflow-x: hidden !important;
    overflow-y: auto !important;
    overscroll-behavior: contain !important;
    border-radius: 24px 24px 0 0 !important;
    -webkit-overflow-scrolling: touch;
  }

  .menu-page-shell .menu-modal-image {
    height: 190px !important;
  }

  .menu-page-shell .menu-modal-content {
    padding: 17px 15px 22px !important;
  }
}

@media (max-width: 390px) {
  .menu-page-shell .menu-hero {
    padding-top: 29px !important;
    padding-bottom: 25px !important;
  }

  .menu-page-shell .menu-hero h1 {
    font-size: 30px !important;
  }

  .menu-page-shell .menu-hero p {
    font-size: 12px !important;
  }

  .menu-page-shell .menu-sticky-controls {
    top: 50px !important;
  }

  .menu-page-shell .menu-product-modal {
    max-height: 76vh !important;
  }
}
