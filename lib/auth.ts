// lib/auth.ts

export type User = {
  id: number;
  name: string;
  email: string;
  phone: string;
  referral_code?: string;
  is_admin?: number;
};

export type SignupOTPData = {
  name: string;
  email: string;
  phone: string;
  referralCode?: string;
};

export type SignupVerifyOTPData = {
  phone: string;
  otp: string;
};

export type SignupCompleteData = {
  name: string;
  email: string;
  phone: string;
  pin: string;
  referralCode?: string;
};

export type LoginData = {
  identifier: string;
  password: string;
};

export type ResetPinData = {
  email: string;
  otp: string;
  pin: string;
};

export type AuthResponse = {
  ok?: boolean;
  token?: string;
  user?: User;
  message?: string;
  error?: string;
};

export type CheckMobileResponse = {
  ok?: boolean;
  exists: boolean;
  message?: string;
  error?: string;
};

const TOKEN_KEY = "mithora_auth_token";
const USER_KEY = "mithora_auth_user";

/**
 * ========================================
 * COMMON REQUEST HELPER
 * ========================================
 */

async function authRequest<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const response = await fetch(`/api/auth${endpoint}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(options.headers || {}),
    },
    cache: "no-store",
  });

  let data: T;

  try {
    data = await response.json();
  } catch {
    throw new Error(
      "Invalid response from authentication server."
    );
  }

  if (!response.ok) {
    const errorData = data as {
      error?: string;
      message?: string;
    };

    throw new Error(
      errorData?.error ||
        errorData?.message ||
        "Something went wrong. Please try again."
    );
  }

  return data;
}

/**
 * ========================================
 * CHECK MOBILE
 * POST /api/auth/check-mobile
 * ========================================
 *
 * Checks whether the mobile number already
 * belongs to an existing user.
 */

export async function checkMobile(
  phone: string
): Promise<CheckMobileResponse> {
  const cleanPhone = phone
    .replace(/\D/g, "")
    .trim();

  if (!/^\d{10}$/.test(cleanPhone)) {
    throw new Error(
      "Please enter a valid 10-digit mobile number."
    );
  }

  return authRequest<CheckMobileResponse>(
    "/check-mobile",
    {
      method: "POST",
      body: JSON.stringify({
        phone: cleanPhone,
      }),
    }
  );
}

/**
 * ========================================
 * REQUEST SIGNUP OTP
 * POST /api/auth/signup/request-otp
 * ========================================
 *
 * Starts the new signup journey.
 *
 * Name + Email + Mobile + optional referral
 * code are sent to the Worker.
 */

export async function requestSignupOTP(
  data: SignupOTPData
): Promise<AuthResponse> {
  const name = data.name.trim();
  const email = data.email.trim().toLowerCase();
  const phone = data.phone
    .replace(/\D/g, "")
    .trim();

  const referralCode =
    data.referralCode?.trim().toUpperCase() || "";

  if (!name) {
    throw new Error("Name is required.");
  }

  if (!email) {
    throw new Error("Email is required.");
  }

  if (!/^\d{10}$/.test(phone)) {
    throw new Error(
      "Please enter a valid 10-digit mobile number."
    );
  }

  return authRequest<AuthResponse>(
    "/signup/request-otp",
    {
      method: "POST",
      body: JSON.stringify({
        name,
        email,
        phone,
        referralCode: referralCode || undefined,
      }),
    }
  );
}

/**
 * ========================================
 * VERIFY SIGNUP OTP
 * POST /api/auth/signup/verify-otp
 * ========================================
 */

export async function verifySignupOTP(
  data: SignupVerifyOTPData
): Promise<AuthResponse> {
  const phone = data.phone
    .replace(/\D/g, "")
    .trim();

  const otp = data.otp.trim();

  if (!/^\d{10}$/.test(phone)) {
    throw new Error(
      "Please enter a valid 10-digit mobile number."
    );
  }

  if (!/^\d{6}$/.test(otp)) {
    throw new Error("OTP must be 6 digits.");
  }

  return authRequest<AuthResponse>(
    "/signup/verify-otp",
    {
      method: "POST",
      body: JSON.stringify({
        phone,
        otp,
      }),
    }
  );
}

/**
 * ========================================
 * COMPLETE SIGNUP
 * POST /api/auth/signup/complete
 * ========================================
 *
 * Final step after email OTP verification.
 *
 * The Worker creates the actual user account
 * and applies referral / welcome coupon logic.
 */

export async function completeSignup(
  data: SignupCompleteData
): Promise<AuthResponse> {
  const name = data.name.trim();
  const email = data.email.trim().toLowerCase();
  const phone = data.phone
    .replace(/\D/g, "")
    .trim();

  const pin = data.pin.trim();

  const referralCode =
    data.referralCode?.trim().toUpperCase() || "";

  if (!name) {
    throw new Error("Name is required.");
  }

  if (!email) {
    throw new Error("Email is required.");
  }

  if (!/^\d{10}$/.test(phone)) {
    throw new Error(
      "Please enter a valid 10-digit mobile number."
    );
  }

  if (!/^\d{4}$/.test(pin)) {
    throw new Error(
      "PIN must be exactly 4 digits."
    );
  }

  return authRequest<AuthResponse>(
    "/signup/complete",
    {
      method: "POST",
      body: JSON.stringify({
        name,
        email,
        phone,
        pin,
        referralCode: referralCode || undefined,
      }),
    }
  );
}

/**
 * ========================================
 * LOGIN
 * POST /api/auth/login
 * ========================================
 *
 * The new UI primarily uses:
 *
 * Mobile + PIN
 *
 * Email + password is still supported by the
 * Worker for backward compatibility.
 */

export async function login(
  data: LoginData
): Promise<AuthResponse> {
  const identifier = data.identifier.trim();

  if (!identifier) {
    throw new Error(
      "Mobile number or email is required."
    );
  }

  if (!data.password) {
    throw new Error(
      "PIN or password is required."
    );
  }

  const isEmail = identifier.includes("@");

  if (isEmail) {
    return authRequest<AuthResponse>(
      "/login",
      {
        method: "POST",
        body: JSON.stringify({
          email: identifier.toLowerCase(),
          password: data.password,
        }),
      }
    );
  }

  const phone = identifier
    .replace(/\D/g, "")
    .trim();

  if (!/^\d{10}$/.test(phone)) {
    throw new Error(
      "Please enter a valid 10-digit mobile number."
    );
  }

  return authRequest<AuthResponse>(
    "/login",
    {
      method: "POST",
      body: JSON.stringify({
        phone,
        pin: data.password,
      }),
    }
  );
}

/**
 * ========================================
 * REQUEST PIN RESET OTP
 * POST /api/auth/request-pin-reset
 * ========================================
 */

export async function requestPinResetOTP(
  email: string
): Promise<AuthResponse> {
  const cleanEmail = email
    .trim()
    .toLowerCase();

  if (!cleanEmail) {
    throw new Error("Email is required.");
  }

  return authRequest<AuthResponse>(
    "/request-pin-reset",
    {
      method: "POST",
      body: JSON.stringify({
        email: cleanEmail,
      }),
    }
  );
}

/**
 * ========================================
 * RESET PIN
 * POST /api/auth/reset-pin
 * ========================================
 */

export async function resetPin(
  data: ResetPinData
): Promise<AuthResponse> {
  const email = data.email
    .trim()
    .toLowerCase();

  const otp = data.otp.trim();
  const pin = data.pin.trim();

  if (!email) {
    throw new Error("Email is required.");
  }

  if (!/^\d{6}$/.test(otp)) {
    throw new Error("OTP must be 6 digits.");
  }

  if (!/^\d{4}$/.test(pin)) {
    throw new Error(
      "PIN must be exactly 4 digits."
    );
  }

  return authRequest<AuthResponse>(
    "/reset-pin",
    {
      method: "POST",
      body: JSON.stringify({
        email,
        otp,
        pin,
      }),
    }
  );
}

/**
 * ========================================
 * SAVE AUTHENTICATION
 * ========================================
 */

export function saveAuth(
  token: string,
  user?: User
): void {
  if (typeof window === "undefined") {
    return;
  }

  localStorage.setItem(
    TOKEN_KEY,
    token
  );

  if (user) {
    localStorage.setItem(
      USER_KEY,
      JSON.stringify(user)
    );
  }
}

/**
 * ========================================
 * GET AUTH TOKEN
 * ========================================
 */

export function getAuthToken(): string | null {
  if (typeof window === "undefined") {
    return null;
  }

  return localStorage.getItem(TOKEN_KEY);
}

/**
 * ========================================
 * GET CURRENT USER
 * ========================================
 */

export function getCurrentUser(): User | null {
  if (typeof window === "undefined") {
    return null;
  }

  const storedUser =
    localStorage.getItem(USER_KEY);

  if (!storedUser) {
    return null;
  }

  try {
    return JSON.parse(storedUser) as User;
  } catch {
    localStorage.removeItem(USER_KEY);
    return null;
  }
}

/**
 * ========================================
 * LOGOUT
 * ========================================
 */

export function logout(): void {
  if (typeof window === "undefined") {
    return;
  }

  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
}

/**
 * ========================================
 * CHECK LOGIN STATE
 * ========================================
 */

export function isLoggedIn(): boolean {
  return !!getAuthToken();
}