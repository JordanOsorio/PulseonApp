import { Link } from "react-router-dom";
import Layout from "../components/Layout";

export default function Dashboard() {
  const cards = [
    {
      title: "Alimentos",
      description:
        "Gestiona la base de datos de alimentos y carga archivos Excel",
      icon: "🍎",
      link: "/alimentos",
      color: "bg-green-500",
    },
    {
      title: "Entrenamientos",
      description: "Crea y gestiona ejercicios y entrenamientos",
      icon: "💪",
      link: "/entrenamientos",
      color: "bg-blue-500",
    },
    {
      title: "Categorías",
      description: "Administra las categorías de ejercicios",
      icon: "📁",
      link: "/categorias",
      color: "bg-purple-500",
    },
    {
      title: "Programas",
      description: "Visualiza y gestiona programas de entrenamiento",
      icon: "📋",
      link: "/programas",
      color: "bg-orange-500",
    },
  ];

  return (
    <Layout>
      <div className="px-4 py-6 sm:px-0">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
          <p className="mt-2 text-gray-600">
            Bienvenido al panel de administración de Pulseon
          </p>
        </div>

        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {cards.map((card) => (
            <Link
              key={card.title}
              to={card.link}
              className="bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow p-6 cursor-pointer"
            >
              <div
                className={`${card.color} w-12 h-12 rounded-lg flex items-center justify-center text-2xl mb-4`}
              >
                {card.icon}
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                {card.title}
              </h3>
              <p className="text-gray-600 text-sm">{card.description}</p>
            </Link>
          ))}
        </div>
      </div>
    </Layout>
  );
}
