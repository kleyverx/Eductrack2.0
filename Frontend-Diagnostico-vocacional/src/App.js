import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import MainLayout from './layouts/MainLayout';
import ProtectedRoute from './components/ProtectedRoute';
import HomeRedirect from './components/HomeRedirect';
import { ROLES } from './utils/roles';

// Páginas públicas
import LandingPage from './pages/public/LandingPage';
import AuthPage from './pages/public/AuthPage';

// Estudiante
import DashboardPage from './pages/admin/DashboardPage';
import SubjectsPage from './pages/SubjectsPage';

// Docente
import TeacherDashboard from './pages/docente/TeacherDashboard';

// SuperAdmin
import AdminDashboardPage from './pages/admin/AdminDashboardPage';
import ManageUsersPage from './pages/admin/ManageUsersPage';
import AppConfigPage from './pages/admin/AppConfigPage';
import AuditLogsPage from './pages/admin/AuditLogsPage';

function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <Router>
          <Routes>
            {/* Rutas Públicas */}
            <Route path="/" element={<LandingPage />} />
            <Route path="/auth" element={<AuthPage />} />
            <Route path="/login" element={<Navigate to="/auth" replace />} />
            <Route path="/register" element={<Navigate to="/auth" replace />} />

            {/* Rutas Protegidas (requieren sesión) */}
            <Route element={<ProtectedRoute />}>
              <Route path="/app" element={<MainLayout />}>
                {/* /app redirige al panel del rol */}
                <Route index element={<HomeRedirect />} />

                {/* Materias: estudiante y docente */}
                <Route
                  path="subjects"
                  element={
                    <ProtectedRoute allowedRoles={[ROLES.ESTUDIANTE, ROLES.DOCENTE]} />
                  }
                >
                  <Route index element={<SubjectsPage />} />
                </Route>

                {/* Estudiante */}
                <Route element={<ProtectedRoute allowedRoles={[ROLES.ESTUDIANTE]} />}>
                  <Route path="dashboard" element={<DashboardPage />} />
                </Route>

                {/* Docente */}
                <Route element={<ProtectedRoute allowedRoles={[ROLES.DOCENTE]} />}>
                  <Route path="docente" element={<TeacherDashboard />} />
                </Route>

                {/* SuperAdmin */}
                <Route element={<ProtectedRoute allowedRoles={[ROLES.SUPERADMIN]} />}>
                  <Route path="admin" element={<AdminDashboardPage />} />
                  <Route path="admin/usuarios" element={<ManageUsersPage />} />
                  <Route path="admin/config" element={<AppConfigPage />} />
                  <Route path="admin/logs" element={<AuditLogsPage />} />
                </Route>
              </Route>
            </Route>

            {/* Fallback */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </Router>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;
