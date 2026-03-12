import React, { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { MODULES } from '../config/modules';
import { motion } from 'framer-motion';
import { ArrowRight } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const Dashboard: React.FC = () => {
    const navigate = useNavigate();
    const { user } = useAuth();

    // Some roles might not have access to some modules, but for now we show all or limit by basic role logic.
    const isPeserta = user?.role?.toLowerCase() === 'peserta';

    // Peserta only sees Kepesertaan module
    const availableModules = useMemo(() => {
        if (isPeserta) {
            return MODULES.filter(m => m.id === 'kepesertaan');
        }
        return MODULES;
    }, [isPeserta]);

    return (
        <div className="p-6 md:p-10 max-w-7xl mx-auto w-full min-h-[calc(100vh-64px)]">
            <div className="mb-10">
                <motion.div
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                >
                    <h1 className="text-4xl font-black text-gray-900 tracking-tight">
                        Selamat Datang, <span className="text-blue-600">{user?.username}</span> 👋
                    </h1>
                    <p className="text-gray-500 mt-2 text-lg">Akses ekosistem YKP BRI untuk manajemen operasional yang modern.</p>
                </motion.div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {availableModules.map((module, idx) => {
                    const Icon = module.icon;
                    return (
                        <motion.div
                            key={module.id}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: idx * 0.05, duration: 0.3 }}
                            onClick={() => navigate(module.basePath)}
                            className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 hover:shadow-xl hover:-translate-y-1 transition-all duration-300 cursor-pointer group flex flex-col h-full"
                        >
                            <div className={`w-14 h-14 rounded-xl flex items-center justify-center text-white mb-6 shadow-sm ${module.color}`}>
                                <Icon size={26} strokeWidth={2} />
                            </div>

                            <h3 className="text-xl font-bold text-gray-800 mb-2 group-hover:text-blue-600 transition-colors">
                                {module.name}
                            </h3>

                            <p className="text-sm text-gray-500 line-clamp-2 mb-6 flex-grow">
                                {module.description}
                            </p>

                            <div className="flex items-center text-sm font-semibold text-gray-400 group-hover:text-blue-600 transition-colors mt-auto">
                                Buka Modul <ArrowRight size={16} className="ml-1 opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-300" />
                            </div>
                        </motion.div>
                    );
                })}
            </div>

            {/* Quick Stats / Overview can be added here below the modules */}
        </div>
    );
};

export default Dashboard;
