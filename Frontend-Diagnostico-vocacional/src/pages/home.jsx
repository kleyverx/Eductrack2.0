import React, { useState, useEffect, useContext } from 'react';
import { ChevronLeft, ChevronRight, GraduationCap, BookOpen, Users, Target, } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import ChatBot from '../components/Chatbot';
import { AuthContext } from '../context/AuthContext'; // Importar AuthContext

const HomePage = () => {
    const navigate = useNavigate();
    const [currentSlide, setCurrentSlide] = useState(0);
    const { isAuthenticated } = useContext(AuthContext); // Usar el hook useContext para acceder al estado de autenticación

    const slides = [
        {
            id: 1,
            title: "Paso 1: Regístrate",
            description: "Regístrate y completa tu perfil con tus datos personales, académicos y territoriales para comenzar tu viaje de orientación vocacional.",
            icon: <Users className="w-12 h-12 text-white" />,
            gradient: "from-blue-500 to-purple-600",
            image: "📝"
        },
        {
            id: 2,
            title: "Paso 2: Realiza el test de orientación",
            description: "Completa nuestro test de orientación vocacional para identificar tus intereses y habilidades.",
            icon: <BookOpen className="w-12 h-12 text-white" />,
            gradient: "from-green-500 to-teal-600",
            image: "🎓"
        },
        {
            id: 3,
            title: "Paso 3: Consulta el Asistente",
            description: "Utiliza nuestro asistente de IA para resolver tus dudas sobre tus resultados, carreras y orientación profesional.",
            icon: <Target className="w-12 h-12 text-white" />,
            gradient: "from-orange-500 to-red-600",
            image: "🤖"
        },
        {
            id: 4,
            title: "Paso 4: Toma Decisiones",
            description: "Con toda la información recopilada, toma decisiones informadas sobre tu futuro académico y profesional.",
            icon: <GraduationCap className="w-12 h-12 text-white" />,
            gradient: "from-purple-500 to-pink-600",
            image: "🎯"
        }
    ]; // Definir las diapositivas del carrusel

    // Auto-advance slides
    useEffect(() => {
        const timer = setInterval(() => {
            setCurrentSlide((prev) => (prev + 1) % slides.length);
        }, 5000);

        return () => clearInterval(timer);
    }, [slides.length]);

    const nextSlide = () => {
        setCurrentSlide((prev) => (prev + 1) % slides.length);
    };

    const prevSlide = () => {
        setCurrentSlide((prev) => (prev - 1 + slides.length) % slides.length);
    };

    const goToSlide = (index) => {
        setCurrentSlide(index);
    };

    // Renderizar el componente HomePage
    return (
        <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-cyan-50">

            {/* Hero Section */}
            <section className="py-20">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="text-center mb-16">
                        <h2 className="text-5xl font-bold text-gray-900 mb-6">
                            Descubre tu
                            <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent"> Vocación Ideal</span>
                        </h2>
                        <p className="text-xl text-gray-600 max-w-3xl mx-auto mb-8">
                            Te ayudamos a encontrar el camino perfecto hacia tu futuro profesional con herramientas inteligentes
                            y orientación personalizada.
                        </p>
                        {!isAuthenticated() && ( // Renderizado condicional de los botones
                            <div className="flex flex-col sm:flex-row gap-4 justify-center">
                                <button className="bg-gradient-to-r from-blue-500 to-indigo-600 text-white px-8 py-4 rounded-xl font-semibold hover:from-blue-600 hover:to-indigo-700 transition-all duration-300 transform hover:scale-105 shadow-lg" onClick={() => navigate('/login')}>
                                    Inicia Sesión
                                </button>
                                <button className="border-2 border-gray-300 text-gray-700 px-8 py-4 rounded-xl font-semibold hover:bg-gray-50 transition-all duration-300" onClick={() => navigate('/register')}>
                                    Regístrate
                                </button>
                            </div>
                        )}
                    </div>

                    {/* Carousel */}
                    <div className="relative bg-white rounded-3xl shadow-2xl overflow-hidden">
                        <div className="relative h-96 md:h-[500px]">
                            {slides.map((slide, index) => (
                                <div
                                    key={slide.id}
                                    className={`absolute inset-0 transition-transform duration-500 ease-in-out ${index === currentSlide ? 'translate-x-0' :
                                            index < currentSlide ? '-translate-x-full' : 'translate-x-full'
                                        }`}
                                >
                                    <div className={`h-full bg-gradient-to-br ${slide.gradient} flex items-center justify-center relative overflow-hidden`}>
                                        {/* Background Pattern */}
                                        <div className="absolute inset-0 opacity-10">
                                            <div className="w-full h-full" style={{
                                                backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.4'%3E%3Ccircle cx='7' cy='7' r='2'/%3E%3Ccircle cx='27' cy='7' r='2'/%3E%3Ccircle cx='47' cy='7' r='2'/%3E%3Ccircle cx='7' cy='27' r='2'/%3E%3Ccircle cx='27' cy='27' r='2'/%3E%3Ccircle cx='47' cy='27' r='2'/%3E%3Ccircle cx='7' cy='47' r='2'/%3E%3Ccircle cx='27' cy='47' r='2'/%3E%3Ccircle cx='47' cy='47' r='2'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`
                                            }}></div>
                                        </div>

                                        <div className="relative z-10 text-center text-white px-8 max-w-4xl">
                                            <div className="text-8xl mb-6">{slide.image}</div>
                                            <div className="mb-6">
                                                {slide.icon}
                                            </div>
                                            <h3 className="text-4xl md:text-5xl font-bold mb-6">{slide.title}</h3>
                                            <p className="text-xl md:text-2xl opacity-90 leading-relaxed">{slide.description}</p>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>

                        {/* Navigation Arrows */}
                        <button
                            onClick={prevSlide}
                            className="absolute left-4 top-1/2 transform -translate-y-1/2 bg-white bg-opacity-20 hover:bg-opacity-30 text-white p-3 rounded-full transition-all duration-300 hover:scale-110"
                        >
                            <ChevronLeft className="w-6 h-6" />
                        </button>
                        <button
                            onClick={nextSlide}
                            className="absolute right-4 top-1/2 transform -translate-y-1/2 bg-white bg-opacity-20 hover:bg-opacity-30 text-white p-3 rounded-full transition-all duration-300 hover:scale-110"
                        >
                            <ChevronRight className="w-6 h-6" />
                        </button>

                        {/* Dots Indicator */}
                        <div className="absolute bottom-6 left-1/2 transform -translate-x-1/2 flex space-x-3">
                            {slides.map((_, index) => (
                                <button
                                    key={index}
                                    onClick={() => goToSlide(index)}
                                    className={`w-3 h-3 rounded-full transition-all duration-300 ${index === currentSlide
                                            ? 'bg-white scale-125'
                                            : 'bg-white bg-opacity-50 hover:bg-opacity-75'
                                        }`}
                                />
                            ))}
                        </div>
                    </div>
                </div>
            </section>
            <ChatBot/>
        </div>
    );
};

export default HomePage;