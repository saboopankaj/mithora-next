"use client";

import { useEffect, useState } from "react";

import {
  checkMobile,
  login,
  requestSignupOTP,
  verifySignupOTP,
  completeSignup,
  requestPinResetOTP,
  resetPin,
  saveAuth,
  logout,
  getCurrentUser,
  type User,
} from "@/lib/auth";

type AuthMode =
  | "mobile"
  | "login-pin"
  | "signup"
  | "signup-verify"
  | "signup-pin"
  | "forgot-pin"
  | "verify-otp"
  | "reset-pin";

type AuthModalProps = {
  open: boolean;
  onClose: () => void;
  initialMode?: AuthMode;
  onAuthenticated?: (user: User) => void;
  onLoggedOut?: () => void;
};

export default function AuthModal({
  open,
  onClose,
  initialMode = "mobile",
  onAuthenticated,
  onLoggedOut,
}: AuthModalProps) {
  const [mode, setMode] = useState<AuthMode>(initialMode);

  // ========================================
  // FORM STATE
  // ========================================

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [referralCode, setReferralCode] = useState("");

  const [pin, setPin] = useState("");
  const [confirmPin, setConfirmPin] = useState("");

  const [otp, setOtp] = useState("");

  // ========================================
  // UI STATE
  // ========================================

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const [currentUser, setCurrentUser] = useState<User | null>(null);

  // ========================================
  // LOAD CURRENT USER
  // ========================================

  useEffect(() => {
    if (!open) return;

    const user = getCurrentUser();

    setCurrentUser(user);
    setMode(initialMode);
    setError("");
    setMessage("");
    setLoading(false);
  }, [open, initialMode]);

  // ========================================
  // BODY SCROLL LOCK
  // ========================================

  useEffect(() => {
    if (!open) return;

    const originalOverflow = document.body.style.overflow;

    document.body.style.overflow = "hidden";

    return () => {
      document.body.style.overflow = originalOverflow;
    };
  }, [open]);

  // ========================================
  // MODE CHANGE
  // ========================================

  const changeMode = (newMode: AuthMode) => {
    setMode(newMode);
    setError("");
    setMessage("");
  };

  // ========================================
  // RESET FORMS
  // ========================================

  const resetForms = () => {
    setName("");
    setEmail("");
    setPhone("");
    setReferralCode("");
    setPin("");
    setConfirmPin("");
    setOtp("");

    setError("");
    setMessage("");
  };

  // ========================================
  // CLOSE
  // ========================================

  const handleClose = () => {
    if (loading) return;

    resetForms();
    onClose();
  };

  // ========================================
  // OVERLAY CLICK
  // ========================================

  const handleOverlayClick = (
    event: React.MouseEvent<HTMLDivElement>
  ) => {
    if (event.target === event.currentTarget) {
      handleClose();
    }
  };

  // ========================================
  // MOBILE CHECK
  // ========================================

  const handleMobileSubmit = async (
    event: React.FormEvent<HTMLFormElement>
  ) => {
    event.preventDefault();

    setError("");
    setMessage("");

    const cleanPhone = phone.replace(/\D/g, "");

    if (!/^\d{10}$/.test(cleanPhone)) {
      setError("Please enter a valid 10-digit mobile number.");
      return;
    }

    try {
      setLoading(true);

      const result = await checkMobile(cleanPhone);

      if (result.exists) {
        setPhone(cleanPhone);
        setMode("login-pin");
        setMessage("Welcome back! Please enter your PIN.");
      } else {
        setPhone(cleanPhone);
        setMode("signup");
        setMessage("Let's create your Mithora Kitchen account.");
      }
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Unable to check mobile number. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  // ========================================
  // LOGIN
  // ========================================

  const handleLogin = async (
    event: React.FormEvent<HTMLFormElement>
  ) => {
    event.preventDefault();

    setError("");
    setMessage("");

    if (!/^\d{4}$/.test(pin)) {
      setError("PIN must be exactly 4 digits.");
      return;
    }

    try {
      setLoading(true);

      const result = await login({
        identifier: phone,
        password: pin,
      });

      if (!result.token) {
        throw new Error(
          result.error ||
            "Login was successful but no authentication token was received."
        );
      }

      saveAuth(result.token, result.user);

      if (result.user) {
        onAuthenticated?.(result.user);
      }

      const user = getCurrentUser();

      setCurrentUser(user);

      setMessage(result.message || "Login successful.");

      setTimeout(() => {
        onClose();
      }, 500);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Unable to login. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  // ========================================
  // REQUEST SIGNUP OTP
  // ========================================

  const handleSignupRequestOtp = async (
    event: React.FormEvent<HTMLFormElement>
  ) => {
    event.preventDefault();

    setError("");
    setMessage("");

    if (!name.trim()) {
      setError("Please enter your name.");
      return;
    }

    if (!email.trim()) {
      setError("Please enter your email.");
      return;
    }

    const cleanPhone = phone.replace(/\D/g, "");

    if (!/^\d{10}$/.test(cleanPhone)) {
      setError("Please enter a valid 10-digit mobile number.");
      return;
    }

    try {
      setLoading(true);

      const result = await requestSignupOTP({
        name,
        email,
        phone: cleanPhone,
        referralCode,
      });

      if (result.error) {
        throw new Error(result.error);
      }

      setPhone(cleanPhone);

      setMessage(
        result.message ||
          "A 6-digit OTP has been sent to your email."
      );

      setMode("signup-verify");
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Unable to send OTP. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  // ========================================
  // VERIFY SIGNUP OTP
  // ========================================

  const handleSignupVerifyOtp = async (
    event: React.FormEvent<HTMLFormElement>
  ) => {
    event.preventDefault();

    setError("");
    setMessage("");

    if (!/^\d{6}$/.test(otp)) {
      setError("Please enter the 6-digit OTP.");
      return;
    }

    try {
      setLoading(true);

      const result = await verifySignupOTP({
        phone,
        otp,
      });

      if (result.error) {
        throw new Error(result.error);
      }

      setMessage(
        result.message ||
          "Email verified successfully. Now create your PIN."
      );

      setMode("signup-pin");
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Unable to verify OTP. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  // ========================================
  // COMPLETE SIGNUP
  // ========================================

  const handleSignupComplete = async (
    event: React.FormEvent<HTMLFormElement>
  ) => {
    event.preventDefault();

    setError("");
    setMessage("");

    if (!/^\d{4}$/.test(pin)) {
      setError("PIN must be exactly 4 digits.");
      return;
    }

    if (pin !== confirmPin) {
      setError("PIN and confirm PIN do not match.");
      return;
    }

    try {
      setLoading(true);

      const result = await completeSignup({
        name,
        email,
        phone,
        pin,
        referralCode,
      });

      if (!result.token) {
        throw new Error(
          result.error ||
            "Account was created but no authentication token was received."
        );
      }

      saveAuth(result.token, result.user);

      if (result.user) {
        onAuthenticated?.(result.user);
      }

      const user = getCurrentUser();

      setCurrentUser(user);

      setMessage(
        result.message ||
          "Account created successfully. Welcome to Mithora Kitchen!"
      );

      setTimeout(() => {
        onClose();
      }, 700);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Unable to create account. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  // ========================================
  // REQUEST PIN RESET OTP
  // ========================================

  const handleRequestOtp = async (
    event: React.FormEvent<HTMLFormElement>
  ) => {
    event.preventDefault();

    setError("");
    setMessage("");

    if (!email.trim()) {
      setError("Please enter your registered email.");
      return;
    }

    try {
      setLoading(true);

      const result = await requestPinResetOTP(email);

      if (result.error) {
        throw new Error(result.error);
      }

      setMessage(
        result.message ||
          "If this email is registered, an OTP has been sent."
      );

      setMode("verify-otp");
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Unable to send OTP. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  // ========================================
  // VERIFY RESET OTP
  // ========================================

  const handleVerifyOtp = (
    event: React.FormEvent<HTMLFormElement>
  ) => {
    event.preventDefault();

    setError("");
    setMessage("");

    if (!/^\d{6}$/.test(otp)) {
      setError("Please enter the 6-digit OTP.");
      return;
    }

    setMode("reset-pin");
  };

  // ========================================
  // RESET PIN
  // ========================================

  const handleResetPin = async (
    event: React.FormEvent<HTMLFormElement>
  ) => {
    event.preventDefault();

    setError("");
    setMessage("");

    if (!/^\d{4}$/.test(pin)) {
      setError("PIN must be exactly 4 digits.");
      return;
    }

    if (pin !== confirmPin) {
      setError("PIN and confirm PIN do not match.");
      return;
    }

    try {
      setLoading(true);

      const result = await resetPin({
        email,
        otp,
        pin,
      });

      if (result.error) {
        throw new Error(result.error);
      }

      setMessage(
        result.message ||
          "PIN reset successful. You can now login."
      );

      setOtp("");
      setPin("");
      setConfirmPin("");

      setTimeout(() => {
        setMode("mobile");
        setMessage(
          "PIN reset successful. Please login with your mobile number."
        );
      }, 700);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Unable to reset PIN. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  // ========================================
  // LOGOUT
  // ========================================

  const handleLogout = () => {
    logout();
    onLoggedOut?.();

    setCurrentUser(null);

    resetForms();

    setMode("mobile");
  };

  // ========================================
  // BACK TO MOBILE
  // ========================================

  const goToMobile = () => {
    setPin("");
    setConfirmPin("");
    setOtp("");

    changeMode("mobile");
  };

  // ========================================
  // TITLES
  // ========================================

  const getTitle = () => {
    switch (mode) {
      case "mobile":
        return "Welcome to Mithora";

      case "login-pin":
        return "Welcome Back";

      case "signup":
        return "Create Your Account";

      case "signup-verify":
        return "Verify Your Email";

      case "signup-pin":
        return "Create Your PIN";

      case "forgot-pin":
        return "Reset Your PIN";

      case "verify-otp":
        return "Verify OTP";

      case "reset-pin":
        return "Create New PIN";

      default:
        return "Welcome";
    }
  };

  // ========================================
  // SUBTITLES
  // ========================================

  const getSubtitle = () => {
    switch (mode) {
      case "mobile":
        return "Enter your mobile number to continue";

      case "login-pin":
        return `Enter your 4-digit PIN for ${phone}`;

      case "signup":
        return "Tell us a little about yourself";

      case "signup-verify":
        return `Enter the OTP sent to ${email}`;

      case "signup-pin":
        return "Set a secure 4-digit PIN for your account";

      case "forgot-pin":
        return "We'll send a verification code to your email";

      case "verify-otp":
        return `Enter the OTP sent to ${email}`;

      case "reset-pin":
        return "Set a new 4-digit PIN for your account";

      default:
        return "";
    }
  };

  // ========================================
  // MODAL CLOSED
  // ========================================

  if (!open) {
    return null;
  }

  // ========================================
  // RENDER
  // ========================================

  return (
    <div
      className="auth-modal-overlay"
      onMouseDown={handleOverlayClick}
      role="dialog"
      aria-modal="true"
      aria-labelledby="auth-modal-title"
    >
      <div className="auth-modal">

        {/* ==================================
            CLOSE
        ================================== */}

        <button
          type="button"
          className="auth-modal-close"
          onClick={handleClose}
          disabled={loading}
          aria-label="Close"
        >
          ×
        </button>

        {/* ==================================
            BRAND
        ================================== */}

        <div className="auth-modal-brand">

          <div className="auth-modal-brand-mark">
            M
          </div>

          <div>
            <div className="auth-modal-brand-name">
              Mithora Kitchen
            </div>

            <div className="auth-modal-brand-tagline">
              Ghar Ka Swad
            </div>
          </div>

        </div>

        {/* ==================================
            LOGGED-IN USER
        ================================== */}

        {currentUser ? (
          <div className="auth-logged-in">

            <div className="auth-user-avatar">
              {currentUser.name
                ?.charAt(0)
                ?.toUpperCase() || "M"}
            </div>

            <h2>
              You're already logged in
            </h2>

            <p>
              {currentUser.name}
            </p>

            <span>
              {currentUser.email}
            </span>

            <button
              type="button"
              className="auth-primary-button"
              onClick={handleClose}
            >
              Continue
            </button>

            <button
              type="button"
              className="auth-secondary-link"
              onClick={handleLogout}
            >
              Logout
            </button>

          </div>
        ) : (
          <>

            {/* ==============================
                HEADING
            ============================== */}

            <div className="auth-modal-heading">

              <h2 id="auth-modal-title">
                {getTitle()}
              </h2>

              <p>
                {getSubtitle()}
              </p>

            </div>

            {/* ==============================
                ERROR
            ============================== */}

            {error && (
              <div
                className="auth-message auth-message-error"
                role="alert"
              >
                {error}
              </div>
            )}

            {/* ==============================
                MESSAGE
            ============================== */}

            {message && (
              <div
                className="auth-message auth-message-success"
                role="status"
              >
                {message}
              </div>
            )}

            {/* =================================
                MOBILE
            ================================= */}

            {mode === "mobile" && (
              <form
                onSubmit={handleMobileSubmit}
                className="auth-form"
              >

                <div className="auth-field">

                  <label htmlFor="auth-mobile">
                    Mobile Number
                  </label>

                  <input
                    id="auth-mobile"
                    type="tel"
                    inputMode="numeric"
                    maxLength={10}
                    placeholder="Enter 10-digit mobile number"
                    value={phone}
                    onChange={(e) =>
                      setPhone(
                        e.target.value
                          .replace(/\D/g, "")
                          .slice(0, 10)
                      )
                    }
                    autoComplete="tel"
                    disabled={loading}
                    required
                  />

                </div>

                <button
                  type="submit"
                  className="auth-primary-button"
                  disabled={loading}
                >
                  {loading
                    ? "Checking..."
                    : "Continue"}
                </button>

                <div className="auth-bottom-text">

                  Already have an account?{" "}

                  <button
                    type="button"
                    className="auth-link-button"
                    onClick={() =>
                      changeMode("forgot-pin")
                    }
                    disabled={loading}
                  >
                    Forgot PIN?
                  </button>

                </div>

              </form>
            )}

            {/* =================================
                LOGIN PIN
            ================================= */}

            {mode === "login-pin" && (
              <form
                onSubmit={handleLogin}
                className="auth-form"
              >

                <div className="auth-field">

                  <label htmlFor="login-mobile">
                    Mobile Number
                  </label>

                  <input
                    id="login-mobile"
                    type="tel"
                    value={phone}
                    disabled
                  />

                </div>

                <div className="auth-field">

                  <label htmlFor="login-pin">
                    4-Digit PIN
                  </label>

                  <input
                    id="login-pin"
                    type="password"
                    inputMode="numeric"
                    maxLength={4}
                    placeholder="••••"
                    value={pin}
                    onChange={(e) =>
                      setPin(
                        e.target.value
                          .replace(/\D/g, "")
                          .slice(0, 4)
                      )
                    }
                    autoComplete="current-password"
                    disabled={loading}
                    required
                  />

                </div>

                <button
                  type="submit"
                  className="auth-primary-button"
                  disabled={loading}
                >
                  {loading
                    ? "Logging in..."
                    : "Login"}
                </button>

                <div className="auth-links-row">

                  <button
                    type="button"
                    className="auth-link-button"
                    onClick={() =>
                      changeMode("forgot-pin")
                    }
                    disabled={loading}
                  >
                    Forgot PIN?
                  </button>

                </div>

                <button
                  type="button"
                  className="auth-secondary-link"
                  onClick={goToMobile}
                  disabled={loading}
                >
                  ← Change Mobile Number
                </button>

              </form>
            )}

            {/* =================================
                SIGNUP DETAILS
            ================================= */}

            {mode === "signup" && (
              <form
                onSubmit={handleSignupRequestOtp}
                className="auth-form"
              >

                <div className="auth-field">

                  <label htmlFor="signup-name">
                    Full Name
                  </label>

                  <input
                    id="signup-name"
                    type="text"
                    placeholder="Enter your name"
                    value={name}
                    onChange={(e) =>
                      setName(e.target.value)
                    }
                    autoComplete="name"
                    disabled={loading}
                    required
                  />

                </div>

                <div className="auth-field">

                  <label htmlFor="signup-email">
                    Email
                  </label>

                  <input
                    id="signup-email"
                    type="email"
                    placeholder="Enter your email"
                    value={email}
                    onChange={(e) =>
                      setEmail(e.target.value)
                    }
                    autoComplete="email"
                    disabled={loading}
                    required
                  />

                </div>

                <div className="auth-field">

                  <label htmlFor="signup-phone">
                    Mobile Number
                  </label>

                  <input
                    id="signup-phone"
                    type="tel"
                    value={phone}
                    disabled
                  />

                </div>

                <div className="auth-field">

                  <label htmlFor="signup-referral">
                    Referral Code
                    <span className="auth-optional">
                      {" "}Optional
                    </span>
                  </label>

                  <input
                    id="signup-referral"
                    type="text"
                    placeholder="Enter referral code"
                    value={referralCode}
                    onChange={(e) =>
                      setReferralCode(
                        e.target.value
                          .trim()
                          .toUpperCase()
                      )
                    }
                    autoComplete="off"
                    disabled={loading}
                  />

                </div>

                <button
                  type="submit"
                  className="auth-primary-button"
                  disabled={loading}
                >
                  {loading
                    ? "Sending OTP..."
                    : "Continue"}
                </button>

                <div className="auth-bottom-text">

                  Already have an account?{" "}

                  <button
                    type="button"
                    className="auth-link-button"
                    onClick={goToMobile}
                    disabled={loading}
                  >
                    Login
                  </button>

                </div>

              </form>
            )}

            {/* =================================
                SIGNUP VERIFY OTP
            ================================= */}

            {mode === "signup-verify" && (
              <form
                onSubmit={handleSignupVerifyOtp}
                className="auth-form"
              >

                <div className="auth-info-box">

                  We've sent a 6-digit OTP to:

                  <strong>
                    {email}
                  </strong>

                </div>

                <div className="auth-field">

                  <label htmlFor="signup-verify-otp">
                    6-Digit OTP
                  </label>

                  <input
                    id="signup-verify-otp"
                    type="text"
                    inputMode="numeric"
                    maxLength={6}
                    placeholder="Enter OTP"
                    value={otp}
                    onChange={(e) =>
                      setOtp(
                        e.target.value
                          .replace(/\D/g, "")
                          .slice(0, 6)
                      )
                    }
                    autoComplete="one-time-code"
                    disabled={loading}
                    required
                  />

                </div>

                <button
                  type="submit"
                  className="auth-primary-button"
                  disabled={loading}
                >
                  {loading
                    ? "Verifying..."
                    : "Verify OTP"}
                </button>

                <button
                  type="button"
                  className="auth-secondary-link"
                  onClick={() =>
                    changeMode("signup")
                  }
                  disabled={loading}
                >
                  ← Back
                </button>

              </form>
            )}

            {/* =================================
                SIGNUP PIN
            ================================= */}

            {mode === "signup-pin" && (
              <form
                onSubmit={handleSignupComplete}
                className="auth-form"
              >

                <div className="auth-info-box">

                  Email verified successfully.

                  <br />

                  Create your 4-digit PIN to finish
                  setting up your account.

                </div>

                <div className="auth-field">

                  <label htmlFor="signup-pin">
                    4-Digit PIN
                  </label>

                  <input
                    id="signup-pin"
                    type="password"
                    inputMode="numeric"
                    maxLength={4}
                    placeholder="••••"
                    value={pin}
                    onChange={(e) =>
                      setPin(
                        e.target.value
                          .replace(/\D/g, "")
                          .slice(0, 4)
                      )
                    }
                    autoComplete="new-password"
                    disabled={loading}
                    required
                  />

                </div>

                <div className="auth-field">

                  <label htmlFor="signup-confirm-pin">
                    Confirm PIN
                  </label>

                  <input
                    id="signup-confirm-pin"
                    type="password"
                    inputMode="numeric"
                    maxLength={4}
                    placeholder="••••"
                    value={confirmPin}
                    onChange={(e) =>
                      setConfirmPin(
                        e.target.value
                          .replace(/\D/g, "")
                          .slice(0, 4)
                      )
                    }
                    autoComplete="new-password"
                    disabled={loading}
                    required
                  />

                </div>

                <button
                  type="submit"
                  className="auth-primary-button"
                  disabled={loading}
                >
                  {loading
                    ? "Creating Account..."
                    : "Create Account"}
                </button>

              </form>
            )}

            {/* =================================
                FORGOT PIN
            ================================= */}

            {mode === "forgot-pin" && (
              <form
                onSubmit={handleRequestOtp}
                className="auth-form"
              >

                <div className="auth-info-box">

                  Enter the email address registered
                  with your Mithora Kitchen account.

                </div>

                <div className="auth-field">

                  <label htmlFor="forgot-email">
                    Registered Email
                  </label>

                  <input
                    id="forgot-email"
                    type="email"
                    placeholder="Enter your email"
                    value={email}
                    onChange={(e) =>
                      setEmail(e.target.value)
                    }
                    autoComplete="email"
                    disabled={loading}
                    required
                  />

                </div>

                <button
                  type="submit"
                  className="auth-primary-button"
                  disabled={loading}
                >
                  {loading
                    ? "Sending OTP..."
                    : "Send OTP"}
                </button>

                <button
                  type="button"
                  className="auth-secondary-link"
                  onClick={goToMobile}
                  disabled={loading}
                >
                  ← Back to Login
                </button>

              </form>
            )}

            {/* =================================
                VERIFY RESET OTP
            ================================= */}

            {mode === "verify-otp" && (
              <form
                onSubmit={handleVerifyOtp}
                className="auth-form"
              >

                <div className="auth-info-box">

                  We've sent a 6-digit OTP to:

                  <strong>
                    {email}
                  </strong>

                </div>

                <div className="auth-field">

                  <label htmlFor="verify-otp">
                    6-Digit OTP
                  </label>

                  <input
                    id="verify-otp"
                    type="text"
                    inputMode="numeric"
                    maxLength={6}
                    placeholder="Enter OTP"
                    value={otp}
                    onChange={(e) =>
                      setOtp(
                        e.target.value
                          .replace(/\D/g, "")
                          .slice(0, 6)
                      )
                    }
                    autoComplete="one-time-code"
                    disabled={loading}
                    required
                  />

                </div>

                <button
                  type="submit"
                  className="auth-primary-button"
                  disabled={loading}
                >
                  Verify OTP
                </button>

              </form>
            )}

            {/* =================================
                RESET PIN
            ================================= */}

            {mode === "reset-pin" && (
              <form
                onSubmit={handleResetPin}
                className="auth-form"
              >

                <div className="auth-field">

                  <label htmlFor="reset-pin">
                    New 4-Digit PIN
                  </label>

                  <input
                    id="reset-pin"
                    type="password"
                    inputMode="numeric"
                    maxLength={4}
                    placeholder="••••"
                    value={pin}
                    onChange={(e) =>
                      setPin(
                        e.target.value
                          .replace(/\D/g, "")
                          .slice(0, 4)
                      )
                    }
                    autoComplete="new-password"
                    disabled={loading}
                    required
                  />

                </div>

                <div className="auth-field">

                  <label htmlFor="reset-confirm-pin">
                    Confirm New PIN
                  </label>

                  <input
                    id="reset-confirm-pin"
                    type="password"
                    inputMode="numeric"
                    maxLength={4}
                    placeholder="••••"
                    value={confirmPin}
                    onChange={(e) =>
                      setConfirmPin(
                        e.target.value
                          .replace(/\D/g, "")
                          .slice(0, 4)
                      )
                    }
                    autoComplete="new-password"
                    disabled={loading}
                    required
                  />

                </div>

                <button
                  type="submit"
                  className="auth-primary-button"
                  disabled={loading}
                >
                  {loading
                    ? "Resetting PIN..."
                    : "Reset PIN"}
                </button>

                <button
                  type="button"
                  className="auth-secondary-link"
                  onClick={goToMobile}
                  disabled={loading}
                >
                  ← Back to Login
                </button>

              </form>
            )}

          </>
        )}

        {/* ==================================
            FOOTER
        ================================== */}

        <div className="auth-modal-footer">

          <span>
            Homemade food, made with care.
          </span>

        </div>

      </div>
    </div>
  );
}