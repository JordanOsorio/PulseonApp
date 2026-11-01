import { useEffect, useMemo, useState } from "react";
import ConfirmacionModal from "../components/ConfirmacionModal";
import DiagnosticoExcelModal, {
  type ResultadoExcel,
} from "../components/DiagnosticoExcelModal";
import Layout from "../components/Layout";
import MensajeToast from "../components/MensajeToast";
import SelectorArchivo from "../components/SelectorArchivo";
import api from "../services/api";
import { urlMedia } from "../services/media";
import { descargarPlantillaRecetas } from "../services/plantillasExcel";

type NumField = number | "";

type IngredienteForm = {
  key: string;
  modo: "existente" | "nuevo";
  idAlimento: string;
  nombreNuevo: string;
  categoriaNueva: string;
  categoriaEsOtra: boolean;
  cantidad: NumField;
  unidad: string;
  notas: string;
};

type AlimentoOpt = {
  idAlimento: string;
  nombre: string;
  baseUnidad?: string;
  categoria?: { nombre: string };
};

const MOMENTOS = [
  "desayuno",
  "almuerzo",
  "once",
  "cena",
  "snack",
] as const;

type Receta = {
  idReceta: string;
  codigo?: string;
  nombre: string;
  momento?: string;
  descripcion?: string | null;
  porcionDescripcion?: string | null;
  preparacion?: string | null;
  duracionMinutos?: number | null;
  porciones?: number | null;
  kcal?: number;
  proteina?: number;
  carbohidratos?: number;
  grasaTotal?: number;
  grasaSaturada?: number;
  azucares?: number;
  fibra?: number;
  sodio?: number;
  publicado?: boolean;
  imagenStorageUrl?: string | null;
  ingredientes?: Array<{
    idRecetaIngrediente: string;
    cantidad: number;
    unidad: string;
    notas?: string | null;
    alimento: AlimentoOpt;
  }>;
};

const nuevoIngrediente = (): IngredienteForm => ({
  key: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
  modo: "existente",
  idAlimento: "",
  nombreNuevo: "",
  categoriaNueva: "",
  categoriaEsOtra: false,
  cantidad: 100,
  unidad: "g",
  notas: "",
});

const formularioVacio = () => ({
  codigo: "",
  nombre: "",
  momento: "almuerzo",
  descripcion: "",
  porcionDescripcion: "",
  preparacion: "",
  duracionMinutos: "" as NumField,
  porciones: 1 as NumField,
  kcal: "" as NumField,
  proteina: "" as NumField,
  carbohidratos: "" as NumField,
  grasaTotal: "" as NumField,
  grasaSaturada: "" as NumField,
  azucares: "" as NumField,
  fibra: "" as NumField,
  sodio: "" as NumField,
  publicado: true,
  ingredientes: [nuevoIngrediente()] as IngredienteForm[],
});

function numOrUndef(v: NumField): number | undefined {
  if (v === "" || v === undefined || v === null) return undefined;
  const n = Number(v);
  return Number.isFinite(n) ? n : undefined;
}

