import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import MainLayout from './layouts/MainLayout';

// Páginas existentes
import TestPage from './pages/TestPage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import ResultsPage from './pages/ResultsPage';
import DashboardPage from './pages/admin/DashboardPage';
import UserProfile from './pages/UserProfile';
import GetQuestionsPage from './pages/admin/GetQuestions';
import AdminBuscarUsuario from './pages/admin/buscarUsuario';
import HomePage from './pages/home';

function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          {/* Rutas Públicas */}
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />

          {/* Rutas Protegidas con el Nuevo Layout */}
          <Route path="/" element={<MainLayout />}>
            <Route index element={<Navigate to="/dashboard" replace />} />
            <Route path="dashboard" element={<DashboardPage />} />
            <Route path="test" element={<TestPage />} />
            <Route path="results" element={<ResultsPage />} />
            
            {/* Rutas que se irán habilitando */}
            <Route path="subjects" element={<div>Próximamente: Gestión de Materias</div>} />
            <Route path="chat" element={<div>Próximamente: Chat con Gemma 4</div>} />
            
            {/* Rutas Administrativas (pueden requerir middleware de rol después) */}
            <Route path="admin/usuarios" element={<AdminBuscarUsuario />} />
            <Route path="admin/preguntas" element={<GetQuestionsPage />} />
            <Route path="perfil/:id" element={<UserProfile />} />
          </Route>

          {/* Fallback */}
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;
