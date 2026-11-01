import type { FormEvent } from "react";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { useTheme } from "../contexts/ThemeContext";

export default function Login() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const { login } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    setError("");

    const success = login(username, password);
    if (success) {
      navigate("/");
    } else {
      setError("Usuario o contraseña incorrectos");
    }
  };

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-canvas px-4">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 -z-10"
      >
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-brand/25 via-canvas to-canvas" />
        <div className="absolute -left-20 bottom-0 h-96 w-96 rounded-full bg-accent/20 blur-3xl" />
        <div className="absolute -right-10 top-10 h-80 w-80 rounded-full bg-brand/20 blur-3xl" />
      </div>

      <button
        type="button"
        onClick={toggleTheme}
        className="btn-secondary absolute right-4 top-4 text-xs"
      >
        {theme === "dark" ? "Modo claro" : "Modo oscuro"}
      </button>

      <div className="panel-card w-full max-w-md p-8">
        <div className="mb-8 text-center">
          <h1 className="font-display text-3xl font-bold tracking-tight text-ink">
            Pulseon
          </h1>
          <p className="panel-sub">
            Admin de entrenamientos y nutrición
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label
              htmlFor="username"
              className="mb-1.5 block text-sm font-medium text-ink"
            >
              Usuario
            </label>
            <input
              id="username"
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="input-field"
              placeholder="Ingresá tu usuario"
              required
            />
          </div>

          <div>
            <label
              htmlFor="password"
              className="mb-1.5 block text-sm font-medium text-ink"
            >
              Contraseña
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="input-field"
              placeholder="Ingresá tu contraseña"
              required
            />
          </div>

          {error && (
            <div className="rounded-xl border border-red-300/60 bg-red-500/10 px-4 py-3 text-sm text-red-700 dark:text-red-300">
              {error}
            </div>
          )}

          <button type="submit" className="btn-primary w-full py-2.5">
            Iniciar sesión
          </button>
        </form>
      </div>
    </div>
  );
}
