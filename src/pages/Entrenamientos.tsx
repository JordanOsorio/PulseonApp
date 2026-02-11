import { useEffect, useState } from "react";
import Layout from "../components/Layout";
import api from "../services/api";

interface Ejercicio {
  idEjercicio: string;
  nombre: string;
  descripcion?: string;
  videoUrl?: string;
  imagenUrl?: string;
  nivelDificultad?: string;
  tipoEjercicio?: string;
  tiposMedicion?: string[];
  repeticiones?: number;
  tiempoSegundos?: number;
  pesoKg?: number;
  categoria?: {
    idCategoria: string;
    nombre: string;
  };
  musculos?: {
    musculo: {
      idMusculo: string;
      nombre: string;
    };
  }[];
  equipos?: {
    equipo: {
      idEquipo: string;
      nombre: string;
    };
  }[];
  createdAt?: string;
  updatedAt?: string;
}

interface Categoria {
  idCategoria: string;
  nombre: string;
}

export default function Entrenamientos() {
  const [ejercicios, setEjercicios] = useState<Ejercicio[]>([]);
  const [categorias, setCategorias] = useState<Categoria[]>([]);
  const [musculos, setMusculos] = useState<
    Array<{ idMusculo: string; nombre: string }>
  >([]);
  const [equipos, setEquipos] = useState<
    Array<{ idEquipo: string; nombre: string }>
  >([]);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);
  const [total, setTotal] = useState(0);
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(20);
  const [selectedEjercicio, setSelectedEjercicio] = useState<Ejercicio | null>(
    null
  );
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteAllModal, setShowDeleteAllModal] = useState(false);
  const [editing, setEditing] = useState<Ejercicio | null>(null);
  const [formData, setFormData] = useState({
    nombre: "",
    descripcion: "",
    videoUrl: "",
    imagenUrl: "",
    idCategoria: "",
    nivelDificultad: "sin_nivel",
    tipoEjercicio: "sin_tipo",
    tiposMedicion: [] as string[],
    repeticiones: undefined as number | undefined,
    tiempoSegundos: undefined as number | undefined,
    pesoKg: undefined as number | undefined,
    musculos: [] as string[],
    equipos: [] as string[],
  });

  const fetchEjercicios = async () => {
    setLoading(true);
    try {
      const offset = (currentPage - 1) * itemsPerPage;
      const params: any = {
        limit: itemsPerPage,
        offset: offset,
      };
      if (searchTerm) {
        params.nombre = searchTerm;
      }
      const response = await api.get("/ejercicios", { params });
      setEjercicios(response.data.ejercicios || []);
      setTotal(response.data.total || 0);
    } catch (error: any) {
      setMessage({
        type: "error",
        text: error.response?.data?.message || "Error al cargar ejercicios",
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchCategorias = async () => {
    try {
      const response = await api.get("/categorias");
      setCategorias(response.data || []);
    } catch (error: any) {
      console.error("Error al cargar categorías:", error);
    }
  };

  const fetchMusculos = async () => {
    try {
      const response = await api.get("/musculos");
      setMusculos(response.data || []);
    } catch (error: any) {
      console.error("Error al cargar músculos:", error);
    }
  };

  const fetchEquipos = async () => {
    try {
      const response = await api.get("/equipos");
      setEquipos(response.data || []);
    } catch (error: any) {
      console.error("Error al cargar equipos:", error);
    }
  };

  useEffect(() => {
    fetchEjercicios();
    fetchCategorias();
    fetchMusculos();
    fetchEquipos();
  }, [searchTerm, currentPage]);

  // Resetear a página 1 cuando cambia el término de búsqueda
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm]);

  // Prevenir scroll del body cuando el modal está abierto
  useEffect(() => {
    if (showDetailsModal || showEditModal || showDeleteAllModal) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }
    return () => {
      document.body.style.overflow = "unset";
    };
  }, [showDetailsModal, showEditModal, showDeleteAllModal]);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    setMessage(null);

    const formData = new FormData();
    formData.append("archivo", file);

    try {
      const response = await api.post("/ejercicios/leer-excel", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });

      if (response.data.guardados > 0) {
        setMessage({
          type: "success",
          text: `✅ Archivo procesado: ${response.data.guardados} ejercicios guardados exitosamente`,
        });
        fetchEjercicios();
      } else if (response.data.errores > 0) {
        // Mostrar errores detallados
        const erroresTexto =
          response.data.detallesErrores &&
          response.data.detallesErrores.length > 0
            ? response.data.detallesErrores.join("\n")
            : `${response.data.errores} error(es) encontrado(s)`;
        setMessage({
          type: "error",
          text: `❌ No se guardaron ejercicios. ${response.data.errores} error(es):\n${erroresTexto}`,
        });
      } else {
        setMessage({
          type: "error",
          text: "No se procesó ningún ejercicio del archivo",
        });
      }
    } catch (error: any) {
      setMessage({
        type: "error",
        text: error.response?.data?.message || "Error al procesar el archivo",
      });
    } finally {
      setUploading(false);
      e.target.value = "";
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("¿Estás seguro de eliminar este ejercicio?")) return;

    try {
      await api.delete(`/ejercicios/${id}`);
      setMessage({
        type: "success",
        text: "Ejercicio eliminado exitosamente",
      });
      fetchEjercicios();
    } catch (error: any) {
      setMessage({
        type: "error",
        text: error.response?.data?.message || "Error al eliminar",
      });
    }
  };

  const handleEdit = (ejercicio: Ejercicio) => {
    setEditing(ejercicio);
    setFormData({
      nombre: ejercicio.nombre,
      descripcion: ejercicio.descripcion || "",
      videoUrl: ejercicio.videoUrl || "",
      imagenUrl: ejercicio.imagenUrl || "",
      idCategoria: ejercicio.categoria?.idCategoria || "",
      nivelDificultad: ejercicio.nivelDificultad || "sin_nivel",
      tipoEjercicio: ejercicio.tipoEjercicio || "sin_tipo",
      tiposMedicion: ejercicio.tiposMedicion || [],
      repeticiones: ejercicio.repeticiones,
      tiempoSegundos: ejercicio.tiempoSegundos,
      pesoKg: ejercicio.pesoKg,
      musculos: ejercicio.musculos?.map((m) => m.musculo.idMusculo) || [],
      equipos: ejercicio.equipos?.map((e) => e.equipo.idEquipo) || [],
    });
    setShowEditModal(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const data = {
        ...formData,
        idCategoria: formData.idCategoria || undefined,
      };

      if (editing) {
        await api.put(`/ejercicios/${editing.idEjercicio}`, data);
      }

      setShowEditModal(false);
      setEditing(null);
      setFormData({
        nombre: "",
        descripcion: "",
        videoUrl: "",
        imagenUrl: "",
        idCategoria: "",
        nivelDificultad: "sin_nivel",
        tipoEjercicio: "sin_tipo",
        tiposMedicion: [],
        repeticiones: undefined,
        tiempoSegundos: undefined,
        pesoKg: undefined,
        musculos: [],
        equipos: [],
      });
      setMessage({
        type: "success",
        text: "Ejercicio actualizado exitosamente",
      });
      fetchEjercicios();
    } catch (error: any) {
      setMessage({
        type: "error",
        text: error.response?.data?.message || "Error al guardar ejercicio",
      });
    }
  };

  return (
    <Layout>
      <div className="px-4 py-6 sm:px-0">
        <div className="mb-6 flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Ejercicios</h1>
            <p className="mt-2 text-gray-600">
              Gestiona la base de datos de ejercicios
            </p>
          </div>
        </div>

        {message && (
          <div
            className={`mb-4 p-4 rounded-lg ${
              message.type === "success"
                ? "bg-green-50 text-green-800 border border-green-200"
                : "bg-red-50 text-red-800 border border-red-200"
            }`}
          >
            <div className="font-semibold mb-2">
              {message.text.split("\n")[0]}
            </div>
            {message.text.includes("\n") && (
              <div className="mt-2 text-sm whitespace-pre-line">
                {message.text.split("\n").slice(1).join("\n")}
              </div>
            )}
          </div>
        )}

        <div className="bg-white shadow rounded-lg p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">Cargar Archivo Excel</h2>
          <div className="flex items-center space-x-4">
            <label className="cursor-pointer">
              <span className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
                {uploading ? "Cargando..." : "Seleccionar Archivo Excel"}
              </span>
              <input
                type="file"
                accept=".xlsx,.xls"
                onChange={handleFileUpload}
                disabled={uploading}
                className="hidden"
              />
            </label>
            <button
              onClick={() => setShowDeleteAllModal(true)}
              className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
            >
              Eliminar Todos
            </button>
          </div>
        </div>

        <div className="bg-white shadow rounded-lg p-6 mb-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold">
              Lista de Ejercicios ({total})
            </h2>
            <input
              type="text"
              placeholder="Buscar por nombre..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {loading ? (
            <div className="text-center py-8">Cargando...</div>
          ) : ejercicios.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              No hay ejercicios cargados
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Nombre
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Categoría
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Músculos
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Equipos
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Acciones
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {ejercicios.map((ejercicio) => (
                    <tr key={ejercicio.idEjercicio}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {ejercicio.nombre}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {ejercicio.categoria?.nombre || "-"}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-500">
                        {ejercicio.musculos && ejercicio.musculos.length > 0
                          ? ejercicio.musculos
                              .map((m) => m.musculo.nombre)
                              .join(", ")
                          : "-"}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-500">
                        {ejercicio.equipos && ejercicio.equipos.length > 0
                          ? ejercicio.equipos
                              .map((e) => e.equipo.nombre)
                              .join(", ")
                          : "-"}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        <div className="flex space-x-2">
                          <button
                            onClick={() => {
                              setSelectedEjercicio(ejercicio);
                              setShowDetailsModal(true);
                            }}
                            className="text-blue-600 hover:text-blue-800 focus:outline-none"
                            title="Ver detalles"
                          >
                            <svg
                              xmlns="http://www.w3.org/2000/svg"
                              className="h-5 w-5"
                              fill="none"
                              viewBox="0 0 24 24"
                              stroke="currentColor"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                              />
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                              />
                            </svg>
                          </button>
                          <button
                            onClick={() => handleEdit(ejercicio)}
                            className="text-green-600 hover:text-green-800 focus:outline-none"
                            title="Editar"
                          >
                            <svg
                              xmlns="http://www.w3.org/2000/svg"
                              className="h-5 w-5"
                              fill="none"
                              viewBox="0 0 24 24"
                              stroke="currentColor"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                              />
                            </svg>
                          </button>
                          <button
                            onClick={() => handleDelete(ejercicio.idEjercicio)}
                            className="text-red-600 hover:text-red-800 focus:outline-none"
                            title="Eliminar"
                          >
                            <svg
                              xmlns="http://www.w3.org/2000/svg"
                              className="h-5 w-5"
                              fill="none"
                              viewBox="0 0 24 24"
                              stroke="currentColor"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                              />
                            </svg>
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Paginación */}
          {total > itemsPerPage && (
            <div className="mt-6 flex items-center justify-between">
              <div className="text-sm text-gray-700">
                Mostrando{" "}
                <span className="font-medium">
                  {(currentPage - 1) * itemsPerPage + 1}
                </span>{" "}
                a{" "}
                <span className="font-medium">
                  {Math.min(currentPage * itemsPerPage, total)}
                </span>{" "}
                de <span className="font-medium">{total}</span> ejercicios
              </div>
              <div className="flex space-x-2">
                <button
                  onClick={() =>
                    setCurrentPage((prev) => Math.max(1, prev - 1))
                  }
                  disabled={currentPage === 1}
                  className="px-3 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Anterior
                </button>
                {Array.from(
                  { length: Math.ceil(total / itemsPerPage) },
                  (_, i) => i + 1
                )
                  .filter((page) => {
                    // Mostrar primera, última, actual y 2 a cada lado
                    return (
                      page === 1 ||
                      page === Math.ceil(total / itemsPerPage) ||
                      (page >= currentPage - 2 && page <= currentPage + 2)
                    );
                  })
                  .map((page, index, array) => {
                    // Agregar "..." entre páginas no consecutivas
                    const showEllipsis =
                      index > 0 && array[index - 1] !== page - 1;
                    return (
                      <div key={page} className="flex items-center space-x-1">
                        {showEllipsis && (
                          <span className="px-2 text-gray-500">...</span>
                        )}
                        <button
                          onClick={() => setCurrentPage(page)}
                          className={`px-3 py-2 border rounded-lg ${
                            currentPage === page
                              ? "bg-blue-600 text-white border-blue-600"
                              : "border-gray-300 hover:bg-gray-50"
                          }`}
                        >
                          {page}
                        </button>
                      </div>
                    );
                  })}
                <button
                  onClick={() =>
                    setCurrentPage((prev) =>
                      Math.min(Math.ceil(total / itemsPerPage), prev + 1)
                    )
                  }
                  disabled={currentPage >= Math.ceil(total / itemsPerPage)}
                  className="px-3 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Siguiente
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Modal de Detalles */}
        {showDetailsModal && selectedEjercicio && (
          <div 
            className="fixed inset-0 bg-gray-600 bg-opacity-50 z-50 flex items-center justify-center p-4"
            onClick={(e) => {
              if (e.target === e.currentTarget) {
                setShowDetailsModal(false);
                setSelectedEjercicio(null);
              }
            }}
          >
            <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] flex flex-col">
              {/* Header fijo */}
              <div className="flex justify-between items-center p-4 sm:p-6 border-b border-gray-200 flex-shrink-0">
                <h3 className="text-xl sm:text-2xl font-bold text-gray-900 pr-4">
                  {selectedEjercicio.nombre}
                </h3>
                <button
                  onClick={() => {
                    setShowDetailsModal(false);
                    setSelectedEjercicio(null);
                  }}
                  className="text-gray-400 hover:text-gray-600 flex-shrink-0"
                  aria-label="Cerrar"
                >
                  <svg
                    className="h-6 w-6"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                </button>
              </div>

              {/* Contenido scrolleable */}
              <div className="overflow-y-auto flex-1 p-4 sm:p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
                  {/* Información Básica */}
                  <div className="space-y-4">
                    <h4 className="text-base sm:text-lg font-semibold text-gray-700 border-b pb-2">
                      Información Básica
                    </h4>
                    {selectedEjercicio.descripcion && (
                      <div>
                        <p className="text-xs sm:text-sm text-gray-500 mb-1">Descripción</p>
                        <p className="text-sm sm:text-base font-medium break-words">
                          {selectedEjercicio.descripcion}
                        </p>
                      </div>
                    )}
                    {selectedEjercicio.categoria && (
                      <div>
                        <p className="text-xs sm:text-sm text-gray-500 mb-1">Categoría</p>
                        <p className="text-sm sm:text-base font-medium">
                          {selectedEjercicio.categoria.nombre}
                        </p>
                      </div>
                    )}
                    <div>
                      <p className="text-xs sm:text-sm text-gray-500 mb-1">Nivel de Dificultad</p>
                      <p className="text-sm sm:text-base font-medium capitalize">
                        {selectedEjercicio.nivelDificultad === "sin_nivel" 
                          ? "Sin nivel" 
                          : selectedEjercicio.nivelDificultad || "Sin nivel"}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs sm:text-sm text-gray-500 mb-1">Tipo de Ejercicio</p>
                      <p className="text-sm sm:text-base font-medium capitalize">
                        {selectedEjercicio.tipoEjercicio === "sin_tipo" 
                          ? "Sin tipo" 
                          : selectedEjercicio.tipoEjercicio || "Sin tipo"}
                      </p>
                    </div>
                    {selectedEjercicio.tiposMedicion && selectedEjercicio.tiposMedicion.length > 0 && (
                      <div>
                        <p className="text-xs sm:text-sm text-gray-500 mb-2">Tipos de Medición</p>
                        <div className="flex flex-wrap gap-2">
                          {selectedEjercicio.tiposMedicion.map((tipo) => (
                            <span
                              key={tipo}
                              className="px-2 sm:px-3 py-1 bg-purple-100 text-purple-800 rounded-full text-xs sm:text-sm capitalize"
                            >
                              {tipo === "repeticion" ? "Repetición" : tipo === "tiempo" ? "Tiempo" : "Peso"}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                    {selectedEjercicio.tiposMedicion?.includes("repeticion") && selectedEjercicio.repeticiones && (
                      <div>
                        <p className="text-xs sm:text-sm text-gray-500 mb-1">Repeticiones</p>
                        <p className="text-sm sm:text-base font-medium">
                          {selectedEjercicio.repeticiones}
                        </p>
                      </div>
                    )}
                    {selectedEjercicio.tiposMedicion?.includes("tiempo") && selectedEjercicio.tiempoSegundos && (
                      <div>
                        <p className="text-xs sm:text-sm text-gray-500 mb-1">Tiempo</p>
                        <p className="text-sm sm:text-base font-medium">
                          {selectedEjercicio.tiempoSegundos} segundos
                        </p>
                      </div>
                    )}
                    {selectedEjercicio.tiposMedicion?.includes("peso") && selectedEjercicio.pesoKg && (
                      <div>
                        <p className="text-xs sm:text-sm text-gray-500 mb-1">Peso</p>
                        <p className="text-sm sm:text-base font-medium">
                          {selectedEjercicio.pesoKg} kg
                        </p>
                      </div>
                    )}
                    {selectedEjercicio.videoUrl && (
                      <div>
                        <p className="text-xs sm:text-sm text-gray-500 mb-1">URL de Video</p>
                        <a
                          href={selectedEjercicio.videoUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-sm sm:text-base font-medium text-blue-600 hover:underline break-all"
                        >
                          Ver video
                        </a>
                      </div>
                    )}
                    {selectedEjercicio.imagenUrl && (
                      <div>
                        <p className="text-xs sm:text-sm text-gray-500 mb-2">Imagen</p>
                        <img
                          src={selectedEjercicio.imagenUrl}
                          alt={selectedEjercicio.nombre}
                          className="w-full max-w-xs rounded-lg"
                        />
                      </div>
                    )}
                  </div>

                  {/* Músculos y Equipos */}
                  <div className="space-y-4">
                    <h4 className="text-base sm:text-lg font-semibold text-gray-700 border-b pb-2">
                      Músculos y Equipos
                    </h4>
                    <div>
                      <p className="text-xs sm:text-sm text-gray-500 mb-2">Músculos</p>
                      {selectedEjercicio.musculos &&
                      selectedEjercicio.musculos.length > 0 ? (
                        <div className="flex flex-wrap gap-2">
                          {selectedEjercicio.musculos.map((m) => (
                            <span
                              key={m.musculo.idMusculo}
                              className="px-2 sm:px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-xs sm:text-sm"
                            >
                              {m.musculo.nombre}
                            </span>
                          ))}
                        </div>
                      ) : (
                        <p className="text-xs sm:text-sm text-gray-400 italic">
                          No hay músculos asignados
                        </p>
                      )}
                    </div>
                    <div>
                      <p className="text-xs sm:text-sm text-gray-500 mb-2">
                        Equipos / Implementos
                      </p>
                      {selectedEjercicio.equipos &&
                      selectedEjercicio.equipos.length > 0 ? (
                        <div className="flex flex-wrap gap-2">
                          {selectedEjercicio.equipos.map((e) => (
                            <span
                              key={e.equipo.idEquipo}
                              className="px-2 sm:px-3 py-1 bg-green-100 text-green-800 rounded-full text-xs sm:text-sm"
                            >
                              {e.equipo.nombre}
                            </span>
                          ))}
                        </div>
                      ) : (
                        <p className="text-xs sm:text-sm text-gray-400 italic">
                          No hay equipos asignados
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Fechas */}
                  {(selectedEjercicio.createdAt ||
                    selectedEjercicio.updatedAt) && (
                    <div className="space-y-2 md:col-span-2 border-t pt-4">
                      <h4 className="text-base sm:text-lg font-semibold text-gray-700 mb-3">
                        Información del Sistema
                      </h4>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        {selectedEjercicio.createdAt && (
                          <div>
                            <p className="text-xs sm:text-sm text-gray-500 mb-1">
                              Fecha de Creación
                            </p>
                            <p className="text-sm sm:text-base font-medium">
                              {new Date(
                                selectedEjercicio.createdAt
                              ).toLocaleString()}
                            </p>
                          </div>
                        )}
                        {selectedEjercicio.updatedAt && (
                          <div>
                            <p className="text-xs sm:text-sm text-gray-500 mb-1">
                              Última Actualización
                            </p>
                            <p className="text-sm sm:text-base font-medium">
                              {new Date(
                                selectedEjercicio.updatedAt
                              ).toLocaleString()}
                            </p>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Footer fijo */}
              <div className="flex justify-end p-4 sm:p-6 border-t border-gray-200 flex-shrink-0">
                <button
                  onClick={() => {
                    setShowDetailsModal(false);
                    setSelectedEjercicio(null);
                  }}
                  className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 text-sm sm:text-base"
                >
                  Cerrar
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Modal de Confirmación Eliminar Todos */}
        {showDeleteAllModal && (
          <div 
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
            onClick={(e) => {
              if (e.target === e.currentTarget) {
                setShowDeleteAllModal(false);
              }
            }}
          >
            <div className="bg-white rounded-lg p-4 sm:p-6 w-full max-w-md">
              <h2 className="text-2xl font-bold mb-4 text-red-600">
                Confirmar Eliminación
              </h2>
              <p className="text-gray-700 mb-6">
                ¿Estás seguro de eliminar <strong>TODOS</strong> los ejercicios?
                Esta acción no se puede deshacer.
              </p>
              <div className="flex space-x-2">
                <button
                  onClick={() => setShowDeleteAllModal(false)}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                >
                  Cancelar
                </button>
                <button
                  onClick={async () => {
                    setShowDeleteAllModal(false);
                    try {
                      await api.delete("/ejercicios/todos");
                      setMessage({
                        type: "success",
                        text: "Todos los ejercicios han sido eliminados exitosamente",
                      });
                      setCurrentPage(1);
                      fetchEjercicios();
                    } catch (error: any) {
                      setMessage({
                        type: "error",
                        text:
                          error.response?.data?.message ||
                          "Error al eliminar los ejercicios",
                      });
                    }
                  }}
                  className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
                >
                  Eliminar Todos
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Modal de Edición */}
        {showEditModal && (
          <div 
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
            onClick={(e) => {
              if (e.target === e.currentTarget) {
                setShowEditModal(false);
                setEditing(null);
                setFormData({
                  nombre: "",
                  descripcion: "",
                  videoUrl: "",
                  imagenUrl: "",
                  idCategoria: "",
                  nivelDificultad: "sin_nivel",
                  tipoEjercicio: "sin_tipo",
                  tiposMedicion: [],
                  repeticiones: undefined,
                  tiempoSegundos: undefined,
                  pesoKg: undefined,
                  musculos: [],
                  equipos: [],
                });
              }
            }}
          >
            <div className="bg-white rounded-lg w-full max-w-2xl max-h-[90vh] flex flex-col">
              <form onSubmit={handleSubmit} className="flex flex-col flex-1 min-h-0">
                <div className="overflow-y-auto flex-1 p-4 sm:p-6">
                  <h2 className="text-xl sm:text-2xl font-bold mb-4">Editar Ejercicio</h2>
                  <div className="space-y-4">
                    <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Nombre *
                  </label>
                  <input
                    type="text"
                    value={formData.nombre}
                    onChange={(e) =>
                      setFormData({ ...formData, nombre: e.target.value })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Descripción
                  </label>
                  <textarea
                    value={formData.descripcion}
                    onChange={(e) =>
                      setFormData({ ...formData, descripcion: e.target.value })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                    rows={3}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    URL de Video
                  </label>
                  <input
                    type="url"
                    value={formData.videoUrl}
                    onChange={(e) =>
                      setFormData({ ...formData, videoUrl: e.target.value })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    URL de Imagen
                  </label>
                  <input
                    type="url"
                    value={formData.imagenUrl}
                    onChange={(e) =>
                      setFormData({ ...formData, imagenUrl: e.target.value })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Categoría
                  </label>
                  <select
                    value={formData.idCategoria}
                    onChange={(e) =>
                      setFormData({ ...formData, idCategoria: e.target.value })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  >
                    <option value="">Sin categoría</option>
                    {categorias.map((cat) => (
                      <option key={cat.idCategoria} value={cat.idCategoria}>
                        {cat.nombre}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Nivel de Dificultad
                  </label>
                  <select
                    value={formData.nivelDificultad}
                    onChange={(e) =>
                      setFormData({ ...formData, nivelDificultad: e.target.value })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  >
                    <option value="sin_nivel">Sin nivel</option>
                    <option value="preparatorio">Preparatorio</option>
                    <option value="intermedio">Intermedio</option>
                    <option value="avanzado">Avanzado</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Tipo de Ejercicio
                  </label>
                  <select
                    value={formData.tipoEjercicio}
                    onChange={(e) =>
                      setFormData({ ...formData, tipoEjercicio: e.target.value })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  >
                    <option value="sin_tipo">Sin tipo</option>
                    <option value="dinamicos">Dinámicos</option>
                    <option value="basicos">Básicos</option>
                    <option value="complementarios">Complementarios</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Tipos de Medición
                  </label>
                  <div className="space-y-2">
                    {["repeticion", "tiempo", "peso"].map((tipo) => (
                      <label
                        key={tipo}
                        className="flex items-center space-x-2"
                      >
                        <input
                          type="checkbox"
                          checked={formData.tiposMedicion.includes(tipo)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setFormData({
                                ...formData,
                                tiposMedicion: [...formData.tiposMedicion, tipo],
                              });
                            } else {
                              setFormData({
                                ...formData,
                                tiposMedicion: formData.tiposMedicion.filter(
                                  (t) => t !== tipo
                                ),
                                // Limpiar campos relacionados si se desmarca
                                repeticiones: tipo === "repeticion" ? undefined : formData.repeticiones,
                                tiempoSegundos: tipo === "tiempo" ? undefined : formData.tiempoSegundos,
                                pesoKg: tipo === "peso" ? undefined : formData.pesoKg,
                              });
                            }
                          }}
                          className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                        />
                        <span className="text-sm text-gray-700 capitalize">
                          {tipo === "repeticion" ? "Repetición" : tipo === "tiempo" ? "Tiempo" : "Peso"}
                        </span>
                      </label>
                    ))}
                  </div>
                </div>
                {formData.tiposMedicion.includes("repeticion") && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Repeticiones
                    </label>
                    <input
                      type="number"
                      min="1"
                      value={formData.repeticiones || ""}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          repeticiones: e.target.value ? parseInt(e.target.value) : undefined,
                        })
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                      placeholder="Ej: 10"
                    />
                  </div>
                )}
                {formData.tiposMedicion.includes("tiempo") && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Tiempo (segundos)
                    </label>
                    <input
                      type="number"
                      min="1"
                      value={formData.tiempoSegundos || ""}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          tiempoSegundos: e.target.value ? parseInt(e.target.value) : undefined,
                        })
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                      placeholder="Ej: 30"
                    />
                  </div>
                )}
                {formData.tiposMedicion.includes("peso") && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Peso (kg)
                    </label>
                    <input
                      type="number"
                      min="0"
                      step="0.1"
                      value={formData.pesoKg || ""}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          pesoKg: e.target.value ? parseFloat(e.target.value) : undefined,
                        })
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                      placeholder="Ej: 20.5"
                    />
                  </div>
                )}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Músculos
                  </label>
                  <div className="border border-gray-300 rounded-lg p-3 max-h-40 overflow-y-auto">
                    {musculos.length === 0 ? (
                      <p className="text-gray-500 text-sm">
                        Cargando músculos...
                      </p>
                    ) : (
                      musculos.map((musculo) => (
                        <label
                          key={musculo.idMusculo}
                          className="flex items-center space-x-2 py-1"
                        >
                          <input
                            type="checkbox"
                            checked={formData.musculos.includes(
                              musculo.idMusculo
                            )}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setFormData({
                                  ...formData,
                                  musculos: [
                                    ...formData.musculos,
                                    musculo.idMusculo,
                                  ],
                                });
                              } else {
                                setFormData({
                                  ...formData,
                                  musculos: formData.musculos.filter(
                                    (id) => id !== musculo.idMusculo
                                  ),
                                });
                              }
                            }}
                            className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                          />
                          <span className="text-sm text-gray-700">
                            {musculo.nombre}
                          </span>
                        </label>
                      ))
                    )}
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Equipos / Implementos
                  </label>
                  <div className="border border-gray-300 rounded-lg p-3 max-h-40 overflow-y-auto">
                    {equipos.length === 0 ? (
                      <p className="text-gray-500 text-sm">
                        Cargando equipos...
                      </p>
                    ) : (
                      equipos.map((equipo) => (
                        <label
                          key={equipo.idEquipo}
                          className="flex items-center space-x-2 py-1"
                        >
                          <input
                            type="checkbox"
                            checked={formData.equipos.includes(equipo.idEquipo)}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setFormData({
                                  ...formData,
                                  equipos: [
                                    ...formData.equipos,
                                    equipo.idEquipo,
                                  ],
                                });
                              } else {
                                setFormData({
                                  ...formData,
                                  equipos: formData.equipos.filter(
                                    (id) => id !== equipo.idEquipo
                                  ),
                                });
                              }
                            }}
                            className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                          />
                          <span className="text-sm text-gray-700">
                            {equipo.nombre}
                          </span>
                        </label>
                      ))
                    )}
                  </div>
                </div>
                  </div>
                </div>
                <div className="flex space-x-2 p-4 sm:p-6 border-t border-gray-200 flex-shrink-0">
                  <button
                    type="button"
                    onClick={() => {
                      setShowEditModal(false);
                      setEditing(null);
                      setFormData({
                        nombre: "",
                        descripcion: "",
                        videoUrl: "",
                        imagenUrl: "",
                        idCategoria: "",
                        nivelDificultad: "sin_nivel",
                        tipoEjercicio: "sin_tipo",
                        tiposMedicion: [],
                        repeticiones: undefined,
                        tiempoSegundos: undefined,
                        pesoKg: undefined,
                        musculos: [],
                        equipos: [],
                      });
                    }}
                    className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 text-sm sm:text-base"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm sm:text-base"
                  >
                    Guardar
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
}
