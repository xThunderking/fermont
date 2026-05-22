import './App.css'
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { AuthProvider } from './controllers/authController.jsx'
import ProtectedRoute from './views/components/ProtectedRoute.jsx'
import SystemLayout from './views/layouts/SystemLayout.jsx'
import LoginView from './views/pages/LoginView.jsx'
import MenuView from './views/pages/MenuView.jsx'
import UsersView from './views/pages/UsersView.jsx'

function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/app" replace />} />
      <Route path="/login" element={<LoginView />} />

      <Route element={<ProtectedRoute />}>
        <Route path="/app" element={<SystemLayout />}>
          <Route index element={<MenuView />} />
          <Route path="usuarios" element={<UsersView />} />
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
