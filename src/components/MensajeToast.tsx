import { useEffect } from "react";

interface MensajeToastProps {
  mensaje: { type: "success" | "error"; text: string } | null;
  onCerrar: () => void;
  segundos?: number;
}

export default function MensajeToast({
  mensaje,
  onCerrar,
  segundos = 4,
}: MensajeToastProps) {
  useEffect(() => {
    if (!mensaje) return;
    const timer = window.setTimeout(onCerrar, segundos * 1000);
    return () => window.clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mensaje?.type, mensaje?.text, segundos]);

  if (!mensaje) return null;

  return (
    <div className="pointer-events-none fixed bottom-4 right-4 z-[80] max-w-sm sm:max-w-md">
      <div
        className={`pointer-events-auto rounded-2xl border px-4 py-3 shadow-panel dark:shadow-panel-dark ${
          mensaje.type === "success"
            ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-800 dark:text-emerald-200"
            : "border-red-500/30 bg-red-500/10 text-red-800 dark:text-red-200"
        }`}
      >
        <div className="flex items-start gap-3">
          <div className="min-w-0 flex-1 whitespace-pre-line text-sm font-medium">
            {mensaje.text}
          </div>
          <button
            type="button"
            onClick={onCerrar}
            className="shrink-0 text-lg leading-none opacity-60 hover:opacity-100"
            aria-label="Cerrar"
          >
            ×
          </button>
        </div>
      </div>
    </div>
  );
}
