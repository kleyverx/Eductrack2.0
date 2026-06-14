import React, { useState, useRef, useEffect } from 'react';
import axios from 'axios';
import { Send, Sparkles, User, Loader2, X } from 'lucide-react';

/**
 * ChatBot Component - Asistente Gemma vía OpenRouter (nube)
 * Design System: Quiet Academic (Slate 50, Indigo 600)
 */
const ChatBot = () => {
    const [isOpen, setIsOpen] = useState(false);
    const [mensajes, setMensajes] = useState([]);
    const [mensaje, setMensaje] = useState('');
    const [cargando, setCargando] = useState(false);
    const [position, setPosition] = useState({ x: 50, y: 50 });
    const [isDragging, setIsDragging] = useState(false);
    const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
    
    const chatContainerRef = useRef(null);
    const windowRef = useRef(null);

    // Auto-scroll al último mensaje
    useEffect(() => {
        if (chatContainerRef.current) {
            chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
        }
    }, [mensajes]);

    // Mensaje de bienvenida inicial
    useEffect(() => {
        if (isOpen && mensajes.length === 0) {
            setMensajes([
                {
                    id: 1,
                    tipo: 'bot',
                    contenido: '¡Hola! Soy Gemma, tu asistente de EduTrack Insight. Puedo ayudarte a analizar tus resultados vocacionales o darte consejos para mejorar tu rendimiento académico. ¿Qué tienes en mente?',
                    timestamp: new Date()
                }
            ]);
        }
    }, [isOpen, mensajes.length]);

    // Manejo del drag (Mantenemos la lógica pero aseguramos que sea fluida)
    useEffect(() => {
        const handleMouseMove = (e) => {
            if (isDragging) {
                const newX = e.clientX - dragOffset.x;
                const newY = e.clientY - dragOffset.y;
                
                const maxX = window.innerWidth - 400; 
                const maxY = window.innerHeight - 100;
                
                setPosition({
                    x: Math.max(0, Math.min(newX, maxX)),
                    y: Math.max(0, Math.min(newY, maxY))
                });
            }
        };

        const handleMouseUp = () => {
            setIsDragging(false);
        };

        if (isDragging) {
            document.addEventListener('mousemove', handleMouseMove);
            document.addEventListener('mouseup', handleMouseUp);
        }
        return () => {
            document.removeEventListener('mousemove', handleMouseMove);
            document.removeEventListener('mouseup', handleMouseUp);
        };
    }, [isDragging, dragOffset]);

    const handleMouseDown = (e) => {
        if (e.target.closest('.drag-handle')) {
            setIsDragging(true);
            const rect = windowRef.current.getBoundingClientRect();
            setDragOffset({
                x: e.clientX - rect.left,
                y: e.clientY - rect.top
            });
        }
    };

    // Función para enviar un mensaje al bot usando Axios y el endpoint local
    const enviarMensaje = async () => {
        if (!mensaje.trim() || cargando) return;

        const token = localStorage.getItem('token');
        const BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

        const mensajeUsuario = {
            id: Date.now(),
            tipo: 'usuario',
            contenido: mensaje,
            timestamp: new Date()
        };

        setMensajes(prev => [...prev, mensajeUsuario]);
        const currentMessage = mensaje;
        setMensaje('');
        setCargando(true);

        try {
            // Preparamos el historial para el backend (role, mensaje)
            // Filtramos mensajes de error y formateamos
            const historyForBackend = mensajes
                .filter(m => m.tipo !== 'error')
                .map(m => ({
                    role: m.tipo === 'usuario' ? 'user' : 'model',
                    mensaje: m.contenido
                }));

            const response = await axios.post(`${BASE_URL}/aiAsistent/asistente`, {
                mensaje: currentMessage,
                historial: historyForBackend
            }, {
                headers: {
                    Authorization: `Bearer ${token}`
                }
            });

            if (response.data.success) {
                const mensajeBot = {
                    id: Date.now() + 1,
                    tipo: 'bot',
                    contenido: response.data.data.respuesta,
                    timestamp: new Date()
                };

                setMensajes(prev => [...prev, mensajeBot]);
                // El backend ya devuelve el historial actualizado si lo necesitamos
                // setHistorial(response.data.data.historial); 
            } else {
                throw new Error(response.data.error || 'Error en la respuesta del asistente');
            }
        } catch (error) {
            console.error('Error ChatBot:', error);
            const mensajeError = {
                id: Date.now() + 1,
                tipo: 'error',
                contenido: 'Gemma está teniendo problemas para responder. Intenta de nuevo en unos segundos.',
                timestamp: new Date()
            };
            setMensajes(prev => [...prev, mensajeError]);
        } finally {
            setCargando(false);
        }
    };

    const manejarKeyPress = (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            enviarMensaje();
        }
    };

    const formatearTiempo = (fecha) => {
        return fecha.toLocaleTimeString('es-ES', {
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    return (
        <>
            {/* Botón flotante Estilo Quiet Academic */}
            {!isOpen && (
                <button
                    onClick={() => setIsOpen(true)}
                    className="fixed bottom-6 right-6 bg-indigo-600 text-white p-4 rounded-full shadow-xl hover:bg-indigo-700 transition-all duration-300 hover:scale-110 z-40 flex items-center justify-center"
                    title="Gemma AI"
                >
                    <Sparkles className="w-6 h-6" />
                </button>
            )}

            {/* Ventana de Chat */}
            {isOpen && (
                <div
                    ref={windowRef}
                    className="fixed bg-white rounded-2xl shadow-2xl z-50 flex flex-col border border-slate-200 overflow-hidden"
                    style={{
                        left: `${position.x}px`,
                        top: `${position.y}px`,
                        width: '400px',
                        height: '550px',
                        maxWidth: '90vw',
                        maxHeight: '85vh'
                    }}
                    onMouseDown={handleMouseDown}
                >
                    {/* Header Draggable - Quiet Academic Style */}
                    <div className="drag-handle bg-white border-b border-slate-100 p-4 flex items-center justify-between cursor-move select-none">
                        <div className="flex items-center space-x-3">
                            <div className="w-9 h-9 bg-indigo-50 rounded-lg flex items-center justify-center">
                                <Sparkles className="w-5 h-5 text-indigo-600" />
                            </div>
                            <div>
                                <h1 className="text-sm font-semibold text-slate-900">Gemma Assistant</h1>
                                <div className="flex items-center space-x-1.5">
                                    <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                                    <p className="text-[11px] text-slate-500 font-medium">En línea</p>
                                </div>
                            </div>
                        </div>
                        <button
                            onClick={() => setIsOpen(false)}
                            className="text-slate-400 hover:text-slate-600 p-1.5 hover:bg-slate-50 rounded-md transition-colors"
                        >
                            <X className="w-4 h-4" />
                        </button>
                    </div>

                    {/* Chat Area */}
                    <div
                        ref={chatContainerRef}
                        className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50/30"
                    >
                        {mensajes.map((msg) => (
                            <div
                                key={msg.id}
                                className={`flex ${msg.tipo === 'usuario' ? 'justify-end' : 'justify-start'}`}
                            >
                                <div className={`flex items-end space-x-2 max-w-[85%] ${
                                    msg.tipo === 'usuario' ? 'flex-row-reverse space-x-reverse' : ''
                                }`}>
                                    {/* Icono/Avatar Minimalista */}
                                    <div className={`w-6 h-6 rounded-md flex items-center justify-center flex-shrink-0 mb-1 ${
                                        msg.tipo === 'usuario' ? 'bg-indigo-100' : 'bg-slate-200'
                                    }`}>
                                        {msg.tipo === 'usuario' ? (
                                            <User className="w-3.5 h-3.5 text-indigo-600" />
                                        ) : (
                                            <Sparkles className="w-3.5 h-3.5 text-slate-600" />
                                        )}
                                    </div>

                                    {/* Burbuja de Mensaje */}
                                    <div className={`rounded-2xl px-4 py-2.5 shadow-sm ${
                                        msg.tipo === 'usuario'
                                            ? 'bg-indigo-600 text-white rounded-br-none'
                                            : msg.tipo === 'error'
                                                ? 'bg-red-50 text-red-700 border border-red-100'
                                                : 'bg-white text-slate-700 border border-slate-100 rounded-bl-none'
                                    }`}>
                                        <p className="text-sm leading-relaxed">{msg.contenido}</p>
                                        <p className={`text-[10px] mt-1 font-medium opacity-60 ${
                                            msg.tipo === 'usuario' ? 'text-indigo-100' : 'text-slate-400'
                                        }`}>
                                            {formatearTiempo(msg.timestamp)}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        ))}

                        {/* Indicador de Carga */}
                        {cargando && (
                            <div className="flex justify-start">
                                <div className="flex items-end space-x-2">
                                    <div className="w-6 h-6 bg-slate-200 rounded-md flex items-center justify-center mb-1">
                                        <Sparkles className="w-3.5 h-3.5 text-slate-600" />
                                    </div>
                                    <div className="bg-white border border-slate-100 rounded-2xl rounded-bl-none px-4 py-2.5 shadow-sm">
                                        <div className="flex items-center space-x-2">
                                            <Loader2 className="w-3.5 h-3.5 animate-spin text-indigo-500" />
                                            <span className="text-xs text-slate-500 font-medium">Gemma está pensando...</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Input Area */}
                    <div className="p-4 bg-white border-t border-slate-100">
                        <div className="relative flex items-center">
                            <textarea
                                value={mensaje}
                                onChange={(e) => setMensaje(e.target.value)}
                                onKeyPress={manejarKeyPress}
                                placeholder="Hazme una pregunta..."
                                className="w-full pl-4 pr-12 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 resize-none text-sm text-slate-700 placeholder:text-slate-400"
                                rows="1"
                                disabled={cargando}
                                style={{ minHeight: '44px', maxHeight: '120px' }}
                            />
                            <button
                                onClick={enviarMensaje}
                                disabled={cargando || !mensaje.trim()}
                                className="absolute right-2 p-1.5 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:bg-slate-300 transition-all duration-200"
                            >
                                <Send className="w-4 h-4" />
                            </button>
                        </div>
                        <p className="text-[10px] text-slate-400 mt-2 text-center font-medium">
                            Impulsado por Gemma vía OpenRouter
                        </p>
                    </div>
                </div>
            )}
        </>
    );
};

export default ChatBot;