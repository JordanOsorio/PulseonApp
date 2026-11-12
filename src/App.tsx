import type { ReactNode } from "react";
import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { AuthProvider, useAuth } from "./contexts/AuthContext";
import { ThemeProvider } from "./contexts/ThemeContext";
import Alimentos from "./pages/Alimentos";
import Categorias from "./pages/Categorias";
import Cuenta from "./pages/Cuenta";
import Dashboard from "./pages/Dashboard";
import Entrenamientos from "./pages/Entrenamientos";
import Login from "./pages/Login";
import MiCuenta from "./pages/MiCuenta";
import Privacidad from "./pages/Privacidad";
import Programas from "./pages/Programas";
import Recetas from "./pages/Recetas";
import ResetPassword from "./pages/ResetPassword";
import Terminos from "./pages/Terminos";

function AdminRoute({ children }: { children: ReactNode }) {
  const { isAuthenticated, isAdmin } = useAuth();
  if (!isAuthenticated) return <Navigate to="/login" />;
  if (!isAdmin) return <Navigate to="/mi-cuenta" replace />;
  return <>{children}</>;
}

function UserOnlyRoute({ children }: { children: ReactNode }) {
  const { isAuthenticated, isAdmin } = useAuth();
  if (!isAuthenticated) return <Navigate to="/login" />;
  if (isAdmin) return <Navigate to="/" replace />;
  return <>{children}</>;
}

function AppRoutes() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/reset-password" element={<ResetPassword />} />
      <Route path="/privacidad" element={<Privacidad />} />
      <Route path="/terminos" element={<Terminos />} />
      <Route
        path="/mi-cuenta"
        element={
          <UserOnlyRoute>
            <MiCuenta />
          </UserOnlyRoute>
        }
      />
      <Route
        path="/"
        element={
          <AdminRoute>
            <Dashboard />
          </AdminRoute>
        }
      />
      <Route
        path="/cuenta"
        element={
          <AdminRoute>
            <Cuenta />
          </AdminRoute>
        }
      />
      <Route
        path="/alimentos"
        element={
          <AdminRoute>
            <Alimentos />
          </AdminRoute>
        }
      />
      <Route
        path="/entrenamientos"
        element={
          <AdminRoute>
            <Entrenamientos />
          </AdminRoute>
        }
      />
      <Route
        path="/categorias"
        element={
          <AdminRoute>
            <Categorias />
          </AdminRoute>
        }
      />
      <Route
        path="/programas"
        element={
          <AdminRoute>
            <Programas />
          </AdminRoute>
        }
      />
      <Route
        path="/recetas"
        element={
          <AdminRoute>
            <Recetas />
          </AdminRoute>
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
