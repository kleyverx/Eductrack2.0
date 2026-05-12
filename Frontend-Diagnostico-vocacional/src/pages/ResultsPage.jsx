import React, { useEffect, useState, useContext, useRef } from 'react';
import { useParams } from 'react-router-dom';
import { getResultById } from '../api/results';
import { getUser } from '../api/user';
import { AuthContext } from '../context/AuthContext';
import { exportToPDF } from '../utils/exportToPDF';
import { FileDown, BarChart3, User, Loader2, AlertCircle, TrendingUp, Award, Brain, Eye, Sparkles } from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LabelList,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
} from 'recharts';
import ChatBot from '../components/Chatbot';

// Componente ResultsPage
const ResultsPage = () => {
  const { token } = useContext(AuthContext);
  const { id } = useParams();
  const [loading, setLoading] = useState(true);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const [userData, setUserData] = useState({});
  const [showRadar, setShowRadar] = useState(false);
  const chartRef = useRef();

  //  Función para exportar resultados a PDF
  useEffect(() => {
    const fetch = async () => {
      if (!token || !id) return;

      try {
        setLoading(true);
        const fetchedResult = await getResultById(id, token);
        const userData = await getUser(token);
        setResult(fetchedResult);
        setUserData(userData);
      } catch (err) {
        setError('No se pudo obtener el resultado');
      } finally {
        setLoading(false);
      }
    };

    fetch();
  }, [token, id]);

  // Función para exportar a PDF
  if (!token) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 flex items-center justify-center p-4">
        <div className="bg-white/80 backdrop-blur-sm rounded-3xl shadow-md border border-white/20 p-12 text-center max-w-md">
          <div className="w-20 h-20 bg-gradient-to-r from-red-500 to-rose-600 rounded-full flex items-center justify-center mx-auto mb-6">
            <AlertCircle className="w-10 h-10 text-white" />
          </div>
          <h2 className="text-2xl font-bold text-gray-800 mb-3">Acceso Restringido</h2>
          <p className="text-gray-600">No estás autenticado para ver esta página.</p>
        </div>
      </div>
    );
  }
//  Si no hay ID, mostrar un mensaje de error
  if (!id) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 flex items-center justify-center p-4">
        <div className="bg-white/80 backdrop-blur-sm rounded-3xl shadow-md border border-white/20 p-12 text-center max-w-md">
          <div className="w-20 h-20 bg-gradient-to-r from-red-500 to-rose-600 rounded-full flex items-center justify-center mx-auto mb-6">
            <AlertCircle className="w-10 h-10 text-white" />
          </div>
          <h2 className="text-2xl font-bold text-gray-800 mb-3">ID Requerido</h2>
          <p className="text-gray-600">Se requiere un ID de resultado para mostrar la información.</p>
        </div>
      </div>
    );
  }
// Si está cargando, mostrar un spinner
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
          <h2 className="text-2xl font-bold text-gray-800 mb-3">Generando Resultado</h2>
          <p className="text-gray-600 mb-4">Por favor espera mientras procesamos tu información...</p>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div className="bg-gradient-to-r from-blue-500 to-indigo-600 h-2 rounded-full animate-pulse" style={{ width: '75%' }}></div>
          </div>
        </div>
      </div>
    );
  }
