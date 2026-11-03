import type { ReactNode } from "react";
import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { AuthProvider, useAuth } from "./contexts/AuthContext";
import { ThemeProvider } from "./contexts/ThemeContext";
import Alimentos from "./pages/Alimentos";
import Categorias from "./pages/Categorias";
import Dashboard from "./pages/Dashboard";
import Entrenamientos from "./pages/Entrenamientos";
import Login from "./pages/Login";
import Programas from "./pages/Programas";
import Recetas from "./pages/Recetas";
import ResetPassword from "./pages/ResetPassword";

function ProtectedRoute({ children }: { children: ReactNode }) {
  const { isAuthenticated } = useAuth();
  return isAuthenticated ? <>{children}</> : <Navigate to="/login" />;
}

function AppRoutes() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/reset-password" element={<ResetPassword />} />
      <Route
        path="/"
        element={
          <ProtectedRoute>
            <Dashboard />
          </ProtectedRoute>
        }
      />
      <Route
        path="/alimentos"
        element={
          <ProtectedRoute>
            <Alimentos />
          </ProtectedRoute>
        }
      />
      <Route
        path="/entrenamientos"
        element={
          <ProtectedRoute>
            <Entrenamientos />
          </ProtectedRoute>
        }
      />
      <Route
        path="/categorias"
        element={
          <ProtectedRoute>
            <Categorias />
          </ProtectedRoute>
        }
      />
      <Route
        path="/programas"
        element={
          <ProtectedRoute>
            <Programas />
          </ProtectedRoute>
        }
      />
      <Route
        path="/recetas"
        element={
          <ProtectedRoute>
            <Recetas />
          </ProtectedRoute>
        }
      />
    </Routes>
  );
}

function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <BrowserRouter>
          <AppRoutes />
        </BrowserRouter>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;
