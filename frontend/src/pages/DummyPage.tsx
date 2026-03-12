import React from 'react';
import { motion } from 'framer-motion';
import { Construction, ArrowLeft, LayoutGrid } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface DummyPageProps {
    title: string;
    description?: string;
}

const DummyPage: React.FC<DummyPageProps> = ({ title, description }) => {
    const navigate = useNavigate();

    return (
        <div className="flex flex-col items-center justify-center min-h-[60vh] p-8 text-center bg-white rounded-3xl shadow-sm border border-gray-100 max-w-4xl mx-auto">
            <motion.div
                initial={{ rotate: -10, scale: 0.8, opacity: 0 }}
                animate={{ rotate: 0, scale: 1, opacity: 1 }}
                className="w-24 h-24 bg-amber-50 text-amber-500 rounded-3xl flex items-center justify-center mb-8 shadow-inner"
            >
                <Construction size={48} />
            </motion.div>

            <motion.h1
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                className="text-4xl font-black text-gray-900 tracking-tight mb-4"
            >
                {title}
            </motion.h1>

            <motion.p
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.1 }}
                className="text-gray-500 text-lg max-w-md mb-10"
            >
                {description || "Fitur ini sedang dalam tahap pengembangan intensif untuk memberikan pengalaman terbaik bagi Anda."}
            </motion.p>

            <div className="flex gap-4">
                <button
                    onClick={() => navigate(-1)}
                    className="flex items-center gap-2 px-8 py-3 bg-gray-900 text-white font-bold rounded-2xl hover:bg-black transition-all hover:scale-[1.02] shadow-xl shadow-gray-200"
                >
                    <ArrowLeft size={18} />
                    Kembali
                </button>
                <button
                    onClick={() => navigate('/dashboard')}
                    className="flex items-center gap-2 px-8 py-3 bg-white border border-gray-200 text-gray-700 font-bold rounded-2xl hover:bg-gray-50 transition-all"
                >
                    <LayoutGrid size={18} />
                    Ke Dashboard
                </button>
            </div>

            {/* Mock Data Visualization for "Premium" feel */}
            <div className="w-full grid grid-cols-3 gap-4 mt-16 opacity-30 grayscale pointer-events-none">
                {[1, 2, 3].map(i => (
                    <div key={i} className="h-32 bg-gray-50 rounded-2xl border border-gray-100 flex flex-col p-4 gap-2">
                        <div className="w-1/2 h-4 bg-gray-200 rounded"></div>
                        <div className="w-full h-2 bg-gray-100 rounded"></div>
                        <div className="w-full h-2 bg-gray-100 rounded"></div>
                        <div className="w-3/4 h-2 bg-gray-100 rounded"></div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default DummyPage;
