# Pulseon Admin - Plataforma Web de Administración

Plataforma web para gestionar ejercicios, alimentos, categorías y programas del backend de Pulseon.

## Características

- 🔐 Login simple con credenciales fijas (administrador/admin1234)
- 🍎 Gestión de alimentos (cargar archivos Excel, listar, eliminar)
- 💪 Gestión de entrenamientos (crear, editar, eliminar)
- 📁 Gestión de categorías (crear, editar, eliminar)
- 📋 Visualización de programas de entrenamiento

## Instalación

1. Instalar dependencias:
```bash
npm install
```

2. Configurar variables de entorno (opcional):
Crear un archivo `.env` en la raíz del proyecto:
```
VITE_API_URL=http://localhost:3000/api
```

3. Iniciar el servidor de desarrollo:
```bash
npm run dev
```

La aplicación estará disponible en `http://localhost:3001`

## Credenciales de Acceso

- **Usuario:** administrador
- **Contraseña:** admin1234

## Requisitos

- Node.js 18+
- Backend de Pulseon corriendo en `http://localhost:3000`

## Estructura del Proyecto

```
src/
├── components/      # Componentes reutilizables (Layout)
├── contexts/        # Contextos de React (AuthContext)
├── pages/           # Páginas de la aplicación
├── services/        # Servicios API
├── App.tsx          # Componente principal con rutas
└── main.tsx         # Punto de entrada
```

## Tecnologías

- React 18
- TypeScript
- Vite
- Tailwind CSS
- React Router
- Axios

