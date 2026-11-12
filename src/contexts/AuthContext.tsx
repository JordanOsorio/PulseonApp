import type { ReactNode } from "react";
import { createContext, useContext, useEffect, useState } from "react";
import api, { REFRESH_KEY, TOKEN_KEY } from "../services/api";

export type RolUsuario = "ADMIN" | "USUARIO";

export type AuthUser = {
  idUsuario: string;
  email: string;
  nombre?: string;
  rol: RolUsuario;
  isAdmin: boolean;
};

interface AuthContextType {
  isAuthenticated: boolean;
  isAdmin: boolean;
  token: string | null;
  user: AuthUser | null;
  login: (email: string, password: string) => Promise<AuthUser>;
  register: (
    email: string,
    password: string,
    nombre?: string
  ) => Promise<void>;
  forgotPassword: (email: string) => Promise<string>;
  resetPassword: (token: string, nuevaPassword: string) => Promise<string>;
  deleteAccount: (password: string) => Promise<void>;
  logout: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const USER_KEY = "pulseon_user";

function guardarTokens(token: string, refreshToken?: string) {
  localStorage.setItem(TOKEN_KEY, token);
  if (refreshToken) {
    localStorage.setItem(REFRESH_KEY, refreshToken);
  }
}

function guardarUser(user: AuthUser) {
  localStorage.setItem(USER_KEY, JSON.stringify(user));
}

function leerUser(): AuthUser | null {
  try {
    const raw = localStorage.getItem(USER_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as AuthUser;
  } catch {
    return null;
  }
}

function limpiarSesion() {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(REFRESH_KEY);
  localStorage.removeItem(USER_KEY);
  localStorage.removeItem("isAuthenticated");
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [token, setToken] = useState<string | null>(() =>
    localStorage.getItem(TOKEN_KEY)
  );
  const [user, setUser] = useState<AuthUser | null>(() => leerUser());

  const isAuthenticated = Boolean(token);
  const isAdmin = user?.isAdmin === true || user?.rol === "ADMIN";

  useEffect(() => {
    if (token) {
      localStorage.setItem(TOKEN_KEY, token);
    }
  }, [token]);

  const login = async (
    email: string,
    password: string
  ): Promise<AuthUser> => {
    const { data } = await api.post<{
      token: string;
      refreshToken?: string;
      usuario: AuthUser;
    }>("/auth/login", { email, password });
    if (!data?.token || !data.usuario) {
      throw new Error("No se recibió token");
    }
    const authUser: AuthUser = {
      idUsuario: data.usuario.idUsuario,
      email: data.usuario.email,
      nombre: data.usuario.nombre,
      rol: data.usuario.rol === "ADMIN" ? "ADMIN" : "USUARIO",
      isAdmin:
        data.usuario.isAdmin === true || data.usuario.rol === "ADMIN",
    };
    guardarTokens(data.token, data.refreshToken);
    guardarUser(authUser);
    setToken(data.token);
    setUser(authUser);
    return authUser;
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

  const deleteAccount = async (password: string): Promise<void> => {
    await api.delete("/auth/cuenta", { data: { password } });
    limpiarSesion();
    setToken(null);
    setUser(null);
  };

  const logout = async () => {
    const refreshToken = localStorage.getItem(REFRESH_KEY);
    try {
      await api.post("/auth/logout", { refreshToken });
    } catch {
      // Igual limpiamos local
    }
    limpiarSesion();
    setToken(null);
    setUser(null);
  };

  const refreshProfile = async () => {
    const { data } = await api.get<AuthUser & { rol?: string }>("/auth/perfil");
    if (!data) return;
    const authUser: AuthUser = {
      idUsuario: data.idUsuario,
      email: data.email,
      nombre: data.nombre,
      rol: data.rol === "ADMIN" ? "ADMIN" : "USUARIO",
      isAdmin: data.rol === "ADMIN",
    };
    guardarUser(authUser);
    setUser(authUser);
  };

  return (
    <AuthContext.Provider
      value={{
        isAuthenticated,
        isAdmin,
        token,
        user,
        login,
        register,
        forgotPassword,
        resetPassword,
        deleteAccount,
        logout,
        refreshProfile,
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
