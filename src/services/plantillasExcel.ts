import * as XLSX from "xlsx";

function descargarWorkbook(workbook: XLSX.WorkBook, nombreArchivo: string) {
  const data = XLSX.write(workbook, { bookType: "xlsx", type: "array" });
  const blob = new Blob([data], {
    type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  });
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = nombreArchivo;
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.URL.revokeObjectURL(url);
}

export function descargarPlantillaAlimentos() {
  const workbook = XLSX.utils.book_new();

  const encabezados = [
    "Nombre",
    "Categoria",
    "baseCantidad",
    "baseUnidad",
    "porcionDescripcion",
    "porcionGramos",
    "kcal",
    "proteina",
    "grasaTotal",
    "grasaSaturada",
    "carbohidratos",
    "azucares",
    "fibra",
    "sodio",
    "kcalPorPorcion",
    "proteinaPorPorcion",
    "grasaTotalPorPorcion",
    "grasaSaturadaPorPorcion",
    "carbohidratosPorPorcion",
    "azucaresPorPorcion",
    "fibraPorPorcion",
    "sodioPorPorcion",
    "dataSource",
  ];

  const ejemplo = [
    "Pollo pechuga cocida",
    "Carnes",
    "100",
    "g",
    "1 filete mediano",
    "120",
    "165",
    "31",
    "3.6",
    "1",
    "0",
    "0",
    "0",
    "74",
    "198",
    "37.2",
    "4.3",
    "1.2",
    "0",
    "0",
    "0",
    "89",
    "Tabla nutricional ejemplo",
  ];

  const hojaDatos = XLSX.utils.aoa_to_sheet([encabezados, ejemplo]);
  hojaDatos["!cols"] = encabezados.map((h) => ({
    wch: Math.max(14, h.length + 2),
  }));
  XLSX.utils.book_append_sheet(workbook, hojaDatos, "Alimentos");

  const instrucciones = [
    ["Campo", "Obligatorio", "Cómo completarlo", "Ejemplos"],
    [
      "Nombre",
      "Sí",
      "Nombre del alimento. No dejar vacío. No debe existir ya en la base.",
      "Pollo pechuga cocida",
    ],
    [
      "Categoria",
      "Sí",
      "Texto libre. Si no existe, se crea automáticamente.",
      "Carnes, Lácteos, Frutas",
    ],
    [
      "baseCantidad",
      "No",
      "Cantidad base de referencia. Por defecto 100.",
      "100",
    ],
    ["baseUnidad", "No", "Unidad de la cantidad base. Por defecto g.", "g, ml"],
    [
      "porcionDescripcion",
      "No",
      "Descripción de una porción habitual.",
      "1 filete mediano",
    ],
    ["porcionGramos", "No", "Peso en gramos de esa porción.", "120"],
    [
      "kcal / proteina / grasaTotal / etc.",
      "No",
      "Valores nutricionales por 100g (o la baseCantidad).",
      "165, 31, 3.6",
    ],
    [
      "*PorPorcion",
      "No",
      "Mismos valores pero por la porción indicada.",
      "198",
    ],
    ["dataSource", "No", "Fuente de los datos nutricionales.", "USDA"],
    [],
    [
      "Consejo",
      "",
      "No cambies los nombres de las columnas. Borrá o reemplazá la fila de ejemplo. La imagen se carga después desde Editar en la web.",
      "",
    ],
  ];

  const hojaInstrucciones = XLSX.utils.aoa_to_sheet(instrucciones);
  hojaInstrucciones["!cols"] = [
    { wch: 28 },
    { wch: 12 },
    { wch: 70 },
    { wch: 28 },
  ];
  XLSX.utils.book_append_sheet(workbook, hojaInstrucciones, "Instrucciones");

  descargarWorkbook(workbook, "plantilla-alimentos-pulseon.xlsx");
}

