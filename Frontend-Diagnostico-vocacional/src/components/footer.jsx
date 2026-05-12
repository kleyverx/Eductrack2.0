import React from 'react';
import { GraduationCap, Mail, Phone, MapPin, Facebook, Twitter, Instagram, Linkedin} from 'lucide-react';

const Footer = () => {
    const currentYear = new Date().getFullYear(); // Obtener el año actual

    // Renderiza el pie de página
    return (
        <footer className="bg-gray-900 text-white">
            {/* Main Footer Content */}
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                    {/* Brand Section */}
                    <div className="lg:col-span-1">
                        <div className="flex items-center space-x-3 mb-4">
                            <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-lg flex items-center justify-center">
                                <GraduationCap className="w-5 h-5 text-white" />
                            </div>
                            <div>
                                <h3 className="text-lg font-bold">OrientaVocacional</h3>
                                <p className="text-xs text-gray-400">Tu futuro comienza aquí</p>
                            </div>
                        </div>
                        <p className="text-gray-300 text-sm leading-relaxed mb-4">
                            Ayudamos a estudiantes a descubrir su vocación ideal a través de herramientas
                            inteligentes y orientación personalizada.
                        </p>

                        {/* Social Media */}
                        <div className="flex space-x-3">
                            <a
                                href="#"
                                className="w-8 h-8 bg-gray-800 hover:bg-blue-600 rounded-lg flex items-center justify-center transition-colors duration-300"
                                aria-label="Facebook"
                            >
                                <Facebook className="w-4 h-4" />
                            </a>
                            <a
                                href="#"
                                className="w-8 h-8 bg-gray-800 hover:bg-blue-400 rounded-lg flex items-center justify-center transition-colors duration-300"
                                aria-label="Twitter"
                            >
                                <Twitter className="w-4 h-4" />
                            </a>
                            <a
                                href="#"
                                className="w-8 h-8 bg-gray-800 hover:bg-pink-600 rounded-lg flex items-center justify-center transition-colors duration-300"
                                aria-label="Instagram"
                            >
                                <Instagram className="w-4 h-4" />
                            </a>
                            <a
                                href="#"
                                className="w-8 h-8 bg-gray-800 hover:bg-blue-700 rounded-lg flex items-center justify-center transition-colors duration-300"
                                aria-label="LinkedIn"
                            >
                                <Linkedin className="w-4 h-4" />
                            </a>
                        </div>
                    </div>

                    {/* Contact Info */}
                    <div>
                        <h4 className="text-lg font-semibold mb-4 text-white">Contacto</h4>
                        <div className="space-y-3">
                            <div className="flex items-start space-x-3">
                                <MapPin className="w-4 h-4 text-blue-400 mt-1 flex-shrink-0" />
                                <div className="text-sm text-gray-300">
                                    <p>Calle Principal 123, Ciudad, País 12345</p>
                                </div>
                            </div>
                            <div className="flex items-center space-x-3">
                                <Phone className="w-4 h-4 text-blue-400 flex-shrink-0" />
                                <a href="tel:+1234567890" className="text-sm text-gray-300 hover:text-white transition-colors duration-300">
                                    +1 (234) 567-890
                                </a>
                            </div>
                            <div className="flex items-center space-x-3">
                                <Mail className="w-4 h-4 text-blue-400 flex-shrink-0" />
                                <a href="mailto:info@orientavocacional.com" className="text-sm text-gray-300 hover:text-white transition-colors duration-300">
                                    info@orientavocacional.com
                                </a>
                            </div>
                        </div>
                    </div>

                    {/* Newsletter Signup */}
                    <div>
                        <h4 className="text-lg font-semibold mb-4 text-white">Newsletter</h4>
                        <p className="text-sm text-gray-300 mb-4">
                            Mantente actualizado con las últimas noticias sobre orientación vocacional.
                        </p>
                        <div className="flex">
                            <input
                                type="email"
                                placeholder="Tu email"
                                className="flex-1 px-3 py-2 bg-gray-800 border border-gray-700 rounded-l-lg text-sm text-white placeholder-gray-400 focus:outline-none focus:border-blue-500"
                            />
                            <button className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-r-lg transition-colors duration-300">
                                <Mail className="w-4 h-4" />
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Bottom Footer */}
            <div className="border-t border-gray-800">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
                    <div className="flex flex-col md:flex-row justify-between items-center space-y-2 md:space-y-0">
                        <div className="flex items-center space-x-2 text-sm text-gray-400">
                            <span>© {currentYear} OrientaVocacional. Todos los derechos reservados.</span>
                        </div>

                        <div className="flex items-center space-x-4 text-sm">
                            <a href="#" className="text-gray-400 hover:text-white transition-colors duration-300">
                                Términos
                            </a>
                            <a href="#" className="text-gray-400 hover:text-white transition-colors duration-300">
                                Privacidad
                            </a>
                        </div>
                    </div>
                </div>
            </div>
        </footer>
    );
};

export default Footer;