import React, { useContext } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  BookOpen,
  Users,
  Settings,
  ScrollText,
  GraduationCap,
  LogOut,
  Target,
  School,
} from 'lucide-react';
import { AuthContext } from '../context/AuthContext';
import { ROLES, ROLE_LABEL } from '../utils/roles';
import ThemeToggle from './ThemeToggle';

/**
 * Menús por rol. Cada rol ve solo sus secciones.
 */
const MENU_BY_ROLE = {
  [ROLES.ESTUDIANTE]: [
    { name: 'Mi Panel', path: '/app/dashboard', icon: LayoutDashboard },
    { name: 'Materias', path: '/app/subjects', icon: BookOpen },
    { name: 'Test Vocacional', path: '/app/test', icon: Target },
  ],
  [ROLES.DOCENTE]: [
    { name: 'Panel Docente', path: '/app/docente', icon: LayoutDashboard },
    { name: 'Mis Secciones', path: '/app/docente/secciones', icon: School },
  ],
  [ROLES.SUPERADMIN]: [
    { name: 'Panel Global', path: '/app/admin', icon: LayoutDashboard },
    { name: 'Usuarios', path: '/app/admin/usuarios', icon: Users },
    { name: 'Configuración', path: '/app/admin/config', icon: Settings },
    { name: 'Auditoría', path: '/app/admin/logs', icon: ScrollText },
  ],
};

const Sidebar = () => {
  const { user, logout } = useContext(AuthContext);
  const navigate = useNavigate();

  const role = user?.role || ROLES.ESTUDIANTE;
  const menuItems = MENU_BY_ROLE[role] || MENU_BY_ROLE[ROLES.ESTUDIANTE];

  // Inicial para el avatar.
  const initial = (user?.name || 'U').charAt(0).toUpperCase();

  const handleLogout = () => {
    logout();
    navigate('/auth', { replace: true });
  };

  return (
    <aside className="w-64 border-r border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 flex flex-col h-screen fixed left-0 top-0 z-10 transition-colors duration-300">
      <div className="p-6 flex justify-between items-center">
        <h1 className="text-xl font-bold text-indigo-600 dark:text-indigo-400 flex items-center gap-2">
          <GraduationCap size={24} />
          EduTrack
        </h1>
        <ThemeToggle />
      </div>

      <nav className="flex-1 px-4 space-y-2 mt-4">
        {menuItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            end
            className={({ isActive }) =>
              `flex items-center gap-3 p-3 rounded-lg transition-all duration-200 ${
                isActive
                  ? 'bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400 font-semibold shadow-sm dark:shadow-none'
                  : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-900 hover:text-slate-900 dark:hover:text-slate-100'
              }`
            }
          >
            <item.icon size={20} />
            <span className="text-sm">{item.name}</span>
          </NavLink>
        ))}
      </nav>

      {/* Pie: usuario + cerrar sesión */}
      <div className="p-4 border-t border-slate-100 dark:border-slate-800 space-y-2">
        <div className="flex items-center gap-3 p-2">
          <div className="w-8 h-8 rounded-full bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 flex items-center justify-center font-bold text-xs">
            {initial}
          </div>
          <div className="text-sm min-w-0">
            <p className="font-semibold text-slate-800 dark:text-slate-200 leading-tight truncate">
              {user?.name || 'Usuario'}
            </p>
            <p className="text-slate-500 dark:text-slate-400 text-[10px] uppercase tracking-wider font-bold">
              {ROLE_LABEL[role] || 'Usuario'}
            </p>
          </div>
        </div>
        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-3 p-3 rounded-lg text-slate-500 dark:text-slate-400 hover:bg-rose-50 dark:hover:bg-rose-900/20 hover:text-rose-600 dark:hover:text-rose-400 transition-colors"
        >
          <LogOut size={18} />
          <span className="text-sm font-medium">Cerrar sesión</span>
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;
