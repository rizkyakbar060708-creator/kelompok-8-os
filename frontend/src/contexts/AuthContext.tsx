import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";

import api from "../services/api";
import { ACCESS_TOKEN, REFRESH_TOKEN } from "../constant";

export interface User {
  id: number;
  username: string;
  role: string;
}

interface AuthContextType {
  user: User | null;
  isReady: boolean;
  refreshUser: () => Promise<User | null>;
  login: (user: User) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isReady, setIsReady] = useState(false);

  const clearSession = useCallback(() => {
    localStorage.removeItem(ACCESS_TOKEN);
    localStorage.removeItem(REFRESH_TOKEN);
  }, []);

  // Dipakai setelah login supaya user langsung terisi tanpa round-trip ulang.
  const refreshUser = useCallback(async () => {
    try {
      const response = await api.get("/auth/me/");

      setUser(response.data);

      return response.data as User;
    } catch {
      clearSession();
      setUser(null);

      return null;
    }
  }, [clearSession]);

  useEffect(() => {
    let active = true;

    const hydrate = async () => {
      const accessToken = localStorage.getItem(ACCESS_TOKEN);

      if (!accessToken) {
        if (active) {
          setIsReady(true);
        }

        return;
      }

      try {
        const response = await api.get("/auth/me/");

        if (active) {
          setUser(response.data);
        }
      } catch (error) {
        console.error("Failed to get current user:", error);

        clearSession();

        if (active) {
          setUser(null);
        }
      } finally {
        if (active) {
          setIsReady(true);
        }
      }
    };

    hydrate();

    return () => {
      active = false;
    };
  }, [clearSession]);

  const login = (user: User) => {
    setUser(user);
  };

  const logout = () => {
    clearSession();
    setUser(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isReady,
        refreshUser,
        login,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

// Hook ini sengaja diletakkan bersama provider supaya konsumen cukup mengimpor
// satu modul. eslint-disable karena file ini mengekspor komponen sekaligus hook.
// eslint-disable-next-line react-refresh/only-export-components
export function useAuth() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error("useAuth must be used inside AuthProvider");
  }

  return context;
}