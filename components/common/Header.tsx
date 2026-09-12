"use client";

import { useState } from "react";
import { useAuth } from "@/components/auth/AuthContext";

export default function Header() {
  const [menuOpen, setMenuOpen] = useState(false);

  const { openAuth } = useAuth();

  const closeMenu = () => setMenuOpen(false);

  return (
    <header
      id="site-header"
      className={menuOpen ? "menu-is-open" : ""}
    >
      <div className="header-container">

        {/* LOGO */}
        <a href="/" className="logo" onClick={closeMenu}>
          <img
            src="/images/mithora-logo.webp"
            alt="Mithora Kitchen"
          />
        </a>


        {/* NAVIGATION */}
        <nav
          className={menuOpen ? "nav-open" : ""}
          aria-label="Main navigation"
        >
          <ul className="nav-menu">

            <li>
              <a
                href="/"
                className="nav-link"
                onClick={closeMenu}
              >
                Home
              </a>
            </li>

            <li>
              <a
                href="/menu"
                className="nav-link"
                onClick={closeMenu}
              >
                Menu
              </a>
            </li>

            <li>
              <a
                href="/tiffin"
                className="nav-link"
                onClick={closeMenu}
              >
                Tiffin
              </a>
            </li>

            <li>
              <a
                href="/party-orders-jaipur"
                className="nav-link"
                onClick={closeMenu}
              >
                Party Orders
              </a>
            </li>

            <li>
              <a
                href="/vrat-specials"
                className="nav-link"
                onClick={closeMenu}
              >
                Vrat Specials
              </a>
            </li>

            <li>
              <a
                href="/vrat-udyapan-food-box-jaipur"
                className="nav-link"
                onClick={closeMenu}
              >
                Satvik Food Box
              </a>
            </li>

            <li>
              <a
                href="/homemade-snacks-namkeen-jaipur"
                className="nav-link"
                onClick={closeMenu}
              >
                Snacks
              </a>
            </li>

            <li>
              <a
                href="/fruit-bowl-delivery-jaipur"
                className="nav-link"
                onClick={closeMenu}
              >
                Fruit Bowl
              </a>
            </li>


            {/* MOBILE LOGIN */}
            <li className="mobile-login-item">
              <button
                type="button"
                className="mobile-login-link"
                onClick={() => {
                  closeMenu();
                  openAuth("login");
                }}
              >
                Login / Signup
              </button>
            </li>

          </ul>
        </nav>


        {/* HEADER ACTIONS */}
        <div className="header-actions">

          {/* CALL */}
          <a
            href="tel:+918657427432"
            className="header-call-btn"
            aria-label="Call Mithora Kitchen"
          >
            <svg viewBox="0 0 256 256" aria-hidden="true">
              <path
                fill="currentColor"
                d="M222.37,158.46l-47.11-21.11-.13-.06a16,16,0,0,0-15.17,1.4,8.12,8.12,0,0,0-.75.56L143.16,155.3c-15.42-8.8-31.31-24.69-40.11-40.11l16.05-16.05a8.12,8.12,0,0,0,.56-.75,16,16,0,0,0,1.4-15.17l-.06-.13L99.94,35.93A16,16,0,0,0,81.74,25.66L38.15,31.21A16,16,0,0,0,24,47.11c0,101,81,182,182,182a16,16,0,0,0,15.9-14.15l5.55-43.59A16,16,0,0,0,222.37,158.46Z"
              />
            </svg>

            <span>Call</span>
          </a>


          {/* WHATSAPP */}
          <a
            href="https://wa.me/918657427432?text=Hello%20Mithora%20Kitchen,%20I%20would%20like%20to%20know%20more%20about%20your%20food."
            className="header-whatsapp-btn"
            target="_blank"
            rel="noopener noreferrer"
            aria-label="WhatsApp Mithora Kitchen"
          >
            <svg viewBox="0 0 256 256" aria-hidden="true">
              <path
                fill="currentColor"
                d="M187.58,144.84l-32-16a8,8,0,0,0-8,0l-14.3,9.54a46.75,46.75,0,0,1-21-21l9.54-14.3a8,8,0,0,0,0-8l-16-32A8,8,0,0,0,88.22,79,88.1,88.1,0,0,0,177,167.78a8,8,0,0,0,7.66-7.56l-.16-11.42A8,8,0,0,0,187.58,144.84ZM128,24a104,104,0,0,0-91.82,152.88l-11.35,34.05a16,16,0,0,0,20.24,20.24l34.05-11.35A104,104,0,1,0,128,24Zm0,192a87.87,87.87,0,0,1-44.06-11.81,8,8,0,0,0-6.74-.69l-34.51,11.5,11.5-34.51a8,8,0,0,0-.69-6.74A88,88,0,1,1,128,216Z"
              />
            </svg>
          </a>


          {/* LOGIN */}
          <button
            type="button"
            className="login-btn"
            aria-label="Login / Signup"
            onClick={() => openAuth("login")}
          >
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
              <circle cx="12" cy="7" r="4" />
            </svg>
          </button>


          {/* MOBILE MENU */}
          <button
            type="button"
            className={`mobile-menu-toggle ${
              menuOpen ? "active" : ""
            }`}
            onClick={() => setMenuOpen(!menuOpen)}
            aria-label="Toggle navigation"
            aria-expanded={menuOpen}
          >
            <span />
            <span />
            <span />
          </button>

        </div>
      </div>
    </header>
  );
}