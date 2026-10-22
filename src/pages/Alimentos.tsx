import { useEffect, useState } from "react";
import ConfirmacionModal from "../components/ConfirmacionModal";
import DiagnosticoExcelModal, {
  type ResultadoExcel,
} from "../components/DiagnosticoExcelModal";
import Layout from "../components/Layout";
import MensajeToast from "../components/MensajeToast";
import SelectorArchivo from "../components/SelectorArchivo";
import api from "../services/api";
import { urlMedia } from "../services/media";
import { descargarPlantillaAlimentos } from "../services/plantillasExcel";

type NumField = number | "";

const formularioVacio = () => ({
  nombre: "",
  categoria: "",
  baseCantidad: 100 as NumField,
  baseUnidad: "g",
  porcionDescripcion: "",
  porcionGramos: "" as NumField,
  kcal: "" as NumField,
  proteina: "" as NumField,
  grasaTotal: "" as NumField,
  grasaSaturada: "" as NumField,
  carbohidratos: "" as NumField,
  azucares: "" as NumField,
  fibra: "" as NumField,
  sodio: "" as NumField,
  kcalPorPorcion: "" as NumField,
  proteinaPorPorcion: "" as NumField,
  grasaTotalPorPorcion: "" as NumField,
  grasaSaturadaPorPorcion: "" as NumField,
  carbohidratosPorPorcion: "" as NumField,
  azucaresPorPorcion: "" as NumField,
  fibraPorPorcion: "" as NumField,
  sodioPorPorcion: "" as NumField,
  dataSource: "",
});

type FormDataAlimento = ReturnType<typeof formularioVacio>;

interface Alimento {
  idAlimento: string;
  nombre: string;
  idCategoriaAlimento?: string;
  categoria?: {
    nombre: string;
  };
  baseCantidad: number;
  baseUnidad: string;
  porcionDescripcion?: string;
  porcionGramos?: number;
  kcal?: number;
  proteina?: number;
  grasaTotal?: number;
  grasaSaturada?: number;
  carbohidratos?: number;
  azucares?: number;
  fibra?: number;
  sodio?: number;
  kcalPorPorcion?: number;
  proteinaPorPorcion?: number;
  grasaTotalPorPorcion?: number;
  grasaSaturadaPorPorcion?: number;
  carbohidratosPorPorcion?: number;
  azucaresPorPorcion?: number;
  fibraPorPorcion?: number;
  sodioPorPorcion?: number;
  dataSource?: string;
  imagenStorageUrl?: string | null;
  createdAt?: string;
  updatedAt?: string;
}

function numOrUndef(v: NumField): number | undefined {
  if (v === "" || v === undefined || v === null) return undefined;
  const n = Number(v);
  return Number.isFinite(n) ? n : undefined;
}

function parseNumInput(value: string): NumField {
  if (value === "") return "";
  const n = Number(value);
  return Number.isFinite(n) ? n : "";
}

