import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import { Eye, EyeOff } from 'lucide-react';

const AnimatedBackground = () => (
    <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
        <motion.div
            className="absolute top-[-10%] left-[10%] w-96 h-96 bg-bri-blue/5 rounded-full blur-3xl"
            animate={{
                scale: [1, 1.2, 1],
                x: [0, 50, 0],
                y: [0, 30, 0]
            }}
            transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
        />
        <motion.div
            className="absolute bottom-[-10%] right-[10%] w-[30rem] h-[30rem] bg-bri-orange/5 rounded-full blur-3xl"
            animate={{
                scale: [1, 1.3, 1],
                x: [0, -40, 0],
                y: [0, -40, 0]
            }}
            transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
        />
        <motion.div
            className="absolute top-[20%] left-[-20%] w-[140%] h-[2px] bg-gradient-to-r from-transparent via-bri-blue/30 to-transparent transform -skew-y-6"
            animate={{
                y: [0, 80, -40, 0],
                skewY: [-6, -2, -8, -6],
                opacity: [0.3, 0.8, 0.3]
            }}
            transition={{ duration: 12, repeat: Infinity, ease: "easeInOut" }}
        />
        <motion.div
            className="absolute top-[45%] left-[-20%] w-[140%] h-[1px] bg-gradient-to-r from-transparent via-bri-orange/40 to-transparent transform skew-y-3"
            animate={{
                y: [0, -100, 60, 0],
                skewY: [3, 8, -2, 3],
                opacity: [0.2, 0.6, 0.2]
            }}
            transition={{ duration: 16, repeat: Infinity, ease: "easeInOut" }}
        />
    </div>
);

const Login: React.FC = () => {
    const { login } = useAuth();
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
        setIsSubmitting(true);
        try {
            await login(username, password);
        } catch (err: any) {
            setError(err.response?.data?.error || 'Login gagal. Silakan periksa kredensial Anda.');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="min-h-screen bg-white flex relative overflow-hidden">
            <div className="hidden lg:flex lg:w-[55%] relative flex-col justify-center px-12 xl:px-24 border-r border-gray-100 bg-slate-50">
                <AnimatedBackground />
                <div className="relative z-10 max-w-2xl">
                    <motion.div
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.7, ease: "easeOut" }}
                    >
                        <img src="/logo.png" alt="YKP BRI Logo" className="h-20 w-auto object-contain mb-10 drop-shadow-sm" />
                    </motion.div>
                    <motion.h1
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.7, delay: 0.2, ease: "easeOut" }}
                        className="text-4xl xl:text-5xl font-extrabold text-gray-900 tracking-tight leading-tight mb-6"
                    >
                        Sistem Pengelolaan<br />
                        <span className="text-transparent bg-clip-text bg-gradient-to-r from-bri-blue to-blue-600">
                            Kepesertaan Prospens
                        </span>
                    </motion.h1>
                    <p className="text-lg text-gray-600 leading-relaxed max-w-xl">
                        Selamat datang di portal utama Yayasan Kesejahteraan Pekerja Bank Rakyat Indonesia. Kelola data kepesertaan, proses persetujuan dokumen berjenjang, dan transparansi jejak audit.
                    </p>
                </div>
            </div>

            <div className="w-full lg:w-[45%] flex flex-col justify-center px-6 sm:px-12 lg:px-16 xl:px-24 bg-white relative z-10 shadow-[-20px_0_40px_-15px_rgba(0,0,0,0.05)]">
                <motion.div
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.6, delay: 0.2 }}
                    className="w-full max-w-md mx-auto"
                >
                    <div className="mb-8">
                        <h2 className="text-3xl font-bold text-gray-900 mb-2">Masuk ke Akun</h2>
                        <p className="text-gray-500 text-sm">Silakan masukkan username dan kata sandi Anda</p>
                    </div>

                    {error && (
                        <div className="mb-6 p-4 bg-red-50 border-l-4 border-red-500 text-red-700 text-sm rounded-r-md">
                            <p className="font-bold">Error</p>
                            <p>{error}</p>
                        </div>
                    )}

                    <form className="space-y-6" onSubmit={handleSubmit}>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1.5">Username</label>
                            <input
                                type="text"
                                required
                                value={username}
                                onChange={(e) => setUsername(e.target.value)}
                                className="block w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-bri-blue outline-none transition-all"
                                placeholder="Username anda"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1.5">Kata Sandi</label>
                            <div className="relative">
                                <input
                                    type={showPassword ? "text" : "password"}
                                    required
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    className="block w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-bri-blue outline-none transition-all pr-12"
                                    placeholder="••••••••"
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 p-2 text-gray-400 hover:text-bri-blue transition-colors focus:outline-none"
                                >
                                    {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                                </button>
                            </div>
                        </div>

                        <button
                            type="submit"
                            disabled={isSubmitting}
                            className={`w-full py-3 px-4 border border-transparent rounded-xl shadow-lg shadow-bri-blue/30 text-sm font-bold text-white bg-gradient-to-r from-bri-blue to-blue-700 hover:from-blue-700 hover:to-blue-800 transition-all ${isSubmitting ? 'opacity-70 cursor-not-allowed' : ''}`}
                        >
                            {isSubmitting ? 'Memproses...' : 'Login ke Sistem'}
                        </button>
                    </form>
                </motion.div>
            </div>
        </div>
    );
};

export default Login;
