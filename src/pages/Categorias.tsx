import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import Layout from "../components/Layout";
import api from "../services/api";

interface Categoria {
  idCategoria: string;
  nombre: string;
  descripcion?: string;
  imagenUrl?: string;
}

interface Musculo {
  idMusculo: string;
  nombre: string;
  descripcion?: string;
  iconoUrl?: string;
}

interface Equipo {
  idEquipo: string;
  nombre: string;
  descripcion?: string;
  iconoUrl?: string;
}

type TabType = "categorias" | "musculos" | "equipos";

export default function Categorias() {
  const location = useLocation();
  const navigate = useNavigate();

  // Determinar tab activo desde la URL o query params
  const getActiveTab = (): TabType => {
    const searchParams = new URLSearchParams(location.search);
    const tab = searchParams.get("tab") as TabType;
    return tab && ["categorias", "musculos", "equipos"].includes(tab)
      ? tab
      : "categorias";
  };

  const [activeTab, setActiveTab] = useState<TabType>(getActiveTab());
  const [categorias, setCategorias] = useState<Categoria[]>([]);
  const [musculos, setMusculos] = useState<Musculo[]>([]);
  const [equipos, setEquipos] = useState<Equipo[]>([]);
  const [loading, setLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<Categoria | Musculo | Equipo | null>(
    null
  );
  const [formData, setFormData] = useState({
    nombre: "",
    descripcion: "",
    imagenUrl: "",
    iconoUrl: "",
  });
  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  const getEndpoint = () => {
    if (activeTab === "categorias") return "/categorias";
    if (activeTab === "musculos") return "/musculos";
    return "/equipos";
  };

  const getItemLabel = () => {
    if (activeTab === "categorias") return "categoría";
    if (activeTab === "musculos") return "músculo";
    return "equipo";
  };

  const refreshActiveTab = () => {
    if (activeTab === "categorias") fetchCategorias();
    else if (activeTab === "musculos") fetchMusculos();
    else fetchEquipos();
  };

  const handleTabChange = (tab: TabType) => {
    setActiveTab(tab);
    navigate(`/categorias?tab=${tab}`, { replace: true });
    setEditing(null);
    setShowModal(false);
    setMessage(null);
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    setMessage(null);

    const uploadData = new FormData();
    uploadData.append("archivo", file);

    try {
      const response = await api.post(`${getEndpoint()}/leer-excel`, uploadData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      if (response.data.guardados > 0) {
        setMessage({
          type: "success",
          text: `Archivo procesado: ${response.data.guardados} ${getItemLabel()}(s) guardado(s)`,
        });
        refreshActiveTab();
      } else if (response.data.errores > 0) {
        const erroresTexto =
          response.data.detallesErrores?.length > 0
            ? response.data.detallesErrores.join("\n")
            : `${response.data.errores} error(es)`;
        setMessage({
          type: "error",
          text: `No se guardó nada. ${response.data.errores} error(es):\n${erroresTexto}`,
        });
      } else {
        setMessage({
          type: "error",
          text: "No se procesó ninguna fila del archivo",
        });
      }
    } catch (error: any) {
      const data = error.response?.data;
      const erroresTexto =
        data?.detallesErrores?.length > 0
          ? `\n${data.detallesErrores.join("\n")}`
          : "";
      setMessage({
        type: "error",
        text:
          (data?.message || "Error al procesar el archivo") + erroresTexto,
      });
    } finally {
      setUploading(false);
      e.target.value = "";
    }
  };

  const handleDeleteAll = async () => {
    const label = getItemLabel();
    if (
      !confirm(
        `¿Estás seguro de eliminar TODOS los ${label}s? Esta acción no se puede deshacer.`
      )
    ) {
      return;
    }

    try {
      const response = await api.delete(`${getEndpoint()}/todos`);
      setMessage({
        type: "success",
        text:
          response.data.message ||
          `Todos los ${label}s fueron eliminados (${response.data.eliminados || 0})`,
      });
      refreshActiveTab();
    } catch (error: any) {
      setMessage({
        type: "error",
        text: error.response?.data?.message || "Error al eliminar todos",
      });
    }
  };

  const fetchCategorias = async () => {
    setLoading(true);
    try {
      const response = await api.get("/categorias");
      setCategorias(response.data || []);
    } catch (error: any) {
      console.error("Error al cargar categorías:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchMusculos = async () => {
    setLoading(true);
    try {
      const response = await api.get("/musculos");
      setMusculos(response.data || []);
    } catch (error: any) {
      console.error("Error al cargar músculos:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchEquipos = async () => {
    setLoading(true);
    try {
      const response = await api.get("/equipos");
      setEquipos(response.data || []);
    } catch (error: any) {
      console.error("Error al cargar equipos:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const tab = getActiveTab();
    setActiveTab(tab);
    if (tab === "categorias") {
      fetchCategorias();
    } else if (tab === "musculos") {
      fetchMusculos();
    } else if (tab === "equipos") {
      fetchEquipos();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.search]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const endpoint = getEndpoint();
      const idField =
        activeTab === "categorias"
          ? "idCategoria"
          : activeTab === "musculos"
          ? "idMusculo"
          : "idEquipo";

      if (editing) {
        await api.put(`${endpoint}/${(editing as any)[idField]}`, formData);
      } else {
        await api.post(endpoint, formData);
      }

      setShowModal(false);
      setEditing(null);
      setFormData({
        nombre: "",
        descripcion: "",
        imagenUrl: "",
        iconoUrl: "",
      });
      setMessage({
        type: "success",
        text: editing
          ? `${getItemLabel()} actualizado(a) exitosamente`
          : `${getItemLabel()} creado(a) exitosamente`,
      });
      refreshActiveTab();
    } catch (error: any) {
      setMessage({
        type: "error",
        text:
          error.response?.data?.message || `Error al guardar ${activeTab}`,
      });
    }
  };

  const handleEdit = (item: Categoria | Musculo | Equipo) => {
    setEditing(item);
    setFormData({
      nombre: item.nombre,
      descripcion: item.descripcion || "",
      imagenUrl: (item as Categoria).imagenUrl || "",
      iconoUrl: (item as Musculo | Equipo).iconoUrl || "",
    });
    setShowModal(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm(`¿Estás seguro de eliminar este ${getItemLabel()}?`)) return;

    try {
      await api.delete(`${getEndpoint()}/${id}`);
      setMessage({
        type: "success",
        text: `${getItemLabel()} eliminado(a) exitosamente`,
      });
      refreshActiveTab();
    } catch (error: any) {
      setMessage({
        type: "error",
        text: error.response?.data?.message || "Error al eliminar",
      });
    }
  };

  const getCurrentItems = () => {
    if (activeTab === "categorias") return categorias;
    if (activeTab === "musculos") return musculos;
    return equipos;
  };

  const getItemId = (item: Categoria | Musculo | Equipo) => {
    if (activeTab === "categorias") return (item as Categoria).idCategoria;
    if (activeTab === "musculos") return (item as Musculo).idMusculo;
    return (item as Equipo).idEquipo;
  };

  const getTitle = () => {
    if (activeTab === "categorias") return "Categorías";
    if (activeTab === "musculos") return "Músculos";
    return "Equipos / Implementos";
  };

  const getNewButtonLabel = () => {
    if (activeTab === "categorias") return "+ Nueva Categoría";
    if (activeTab === "musculos") return "+ Nuevo Músculo";
    return "+ Nuevo Equipo";
  };

  return (
    <Layout>
      <div className="px-4 py-6 sm:px-0">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Gestión de Ejercicios
          </h1>
          <p className="text-gray-600 mb-4">
            Gestiona categorías, músculos e implementos
          </p>

          {/* Tabs */}
          <div className="border-b border-gray-200">
            <nav className="-mb-px flex space-x-8">
              <button
                onClick={() => handleTabChange("categorias")}
                className={`py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === "categorias"
                    ? "border-blue-500 text-blue-600"
                    : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                }`}
              >
                Categorías
              </button>
              <button
                onClick={() => handleTabChange("musculos")}
                className={`py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === "musculos"
                    ? "border-blue-500 text-blue-600"
                    : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                }`}
              >
                Músculos
              </button>
              <button
                onClick={() => handleTabChange("equipos")}
                className={`py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === "equipos"
                    ? "border-blue-500 text-blue-600"
                    : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                }`}
              >
                Equipos / Implementos
              </button>
            </nav>
          </div>
        </div>

        <div className="mb-6 flex justify-between items-center">
          <div>
            <h2 className="text-2xl font-semibold text-gray-900">
              {getTitle()}
            </h2>
            <p className="mt-1 text-gray-600">
              {activeTab === "categorias" &&
                "Gestiona las categorías de ejercicios"}
              {activeTab === "musculos" &&
                "Gestiona los músculos trabajados en los ejercicios"}
              {activeTab === "equipos" &&
                "Gestiona los equipos e implementos necesarios para los ejercicios"}
            </p>
          </div>
          <button
            onClick={() => {
              setEditing(null);
              setFormData({
                nombre: "",
                descripcion: "",
                imagenUrl: "",
                iconoUrl: "",
              });
              setShowModal(true);
            }}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            {getNewButtonLabel()}
          </button>
        </div>

        {message && (
          <div
            className={`mb-4 p-4 rounded-lg whitespace-pre-line ${
              message.type === "success"
                ? "bg-green-50 text-green-800 border border-green-200"
                : "bg-red-50 text-red-800 border border-red-200"
            }`}
          >
            {message.text}
          </div>
        )}

        <div className="bg-white shadow rounded-lg p-6 mb-6">
          <h3 className="text-lg font-semibold mb-4">Carga masiva</h3>
          <div className="flex flex-wrap items-center gap-4">
            <label className="cursor-pointer">
              <span className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
                {uploading ? "Cargando..." : "Cargar Excel"}
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
              type="button"
              onClick={handleDeleteAll}
              className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
            >
              Eliminar Todos
            </button>
            <p className="text-sm text-gray-500">
              {activeTab === "categorias" &&
                "Columnas: nombre (req), descripcion, imagenUrl"}
              {activeTab === "musculos" &&
                "Columnas: nombre (req), descripcion, iconoUrl"}
              {activeTab === "equipos" &&
                "Columnas: nombre (req), descripcion, iconoUrl"}
            </p>
          </div>
        </div>

        {loading ? (
          <div className="text-center py-8">Cargando...</div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {getCurrentItems().map((item) => {
              const itemId = getItemId(item);
              const imagenUrl =
                (item as Categoria).imagenUrl ||
                (item as Musculo | Equipo).iconoUrl;

              return (
                <div key={itemId} className="bg-white rounded-lg shadow-md p-6">
                  {imagenUrl && (
                    <img
                      src={imagenUrl}
                      alt={item.nombre}
                      className="w-full h-48 object-cover rounded-lg mb-4"
                    />
                  )}
                  <h3 className="text-xl font-semibold mb-2">{item.nombre}</h3>
                  {item.descripcion && (
                    <p className="text-gray-600 text-sm mb-4">
                      {item.descripcion}
                    </p>
                  )}
                  <div className="flex space-x-2">
                    <button
                      onClick={() => handleEdit(item)}
                      className="flex-1 px-3 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                    >
                      Editar
                    </button>
                    <button
                      onClick={() => handleDelete(itemId)}
                      className="flex-1 px-3 py-2 bg-red-600 text-white rounded hover:bg-red-700"
                    >
                      Eliminar
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {showModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 w-full max-w-md">
              <h2 className="text-2xl font-bold mb-4">
                {editing ? "Editar" : "Nuevo"} {getTitle().slice(0, -1)}
              </h2>
              <form onSubmit={handleSubmit} className="space-y-4">
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
                {activeTab === "categorias" ? (
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
                ) : (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      URL de Icono
                    </label>
                    <input
                      type="url"
                      value={formData.iconoUrl}
                      onChange={(e) =>
                        setFormData({ ...formData, iconoUrl: e.target.value })
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                    />
                  </div>
                )}
                <div className="flex space-x-2">
                  <button
                    type="button"
                    onClick={() => {
                      setShowModal(false);
                      setEditing(null);
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
      </div>
    </Layout>
  );
}
