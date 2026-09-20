"use client";

import { useEffect, useRef, useState } from "react";

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

function DigitBoxes({
  value,
  onChange,
  disabled,
  namePrefix,
  length,
  label,
  autoComplete = "off",
}: {
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
  namePrefix: string;
  length: 4 | 6;
  label: string;
  autoComplete?: string;
}) {
  const refs = useRef<Array<HTMLInputElement | null>>([]);
  const digits = value.padEnd(length, "").slice(0, length).split("");

  const focusBox = (index: number) => {
    const input = refs.current[index];
    if (input) {
      input.focus();
      input.select();
    }
  };

  const handleChange = (index: number, raw: string) => {
    const pastedDigits = raw.replace(/\D/g, "");

    if (pastedDigits.length > 1) {
      const next = pastedDigits.slice(0, length);
      onChange(next);
      focusBox(Math.min(next.length, length) - 1);
      return;
    }

    const digit = pastedDigits.slice(-1);
    const next = value.padEnd(length, "").split("");
    next[index] = digit;

    const cleaned = next.join("").slice(0, length);
    onChange(cleaned);

    if (digit && index < length - 1) {
      focusBox(index + 1);
    }
  };

  const handleKeyDown = (
    index: number,
    event: React.KeyboardEvent<HTMLInputElement>
  ) => {
    if (event.key === "Backspace" && !digits[index] && index > 0) {
      event.preventDefault();

      const next = value.padEnd(length, "").split("");
      next[index - 1] = "";
      onChange(next.join("").slice(0, length));
      focusBox(index - 1);
      return;
    }

    if (event.key === "ArrowLeft" && index > 0) {
      event.preventDefault();
      focusBox(index - 1);
      return;
    }

    if (event.key === "ArrowRight" && index < length - 1) {
      event.preventDefault();
      focusBox(index + 1);
    }
  };

  const handlePaste = (event: React.ClipboardEvent<HTMLInputElement>) => {
    const pasted = event.clipboardData
      .getData("text")
      .replace(/\D/g, "")
      .slice(0, length);

    if (!pasted) return;

    event.preventDefault();
    onChange(pasted);
    focusBox(Math.min(pasted.length, length) - 1);
  };

  return (
    <div className="auth-digit-field">
      <div
        className={`auth-digit-inputs auth-digit-inputs-${length}`}
        role="group"
        aria-label={label}
      >
        {Array.from({ length }, (_, index) => (
          <input
            key={index}
            ref={(element) => {
              refs.current[index] = element;
            }}
            id={`${namePrefix}-${index}`}
            className="auth-digit-box"
            type="password"
            inputMode="numeric"
            maxLength={1}
            value={digits[index] || ""}
            onChange={(event) => handleChange(index, event.target.value)}
            onKeyDown={(event) => handleKeyDown(index, event)}
            onPaste={handlePaste}
            autoComplete={index === 0 ? autoComplete : "off"}
            disabled={disabled}
            aria-label={`${label} digit ${index + 1}`}
            required
          />
        ))}
      </div>
    </div>
  );
}

