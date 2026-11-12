import type { ReactNode } from "react";
import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { useTheme } from "../contexts/ThemeContext";

interface LayoutProps {
  children: ReactNode;
}

const navItems = [
  { path: "/", label: "Dashboard", hint: "Resumen" },
  { path: "/alimentos", label: "Alimentos", hint: "Nutrición" },
  { path: "/recetas", label: "Recetas", hint: "Comidas" },
  { path: "/entrenamientos", label: "Entrenamientos", hint: "Ejercicios" },
  { path: "/categorias", label: "Categorías", hint: "Clasificación" },
  { path: "/programas", label: "Programas", hint: "Planes" },
  { path: "/cuenta", label: "Cuenta", hint: "Perfil y baja" },
];

export default function Layout({ children }: LayoutProps) {
  const { logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const location = useLocation();
  const navigate = useNavigate();
  const [menuAbierto, setMenuAbierto] = useState(false);

  const handleLogout = async () => {
    await logout();
    navigate("/login");
  };

  const NavLinks = ({ onNavigate }: { onNavigate?: () => void }) => (
    <nav className="flex flex-col gap-1 p-3">
      {navItems.map((item) => {
        const activo =
          item.path === "/"
            ? location.pathname === "/"
            : location.pathname.startsWith(item.path);
        return (
          <Link
            key={item.path}
            to={item.path}
            onClick={onNavigate}
            className={`group rounded-xl px-3 py-2.5 transition ${
              activo
                ? "bg-brand text-brand-fg shadow-sm"
                : "text-muted hover:bg-surface-2 hover:text-ink"
            }`}
          >
            <div className="font-display text-sm font-semibold tracking-tight">
              {item.label}
            </div>
            <div
              className={`text-[11px] ${
                activo ? "text-brand-fg/80" : "text-muted/80"
              }`}
            >
              {item.hint}
            </div>
          </Link>
        );
      })}
    </nav>
  );

  return (
    <div className="min-h-screen bg-canvas text-ink">
      {/* Fondo atmosférico suave */}
      <div
        aria-hidden
        className="pointer-events-none fixed inset-0 -z-10 overflow-hidden"
      >
        <div className="absolute -left-24 top-0 h-72 w-72 rounded-full bg-brand/15 blur-3xl dark:bg-brand/10" />
        <div className="absolute -right-16 top-40 h-80 w-80 rounded-full bg-accent/15 blur-3xl dark:bg-accent/10" />
      </div>

      <div className="mx-auto flex min-h-screen max-w-[1400px]">
        {/* Sidebar desktop */}
        <aside className="sticky top-0 hidden h-screen w-64 shrink-0 flex-col border-r border-line bg-surface/90 backdrop-blur-md lg:flex">
          <div className="border-b border-line px-5 py-5">
            <div className="font-display text-xl font-bold tracking-tight text-ink">
              Pulseon
            </div>
            <p className="text-xs text-muted">Admin · deporte & nutrición</p>
          </div>
          <div className="flex-1 overflow-y-auto">
            <NavLinks />
          </div>
          <div className="space-y-2 border-t border-line p-3">
            <button
              type="button"
              onClick={toggleTheme}
              className="btn-secondary w-full"
            >
              {theme === "dark" ? "Modo claro" : "Modo oscuro"}
            </button>
            <button
              type="button"
              onClick={handleLogout}
              className="w-full rounded-xl px-4 py-2 text-sm font-medium text-muted transition hover:bg-red-500/10 hover:text-red-600"
            >
              Cerrar sesión
            </button>
          </div>
        </aside>

        {/* Columna principal */}
        <div className="flex min-w-0 flex-1 flex-col">
          {/* Top bar mobile */}
          <header className="sticky top-0 z-30 flex items-center justify-between border-b border-line bg-surface/90 px-4 py-3 backdrop-blur-md lg:hidden">
            <div>
              <div className="font-display text-lg font-bold">Pulseon</div>
              <div className="text-[11px] text-muted">Panel admin</div>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={toggleTheme}
                className="btn-secondary px-3 py-1.5 text-xs"
              >
                {theme === "dark" ? "Claro" : "Oscuro"}
              </button>
              <button
                type="button"
                onClick={() => setMenuAbierto((v) => !v)}
                className="btn-primary px-3 py-1.5 text-xs"
              >
                Menú
              </button>
            </div>
          </header>

          {menuAbierto && (
            <div className="border-b border-line bg-surface lg:hidden">
              <NavLinks onNavigate={() => setMenuAbierto(false)} />
              <div className="border-t border-line p-3">
                <button
                  type="button"
                  onClick={handleLogout}
                  className="w-full rounded-xl px-4 py-2 text-sm text-red-600 hover:bg-red-500/10"
                >
                  Cerrar sesión
                </button>
              </div>
            </div>
          )}

          <main className="flex-1 px-4 py-6 sm:px-6 lg:px-8">{children}</main>
        </div>
      </div>
    </div>
  );
}
