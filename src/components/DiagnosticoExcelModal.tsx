import { useRef, useState } from "react";
import {
  analizarExcelPrevio,
  type PreDiagnosticoExcel,
  type TipoPlantillaExcel,
} from "../services/analizarExcelPrevio";

export interface ResultadoExcel {
  guardados: number;
  errores: number;
  total?: number;
  detallesErrores?: string[];
  itemsOk?: string[];
  message?: string;
}

interface DiagnosticoExcelModalProps {
  abierto: boolean;
  titulo: string;
  entidadPlural: string;
  tipo: TipoPlantillaExcel;
  cargando: boolean;
  resultado: ResultadoExcel | null;
  onCerrar: () => void;
  onProcesar: (archivo: File) => Promise<void>;
}

export default function DiagnosticoExcelModal({
  abierto,
  titulo,
  entidadPlural,
  tipo,
  cargando,
  resultado,
  onCerrar,
  onProcesar,
}: DiagnosticoExcelModalProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [archivo, setArchivo] = useState<File | null>(null);
  const [errorLocal, setErrorLocal] = useState<string | null>(null);
  const [analizando, setAnalizando] = useState(false);
  const [preDiagnostico, setPreDiagnostico] =
    useState<PreDiagnosticoExcel | null>(null);

  if (!abierto) return null;

  const resetYCerrar = () => {
    setArchivo(null);
    setErrorLocal(null);
    setPreDiagnostico(null);
    setAnalizando(false);
    if (inputRef.current) inputRef.current.value = "";
    onCerrar();
  };

  const analizarArchivo = async (file: File) => {
    setArchivo(file);
    setErrorLocal(null);
    setPreDiagnostico(null);
    setAnalizando(true);
    try {
      const prev = await analizarExcelPrevio(file, tipo);
      setPreDiagnostico(prev);
    } catch (error: any) {
      setErrorLocal(
        error?.message || "No se pudo leer el Excel para el diagnóstico previo"
      );
      setPreDiagnostico(null);
    } finally {
      setAnalizando(false);
    }
  };

  const handleProcesar = async () => {
    if (!archivo) {
      setErrorLocal("Seleccioná un archivo Excel primero");
      return;
    }
    if (preDiagnostico && !preDiagnostico.puedeProcesar) {
      setErrorLocal(
        "El diagnóstico previo indica problemas bloqueantes. Corregí el archivo antes de procesar."
      );
      return;
    }
    setErrorLocal(null);
    try {
      await onProcesar(archivo);
    } catch (error: any) {
      setErrorLocal(
        error?.response?.data?.message ||
          error?.message ||
          "Error al procesar el archivo"
      );
    }
  };

  const total =
    resultado?.total ??
    (resultado ? resultado.guardados + resultado.errores : 0);
  const exito =
    resultado && resultado.guardados > 0 && resultado.errores === 0;
  const parcial =
    resultado && resultado.guardados > 0 && resultado.errores > 0;
  const fallo =
    resultado &&
    resultado.guardados === 0 &&
    (resultado.errores > 0 || total === 0);

  const colorPre =
    preDiagnostico?.estado === "ok"
      ? "border-green-200 bg-green-50 text-green-800"
      : preDiagnostico?.estado === "advertencia"
      ? "border-amber-200 bg-amber-50 text-amber-900"
      : "border-red-200 bg-red-50 text-red-800";

  return (
    <div
      className="fixed inset-0 z-[70] flex items-center justify-center bg-black/50 p-4"
      onClick={(e) => {
        if (e.target === e.currentTarget && !cargando && !analizando) {
          resetYCerrar();
        }
      }}
    >
      <div className="flex max-h-[90vh] w-full max-w-2xl flex-col rounded-lg bg-white shadow-xl">
        <div className="border-b px-5 py-4">
          <h2 className="text-xl font-bold text-gray-900">{titulo}</h2>
          <p className="mt-1 text-sm text-gray-500">
            Primero revisamos el archivo. Si se ve bien, recién ahí lo
            procesamos.
          </p>
        </div>

        <div className="flex-1 space-y-4 overflow-y-auto px-5 py-4">
          <div className="rounded-lg border border-gray-200 bg-gray-50 p-4">
            <label className="mb-2 block text-sm font-medium text-gray-700">
              Archivo Excel (.xlsx / .xls)
            </label>
            <div className="flex flex-wrap items-center gap-3">
              <button
                type="button"
                disabled={cargando || analizando}
                onClick={() => inputRef.current?.click()}
                className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-60"
              >
                Elegir archivo
              </button>
              <span className="max-w-xs truncate text-sm text-gray-600">
                {archivo ? archivo.name : "Ningún archivo seleccionado"}
              </span>
              <input
                ref={inputRef}
                type="file"
                accept=".xlsx,.xls"
                className="hidden"
                disabled={cargando || analizando}
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) void analizarArchivo(file);
                }}
              />
            </div>
          </div>

          {analizando && (
            <div className="rounded-lg border border-blue-100 bg-blue-50 px-4 py-3 text-sm text-blue-800">
              Analizando archivo…
            </div>
          )}

          {errorLocal && (
            <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
              {errorLocal}
            </div>
          )}

          {preDiagnostico && !resultado && (
            <div className="space-y-3">
              <div className={`rounded-lg border px-4 py-3 ${colorPre}`}>
                <p className="text-base font-semibold">
                  {preDiagnostico.estado === "ok" && "Diagnóstico previo: OK"}
                  {preDiagnostico.estado === "advertencia" &&
                    "Diagnóstico previo: con advertencias"}
                  {preDiagnostico.estado === "error" &&
                    "Diagnóstico previo: no listo"}
                </p>
                <p className="mt-1 text-sm">{preDiagnostico.resumen}</p>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div className="rounded-lg border bg-white p-3 text-center">
                  <p className="text-2xl font-bold text-gray-900">
                    {preDiagnostico.filasTotales}
                  </p>
                  <p className="text-xs text-gray-500">Filas detectadas</p>
                </div>
                <div className="rounded-lg border border-green-100 bg-green-50 p-3 text-center">
                  <p className="text-2xl font-bold text-green-700">
                    {preDiagnostico.filasParecenValidas}
                  </p>
                  <p className="text-xs text-green-700">Parecen OK</p>
                </div>
                <div className="rounded-lg border border-red-100 bg-red-50 p-3 text-center">
                  <p className="text-2xl font-bold text-red-700">
                    {preDiagnostico.filasConProblema}
                  </p>
                  <p className="text-xs text-red-700">Con problemas</p>
                </div>
              </div>

              <div className="rounded-lg border bg-white p-3 text-sm text-gray-700">
                <p>
                  <span className="font-medium">Hoja usada:</span>{" "}
                  {preDiagnostico.hojaUsada}
                  {preDiagnostico.hojas.length > 1 &&
                    ` (también hay: ${preDiagnostico.hojas
                      .filter((h) => h !== preDiagnostico.hojaUsada)
                      .join(", ")})`}
                </p>
                <p className="mt-1">
                  <span className="font-medium">Columnas encontradas:</span>{" "}
                  {preDiagnostico.columnas.length > 0
                    ? preDiagnostico.columnas.join(", ")
                    : "ninguna"}
                </p>
                {preDiagnostico.columnasObligatoriasOk.length > 0 && (
                  <p className="mt-1 text-green-700">
                    Obligatorias OK:{" "}
                    {preDiagnostico.columnasObligatoriasOk.join(", ")}
                  </p>
                )}
                {preDiagnostico.columnasObligatoriasFaltantes.length > 0 && (
                  <p className="mt-1 text-red-700">
                    Obligatorias faltantes:{" "}
                    {preDiagnostico.columnasObligatoriasFaltantes.join(", ")}
                  </p>
                )}
                {preDiagnostico.columnasRecomendadasFaltantes.length > 0 && (
                  <p className="mt-1 text-amber-700">
                    Recomendadas faltantes:{" "}
                    {preDiagnostico.columnasRecomendadasFaltantes.join(", ")}
                  </p>
                )}
              </div>

              {preDiagnostico.vistaPrevia.length > 0 && (
                <div className="rounded-lg border">
                  <div className="border-b bg-gray-50 px-3 py-2 text-sm font-semibold text-gray-800">
                    Vista previa de filas
                  </div>
                  <ul className="max-h-40 divide-y overflow-y-auto text-sm">
                    {preDiagnostico.vistaPrevia.map((item) => (
                      <li
                        key={`${item.fila}-${item.nombre}`}
                        className="flex items-start gap-2 px-3 py-2"
                      >
                        <span
                          className={`mt-0.5 inline-block h-2.5 w-2.5 shrink-0 rounded-full ${
                            item.ok ? "bg-green-500" : "bg-red-500"
                          }`}
                        />
                        <div>
                          <p className="font-medium text-gray-900">
                            Fila {item.fila}: {item.nombre}
                          </p>
                          {item.detalle && (
                            <p className="text-red-700">{item.detalle}</p>
                          )}
                        </div>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {preDiagnostico.problemas.length > 0 && (
                <div className="rounded-lg border border-amber-100">
                  <div className="border-b border-amber-100 bg-amber-50 px-3 py-2 text-sm font-semibold text-amber-900">
                    Observaciones del análisis (
                    {preDiagnostico.problemas.length})
                  </div>
                  <ul className="max-h-44 space-y-1 overflow-y-auto px-3 py-2 text-sm text-amber-950">
                    {preDiagnostico.problemas.map((p, i) => (
                      <li
                        key={i}
                        className="rounded bg-amber-50/70 px-2 py-1 whitespace-pre-wrap"
                      >
                        {p}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}

          {resultado && (
            <div className="space-y-3">
              <div
                className={`rounded-lg border px-4 py-3 ${
                  exito
                    ? "border-green-200 bg-green-50"
                    : parcial
                    ? "border-amber-200 bg-amber-50"
                    : "border-red-200 bg-red-50"
                }`}
              >
                <p
                  className={`text-base font-semibold ${
                    exito
                      ? "text-green-800"
                      : parcial
                      ? "text-amber-800"
                      : "text-red-800"
                  }`}
                >
                  {exito && "Resultado final: carga exitosa"}
                  {parcial && "Resultado final: con observaciones"}
                  {fallo && "Resultado final: no se guardó nada"}
                </p>
                {resultado.message && (
                  <p className="mt-1 text-sm text-gray-700">{resultado.message}</p>
                )}
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div className="rounded-lg border bg-white p-3 text-center">
                  <p className="text-2xl font-bold text-gray-900">{total}</p>
                  <p className="text-xs text-gray-500">Filas leídas</p>
                </div>
                <div className="rounded-lg border border-green-100 bg-green-50 p-3 text-center">
                  <p className="text-2xl font-bold text-green-700">
                    {resultado.guardados}
                  </p>
                  <p className="text-xs text-green-700">Bien / guardados</p>
                </div>
                <div className="rounded-lg border border-red-100 bg-red-50 p-3 text-center">
                  <p className="text-2xl font-bold text-red-700">
                    {resultado.errores}
                  </p>
                  <p className="text-xs text-red-700">Mal / con error</p>
                </div>
              </div>

              {resultado.itemsOk && resultado.itemsOk.length > 0 && (
                <div className="rounded-lg border border-green-100">
                  <div className="border-b border-green-100 bg-green-50 px-3 py-2 text-sm font-semibold text-green-800">
                    {entidadPlural} guardados correctamente (
                    {resultado.itemsOk.length})
                  </div>
                  <ul className="max-h-40 list-disc overflow-y-auto px-6 py-2 text-sm text-gray-700">
                    {resultado.itemsOk.slice(0, 50).map((nombre, i) => (
                      <li key={`${nombre}-${i}`}>{nombre}</li>
                    ))}
                    {resultado.itemsOk.length > 50 && (
                      <li className="list-none text-gray-500">
                        … y {resultado.itemsOk.length - 50} más
                      </li>
                    )}
                  </ul>
                </div>
              )}

              {resultado.detallesErrores &&
                resultado.detallesErrores.length > 0 && (
                  <div className="rounded-lg border border-red-100">
                    <div className="border-b border-red-100 bg-red-50 px-3 py-2 text-sm font-semibold text-red-800">
                      Detalle de errores ({resultado.detallesErrores.length})
                    </div>
                    <ul className="max-h-52 space-y-1 overflow-y-auto px-3 py-2 text-sm text-red-800">
                      {resultado.detallesErrores.map((err, i) => (
                        <li
                          key={i}
                          className="rounded bg-red-50/80 px-2 py-1 whitespace-pre-wrap"
                        >
                          {err}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
            </div>
          )}
        </div>

        <div className="flex flex-wrap justify-end gap-2 border-t px-5 py-4">
          <button
            type="button"
            disabled={cargando || analizando}
            onClick={resetYCerrar}
            className="rounded-lg border border-gray-300 px-4 py-2 text-sm hover:bg-gray-50 disabled:opacity-60"
          >
            {resultado ? "Cerrar" : "Cancelar"}
          </button>
          <button
            type="button"
            disabled={
              cargando ||
              analizando ||
              !archivo ||
              Boolean(preDiagnostico && !preDiagnostico.puedeProcesar)
            }
            onClick={handleProcesar}
            className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-60"
          >
            {cargando
              ? "Procesando..."
              : resultado
              ? "Procesar de nuevo"
              : preDiagnostico?.estado === "advertencia"
              ? "Procesar de todos modos"
              : "Procesar archivo"}
          </button>
        </div>
      </div>
    </div>
  );
}
