"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";

import AuthModal from "@/components/auth/AuthModal";

import {
  getCurrentUser,
  logout as authLogout,
  type User,
} from "@/lib/auth";

export type AuthMode =
  | "mobile"
  | "login-pin"
  | "signup"
  | "signup-verify"
  | "signup-pin"
  | "forgot-pin"
  | "verify-otp"
  | "reset-pin";

type AuthContextType = {
  user: User | null;
  isAuthenticated: boolean;
  authReady: boolean;
  openAuth: (mode?: AuthMode) => void;
  closeAuth: () => void;
  logout: () => void;
};

const AuthContext = createContext<
  AuthContextType | undefined
>(undefined);

export function AuthProvider({
  children,
}: {
  children: ReactNode;
}) {
  // IMPORTANT:
  // Start with null so server and browser render
  // the exact same initial state.
  const [user, setUser] =
    useState<User | null>(null);

  const [authReady, setAuthReady] =
    useState(false);

  const [authOpen, setAuthOpen] =
    useState(false);

  const [authMode, setAuthMode] =
    useState<AuthMode>("mobile");

  // Load localStorage only after the component
  // has mounted in the browser.
  useEffect(() => {
    const currentUser = getCurrentUser();

    setUser(currentUser);
    setAuthReady(true);
  }, []);

  const openAuth = useCallback(
    (mode: AuthMode = "mobile") => {
      setAuthMode(mode);
      setAuthOpen(true);
    },
    []
  );

  const closeAuth = useCallback(() => {
    setAuthOpen(false);
  }, []);

  const logout = useCallback(() => {
    authLogout();
    setUser(null);
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        authReady,
        openAuth,
        closeAuth,
        logout,
      }}
    >
      {children}

      <AuthModal
        open={authOpen}
        onClose={closeAuth}
        initialMode={authMode}
        onAuthenticated={(
          authenticatedUser: User
        ) => {
          setUser(authenticatedUser);
        }}
        onLoggedOut={() => {
          setUser(null);
        }}
      />
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context =
    useContext(AuthContext);

  if (!context) {
    throw new Error(
      "useAuth must be used inside AuthProvider"
    );
  }

  return context;
}