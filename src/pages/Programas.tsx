import { useEffect, useState } from "react";
import ConfirmacionModal from "../components/ConfirmacionModal";
import Layout from "../components/Layout";
import api from "../services/api";

const UBICACIONES = ["HOME", "OUTDOORS", "GYM"] as const;
const NIVELES = ["Beginner", "Intermediate", "Expert"] as const;

const formularioVacio = () => ({
  titulo: "",
  descripcion: "",
  descripcionCompleta: "",
  duracionSemanas: 4,
  frecuenciaSemanal: 3,
  nivelDificultad: "Beginner",
  tipoUbicacion: [] as string[],
  idCategoria: "",
  imagenUrl: "",
  beneficiosTexto: "",
});

interface Categoria {
  idCategoria: string;
  nombre: string;
}

interface Programa {
  idPrograma: string;
  titulo: string;
  descripcion?: string;
  descripcionCompleta?: string;
  nivelDificultad?: string;
  duracionSemanas?: number;
  frecuenciaSemanal?: number;
  tipoUbicacion?: string[];
  imagenUrl?: string;
  beneficios?: string[];
  idCategoria?: string;
  categoria?: {
    idCategoria: string;
    nombre: string;
  };
  entrenamientos?: {
    idEntrenamiento: string;
    nombre: string;
  }[];
}

function parseBeneficios(texto: string): string[] {
  return texto
    .split(/[\n,]+/)
    .map((b) => b.trim())
    .filter(Boolean);
}

