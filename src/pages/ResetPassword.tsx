import type { FormEvent } from "react";
import { useMemo, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { useTheme } from "../contexts/ThemeContext";

function mensajeError(err: unknown, fallback: string) {
  const anyErr = err as { response?: { data?: { message?: string } } };
  return anyErr?.response?.data?.message || fallback;
}

export default function ResetPassword() {
  const [searchParams] = useSearchParams();
  const tokenFromUrl = useMemo(
    () => searchParams.get("token") || "",
    [searchParams]
  );
  const [token, setToken] = useState(tokenFromUrl);
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState("");
  const [info, setInfo] = useState("");
  const [loading, setLoading] = useState(false);
  const { resetPassword } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError("");
    setInfo("");
    if (password.length < 6) {
      setError("La contraseña debe tener al menos 6 caracteres");
      return;
    }
    if (password !== confirm) {
      setError("Las contraseñas no coinciden");
      return;
    }
    if (!token.trim()) {
      setError("Falta el token de recuperación");
      return;
    }
    setLoading(true);
    try {
      const msg = await resetPassword(token.trim(), password);
      setInfo(msg);
      setTimeout(() => navigate("/login"), 1500);
    } catch (err) {
      setError(mensajeError(err, "No se pudo restablecer la contraseña"));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-canvas px-4">
      <div aria-hidden className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-brand/25 via-canvas to-canvas" />
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
            Nueva contraseña
          </h1>
          <p className="panel-sub">Elige una contraseña nueva para Pulseon</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          {!tokenFromUrl && (
            <div>
              <label
                htmlFor="token"
                className="mb-1.5 block text-sm font-medium text-ink"
              >
                Token
              </label>
              <input
                id="token"
                type="text"
                value={token}
                onChange={(e) => setToken(e.target.value)}
                className="input-field"
                placeholder="Pega el token del correo"
                required
              />
            </div>
          )}

          <div>
            <label
              htmlFor="password"
              className="mb-1.5 block text-sm font-medium text-ink"
            >
              Nueva contraseña
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="input-field"
              minLength={6}
              required
              autoComplete="new-password"
            />
          </div>

          <div>
            <label
              htmlFor="confirm"
              className="mb-1.5 block text-sm font-medium text-ink"
            >
              Confirmar
            </label>
            <input
              id="confirm"
              type="password"
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              className="input-field"
              minLength={6}
              required
              autoComplete="new-password"
            />
          </div>

          {error && (
            <div className="rounded-xl border border-red-300/60 bg-red-500/10 px-4 py-3 text-sm text-red-700 dark:text-red-300">
              {error}
            </div>
          )}
          {info && (
            <div className="rounded-xl border border-brand/30 bg-brand/10 px-4 py-3 text-sm text-ink">
              {info}
            </div>
          )}

          <button
            type="submit"
            className="btn-primary w-full py-2.5"
            disabled={loading}
          >
            {loading ? "Guardando…" : "Guardar contraseña"}
          </button>
        </form>

        <p className="mt-6 text-center text-sm">
          <Link to="/login" className="text-brand hover:underline">
            Volver al login
          </Link>
        </p>
      </div>
    </div>
  );
}