// Si hay un error, mostrar un mensaje de error
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
// Si no hay resultados, mostrar un mensaje de "Sin Resultados"
  if (!result) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-gray-50 to-slate-100 flex items-center justify-center p-4">
        <div className="bg-white/80 backdrop-blur-sm rounded-3xl shadow-md border border-white/20 p-12 text-center max-w-md">
          <div className="w-20 h-20 bg-gradient-to-r from-gray-500 to-slate-600 rounded-full flex items-center justify-center mx-auto mb-6">
            <BarChart3 className="w-10 h-10 text-white" />
          </div>
          <h2 className="text-2xl font-bold text-gray-800 mb-3">Sin Resultados</h2>
          <p className="text-gray-600">No se encontró ningún resultado disponible.</p>
        </div>
      </div>
    );
  }

  const chartData = Object.entries(result.results).map(([area, score]) => ({
    area: area.length > 10 ? area.substring(0, 10) + '...' : area,
    fullArea: area,
    score,
  })); // Datos para el gráfico de barras

  // Datos para el gráfico radar
  const radarData = chartData;

  const topAreas = Object.entries(result.results)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 3); // Las 3 áreas con mayor puntuación

  const averageScore = Object.values(result.results).reduce((a, b) => a + b, 0) / Object.values(result.results).length; // Promedio de puntuación

  // Función para exportar a PDF
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 p-4 w-full">
      <div className="max-w-7xl mx-auto">

        {/* Animated Header */}
        <div className="text-center mb-12 relative">
          <div className="absolute inset-0 flex items-center justify-center opacity-10">
            <div className="w-96 h-96 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-full blur-3xl"></div>
          </div>
          <div className="relative">
            <div className="inline-flex items-center space-x-2 bg-white/80 backdrop-blur-sm rounded-full px-6 py-2 mb-6 border border-white/20">
              <Sparkles className="w-5 h-5 text-indigo-600" />
              <span className="text-sm font-medium text-indigo-600">Resultados Listos</span>
            </div>
            <h1 className="text-5xl lg:text-6xl font-bold bg-gradient-to-r from-gray-800 via-blue-800 to-indigo-800 bg-clip-text text-transparent mb-4">
              Orientación Vocacional
            </h1>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">Tu perfil vocacional personalizado basado en análisis científico</p>
            <div className="w-32 h-1.5 bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-500 mx-auto rounded-full mt-6"></div>
          </div>
        </div>

        {/* User Info Card */}
        <div className="bg-white/80 backdrop-blur-sm rounded-3xl shadow-md border border-white/20 mb-12 overflow-hidden">
          <div className="bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 p-8 relative overflow-hidden">
            <div className="absolute inset-0 bg-[url('data:image/svg+xml,%3Csvg width=%2260%22 height=%2260%22 viewBox=%220%200%2060%2060%22 xmlns=%22http://www.w3.org/2000/svg%22%3E%3Cg fill=%22none%22 fill-rule=%22evenodd%22%3E%3Cg fill=%22%23ffffff%22 fill-opacity=%220.1%22%3E%3Ccircle cx=%2230%22 cy=%2230%22 r=%222%22/%3E%3C/g%3E%3C/g%3E%3C/svg%3E')] opacity-30"></div>
            <div className="relative flex items-center justify-between">

              <div className="flex items-center space-x-4">
                <div className="w-16 h-16 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center border border-white/30">
                  <User className="w-8 h-8 text-white" />
                </div>
                <div className="text-white">
                  <h3 className="text-2xl font-bold mb-1">Resultados</h3>
                  <p className="text-blue-100">Tu perfil vocacional personalizado</p>
                </div>
              </div>
              <div className="flex space-x-3">
                <button
                  onClick={() => setShowRadar(!showRadar)}
                  className="bg-white/20 backdrop-blur-sm text-white p-3 rounded-xl hover:bg-white/30 transition-all duration-200 border border-white/30"
                >
                  <Eye className="w-5 h-5" />
                </button>
              </div>
            </div>
          </div>

          <div className="p-8">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="text-center col-span-1 md:col-span-1">
                <h2 className="text-2xl lg:text-3xl font-bold text-gray-800 mb-2">
                  {userData.name} {userData.secondName} {userData.apellido} {userData.segundoApellido}
                </h2>
                <p className="text-lg text-gray-600 bg-gray-100 inline-block px-4 py-2 rounded-xl font-mono">
                  {userData.cedula}
                </p>
              </div>

              <div className="text-center">
                <div className="w-16 h-16 bg-gradient-to-r from-green-500 to-emerald-600 rounded-2xl flex items-center justify-center mx-auto mb-3">
                  <TrendingUp className="w-8 h-8 text-white" />
                </div>
                <h3 className="text-lg font-semibold text-gray-800">Promedio General</h3>
                <p className="text-3xl font-bold text-green-600">{averageScore.toFixed(1)}</p>
              </div>

              <div className="text-center">
                <div className="w-16 h-16 bg-gradient-to-r from-yellow-500 to-orange-600 rounded-2xl flex items-center justify-center mx-auto mb-3">
                  <Award className="w-8 h-8 text-white" />
                </div>
                <h3 className="text-lg font-semibold text-gray-800">Área Destacada</h3>
                <p className="text-lg font-bold text-orange-600">{topAreas[0][0]}</p>
                <p className="text-2xl font-bold text-orange-600">{topAreas[0][1]}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Top Areas Highlights */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
          {topAreas.map(([area, score], index) => (
            <div key={area} className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-md border border-white/20 p-6 text-center relative overflow-hidden">
              <div className={`absolute inset-0 bg-gradient-to-br opacity-5 ${index === 0 ? 'from-yellow-400 to-orange-500' :
                index === 1 ? 'from-blue-400 to-indigo-500' :
                  'from-green-400 to-emerald-500'
                }`}></div>
              <div className="relative">
                <div className={`w-12 h-12 mx-auto mb-4 rounded-xl flex items-center justify-center ${index === 0 ? 'bg-gradient-to-r from-yellow-500 to-orange-500' :
                  index === 1 ? 'bg-gradient-to-r from-blue-500 to-indigo-500' :
                    'bg-gradient-to-r from-green-500 to-emerald-500'
                  }`}>
                  <span className="text-white font-bold text-lg">#{index + 1}</span>
                </div>
                <h3 className="font-bold text-gray-800 mb-2">{area}</h3>
                <p className="text-3xl font-bold text-gray-700">{score}</p>
                <div className="w-full bg-gray-200 rounded-full h-2 mt-3">
                  <div
                    className={`h-2 rounded-full ${index === 0 ? 'bg-gradient-to-r from-yellow-500 to-orange-500' :
                      index === 1 ? 'bg-gradient-to-r from-blue-500 to-indigo-500' :
                        'bg-gradient-to-r from-green-500 to-emerald-500'
                      }`}
                    style={{ width: `${score}%` }}
                  ></div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Charts Section */}
        <div className={`grid grid-cols-1 ${showRadar ? 'xl:grid-cols-2' : ''} gap-8 mb-12`}>

          {/* Bar Chart */}
          <div className="bg-white/80 backdrop-blur-sm rounded-3xl shadow-md border border-white/20 overflow-hidden">
            <div className="bg-gradient-to-r from-blue-500 to-indigo-600 p-6">
              <div className="flex items-center space-x-3">
                <div className="w-12 h-12 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center">
                  <BarChart3 className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h3 className="text-2xl font-bold text-white">Áreas de Interés</h3>
                  <p className="text-blue-100">Puntuación por categorías vocacionales</p>
                </div>
              </div>
            </div>
            <div ref={chartRef} className="p-6">
              <ResponsiveContainer width="100%" height={400}>
                <BarChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 60 }}>
                  <defs>
                    <linearGradient id="barGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#3b82f6" />
                      <stop offset="50%" stopColor="#6366f1" />
                      <stop offset="100%" stopColor="#8b5cf6" />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" opacity={0.5} />
                  <XAxis
                    dataKey="area"
                    angle={-45}
                    textAnchor="end"
                    interval={0}
                    tick={{ fontSize: 11, fill: '#6b7280' }}
                    height={80}
                  />
                  <YAxis tick={{ fontSize: 12, fill: '#6b7280' }} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#ffffff',
                      border: 'none',
                      borderRadius: '16px',
                      boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)',
                      backdropFilter: 'blur(10px)'
                    }}
                    formatter={(value, name, props) => [value, props.payload.fullArea]}
                  />
                  <Bar dataKey="score" fill="url(#barGradient)" radius={[8, 8, 0, 0]}>
                    <LabelList
                      dataKey="score"
                      position="top"
                      style={{ fill: '#374151', fontSize: '12px', fontWeight: 'bold' }}
                    />
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Radar Chart - only show when showRadar is true */}
          {showRadar && (
           <div className="bg-white/80 backdrop-blur-sm rounded-3xl shadow-md border border-white/20 overflow-hidden">
    <div className="bg-gradient-to-r from-purple-500 to-pink-600 p-6">
      <div className="flex items-center space-x-3">
        <div className="w-12 h-12 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center">
          <Brain className="w-6 h-6 text-white" />
        </div>
        <div>
          <h3 className="text-2xl font-bold text-white">Perfil Vocacional</h3>
          <p className="text-purple-100">Vista integral de aptitudes</p>
        </div>
      </div>
    </div>
    <div className="p-6">
      <ResponsiveContainer width="100%" height={400}>
        <RadarChart 
          data={radarData} 
          margin={{ top: 20, right: 80, bottom: 20, left: 80 }}
        >
          <defs>
            <linearGradient id="radarGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#8b5cf6" stopOpacity={0.8} />
              <stop offset="100%" stopColor="#ec4899" stopOpacity={0.2} />
            </linearGradient>
          </defs>
          <PolarGrid 
            gridType="polygon" 
            stroke="#e5e7eb" 
            strokeWidth={1}
          />
          <PolarAngleAxis
            dataKey="fullArea"
            tick={{ 
              fontSize: 10, 
              fill: '#6b7280',
              textAnchor: 'middle'
            }}
            className="text-xs"
          />
          <PolarRadiusAxis
            angle={90}
            domain={[0, 100]} // Asumiendo que tus scores van de 0 a 100
            tick={{ 
              fontSize: 9, 
              fill: '#9ca3af' 
            }}
            tickCount={5}
          />
          <Radar
            name="Puntuación"
            dataKey="score"
            stroke="#8b5cf6"
            fill="url(#radarGradient)"
            strokeWidth={3}
            dot={{ 
              fill: '#8b5cf6', 
              strokeWidth: 2, 
              stroke: '#fff',
              r: 4 
            }}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: '#ffffff',
              border: 'none',
              borderRadius: '12px',
              boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1)',
              backdropFilter: 'blur(10px)'
            }}
            formatter={(value, name) => [value, 'Puntuación']}
            labelFormatter={(label) => `Área: ${label}`}
          />
        </RadarChart>
      </ResponsiveContainer>
    </div>
  </div>
          )}

        </div>

        {/* Interpretation */}
        <div className="bg-white/80 backdrop-blur-sm rounded-3xl shadow-md border border-white/20 mb-12 overflow-hidden">
          <div className="bg-gradient-to-r from-emerald-500 to-teal-600 p-6">
            <div className="flex items-center space-x-3">
              <div className="w-12 h-12 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center">
                <Brain className="w-6 h-6 text-white" />
              </div>
              <div>
                <h3 className="text-2xl font-bold text-white">Interpretación</h3>
                <p className="text-emerald-100">Análisis detallado de tus resultados</p>
              </div>
            </div>
          </div>
          <div className="p-8">
            <div className="bg-gradient-to-br from-gray-50 to-blue-50 rounded-2xl p-8 border border-gray-100">
              <div className="flex items-start space-x-4">
                <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center flex-shrink-0 mt-1">
                  <Brain className="w-6 h-6 text-white" />
                </div>
                <div>
                  <p className="text-gray-800 text-lg leading-relaxed text-justify">
                    {result.interpretation}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Export Button */}
        <div className="text-center">
          <button
            onClick={() => exportToPDF(result, userData, chartRef)}
            className="bg-gradient-to-r from-blue-500 to-indigo-600 text-white px-8 py-4 rounded-2xl hover:from-blue-600 hover:to-indigo-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-all duration-200 flex items-center space-x-3 mx-auto shadow-md hover:shadow-lg hover:scale-105"
          >
            <FileDown className="w-6 h-6" />
            <span className="text-lg font-semibold">Exportar a PDF</span>
          </button>
        </div>
      </div>
      <ChatBot />
    </div>
  );
};

export default ResultsPage;