import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import ConfirmacionModal from "../components/ConfirmacionModal";
import DiagnosticoExcelModal, {
  type ResultadoExcel,
} from "../components/DiagnosticoExcelModal";
import Layout from "../components/Layout";
import MensajeToast from "../components/MensajeToast";
import SelectorArchivo from "../components/SelectorArchivo";
import api from "../services/api";
import { urlMedia } from "../services/media";

interface Categoria {
  idCategoria: string;
  nombre: string;
  descripcion?: string;
  imagenUrl?: string;
  imagenStorageUrl?: string | null;
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
  const [imagenArchivo, setImagenArchivo] = useState<File | null>(null);
  const [quitarImagen, setQuitarImagen] = useState(false);
  const [imagenPreviewLocal, setImagenPreviewLocal] = useState("");
  const [guardando, setGuardando] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [showDeleteAllModal, setShowDeleteAllModal] = useState(false);
  const [idAEliminar, setIdAEliminar] = useState<string | null>(null);
  const [showExcelModal, setShowExcelModal] = useState(false);
  const [resultadoExcel, setResultadoExcel] = useState<ResultadoExcel | null>(
    null
  );
  const [message, setMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  useEffect(() => {
    if (!imagenArchivo) {
      setImagenPreviewLocal("");
      return;
    }
    const url = URL.createObjectURL(imagenArchivo);
    setImagenPreviewLocal(url);
    return () => URL.revokeObjectURL(url);
  }, [imagenArchivo]);

  const resetImagenState = () => {
    setImagenArchivo(null);
    setQuitarImagen(false);
    setImagenPreviewLocal("");
  };

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
    resetImagenState();
  };

