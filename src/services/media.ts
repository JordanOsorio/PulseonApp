const API_ORIGIN = (
  import.meta.env.VITE_API_URL || "https://pulseon-backend.fly.dev/api"
).replace(/\/api\/?$/, "");

export function urlMedia(ruta?: string | null) {
  if (!ruta) return "";
  if (ruta.startsWith("http://") || ruta.startsWith("https://")) return ruta;
  return `${API_ORIGIN}${ruta}`;
}
