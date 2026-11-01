import { Link } from "react-router-dom";
import Layout from "../components/Layout";

export default function Dashboard() {
  const cards = [
    {
      title: "Alimentos",
      description: "Base nutricional y carga Excel",
      link: "/alimentos",
      tone: "from-emerald-500/20 to-teal-500/5",
      chip: "Nutrición",
    },
    {
      title: "Recetas",
      description: "Comidas por momento del día",
      link: "/recetas",
      tone: "from-lime-500/20 to-emerald-500/5",
      chip: "Comidas",
    },
    {
      title: "Entrenamientos",
      description: "Ejercicios y carga masiva",
      link: "/entrenamientos",
      tone: "from-sky-500/20 to-teal-500/5",
      chip: "Deporte",
    },
    {
      title: "Categorías",
      description: "Clasificación de ejercicios",
      link: "/categorias",
      tone: "from-cyan-500/15 to-slate-500/5",
      chip: "Orden",
    },
    {
      title: "Programas",
      description: "Planes de entrenamiento",
      link: "/programas",
      tone: "from-teal-500/20 to-sky-500/5",
      chip: "Planes",
    },
  ];

  return (
    <Layout>
      <div className="space-y-8">
        <section className="panel-card overflow-hidden">
          <div className="relative px-6 py-8 sm:px-8">
            <div
              aria-hidden
              className="absolute inset-0 bg-gradient-to-br from-brand/15 via-transparent to-accent/10"
            />
            <div className="relative">
              <p className="text-xs font-semibold uppercase tracking-wider text-brand">
                Panel Pulseon
              </p>
              <h1 className="panel-header mt-1">Dashboard</h1>
              <p className="panel-sub max-w-xl">
                Administrá nutrición, recetas y entrenamientos desde un solo
                lugar. Claridad para cargar datos, sin fricción.
              </p>
            </div>
          </div>
        </section>

        <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {cards.map((card) => (
            <Link
              key={card.title}
              to={card.link}
              className="panel-card group relative overflow-hidden p-5 transition hover:-translate-y-0.5 hover:border-brand/40"
            >
              <div
                aria-hidden
                className={`absolute inset-0 bg-gradient-to-br ${card.tone} opacity-80 transition group-hover:opacity-100`}
              />
              <div className="relative">
                <span className="badge-moment mb-3 inline-flex">{card.chip}</span>
                <h3 className="font-display text-xl font-semibold text-ink">
                  {card.title}
                </h3>
                <p className="mt-1 text-sm text-muted">{card.description}</p>
                <span className="mt-4 inline-flex text-sm font-semibold text-brand">
                  Abrir →
                </span>
              </div>
            </Link>
          ))}
        </section>
      </div>
    </Layout>
  );
}
