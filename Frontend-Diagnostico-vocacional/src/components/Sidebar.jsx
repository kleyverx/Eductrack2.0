import React from 'react';
import { NavLink } from 'react-router-dom';
import { LayoutDashboard, BookOpen, Target, MessageSquare, GraduationCap } from 'lucide-react';

const Sidebar = () => {
  const menuItems = [
    { name: 'Inicio', path: '/dashboard', icon: LayoutDashboard },
    { name: 'Materias', path: '/subjects', icon: BookOpen },
    { name: 'Test Vocacional', path: '/test', icon: Target },
    { name: 'Asistente', path: '/chat', icon: MessageSquare },
  ];

  return (
    <aside className="w-64 border-r border-slate-200 bg-white flex flex-col h-screen fixed left-0 top-0 z-10">
      <div className="p-6">
        <h1 className="text-xl font-bold text-indigo-600 flex items-center gap-2">
          <GraduationCap size={24} />
          EduTrack
        </h1>
      </div>
      <nav className="flex-1 px-4 space-y-2 mt-4">
        {menuItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            className={({ isActive }) => 
              `flex items-center gap-3 p-3 rounded-lg transition-all duration-200 ${
                isActive 
                  ? 'bg-indigo-50 text-indigo-600 font-semibold shadow-sm' 
                  : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
              }`
            }
          >
            <item.icon size={20} />
            <span className="text-sm">{item.name}</span>
          </NavLink>
        ))}
      </nav>
      <div className="p-4 border-t border-slate-100">
        <div className="flex items-center gap-3 p-2">
          <div className="w-8 h-8 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center font-bold text-xs">
            U
          </div>
          <div className="text-sm">
            <p className="font-semibold text-slate-800 leading-tight">Usuario</p>
            <p className="text-slate-500 text-[10px] uppercase tracking-wider font-bold">Estudiante</p>
          </div>
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;