  const procesarExcel = async (file: File) => {
    setUploading(true);
    setResultadoExcel(null);
    const uploadData = new FormData();
    uploadData.append("archivo", file);

    try {
      const response = await api.post(`${getEndpoint()}/leer-excel`, uploadData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      const data = response.data;
      const items =
        data.itemsOk ||
        (data.categorias || data.musculos || data.equipos || [])
          .map((x: any) => x.nombre)
          .filter(Boolean);
      setResultadoExcel({
        guardados: data.guardados || 0,
        errores: data.errores || 0,
        total: data.total,
        detallesErrores: data.detallesErrores,
        itemsOk: items,
        message:
          data.message ||
          (data.guardados > 0
            ? `Se guardaron ${data.guardados} ${getItemLabel()}(s).`
            : "Revisá los errores y volvé a intentar."),
      });
      if (data.guardados > 0) {
        refreshActiveTab();
      }
    } catch (error: any) {
      const data = error.response?.data;
      if (data && (data.detallesErrores || data.errores != null)) {
        setResultadoExcel({
          guardados: data.guardados || 0,
          errores: data.errores || data.detallesErrores?.length || 1,
          total: data.total,
          detallesErrores: data.detallesErrores || [data.message],
          itemsOk: data.itemsOk,
          message: data.message || "No se pudo procesar el archivo",
        });
      } else {
        throw error;
      }
    } finally {
      setUploading(false);
    }
  };

  const confirmarEliminarTodos = async () => {
    const label = getItemLabel();
    setShowDeleteAllModal(false);
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
    setGuardando(true);
    const esEdicion = Boolean(editing);
    try {
      const endpoint = getEndpoint();
      const idField =
        activeTab === "categorias"
          ? "idCategoria"
          : activeTab === "musculos"
          ? "idMusculo"
          : "idEquipo";

      let idItem = editing ? (editing as any)[idField] : undefined;
      const payload =
        activeTab === "categorias"
          ? {
              nombre: formData.nombre,
              descripcion: formData.descripcion,
              imagenUrl: formData.imagenUrl,
            }
          : formData;

      if (editing) {
        await api.put(`${endpoint}/${idItem}`, payload);
      } else {
        const creado = await api.post(endpoint, payload);
        idItem = creado.data?.[idField];
      }

      if (activeTab === "categorias" && idItem) {
        if (imagenArchivo) {
          const datos = new FormData();
          datos.append("imagen", imagenArchivo);
          await api.post(`/categorias/${idItem}/imagen`, datos, {
            headers: { "Content-Type": "multipart/form-data" },
          });
        } else if (esEdicion && quitarImagen) {
          await api.delete(`/categorias/${idItem}/imagen`);
        }
      }

      setShowModal(false);
      setEditing(null);
      setFormData({
        nombre: "",
        descripcion: "",
        imagenUrl: "",
        iconoUrl: "",
      });
      resetImagenState();
      setMessage({
        type: "success",
        text: esEdicion
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
    } finally {
      setGuardando(false);
    }
  };

  const handleEdit = (item: Categoria | Musculo | Equipo) => {
    setEditing(item);
    resetImagenState();
    setFormData({
      nombre: item.nombre,
      descripcion: item.descripcion || "",
      imagenUrl: (item as Categoria).imagenUrl || "",
      iconoUrl: (item as Musculo | Equipo).iconoUrl || "",
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
      await api.delete(`${getEndpoint()}/${id}`);
      if (activeTab === "categorias") {
        setCategorias((prev) => prev.filter((c) => c.idCategoria !== id));
      } else if (activeTab === "musculos") {
        setMusculos((prev) => prev.filter((m) => m.idMusculo !== id));
      } else {
        setEquipos((prev) => prev.filter((e) => e.idEquipo !== id));
      }
      setMessage({
        type: "success",
        text: `${getItemLabel()} eliminado(a) exitosamente`,
      });
      requestAnimationFrame(() => window.scrollTo(0, scrollY));
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
              resetImagenState();
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

        <MensajeToast
          mensaje={message}
          onCerrar={() => setMessage(null)}
        />

        <div className="bg-white shadow rounded-lg p-6 mb-6">
          <h3 className="text-lg font-semibold mb-4">Carga masiva</h3>
          <div className="flex flex-wrap items-center gap-4">
            <button
              type="button"
              onClick={() => {
                setResultadoExcel(null);
                setShowExcelModal(true);
              }}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              Cargar Excel
            </button>
            <button
              type="button"
              onClick={() => setShowDeleteAllModal(true)}
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
              const storageUrl = (item as Categoria).imagenStorageUrl;
              const imagenUrl = storageUrl
                ? urlMedia(storageUrl)
                : (item as Categoria).imagenUrl ||
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
                      onClick={() => setIdAEliminar(itemId)}
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

        <DiagnosticoExcelModal
          abierto={showExcelModal}
          titulo={`Cargar ${getTitle().toLowerCase()} desde Excel`}
          entidadPlural={getTitle()}
          tipo={
            activeTab === "categorias"
              ? "categorias"
              : activeTab === "musculos"
              ? "musculos"
              : "equipos"
          }
          cargando={uploading}
          resultado={resultadoExcel}
          onCerrar={() => {
            setShowExcelModal(false);
            setResultadoExcel(null);
          }}
          onProcesar={procesarExcel}
        />

        <ConfirmacionModal
          abierto={showDeleteAllModal}
          titulo="Confirmar eliminación"
          mensaje={
            <>
              ¿Estás seguro de eliminar <strong>TODOS</strong> los{" "}
              {getItemLabel()}s? Esta acción no se puede deshacer.
            </>
          }
          textoConfirmar="Eliminar Todos"
          onCancelar={() => setShowDeleteAllModal(false)}
          onConfirmar={confirmarEliminarTodos}
        />

        <ConfirmacionModal
          abierto={Boolean(idAEliminar)}
          titulo="Confirmar eliminación"
          mensaje={`¿Estás seguro de eliminar este ${getItemLabel()}? Esta acción no se puede deshacer.`}
          textoConfirmar="Eliminar"
          onCancelar={() => setIdAEliminar(null)}
          onConfirmar={confirmarEliminarUno}
        />

        {showModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg p-6 w-full max-w-md max-h-[90vh] overflow-y-auto">
              <h2 className="text-2xl font-bold mb-4">
                {editing ? "Editar" : activeTab === "categorias" ? "Nueva" : "Nuevo"}{" "}
                {activeTab === "categorias"
                  ? "Categoría"
                  : activeTab === "musculos"
                  ? "Músculo"
                  : "Equipo"}
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
                  <div className="space-y-3">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Imagen (archivo)
                      </label>
                      <p className="mb-2 text-xs text-gray-500">
                        Podés subir una imagen o, si preferís, pegar una URL abajo.
                      </p>
                      {!quitarImagen &&
                        (imagenPreviewLocal ||
                          (editing as Categoria | null)?.imagenStorageUrl) && (
                          <img
                            src={
                              imagenPreviewLocal ||
                              urlMedia(
                                (editing as Categoria).imagenStorageUrl
                              )
                            }
                            alt={formData.nombre || "Categoría"}
                            className="mb-3 h-36 w-auto rounded-lg object-cover"
                          />
                        )}
                      {quitarImagen && (
                        <p className="mb-2 text-xs text-amber-700">
                          La imagen se quitará al guardar.
                        </p>
                      )}
                      <SelectorArchivo
                        accept="image/jpeg,image/png,image/webp,image/gif"
                        archivo={imagenArchivo}
                        texto="Elegir imagen"
                        ayuda="JPG, PNG, WEBP o GIF. Máximo 5 MB."
                        onArchivo={(archivo) => {
                          setImagenArchivo(archivo);
                          if (archivo) setQuitarImagen(false);
                        }}
                      />
                      {(imagenArchivo ||
                        ((editing as Categoria | null)?.imagenStorageUrl &&
                          !quitarImagen)) && (
                        <button
                          type="button"
                          onClick={() => {
                            setQuitarImagen(true);
                            setImagenArchivo(null);
                          }}
                          className="mt-2 inline-flex items-center rounded-lg border border-red-200 bg-red-50 px-3 py-1.5 text-sm font-medium text-red-700 hover:bg-red-100"
                        >
                          Quitar imagen
                        </button>
                      )}
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        URL de Imagen (opcional)
                      </label>
                      <input
                        type="url"
                        value={formData.imagenUrl}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            imagenUrl: e.target.value,
                          })
                        }
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                        placeholder="https://..."
                      />
                    </div>
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
                      resetImagenState();
                    }}
                    className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    disabled={guardando}
                    className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-60"
                  >
                    {guardando ? "Guardando..." : "Guardar"}
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
