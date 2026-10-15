import { useEffect, useState } from "react";
import Layout from "../components/Layout";
import SelectorArchivo from "../components/SelectorArchivo";
import api from "../services/api";
import { urlMedia } from "../services/media";

interface Alimento {
  idAlimento: string;
  nombre: string;
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
  const [editingAlimento, setEditingAlimento] = useState<Alimento | null>(null);
  const [imagenArchivo, setImagenArchivo] = useState<File | null>(null);
  const [quitarImagen, setQuitarImagen] = useState(false);
  const [imagenPreviewLocal, setImagenPreviewLocal] = useState("");
  const [guardando, setGuardando] = useState(false);

  const fetchAlimentos = async () => {
    setLoading(true);
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
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAlimentos();
  }, [searchTerm]);

  useEffect(() => {
    if (!imagenArchivo) {
      setImagenPreviewLocal("");
      return;
    }
    const url = URL.createObjectURL(imagenArchivo);
    setImagenPreviewLocal(url);
    return () => URL.revokeObjectURL(url);
  }, [imagenArchivo]);

  const abrirEdicion = (alimento: Alimento) => {
    setEditingAlimento(alimento);
    setImagenArchivo(null);
    setQuitarImagen(false);
  };

  const cerrarEdicion = () => {
    setEditingAlimento(null);
    setImagenArchivo(null);
    setQuitarImagen(false);
  };

  const guardarImagen = async () => {
    if (!editingAlimento) return;
    if (!imagenArchivo && !quitarImagen) {
      cerrarEdicion();
      return;
    }

    setGuardando(true);
    try {
      if (imagenArchivo) {
        const datos = new FormData();
        datos.append("imagen", imagenArchivo);
        await api.post(`/alimentos/${editingAlimento.idAlimento}/imagen`, datos, {
          headers: { "Content-Type": "multipart/form-data" },
        });
      } else if (quitarImagen) {
        await api.delete(`/alimentos/${editingAlimento.idAlimento}/imagen`);
      }
      setMessage({ type: "success", text: "Imagen del alimento actualizada" });
      cerrarEdicion();
      fetchAlimentos();
    } catch (error: any) {
      setMessage({
        type: "error",
        text: error.response?.data?.message || "Error al guardar la imagen",
      });
    } finally {
      setGuardando(false);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    setMessage(null);

    const formData = new FormData();
    formData.append("archivo", file);

    try {
      const response = await api.post("/alimentos/leer-excel", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });

      setMessage({
        type: "success",
        text: `Archivo procesado: ${response.data.guardados} alimentos guardados, ${response.data.errores} errores`,
      });
      fetchAlimentos();
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
        </div>

        {message && (
          <div
            className={`mb-4 p-4 rounded-lg ${
              message.type === "success"
                ? "bg-green-50 text-green-800"
                : "bg-red-50 text-red-800"
            }`}
          >
            {message.text}
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
                          onClick={() => abrirEdicion(alimento)}
                          className="text-green-600 hover:text-green-800 focus:outline-none"
                          title="Editar imagen"
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
          <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
            <div className="relative top-20 mx-auto p-5 border w-11/12 max-w-4xl shadow-lg rounded-md bg-white">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-2xl font-bold text-gray-900">
                  Detalles del Alimento
                </h3>
                <button
                  onClick={() => {
                    setShowDetailsModal(false);
                    setSelectedAlimento(null);
                  }}
                  className="text-gray-400 hover:text-gray-600"
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

              {selectedAlimento.imagenStorageUrl && (
                <img
                  src={urlMedia(selectedAlimento.imagenStorageUrl)}
                  alt={selectedAlimento.nombre}
                  className="mb-6 h-40 w-auto rounded-lg object-cover"
                />
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Información Básica */}
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

                {/* Valores Nutricionales por 100g */}
                <div className="space-y-4">
                  <h4 className="text-lg font-semibold text-gray-700 border-b pb-2">
                    Valores Nutricionales (por 100g)
                  </h4>
                  <div className="grid grid-cols-2 gap-4">
                    {selectedAlimento.kcal !== undefined && (
                      <div>
                        <p className="text-sm text-gray-500">Calorías (kcal)</p>
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
                        <p className="text-sm text-gray-500">Grasa Total (g)</p>
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

                {/* Valores Nutricionales por Porción */}
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
                      {selectedAlimento.grasaTotalPorPorcion !== undefined && (
                        <div>
                          <p className="text-sm text-gray-500">
                            Grasa Total (g)
                          </p>
                          <p className="text-base font-medium">
                            {selectedAlimento.grasaTotalPorPorcion.toFixed(1)}g
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

                {/* Fechas */}
                {(selectedAlimento.createdAt || selectedAlimento.updatedAt) && (
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

              <div className="mt-6 flex justify-end">
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

        {editingAlimento && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
            <div className="w-full max-w-lg rounded-lg bg-white p-6 shadow-lg">
              <h3 className="text-xl font-bold text-gray-900">Imagen del alimento</h3>
              <p className="mt-1 text-sm text-gray-600">{editingAlimento.nombre}</p>
              <p className="mt-3 text-sm text-gray-500">
                La imagen es opcional. Podés cargarla o dejar el alimento sin foto.
              </p>

              <div className="mt-4">
                {!quitarImagen &&
                  (imagenPreviewLocal || editingAlimento.imagenStorageUrl) && (
                    <img
                      src={
                        imagenPreviewLocal ||
                        urlMedia(editingAlimento.imagenStorageUrl)
                      }
                      alt={editingAlimento.nombre}
                      className="mb-3 h-36 w-auto rounded-lg object-cover"
                    />
                  )}
                {quitarImagen && (
                  <p className="mb-3 text-xs text-amber-700">
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
                  (editingAlimento.imagenStorageUrl && !quitarImagen)) && (
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

              <div className="mt-6 flex space-x-2">
                <button
                  type="button"
                  onClick={cerrarEdicion}
                  className="flex-1 rounded-lg border border-gray-300 px-4 py-2 hover:bg-gray-50"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={guardarImagen}
                  disabled={guardando}
                  className="flex-1 rounded-lg bg-blue-600 px-4 py-2 font-medium text-white hover:bg-blue-700 disabled:opacity-60"
                >
                  {guardando ? "Guardando..." : "Guardar"}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
}
