import type { FormEvent } from "react";
import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { useTheme } from "../contexts/ThemeContext";
import api from "../services/api";

type Perfil = {
  idUsuario: string;
  email: string;
  nombre?: string;
  telefono?: string;
  telefonoVerificado?: boolean;
  createdAt?: string;
  rol?: string;
};

export default function MiCuenta() {
  const { user, logout, deleteAccount, isAdmin } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();
  const [perfil, setPerfil] = useState<Perfil | null>(null);
  const [password, setPassword] = useState("");
  const [confirmText, setConfirmText] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isAdmin) {
      navigate("/", { replace: true });
      return;
    }
    api
      .get<Perfil>("/auth/perfil")
      .then((r) => setPerfil(r.data))
      .catch(() => setPerfil(null));
  }, [isAdmin, navigate]);

  const handleDelete = async (e: FormEvent) => {
    e.preventDefault();
    setError("");
    if (confirmText.trim().toUpperCase() !== "ELIMINAR") {
      setError("Escribe ELIMINAR para confirmar");
      return;
    }
    if (!password) {
      setError("Ingresa tu contraseña");
      return;
    }
    setLoading(true);
    try {
      await deleteAccount(password);
      navigate("/login");
    } catch (err: any) {
      setError(
        err?.response?.data?.message || "No se pudo eliminar la cuenta"
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-canvas text-ink">
      <div
        aria-hidden
        className="pointer-events-none fixed inset-0 -z-10 overflow-hidden"
      >
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-brand/20 via-canvas to-canvas" />
      </div>

      <header className="mx-auto flex max-w-xl items-center justify-between px-4 py-6">
        <div className="font-display text-xl font-bold">Pulseon</div>
        <div className="flex items-center gap-2">
          <button type="button" className="btn-secondary text-xs" onClick={toggleTheme}>
            {theme === "dark" ? "Modo claro" : "Modo oscuro"}
          </button>
          <button
            type="button"
            className="btn-secondary text-xs"
            onClick={async () => {
              await logout();
              navigate("/login");
            }}
          >
            Cerrar sesión
          </button>
        </div>
      </header>

      <main className="mx-auto max-w-xl space-y-6 px-4 pb-16">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-brand">
            Mi cuenta
          </p>
          <h1 className="font-display text-3xl font-bold tracking-tight">
            Datos básicos
          </h1>
          <p className="mt-2 text-muted">
            Aquí puedes ver tu información y eliminar tu cuenta.
          </p>
        </div>

        <section className="panel-card space-y-3 p-6">
          <div>
            <p className="text-xs text-muted">Nombre</p>
            <p className="font-medium text-ink">
              {perfil?.nombre || user?.nombre || "—"}
            </p>
          </div>
          <div>
            <p className="text-xs text-muted">Email</p>
            <p className="font-medium text-ink">
              {perfil?.email || user?.email || "—"}
            </p>
          </div>
          <div>
            <p className="text-xs text-muted">Teléfono</p>
            <p className="font-medium text-ink">{perfil?.telefono || "—"}</p>
          </div>
          <div>
            <p className="text-xs text-muted">Tipo de perfil</p>
            <p className="font-medium text-ink">Usuario</p>
          </div>
        </section>

        <section className="panel-card space-y-4 border border-red-300/40 p-6">
          <h2 className="font-display text-lg font-semibold text-red-600 dark:text-red-300">
            Eliminar cuenta
          </h2>
          <p className="text-sm text-muted">
            Esta acción es permanente. Escribe <strong>ELIMINAR</strong> y tu
            contraseña para confirmar.
          </p>
          <form onSubmit={handleDelete} className="space-y-4">
            <input
              className="input-field"
              value={confirmText}
              onChange={(e) => setConfirmText(e.target.value)}
              placeholder="ELIMINAR"
              required
            />
            <input
              type="password"
              className="input-field"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Tu contraseña"
              required
              autoComplete="current-password"
            />
            {error && (
              <div className="rounded-xl border border-red-300/60 bg-red-500/10 px-4 py-3 text-sm text-red-700 dark:text-red-300">
                {error}
              </div>
            )}
            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-xl bg-red-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-red-700 disabled:opacity-60"
            >
              {loading ? "Eliminando…" : "Eliminar mi cuenta"}
            </button>
          </form>
        </section>

        <p className="text-center text-xs text-muted">
          <Link to="/privacidad" className="text-brand hover:underline">
            Privacidad
          </Link>
          {" · "}
          <Link to="/terminos" className="text-brand hover:underline">
            Términos
          </Link>
        </p>
      </main>
    </div>
  );
}
