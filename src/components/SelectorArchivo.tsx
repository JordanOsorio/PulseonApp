interface SelectorArchivoProps {
  accept: string;
  archivo: File | null;
  onArchivo: (archivo: File | null) => void;
  texto: string;
  ayuda: string;
}

export default function SelectorArchivo({
  accept,
  archivo,
  onArchivo,
  texto,
  ayuda,
}: SelectorArchivoProps) {
  return (
    <div>
      <div className="flex flex-wrap items-center gap-3">
        <label className="cursor-pointer">
          <span className="inline-flex items-center rounded-xl bg-brand px-4 py-2 text-sm font-medium text-brand-fg shadow-panel dark:shadow-panel-dark transition-colors hover:opacity-90">
            {texto}
          </span>
          <input
            type="file"
            accept={accept}
            className="hidden"
            onChange={(e) => {
              onArchivo(e.target.files?.[0] || null);
              e.target.value = "";
            }}
          />
        </label>
        <span className="max-w-xs truncate text-sm text-muted">
          {archivo ? archivo.name : "Ningún archivo seleccionado"}
        </span>
      </div>
      <p className="mt-2 text-xs text-muted">{ayuda}</p>
    </div>
  );
}