export default function Alimentos() {
  const [alimentos, setAlimentos] = useState<Alimento[]>([]);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);
  const [total, setTotal] = useState(0);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedAlimento, setSelectedAlimento] = useState<Alimento | null>(
    null
  );
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteAllModal, setShowDeleteAllModal] = useState(false);
  const [idAEliminar, setIdAEliminar] = useState<string | null>(null);
  const [editing, setEditing] = useState<Alimento | null>(null);
  const [formData, setFormData] = useState<FormDataAlimento>(formularioVacio());
  const [imagenArchivo, setImagenArchivo] = useState<File | null>(null);
  const [quitarImagen, setQuitarImagen] = useState(false);
  const [imagenPreviewLocal, setImagenPreviewLocal] = useState("");
  const [guardando, setGuardando] = useState(false);
  const [mostrarPorcionExtras, setMostrarPorcionExtras] = useState(false);
  const [showExcelModal, setShowExcelModal] = useState(false);
  const [resultadoExcel, setResultadoExcel] = useState<ResultadoExcel | null>(
    null
  );

  const fetchAlimentos = async (opciones?: { silencioso?: boolean }) => {
    if (!opciones?.silencioso) setLoading(true);
    try {
      const params: any = { limit: 100 };
      if (searchTerm) {
        params.nombre = searchTerm;
      }
      const response = await api.get("/alimentos", { params });
      setAlimentos(response.data.alimentos || []);
      setTotal(response.data.total || 0);
    } catch (error: any) {
      setMessage({
        type: "error",
        text: error.response?.data?.message || "Error al cargar alimentos",
      });
    } finally {
      if (!opciones?.silencioso) setLoading(false);
    }
  };

  useEffect(() => {
    fetchAlimentos();
  }, [searchTerm]);

  useEffect(() => {
    const abierto = showDetailsModal || showEditModal || showDeleteAllModal;
    if (!abierto) return;

    const scrollY = window.scrollY;
    document.body.style.position = "fixed";
    document.body.style.top = `-${scrollY}px`;
    document.body.style.left = "0";
    document.body.style.right = "0";
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.position = "";
      document.body.style.top = "";
      document.body.style.left = "";
      document.body.style.right = "";
      document.body.style.overflow = "";
      window.scrollTo(0, scrollY);
    };
  }, [showDetailsModal, showEditModal, showDeleteAllModal]);

  useEffect(() => {
    if (!imagenArchivo) {
      setImagenPreviewLocal("");
      return;
    }
    const url = URL.createObjectURL(imagenArchivo);
    setImagenPreviewLocal(url);
    return () => URL.revokeObjectURL(url);
  }, [imagenArchivo]);

  const cerrarEdicion = () => {
    setShowEditModal(false);
    setEditing(null);
    setFormData(formularioVacio());
    setImagenArchivo(null);
    setQuitarImagen(false);
    setMostrarPorcionExtras(false);
  };

  const abrirNuevo = () => {
    setEditing(null);
    setFormData(formularioVacio());
    setImagenArchivo(null);
    setQuitarImagen(false);
    setMostrarPorcionExtras(false);
    setShowEditModal(true);
  };

  const handleEdit = (alimento: Alimento) => {
    setEditing(alimento);
    setImagenArchivo(null);
    setQuitarImagen(false);
    setFormData({
      nombre: alimento.nombre,
      categoria: alimento.categoria?.nombre || "",
      baseCantidad: alimento.baseCantidad ?? 100,
      baseUnidad: alimento.baseUnidad || "g",
      porcionDescripcion: alimento.porcionDescripcion || "",
      porcionGramos: alimento.porcionGramos ?? "",
      kcal: alimento.kcal ?? "",
      proteina: alimento.proteina ?? "",
      grasaTotal: alimento.grasaTotal ?? "",
      grasaSaturada: alimento.grasaSaturada ?? "",
      carbohidratos: alimento.carbohidratos ?? "",
      azucares: alimento.azucares ?? "",
      fibra: alimento.fibra ?? "",
      sodio: alimento.sodio ?? "",
      kcalPorPorcion: alimento.kcalPorPorcion ?? "",
      proteinaPorPorcion: alimento.proteinaPorPorcion ?? "",
      grasaTotalPorPorcion: alimento.grasaTotalPorPorcion ?? "",
      grasaSaturadaPorPorcion: alimento.grasaSaturadaPorPorcion ?? "",
      carbohidratosPorPorcion: alimento.carbohidratosPorPorcion ?? "",
      azucaresPorPorcion: alimento.azucaresPorPorcion ?? "",
      fibraPorPorcion: alimento.fibraPorPorcion ?? "",
      sodioPorPorcion: alimento.sodioPorPorcion ?? "",
      dataSource: alimento.dataSource || "",
    });
    const tienePorcion =
      alimento.kcalPorPorcion != null ||
      alimento.proteinaPorPorcion != null ||
      alimento.grasaTotalPorPorcion != null ||
      alimento.grasaSaturadaPorPorcion != null ||
      alimento.carbohidratosPorPorcion != null ||
      alimento.azucaresPorPorcion != null ||
      alimento.fibraPorPorcion != null ||
      alimento.sodioPorPorcion != null;
    setMostrarPorcionExtras(!!tienePorcion);
    setShowEditModal(true);
  };

  const buildPayload = () => {
    const payload: Record<string, unknown> = {
      nombre: formData.nombre.trim(),
      categoria: formData.categoria.trim(),
      baseCantidad: numOrUndef(formData.baseCantidad) ?? 100,
      baseUnidad: formData.baseUnidad.trim() || "g",
    };

    const opcionales: Array<[string, NumField | string]> = [
      ["porcionDescripcion", formData.porcionDescripcion],
      ["porcionGramos", formData.porcionGramos],
      ["kcal", formData.kcal],
      ["proteina", formData.proteina],
      ["grasaTotal", formData.grasaTotal],
      ["grasaSaturada", formData.grasaSaturada],
      ["carbohidratos", formData.carbohidratos],
      ["azucares", formData.azucares],
      ["fibra", formData.fibra],
      ["sodio", formData.sodio],
      ["kcalPorPorcion", formData.kcalPorPorcion],
      ["proteinaPorPorcion", formData.proteinaPorPorcion],
      ["grasaTotalPorPorcion", formData.grasaTotalPorPorcion],
      ["grasaSaturadaPorPorcion", formData.grasaSaturadaPorPorcion],
      ["carbohidratosPorPorcion", formData.carbohidratosPorPorcion],
      ["azucaresPorPorcion", formData.azucaresPorPorcion],
      ["fibraPorPorcion", formData.fibraPorPorcion],
      ["sodioPorPorcion", formData.sodioPorPorcion],
      ["dataSource", formData.dataSource],
    ];

    for (const [key, value] of opcionales) {
      if (typeof value === "string") {
        const t = value.trim();
        if (t !== "") payload[key] = t;
      } else {
        const n = numOrUndef(value);
        if (n !== undefined) payload[key] = n;
      }
    }

    return payload;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.nombre.trim() || !formData.categoria.trim()) {
      setMessage({
        type: "error",
        text: "Nombre y categoría son obligatorios",
      });
      return;
    }

    setGuardando(true);
    try {
      const payload = buildPayload();
      let idAlimento: string;

      if (editing) {
        await api.put(`/alimentos/${editing.idAlimento}`, payload);
        idAlimento = editing.idAlimento;

        if (quitarImagen && !imagenArchivo) {
          await api.delete(`/alimentos/${idAlimento}/imagen`);
        }
      } else {
        const response = await api.post("/alimentos", payload);
        idAlimento = response.data.idAlimento;
      }

      if (imagenArchivo) {
        const datos = new FormData();
        datos.append("imagen", imagenArchivo);
        try {
          await api.post(`/alimentos/${idAlimento}/imagen`, datos, {
            headers: { "Content-Type": "multipart/form-data" },
          });
        } catch (error: any) {
          setMessage({
            type: "error",
            text:
              error.response?.data?.message ||
              "Los datos se guardaron, pero no se pudo subir la imagen",
          });
          cerrarEdicion();
          fetchAlimentos();
          return;
        }
      }

      cerrarEdicion();
      setMessage({
        type: "success",
        text: editing
          ? "Alimento actualizado exitosamente"
          : "Alimento creado exitosamente",
      });
      fetchAlimentos();
    } catch (error: any) {
      setMessage({
        type: "error",
        text: error.response?.data?.message || "Error al guardar alimento",
      });
    } finally {
      setGuardando(false);
    }
  };

  const confirmarEliminarUno = async () => {
    if (!idAEliminar) return;
    const id = idAEliminar;
    const scrollY = window.scrollY;
    (document.activeElement as HTMLElement | null)?.blur();
    setIdAEliminar(null);
    try {
      await api.delete(`/alimentos/${id}`);
      setAlimentos((prev) => prev.filter((a) => a.idAlimento !== id));
      setTotal((prev) => Math.max(0, prev - 1));
      setMessage({
        type: "success",
        text: "Alimento eliminado exitosamente",
      });
      requestAnimationFrame(() => window.scrollTo(0, scrollY));
    } catch (error: any) {
      setMessage({
        type: "error",
        text: error.response?.data?.message || "Error al eliminar",
      });
    }
  };

  const confirmarEliminarTodos = async () => {
    setShowDeleteAllModal(false);
    try {
      await api.delete("/alimentos/todos");
      setMessage({
        type: "success",
        text: "Todos los alimentos han sido eliminados exitosamente",
      });
      fetchAlimentos();
    } catch (error: any) {
      setMessage({
        type: "error",
        text:
          error.response?.data?.message || "Error al eliminar los alimentos",
      });
    }
  };

  const procesarExcel = async (file: File) => {
    setUploading(true);
    setResultadoExcel(null);
    const formDataUpload = new FormData();
    formDataUpload.append("archivo", file);

    try {
      const response = await api.post("/alimentos/leer-excel", formDataUpload, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      const data = response.data;
      setResultadoExcel({
        guardados: data.guardados || 0,
        errores: data.errores || 0,
        total: data.total,
        detallesErrores: data.detallesErrores,
        itemsOk:
          data.itemsOk ||
          (data.alimentos || []).map((a: any) => a.nombre).filter(Boolean),
        message:
          data.guardados > 0
            ? `Se guardaron ${data.guardados} alimento(s).`
            : data.message || "Revisá los errores y volvé a intentar.",
      });
      if (data.guardados > 0) {
        fetchAlimentos({ silencioso: true });
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

  const setField = <K extends keyof FormDataAlimento>(
    key: K,
    value: FormDataAlimento[K]
  ) => {
    setFormData((prev) => ({ ...prev, [key]: value }));
  };

  const inputNumber = (
    label: string,
    key: keyof FormDataAlimento,
    step = "any"
  ) => (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">
        {label}
      </label>
      <input
        type="number"
        step={step}
        value={formData[key] as NumField}
        onChange={(e) => setField(key, parseNumInput(e.target.value) as any)}
        className="w-full px-3 py-2 border border-gray-300 rounded-lg"
      />
    </div>
  );

  return (
    <Layout>
      <div className="px-4 py-6 sm:px-0">
        <div className="mb-6 flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Alimentos</h1>
            <p className="mt-2 text-gray-600">
              Gestiona la base de datos de alimentos
            </p>
          </div>
          <button
            onClick={abrirNuevo}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            + Nuevo alimento
          </button>
        </div>

        <MensajeToast
          mensaje={message}
          onCerrar={() => setMessage(null)}
        />

        <div className="bg-white shadow rounded-lg p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">Cargar Archivo Excel</h2>
          <p className="mb-4 text-sm text-gray-600">
            Descargá la plantilla, completá los alimentos (hay un ejemplo y una hoja de
            instrucciones) y después subí el archivo. No cambies los nombres de las columnas.
          </p>
          <div className="flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={() => {
                try {
                  descargarPlantillaAlimentos();
                } catch {
                  setMessage({
                    type: "error",
                    text: "No se pudo descargar la plantilla Excel",
                  });
                }
              }}
              className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
            >
              Descargar plantilla Excel
            </button>
            <button
              type="button"
              onClick={() => {
                setResultadoExcel(null);
                setShowExcelModal(true);
              }}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              Seleccionar Archivo Excel
            </button>
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
              Lista de Alimentos ({total})
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
          ) : alimentos.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              No hay alimentos cargados
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
                      Cantidad Base
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Kcal
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Proteína
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Carbohidratos
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Grasa
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Acciones
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {alimentos.map((alimento) => (
                    <tr key={alimento.idAlimento}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {alimento.nombre}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {alimento.categoria?.nombre || "-"}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {alimento.baseCantidad} {alimento.baseUnidad}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {alimento.kcal?.toFixed(1) || "-"}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {alimento.proteina?.toFixed(1) || "-"}g
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {alimento.carbohidratos?.toFixed(1) || "-"}g
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {alimento.grasaTotal?.toFixed(1) || "-"}g
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        <div className="flex space-x-2">
                          <button
                            onClick={() => {
                              setSelectedAlimento(alimento);
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
                            onClick={() => handleEdit(alimento)}
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
                            onClick={() => setIdAEliminar(alimento.idAlimento)}
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
        </div>

        {/* Modal de Detalles */}
        {showDetailsModal && selectedAlimento && (
          <div
            className="fixed inset-0 bg-gray-600 bg-opacity-50 z-50 flex items-center justify-center p-4"
            onClick={(e) => {
              if (e.target === e.currentTarget) {
                setShowDetailsModal(false);
                setSelectedAlimento(null);
              }
            }}
          >
            <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] flex flex-col">
              <div className="flex justify-between items-center p-4 sm:p-6 border-b border-gray-200 flex-shrink-0">
                <h3 className="text-xl sm:text-2xl font-bold text-gray-900 pr-4">
                  Detalles del Alimento
                </h3>
                <button
                  onClick={() => {
                    setShowDetailsModal(false);
                    setSelectedAlimento(null);
                  }}
                  className="text-gray-400 hover:text-gray-600 flex-shrink-0"
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

              <div className="overflow-y-auto flex-1 p-4 sm:p-6">
                {selectedAlimento.imagenStorageUrl && (
                  <img
                    src={urlMedia(selectedAlimento.imagenStorageUrl)}
                    alt={selectedAlimento.nombre}
                    className="mb-6 h-40 w-auto rounded-lg object-cover"
                  />
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <h4 className="text-lg font-semibold text-gray-700 border-b pb-2">
                      Información Básica
                    </h4>
                    <div>
                      <p className="text-sm text-gray-500">Nombre</p>
                      <p className="text-base font-medium">
                        {selectedAlimento.nombre}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Categoría</p>
                      <p className="text-base font-medium">
                        {selectedAlimento.categoria?.nombre || "-"}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Cantidad Base</p>
                      <p className="text-base font-medium">
                        {selectedAlimento.baseCantidad}{" "}
                        {selectedAlimento.baseUnidad}
                      </p>
                    </div>
                    {selectedAlimento.porcionDescripcion && (
                      <div>
                        <p className="text-sm text-gray-500">
                          Porción Descripción
                        </p>
                        <p className="text-base font-medium">
                          {selectedAlimento.porcionDescripcion}
                        </p>
                      </div>
                    )}
                    {selectedAlimento.porcionGramos && (
                      <div>
                        <p className="text-sm text-gray-500">Porción (gramos)</p>
                        <p className="text-base font-medium">
                          {selectedAlimento.porcionGramos}g
                        </p>
                      </div>
                    )}
                    {selectedAlimento.dataSource && (
                      <div>
                        <p className="text-sm text-gray-500">Fuente de Datos</p>
                        <p className="text-base font-medium">
                          {selectedAlimento.dataSource}
                        </p>
                      </div>
                    )}
                  </div>

                  <div className="space-y-4">
                    <h4 className="text-lg font-semibold text-gray-700 border-b pb-2">
                      Valores Nutricionales (por 100g)
                    </h4>
                    <div className="grid grid-cols-2 gap-4">
                      {selectedAlimento.kcal !== undefined && (
                        <div>
                          <p className="text-sm text-gray-500">
                            Calorías (kcal)
                          </p>
                          <p className="text-base font-medium">
                            {selectedAlimento.kcal.toFixed(1)}
                          </p>
                        </div>
                      )}
                      {selectedAlimento.proteina !== undefined && (
                        <div>
                          <p className="text-sm text-gray-500">Proteína (g)</p>
                          <p className="text-base font-medium">
                            {selectedAlimento.proteina.toFixed(1)}g
                          </p>
                        </div>
                      )}
                      {selectedAlimento.grasaTotal !== undefined && (
                        <div>
                          <p className="text-sm text-gray-500">
                            Grasa Total (g)
                          </p>
                          <p className="text-base font-medium">
                            {selectedAlimento.grasaTotal.toFixed(1)}g
                          </p>
                        </div>
                      )}
                      {selectedAlimento.grasaSaturada !== undefined && (
                        <div>
                          <p className="text-sm text-gray-500">
                            Grasa Saturada (g)
                          </p>
                          <p className="text-base font-medium">
                            {selectedAlimento.grasaSaturada.toFixed(1)}g
                          </p>
                        </div>
                      )}
                      {selectedAlimento.carbohidratos !== undefined && (
                        <div>
                          <p className="text-sm text-gray-500">
                            Carbohidratos (g)
                          </p>
                          <p className="text-base font-medium">
                            {selectedAlimento.carbohidratos.toFixed(1)}g
                          </p>
                        </div>
                      )}
                      {selectedAlimento.azucares !== undefined && (
                        <div>
                          <p className="text-sm text-gray-500">Azúcares (g)</p>
                          <p className="text-base font-medium">
                            {selectedAlimento.azucares.toFixed(1)}g
                          </p>
                        </div>
                      )}
                      {selectedAlimento.fibra !== undefined && (
                        <div>
                          <p className="text-sm text-gray-500">Fibra (g)</p>
                          <p className="text-base font-medium">
                            {selectedAlimento.fibra.toFixed(1)}g
                          </p>
                        </div>
                      )}
                      {selectedAlimento.sodio !== undefined && (
                        <div>
                          <p className="text-sm text-gray-500">Sodio (mg)</p>
                          <p className="text-base font-medium">
                            {selectedAlimento.sodio.toFixed(1)}mg
                          </p>
                        </div>
                      )}
                    </div>
                  </div>

                  {(selectedAlimento.kcalPorPorcion !== undefined ||
                    selectedAlimento.proteinaPorPorcion !== undefined ||
                    selectedAlimento.grasaTotalPorPorcion !== undefined) && (
                    <div className="space-y-4 md:col-span-2">
                      <div className="border-b pb-2">
                        <h4 className="text-lg font-semibold text-gray-700">
                          Valores Nutricionales (por Porción)
                        </h4>
                        {selectedAlimento.porcionGramos && (
                          <p className="text-sm text-gray-500 mt-1">
                            Porción: {selectedAlimento.porcionGramos}g
                          </p>
                        )}
                      </div>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        {selectedAlimento.kcalPorPorcion !== undefined && (
                          <div>
                            <p className="text-sm text-gray-500">
                              Calorías (kcal)
                            </p>
                            <p className="text-base font-medium">
                              {selectedAlimento.kcalPorPorcion.toFixed(1)}
                            </p>
                          </div>
                        )}
                        {selectedAlimento.proteinaPorPorcion !== undefined && (
                          <div>
                            <p className="text-sm text-gray-500">Proteína (g)</p>
                            <p className="text-base font-medium">
                              {selectedAlimento.proteinaPorPorcion.toFixed(1)}g
                            </p>
                          </div>
                        )}
                        {selectedAlimento.grasaTotalPorPorcion !==
                          undefined && (
                          <div>
                            <p className="text-sm text-gray-500">
                              Grasa Total (g)
                            </p>
                            <p className="text-base font-medium">
                              {selectedAlimento.grasaTotalPorPorcion.toFixed(
                                1
                              )}
                              g
                            </p>
                          </div>
                        )}
                        {selectedAlimento.grasaSaturadaPorPorcion !==
                          undefined && (
                          <div>
                            <p className="text-sm text-gray-500">
                              Grasa Saturada (g)
                            </p>
                            <p className="text-base font-medium">
                              {selectedAlimento.grasaSaturadaPorPorcion.toFixed(
                                1
                              )}
                              g
                            </p>
                          </div>
                        )}
                        {selectedAlimento.carbohidratosPorPorcion !==
                          undefined && (
                          <div>
                            <p className="text-sm text-gray-500">
                              Carbohidratos (g)
                            </p>
                            <p className="text-base font-medium">
                              {selectedAlimento.carbohidratosPorPorcion.toFixed(
                                1
                              )}
                              g
                            </p>
                          </div>
                        )}
                        {selectedAlimento.azucaresPorPorcion !== undefined && (
                          <div>
                            <p className="text-sm text-gray-500">Azúcares (g)</p>
                            <p className="text-base font-medium">
                              {selectedAlimento.azucaresPorPorcion.toFixed(1)}g
                            </p>
                          </div>
                        )}
                        {selectedAlimento.fibraPorPorcion !== undefined && (
                          <div>
                            <p className="text-sm text-gray-500">Fibra (g)</p>
                            <p className="text-base font-medium">
                              {selectedAlimento.fibraPorPorcion.toFixed(1)}g
                            </p>
                          </div>
                        )}
                        {selectedAlimento.sodioPorPorcion !== undefined && (
                          <div>
                            <p className="text-sm text-gray-500">Sodio (mg)</p>
                            <p className="text-base font-medium">
                              {selectedAlimento.sodioPorPorcion.toFixed(1)}mg
                            </p>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {(selectedAlimento.createdAt ||
                    selectedAlimento.updatedAt) && (
                    <div className="space-y-2 md:col-span-2 border-t pt-4">
                      <h4 className="text-lg font-semibold text-gray-700">
                        Información del Sistema
                      </h4>
                      <div className="grid grid-cols-2 gap-4">
                        {selectedAlimento.createdAt && (
                          <div>
                            <p className="text-sm text-gray-500">
                              Fecha de Creación
                            </p>
                            <p className="text-base font-medium">
                              {new Date(
                                selectedAlimento.createdAt
                              ).toLocaleString()}
                            </p>
                          </div>
                        )}
                        {selectedAlimento.updatedAt && (
                          <div>
                            <p className="text-sm text-gray-500">
                              Última Actualización
                            </p>
                            <p className="text-base font-medium">
                              {new Date(
                                selectedAlimento.updatedAt
                              ).toLocaleString()}
                            </p>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              <div className="flex justify-end p-4 sm:p-6 border-t border-gray-200 flex-shrink-0">
                <button
                  onClick={() => {
                    setShowDetailsModal(false);
                    setSelectedAlimento(null);
                  }}
                  className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700"
                >
                  Cerrar
                </button>
              </div>
            </div>
          </div>
        )}

        <DiagnosticoExcelModal
          abierto={showExcelModal}
          titulo="Cargar alimentos desde Excel"
          entidadPlural="Alimentos"
          tipo="alimentos"
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
              ¿Estás seguro de eliminar <strong>TODOS</strong> los alimentos?
              Esta acción no se puede deshacer.
            </>
          }
          textoConfirmar="Eliminar Todos"
          onCancelar={() => setShowDeleteAllModal(false)}
          onConfirmar={confirmarEliminarTodos}
        />

        <ConfirmacionModal
          abierto={Boolean(idAEliminar)}
          titulo="Confirmar eliminación"
          mensaje="¿Estás seguro de eliminar este alimento? Esta acción no se puede deshacer."
          textoConfirmar="Eliminar"
          onCancelar={() => setIdAEliminar(null)}
          onConfirmar={confirmarEliminarUno}
        />

        {/* Modal Crear / Editar */}
        {showEditModal && (
          <div
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
            onClick={(e) => {
              if (e.target === e.currentTarget) {
                cerrarEdicion();
              }
            }}
          >
            <div className="bg-white rounded-lg w-full max-w-2xl max-h-[90vh] flex flex-col">
              <form
                onSubmit={handleSubmit}
                className="flex flex-col flex-1 min-h-0"
              >
                <div className="overflow-y-auto flex-1 p-4 sm:p-6">
                  <h2 className="text-xl sm:text-2xl font-bold mb-4">
                    {editing ? "Editar Alimento" : "Nuevo Alimento"}
                  </h2>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Nombre *
                      </label>
                      <input
                        type="text"
                        value={formData.nombre}
                        onChange={(e) => setField("nombre", e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Categoría *
                      </label>
                      <input
                        type="text"
                        value={formData.categoria}
                        onChange={(e) => setField("categoria", e.target.value)}
                        placeholder="Ej: Frutas, Lácteos..."
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                        required
                      />
                      <p className="mt-1 text-xs text-gray-500">
                        Texto libre: el API busca o crea la categoría.
                      </p>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Cantidad base
                        </label>
                        <input
                          type="number"
                          step="any"
                          value={formData.baseCantidad}
                          onChange={(e) =>
                            setField(
                              "baseCantidad",
                              parseNumInput(e.target.value)
                            )
                          }
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Unidad base
                        </label>
                        <input
                          type="text"
                          value={formData.baseUnidad}
                          onChange={(e) =>
                            setField("baseUnidad", e.target.value)
                          }
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                        />
                      </div>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Descripción de porción
                        </label>
                        <input
                          type="text"
                          value={formData.porcionDescripcion}
                          onChange={(e) =>
                            setField("porcionDescripcion", e.target.value)
                          }
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                        />
                      </div>
                      {inputNumber("Porción (gramos)", "porcionGramos")}
                    </div>

                    <div>
                      <h3 className="text-sm font-semibold text-gray-700 border-b pb-2 mb-3">
                        Valores nutricionales (base)
                      </h3>
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                        {inputNumber("Kcal", "kcal")}
                        {inputNumber("Proteína", "proteina")}
                        {inputNumber("Grasa total", "grasaTotal")}
                        {inputNumber("Grasa saturada", "grasaSaturada")}
                        {inputNumber("Carbohidratos", "carbohidratos")}
                        {inputNumber("Azúcares", "azucares")}
                        {inputNumber("Fibra", "fibra")}
                        {inputNumber("Sodio", "sodio")}
                      </div>
                    </div>

                    <div>
                      <button
                        type="button"
                        onClick={() =>
                          setMostrarPorcionExtras((v) => !v)
                        }
                        className="text-sm font-medium text-blue-600 hover:text-blue-800"
                      >
                        {mostrarPorcionExtras
                          ? "▾ Ocultar valores por porción"
                          : "▸ Valores por porción (opcionales)"}
                      </button>
                      {mostrarPorcionExtras && (
                        <div className="mt-3 grid grid-cols-2 sm:grid-cols-4 gap-3">
                          {inputNumber("Kcal / porción", "kcalPorPorcion")}
                          {inputNumber(
                            "Proteína / porción",
                            "proteinaPorPorcion"
                          )}
                          {inputNumber(
                            "Grasa total / porción",
                            "grasaTotalPorPorcion"
                          )}
                          {inputNumber(
                            "Grasa sat. / porción",
                            "grasaSaturadaPorPorcion"
                          )}
                          {inputNumber(
                            "Carbos / porción",
                            "carbohidratosPorPorcion"
                          )}
                          {inputNumber(
                            "Azúcares / porción",
                            "azucaresPorPorcion"
                          )}
                          {inputNumber("Fibra / porción", "fibraPorPorcion")}
                          {inputNumber("Sodio / porción", "sodioPorPorcion")}
                        </div>
                      )}
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Fuente de datos
                      </label>
                      <input
                        type="text"
                        value={formData.dataSource}
                        onChange={(e) => setField("dataSource", e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Imagen{" "}
                        <span className="font-normal text-gray-500">
                          (opcional)
                        </span>
                      </label>
                      {!quitarImagen &&
                        (imagenPreviewLocal ||
                          editing?.imagenStorageUrl) && (
                          <img
                            src={
                              imagenPreviewLocal ||
                              urlMedia(editing?.imagenStorageUrl)
                            }
                            alt={formData.nombre || "Alimento"}
                            className="mb-2 h-32 w-auto rounded-lg object-cover"
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
                        (editing?.imagenStorageUrl && !quitarImagen)) && (
                        <button
                          type="button"
                          onClick={() => {
                            setQuitarImagen(true);
                            setImagenArchivo(null);
                          }}
                          className="mt-3 inline-flex items-center rounded-lg border border-red-200 bg-red-50 px-3 py-1.5 text-sm font-medium text-red-700 hover:bg-red-100"
                        >
                          Quitar imagen
                        </button>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex space-x-2 p-4 sm:p-6 border-t border-gray-200 flex-shrink-0">
                  <button
                    type="button"
                    onClick={cerrarEdicion}
                    className="flex-1 rounded-lg border border-gray-300 px-4 py-2 hover:bg-gray-50"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    disabled={guardando}
                    className="flex-1 rounded-lg bg-blue-600 px-4 py-2 font-medium text-white hover:bg-blue-700 disabled:opacity-60"
                  >
                    {guardando
                      ? "Guardando..."
                      : editing
                        ? "Guardar cambios"
                        : "Crear alimento"}
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
