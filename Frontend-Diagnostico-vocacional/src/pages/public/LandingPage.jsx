import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, BookOpen, BrainCircuit, Activity, WifiOff, GraduationCap } from 'lucide-react';
import ThemeToggle from '../../components/ThemeToggle';

const LandingPage = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 font-sans selection:bg-indigo-200 dark:selection:bg-indigo-900 selection:text-indigo-900 dark:selection:text-indigo-200 transition-colors duration-300">
      {/* Navigation */}
      <nav className="fixed w-full z-50 bg-white/80 dark:bg-slate-950/80 backdrop-blur-md border-b border-slate-200/50 dark:border-slate-800/50 transition-all duration-300">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2 font-bold text-slate-900 dark:text-white">
            <GraduationCap className="text-indigo-600 dark:text-indigo-400" size={24} />
            <span className="text-xl tracking-tight">EduTrack <span className="font-light italic text-indigo-500 dark:text-indigo-400">Insight</span></span>
          </div>
          <div className="flex items-center gap-6">
            <ThemeToggle />
            <button onClick={() => navigate('/auth')} className="text-sm font-semibold text-slate-600 dark:text-slate-300 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors">
              Iniciar sesión
            </button>
            <button onClick={() => navigate('/auth')} className="text-sm font-bold bg-slate-900 dark:bg-indigo-600 text-white px-6 py-2.5 rounded-full hover:bg-indigo-600 dark:hover:bg-indigo-500 transition-all active:scale-95 shadow-lg shadow-slate-900/10 dark:shadow-indigo-900/20">
              Empezar gratis
            </button>
          </div>
        </div>
      </nav>

      {/* Hero Section - 100vh */}
      <main className="min-h-screen flex flex-col items-center justify-center px-6 relative overflow-hidden bg-white dark:bg-slate-950 transition-colors duration-300">
        {/* Abstract Background Elements */}
        <div className="absolute top-0 right-0 -mr-48 -mt-48 w-[800px] h-[800px] bg-indigo-50/50 dark:bg-indigo-900/20 rounded-full blur-[120px] opacity-60 pointer-events-none"></div>
        <div className="absolute bottom-0 left-0 -ml-48 -mb-48 w-[800px] h-[800px] bg-emerald-50/50 dark:bg-emerald-900/20 rounded-full blur-[120px] opacity-60 pointer-events-none"></div>
        
        {/* Decorative Grid Overlay */}
        <div className="absolute inset-0 opacity-[0.02] dark:opacity-[0.05] pointer-events-none" style={{ backgroundImage: 'radial-gradient(#4f46e5 1px, transparent 1px)', backgroundSize: '40px 40px' }}></div>

        <div className="max-w-5xl mx-auto text-center relative z-10 flex flex-col items-center pt-20">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-800 shadow-sm text-indigo-700 dark:text-indigo-400 text-[10px] font-mono font-black tracking-[0.25em] uppercase mb-10 animate-in fade-in zoom-in duration-1000">
            <span className="flex h-2 w-2 relative">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-indigo-500 dark:bg-indigo-400"></span>
            </span>
            Arquitectura Híbrida v2.0
          </div>
          
          <h1 className="text-6xl md:text-8xl font-black text-slate-900 dark:text-white tracking-tighter leading-[0.85] mb-8 animate-in fade-in slide-in-from-bottom-8 duration-1000 font-display">
            Observabilidad <br className="hidden md:block"/>
            académica <em className="italic font-light text-indigo-600 dark:text-indigo-400">total.</em>
          </h1>
          
          <p className="text-xl md:text-2xl text-slate-500 dark:text-slate-400 mb-12 max-w-2xl mx-auto leading-relaxed font-light animate-in fade-in slide-in-from-bottom-12 duration-1000 delay-200">
            EduTrack Insight fusiona el autodescubrimiento vocacional con la analítica de riesgo en tiempo real. <span className="font-medium text-slate-900 dark:text-slate-200">Privado, local y 100% resiliente.</span>
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-5 w-full max-w-md animate-in fade-in slide-in-from-bottom-16 duration-1000 delay-500">
            <button 
              onClick={() => navigate('/auth')} 
              className="w-full sm:w-auto flex items-center justify-center gap-3 bg-slate-900 dark:bg-indigo-600 hover:bg-indigo-600 dark:hover:bg-indigo-500 text-white px-10 py-5 rounded-2xl font-bold transition-all hover:scale-105 active:scale-95 shadow-xl shadow-slate-900/10 dark:shadow-indigo-900/20 group"
            >
              Entrar al Panel
              <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" />
            </button>
            <button className="w-full sm:w-auto px-10 py-5 rounded-2xl font-bold text-slate-600 dark:text-slate-300 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 transition-all active:scale-95">
              Ver Demo
            </button>
          </div>
        </div>

        {/* Scroll Indicator */}
        <div className="absolute bottom-10 left-1/2 -translate-x-1/2 animate-bounce text-slate-300 dark:text-slate-600">
          <div className="w-6 h-10 border-2 border-slate-200 dark:border-slate-700 rounded-full flex justify-center pt-2">
            <div className="w-1.5 h-1.5 bg-slate-200 dark:bg-slate-700 rounded-full"></div>
          </div>
        </div>
      </main>

      {/* Value Proposition Section */}
      <section className="py-32 px-6 bg-slate-50 dark:bg-slate-950 relative z-10 border-y border-slate-200/50 dark:border-slate-800/50 transition-colors duration-300">
        <div className="max-w-7xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-20 items-center">
            <div>
              <span className="text-indigo-600 dark:text-indigo-400 font-mono text-xs font-bold tracking-[0.3em] uppercase block mb-6">El Valor de la Integración</span>
              <h2 className="text-4xl md:text-6xl font-black text-slate-900 dark:text-white leading-[0.95] mb-10 tracking-tighter font-display">
                No solo medimos notas, entendemos el <br/>
                <em className="italic font-medium text-emerald-600 dark:text-emerald-400">potencial humano.</em>
              </h2>
              
              <div className="space-y-10">
                <ValueItem 
                  icon={<BrainCircuit className="text-indigo-600 dark:text-indigo-400" size={28} />}
                  title="Alineación Vocacional"
                  desc="Descubrimos si tu rendimiento académico actual coincide con tus verdaderas pasiones naturales identificadas en nuestros tests profesionales."
                />
                <ValueItem 
                  icon={<Activity className="text-emerald-600 dark:text-emerald-400" size={28} />}
                  title="Detección Temprana"
                  desc="Nuestro semáforo inteligente predice caídas de rendimiento antes de que sucedan, permitiendo una intervención docente oportuna y data-driven."
                />
                <ValueItem 
                  icon={<WifiOff className="text-amber-600 dark:text-amber-400" size={28} />}
                  title="Sin Barreras de Conexión"
                  desc="La educación no puede esperar al Wi-Fi. Registra, analiza y consulta todo en el aula; nosotros sincronizamos cuando vuelvas a estar en línea."
                />
              </div>
            </div>
            
            <div className="relative">
              {/* Visual Component Mockup */}
              <div className="aspect-square bg-white dark:bg-slate-900 rounded-[48px] border border-slate-200 dark:border-slate-800 overflow-hidden shadow-[0_32px_64px_-12px_rgba(0,0,0,0.08)] dark:shadow-none relative group p-1 transition-colors duration-300">
                <div className="absolute inset-0 bg-gradient-to-tr from-indigo-500/5 to-emerald-500/5 dark:from-indigo-500/10 dark:to-emerald-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-700"></div>
                <div className="h-full w-full bg-slate-50/50 dark:bg-slate-950/50 rounded-[46px] flex flex-col justify-center items-center text-center p-12">
                  <div className="w-28 h-28 bg-white dark:bg-slate-800 rounded-[32px] shadow-xl dark:shadow-none flex items-center justify-center mb-10 group-hover:scale-110 transition-transform duration-500 border dark:border-slate-700">
                    <GraduationCap size={56} className="text-indigo-600 dark:text-indigo-400" />
                  </div>
                  <h4 className="text-3xl font-black text-slate-800 dark:text-slate-100 mb-4 tracking-tight">Dashboard 360°</h4>
                  <p className="text-slate-500 dark:text-slate-400 text-lg leading-relaxed font-light">
                    Una vista unificada que pone los datos al servicio del estudiante, eliminando la incertidumbre académica.
                  </p>
                  
                  {/* Decorative Elements */}
                  <div className="absolute top-16 left-16 w-16 h-1 bg-indigo-600/10 dark:bg-indigo-400/20 rounded-full"></div>
                  <div className="absolute bottom-16 right-16 w-16 h-1 bg-emerald-600/10 dark:bg-emerald-400/20 rounded-full"></div>
                </div>
              </div>
              
              {/* Floating Success Badge */}
              <div className="absolute -bottom-10 -right-6 bg-white dark:bg-slate-800 p-8 rounded-3xl shadow-2xl dark:shadow-none border border-slate-100 dark:border-slate-700 animate-in slide-in-from-right-8 duration-1000 delay-300 transition-colors duration-300">
                <div className="flex items-center gap-5">
                  <div className="w-14 h-14 rounded-2xl bg-emerald-50 dark:bg-emerald-900/30 flex items-center justify-center border border-emerald-100 dark:border-emerald-800/50">
                    <Activity className="text-emerald-600 dark:text-emerald-400" size={28} />
                  </div>
                  <div>
                    <p className="text-[10px] uppercase font-black text-slate-400 dark:text-slate-500 tracking-[0.2em]">Estado de Alerta</p>
                    <p className="text-xl font-bold text-slate-800 dark:text-slate-200 tracking-tight">Bajo Riesgo</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Roadmap Section - Using the requested <ol> structure and Brutalist Buttons */}
      <section className="py-32 px-6 bg-white dark:bg-slate-900 transition-colors duration-300 overflow-hidden">
        <div className="max-w-4xl mx-auto">
          <div className="mb-20">
            <h2 className="text-4xl md:text-6xl font-black text-slate-900 dark:text-white mb-6 font-display tracking-tighter">
              Tu camino al <em className="italic font-light text-indigo-600 dark:text-indigo-400">éxito.</em>
            </h2>
            <p className="text-xl text-slate-500 dark:text-slate-400 font-light">Seis pasos diseñados para llevar tu aprendizaje al siguiente nivel profesional.</p>
          </div>

          <ol className="space-y-12 relative">
            {/* Vertical Line */}
            <div className="absolute left-[27px] top-4 bottom-4 w-px bg-slate-200 dark:bg-slate-800 hidden sm:block"></div>
            
            {[
              { title: "Diagnóstico Inicial", desc: "Realiza el test vocacional de 80 ítems para descubrir tus áreas de mayor afinidad." },
              { title: "Perfil Personalizado", desc: "Recibe un análisis detallado generado por Gemma 4 sobre tu potencial profesional." },
              { title: "Gestión de Materias", desc: "Configura tus asignaturas y pesos de evaluación de forma sencilla y offline." },
              { title: "Seguimiento Diario", desc: "Registra tus notas y observa cómo evoluciona tu rendimiento en tiempo real." },
              { title: "Detección de Riesgo", desc: "Nuestro algoritmo te avisa si alguna materia necesita atención inmediata." },
              { title: "Optimización Total", desc: "Usa el simulador de notas para proyectar tus metas y asegurar tu aprobación." }
            ].map((step, idx) => (
              <li key={idx} className="flex gap-8 relative group">
                <div className="w-14 h-14 rounded-full bg-white dark:bg-slate-800 border-2 border-slate-900 dark:border-indigo-500 flex items-center justify-center shrink-0 z-10 font-mono font-bold text-xl text-slate-900 dark:text-white group-hover:bg-slate-900 group-hover:text-white dark:group-hover:bg-indigo-500 transition-all duration-300">
                  {idx + 1}
                </div>
                <div className="pt-2">
                  <h4 className="text-2xl font-bold text-slate-900 dark:text-white mb-2 tracking-tight">{step.title}</h4>
                  <p className="text-slate-500 dark:text-slate-400 leading-relaxed mb-6">{step.desc}</p>
                  
                  {/* The requested button style (Brutalist) */}
                  {idx === 5 && (
                    <button 
                      onClick={() => navigate('/auth')}
                      className="btn-brutalist"
                    >
                      Comenzar mi ruta ahora
                    </button>
                  )}
                </div>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* Features Grid */}
      <section className="py-32 px-6 bg-white dark:bg-slate-950 transition-colors duration-300">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col items-center text-center mb-20">
            <h2 className="text-4xl md:text-5xl font-black text-slate-900 dark:text-white tracking-tight mb-4 font-display">Diseñado para la resiliencia</h2>
            <div className="w-20 h-1.5 bg-indigo-600 dark:bg-indigo-500 rounded-full mb-6"></div>
            <p className="text-xl text-slate-500 dark:text-slate-400 font-light max-w-2xl">Herramientas profesionales que empoderan a estudiantes y docentes en cualquier entorno.</p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            <FeatureCard 
              icon={<BrainCircuit className="text-indigo-600 dark:text-indigo-400" />}
              title="IA Local"
              desc="Asistente Gemma 4 integrado. Privacidad total y respuestas instantáneas sin depender de la nube."
            />
            <FeatureCard 
              icon={<Activity className="text-amber-500 dark:text-amber-400" />}
              title="Semáforo de Riesgo"
              desc="Algoritmos de detección temprana basados en promedios móviles para evitar la reprobación."
            />
            <FeatureCard 
              icon={<BookOpen className="text-emerald-500 dark:text-emerald-400" />}
              title="Perfil Vocacional"
              desc="Alinea tu rendimiento académico con tus afinidades naturales identificadas en tiempo real."
            />
            <FeatureCard 
              icon={<WifiOff className="text-slate-600 dark:text-slate-400" />}
              title="Offline-First"
              desc="Registra y gestiona todo en el aula sin internet. Los datos se sincronizan al conectar."
            />
          </div>
        </div>
      </section>

      {/* Footer / CTA Final */}
      <section className="py-24 px-6 bg-slate-900 dark:bg-slate-950 relative overflow-hidden transition-colors duration-300">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-indigo-600/20 dark:bg-indigo-500/10 rounded-full blur-[120px] pointer-events-none"></div>
        <div className="max-w-4xl mx-auto text-center relative z-10">
          <h2 className="text-4xl md:text-6xl font-black text-white tracking-tight mb-10 leading-tight font-display">
            ¿Listo para transformar <br/> tu <em className="italic font-light text-indigo-400 text-5xl md:text-7xl">aprendizaje?</em>
          </h2>
          <button 
            onClick={() => navigate('/auth')}
            className="bg-white text-slate-900 px-12 py-5 rounded-2xl font-black text-lg hover:bg-indigo-500 hover:text-white transition-all hover:scale-105 active:scale-95 shadow-2xl dark:shadow-indigo-900/20"
          >
            Comenzar Experiencia
          </button>
        </div>
      </section>
    </div>
  );
};

