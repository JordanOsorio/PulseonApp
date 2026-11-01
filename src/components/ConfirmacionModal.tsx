import type { ReactNode } from "react";

interface ConfirmacionModalProps {
  abierto: boolean;
  titulo?: string;
  mensaje: ReactNode;
  textoConfirmar?: string;
  textoCancelar?: string;
  peligroso?: boolean;
  onCancelar: () => void;
  onConfirmar: () => void;
}

export default function ConfirmacionModal({
  abierto,
  titulo = "Confirmar",
  mensaje,
  textoConfirmar = "Confirmar",
  textoCancelar = "Cancelar",
  peligroso = true,
  onCancelar,
  onConfirmar,
}: ConfirmacionModalProps) {
  if (!abierto) return null;

  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center overflow-y-auto bg-black/55 p-4 backdrop-blur-sm"
      onClick={(e) => {
        if (e.target === e.currentTarget) onCancelar();
      }}
    >
      <div className="panel-card w-full max-w-md p-5 sm:p-6">
        <h2
          className={`mb-3 font-display text-xl font-semibold ${
            peligroso ? "text-red-600 dark:text-red-400" : "text-ink"
          }`}
        >
          {titulo}
        </h2>
        <div className="mb-6 text-sm text-muted">{mensaje}</div>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={onCancelar}
            className="btn-secondary flex-1"
          >
            {textoCancelar}
          </button>
          <button
            type="button"
            onClick={onConfirmar}
            className={`flex-1 ${peligroso ? "btn-danger" : "btn-primary"}`}
          >
            {textoConfirmar}
          </button>
        </div>
      </div>
    </div>
  );
}
