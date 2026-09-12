"use client";

import { useEffect, useState } from "react";

import {
  signup,
  login,
  requestPinResetOTP,
  resetPin,
  saveAuth,
  logout,
  getCurrentUser,
  type User,
} from "@/lib/auth";

type AuthMode =
  | "login"
  | "signup"
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
  initialMode = "login",
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

  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");

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
  // LOAD CURRENT USER / INITIAL MODE
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

  const goToLogin = () => {
    changeMode("login");
  };

  // ========================================
  // RESET FORM
  // ========================================

  const resetForms = () => {
    setName("");
    setEmail("");
    setPhone("");
    setIdentifier("");
    setPassword("");
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
  // LOGIN
  // ========================================

  const handleLogin = async (
    event: React.FormEvent<HTMLFormElement>
  ) => {
    event.preventDefault();

    setError("");
    setMessage("");

    if (!identifier.trim()) {
      setError("Please enter your mobile number or email.");
      return;
    }

    if (!password) {
      setError("Please enter your PIN or password.");
      return;
    }

    try {
      setLoading(true);

      const result = await login({
        identifier,
        password,
      });

      if (!result.token) {
        throw new Error(
          result.error ||
            "Login was successful but no authentication token was received."
        );
      }

      // Save JWT + user
      saveAuth(result.token, result.user);

      // Refresh local user state
      const user = getCurrentUser();

      setCurrentUser(user);

      // Notify global AuthProvider
      if (user) {
        onAuthenticated?.(user);
      }

      setMessage(
        result.message || "Login successful."
      );

      // Give UI a moment to show success
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
  // SIGNUP
  // ========================================

  const handleSignup = async (
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

    if (!phone.trim()) {
      setError("Please enter your mobile number.");
      return;
    }

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

      const result = await signup({
        name,
        email,
        phone,
        pin,
      });

      if (!result.token) {
        throw new Error(
          result.error ||
            "Account was created but no authentication token was received."
        );
      }

      // Save JWT + user
      saveAuth(result.token, result.user);

      // Refresh current user
      const user = getCurrentUser();

      setCurrentUser(user);

      // Notify global AuthProvider
      if (user) {
        onAuthenticated?.(user);
      }

      setMessage(
        result.message ||
          "Account created successfully."
      );

      // Close after successful signup
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

      const result =
        await requestPinResetOTP(email);

      /*
       * The Worker intentionally returns a generic
       * success message even if the email isn't registered.
       *
       * This prevents email/account enumeration.
       */

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
  // VERIFY OTP
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

    /*
     * The Worker verifies the OTP together with
     * the new PIN during the reset-pin request.
     */
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

      // Clear reset information
      setOtp("");
      setPin("");
      setConfirmPin("");

      // Go back to login
      setTimeout(() => {
        setMode("login");

        setMessage(
          "PIN reset successful. Please login with your new PIN."
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

    setCurrentUser(null);

    resetForms();

    setMode("login");

    // Notify global AuthProvider
    onLoggedOut?.();
  };

  // ========================================
  // TITLES
  // ========================================

  const getTitle = () => {
    switch (mode) {
      case "login":
        return "Welcome Back";

      case "signup":
        return "Create Your Account";

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

  const getSubtitle = () => {
    switch (mode) {
      case "login":
        return "Login to continue with Mithora Kitchen";

      case "signup":
        return "Create your Mithora Kitchen account";

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

        {/* CLOSE */}

        <button
          type="button"
          className="auth-modal-close"
          onClick={handleClose}
          disabled={loading}
          aria-label="Close"
        >
          ×
        </button>

        {/* BRAND */}

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

        {/* LOGGED-IN USER */}

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
            {/* HEADING */}

            <div className="auth-modal-heading">

              <h2 id="auth-modal-title">
                {getTitle()}
              </h2>

              <p>
                {getSubtitle()}
              </p>

            </div>

            {/* ERROR */}

            {error && (
              <div
                className="auth-message auth-message-error"
                role="alert"
              >
                {error}
              </div>
            )}

            {/* SUCCESS */}

            {message && (
              <div
                className="auth-message auth-message-success"
                role="status"
              >
                {message}
              </div>
            )}

            {/* =================================
                LOGIN
            ================================= */}

            {mode === "login" && (
              <form
                onSubmit={handleLogin}
                className="auth-form"
              >

                <div className="auth-field">

                  <label htmlFor="login-identifier">
                    Mobile or Email
                  </label>

                  <input
                    id="login-identifier"
                    type="text"
                    placeholder="Enter mobile or email"
                    value={identifier}
                    onChange={(e) =>
                      setIdentifier(e.target.value)
                    }
                    autoComplete="username"
                    disabled={loading}
                    required
                  />

                </div>

                <div className="auth-field">

                  <label htmlFor="login-password">
                    PIN / Password
                  </label>

                  <input
                    id="login-password"
                    type="password"
                    placeholder="Enter your PIN or password"
                    value={password}
                    onChange={(e) =>
                      setPassword(e.target.value)
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

                  <span className="auth-link-divider">
                    |
                  </span>

                  <button
                    type="button"
                    className="auth-link-button"
                    onClick={() =>
                      changeMode("signup")
                    }
                    disabled={loading}
                  >
                    Create Account
                  </button>

                </div>

              </form>
            )}

            {/* =================================
                SIGNUP
            ================================= */}

            {mode === "signup" && (
              <form
                onSubmit={handleSignup}
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
                    inputMode="numeric"
                    placeholder="Enter mobile number"
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

                <div className="auth-bottom-text">

                  Already have an account?{" "}

                  <button
                    type="button"
                    className="auth-link-button"
                    onClick={goToLogin}
                    disabled={loading}
                  >
                    Login
                  </button>

                </div>

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
                  Enter the email address you used
                  when creating your Mithora Kitchen
                  account.
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
                  onClick={goToLogin}
                  disabled={loading}
                >
                  ← Back to Login
                </button>

              </form>
            )}

            {/* =================================
                VERIFY OTP
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

                <div className="auth-bottom-text">

                  Didn't receive the OTP?{" "}

                  <button
                    type="button"
                    className="auth-link-button"
                    onClick={() =>
                      changeMode("forgot-pin")
                    }
                    disabled={loading}
                  >
                    Send Again
                  </button>

                </div>

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
                  onClick={goToLogin}
                  disabled={loading}
                >
                  ← Back to Login
                </button>

              </form>
            )}

          </>
        )}

        {/* FOOTER */}

        <div className="auth-modal-footer">
          <span>
            Homemade food, made with care.
          </span>
        </div>

      </div>
    </div>
  );
}