const ValueItem = ({ icon, title, desc }) => (
  <div className="flex gap-8 group">
    <div className="w-16 h-16 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 flex items-center justify-center shrink-0 shadow-sm dark:shadow-none group-hover:border-indigo-200 dark:group-hover:border-indigo-700 group-hover:bg-indigo-50/30 dark:group-hover:bg-indigo-900/20 transition-all duration-300">
      {icon}
    </div>
    <div>
      <h4 className="text-2xl font-bold text-slate-900 dark:text-slate-100 mb-2 tracking-tight">{title}</h4>
      <p className="text-slate-500 dark:text-slate-400 leading-relaxed font-light text-lg">{desc}</p>
    </div>
  </div>
);

const FeatureCard = ({ icon, title, desc }) => (
  <div className="p-10 rounded-[32px] bg-slate-50 dark:bg-slate-900/50 border border-slate-100 dark:border-slate-800 hover:bg-white dark:hover:bg-slate-900 hover:border-white dark:hover:border-slate-700 hover:shadow-[0_24px_48px_-12px_rgba(0,0,0,0.06)] dark:hover:shadow-none transition-all duration-500 group">
    <div className="w-16 h-16 bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 flex items-center justify-center mb-8 shadow-sm dark:shadow-none group-hover:scale-110 transition-transform duration-500">
      {React.cloneElement(icon, { size: 28 })}
    </div>
    <h3 className="text-2xl font-bold text-slate-900 dark:text-slate-100 mb-3 tracking-tight">{title}</h3>
    <p className="text-slate-500 dark:text-slate-400 text-base leading-relaxed font-light">{desc}</p>
  </div>
);

export default LandingPage;