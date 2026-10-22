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
      className="fixed inset-0 z-[60] flex items-center justify-center overflow-y-auto bg-black/50 p-4"
      onClick={(e) => {
        if (e.target === e.currentTarget) onCancelar();
      }}
    >
      <div className="w-full max-w-md rounded-lg bg-white p-4 shadow-lg sm:p-6">
        <h2
          className={`mb-4 text-2xl font-bold ${
            peligroso ? "text-red-600" : "text-gray-900"
          }`}
        >
          {titulo}
        </h2>
        <div className="mb-6 text-gray-700">{mensaje}</div>
        <div className="flex space-x-2">
          <button
            type="button"
            onClick={onCancelar}
            className="flex-1 rounded-lg border border-gray-300 px-4 py-2 hover:bg-gray-50"
          >
            {textoCancelar}
          </button>
          <button
            type="button"
            onClick={onConfirmar}
            className={`flex-1 rounded-lg px-4 py-2 text-white ${
              peligroso
                ? "bg-red-600 hover:bg-red-700"
                : "bg-blue-600 hover:bg-blue-700"
            }`}
          >
            {textoConfirmar}
          </button>
        </div>
      </div>
    </div>
  );
}
