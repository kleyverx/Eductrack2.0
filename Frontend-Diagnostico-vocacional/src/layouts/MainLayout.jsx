import React, { useContext } from 'react';
import Sidebar from '../components/Sidebar';
import ChatBot from '../components/Chatbot';
import { Outlet } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { ROLES } from '../utils/roles';

const MainLayout = () => {
  const { user } = useContext(AuthContext);

  return (
    <div className="flex bg-slate-50 dark:bg-slate-950 min-h-screen transition-colors duration-300">
      <Sidebar />
      <main className="ml-64 flex-1 p-8">
        <Outlet />
      </main>
      {/* Asistente IA flotante (solo estudiante: el endpoint usa su contexto académico) */}
      {user?.role === ROLES.ESTUDIANTE && <ChatBot />}
    </div>
  );
};

export default MainLayout;