export default function Programas() {
  const [programas, setProgramas] = useState<Programa[]>([]);
  const [categorias, setCategorias] = useState<Categoria[]>([]);
  const [loading, setLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<Programa | null>(null);
  const [formData, setFormData] = useState(formularioVacio());
  const [selectedPrograma, setSelectedPrograma] = useState<Programa | null>(
    null
  );
  const [idAEliminar, setIdAEliminar] = useState<string | null>(null);

  const fetchProgramas = async () => {
    setLoading(true);
    try {
      const response = await api.get("/programas", { params: { limit: 100 } });
      setProgramas(response.data.programas || []);
    } catch (error: any) {
      console.error("Error al cargar programas:", error);
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

  useEffect(() => {
    fetchProgramas();
    fetchCategorias();
  }, []);

  useEffect(() => {
    if (showModal || selectedPrograma) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }
    return () => {
      document.body.style.overflow = "unset";
    };
  }, [showModal, selectedPrograma]);

  const abrirNuevo = () => {
    setEditing(null);
    setFormData(formularioVacio());
    setShowModal(true);
  };

  const handleEdit = (programa: Programa) => {
    setEditing(programa);
    setFormData({
      titulo: programa.titulo || "",
      descripcion: programa.descripcion || "",
      descripcionCompleta: programa.descripcionCompleta || "",
      duracionSemanas: programa.duracionSemanas ?? 4,
      frecuenciaSemanal: programa.frecuenciaSemanal ?? 3,
      nivelDificultad: programa.nivelDificultad || "Beginner",
      tipoUbicacion: programa.tipoUbicacion || [],
      idCategoria: programa.categoria?.idCategoria || programa.idCategoria || "",
      imagenUrl: programa.imagenUrl || "",
      beneficiosTexto: (programa.beneficios || []).join("\n"),
    });
    setShowModal(true);
  };

  const confirmarEliminarUno = async () => {
    if (!idAEliminar) return;
    const id = idAEliminar;
    const scrollY = window.scrollY;
    (document.activeElement as HTMLElement | null)?.blur();
    setIdAEliminar(null);
    try {
      await api.delete(`/programas/${id}`);
      setProgramas((prev) => prev.filter((p) => p.idPrograma !== id));
      if (selectedPrograma?.idPrograma === id) {
        setSelectedPrograma(null);
      }
      requestAnimationFrame(() => window.scrollTo(0, scrollY));
    } catch (error: any) {
      alert(error.response?.data?.message || "Error al eliminar el programa");
    }
  };

  const toggleUbicacion = (ubicacion: string) => {
    setFormData((prev) => {
      const yaIncluida = prev.tipoUbicacion.includes(ubicacion);
      return {
        ...prev,
        tipoUbicacion: yaIncluida
          ? prev.tipoUbicacion.filter((u) => u !== ubicacion)
          : [...prev.tipoUbicacion, ubicacion],
      };
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.titulo.trim()) {
      alert("El título es obligatorio");
      return;
    }
    if (!formData.idCategoria) {
      alert("La categoría es obligatoria");
      return;
    }
    if (formData.tipoUbicacion.length === 0) {
      alert("Selecciona al menos un tipo de ubicación");
      return;
    }

    const payload = {
      titulo: formData.titulo.trim(),
      descripcion: formData.descripcion.trim() || undefined,
      descripcionCompleta: formData.descripcionCompleta.trim() || undefined,
      duracionSemanas: Number(formData.duracionSemanas),
      frecuenciaSemanal: Number(formData.frecuenciaSemanal),
      nivelDificultad: formData.nivelDificultad,
      tipoUbicacion: formData.tipoUbicacion,
      equipoNecesario: [] as string[],
      idCategoria: formData.idCategoria,
      imagenUrl: formData.imagenUrl.trim() || undefined,
      beneficios: parseBeneficios(formData.beneficiosTexto),
    };

    try {
      if (editing) {
        await api.put(`/programas/${editing.idPrograma}`, payload);
      } else {
        await api.post("/programas", payload);
      }
      setShowModal(false);
      setEditing(null);
      setFormData(formularioVacio());
      fetchProgramas();
    } catch (error: any) {
      alert(error.response?.data?.message || "Error al guardar el programa");
    }
  };

  const fetchProgramaDetails = async (id: string) => {
    try {
      const response = await api.get(`/programas/${id}`);
      setSelectedPrograma(response.data);
    } catch (error: any) {
      console.error("Error al cargar detalles del programa:", error);
    }
  };

  return (
    <Layout>
      <div className="px-4 py-6 sm:px-0">
        <div className="mb-6 flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Programas</h1>
            <p className="mt-2 text-gray-600">
              Gestiona los programas de entrenamiento
            </p>
          </div>
          <button
            onClick={abrirNuevo}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            + Nuevo programa
          </button>
        </div>

        {loading ? (
          <div className="text-center py-8">Cargando...</div>
        ) : programas.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            No hay programas. Crea el primero con &quot;+ Nuevo programa&quot;.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {programas.map((programa) => (
              <div
                key={programa.idPrograma}
                className="bg-white rounded-lg shadow-md p-6"
              >
                {programa.imagenUrl && (
                  <img
                    src={programa.imagenUrl}
                    alt={programa.titulo}
                    className="w-full h-48 object-cover rounded-lg mb-4 cursor-pointer"
                    onClick={() => fetchProgramaDetails(programa.idPrograma)}
                  />
                )}
                <h3
                  className="text-xl font-semibold mb-2 cursor-pointer hover:text-blue-600"
                  onClick={() => fetchProgramaDetails(programa.idPrograma)}
                >
                  {programa.titulo}
                </h3>
                {programa.descripcion && (
                  <p className="text-gray-600 text-sm mb-4 line-clamp-2">
                    {programa.descripcion}
                  </p>
                )}
                <div className="flex justify-between items-center text-sm text-gray-500 mb-4">
                  {programa.nivelDificultad && (
                    <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded">
                      {programa.nivelDificultad}
                    </span>
                  )}
                  {programa.duracionSemanas != null && (
                    <span>{programa.duracionSemanas} semanas</span>
                  )}
                </div>
                {programa.categoria && (
                  <div className="mb-4 text-sm text-gray-500">
                    {programa.categoria.nombre}
                  </div>
                )}
                <div className="flex space-x-2">
                  <button
                    onClick={() => handleEdit(programa)}
                    className="flex-1 px-3 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                  >
                    Editar
                  </button>
                  <button
                    onClick={() => setIdAEliminar(programa.idPrograma)}
                    className="flex-1 px-3 py-2 bg-red-600 text-white rounded hover:bg-red-700"
                  >
                    Eliminar
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {showModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
              <h2 className="text-2xl font-bold mb-4">
                {editing ? "Editar programa" : "Nuevo programa"}
              </h2>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Título *
                  </label>
                  <input
                    type="text"
                    value={formData.titulo}
                    onChange={(e) =>
                      setFormData({ ...formData, titulo: e.target.value })
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
                    rows={2}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Descripción completa
                  </label>
                  <textarea
                    value={formData.descripcionCompleta}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        descripcionCompleta: e.target.value,
                      })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                    rows={4}
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Duración (semanas) *
                    </label>
                    <input
                      type="number"
                      min={1}
                      max={104}
                      value={formData.duracionSemanas}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          duracionSemanas: Number(e.target.value),
                        })
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Frecuencia semanal *
                    </label>
                    <input
                      type="number"
                      min={1}
                      max={7}
                      value={formData.frecuenciaSemanal}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          frecuenciaSemanal: Number(e.target.value),
                        })
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Nivel de dificultad *
                    </label>
                    <select
                      value={formData.nivelDificultad}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          nivelDificultad: e.target.value,
                        })
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                      required
                    >
                      {NIVELES.map((nivel) => (
                        <option key={nivel} value={nivel}>
                          {nivel}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Categoría *
                    </label>
                    <select
                      value={formData.idCategoria}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          idCategoria: e.target.value,
                        })
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                      required
                    >
                      <option value="">Seleccionar categoría</option>
                      {categorias.map((cat) => (
                        <option key={cat.idCategoria} value={cat.idCategoria}>
                          {cat.nombre}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Tipo de ubicación *
                  </label>
                  <div className="flex flex-wrap gap-4">
                    {UBICACIONES.map((ubicacion) => (
                      <label
                        key={ubicacion}
                        className="inline-flex items-center gap-2 text-sm text-gray-700"
                      >
                        <input
                          type="checkbox"
                          checked={formData.tipoUbicacion.includes(ubicacion)}
                          onChange={() => toggleUbicacion(ubicacion)}
                          className="rounded border-gray-300"
                        />
                        {ubicacion}
                      </label>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    URL de imagen
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
                    Beneficios
                  </label>
                  <textarea
                    value={formData.beneficiosTexto}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        beneficiosTexto: e.target.value,
                      })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                    rows={3}
                    placeholder="Uno por línea o separados por comas"
                  />
                </div>

                <div className="flex space-x-2 pt-2">
                  <button
                    type="button"
                    onClick={() => {
                      setShowModal(false);
                      setEditing(null);
                      setFormData(formularioVacio());
                    }}
                    className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                  >
                    Guardar
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {selectedPrograma && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
              <div className="flex justify-between items-start mb-4">
                <h2 className="text-2xl font-bold">{selectedPrograma.titulo}</h2>
                <button
                  onClick={() => setSelectedPrograma(null)}
                  className="text-gray-500 hover:text-gray-700 text-2xl leading-none"
                >
                  ×
                </button>
              </div>

              {selectedPrograma.imagenUrl && (
                <img
                  src={selectedPrograma.imagenUrl}
                  alt={selectedPrograma.titulo}
                  className="w-full h-64 object-cover rounded-lg mb-4"
                />
              )}

              {selectedPrograma.descripcion && (
                <p className="text-gray-600 mb-4">
                  {selectedPrograma.descripcion}
                </p>
              )}

              {selectedPrograma.descripcionCompleta && (
                <p className="text-gray-600 mb-4 whitespace-pre-wrap">
                  {selectedPrograma.descripcionCompleta}
                </p>
              )}

              <div className="grid grid-cols-2 gap-4 mb-4 text-sm">
                {selectedPrograma.nivelDificultad && (
                  <div>
                    <span className="font-semibold">Nivel:</span>{" "}
                    <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded">
                      {selectedPrograma.nivelDificultad}
                    </span>
                  </div>
                )}
                {selectedPrograma.duracionSemanas != null && (
                  <div>
                    <span className="font-semibold">Duración:</span>{" "}
                    {selectedPrograma.duracionSemanas} semanas
                  </div>
                )}
                {selectedPrograma.frecuenciaSemanal != null && (
                  <div>
                    <span className="font-semibold">Frecuencia:</span>{" "}
                    {selectedPrograma.frecuenciaSemanal}x / semana
                  </div>
                )}
                {selectedPrograma.categoria && (
                  <div>
                    <span className="font-semibold">Categoría:</span>{" "}
                    {selectedPrograma.categoria.nombre}
                  </div>
                )}
              </div>

              {selectedPrograma.tipoUbicacion &&
                selectedPrograma.tipoUbicacion.length > 0 && (
                  <div className="mb-4 text-sm">
                    <span className="font-semibold">Ubicación:</span>{" "}
                    {selectedPrograma.tipoUbicacion.join(", ")}
                  </div>
                )}

              {selectedPrograma.beneficios &&
                selectedPrograma.beneficios.length > 0 && (
                  <div className="mb-4">
                    <h3 className="font-semibold mb-2">Beneficios</h3>
                    <ul className="list-disc list-inside text-sm text-gray-600 space-y-1">
                      {selectedPrograma.beneficios.map((b, i) => (
                        <li key={i}>{b}</li>
                      ))}
                    </ul>
                  </div>
                )}

              {selectedPrograma.entrenamientos &&
                selectedPrograma.entrenamientos.length > 0 && (
                  <div className="mb-4">
                    <h3 className="text-xl font-semibold mb-2">
                      Entrenamientos
                    </h3>
                    <ul className="space-y-2">
                      {selectedPrograma.entrenamientos.map((entrenamiento) => (
                        <li
                          key={entrenamiento.idEntrenamiento}
                          className="text-sm text-gray-700"
                        >
                          {entrenamiento.nombre}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

              <div className="flex space-x-2 mt-4">
                <button
                  onClick={() => {
                    setSelectedPrograma(null);
                    handleEdit(selectedPrograma);
                  }}
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  Editar
                </button>
                <button
                  onClick={() => setSelectedPrograma(null)}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                >
                  Cerrar
                </button>
              </div>
            </div>
          </div>
        )}

        <ConfirmacionModal
          abierto={Boolean(idAEliminar)}
          titulo="Confirmar eliminación"
          mensaje="¿Estás seguro de eliminar este programa? Esta acción no se puede deshacer."
          textoConfirmar="Eliminar"
          onCancelar={() => setIdAEliminar(null)}
          onConfirmar={confirmarEliminarUno}
        />
      </div>
    </Layout>
  );
}
