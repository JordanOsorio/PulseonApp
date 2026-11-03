import type { ReactNode } from "react";
import { createContext, useContext, useEffect, useState } from "react";
import api from "../services/api";

interface AuthContextType {
  isAuthenticated: boolean;
  token: string | null;
  login: (email: string, password: string) => Promise<void>;
  register: (
    email: string,
    password: string,
    nombre?: string
  ) => Promise<void>;
  forgotPassword: (email: string) => Promise<string>;
  resetPassword: (token: string, nuevaPassword: string) => Promise<string>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const TOKEN_KEY = "pulseon_admin_token";

export function AuthProvider({ children }: { children: ReactNode }) {
  const [token, setToken] = useState<string | null>(() =>
    localStorage.getItem(TOKEN_KEY)
  );

  const isAuthenticated = Boolean(token);

  useEffect(() => {
    if (token) {
      localStorage.setItem(TOKEN_KEY, token);
    } else {
      localStorage.removeItem(TOKEN_KEY);
      localStorage.removeItem("isAuthenticated");
    }
  }, [token]);

  const login = async (email: string, password: string): Promise<void> => {
    const { data } = await api.post<{ token: string }>("/auth/login", {
      email,
      password,
    });
    if (!data?.token) {
      throw new Error("No se recibió token");
    }
    setToken(data.token);
    localStorage.setItem(TOKEN_KEY, data.token);
  };

  const register = async (
    email: string,
    password: string,
    nombre?: string
  ): Promise<void> => {
    await api.post("/auth/register", {
      email,
      password,
      nombre: nombre?.trim() || undefined,
    });
  };

  const forgotPassword = async (email: string): Promise<string> => {
    const { data } = await api.post<{ message: string }>(
      "/auth/forgot-password",
      { email }
    );
    return data?.message || "Si el email existe, se enviarán instrucciones";
  };

  const resetPassword = async (
    resetToken: string,
    nuevaPassword: string
  ): Promise<string> => {
    const { data } = await api.post<{ message: string }>(
      "/auth/reset-password",
      { token: resetToken, nuevaPassword }
    );
    return data?.message || "Contraseña restablecida";
  };

  const logout = () => {
    setToken(null);
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem("isAuthenticated");
  };

  return (
    <AuthContext.Provider
      value={{
        isAuthenticated,
        token,
        login,
        register,
        forgotPassword,
        resetPassword,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
