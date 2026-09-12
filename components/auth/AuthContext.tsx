"use client";

import {
  createContext,
  useCallback,
  useContext,
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
  const [user, setUser] =
    useState<User | null>(() =>
      getCurrentUser()
    );

  const [authOpen, setAuthOpen] =
    useState(false);

  const [authMode, setAuthMode] =
    useState<AuthMode>("mobile");

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