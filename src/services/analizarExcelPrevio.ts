import * as XLSX from "xlsx";

export type TipoPlantillaExcel =
  | "ejercicios"
  | "alimentos"
  | "categorias"
  | "musculos"
  | "equipos";

export interface PreDiagnosticoExcel {
  estado: "ok" | "advertencia" | "error";
  puedeProcesar: boolean;
  resumen: string;
  hojas: string[];
  hojaUsada: string;
  columnas: string[];
  columnasObligatoriasOk: string[];
  columnasObligatoriasFaltantes: string[];
  columnasRecomendadasFaltantes: string[];
  filasTotales: number;
  filasParecenValidas: number;
  filasConProblema: number;
  problemas: string[];
  vistaPrevia: Array<{
    fila: number;
    nombre: string;
    ok: boolean;
    detalle?: string;
  }>;
}

type ConfigPlantilla = {
  obligatorias: string[][]; // grupos de alias; al menos uno del grupo debe existir
  recomendadas: string[][];
  obtenerNombre: (row: Record<string, unknown>) => string;
  validarFila: (row: Record<string, unknown>, numeroFila: number) => string[];
};

function valorCelda(row: Record<string, unknown>, aliases: string[]): string {
  const keys = Object.keys(row);
  for (const alias of aliases) {
    const exacta = keys.find((k) => k.trim() === alias);
    if (exacta != null && row[exacta] != null && String(row[exacta]).trim() !== "") {
      return String(row[exacta]).trim();
    }
    const ci = keys.find((k) => k.trim().toLowerCase() === alias.toLowerCase());
    if (ci != null && row[ci] != null && String(row[ci]).trim() !== "") {
      return String(row[ci]).trim();
    }
  }
  return "";
}

function columnaPresente(columnas: string[], aliases: string[]): boolean {
  const normalizadas = columnas.map((c) => c.trim().toLowerCase());
  return aliases.some((a) => normalizadas.includes(a.toLowerCase()));
}

const CONFIG: Record<TipoPlantillaExcel, ConfigPlantilla> = {
  ejercicios: {
    obligatorias: [["Nombre", "nombre"]],
    recomendadas: [
      ["Descripcion", "Descripción", "descripcion"],
      ["Categoria", "Categoría", "categoria"],
      ["Musculo", "Músculo", "musculo"],
      ["Implementos", "implementos"],
      ["urlVideo", "videoUrl", "url video"],
      ["nivelDificultad", "nivel"],
      ["tipoEjercicio", "tipo"],
      ["tiposMedicion"],
    ],
    obtenerNombre: (row) => valorCelda(row, ["Nombre", "nombre"]),
    validarFila: (row, numeroFila) => {
      const errores: string[] = [];
      const nombre = valorCelda(row, ["Nombre", "nombre"]);
      if (!nombre) {
        errores.push(`Fila ${numeroFila}: falta Nombre`);
      }
      const nivel = valorCelda(row, ["nivelDificultad", "nivel", "Nivel"]);
      if (
        nivel &&
        !["preparatorio", "intermedio", "avanzado", "sin_nivel"].includes(
          nivel.toLowerCase()
        )
      ) {
        errores.push(
          `Fila ${numeroFila}: nivelDificultad inválido ("${nivel}"). Usá preparatorio, intermedio, avanzado o sin_nivel`
        );
      }
      const tipo = valorCelda(row, ["tipoEjercicio", "tipo", "Tipo"]);
      if (
        tipo &&
        !["dinamicos", "basicos", "complementarios", "sin_tipo"].includes(
          tipo.toLowerCase()
        )
      ) {
        errores.push(
          `Fila ${numeroFila}: tipoEjercicio inválido ("${tipo}"). Usá dinamicos, basicos, complementarios o sin_tipo`
        );
      }
      return errores;
    },
  },
  alimentos: {
    obligatorias: [
      ["Nombre", "nombre"],
      ["Categoria", "Categoría", "categoria", "categoría"],
    ],
    recomendadas: [
      ["baseCantidad", "base_cantidad"],
      ["baseUnidad", "base_unidad"],
      ["kcal"],
      ["proteina", "Prot"],
      ["carbohidratos", "Carbs"],
      ["grasaTotal", "G. Tot"],
    ],
    obtenerNombre: (row) => valorCelda(row, ["Nombre", "nombre"]),
    validarFila: (row, numeroFila) => {
      const errores: string[] = [];
      if (!valorCelda(row, ["Nombre", "nombre"])) {
        errores.push(`Fila ${numeroFila}: falta Nombre`);
      }
      if (
        !valorCelda(row, ["Categoria", "Categoría", "categoria", "categoría"])
      ) {
        errores.push(`Fila ${numeroFila}: falta Categoria`);
      }
      return errores;
    },
  },
  categorias: {
    obligatorias: [["nombre", "Nombre"]],
    recomendadas: [
      ["descripcion", "Descripcion", "Descripción"],
      ["imagenUrl", "imagen", "Imagen"],
    ],
    obtenerNombre: (row) => valorCelda(row, ["nombre", "Nombre"]),
    validarFila: (row, numeroFila) => {
      if (!valorCelda(row, ["nombre", "Nombre"])) {
        return [`Fila ${numeroFila}: falta nombre`];
      }
      return [];
    },
  },
  musculos: {
    obligatorias: [["nombre", "Nombre"]],
    recomendadas: [
      ["descripcion", "Descripcion", "Descripción"],
      ["iconoUrl", "icono", "Imagen"],
    ],
    obtenerNombre: (row) => valorCelda(row, ["nombre", "Nombre"]),
    validarFila: (row, numeroFila) => {
      if (!valorCelda(row, ["nombre", "Nombre"])) {
        return [`Fila ${numeroFila}: falta nombre`];
      }
      return [];
    },
  },
  equipos: {
    obligatorias: [["nombre", "Nombre"]],
    recomendadas: [
      ["descripcion", "Descripcion", "Descripción"],
      ["iconoUrl", "icono", "Imagen"],
    ],
    obtenerNombre: (row) => valorCelda(row, ["nombre", "Nombre"]),
    validarFila: (row, numeroFila) => {
      if (!valorCelda(row, ["nombre", "Nombre"])) {
        return [`Fila ${numeroFila}: falta nombre`];
      }
      return [];
    },
  },
};

