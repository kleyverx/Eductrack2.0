import React, { useState, useEffect, useContext } from 'react';
import { AuthContext } from '../../context/AuthContext';
import {
    Users,
    CheckCircle,
    UserCheck,
    Calendar,
    BarChart3,
    Activity,
    Loader2,
    AlertCircle,
    Award,
    Target,
    TrendingUp,
    PieChart as PieIcon,
} from 'lucide-react';
import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    PieChart as RechartsPieChart,
    Pie,
    Cell,
    LineChart,
    Line,
    Area,
    AreaChart,
} from 'recharts';

/**
 * Dashboard Administrativo (Sistema de Diseño "Quiet Academic").
 * Muestra métricas globales del sistema. Tarjetas blancas, acentos sobrios
 * y paleta coherente (indigo / emerald / amber / rose).
 */

// Paleta unificada para las gráficas.
const PALETTE = {
    indigo: '#4f46e5',
    emerald: '#10b981',
    amber: '#f59e0b',
    rose: '#f43f5e',
    sky: '#0ea5e9',
    slate: '#94a3b8',
};

// Estilo común para los tooltips de Recharts.
const TOOLTIP_STYLE = {
    backgroundColor: '#ffffff',
    border: '1px solid #e2e8f0',
    borderRadius: '12px',
    fontSize: '12px',
    boxShadow: '0 4px 12px -2px rgba(0,0,0,0.08)',
};

/** Tarjeta de KPI reutilizable, estilo Quiet Academic. */
const StatCard = ({ Icon, label, sublabel, value, badge, accentText, accentBg }) => (
    <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 hover:shadow-md transition-shadow">
        <div className="flex items-center justify-between mb-4">
            <div className={`w-12 h-12 ${accentBg} ${accentText} rounded-xl flex items-center justify-center`}>
                <Icon className="w-6 h-6" />
            </div>
            <div className="text-right">
                <p className="text-3xl font-bold text-slate-900">{value}</p>
                {badge && <p className={`text-sm font-medium ${accentText}`}>{badge}</p>}
            </div>
        </div>
        <h3 className="text-lg font-semibold text-slate-800">{label}</h3>
        <p className="text-slate-500 text-sm">{sublabel}</p>
    </div>
);

/** Encabezado de sección sobrio para los paneles de gráficas. */
const SectionHeader = ({ Icon, title, subtitle, accentText, accentBg }) => (
    <div className="flex items-center gap-3 p-6 border-b border-slate-100">
        <div className={`w-11 h-11 ${accentBg} ${accentText} rounded-xl flex items-center justify-center`}>
            <Icon className="w-5 h-5" />
        </div>
        <div>
            <h3 className="text-lg font-bold text-slate-900">{title}</h3>
            <p className="text-slate-500 text-sm">{subtitle}</p>
        </div>
    </div>
);