export default function AuthModal({
  open,
  onClose,
  initialMode = "mobile",
  onAuthenticated,
  onLoggedOut,
}: AuthModalProps) {
  const [mode, setMode] = useState<AuthMode>(initialMode);

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [referralCode, setReferralCode] = useState("");

  const [pin, setPin] = useState("");
  const [confirmPin, setConfirmPin] = useState("");
  const [otp, setOtp] = useState("");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const modalRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;

    const user = getCurrentUser();

    setCurrentUser(user);
    setMode(initialMode);
    setError("");
    setMessage("");
    setLoading(false);
  }, [open, initialMode]);

  useEffect(() => {
    if (!open) return;

    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.body.style.overflow = originalOverflow;
    };
  }, [open]);

  const scrollFieldIntoView = (
    event: React.FocusEvent<HTMLInputElement>
  ) => {
    const field = event.currentTarget;

    window.setTimeout(() => {
      field.scrollIntoView({
        behavior: "auto",
        block: "center",
      });
    }, 250);
  };

  const changeMode = (newMode: AuthMode) => {
    setMode(newMode);
    setError("");
    setMessage("");
  };

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

  const handleClose = () => {
    if (loading) return;
    resetForms();
    onClose();
  };

  const handleOverlayClick = (
    event: React.MouseEvent<HTMLDivElement>
  ) => {
    if (event.target === event.currentTarget) {
      handleClose();
    }
  };

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

      setPhone(cleanPhone);

      if (result.exists) {
        setMode("login-pin");
        setMessage("Welcome back. Enter your 4-digit PIN.");
      } else {
        setMode("signup");
        setMessage("Let's create your account.");
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

      setCurrentUser(getCurrentUser());
      setMessage(result.message || "Login successful.");

      window.setTimeout(() => {
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

  const handleSignupRequestOtp = async (
    event: React.FormEvent<HTMLFormElement>
  ) => {
    event.preventDefault();

    setError("");
    setMessage("");

    if (!name.trim()) {
      setError("Please enter your full name.");
      return;
    }

    if (!email.trim()) {
      setError("Please enter your email address.");
      return;
    }

    const cleanEmail = email.trim().toLowerCase();
    const cleanPhone = phone.replace(/\D/g, "");

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail)) {
      setError("Please enter a valid email address.");
      return;
    }

    if (!/^\d{10}$/.test(cleanPhone)) {
      setError("Please enter a valid 10-digit mobile number.");
      return;
    }

    try {
      setLoading(true);

      const result = await requestSignupOTP({
        name: name.trim(),
        email: cleanEmail,
        phone: cleanPhone,
        referralCode: referralCode.trim(),
      });

      if (result.error) {
        throw new Error(result.error);
      }

      setEmail(cleanEmail);
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
          "Email verified successfully. Create your PIN."
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

      setCurrentUser(getCurrentUser());
      setMessage(
        result.message ||
          "Account created successfully. Welcome to Mithora Kitchen!"
      );

      window.setTimeout(() => {
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

      const cleanEmail = email.trim().toLowerCase();
      const result = await requestPinResetOTP(cleanEmail);

      if (result.error) {
        throw new Error(result.error);
      }

      setEmail(cleanEmail);
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

      window.setTimeout(() => {
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

  const handleLogout = () => {
    logout();
    onLoggedOut?.();

    setCurrentUser(null);
    resetForms();
    setMode("mobile");
  };

  const goToMobile = () => {
    setPin("");
    setConfirmPin("");
    setOtp("");
    changeMode("mobile");
  };

  const getTitle = () => {
    switch (mode) {
      case "mobile":
        return "Welcome to Mithora Kitchen";
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

  const getSubtitle = () => {
    switch (mode) {
      case "mobile":
        return "Enter your mobile number";
      case "login-pin":
        return `Enter your 4-digit PIN for ${phone}`;
      case "signup":
        return "Just a few details to get started";
      case "signup-verify":
        return `Enter the 6-digit code sent to ${email}`;
      case "signup-pin":
        return "Create a 4-digit PIN for secure login";
      case "forgot-pin":
        return "We'll send a verification code to your email";
      case "verify-otp":
        return `Enter the 6-digit code sent to ${email}`;
      case "reset-pin":
        return "Set a new 4-digit PIN for your account";
      default:
        return "";
    }
  };

  if (!open) {
    return null;
  }

  return (
    <div
      className="auth-modal-overlay"
      onMouseDown={handleOverlayClick}
      role="dialog"
      aria-modal="true"
      aria-labelledby="auth-modal-title"
    >
      <div className="auth-modal" ref={modalRef}>
        <button
          type="button"
          className="auth-modal-close"
          onClick={handleClose}
          disabled={loading}
          aria-label="Close"
        >
          ×
        </button>

        {currentUser ? (
          <div className="auth-logged-in">
            <div className="auth-user-avatar">
              {currentUser.name?.charAt(0)?.toUpperCase() || "M"}
            </div>

            <h2>You're already logged in</h2>
            <p>{currentUser.name}</p>
            <span>{currentUser.email}</span>

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
            <div className="auth-modal-heading">
              <div className="auth-step-indicator">
                <span className={mode === "mobile" ? "active" : ""} />
                <span
                  className={
                    ["signup", "signup-verify", "signup-pin"].includes(mode)
                      ? "active"
                      : ""
                  }
                />
              </div>

              <h2 id="auth-modal-title">{getTitle()}</h2>
              <p>{getSubtitle()}</p>
            </div>

            {error && (
              <div
                className="auth-message auth-message-error"
                role="alert"
              >
                {error}
              </div>
            )}

            {message && (
              <div
                className="auth-message auth-message-success"
                role="status"
              >
                {message}
              </div>
            )}

            {mode === "mobile" && (
              <form onSubmit={handleMobileSubmit} className="auth-form">
                <div className="auth-field">
                  <label htmlFor="auth-mobile">Mobile Number</label>
                  <input
                    id="auth-mobile"
                    type="tel"
                    inputMode="numeric"
                    maxLength={10}
                    placeholder="Enter 10-digit mobile number"
                    value={phone}
                    onChange={(e) =>
                      setPhone(
                        e.target.value.replace(/\D/g, "").slice(0, 10)
                      )
                    }
                    autoComplete="tel"
                    onFocus={scrollFieldIntoView}
                    disabled={loading}
                    required
                  />
                  <span className="auth-field-hint">
                    We'll use this to identify your account.
                  </span>
                </div>

                <button
                  type="submit"
                  className="auth-primary-button"
                  disabled={loading}
                >
                  {loading ? "Checking..." : "Continue"}
                </button>

                <div className="auth-bottom-text">
                  Already have an account?{" "}
                  <button
                    type="button"
                    className="auth-link-button"
                    onClick={() => changeMode("forgot-pin")}
                    disabled={loading}
                  >
                    Forgot PIN?
                  </button>
                </div>
              </form>
            )}

            {mode === "login-pin" && (
              <form onSubmit={handleLogin} className="auth-form">
                <div className="auth-pin-field">
                  <label>4-Digit PIN</label>
                  <DigitBoxes
                    value={pin}
                    onChange={setPin}
                    disabled={loading}
                    namePrefix="login-pin"
                    length={4}
                    label="Login PIN"
                    autoComplete="one-time-code"
                  />
                </div>

                <button
                  type="submit"
                  className="auth-primary-button"
                  disabled={loading}
                >
                  {loading ? "Logging in..." : "Login"}
                </button>

                <button
                  type="button"
                  className="auth-link-button auth-center-link"
                  onClick={() => changeMode("forgot-pin")}
                  disabled={loading}
                >
                  Forgot PIN?
                </button>

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

            {mode === "signup" && (
              <form
                onSubmit={handleSignupRequestOtp}
                className="auth-form"
              >
                <div className="auth-field">
                  <label htmlFor="signup-name">Full Name</label>
                  <input
                    id="signup-name"
                    type="text"
                    placeholder="Enter your full name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    autoComplete="name"
                    onFocus={scrollFieldIntoView}
                    disabled={loading}
                    required
                  />
                </div>

                <div className="auth-field">
                  <label htmlFor="signup-email">Email Address</label>
                  <input
                    id="signup-email"
                    type="email"
                    placeholder="Enter your email address"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    autoComplete="email"
                    onFocus={scrollFieldIntoView}
                    disabled={loading}
                    required
                  />
                  <span className="auth-field-hint">
                    Your verification OTP will be sent here.
                  </span>
                </div>

                <div className="auth-field">
                  <label htmlFor="signup-phone">Mobile Number</label>
                  <input
                    id="signup-phone"
                    type="tel"
                    value={phone}
                    disabled
                    aria-readonly="true"
                  />
                </div>

                <div className="auth-field">
                  <label htmlFor="signup-referral">
                    Referral Code{" "}
                    <span className="auth-optional">Optional</span>
                  </label>
                  <input
                    id="signup-referral"
                    type="text"
                    placeholder="Enter referral code"
                    value={referralCode}
                    onChange={(e) =>
                      setReferralCode(
                        e.target.value.trim().toUpperCase()
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
                  {loading ? "Sending OTP..." : "Continue"}
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

            {mode === "signup-verify" && (
              <form
                onSubmit={handleSignupVerifyOtp}
                className="auth-form"
              >
                <div className="auth-info-box">
                  <span>Verification code sent to</span>
                  <strong>{email}</strong>
                </div>

                <div className="auth-pin-field">
                  <label>6-Digit OTP</label>
                  <DigitBoxes
                    value={otp}
                    onChange={setOtp}
                    disabled={loading}
                    namePrefix="signup-otp"
                    length={6}
                    label="Email verification OTP"
                    autoComplete="one-time-code"
                  />
                </div>

                <button
                  type="submit"
                  className="auth-primary-button"
                  disabled={loading}
                >
                  {loading ? "Verifying..." : "Verify Email"}
                </button>

                <button
                  type="button"
                  className="auth-secondary-link"
                  onClick={() => changeMode("signup")}
                  disabled={loading}
                >
                  ← Edit Details
                </button>
              </form>
            )}

            {mode === "signup-pin" && (
              <form onSubmit={handleSignupComplete} className="auth-form">
                <div className="auth-info-box auth-info-box-success">
                  <span>Email verified</span>
                  <strong>{email}</strong>
                </div>

                <div className="auth-pin-field">
                  <label>Create 4-Digit PIN</label>
                  <DigitBoxes
                    value={pin}
                    onChange={setPin}
                    disabled={loading}
                    namePrefix="signup-pin"
                    length={4}
                    label="Create PIN"
                    autoComplete="new-password"
                  />
                </div>

                <div className="auth-pin-field">
                  <label>Confirm PIN</label>
                  <DigitBoxes
                    value={confirmPin}
                    onChange={setConfirmPin}
                    disabled={loading}
                    namePrefix="signup-confirm-pin"
                    length={4}
                    label="Confirm PIN"
                    autoComplete="new-password"
                  />
                </div>

                <button
                  type="submit"
                  className="auth-primary-button"
                  disabled={loading}
                >
                  {loading ? "Creating Account..." : "Create Account"}
                </button>

                <p className="auth-secure-note">
                  Your PIN will be used for future logins.
                </p>
              </form>
            )}

            {mode === "forgot-pin" && (
              <form onSubmit={handleRequestOtp} className="auth-form">
                <div className="auth-info-box">
                  <span>Use the email linked to your account.</span>
                </div>

                <div className="auth-field">
                  <label htmlFor="forgot-email">Registered Email</label>
                  <input
                    id="forgot-email"
                    type="email"
                    placeholder="Enter your email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    autoComplete="email"
                    onFocus={scrollFieldIntoView}
                    disabled={loading}
                    required
                  />
                </div>

                <button
                  type="submit"
                  className="auth-primary-button"
                  disabled={loading}
                >
                  {loading ? "Sending OTP..." : "Send OTP"}
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

            {mode === "verify-otp" && (
              <form onSubmit={handleVerifyOtp} className="auth-form">
                <div className="auth-info-box">
                  <span>Verification code sent to</span>
                  <strong>{email}</strong>
                </div>

                <div className="auth-pin-field">
                  <label>6-Digit OTP</label>
                  <DigitBoxes
                    value={otp}
                    onChange={setOtp}
                    disabled={loading}
                    namePrefix="reset-otp"
                    length={6}
                    label="PIN reset OTP"
                    autoComplete="one-time-code"
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

            {mode === "reset-pin" && (
              <form onSubmit={handleResetPin} className="auth-form">
                <div className="auth-pin-field">
                  <label>New 4-Digit PIN</label>
                  <DigitBoxes
                    value={pin}
                    onChange={setPin}
                    disabled={loading}
                    namePrefix="reset-pin"
                    length={4}
                    label="New PIN"
                    autoComplete="new-password"
                  />
                </div>

                <div className="auth-pin-field">
                  <label>Confirm New PIN</label>
                  <DigitBoxes
                    value={confirmPin}
                    onChange={setConfirmPin}
                    disabled={loading}
                    namePrefix="reset-confirm-pin"
                    length={4}
                    label="Confirm new PIN"
                    autoComplete="new-password"
                  />
                </div>

                <button
                  type="submit"
                  className="auth-primary-button"
                  disabled={loading}
                >
                  {loading ? "Resetting PIN..." : "Reset PIN"}
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
      </div>
    </div>
  );
}
