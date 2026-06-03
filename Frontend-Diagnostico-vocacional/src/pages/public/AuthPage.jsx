import React, { useState, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, GraduationCap, Loader2 } from 'lucide-react';
import { AuthContext } from '../../context/AuthContext';
import { loginUser, registerUser } from '../../api/auth';
import ThemeToggle from '../../components/ThemeToggle';

const AuthPage = () => {
  const [activeTab, setActiveTab] = useState('login');
  const [formData, setFormData] = useState({ 
    name: '', 
    cedula: '', 
    password: '', 
    role: 'user',
    email: '',
    telefono: ''
  });
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const navigate = useNavigate();
  const { login } = useContext(AuthContext);

  const handleTabChange = (tab) => {
    setActiveTab(tab);
    setError('');
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({ 
      ...formData, 
      [name]: name === 'cedula' ? (value ? parseInt(value) : '') : value 
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setIsSubmitting(true);

    try {
      if (activeTab === 'login') {
        const response = await loginUser({ 
          cedula: formData.cedula, 
          password: formData.password 
        });
        
        login(response.user, response.token);
        navigate('/app/dashboard');
      } else {
        await registerUser({
          cedula: formData.cedula,
          password: formData.password,
          name: formData.name,
          role: formData.role,
          email: formData.email,
          telefono: formData.telefono
        });
        
        // Registro exitoso, pasar al login automáticamente
        setActiveTab('login');
        setError('¡Cuenta creada! Ahora puedes ingresar.');
      }
    } catch (ex) {
      setError(ex.message || 'Error en la operación');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen grid md:grid-cols-[1.1fr_1fr] bg-slate-50 dark:bg-slate-950 relative overflow-hidden transition-colors duration-300">
      {/* Theme Toggle Absolute Position */}
      <div className="absolute top-6 right-6 z-50">
        <ThemeToggle />
      </div>

      {/* Background Decor */}
      <div className="absolute inset-0 z-0 pointer-events-none">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_0%_0%,rgba(79,70,229,0.05),transparent_40%),radial-gradient(circle_at_100%_0%,rgba(16,185,129,0.03),transparent_45%)] dark:bg-[radial-gradient(circle_at_0%_0%,rgba(79,70,229,0.1),transparent_40%),radial-gradient(circle_at_100%_0%,rgba(16,185,129,0.05),transparent_45%)]"></div>
        <div className="absolute inset-0 opacity-100 dark:opacity-50" style={{ backgroundImage: 'linear-gradient(to right, rgba(15,23,42,0.02) 1px, transparent 1px), linear-gradient(to bottom, rgba(15,23,42,0.02) 1px, transparent 1px)', backgroundSize: '64px 64px', maskImage: 'radial-gradient(ellipse at center, black 30%, transparent 70%)' }}></div>
      </div>

      {/* Brand Side (Left) */}
      <aside className="relative z-10 hidden md:flex flex-col justify-between bg-slate-900 dark:bg-slate-950 border-r border-slate-800 text-slate-50 p-12 overflow-hidden shadow-2xl transition-colors duration-300">
        <div className="absolute top-[-20%] right-[-20%] w-3/4 h-3/4 bg-indigo-600/30 dark:bg-indigo-500/20 blur-[80px] rounded-full"></div>
        
        <div>
          <div className="flex items-center gap-3 font-mono text-sm tracking-widest text-slate-400 mb-12 uppercase">
            <GraduationCap className="text-indigo-400" size={20} />
            EduTrack <em className="text-indigo-300 font-sans italic lowercase">Insight</em>
          </div>

          <h1 className="text-5xl lg:text-6xl font-semibold leading-tight tracking-tight mb-6 font-display text-white">
            Observabilidad<br/>del <em className="text-indigo-400 font-serif italic">aprendizaje.</em>
          </h1>
          <p className="text-slate-400 text-lg max-w-md leading-relaxed mb-12">
            Analítica académica, simulación de escenarios y detección temprana de riesgo — sin conexión, sin fricción.
          </p>

          <ul className="space-y-4 font-mono text-sm text-slate-300">
            <li className="flex items-center gap-4 py-3 border-t border-dashed border-slate-800"><span className="text-indigo-400 font-bold">01</span> Analítica en tiempo real</li>
            <li className="flex items-center gap-4 py-3 border-t border-dashed border-slate-800"><span className="text-indigo-400 font-bold">02</span> Simulación de notas</li>
            <li className="flex items-center gap-4 py-3 border-t border-dashed border-slate-800"><span className="text-indigo-400 font-bold">03</span> Índice de riesgo</li>
            <li className="flex items-center gap-4 py-3 border-t border-dashed border-slate-800 border-b"><span className="text-indigo-400 font-bold">04</span> Offline-first nativo</li>
          </ul>
        </div>

        <div className="flex items-center gap-3 font-mono text-xs text-slate-500 mt-12">
          <div className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_0_4px_rgba(16,185,129,0.2)] animate-pulse"></div>
          Sistemas operativos
        </div>
      </aside>

      {/* Form Side (Right) */}
      <main className="relative z-10 flex flex-col justify-center p-8 sm:p-12 lg:p-20 bg-white dark:bg-slate-900 overflow-y-auto transition-colors duration-300">
        <div className="w-full max-w-md mx-auto py-10">
          
          {/* Mobile Header (Hidden on Desktop) */}
          <div className="md:hidden flex items-center gap-2 font-mono text-xs tracking-widest text-slate-500 dark:text-slate-400 mb-8 uppercase">
            <GraduationCap className="text-indigo-600 dark:text-indigo-400" size={16} />
            EduTrack Insight
          </div>

          <div className="flex gap-1 p-1 bg-slate-100 dark:bg-slate-800 rounded-lg w-fit mb-10 transition-colors">
            <button 
              onClick={() => handleTabChange('login')}
              className={`px-5 py-2 text-sm font-medium rounded-md transition-colors ${activeTab === 'login' ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-sm' : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'}`}
            >
              Ingresar
            </button>
            <button 
              onClick={() => handleTabChange('register')}
              className={`px-5 py-2 text-sm font-medium rounded-md transition-colors ${activeTab === 'register' ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-sm' : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'}`}
            >
              Crear cuenta
            </button>
          </div>

          <form onSubmit={handleSubmit} className="flex flex-col gap-5 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="mb-2">
              <h2 className="text-3xl font-bold text-slate-900 dark:text-white tracking-tight">
                {activeTab === 'login' ? 'Bienvenido de vuelta' : 'Crear cuenta'}
              </h2>
              <p className="text-slate-500 dark:text-slate-400 mt-1 text-sm">
                {activeTab === 'login' ? 'Accede a tu panel académico' : 'Únete a EduTrack Insight'}
              </p>
            </div>

            {activeTab === 'register' && (
              <label className="flex flex-col gap-1.5">
                <span className="font-mono text-[10px] uppercase tracking-widest text-slate-500 dark:text-slate-400 font-semibold">Nombre completo</span>
                <input type="text" name="name" onChange={handleInputChange} required className="px-4 py-3 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 focus:bg-white dark:focus:bg-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-600/20 dark:focus:ring-indigo-500/40 focus:border-indigo-600 dark:focus:border-indigo-500 transition-all text-slate-900 dark:text-slate-100" />
              </label>
            )}

            <label className="flex flex-col gap-1.5">
              <span className="font-mono text-[10px] uppercase tracking-widest text-slate-500 dark:text-slate-400 font-semibold">Cédula</span>
              <input type="number" name="cedula" onChange={handleInputChange} required placeholder={activeTab === 'login' ? 'Solo números' : ''} className="px-4 py-3 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 focus:bg-white dark:focus:bg-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-600/20 dark:focus:ring-indigo-500/40 focus:border-indigo-600 dark:focus:border-indigo-500 transition-all text-slate-900 dark:text-slate-100" />
            </label>

            {activeTab === 'register' && (
              <>
                <label className="flex flex-col gap-1.5">
                  <span className="font-mono text-[10px] uppercase tracking-widest text-slate-500 dark:text-slate-400 font-semibold">Email</span>
                  <input type="email" name="email" onChange={handleInputChange} required className="px-4 py-3 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 focus:bg-white dark:focus:bg-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-600/20 dark:focus:ring-indigo-500/40 focus:border-indigo-600 dark:focus:border-indigo-500 transition-all text-slate-900 dark:text-slate-100" />
                </label>
                <label className="flex flex-col gap-1.5">
                  <span className="font-mono text-[10px] uppercase tracking-widest text-slate-500 dark:text-slate-400 font-semibold">Teléfono</span>
                  <input type="text" name="telefono" onChange={handleInputChange} required className="px-4 py-3 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 focus:bg-white dark:focus:bg-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-600/20 dark:focus:ring-indigo-500/40 focus:border-indigo-600 dark:focus:border-indigo-500 transition-all text-slate-900 dark:text-slate-100" />
                </label>
              </>
            )}

            <label className="flex flex-col gap-1.5">
              <span className="font-mono text-[10px] uppercase tracking-widest text-slate-500 dark:text-slate-400 font-semibold">Contraseña</span>
              <input type="password" name="password" onChange={handleInputChange} required placeholder="••••••••" className="px-4 py-3 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 focus:bg-white dark:focus:bg-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-600/20 dark:focus:ring-indigo-500/40 focus:border-indigo-600 dark:focus:border-indigo-500 transition-all text-slate-900 dark:text-slate-100" />
            </label>

            {activeTab === 'register' && (
              <label className="flex flex-col gap-1.5">
                <span className="font-mono text-[10px] uppercase tracking-widest text-slate-500 dark:text-slate-400 font-semibold">Rol</span>
                <select name="role" onChange={handleInputChange} className="px-4 py-3 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 focus:bg-white dark:focus:bg-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-600/20 dark:focus:ring-indigo-500/40 focus:border-indigo-600 dark:focus:border-indigo-500 transition-all text-slate-900 dark:text-slate-100 appearance-none">
                  <option value="user">Estudiante</option>
                  <option value="moderator">Docente</option>
                  <option value="admin">Administrador</option>
                </select>
              </label>
            )}

            <button 
              type="submit" 
              disabled={isSubmitting}
              className="mt-2 w-full flex items-center justify-center gap-2 bg-slate-900 dark:bg-indigo-600 hover:bg-indigo-600 dark:hover:bg-indigo-500 disabled:bg-slate-400 dark:disabled:bg-slate-700 text-white py-3.5 px-6 rounded-lg font-medium transition-all group"
            >
              {isSubmitting ? (
                <Loader2 size={18} className="animate-spin" />
              ) : (
                <>
                  {activeTab === 'login' ? 'Entrar al panel' : 'Registrarme'}
                  {activeTab === 'login' && <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />}
                </>
              )}
            </button>

            {error && (
              <div className={`text-xs font-mono mt-1 ${error.includes('¡Cuenta creada!') ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-500 dark:text-red-400'}`}>
                {error}
              </div>
            )}
          </form>
        </div>
      </main>
    </div>
  );
};

export default AuthPage;
