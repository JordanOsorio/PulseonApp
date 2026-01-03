import axios from "axios";

// URL de la API de producción
// Para desarrollo local, crear un archivo .env con: VITE_API_URL=http://localhost:3000/api
const API_BASE_URL =
  import.meta.env.VITE_API_URL || "https://pulseon-backend.fly.dev/api";

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

// Por ahora no hay autenticación JWT, los endpoints están abiertos para pruebas
// Más adelante se agregará el interceptor para agregar el token

export default api;