export function descargarPlantillaEjercicios() {
  const workbook = XLSX.utils.book_new();

  const encabezados = [
    "Nombre",
    "Descripcion",
    "urlVideo",
    "Categoria",
    "Musculo",
    "Implementos",
    "Imagen",
    "nivelDificultad",
    "tipoEjercicio",
    "tiposMedicion",
    "repeticiones",
    "tiempoSegundos",
    "pesoKg",
  ];

  const ejemplo = [
    "Press de banca con barra",
    "Ejercicio de empuje para pecho. Acostate en el banco y bajá la barra hasta el pecho.",
    "https://www.youtube.com/watch?v=ejemplo",
    "Pecho",
    "Pecho + Triceps + Hombros",
    "Barra olímpica, Banco",
    "https://ejemplo.com/imagen-press.jpg",
    "intermedio",
    "basicos",
    "repeticion,peso",
    "12",
    "",
    "60",
  ];

  const hojaDatos = XLSX.utils.aoa_to_sheet([encabezados, ejemplo]);
  hojaDatos["!cols"] = [
    { wch: 28 },
    { wch: 55 },
    { wch: 40 },
    { wch: 14 },
    { wch: 30 },
    { wch: 24 },
    { wch: 36 },
    { wch: 16 },
    { wch: 16 },
    { wch: 20 },
    { wch: 12 },
    { wch: 14 },
    { wch: 10 },
  ];
  XLSX.utils.book_append_sheet(workbook, hojaDatos, "Ejercicios");

  const instrucciones = [
    ["Campo", "Obligatorio", "Cómo completarlo", "Ejemplos / valores"],
    ["Nombre", "Sí", "Nombre del ejercicio. No dejar vacío.", "Press de banca"],
    ["Descripcion", "No", "Texto libre con detalle.", "Acostate en el banco..."],
    [
      "urlVideo",
      "No",
      "URL de video externo.",
      "https://www.youtube.com/watch?v=...",
    ],
    [
      "Categoria",
      "No",
      "Si no existe, se crea automáticamente.",
      "Pecho, Espalda, Piernas",
    ],
    [
      "Musculo",
      "No",
      "Uno o varios separados por +.",
      "Pecho + Triceps + Hombros",
    ],
    [
      "Implementos",
      "No",
      "Uno o varios separados por coma o +.",
      "Barra olímpica, Banco",
    ],
    [
      "Imagen",
      "No",
      "URL de imagen. Para subir archivo usá Editar en la web.",
      "https://ejemplo.com/foto.jpg",
    ],
    [
      "nivelDificultad",
      "No",
      "Vacío = sin_nivel",
      "preparatorio | intermedio | avanzado | sin_nivel",
    ],
    [
      "tipoEjercicio",
      "No",
      "Vacío = sin_tipo",
      "dinamicos | basicos | complementarios | sin_tipo",
    ],
    [
      "tiposMedicion",
      "No",
      "Separados por coma.",
      "repeticion | tiempo | peso → ej: repeticion,peso",
    ],
    ["repeticiones", "No", "Número entero si usás repeticion.", "12"],
    ["tiempoSegundos", "No", "Segundos si usás tiempo.", "45"],
    ["pesoKg", "No", "Número si usás peso.", "60 o 40.5"],
    [],
    [
      "Consejo",
      "",
      "No cambies los nombres de las columnas. Borrá o reemplazá la fila de ejemplo. Si hay un error en cualquier fila, no se guarda nada.",
      "",
    ],
  ];

  const hojaInstrucciones = XLSX.utils.aoa_to_sheet(instrucciones);
  hojaInstrucciones["!cols"] = [
    { wch: 18 },
    { wch: 12 },
    { wch: 70 },
    { wch: 50 },
  ];
  XLSX.utils.book_append_sheet(workbook, hojaInstrucciones, "Instrucciones");

  descargarWorkbook(workbook, "plantilla-ejercicios-pulseon.xlsx");
}
