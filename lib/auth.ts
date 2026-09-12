// lib/auth.ts

export type User = {
  id: number;
  name: string;
  email: string;
  phone: string;
  referral_code?: string;
  is_admin?: number;
};

export type SignupData = {
  name: string;
  email: string;
  phone: string;
  pin: string;
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

const TOKEN_KEY = "mithora_auth_token";
const USER_KEY = "mithora_auth_user";

/**
 * Common request helper
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
    throw new Error("Invalid response from authentication server.");
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
 * SIGNUP
 * POST /api/auth/signup
 * ========================================
 */
export async function signup(
  data: SignupData
): Promise<AuthResponse> {
  return authRequest<AuthResponse>("/signup", {
    method: "POST",
    body: JSON.stringify({
      name: data.name.trim(),
      email: data.email.trim().toLowerCase(),
      phone: data.phone.trim(),
      pin: data.pin,
    }),
  });
}

/**
 * ========================================
 * LOGIN
 * POST /api/auth/login
 * ========================================
 *
 * Worker supports:
 *
 * Email + password
 * OR
 * Phone + PIN
 *
 * The UI provides one identifier field.
 */
export async function login(
  data: LoginData
): Promise<AuthResponse> {
  const identifier = data.identifier.trim();

  if (!identifier) {
    throw new Error("Mobile number or email is required.");
  }

  if (!data.password) {
    throw new Error("PIN or password is required.");
  }

  const isEmail = identifier.includes("@");

  if (isEmail) {
    return authRequest<AuthResponse>("/login", {
      method: "POST",
      body: JSON.stringify({
        email: identifier.toLowerCase(),
        password: data.password,
      }),
    });
  }

  return authRequest<AuthResponse>("/login", {
    method: "POST",
    body: JSON.stringify({
      phone: identifier,
      pin: data.password,
    }),
  });
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
  const cleanEmail = email.trim().toLowerCase();

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
  const email = data.email.trim().toLowerCase();
  const otp = data.otp.trim();
  const pin = data.pin.trim();

  if (!email) {
    throw new Error("Email is required.");
  }

  if (!/^\d{6}$/.test(otp)) {
    throw new Error("OTP must be 6 digits.");
  }

  if (!/^\d{4}$/.test(pin)) {
    throw new Error("PIN must be exactly 4 digits.");
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
  if (typeof window === "undefined") return;

  localStorage.setItem(TOKEN_KEY, token);

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
 *
 * Reads the locally stored authenticated user.
 */
export function getCurrentUser(): User | null {
  if (typeof window === "undefined") {
    return null;
  }

  const storedUser = localStorage.getItem(USER_KEY);

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