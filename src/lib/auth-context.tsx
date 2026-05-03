"use client";

import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  type ReactNode,
} from "react";
import { useRouter } from "next/navigation";

// ============================================
// Types
// ============================================

export interface AuthUser {
  id: string;
  email: string;
  phone: string | null;
  firstName: string | null;
  lastName: string;
  avatar: string | null;
  role: string;
  isActive: boolean;
  isLocked: boolean;
  lastLoginAt: string | null;
  createdAt: string;
}

interface AuthContextValue {
  user: AuthUser | null;
  token: string | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string; user?: AuthUser | null }>;
  register: (data: {
    firstName: string;
    lastName: string;
    email: string;
    phone?: string;
    password: string;
  }) => Promise<{ success: boolean; error?: string }>;
  logout: () => void;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

// ============================================
// Constants
// ============================================

const TOKEN_KEY = "kfm_token";
const USER_KEY = "kfm_user";

// ============================================
// Provider
// ============================================

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  // ── Cookie helpers (for middleware to read) ──
  const setAuthCookie = useCallback((tkn: string) => {
    document.cookie = `kfm_token=${tkn}; path=/; max-age=${7 * 24 * 3600}; SameSite=Lax`;
  }, []);

  const clearAuthCookie = useCallback(() => {
    document.cookie = "kfm_token=; path=/; max-age=0; SameSite=Lax";
  }, []);

  // ── Initialize: restore session from localStorage ──
  useEffect(() => {
    async function init() {
      try {
        const savedToken = localStorage.getItem(TOKEN_KEY);
        const savedUser = localStorage.getItem(USER_KEY);

        if (savedToken && savedUser) {
          setToken(savedToken);
          setUser(JSON.parse(savedUser));

          // Verify token is still valid by calling /api/auth/me
          const res = await fetch("/api/auth", {
            headers: { Authorization: `Bearer ${savedToken}` },
          });
          const data = await res.json();

          if (data.success && data.data) {
            setUser(data.data);
            localStorage.setItem(USER_KEY, JSON.stringify(data.data));
          } else {
            // Token expired or invalid
            localStorage.removeItem(TOKEN_KEY);
            localStorage.removeItem(USER_KEY);
            clearAuthCookie();
            setToken(null);
            setUser(null);
          }
        } else {
          // Also check for cookie-based token (set by server-side login redirect)
          const cookieMatch = document.cookie.match(/kfm_token=([^;]+)/);
          if (cookieMatch?.[1]) {
            const cookieToken = cookieMatch[1];
            setToken(cookieToken);
            // Verify it
            const res = await fetch("/api/auth", {
              headers: { Authorization: `Bearer ${cookieToken}` },
            });
            const data = await res.json();
            if (data.success && data.data) {
              setUser(data.data);
              localStorage.setItem(TOKEN_KEY, cookieToken);
              localStorage.setItem(USER_KEY, JSON.stringify(data.data));
            } else {
              clearAuthCookie();
            }
          }
        }
      } catch {
        // On error, clear session
        localStorage.removeItem(TOKEN_KEY);
        localStorage.removeItem(USER_KEY);
        clearAuthCookie();
      } finally {
        setIsLoading(false);
      }
    }
    init();
  }, [clearAuthCookie]);

  // ── Login ──
  const login = useCallback(
    async (email: string, password: string): Promise<{ success: boolean; error?: string; user?: AuthUser | null }> => {
      try {
        const res = await fetch("/api/auth", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ action: "login", email, password }),
        });

        const data = await res.json();

        if (data.success && data.data) {
          const { user: userData, token: userToken } = data.data;
          setToken(userToken);
          setUser(userData);
          localStorage.setItem(TOKEN_KEY, userToken);
          localStorage.setItem(USER_KEY, JSON.stringify(userData));
          setAuthCookie(userToken); // Set cookie for middleware
          return { success: true, user: userData };
        } else {
          return { success: false, error: data.error || "Erreur de connexion" };
        }
      } catch {
        return { success: false, error: "Erreur de connexion au serveur" };
      }
    },
    [setAuthCookie]
  );

  // ── Register ──
  const register = useCallback(
    async (regData: {
      firstName: string;
      lastName: string;
      email: string;
      phone?: string;
      password: string;
    }): Promise<{ success: boolean; error?: string }> => {
      try {
        const res = await fetch("/api/auth", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ action: "register", ...regData }),
        });

        const data = await res.json();

        if (data.success && data.data) {
          const { user: userData, token: userToken } = data.data;
          setToken(userToken);
          setUser(userData);
          localStorage.setItem(TOKEN_KEY, userToken);
          localStorage.setItem(USER_KEY, JSON.stringify(userData));
          setAuthCookie(userToken); // Set cookie for middleware
          return { success: true };
        } else {
          return { success: false, error: data.error || "Erreur lors de l'inscription" };
        }
      } catch {
        return { success: false, error: "Erreur de connexion au serveur" };
      }
    },
    [setAuthCookie]
  );

  // ── Logout ──
  const logout = useCallback(() => {
    setToken(null);
    setUser(null);
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
    clearAuthCookie(); // Clear cookie for middleware
    router.push("/customer/menu");
  }, [router, clearAuthCookie]);

  // ── Refresh user data ──
  const refreshUser = useCallback(async () => {
    if (!token) return;
    try {
      const res = await fetch("/api/auth", {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (data.success && data.data) {
        setUser(data.data);
        localStorage.setItem(USER_KEY, JSON.stringify(data.data));
      } else {
        // Token expired
        localStorage.removeItem(TOKEN_KEY);
        localStorage.removeItem(USER_KEY);
        clearAuthCookie();
        setToken(null);
        setUser(null);
      }
    } catch {
      // Silently fail
    }
  }, [token, clearAuthCookie]);

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isLoading,
        isAuthenticated: !!user && !!token,
        login,
        register,
        logout,
        refreshUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

// ============================================
// Hook
// ============================================

const DEFAULT_AUTH: AuthContextValue = {
  user: null,
  token: null,
  isLoading: true,
  isAuthenticated: false,
  login: async () => ({ success: false }),
  register: async () => ({ success: false }),
  logout: () => {},
  refreshUser: async () => {},
};

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  return context || DEFAULT_AUTH;
}

// ============================================
// Helper: get auth headers for API calls
// ============================================

export function getAuthHeaders(): HeadersInit {
  if (typeof window === "undefined") {
    return { "Content-Type": "application/json" };
  }
  const token = localStorage.getItem(TOKEN_KEY);
  return {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}
