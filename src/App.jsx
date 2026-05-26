import './App.css'
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { AuthProvider } from './controllers/authController.jsx'
import AdminRoute from './views/components/AdminRoute.jsx'
import ProtectedRoute from './views/components/ProtectedRoute.jsx'
import SystemLayout from './views/layouts/SystemLayout.jsx'
import ClientesView from './views/pages/ClientesView.jsx'
import LoginView from './views/pages/LoginView.jsx'
import MenuView from './views/pages/MenuView.jsx'
import NuevaValoracionView from './views/pages/NuevaValoracionView.jsx'
import UsersView from './views/pages/UsersView.jsx'
import ValoracionesPendientesView from './views/pages/ValoracionesPendientesView.jsx'

function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/app" replace />} />
      <Route path="/login" element={<LoginView />} />

      <Route element={<ProtectedRoute />}>
        <Route path="/app" element={<SystemLayout />}>
          <Route index element={<MenuView />} />
          <Route path="clientes" element={<ClientesView />} />
          <Route path="nueva-valoracion" element={<NuevaValoracionView />} />
          <Route path="nueva-valoracion/:valuationId" element={<NuevaValoracionView />} />
          <Route path="valoraciones-pendientes" element={<ValoracionesPendientesView />} />
          <Route
            path="usuarios"
            element={
              <AdminRoute>
                <UsersView />
              </AdminRoute>
            }
          />
        </Route>
      </Route>

      <Route path="*" element={<Navigate to="/app" replace />} />
    </Routes>
  )
}

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <AppRoutes />
      </BrowserRouter>
    </AuthProvider>
  )
}

export default App
