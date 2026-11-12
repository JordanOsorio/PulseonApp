import type { FormEvent } from "react";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import Layout from "../components/Layout";
import { useAuth } from "../contexts/AuthContext";

export default function Cuenta() {
  const { deleteAccount, logout } = useAuth();
  const navigate = useNavigate();
  const [password, setPassword] = useState("");
  const [confirmText, setConfirmText] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleDelete = async (e: FormEvent) => {
    e.preventDefault();
    setError("");
    if (confirmText.trim().toUpperCase() !== "ELIMINAR") {
      setError('Escribe ELIMINAR para confirmar');
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
    <Layout>
      <div className="mx-auto max-w-xl space-y-6">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-brand">
            Cuenta
          </p>
          <h1 className="font-display text-3xl font-bold tracking-tight text-ink">
            Tu cuenta
          </h1>
          <p className="mt-2 text-muted">
            Administra tu sesión y la eliminación permanente de tu cuenta.
          </p>
        </div>

        <section className="panel-card space-y-3 p-6">
          <h2 className="font-display text-lg font-semibold text-ink">
            Sesión
          </h2>
          <button
            type="button"
            className="btn-secondary"
            onClick={async () => {
              await logout();
              navigate("/login");
            }}
          >
            Cerrar sesión
          </button>
        </section>

        <section className="panel-card space-y-4 border border-red-300/40 p-6">
          <h2 className="font-display text-lg font-semibold text-red-600 dark:text-red-300">
            Eliminar cuenta
          </h2>
          <p className="text-sm text-muted">
            Esta acción es permanente. Se borrarán tu perfil y datos asociados
            a tu usuario. Escribe <strong>ELIMINAR</strong> y tu contraseña
            para confirmar.
          </p>
          <form onSubmit={handleDelete} className="space-y-4">
            <div>
              <label
                htmlFor="confirmText"
                className="mb-1.5 block text-sm font-medium text-ink"
              >
                Confirmación
              </label>
              <input
                id="confirmText"
                className="input-field"
                value={confirmText}
                onChange={(e) => setConfirmText(e.target.value)}
                placeholder="ELIMINAR"
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
                className="input-field"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                autoComplete="current-password"
              />
            </div>
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
      </div>
    </Layout>
  );
}