const AdminDashboard = () => {
    const { token } = useContext(AuthContext);
    const [loading, setLoading] = useState(true);
    const [stats, setStats] = useState(null);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchStats = async () => {
            if (!token) return;
            try {
                setLoading(true);
                const BASE_URL = process.env.REACT_APP_API_URL;
                const response = await fetch(`${BASE_URL}/admin/dashboard/stats`, {
                    headers: { Authorization: `Bearer ${token}` },
                });
                if (!response.ok) {
                    throw new Error('La respuesta del servidor no fue exitosa.');
                }
                const data = await response.json();
                setStats(data);
            } catch (err) {
                console.error('Error al cargar las estadísticas:', err);
                setError('Error al cargar las estadísticas del dashboard');
            } finally {
                setLoading(false);
            }
        };
        fetchStats();
    }, [token]);

    // Estados de acceso, carga y error con el estilo limpio del sistema.
    if (!token) {
        return (
            <StatusScreen
                Icon={AlertCircle}
                accent="rose"
                title="Acceso Restringido"
                message="No tienes permisos de administrador para ver esta página."
            />
        );
    }

    if (loading) {
        return (
            <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
                <div className="bg-white rounded-3xl shadow-sm border border-slate-100 p-12 text-center max-w-md">
                    <div className="w-16 h-16 bg-indigo-50 rounded-2xl flex items-center justify-center mx-auto mb-5">
                        <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
                    </div>
                    <h2 className="text-xl font-bold text-slate-900 mb-2">Cargando Dashboard</h2>
                    <p className="text-slate-500 text-sm">Obteniendo estadísticas del sistema...</p>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <StatusScreen
                Icon={AlertCircle}
                accent="rose"
                title="Error"
                message={error}
            />
        );
    }

    if (!stats) return null;

    const genderData = [
        { name: 'Hombres', value: stats.maleUsers, color: PALETTE.indigo },
        { name: 'Mujeres', value: stats.femaleUsers, color: PALETTE.rose },
    ];
    const completionData = [
        { name: 'Completados', value: stats.completedTests, color: PALETTE.emerald },
        { name: 'Pendientes', value: stats.pendingTests, color: PALETTE.amber },
    ];

    return (
        <div className="min-h-screen bg-slate-50 p-6">
            <div className="max-w-7xl mx-auto">
                {/* Header */}
                <header className="mb-8">
                    <div className="inline-flex items-center gap-2 bg-white border border-slate-100 rounded-full px-4 py-1.5 mb-4 shadow-sm">
                        <Activity className="w-4 h-4 text-indigo-600" />
                        <span className="text-xs font-bold text-indigo-600 uppercase tracking-wider">
                            Panel de Control
                        </span>
                    </div>
                    <h1 className="text-3xl font-bold text-slate-900 tracking-tight mb-2">
                        Dashboard Administrativo
                    </h1>
                    <p className="text-slate-500">
                        Monitoreo y estadísticas del sistema de orientación vocacional.
                    </p>
                </header>

                {/* KPIs */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                    <StatCard
                        Icon={Users}
                        label="Usuarios Registrados"
                        sublabel="Total de estudiantes en el sistema"
                        value={stats.totalUsers.toLocaleString()}
                        accentText="text-indigo-600"
                        accentBg="bg-indigo-50"
                    />
                    <StatCard
                        Icon={CheckCircle}
                        label="Tests Completados"
                        sublabel="Evaluaciones finalizadas"
                        value={stats.completedTests.toLocaleString()}
                        badge={`${stats.testCompletionRate}% completado`}
                        accentText="text-emerald-600"
                        accentBg="bg-emerald-50"
                    />
                    <StatCard
                        Icon={UserCheck}
                        label="Distribución de Género"
                        sublabel="Hombres / Mujeres"
                        value={`${stats.maleUsers} / ${stats.femaleUsers}`}
                        accentText="text-sky-600"
                        accentBg="bg-sky-50"
                    />
                    <StatCard
                        Icon={Calendar}
                        label="Edad Promedio"
                        sublabel="De usuarios registrados"
                        value={stats.averageAge}
                        badge="años promedio"
                        accentText="text-amber-600"
                        accentBg="bg-amber-50"
                    />
                </div>

                {/* Gráficas principales */}
                <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 mb-8">
                    {/* Áreas más populares */}
                    <div className="bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden">
                        <SectionHeader
                            Icon={Award}
                            title="Áreas Más Populares"
                            subtitle="Áreas con mayor puntaje destacado"
                            accentText="text-indigo-600"
                            accentBg="bg-indigo-50"
                        />
                        <div className="p-6">
                            <ResponsiveContainer width="100%" height={360}>
                                <BarChart data={stats.topAreas} margin={{ top: 10, right: 20, left: 0, bottom: 80 }}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                                    <XAxis
                                        dataKey="area"
                                        angle={-45}
                                        textAnchor="end"
                                        interval={0}
                                        tick={{ fontSize: 10, fill: '#94a3b8' }}
                                        height={100}
                                        axisLine={false}
                                        tickLine={false}
                                    />
                                    <YAxis tick={{ fontSize: 12, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                                    <Tooltip
                                        contentStyle={TOOLTIP_STYLE}
                                        cursor={{ fill: '#f8fafc' }}
                                        formatter={(value) => [`${value} estudiantes`, 'Cantidad']}
                                    />
                                    <Bar dataKey="count" fill={PALETTE.indigo} radius={[6, 6, 0, 0]} maxBarSize={48} />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </div>

                    {/* Distribución por edad */}
                    <div className="bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden">
                        <SectionHeader
                            Icon={TrendingUp}
                            title="Distribución por Edad"
                            subtitle="Rangos etarios de usuarios"
                            accentText="text-emerald-600"
                            accentBg="bg-emerald-50"
                        />
                        <div className="p-6">
                            <ResponsiveContainer width="100%" height={360}>
                                <AreaChart data={stats.ageDistribution} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
                                    <defs>
                                        <linearGradient id="ageGradient" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="0%" stopColor={PALETTE.emerald} stopOpacity={0.25} />
                                            <stop offset="100%" stopColor={PALETTE.emerald} stopOpacity={0} />
                                        </linearGradient>
                                    </defs>
                                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                                    <XAxis dataKey="ageRange" tick={{ fontSize: 12, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                                    <YAxis tick={{ fontSize: 12, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                                    <Tooltip contentStyle={TOOLTIP_STYLE} formatter={(value) => [`${value} usuarios`, 'Cantidad']} />
                                    <Area
                                        type="monotone"
                                        dataKey="count"
                                        stroke={PALETTE.emerald}
                                        strokeWidth={2.5}
                                        fill="url(#ageGradient)"
                                    />
                                </AreaChart>
                            </ResponsiveContainer>
                        </div>
                    </div>
                </div>

                {/* Gráficas secundarias */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Género */}
                    <div className="bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden">
                        <SectionHeader
                            Icon={PieIcon}
                            title="Género"
                            subtitle="Distribución"
                            accentText="text-rose-600"
                            accentBg="bg-rose-50"
                        />
                        <div className="p-6">
                            <DonutChart data={genderData} />
                        </div>
                    </div>

                    {/* Tests */}
                    <div className="bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden">
                        <SectionHeader
                            Icon={Target}
                            title="Tests"
                            subtitle="Estado de finalización"
                            accentText="text-sky-600"
                            accentBg="bg-sky-50"
                        />
                        <div className="p-6">
                            <DonutChart data={completionData} />
                        </div>
                    </div>

                    {/* Crecimiento mensual */}
                    <div className="bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden">
                        <SectionHeader
                            Icon={BarChart3}
                            title="Crecimiento"
                            subtitle="Registros mensuales"
                            accentText="text-amber-600"
                            accentBg="bg-amber-50"
                        />
                        <div className="p-6">
                            <ResponsiveContainer width="100%" height={250}>
                                <LineChart data={stats.monthlyRegistrations} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                                    <XAxis dataKey="month" tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                                    <YAxis tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                                    <Tooltip contentStyle={TOOLTIP_STYLE} />
                                    <Line
                                        type="monotone"
                                        dataKey="users"
                                        stroke={PALETTE.amber}
                                        strokeWidth={2.5}
                                        dot={{ fill: PALETTE.amber, strokeWidth: 2, stroke: '#fff', r: 4 }}
                                        activeDot={{ r: 6 }}
                                    />
                                </LineChart>
                            </ResponsiveContainer>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

/** Gráfico de dona reutilizable con leyenda inferior. */
const DonutChart = ({ data }) => (
    <>
        <ResponsiveContainer width="100%" height={220}>
            <RechartsPieChart>
                <Tooltip contentStyle={TOOLTIP_STYLE} />
                <Pie
                    data={data}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    innerRadius={55}
                    outerRadius={85}
                    paddingAngle={2}
                    label={({ percent }) => `${(percent * 100).toFixed(0)}%`}
                    labelLine={false}
                >
                    {data.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                </Pie>
            </RechartsPieChart>
        </ResponsiveContainer>
        <div className="flex justify-center gap-5 mt-3">
            {data.map((item) => (
                <div key={item.name} className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: item.color }} />
                    <span className="text-sm text-slate-600">
                        {item.name}: <span className="font-semibold text-slate-800">{item.value}</span>
                    </span>
                </div>
            ))}
        </div>
    </>
);

/** Pantalla de estado (acceso restringido / error) con estilo limpio. */
const StatusScreen = ({ Icon, title, message, accent }) => {
    const accentMap = {
        rose: { bg: 'bg-rose-50', text: 'text-rose-600' },
        indigo: { bg: 'bg-indigo-50', text: 'text-indigo-600' },
    };
    const a = accentMap[accent] || accentMap.indigo;
    return (
        <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-3xl shadow-sm border border-slate-100 p-12 text-center max-w-md">
                <div className={`w-16 h-16 ${a.bg} rounded-2xl flex items-center justify-center mx-auto mb-5`}>
                    <Icon className={`w-8 h-8 ${a.text}`} />
                </div>
                <h2 className="text-xl font-bold text-slate-900 mb-2">{title}</h2>
                <p className="text-slate-500 text-sm">{message}</p>
            </div>
        </div>
    );
};

export default AdminDashboard;
