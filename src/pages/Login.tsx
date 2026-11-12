import type { FormEvent } from "react";
import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { useTheme } from "../contexts/ThemeContext";

type Modo = "login" | "register" | "forgot";

function mensajeError(err: unknown, fallback: string) {
  const anyErr = err as { response?: { data?: { message?: string } } };
  return anyErr?.response?.data?.message || fallback;
}

export default function Login() {
  const [modo, setModo] = useState<Modo>("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [nombre, setNombre] = useState("");
  const [error, setError] = useState("");
  const [info, setInfo] = useState("");
  const [loading, setLoading] = useState(false);
  const { login, register, forgotPassword } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();

  const cambiarModo = (siguiente: Modo) => {
    setModo(siguiente);
    setError("");
    setInfo("");
    setConfirmPassword("");
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError("");
    setInfo("");
    if (modo === "register") {
      if (password.length < 6) {
        setError("La contraseña debe tener al menos 6 caracteres");
        return;
      }
      if (password !== confirmPassword) {
        setError("Las contraseñas no coinciden");
        return;
      }
    }
    setLoading(true);
    try {
      if (modo === "login") {
        const authUser = await login(email.trim(), password);
        navigate(authUser.isAdmin ? "/" : "/mi-cuenta");
        return;
      }
      if (modo === "register") {
        await register(email.trim(), password, nombre);
        setInfo(
          "Cuenta creada. Revisa tu correo (bienvenida) e inicia sesión."
        );
        setModo("login");
        setPassword("");
        setConfirmPassword("");
        return;
      }
      const msg = await forgotPassword(email.trim());
      setInfo(msg);
    } catch (err) {
      setError(
        mensajeError(
          err,
          modo === "login"
            ? "Email o contraseña incorrectos"
            : modo === "register"
              ? "No se pudo crear la cuenta"
              : "No se pudo solicitar la recuperación"
        )
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-canvas px-4">
      <div aria-hidden className="pointer-events-none absolute inset-0 -z-10">
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
            {modo === "login" && "Inicia sesión con tu cuenta"}
            {modo === "register" && "Crea tu cuenta"}
            {modo === "forgot" && "Recupera tu contraseña"}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          {modo === "register" && (
            <div>
              <label
                htmlFor="nombre"
                className="mb-1.5 block text-sm font-medium text-ink"
              >
                Nombre
              </label>
              <input
                id="nombre"
                type="text"
                value={nombre}
                onChange={(e) => setNombre(e.target.value)}
                className="input-field"
                placeholder="Tu nombre"
              />
            </div>
          )}

          <div>
            <label
              htmlFor="email"
              className="mb-1.5 block text-sm font-medium text-ink"
            >
              Email
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="input-field"
              placeholder="tu@email.com"
              required
              autoComplete="email"
            />
          </div>

          {modo !== "forgot" && (
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
                placeholder={
                  modo === "register"
                    ? "Mínimo 6 caracteres"
                    : "Tu contraseña"
                }
                required
                minLength={6}
                autoComplete={
                  modo === "register" ? "new-password" : "current-password"
                }
              />
            </div>
          )}

          {modo === "register" && (
            <div>
              <label
                htmlFor="confirmPassword"
                className="mb-1.5 block text-sm font-medium text-ink"
              >
                Confirmar contraseña
              </label>
              <input
                id="confirmPassword"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="input-field"
                placeholder="Repite la contraseña"
                required
                minLength={6}
                autoComplete="new-password"
              />
            </div>
          )}

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
            {loading
              ? "Espera…"
              : modo === "login"
                ? "Iniciar sesión"
                : modo === "register"
                  ? "Crear cuenta"
                  : "Enviar enlace"}
          </button>
        </form>

        <div className="mt-6 space-y-2 text-center text-sm text-muted">
          {modo === "login" && (
            <>
              <button
                type="button"
                className="text-brand hover:underline"
                onClick={() => cambiarModo("forgot")}
              >
                ¿Olvidaste tu contraseña?
              </button>
              <p>
                ¿No tienes cuenta?{" "}
                <button
                  type="button"
                  className="font-medium text-brand hover:underline"
                  onClick={() => cambiarModo("register")}
                >
                  Crear cuenta
                </button>
              </p>
            </>
          )}
          {modo === "register" && (
            <p>
              ¿Ya tienes cuenta?{" "}
              <button
                type="button"
                className="font-medium text-brand hover:underline"
                onClick={() => cambiarModo("login")}
              >
                Iniciar sesión
              </button>
            </p>
          )}
          {modo === "forgot" && (
            <p>
              <button
                type="button"
                className="font-medium text-brand hover:underline"
                onClick={() => cambiarModo("login")}
              >
                Volver al login
              </button>
              {" · "}
              <Link to="/reset-password" className="text-brand hover:underline">
                Ya tengo el enlace
              </Link>
            </p>
          )}
          <p className="pt-2 text-xs">
            <Link to="/privacidad" className="text-brand hover:underline">
              Privacidad
            </Link>
            {" · "}
            <Link to="/terminos" className="text-brand hover:underline">
              Términos
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