export default function Recetas() {
  const [recetas, setRecetas] = useState<Receta[]>([]);
  const [alimentos, setAlimentos] = useState<AlimentoOpt[]>([]);
  const [categoriasAlimento, setCategoriasAlimento] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [guardando, setGuardando] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [filtroMomento, setFiltroMomento] = useState("");
  const [message, setMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);
  const [total, setTotal] = useState(0);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<Receta | null>(null);
  const [formData, setFormData] = useState(formularioVacio());
  const [imagenArchivo, setImagenArchivo] = useState<File | null>(null);
  const [quitarImagen, setQuitarImagen] = useState(false);
  const [imagenPreviewLocal, setImagenPreviewLocal] = useState("");
  const [idAEliminar, setIdAEliminar] = useState<string | null>(null);
  const [showDeleteAll, setShowDeleteAll] = useState(false);
  const [filtroAlimento, setFiltroAlimento] = useState("");
  const [showDetails, setShowDetails] = useState(false);
  const [selected, setSelected] = useState<Receta | null>(null);
  const [showExcelModal, setShowExcelModal] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [resultadoExcel, setResultadoExcel] = useState<ResultadoExcel | null>(
    null
  );

  const alimentosFiltrados = useMemo(() => {
    const q = filtroAlimento.trim().toLowerCase();
    if (!q) return alimentos.slice(0, 80);
    return alimentos
      .filter((a) => a.nombre.toLowerCase().includes(q))
      .slice(0, 80);
  }, [alimentos, filtroAlimento]);

  const fetchRecetas = async (opciones?: { silencioso?: boolean }) => {
    if (!opciones?.silencioso) setLoading(true);
    try {
      const params: any = { limit: 100 };
      if (searchTerm.trim()) params.nombre = searchTerm.trim();
      if (filtroMomento) params.momento = filtroMomento;
      const { data } = await api.get("/recetas", { params });
      setRecetas(data.recetas || []);
      setTotal(data.total || 0);
    } catch (error: any) {
      console.error(error);
      setMessage({
        type: "error",
        text: error.response?.data?.message || "Error al cargar recetas",
      });
    } finally {
      if (!opciones?.silencioso) setLoading(false);
    }
  };

  const fetchAlimentos = async () => {
    try {
      const { data } = await api.get("/alimentos", { params: { limit: 500 } });
      setAlimentos(data.alimentos || []);
    } catch (error) {
      console.error("Error al cargar alimentos:", error);
    }
  };

  const fetchCategoriasAlimento = async () => {
    try {
      const { data } = await api.get("/alimentos/categorias");
      const nombres = (data.categorias || [])
        .map((c: { nombre: string }) => c.nombre)
        .filter(Boolean);
      setCategoriasAlimento(nombres);
    } catch (error) {
      // Fallback: sacar categorías desde alimentos ya cargados
      console.error("Error al cargar categorías de alimentos:", error);
      const fromAlimentos = [
        ...new Set(
          alimentos
            .map((a) => a.categoria?.nombre)
            .filter((n): n is string => Boolean(n))
        ),
      ].sort((a, b) => a.localeCompare(b, "es"));
      setCategoriasAlimento(fromAlimentos);
    }
  };

  useEffect(() => {
    fetchRecetas();
    fetchAlimentos();
    fetchCategoriasAlimento();
  }, []);

  useEffect(() => {
    const t = setTimeout(() => fetchRecetas({ silencioso: true }), 300);
    return () => clearTimeout(t);
  }, [searchTerm, filtroMomento]);

  useEffect(() => {
    if (!imagenArchivo) {
      setImagenPreviewLocal("");
      return;
    }
    const url = URL.createObjectURL(imagenArchivo);
    setImagenPreviewLocal(url);
    return () => URL.revokeObjectURL(url);
  }, [imagenArchivo]);

  const abrirCrear = () => {
    setEditing(null);
    setFormData(formularioVacio());
    setImagenArchivo(null);
    setQuitarImagen(false);
    setFiltroAlimento("");
    setShowForm(true);
  };

  const abrirEditar = (receta: Receta) => {
    setEditing(receta);
    setFormData({
      codigo: receta.codigo || "",
      nombre: receta.nombre || "",
      momento: receta.momento || "almuerzo",
      descripcion: receta.descripcion || "",
      porcionDescripcion: receta.porcionDescripcion || "",
      preparacion: receta.preparacion || "",
      duracionMinutos: receta.duracionMinutos ?? "",
      porciones: receta.porciones ?? 1,
      kcal: receta.kcal ?? "",
      proteina: receta.proteina ?? "",
      carbohidratos: receta.carbohidratos ?? "",
      grasaTotal: receta.grasaTotal ?? "",
      grasaSaturada: receta.grasaSaturada ?? "",
      azucares: receta.azucares ?? "",
      fibra: receta.fibra ?? "",
      sodio: receta.sodio ?? "",
      publicado: receta.publicado !== false,
      ingredientes:
        receta.ingredientes && receta.ingredientes.length > 0
          ? receta.ingredientes.map((ing) => ({
              key: ing.idRecetaIngrediente,
              modo: "existente" as const,
              idAlimento: ing.alimento.idAlimento,
              nombreNuevo: "",
              categoriaNueva: "",
              categoriaEsOtra: false,
              cantidad: ing.cantidad,
              unidad: ing.unidad || "g",
              notas: ing.notas || "",
            }))
          : [nuevoIngrediente()],
    });
    setImagenArchivo(null);
    setQuitarImagen(false);
    setFiltroAlimento("");
    setShowForm(true);
  };

  const actualizarIngrediente = (
    key: string,
    patch: Partial<IngredienteForm>
  ) => {
    setFormData((prev) => ({
      ...prev,
      ingredientes: prev.ingredientes.map((ing) =>
        ing.key === key ? { ...ing, ...patch } : ing
      ),
    }));
  };

  const armarPayloadIngredientes = () => {
    return formData.ingredientes.map((ing) => {
      const base = {
        cantidad: Number(ing.cantidad),
        unidad: ing.unidad || "g",
        notas: ing.notas.trim() || undefined,
      };
      if (ing.modo === "nuevo") {
        return {
          ...base,
          nombre: ing.nombreNuevo.trim(),
          categoria: ing.categoriaNueva.trim() || "Otros",
        };
      }
      return { ...base, idAlimento: ing.idAlimento };
    });
  };

  const guardar = async () => {
    if (!formData.nombre.trim()) {
      setMessage({ type: "error", text: "El nombre es obligatorio" });
      return;
    }
    if (!formData.descripcion.trim()) {
      setMessage({ type: "error", text: "La descripción es obligatoria" });
      return;
    }
    if (!formData.porcionDescripcion.trim()) {
      setMessage({
        type: "error",
        text: "La descripción de porción es obligatoria (ej: 1 plato)",
      });
      return;
    }
    for (let i = 0; i < formData.ingredientes.length; i++) {
      const ing = formData.ingredientes[i];
      if (!numOrUndef(ing.cantidad) || Number(ing.cantidad) <= 0) {
        setMessage({
          type: "error",
          text: `Ingrediente #${i + 1}: cantidad inválida`,
        });
        return;
      }
      if (ing.modo === "existente" && !ing.idAlimento) {
        setMessage({
          type: "error",
          text: `Ingrediente #${i + 1}: elegí un alimento o creá uno nuevo`,
        });
        return;
      }
      if (ing.modo === "nuevo" && !ing.nombreNuevo.trim()) {
        setMessage({
          type: "error",
          text: `Ingrediente #${i + 1}: escribí el nombre del alimento nuevo`,
        });
        return;
      }
    }

    setGuardando(true);
    try {
      const body = {
        codigo: formData.codigo.trim() || undefined,
        nombre: formData.nombre.trim(),
        momento: formData.momento,
        descripcion: formData.descripcion.trim(),
        porcionDescripcion: formData.porcionDescripcion.trim(),
        preparacion: formData.preparacion.trim() || undefined,
        duracionMinutos: numOrUndef(formData.duracionMinutos) ?? null,
        porciones: numOrUndef(formData.porciones) ?? 1,
        kcal: numOrUndef(formData.kcal) ?? 0,
        proteina: numOrUndef(formData.proteina) ?? 0,
        carbohidratos: numOrUndef(formData.carbohidratos) ?? 0,
        grasaTotal: numOrUndef(formData.grasaTotal) ?? 0,
        grasaSaturada: numOrUndef(formData.grasaSaturada) ?? 0,
        azucares: numOrUndef(formData.azucares) ?? 0,
        fibra: numOrUndef(formData.fibra) ?? 0,
        sodio: numOrUndef(formData.sodio) ?? 0,
        publicado: formData.publicado,
        ingredientes: armarPayloadIngredientes(),
        ...(editing && quitarImagen ? { imagenStorageUrl: null } : {}),
      };

      let idReceta = editing?.idReceta;
      if (editing) {
        await api.put(`/recetas/${editing.idReceta}`, body);
      } else {
        const { data } = await api.post("/recetas", body);
        idReceta = data.idReceta;
      }

      if (imagenArchivo && idReceta) {
        const fd = new FormData();
        fd.append("imagen", imagenArchivo);
        await api.post(`/recetas/${idReceta}/archivos`, fd, {
          headers: { "Content-Type": "multipart/form-data" },
        });
      }

      setMessage({
        type: "success",
        text: editing ? "Receta actualizada" : "Receta creada",
      });
      setShowForm(false);
      await fetchAlimentos();
      await fetchCategoriasAlimento();
      await fetchRecetas({ silencioso: true });
    } catch (error: any) {
      setMessage({
        type: "error",
        text: error.response?.data?.message || "No se pudo guardar la receta",
      });
    } finally {
      setGuardando(false);
    }
  };

  const eliminar = async () => {
    if (!idAEliminar) return;
    const id = idAEliminar;
    setIdAEliminar(null);
    setRecetas((prev) => prev.filter((r) => r.idReceta !== id));
    setTotal((t) => Math.max(0, t - 1));
    try {
      await api.delete(`/recetas/${id}`);
      setMessage({ type: "success", text: "Receta eliminada" });
    } catch (error: any) {
      setMessage({
        type: "error",
        text: error.response?.data?.message || "Error al eliminar",
      });
      fetchRecetas({ silencioso: true });
    }
  };

  const eliminarTodas = async () => {
    setShowDeleteAll(false);
    try {
      const { data } = await api.delete("/recetas/todos");
      setRecetas([]);
      setTotal(0);
      setMessage({
        type: "success",
        text: `Se eliminaron ${data.eliminados ?? 0} recetas`,
      });
    } catch (error: any) {
      setMessage({
        type: "error",
        text: error.response?.data?.message || "Error al eliminar todas",
      });
    }
  };

  const procesarExcel = async (archivo: File) => {
    setUploading(true);
    setResultadoExcel(null);
    try {
      const fd = new FormData();
      fd.append("archivo", archivo);
      const { data } = await api.post("/recetas/leer-excel", fd, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      setResultadoExcel({
        guardados: data.guardados || 0,
        errores: data.errores || 0,
        total: data.total,
        detallesErrores: data.detallesErrores,
        itemsOk: data.itemsOk,
      });
      if (data.guardados > 0) {
        await fetchAlimentos();
        await fetchCategoriasAlimento();
        await fetchRecetas({ silencioso: true });
      }
    } catch (error: any) {
      setResultadoExcel({
        guardados: 0,
        errores: 1,
        message:
          error.response?.data?.message || "Error al procesar el Excel",
        detallesErrores: [
          error.response?.data?.message || "Error al procesar el Excel",
        ],
      });
    } finally {
      setUploading(false);
    }
  };

  const previewImagen =
    imagenPreviewLocal ||
    (!quitarImagen && editing?.imagenStorageUrl
      ? urlMedia(editing.imagenStorageUrl)
      : "");

  return (
    <Layout>
      <div className="px-4 py-6 sm:px-0">
        <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Recetas / Comidas</h1>
            <p className="mt-1 text-gray-600">
              Creá, editá y eliminá preparaciones. Los ingredientes son
              Alimentos (existentes o nuevos al vuelo).
            </p>
          </div>
          <button
            onClick={abrirCrear}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 text-sm"
          >
            + Nueva receta
          </button>
        </div>

        <div className="bg-white shadow rounded-lg p-6 mb-6">
          <h2 className="text-xl font-semibold mb-2">Cargar Archivo Excel</h2>
          <p className="mb-4 text-sm text-gray-600">
            Descargá la plantilla (Recetas + Opciones). Incluye momento,
            nutrientes de la porción y código. Ingredientes:{" "}
            <code className="text-xs bg-gray-100 px-1 rounded">
              nombre|cantidad|unidad|categoria
            </code>{" "}
            separados por +.
          </p>
          <div className="flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={() => {
                try {
                  descargarPlantillaRecetas();
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
              onClick={() => setShowDeleteAll(true)}
              className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
              disabled={recetas.length === 0}
            >
              Eliminar Todas
            </button>
          </div>
        </div>

        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-xl font-semibold">Lista de Recetas ({total})</h2>
          <div className="flex flex-wrap gap-2">
            <select
              value={filtroMomento}
              onChange={(e) => setFiltroMomento(e.target.value)}
              className="border border-gray-300 rounded-md px-3 py-2 text-sm bg-white"
            >
              <option value="">Todos los momentos</option>
              {MOMENTOS.map((m) => (
                <option key={m} value={m}>
                  {m}
                </option>
              ))}
            </select>
            <input
              type="search"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Buscar por nombre..."
              className="w-full sm:w-64 border border-gray-300 rounded-md px-3 py-2 text-sm"
            />
          </div>
        </div>

        {loading ? (
          <p className="text-gray-500">Cargando...</p>
        ) : recetas.length === 0 ? (
          <div className="bg-white border rounded-lg p-8 text-center text-gray-500">
            Todavía no hay recetas. Creá una como “Tallarines con salsa”.
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {recetas.map((receta) => (
              <div
                key={receta.idReceta}
                className="bg-white border rounded-lg overflow-hidden shadow-sm"
              >
                {receta.imagenStorageUrl ? (
                  <img
                    src={urlMedia(receta.imagenStorageUrl)}
                    alt={receta.nombre}
                    className="w-full h-40 object-cover"
                  />
                ) : (
                  <div className="w-full h-40 bg-amber-50 flex items-center justify-center text-4xl">
                    🍝
                  </div>
                )}
                <div className="p-4">
                  <div className="flex items-start justify-between gap-2">
                    <h3 className="font-semibold text-gray-900">{receta.nombre}</h3>
                    <span className="shrink-0 text-xs px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 capitalize">
                      {receta.momento || "—"}
                    </span>
                  </div>
                  {receta.descripcion && (
                    <p className="text-sm text-gray-600 mt-1 line-clamp-2">
                      {receta.descripcion}
                    </p>
                  )}
                  <p className="text-sm font-medium text-gray-800 mt-2">
                    {Number(receta.kcal ?? 0).toFixed(0)} kcal
                    {receta.porcionDescripcion
                      ? ` · ${receta.porcionDescripcion}`
                      : ""}
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    {receta.duracionMinutos
                      ? `${receta.duracionMinutos} min`
                      : "Sin duración"}
                    {" · "}
                    {receta.ingredientes?.length || 0} ingrediente(s)
                    {receta.publicado === false ? " · borrador" : ""}
                  </p>
                  <ul className="mt-2 text-xs text-gray-600 space-y-0.5 max-h-20 overflow-auto">
                    {(receta.ingredientes || []).slice(0, 5).map((ing) => (
                      <li key={ing.idRecetaIngrediente}>
                        · {ing.cantidad}
                        {ing.unidad} {ing.alimento.nombre}
                      </li>
                    ))}
                  </ul>
                  <div className="mt-4 flex items-center space-x-3">
                    <button
                      type="button"
                      onClick={() => {
                        setSelected(receta);
                        setShowDetails(true);
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
                      type="button"
                      onClick={() => abrirEditar(receta)}
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
                      type="button"
                      onClick={() => setIdAEliminar(receta.idReceta)}
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
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {showForm && (
        <div className="fixed inset-0 z-40 bg-black/40 flex items-start justify-center overflow-y-auto p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl my-8">
            <div className="px-5 py-4 border-b flex justify-between items-center">
              <h2 className="text-lg font-semibold">
                {editing ? "Editar receta" : "Nueva receta"}
              </h2>
              <button
                onClick={() => setShowForm(false)}
                className="text-gray-500 hover:text-gray-800"
              >
                ✕
              </button>
            </div>

            <div className="px-5 py-4 space-y-4 max-h-[75vh] overflow-y-auto">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Nombre *
                  </label>
                  <input
                    value={formData.nombre}
                    onChange={(e) =>
                      setFormData((p) => ({ ...p, nombre: e.target.value }))
                    }
                    className="w-full border rounded-md px-3 py-2 text-sm"
                    placeholder="Tallarines con salsa"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Momento *
                  </label>
                  <select
                    value={formData.momento}
                    onChange={(e) =>
                      setFormData((p) => ({ ...p, momento: e.target.value }))
                    }
                    className="w-full border rounded-md px-3 py-2 text-sm bg-white"
                  >
                    {MOMENTOS.map((m) => (
                      <option key={m} value={m}>
                        {m}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Código
                  </label>
                  <input
                    value={formData.codigo}
                    onChange={(e) =>
                      setFormData((p) => ({ ...p, codigo: e.target.value }))
                    }
                    className="w-full border rounded-md px-3 py-2 text-sm"
                    placeholder="Vacío = se genera solo (almuerzo-tallarines...)"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Porción (descripción) *
                  </label>
                  <input
                    value={formData.porcionDescripcion}
                    onChange={(e) =>
                      setFormData((p) => ({
                        ...p,
                        porcionDescripcion: e.target.value,
                      }))
                    }
                    className="w-full border rounded-md px-3 py-2 text-sm"
                    placeholder="1 plato, 1 bowl, 2 huevos..."
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Descripción *
                </label>
                <textarea
                  value={formData.descripcion}
                  onChange={(e) =>
                    setFormData((p) => ({ ...p, descripcion: e.target.value }))
                  }
                  rows={2}
                  className="w-full border rounded-md px-3 py-2 text-sm"
                  placeholder="Qué es el plato (una línea)"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Preparación
                </label>
                <textarea
                  value={formData.preparacion}
                  onChange={(e) =>
                    setFormData((p) => ({ ...p, preparacion: e.target.value }))
                  }
                  rows={4}
                  className="w-full border rounded-md px-3 py-2 text-sm"
                  placeholder={"1. Paso uno\n2. Paso dos"}
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Duración (min)
                  </label>
                  <input
                    type="number"
                    min={0}
                    value={formData.duracionMinutos}
                    onChange={(e) =>
                      setFormData((p) => ({
                        ...p,
                        duracionMinutos:
                          e.target.value === "" ? "" : Number(e.target.value),
                      }))
                    }
                    className="w-full border rounded-md px-3 py-2 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Porciones (rinde)
                  </label>
                  <input
                    type="number"
                    min={1}
                    value={formData.porciones}
                    onChange={(e) =>
                      setFormData((p) => ({
                        ...p,
                        porciones:
                          e.target.value === "" ? "" : Number(e.target.value),
                      }))
                    }
                    className="w-full border rounded-md px-3 py-2 text-sm"
                  />
                </div>
              </div>

              <div>
                <h3 className="font-medium text-gray-900 mb-1">
                  Nutrientes de esa porción
                </h3>
                <p className="text-xs text-gray-500 mb-2">
                  Valores ya calculados para la porción (la app no recalcula).
                  Sodio en mg; el resto en g.
                </p>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {(
                    [
                      ["kcal", "kcal"],
                      ["proteina", "Proteína (g)"],
                      ["carbohidratos", "Carbos (g)"],
                      ["grasaTotal", "Grasa total (g)"],
                      ["grasaSaturada", "Grasa sat. (g)"],
                      ["azucares", "Azúcares (g)"],
                      ["fibra", "Fibra (g)"],
                      ["sodio", "Sodio (mg)"],
                    ] as const
                  ).map(([key, label]) => (
                    <div key={key}>
                      <label className="block text-xs text-gray-600 mb-0.5">
                        {label}
                      </label>
                      <input
                        type="number"
                        min={0}
                        step="any"
                        value={formData[key]}
                        onChange={(e) =>
                          setFormData((p) => ({
                            ...p,
                            [key]:
                              e.target.value === ""
                                ? ""
                                : Number(e.target.value),
                          }))
                        }
                        className="w-full border rounded-md px-2 py-1.5 text-sm"
                      />
                    </div>
                  ))}
                </div>
              </div>

              <label className="inline-flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={formData.publicado}
                  onChange={(e) =>
                    setFormData((p) => ({
                      ...p,
                      publicado: e.target.checked,
                    }))
                  }
                />
                Publicado (visible en la app)
              </label>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Imagen
                </label>
                {previewImagen && (
                  <img
                    src={previewImagen}
                    alt="Preview"
                    className="h-28 object-cover rounded mb-2"
                  />
                )}
                <SelectorArchivo
                  accept="image/*"
                  archivo={imagenArchivo}
                  texto="Elegir imagen"
                  ayuda="JPG/PNG hasta 6MB"
                  onArchivo={(file) => {
                    setImagenArchivo(file);
                    setQuitarImagen(false);
                  }}
                />
                {editing?.imagenStorageUrl && !quitarImagen && (
                  <button
                    type="button"
                    className="mt-1 text-xs text-red-600"
                    onClick={() => {
                      setQuitarImagen(true);
                      setImagenArchivo(null);
                    }}
                  >
                    Quitar imagen actual
                  </button>
                )}
              </div>

              <div className="border-t pt-4">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-medium text-gray-900">Ingredientes</h3>
                  <button
                    type="button"
                    className="text-sm text-blue-600"
                    onClick={() =>
                      setFormData((p) => ({
                        ...p,
                        ingredientes: [...p.ingredientes, nuevoIngrediente()],
                      }))
                    }
                  >
                    + Agregar
                  </button>
                </div>
                <p className="text-xs text-gray-500 mb-3">
                  Podés elegir un alimento ya cargado o crear uno nuevo (queda
                  disponible también en Alimentos).
                </p>

                <input
                  type="search"
                  value={filtroAlimento}
                  onChange={(e) => setFiltroAlimento(e.target.value)}
                  placeholder="Buscar alimento para agregar (ej: pollo, arroz)..."
                  className="w-full border rounded-md px-3 py-1.5 text-sm mb-1"
                />
                <p className="text-xs text-gray-500 mb-3">
                  Solo acota el desplegable “Elegí un alimento…”. No filtra las
                  recetas de la lista.
                </p>

                <div className="space-y-3">
                  {formData.ingredientes.map((ing, idx) => (
                    <div
                      key={ing.key}
                      className="border rounded-md p-3 bg-gray-50 space-y-2"
                    >
                      <div className="flex justify-between items-center">
                        <span className="text-xs font-medium text-gray-500">
                          #{idx + 1}
                        </span>
                        {formData.ingredientes.length > 1 && (
                          <button
                            type="button"
                            className="text-xs text-red-600"
                            onClick={() =>
                              setFormData((p) => ({
                                ...p,
                                ingredientes: p.ingredientes.filter(
                                  (x) => x.key !== ing.key
                                ),
                              }))
                            }
                          >
                            Quitar
                          </button>
                        )}
                      </div>

                      <div className="flex gap-3 text-sm">
                        <label className="inline-flex items-center gap-1">
                          <input
                            type="radio"
                            checked={ing.modo === "existente"}
                            onChange={() =>
                              actualizarIngrediente(ing.key, {
                                modo: "existente",
                              })
                            }
                          />
                          Existente
                        </label>
                        <label className="inline-flex items-center gap-1">
                          <input
                            type="radio"
                            checked={ing.modo === "nuevo"}
                            onChange={() =>
                              actualizarIngrediente(ing.key, { modo: "nuevo" })
                            }
                          />
                          Crear nuevo
                        </label>
                      </div>

                      {ing.modo === "existente" ? (
                        <select
                          value={ing.idAlimento}
                          onChange={(e) => {
                            const al = alimentos.find(
                              (a) => a.idAlimento === e.target.value
                            );
                            actualizarIngrediente(ing.key, {
                              idAlimento: e.target.value,
                              unidad: al?.baseUnidad || ing.unidad || "g",
                            });
                          }}
                          className="w-full border rounded-md px-2 py-1.5 text-sm bg-white"
                        >
                          <option value="">Elegí un alimento...</option>
                          {alimentosFiltrados.map((a) => (
                            <option key={a.idAlimento} value={a.idAlimento}>
                              {a.nombre}
                              {a.categoria?.nombre
                                ? ` (${a.categoria.nombre})`
                                : ""}
                            </option>
                          ))}
                        </select>
                      ) : (
                        <div className="grid grid-cols-2 gap-2">
                          <input
                            value={ing.nombreNuevo}
                            onChange={(e) =>
                              actualizarIngrediente(ing.key, {
                                nombreNuevo: e.target.value,
                              })
                            }
                            placeholder="Nombre alimento"
                            className="border rounded-md px-2 py-1.5 text-sm"
                          />
                          <select
                            value={
                              ing.categoriaEsOtra
                                ? "__otra__"
                                : ing.categoriaNueva
                            }
                            onChange={(e) => {
                              const v = e.target.value;
                              if (v === "__otra__") {
                                actualizarIngrediente(ing.key, {
                                  categoriaEsOtra: true,
                                  categoriaNueva: "",
                                });
                              } else {
                                actualizarIngrediente(ing.key, {
                                  categoriaEsOtra: false,
                                  categoriaNueva: v,
                                });
                              }
                            }}
                            className="border rounded-md px-2 py-1.5 text-sm bg-white"
                          >
                            <option value="">Elegí categoría...</option>
                            {categoriasAlimento.map((nombre) => (
                              <option key={nombre} value={nombre}>
                                {nombre}
                              </option>
                            ))}
                            <option value="__otra__">Otra (escribir)...</option>
                          </select>
                          {ing.categoriaEsOtra && (
                            <input
                              value={ing.categoriaNueva}
                              onChange={(e) =>
                                actualizarIngrediente(ing.key, {
                                  categoriaNueva: e.target.value,
                                })
                              }
                              placeholder="Nombre de la categoría nueva"
                              className="col-span-2 border rounded-md px-2 py-1.5 text-sm"
                            />
                          )}
                        </div>
                      )}

                      <div className="grid grid-cols-3 gap-2">
                        <input
                          type="number"
                          min={0}
                          step="any"
                          value={ing.cantidad}
                          onChange={(e) =>
                            actualizarIngrediente(ing.key, {
                              cantidad:
                                e.target.value === ""
                                  ? ""
                                  : Number(e.target.value),
                            })
                          }
                          placeholder="Cantidad"
                          className="border rounded-md px-2 py-1.5 text-sm"
                        />
                        <input
                          value={ing.unidad}
                          onChange={(e) =>
                            actualizarIngrediente(ing.key, {
                              unidad: e.target.value,
                            })
                          }
                          placeholder="Unidad"
                          className="border rounded-md px-2 py-1.5 text-sm"
                        />
                        <input
                          value={ing.notas}
                          onChange={(e) =>
                            actualizarIngrediente(ing.key, {
                              notas: e.target.value,
                            })
                          }
                          placeholder="Notas"
                          className="border rounded-md px-2 py-1.5 text-sm"
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="px-5 py-4 border-t flex justify-end gap-2">
              <button
                onClick={() => setShowForm(false)}
                className="px-4 py-2 text-sm text-gray-700"
                disabled={guardando}
              >
                Cancelar
              </button>
              <button
                onClick={guardar}
                disabled={guardando}
                className="px-4 py-2 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
              >
                {guardando ? "Guardando..." : "Guardar"}
              </button>
            </div>
          </div>
        </div>
      )}

      {showDetails && selected && (
        <div className="fixed inset-0 z-40 bg-black/40 flex items-start justify-center overflow-y-auto p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-lg my-8">
            <div className="px-5 py-4 border-b flex justify-between items-center">
              <h2 className="text-lg font-semibold">{selected.nombre}</h2>
              <button
                onClick={() => {
                  setShowDetails(false);
                  setSelected(null);
                }}
                className="text-gray-500"
              >
                ✕
              </button>
            </div>
            <div className="px-5 py-4 space-y-3">
              {selected.imagenStorageUrl && (
                <img
                  src={urlMedia(selected.imagenStorageUrl)}
                  alt={selected.nombre}
                  className="w-full h-48 object-cover rounded"
                />
              )}
              <p className="text-xs text-amber-800 capitalize">
                {selected.momento || "—"}
                {selected.codigo ? ` · ${selected.codigo}` : ""}
              </p>
              {selected.descripcion && (
                <p className="text-sm text-gray-700 whitespace-pre-wrap">
                  {selected.descripcion}
                </p>
              )}
              <p className="text-sm font-medium text-gray-900">
                {Number(selected.kcal ?? 0).toFixed(0)} kcal
                {selected.porcionDescripcion
                  ? ` · ${selected.porcionDescripcion}`
                  : ""}
              </p>
              <p className="text-xs text-gray-500">
                P {Number(selected.proteina ?? 0).toFixed(1)}g · C{" "}
                {Number(selected.carbohidratos ?? 0).toFixed(1)}g · G{" "}
                {Number(selected.grasaTotal ?? 0).toFixed(1)}g · Na{" "}
                {Number(selected.sodio ?? 0).toFixed(0)}mg
              </p>
              <p className="text-sm text-gray-500">
                {selected.duracionMinutos
                  ? `${selected.duracionMinutos} min`
                  : "Sin duración"}
                {" · "}
                {selected.publicado === false ? "Borrador" : "Publicado"}
              </p>
              {selected.preparacion && (
                <div>
                  <h3 className="font-medium text-sm mb-1">Preparación</h3>
                  <p className="text-sm text-gray-700 whitespace-pre-wrap">
                    {selected.preparacion}
                  </p>
                </div>
              )}
              <div>
                <h3 className="font-medium text-sm mb-1">Ingredientes</h3>
                <ul className="text-sm text-gray-700 space-y-1">
                  {(selected.ingredientes || []).map((ing) => (
                    <li key={ing.idRecetaIngrediente}>
                      {ing.cantidad}
                      {ing.unidad} {ing.alimento.nombre}
                      {ing.notas ? ` (${ing.notas})` : ""}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
            <div className="px-5 py-4 border-t flex justify-end gap-2">
              <button
                onClick={() => {
                  setShowDetails(false);
                  abrirEditar(selected);
                }}
                className="px-4 py-2 text-sm bg-blue-600 text-white rounded-md"
              >
                Editar
              </button>
            </div>
          </div>
        </div>
      )}

      <DiagnosticoExcelModal
        abierto={showExcelModal}
        titulo="Cargar recetas desde Excel"
        entidadPlural="recetas"
        tipo="recetas"
        cargando={uploading}
        resultado={resultadoExcel}
        onCerrar={() => {
          setShowExcelModal(false);
          setResultadoExcel(null);
        }}
        onProcesar={procesarExcel}
      />

      <ConfirmacionModal
        abierto={!!idAEliminar}
        titulo="Eliminar receta"
        mensaje="¿Seguro que querés eliminar esta receta? Los alimentos usados como ingredientes no se borran."
        onConfirmar={eliminar}
        onCancelar={() => setIdAEliminar(null)}
      />
      <ConfirmacionModal
        abierto={showDeleteAll}
        titulo="Eliminar todas las recetas"
        mensaje="Se van a borrar todas las recetas. Los alimentos quedan intactos."
        onConfirmar={eliminarTodas}
        onCancelar={() => setShowDeleteAll(false)}
      />
      <MensajeToast mensaje={message} onCerrar={() => setMessage(null)} />
    </Layout>
  );
}
