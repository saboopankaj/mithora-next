"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/components/auth/AuthContext";

const API_URL = "/api";

type OrderItem = {
  name?: string;
  qty?: number;
  price?: number;
  product_id?: number | string;
  variant_id?: number | string;
};

type Order = {
  id: number | string;
  order_no: string;
  payment_status?: string;
  amount_total?: number;
  items?: OrderItem[];
  cart_snapshot?: string;
  status?: string;
};

type Review = {
  order_id: number | string;
  product_id: number | string;
  rating: number;
  review_title?: string;
};

type Coupon = {
  id?: number;
  code: string;
  discount_type?: string;
  discount_value?: number;
  min_order_amount?: number;
  min_order?: number;
  user_specific?: number;
  allowed_user_ids?: string;
  is_active?: number;
};

type Address = {
  id?: number;
  name?: string;
  house?: string;
  street?: string;
  city?: string;
};

type TimelineItem = {
  status: string;
  created_at: string;
};

export default function AccountPage() {
  const { user, isAuthenticated, logout } = useAuth();

  const [mounted, setMounted] = useState(false);
  const [activeTab, setActiveTab] = useState("orders");

  const [orders, setOrders] = useState<Order[]>([]);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [referralCode, setReferralCode] = useState("");

  const [loadingOrders, setLoadingOrders] = useState(true);
  const [loadingCoupons, setLoadingCoupons] = useState(false);
  const [loadingAddresses, setLoadingAddresses] = useState(false);

  const [trackingOrder, setTrackingOrder] = useState<string | null>(null);
  const [timeline, setTimeline] = useState<TimelineItem[]>([]);

  const [reviewOpen, setReviewOpen] = useState(false);

  const [reviewData, setReviewData] = useState<{
    orderId: string | number;
    productId: string | number;
    variantId: string | number;
    productName: string;
    rating: number;
    review: string;
  } | null>(null);

  const token =
    typeof window !== "undefined"
      ? localStorage.getItem("m_token")
      : null;

  /* =========================================================
     MOUNT
     ========================================================= */

  useEffect(() => {
    setMounted(true);
  }, []);

  /* =========================================================
     AUTH
     ========================================================= */

  useEffect(() => {
    if (!mounted) return;

    if (!isAuthenticated || !token) {
      window.location.href = "/";
      return;
    }

    loadOrders();
    loadProfile();
  }, [mounted, isAuthenticated]);

  /* =========================================================
     PROFILE
     ========================================================= */

  async function loadProfile() {
    try {
      const res = await fetch(`${API_URL}/user/profile`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await res.json();

      if (data.ok && data.user) {
        setReferralCode(data.user.referral_code || "");

        localStorage.setItem(
          "m_user",
          JSON.stringify(data.user)
        );
      }
    } catch (error) {
      console.error("Profile loading failed", error);
    }
  }

  /* =========================================================
     ORDERS
     ========================================================= */

  async function loadOrders() {
    setLoadingOrders(true);

    try {
      const [ordersRes, reviewsRes] = await Promise.all([
        fetch(`${API_URL}/orders`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }),

        fetch(
          `${API_URL}/menu/reviews/user?user_id=${user?.id}`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        ),
      ]);

      const ordersData = await ordersRes.json();
      const reviewsData = await reviewsRes.json();

      setOrders(ordersData.orders || []);
      setReviews(reviewsData.reviews || []);
    } catch (error) {
      console.error("Orders loading failed", error);
    } finally {
      setLoadingOrders(false);
    }
  }

  /* =========================================================
     COUPONS
     ========================================================= */

  async function loadCoupons() {
    setLoadingCoupons(true);

    try {
      const res = await fetch(`${API_URL}/coupons`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await res.json();

      const filtered = (data || []).filter(
        (coupon: Coupon) => {
          if (coupon.is_active === 0) {
            return false;
          }

          if (coupon.user_specific === 1) {
            try {
              const ids = JSON.parse(
                coupon.allowed_user_ids || "[]"
              );

              return ids.includes(user?.id);
            } catch {
              return false;
            }
          }

          return true;
        }
      );

      setCoupons(filtered);
    } catch (error) {
      console.error("Coupons loading failed", error);
    } finally {
      setLoadingCoupons(false);
    }
  }

  /* =========================================================
     ADDRESSES
     ========================================================= */

  async function loadAddresses() {
    setLoadingAddresses(true);

    try {
      const res = await fetch(
        `${API_URL}/user/addresses`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const data = await res.json();

      setAddresses(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error(
        "Address loading failed",
        error
      );
    } finally {
      setLoadingAddresses(false);
    }
  }

  /* =========================================================
     TAB
     ========================================================= */

  async function handleTab(tab: string) {
    setActiveTab(tab);

    if (
      tab === "coupons" &&
      coupons.length === 0
    ) {
      await loadCoupons();
    }

    if (
      tab === "addresses" &&
      addresses.length === 0
    ) {
      await loadAddresses();
    }
  }

  /* =========================================================
     TRACK ORDER
     ========================================================= */

  async function trackOrder(orderNo: string) {
    if (trackingOrder === orderNo) {
      setTrackingOrder(null);
      return;
    }

    setTrackingOrder(orderNo);
    setTimeline([]);

    try {
      const res = await fetch(
        `${API_URL}/orders/order-no/${orderNo}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const data = await res.json();

      setTimeline(
        data.order?.timeline || []
      );
    } catch (error) {
      console.error(
        "Tracking failed",
        error
      );
    }
  }

  /* =========================================================
     REVIEW
     ========================================================= */

  function openReview(
    order: Order,
    item: OrderItem
  ) {
    const existingReview = reviews.find(
      (review) =>
        review.order_id == order.id &&
        review.product_id ==
          (item.product_id || 1)
    );

    setReviewData({
      orderId: order.id,
      productId: item.product_id || 1,
      variantId: item.variant_id || 1,
      productName:
        item.name || "Food item",
      rating:
        existingReview?.rating || 0,
      review:
        existingReview?.review_title || "",
    });

    setReviewOpen(true);
  }

  async function submitReview() {
    if (
      !reviewData ||
      !reviewData.rating
    ) {
      alert("Please select a rating.");
      return;
    }

    try {
      const res = await fetch(
        `${API_URL}/menu/reviews`,
        {
          method: "POST",

          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type":
              "application/json",
          },

          body: JSON.stringify({
            user_id: user?.id,
            order_id:
              reviewData.orderId,
            product_id:
              reviewData.productId,
            variant_id:
              reviewData.variantId,
            rating:
              reviewData.rating,
            review_title:
              reviewData.review,
          }),
        }
      );

      const data = await res.json();

      if (data.ok) {
        setReviewOpen(false);
        setReviewData(null);

        await loadOrders();

        alert(
          "Thank you! Your review has been saved."
        );
      } else {
        alert(
          data.error ||
            "Unable to save review."
        );
      }
    } catch {
      alert(
        "Something went wrong while saving your review."
      );
    }
  }

  /* =========================================================
     HELPERS
     ========================================================= */

  function copyText(
    text: string,
    message: string
  ) {
    navigator.clipboard
      .writeText(text)
      .then(() => alert(message));
  }

  function handleLogout() {
    logout();
    window.location.href = "/";
  }

  function formatDate(
    dateString?: string
  ) {
    if (!dateString) return "";

    try {
      const date = new Date(
        dateString.replace(
          " ",
          "T"
        ) + "Z"
      );

      return date.toLocaleString(
        "en-IN",
        {
          timeZone:
            "Asia/Kolkata",

          day: "2-digit",
          month: "short",
          year: "numeric",

          hour: "2-digit",
          minute: "2-digit",

          hour12: true,
        }
      );
    } catch {
      return dateString;
    }
  }

  function getItems(
    order: Order
  ): OrderItem[] {
    if (order.items?.length) {
      return order.items;
    }

    try {
      return JSON.parse(
        order.cart_snapshot || "[]"
      );
    } catch {
      return [];
    }
  }

  function isDelivered(
    order: Order
  ) {
    const value =
      `${order.status || ""} ${
        order.payment_status || ""
      }`.toLowerCase();

    return (
      value.includes("deliver") ||
      value.includes("completed")
    );
  }

  function hasReview(
    orderId: string | number,
    productId: string | number
  ) {
    return reviews.some(
      (review) =>
        review.order_id == orderId &&
        review.product_id == productId
    );
  }

  /* =========================================================
     PREVENT HYDRATION MISMATCH
     ========================================================= */

  if (!mounted || !isAuthenticated) {
    return null;
  }

  /* =========================================================
     UI
     ========================================================= */

  return (
    <>
      <main className="account-page">

        {/* ===================================================
            ACCOUNT HERO
        =================================================== */}

        <section className="account-hero">

          <div className="account-hero-inner">

            <div className="account-avatar">
              {(user?.name || "U")
                .charAt(0)
                .toUpperCase()}
            </div>

            <div>

              <div className="account-eyebrow">
                MITHORA ACCOUNT
              </div>

              <h1>
                Hey, Welcome{" "}
                {user?.name || "there"} 👋
              </h1>

              <p>
                Manage your orders,
                rewards and account
              </p>

            </div>

          </div>

        </section>


        {/* ===================================================
            ACCOUNT APP
        =================================================== */}

        <section className="account-shell">

          {/* =================================================
              NAVIGATION
          ================================================= */}

          <aside className="account-sidebar">

            <button
              className={
                activeTab === "orders"
                  ? "account-nav active"
                  : "account-nav"
              }
              onClick={() =>
                handleTab("orders")
              }
            >

              <span>📦</span>

              <div>
                <strong>
                  My Orders
                </strong>

                <small>
                  Track & review
                </small>
              </div>

            </button>


            <button
              className={
                activeTab === "account"
                  ? "account-nav active"
                  : "account-nav"
              }
              onClick={() =>
                handleTab("account")
              }
            >

              <span>👤</span>

              <div>
                <strong>
                  Manage Account
                </strong>

                <small>
                  Your information
                </small>
              </div>

            </button>


            <button
              className={
                activeTab === "coupons"
                  ? "account-nav active"
                  : "account-nav"
              }
              onClick={() =>
                handleTab("coupons")
              }
            >

              <span>🎟️</span>

              <div>
                <strong>
                  My Coupons
                </strong>

                <small>
                  Your savings
                </small>
              </div>

            </button>


            <button
              className={
                activeTab === "referral"
                  ? "account-nav active"
                  : "account-nav"
              }
              onClick={() =>
                handleTab("referral")
              }
            >

              <span>🎁</span>

              <div>
                <strong>
                  Refer & Earn
                </strong>

                <small>
                  Invite friends
                </small>
              </div>

            </button>


            <button
              className={
                activeTab === "addresses"
                  ? "account-nav active"
                  : "account-nav"
              }
              onClick={() =>
                handleTab("addresses")
              }
            >

              <span>📍</span>

              <div>
                <strong>
                  Saved Addresses
                </strong>

                <small>
                  Delivery locations
                </small>
              </div>

            </button>


            <div className="account-nav-divider" />


            <button
              className="account-nav logout-nav"
              onClick={handleLogout}
            >

              <span>↪</span>

              <div>
                <strong>
                  Logout
                </strong>

                <small>
                  Sign out of account
                </small>
              </div>

            </button>

          </aside>


          {/* =================================================
              CONTENT
          ================================================= */}

          <div className="account-content">

            {/* =================================================
                ORDERS
            ================================================= */}

            {activeTab === "orders" && (
              <section className="account-section">

                <div className="section-heading">

                  <div>

                    <span>
                      YOUR ORDERS
                    </span>

                    <h2>
                      Order History
                    </h2>

                  </div>

                  <div className="order-count">
                    {orders.length}

                    <small>
                      orders
                    </small>
                  </div>

                </div>


                {loadingOrders ? (

                  <div className="account-loading">

                    <div className="loading-spinner" />

                    <p>
                      Loading your orders...
                    </p>

                  </div>

                ) : orders.length === 0 ? (

                  <div className="empty-state">

                    <div className="empty-icon">
                      🍱
                    </div>

                    <h3>
                      No orders yet
                    </h3>

                    <p>
                      Your delicious
                      Mithora journey
                      starts here.
                    </p>

                    <a href="/menu">
                      Explore Menu →
                    </a>

                  </div>

                ) : (

                  <div className="orders-list">

                    {orders.map(
                      (order) => {

                        const items =
                          getItems(order);

                        const delivered =
                          isDelivered(order);

                        return (
                          <article
                            className="order-card-modern"
                            key={order.id}
                          >

                            {/* ORDER HEADER */}

                            <div className="order-top">

                              <div>

                                <span className="order-label">
                                  ORDER
                                </span>

                                <strong>
                                  #{order.order_no}
                                </strong>

                              </div>

                              <span
                                className={
                                  delivered
                                    ? "order-status delivered"
                                    : "order-status active"
                                }
                              >
                                {delivered
                                  ? "✓ Delivered"
                                  : order.payment_status ||
                                    "Processing"}
                              </span>

                            </div>


                            {/* ITEMS */}

                            <div className="order-items-modern">

                              {items.map(
                                (
                                  item,
                                  index
                                ) => (

                                  <div
                                    className="order-item-modern"
                                    key={index}
                                  >

                                    <div className="item-info">

                                      <strong>
                                        {item.name ||
                                          "Food item"}
                                      </strong>

                                      <span>
                                        Qty{" "}
                                        {item.qty ||
                                          1}
                                      </span>

                                    </div>

                                    <div className="item-price">
                                      ₹
                                      {(
                                        Number(
                                          item.price ||
                                            0
                                        ) *
                                        Number(
                                          item.qty ||
                                            1
                                        )
                                      ).toFixed(0)}
                                    </div>

                                  </div>

                                )
                              )}

                            </div>


                            {/* TOTAL */}

                            <div className="order-total-row">

                              <div>

                                <span>
                                  Total paid
                                </span>

                                <strong>
                                  ₹
                                  {Number(
                                    order.amount_total ||
                                      0
                                  ).toFixed(0)}
                                </strong>

                              </div>

                              {delivered && (
                                <span className="delivered-label">
                                  Delivered
                                </span>
                              )}

                            </div>


                            {/* ACTIONS */}

                            <div className="order-actions">

                              <button
                                className="track-button"
                                onClick={() =>
                                  trackOrder(
                                    order.order_no
                                  )
                                }
                              >
                                {trackingOrder ===
                                order.order_no
                                  ? "Hide Tracking"
                                  : "Track Order →"}
                              </button>


                              {delivered &&
                                items.length >
                                  0 && (

                                  <button
                                    className="review-button"
                                    onClick={() =>
                                      openReview(
                                        order,
                                        items[0]
                                      )
                                    }
                                  >
                                    ★{" "}
                                    {hasReview(
                                      order.id,
                                      items[0]
                                        .product_id ||
                                        1
                                    )
                                      ? "Edit Review"
                                      : "Rate Order"}
                                  </button>

                                )}

                            </div>


                            {/* TRACKING */}

                            {trackingOrder ===
                              order.order_no && (

                              <div className="tracking-panel">

                                <div className="tracking-title">

                                  <span>
                                    LIVE ORDER STATUS
                                  </span>

                                  <strong>
                                    Order #
                                    {
                                      order.order_no
                                    }
                                  </strong>

                                </div>


                                {timeline.length ===
                                0 ? (

                                  <div className="tracking-loading">
                                    Fetching latest
                                    updates...
                                  </div>

                                ) : (

                                  <div className="timeline">

                                    {timeline.map(
                                      (
                                        step,
                                        index
                                      ) => (

                                        <div
                                          className="timeline-item"
                                          key={
                                            index
                                          }
                                        >

                                          <div className="timeline-dot">
                                            ✓
                                          </div>

                                          <div>

                                            <strong>
                                              {step.status.replace(
                                                /_/g,
                                                " "
                                              )}
                                            </strong>

                                            <span>
                                              {formatDate(
                                                step.created_at
                                              )}
                                            </span>

                                          </div>

                                        </div>

                                      )
                                    )}

                                  </div>

                                )}

                              </div>

                            )}

                          </article>
                        );
                      }
                    )}

                  </div>

                )}

              </section>
            )}


            {/* =================================================
                MANAGE ACCOUNT
            ================================================= */}

            {activeTab === "account" && (
              <section className="account-section">

                <div className="section-heading">

                  <div>

                    <span>
                      YOUR DETAILS
                    </span>

                    <h2>
                      Manage Account
                    </h2>

                  </div>

                </div>


                <div className="profile-card-modern">

                  <div className="large-profile-avatar">
                    {(user?.name || "U")
                      .charAt(0)
                      .toUpperCase()}
                  </div>

                  <div>

                    <h3>
                      {user?.name ||
                        "User"}
                    </h3>

                    <p>
                      Your Mithora account
                    </p>

                  </div>

                </div>


                <div className="details-grid">

                  <div className="detail-card">

                    <span>
                      Name
                    </span>

                    <strong>
                      {user?.name ||
                        "Not available"}
                    </strong>

                  </div>


                  <div className="detail-card">

                    <span>
                      Email
                    </span>

                    <strong>
                      {user?.email ||
                        "Not available"}
                    </strong>

                  </div>


                  <div className="detail-card">

                    <span>
                      Mobile Number
                    </span>

                    <strong>
                      {user?.phone ||
                        "Not available"}
                    </strong>

                  </div>


                  <div className="detail-card">

                    <span>
                      Referral Code
                    </span>

                    <strong>
                      {referralCode ||
                        "Not assigned"}
                    </strong>

                  </div>

                </div>


                <div className="coming-soon-card">

                  <span>
                    ACCOUNT SETTINGS
                  </span>

                  <h3>
                    Profile editing coming soon
                  </h3>

                  <p>
                    Soon you'll be able to
                    update your name, email
                    and other account details
                    directly from here.
                  </p>

                </div>

              </section>
            )}


            {/* =================================================
                COUPONS
            ================================================= */}

            {activeTab === "coupons" && (
              <section className="account-section">

                <div className="section-heading">

                  <div>

                    <span>
                      YOUR REWARDS
                    </span>

                    <h2>
                      My Coupons
                    </h2>

                  </div>

                </div>


                {loadingCoupons ? (

                  <div className="account-loading">

                    <div className="loading-spinner" />

                    <p>
                      Finding your rewards...
                    </p>

                  </div>

                ) : coupons.length === 0 ? (

                  <div className="empty-state compact">

                    <div className="empty-icon">
                      🎟️
                    </div>

                    <h3>
                      No active coupons
                    </h3>

                    <p>
                      New rewards and
                      offers will appear
                      here.
                    </p>

                  </div>

                ) : (

                  <div className="coupon-list">

                    {coupons.map(
                      (
                        coupon,
                        index
                      ) => {

                        const discount =
                          coupon.discount_type ===
                          "percent"
                            ? `${coupon.discount_value}% OFF`
                            : `₹${coupon.discount_value} OFF`;

                        const minimum =
                          coupon.min_order_amount ??
                          coupon.min_order ??
                          0;

                        return (
                          <div
                            className="coupon-card"
                            key={
                              coupon.id ||
                              index
                            }
                          >

                            <div className="coupon-main">

                              <span className="coupon-tag">
                                {coupon.user_specific
                                  ? "EXCLUSIVE"
                                  : "MITHORA REWARD"}
                              </span>

                              <strong>
                                {coupon.code}
                              </strong>

                              <span>
                                {discount}
                              </span>

                              <small>
                                Minimum order ₹
                                {minimum}
                              </small>

                            </div>

                            <button
                              onClick={() =>
                                copyText(
                                  coupon.code,
                                  "Coupon code copied!"
                                )
                              }
                            >
                              Copy
                            </button>

                          </div>
                        );
                      }
                    )}

                  </div>

                )}

              </section>
            )}


            {/* =================================================
                REFER & EARN
            ================================================= */}

            {activeTab === "referral" && (
              <section className="account-section">

                <div className="section-heading">

                  <div>

                    <span>
                      SHARE THE LOVE
                    </span>

                    <h2>
                      Refer & Earn
                    </h2>

                  </div>

                </div>


                <div className="referral-hero-card">

                  <div className="referral-icon">
                    🎁
                  </div>

                  <span>
                    INVITE FRIENDS
                  </span>

                  <h3>
                    Give ₹250. Get ₹500.
                  </h3>

                  <p>
                    Share your Mithora
                    referral code with
                    friends. They get a
                    welcome reward and
                    you earn a referral
                    reward.
                  </p>


                  <div className="referral-code-box">

                    <span>
                      {referralCode ||
                        "REFERRAL CODE UNAVAILABLE"}
                    </span>

                    {referralCode && (
                      <button
                        onClick={() =>
                          copyText(
                            referralCode,
                            "Referral code copied!"
                          )
                        }
                      >
                        Copy
                      </button>
                    )}

                  </div>

                </div>

              </section>
            )}


            {/* =================================================
                ADDRESSES
            ================================================= */}

            {activeTab === "addresses" && (
              <section className="account-section">

                <div className="section-heading">

                  <div>

                    <span>
                      DELIVERY
                    </span>

                    <h2>
                      Saved Addresses
                    </h2>

                  </div>

                </div>


                {loadingAddresses ? (

                  <div className="account-loading">

                    <div className="loading-spinner" />

                    <p>
                      Loading addresses...
                    </p>

                  </div>

                ) : addresses.length === 0 ? (

                  <div className="empty-state compact">

                    <div className="empty-icon">
                      📍
                    </div>

                    <h3>
                      No saved addresses
                    </h3>

                    <p>
                      Your saved delivery
                      addresses will appear
                      here.
                    </p>

                  </div>

                ) : (

                  <div className="address-list">

                    {addresses.map(
                      (
                        address,
                        index
                      ) => (

                        <div
                          className="address-card"
                          key={
                            address.id ||
                            index
                          }
                        >

                          <div className="address-icon">
                            📍
                          </div>

                          <div>

                            <strong>
                              {address.name ||
                                "Delivery Address"}
                            </strong>

                            <p>
                              {address.house},{" "}
                              {address.street},{" "}
                              {address.city}
                            </p>

                          </div>

                        </div>

                      )
                    )}

                  </div>

                )}

              </section>
            )}

          </div>

        </section>


        {/* =====================================================
            SUPPORT
        ===================================================== */}

        <section className="account-support">

          <div>

            <strong>
              Need help with your order?
            </strong>

            <span>
              We're just a message away.
            </span>

          </div>

          <div className="support-actions">

            <a
              href="https://wa.me/918657427432"
              target="_blank"
              rel="noopener noreferrer"
            >
              WhatsApp
            </a>

            <a href="mailto:orders@mithora.in">
              Email
            </a>

          </div>

        </section>

      </main>


      {/* =======================================================
          REVIEW MODAL
      ======================================================= */}

      {reviewOpen &&
        reviewData && (

          <div
            className="review-overlay"
            onClick={() =>
              setReviewOpen(false)
            }
          >

            <div
              className="review-modal"
              onClick={(event) =>
                event.stopPropagation()
              }
            >

              <button
                className="review-close"
                onClick={() =>
                  setReviewOpen(false)
                }
              >
                ×
              </button>

              <span className="review-eyebrow">
                YOUR FEEDBACK MATTERS
              </span>

              <h2>
                How was your food?
              </h2>

              <p className="review-product">
                {reviewData.productName}
              </p>


              <div className="rating-stars-modern">

                {[1, 2, 3, 4, 5].map(
                  (rating) => (

                    <button
                      key={rating}
                      className={
                        rating <=
                        reviewData.rating
                          ? "selected"
                          : ""
                      }
                      onClick={() =>
                        setReviewData({
                          ...reviewData,
                          rating,
                        })
                      }
                    >
                      ★
                    </button>

                  )
                )}

              </div>


              <textarea
                value={
                  reviewData.review
                }
                onChange={(event) =>
                  setReviewData({
                    ...reviewData,
                    review:
                      event.target.value,
                  })
                }
                placeholder="Tell us about your experience (optional)"
              />


              <button
                className="submit-review-button"
                onClick={
                  submitReview
                }
              >
                Submit Review
              </button>

            </div>

          </div>

        )}

    </>
  );
}