import React, { useState, useEffect, useContext } from 'react';
import { AuthContext } from '../../context/AuthContext';
import {
    Users,
    CheckCircle,
    UserCheck,
    Calendar,
    TrendingUp,
    BarChart3,
    PieChart,
    Activity,
    Loader2,
    AlertCircle,
    Award,
    Target
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
    AreaChart
} from 'recharts'; // Importar los componentes de recharts

// Componente del Dashboard de Administrador

// Este componente se encargará de mostrar las estadísticas del sistema de orientación vocacional
// y las métricas de los usuarios registrados, tests completados, etc.

const AdminDashboard = () => {
    const { token } = useContext(AuthContext);
    const [loading, setLoading] = useState(true);
    const [stats, setStats] = useState(null);
    const [error, setError] = useState(null);

    // Aquí se realiza la llamada a la API para obtener las estadísticas del dashboard

    useEffect(() => {
        const fetchStats = async () => {
            if (!token) return;

            try {
                setLoading(true);
 

                const BASE_URL = process.env.REACT_APP_API_URL;
                const response = await fetch(`${BASE_URL}/admin/dashboard/stats`, {
                    headers: {
                        'Authorization': `Bearer ${token}`
                    }
                });

                if (!response.ok) {
                    throw new Error('La respuesta del servidor no fue exitosa.');
                }
                
                const data = await response.json();
                setStats(data);
                setLoading(false);

            } catch (err) {
                console.error("Error al cargar las estadísticas:", err);
                setError('Error al cargar las estadísticas del dashboard');
                setLoading(false);
            }
        };

        fetchStats();
    }, [token]);

    // Si no hay token, mostramos un mensaje de acceso restringido
    // Si hay un error, mostramos un mensaje de error
    // Si está cargando, mostramos un spinner o mensaje de carga

    if (!token) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 flex items-center justify-center p-4">
                <div className="bg-white/80 backdrop-blur-sm rounded-3xl shadow-md border border-white/20 p-12 text-center max-w-md">
                    <div className="w-20 h-20 bg-gradient-to-r from-red-500 to-rose-600 rounded-full flex items-center justify-center mx-auto mb-6">
                        <AlertCircle className="w-10 h-10 text-white" />
                    </div>
                    <h2 className="text-2xl font-bold text-gray-800 mb-3">Acceso Restringido</h2>
                    <p className="text-gray-600">No tienes permisos de administrador para ver esta página.</p>
                </div>
            </div>
        );
    }

    if (loading) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 flex items-center justify-center p-4">
                <div className="bg-white/80 backdrop-blur-sm rounded-3xl shadow-md border border-white/20 p-12 text-center max-w-md">
                    <div className="relative mb-6">
                        <div className="w-20 h-20 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-full flex items-center justify-center mx-auto">
                            <Loader2 className="w-10 h-10 animate-spin text-white" />
                        </div>
                        <div className="absolute -inset-4 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-full opacity-20 animate-pulse"></div>
                    </div>
                    <h2 className="text-2xl font-bold text-gray-800 mb-3">Cargando Dashboard</h2>
                    <p className="text-gray-600 mb-4">Obteniendo estadísticas del sistema...</p>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                        <div className="bg-gradient-to-r from-blue-500 to-indigo-600 h-2 rounded-full animate-pulse" style={{ width: '60%' }}></div>
                    </div>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-slate-50 via-red-50 to-rose-100 flex items-center justify-center p-4">
                <div className="bg-white/80 backdrop-blur-sm rounded-3xl shadow-md border border-white/20 p-12 text-center max-w-md">
                    <div className="w-20 h-20 bg-gradient-to-r from-red-500 to-rose-600 rounded-full flex items-center justify-center mx-auto mb-6">
                        <AlertCircle className="w-10 h-10 text-white" />
                    </div>
                    <h2 className="text-2xl font-bold text-gray-800 mb-3">Error</h2>
                    <p className="text-red-600">{error}</p>
                </div>
            </div>
        );
    }

    if (!stats) return null;

    // Datos para los gráficos y tablas
    const genderData = [
        { name: 'Hombres', value: stats.maleUsers, color: '#3b82f6' },
        { name: 'Mujeres', value: stats.femaleUsers, color: '#ec4899' }
    ];
    // Datos para la distribución de tests completados y pendientes
    const completionData = [
        { name: 'Completados', value: stats.completedTests, color: '#10b981' },
        { name: 'Pendientes', value: stats.pendingTests, color: '#f59e0b' }
    ];

    // Renderizado del Dashboard
    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 p-4">
            <div className="max-w-7xl mx-auto">

                {/* Header */}
                <div className="text-center mb-12 relative">
                    <div className="absolute inset-0 flex items-center justify-center opacity-10">
                        <div className="w-96 h-96 bg-gradient-to-r from-purple-500 to-indigo-600 rounded-full blur-3xl"></div>
                    </div>
                    <div className="relative">
                        <div className="inline-flex items-center space-x-2 bg-white/80 backdrop-blur-sm rounded-full px-6 py-2 mb-6 border border-white/20">
                            <Activity className="w-5 h-5 text-purple-600" />
                            <span className="text-sm font-medium text-purple-600">Panel de Control</span>
                        </div>
                        <h1 className="text-5xl lg:text-6xl font-bold bg-gradient-to-r from-gray-800 via-purple-800 to-indigo-800 bg-clip-text text-transparent mb-4">
                            Dashboard Administrativo
                        </h1>
                        <p className="text-xl text-gray-600 max-w-2xl mx-auto">Monitoreo y estadísticas del sistema de orientación vocacional</p>
                        <div className="w-32 h-1.5 bg-gradient-to-r from-purple-500 via-indigo-500 to-blue-500 mx-auto rounded-full mt-6"></div>
                    </div>
                </div>

                {/* Main Stats Cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-12">

                    {/* Total Users */}
                    <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-md border border-white/20 p-6 relative overflow-hidden">
                        <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-indigo-500/5"></div>
                        <div className="relative">
                            <div className="flex items-center justify-between mb-4">
                                <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center">
                                    <Users className="w-6 h-6 text-white" />
                                </div>
                                <div className="text-right">
                                    <p className="text-3xl font-bold text-gray-800">{stats.totalUsers.toLocaleString()}</p>
                                    <p className="text-sm text-blue-600 font-medium">+12% este mes</p>
                                </div>
                            </div>
                            <h3 className="text-lg font-semibold text-gray-800">Usuarios Registrados</h3>
                            <p className="text-gray-600 text-sm">Total de estudiantes en el sistema</p>
                        </div>
                    </div>

                    {/* Completed Tests */}
                    <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-md border border-white/20 p-6 relative overflow-hidden">
                        <div className="absolute inset-0 bg-gradient-to-br from-green-500/5 to-emerald-500/5"></div>
                        <div className="relative">
                            <div className="flex items-center justify-between mb-4">
                                <div className="w-12 h-12 bg-gradient-to-r from-green-500 to-emerald-600 rounded-xl flex items-center justify-center">
                                    <CheckCircle className="w-6 h-6 text-white" />
                                </div>
                                <div className="text-right">
                                    <p className="text-3xl font-bold text-gray-800">{stats.completedTests.toLocaleString()}</p>
                                    <p className="text-sm text-green-600 font-medium">{stats.testCompletionRate}% completado</p>
                                </div>
                            </div>
                            <h3 className="text-lg font-semibold text-gray-800">Tests Completados</h3>
                            <p className="text-gray-600 text-sm">Evaluaciones finalizadas</p>
                        </div>
                    </div>

                    {/* Gender Balance */}
                    <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-md border border-white/20 p-6 relative overflow-hidden">
                        <div className="absolute inset-0 bg-gradient-to-br from-purple-500/5 to-pink-500/5"></div>
                        <div className="relative">
                            <div className="flex items-center justify-between mb-4">
                                <div className="w-12 h-12 bg-gradient-to-r from-purple-500 to-pink-600 rounded-xl flex items-center justify-center">
                                    <UserCheck className="w-6 h-6 text-white" />
                                </div>
                                <div className="text-right">
                                    <p className="text-lg font-bold text-gray-800">
                                        {stats.maleUsers} / {stats.femaleUsers}
                                    </p>
                                    <p className="text-sm text-purple-600 font-medium">H / M</p>
                                </div>
                            </div>
                            <h3 className="text-lg font-semibold text-gray-800">Distribución de Género</h3>
                            <p className="text-gray-600 text-sm">Balance entre usuarios</p>
                        </div>
                    </div>

                    {/* Average Age */}
                    <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-md border border-white/20 p-6 relative overflow-hidden">
                        <div className="absolute inset-0 bg-gradient-to-br from-orange-500/5 to-red-500/5"></div>
                        <div className="relative">
                            <div className="flex items-center justify-between mb-4">
                                <div className="w-12 h-12 bg-gradient-to-r from-orange-500 to-red-600 rounded-xl flex items-center justify-center">
                                    <Calendar className="w-6 h-6 text-white" />
                                </div>
                                <div className="text-right">
                                    <p className="text-3xl font-bold text-gray-800">{stats.averageAge}</p>
                                    <p className="text-sm text-orange-600 font-medium">años promedio</p>
                                </div>
                            </div>
                            <h3 className="text-lg font-semibold text-gray-800">Edad Promedio</h3>
                            <p className="text-gray-600 text-sm">De usuarios registrados</p>
                        </div>
                    </div>

                </div>

                {/* Charts Section */}
                <div className="grid grid-cols-1 xl:grid-cols-2 gap-8 mb-12">

                    {/* Top Knowledge Areas */}
                    <div className="bg-white/80 backdrop-blur-sm rounded-3xl shadow-md border border-white/20 overflow-hidden">
                        <div className="bg-gradient-to-r from-indigo-500 to-purple-600 p-6">
                            <div className="flex items-center space-x-3">
                                <div className="w-12 h-12 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center">
                                    <Award className="w-6 h-6 text-white" />
                                </div>
                                <div>
                                    <h3 className="text-2xl font-bold text-white">Áreas Más Populares</h3>
                                    <p className="text-indigo-100">Áreas con mayor puntaje destacado</p>
                                </div>
                            </div>
                        </div>
                        <div className="p-6">
                            <ResponsiveContainer width="100%" height={400}>
                                <BarChart data={stats.topAreas} margin={{ top: 20, right: 30, left: 20, bottom: 80 }}>
                                    <defs>
                                        <linearGradient id="areaGradient" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="0%" stopColor="#6366f1" />
                                            <stop offset="100%" stopColor="#8b5cf6" />
                                        </linearGradient>
                                    </defs>
                                    <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" opacity={0.5} />
                                    <XAxis
                                        dataKey="area"
                                        angle={-45}
                                        textAnchor="end"
                                        interval={0}
                                        tick={{ fontSize: 10, fill: '#6b7280' }}
                                        height={100}
                                    />
                                    <YAxis tick={{ fontSize: 12, fill: '#6b7280' }} />
                                    <Tooltip
                                        contentStyle={{
                                            backgroundColor: '#ffffff',
                                            border: 'none',
                                            borderRadius: '12px',
                                            boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1)'
                                        }}
                                        formatter={(value, name) => [`${value} estudiantes`, 'Cantidad']}
                                    />
                                    <Bar dataKey="count" fill="url(#areaGradient)" radius={[4, 4, 0, 0]} />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </div>

                    {/* Age Distribution */}
                    <div className="bg-white/80 backdrop-blur-sm rounded-3xl shadow-md border border-white/20 overflow-hidden">
                        <div className="bg-gradient-to-r from-green-500 to-teal-600 p-6">
                            <div className="flex items-center space-x-3">
                                <div className="w-12 h-12 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center">
                                    <TrendingUp className="w-6 h-6 text-white" />
                                </div>
                                <div>
                                    <h3 className="text-2xl font-bold text-white">Distribución por Edad</h3>
                                    <p className="text-green-100">Rangos etarios de usuarios</p>
                                </div>
                            </div>
                        </div>
                        <div className="p-6">
                            <ResponsiveContainer width="100%" height={400}>
                                <AreaChart data={stats.ageDistribution}>
                                    <defs>
                                        <linearGradient id="ageGradient" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="0%" stopColor="#10b981" stopOpacity={0.8} />
                                            <stop offset="100%" stopColor="#14b8a6" stopOpacity={0.1} />
                                        </linearGradient>
                                    </defs>
                                    <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" opacity={0.5} />
                                    <XAxis dataKey="ageRange" tick={{ fontSize: 12, fill: '#6b7280' }} />
                                    <YAxis tick={{ fontSize: 12, fill: '#6b7280' }} />
                                    <Tooltip
                                        contentStyle={{
                                            backgroundColor: '#ffffff',
                                            border: 'none',
                                            borderRadius: '12px',
                                            boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1)'
                                        }}
                                        formatter={(value) => [`${value} usuarios`, 'Cantidad']}
                                    />
                                    <Area
                                        type="monotone"
                                        dataKey="count"
                                        stroke="#10b981"
                                        strokeWidth={3}
                                        fill="url(#ageGradient)"
                                    />
                                </AreaChart>
                            </ResponsiveContainer>
                        </div>
                    </div>

                </div>

                {/* Bottom Charts */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-12">

                    {/* Gender Distribution Pie */}
                    <div className="bg-white/80 backdrop-blur-sm rounded-3xl shadow-md border border-white/20 overflow-hidden">
                        <div className="bg-gradient-to-r from-pink-500 to-rose-600 p-6">
                            <div className="flex items-center space-x-3">
                                <div className="w-10 h-10 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center">
                                    <PieChart className="w-5 h-5 text-white" />
                                </div>
                                <div>
                                    <h3 className="text-xl font-bold text-white">Género</h3>
                                    <p className="text-pink-100 text-sm">Distribución</p>
                                </div>
                            </div>
                        </div>
                        <div className="p-6">
                            <ResponsiveContainer width="100%" height={250}>
                                <RechartsPieChart>
                                    <Tooltip
                                        contentStyle={{
                                            backgroundColor: '#ffffff',
                                            border: 'none',
                                            borderRadius: '12px',
                                            boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1)'
                                        }}
                                    />
                                    <Pie
                                        data={genderData}
                                        dataKey="value"
                                        nameKey="name"
                                        cx="50%"
                                        cy="50%"
                                        outerRadius={80}
                                        fill="#8884d8"
                                        label={({ name, value, percent }) => `${name}: ${value} (${(percent * 100).toFixed(0)}%)`}
                                    >
                                        {genderData.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={entry.color} />
                                        ))}
                                    </Pie>
                                </RechartsPieChart>
                            </ResponsiveContainer>
                            <div className="flex justify-center space-x-4 mt-4">
                                {genderData.map((item, index) => (
                                    <div key={index} className="flex items-center space-x-2">
                                        <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }}></div>
                                        <span className="text-sm text-gray-600">{item.name}: {item.value}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Test Completion Pie */}
                    <div className="bg-white/80 backdrop-blur-sm rounded-3xl shadow-md border border-white/20 overflow-hidden">
                        <div className="bg-gradient-to-r from-blue-500 to-cyan-600 p-6">
                            <div className="flex items-center space-x-3">
                                <div className="w-10 h-10 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center">
                                    <Target className="w-5 h-5 text-white" />
                                </div>
                                <div>
                                    <h3 className="text-xl font-bold text-white">Tests</h3>
                                    <p className="text-blue-100 text-sm">Estado</p>
                                </div>
                            </div>
                        </div>
                        <div className="p-6">
                            <ResponsiveContainer width="100%" height={250}>
                                <RechartsPieChart>
                                    <Tooltip
                                        contentStyle={{
                                            backgroundColor: '#ffffff',
                                            border: 'none',
                                            borderRadius: '12px',
                                            boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1)'
                                        }}
                                    />
                                    <Pie
                                        data={completionData}
                                        dataKey="value"
                                        nameKey="name"
                                        cx="50%"
                                        cy="50%"
                                        outerRadius={80}
                                        fill="#8884d8"
                                        label={({ name, value, percent }) => `${name}: ${value} (${(percent * 100).toFixed(0)}%)`}
                                    >
                                        {completionData.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={entry.color} />
                                        ))}
                                    </Pie>
                                </RechartsPieChart>
                            </ResponsiveContainer>
                            <div className="flex justify-center space-x-4 mt-4">
                                {completionData.map((item, index) => (
                                    <div key={index} className="flex items-center space-x-2">
                                        <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }}></div>
                                        <span className="text-sm text-gray-600">{item.name}: {item.value}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Monthly Growth */}
                    <div className="bg-white/80 backdrop-blur-sm rounded-3xl shadow-md border border-white/20 overflow-hidden">
                        <div className="bg-gradient-to-r from-orange-500 to-amber-600 p-6">
                            <div className="flex items-center space-x-3">
                                <div className="w-10 h-10 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center">
                                    <BarChart3 className="w-5 h-5 text-white" />
                                </div>
                                <div>
                                    <h3 className="text-xl font-bold text-white">Crecimiento</h3>
                                    <p className="text-orange-100 text-sm">Mensual</p>
                                </div>
                            </div>
                        </div>
                        <div className="p-6">
                            <ResponsiveContainer width="100%" height={250}>
                                <LineChart data={stats.monthlyRegistrations}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" opacity={0.5} />
                                    <XAxis dataKey="month" tick={{ fontSize: 11, fill: '#6b7280' }} />
                                    <YAxis tick={{ fontSize: 11, fill: '#6b7280' }} />
                                    <Tooltip
                                        contentStyle={{
                                            backgroundColor: '#ffffff',
                                            border: 'none',
                                            borderRadius: '12px',
                                            boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1)'
                                        }}
                                    />
                                    <Line
                                        type="monotone"
                                        dataKey="users"
                                        stroke="#f59e0b"
                                        strokeWidth={3}
                                        dot={{ fill: '#f59e0b', strokeWidth: 2, r: 4 }}
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

export default AdminDashboard;