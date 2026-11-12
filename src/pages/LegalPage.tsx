import type { ReactNode } from "react";
import { Link } from "react-router-dom";
import { useTheme } from "../contexts/ThemeContext";

type Props = {
  titulo: string;
  actualizado?: string;
  children: ReactNode;
};

export default function LegalPage({
  titulo,
  actualizado = "Noviembre 2026",
  children,
}: Props) {
  const { theme, toggleTheme } = useTheme();

  return (
    <div className="min-h-screen bg-canvas text-ink">
      <div
        aria-hidden
        className="pointer-events-none fixed inset-0 -z-10 overflow-hidden"
      >
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-brand/20 via-canvas to-canvas" />
      </div>

      <header className="mx-auto flex max-w-3xl items-center justify-between px-4 py-6">
        <Link to="/login" className="font-display text-xl font-bold text-ink">
          Pulseon
        </Link>
        <button type="button" onClick={toggleTheme} className="btn-secondary text-xs">
          {theme === "dark" ? "Modo claro" : "Modo oscuro"}
        </button>
      </header>

      <main className="mx-auto max-w-3xl px-4 pb-16">
        <article className="panel-card space-y-5 p-6 sm:p-8">
          <div>
            <h1 className="font-display text-3xl font-bold tracking-tight">
              {titulo}
            </h1>
            <p className="mt-1 text-sm text-muted">Última actualización: {actualizado}</p>
          </div>
          <div className="space-y-4 text-sm leading-relaxed text-muted [&_h2]:mt-6 [&_h2]:font-display [&_h2]:text-base [&_h2]:font-semibold [&_h2]:text-ink [&_p]:text-muted [&_ul]:list-disc [&_ul]:space-y-1 [&_ul]:pl-5">
            {children}
          </div>
          <p className="pt-4 text-sm">
            <Link to="/login" className="text-brand hover:underline">
              Volver al inicio de sesión
            </Link>
          </p>
        </article>
      </main>
    </div>
  );
}