export async function analizarExcelPrevio(
  archivo: File,
  tipo: TipoPlantillaExcel
): Promise<PreDiagnosticoExcel> {
  const config = CONFIG[tipo];
  const buffer = await archivo.arrayBuffer();
  const workbook = XLSX.read(buffer, { type: "array" });
  const hojas = workbook.SheetNames || [];

  if (hojas.length === 0) {
    return {
      estado: "error",
      puedeProcesar: false,
      resumen: "El archivo no tiene hojas.",
      hojas: [],
      hojaUsada: "",
      columnas: [],
      columnasObligatoriasOk: [],
      columnasObligatoriasFaltantes: config.obligatorias.map((g) => g[0]),
      columnasRecomendadasFaltantes: [],
      filasTotales: 0,
      filasParecenValidas: 0,
      filasConProblema: 0,
      problemas: ["No se encontró ninguna hoja en el Excel"],
      vistaPrevia: [],
    };
  }

  // Preferir la primera hoja que no sea Instrucciones
  const hojaUsada =
    hojas.find((h) => h.trim().toLowerCase() !== "instrucciones") || hojas[0];
  const sheet = workbook.Sheets[hojaUsada];
  const filas = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet, {
    raw: false,
    defval: null,
  });

  const columnas =
    filas.length > 0
      ? Object.keys(filas[0]).map((c) => c.trim())
      : ((XLSX.utils.sheet_to_json(sheet, { header: 1 })[0] as string[]) || [])
          .filter(Boolean)
          .map((c) => String(c).trim());

  const columnasObligatoriasOk: string[] = [];
  const columnasObligatoriasFaltantes: string[] = [];
  for (const grupo of config.obligatorias) {
    if (columnaPresente(columnas, grupo)) {
      columnasObligatoriasOk.push(grupo[0]);
    } else {
      columnasObligatoriasFaltantes.push(grupo[0]);
    }
  }

  const columnasRecomendadasFaltantes = config.recomendadas
    .filter((grupo) => !columnaPresente(columnas, grupo))
    .map((grupo) => grupo[0]);

  const problemas: string[] = [];
  const vistaPrevia: PreDiagnosticoExcel["vistaPrevia"] = [];
  let filasParecenValidas = 0;
  let filasConProblema = 0;

  if (columnasObligatoriasFaltantes.length > 0) {
    problemas.push(
      `Faltan columnas obligatorias: ${columnasObligatoriasFaltantes.join(", ")}`
    );
  }

  if (filas.length === 0) {
    problemas.push("El archivo no tiene filas de datos (solo encabezado o vacío)");
  }

  const vistosEnArchivo = new Map<string, number>();

  for (let i = 0; i < filas.length; i++) {
    const numeroFila = i + 2;
    const row = filas[i];
    const erroresFila = config.validarFila(row, numeroFila);
    const nombre = config.obtenerNombre(row) || "(sin nombre)";

    if (tipo === "ejercicios" || tipo === "alimentos") {
      const descripcion =
        tipo === "ejercicios"
          ? valorCelda(row, ["Descripcion", "Descripción", "descripcion"])
          : "";
      const clave =
        tipo === "ejercicios"
          ? `${nombre.trim().toLowerCase()}||${descripcion.trim().toLowerCase()}`
          : nombre.trim().toLowerCase();
      if (nombre && nombre !== "(sin nombre)" && vistosEnArchivo.has(clave)) {
        erroresFila.push(
          tipo === "ejercicios"
            ? `Fila ${numeroFila}: duplicado en el archivo (mismo Nombre y Descripción que la fila ${vistosEnArchivo.get(clave)})`
            : `Fila ${numeroFila}: nombre duplicado en el archivo (igual que la fila ${vistosEnArchivo.get(clave)})`
        );
      } else if (nombre && nombre !== "(sin nombre)") {
        vistosEnArchivo.set(clave, numeroFila);
      }
    }

    if (erroresFila.length === 0) {
      filasParecenValidas++;
      if (vistaPrevia.length < 8) {
        vistaPrevia.push({ fila: numeroFila, nombre, ok: true });
      }
    } else {
      filasConProblema++;
      problemas.push(...erroresFila);
      if (vistaPrevia.length < 8) {
        vistaPrevia.push({
          fila: numeroFila,
          nombre,
          ok: false,
          detalle: erroresFila.join("; "),
        });
      }
    }
  }

  // Detectar fila de ejemplo típica de la plantilla
  const primerNombre = filas[0] ? config.obtenerNombre(filas[0]).toLowerCase() : "";
  if (
    primerNombre.includes("ejemplo") ||
    primerNombre === "press de banca con barra" ||
    primerNombre === "pollo pechuga cocida"
  ) {
    problemas.unshift(
      "La primera fila parece ser el ejemplo de la plantilla. Reemplazala o borrala antes de subir si no querés cargarla."
    );
  }

  const problemasUnicos = [...new Set(problemas)].slice(0, 40);
  let estado: PreDiagnosticoExcel["estado"] = "ok";
  let puedeProcesar = true;
  let resumen = "El archivo se ve bien para procesar.";

  if (columnasObligatoriasFaltantes.length > 0 || filas.length === 0) {
    estado = "error";
    puedeProcesar = false;
    resumen = "Hay problemas bloqueantes. Corregí el Excel antes de procesar.";
  } else if (filasConProblema > 0 || columnasRecomendadasFaltantes.length > 0) {
    estado = "advertencia";
    puedeProcesar = filasParecenValidas > 0;
    resumen =
      filasParecenValidas > 0
        ? "Se puede procesar, pero hay filas o columnas a revisar."
        : "Ninguna fila parece válida. Revisá el archivo.";
    if (filasParecenValidas === 0) {
      puedeProcesar = false;
      estado = "error";
    }
  }

  return {
    estado,
    puedeProcesar,
    resumen,
    hojas,
    hojaUsada,
    columnas,
    columnasObligatoriasOk,
    columnasObligatoriasFaltantes,
    columnasRecomendadasFaltantes,
    filasTotales: filas.length,
    filasParecenValidas,
    filasConProblema,
    problemas: problemasUnicos,
    vistaPrevia,
  };
}
