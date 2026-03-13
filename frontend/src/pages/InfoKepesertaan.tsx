import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { motion } from 'framer-motion';

const InfoKepesertaan: React.FC = () => {
    const { user } = useAuth();
    const [peserta, setPeserta] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const apiUrl = import.meta.env.VITE_API_URL;

    useEffect(() => {
        const fetchProfile = async () => {
            try {
                const token = localStorage.getItem('token');
                const res = await axios.get(`${apiUrl}/peserta`, {
                    headers: { Authorization: `Bearer ${token}` }
                });
                setPeserta(res.data[0]);
            } catch (err) {
                console.error(err);
            } finally {
                setLoading(false);
            }
        };
        fetchProfile();
    }, []);

    if (loading) return (
        <div className="flex items-center justify-center min-h-[40vh]">
            <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
        </div>
    );

    return (
        <div className="max-w-6xl mx-auto py-8 px-4">
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white rounded-[2.5rem] shadow-2xl overflow-hidden border border-gray-100/50 backdrop-blur-xl bg-opacity-95"
            >
                <div className="bg-gradient-to-br from-bri-blue to-blue-900 p-10 text-white relative min-h-[14rem] flex items-end">
                    <div className="absolute top-0 right-0 p-10 opacity-20 transform translate-x-10 -translate-y-10">
                        <svg className="w-64 h-64" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" />
                        </svg>
                    </div>
                    <div className="relative z-10 flex items-center gap-6 w-full">
                        <div className="w-24 h-24 rounded-3xl bg-white/20 backdrop-blur-md flex items-center justify-center text-4xl font-black shadow-inner border border-white/30 shrink-0">
                            {peserta?.nama_peserta?.charAt(0) || user?.username?.charAt(0)}
                        </div>
                        <div className="flex-1">
                            <h2 className="text-4xl font-black mb-2 tracking-tight">{peserta?.nama_peserta || user?.username}</h2>
                            <div className="flex items-center gap-3">
                                <span className="bg-green-500/20 text-green-300 text-[10px] font-black px-2 py-0.5 rounded-full uppercase tracking-widest border border-green-500/30">Aktif</span>
                                <p className="text-blue-100 font-semibold opacity-80">NIK: {peserta?.nik_bri || '-'}</p>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="p-10">
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
                        <div className="lg:col-span-2 space-y-10">
                            <section>
                                <div className="flex items-center gap-3 mb-6">
                                    <h3 className="text-xs font-black text-gray-400 uppercase tracking-[0.2em]">Data Utama Kepesertaan</h3>
                                    <div className="h-px bg-gray-100 flex-1"></div>
                                </div>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-12 gap-y-6">
                                    <div>
                                        <p className="text-[10px] font-bold text-gray-400 uppercase mb-1">ID Peserta</p>
                                        <p className="font-bold text-gray-900">{peserta?.id_peserta || '-'}</p>
                                    </div>
                                    <div>
                                        <p className="text-[10px] font-bold text-gray-400 uppercase mb-1">Kelompok</p>
                                        <p className="font-bold text-gray-900">{peserta?.kelompok?.nama || '-'}</p>
                                    </div>
                                    <div>
                                        <p className="text-[10px] font-bold text-gray-400 uppercase mb-1">Kelas Layanan</p>
                                        <p className="font-bold text-gray-900">{peserta?.kelas?.nama || '-'}</p>
                                    </div>
                                    <div>
                                        <p className="text-[10px] font-bold text-gray-400 uppercase mb-1">Mulai Kepesertaan</p>
                                        <p className="font-bold text-gray-900">{peserta?.created_at ? new Date(peserta.created_at).toLocaleDateString() : '-'}</p>
                                    </div>
                                </div>
                            </section>

                            <section>
                                <div className="flex items-center gap-3 mb-6">
                                    <h3 className="text-xs font-black text-gray-400 uppercase tracking-[0.2em]">Cakupan Manfaat</h3>
                                    <div className="h-px bg-gray-100 flex-1"></div>
                                </div>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <div className="p-6 rounded-[2rem] bg-gradient-to-br from-green-50 to-white border border-green-100 shadow-sm">
                                        <div className="flex items-center gap-3 mb-3">
                                            <div className="w-8 h-8 rounded-full bg-green-500 text-white flex items-center justify-center text-xs">
                                                ★
                                            </div>
                                            <p className="text-[11px] font-black text-green-700 uppercase tracking-wider">BPJS Kesehatan</p>
                                        </div>
                                        <p className="text-xl font-black text-gray-900">{peserta?.status_bpjs?.nama || 'Terdaftar & Aktif'}</p>
                                        <p className="text-[10px] text-gray-500 mt-1 font-medium italic">Sesuai PKS YKP BRI</p>
                                    </div>
                                    <div className="p-6 rounded-[2rem] bg-gradient-to-br from-blue-50 to-white border border-blue-100 shadow-sm">
                                        <div className="flex items-center gap-3 mb-3">
                                            <div className="w-8 h-8 rounded-full bg-blue-500 text-white flex items-center justify-center text-xs">
                                                ♥
                                            </div>
                                            <p className="text-[11px] font-black text-blue-700 uppercase tracking-wider">BRI LIFE (DPLK)</p>
                                        </div>
                                        <p className="text-xl font-black text-gray-900">{peserta?.status_brilife?.nama || 'Polis Berjalan'}</p>
                                        <p className="text-[10px] text-gray-500 mt-1 font-medium italic">Manfaat Pasti Berjalan</p>
                                    </div>
                                </div>
                            </section>
                        </div>

                        <div className="space-y-6">
                            <section className="bg-gradient-to-br from-gray-900 to-gray-800 rounded-[2.5rem] p-8 text-white shadow-2xl relative overflow-hidden group">
                                <div className="absolute -top-10 -right-10 w-40 h-40 bg-bri-orange opacity-20 blur-3xl group-hover:opacity-40 transition-opacity"></div>
                                <div className="relative z-10 text-center">
                                    <p className="text-[11px] font-black text-bri-orange uppercase tracking-[0.3em] mb-4">Saldo Individu</p>
                                    <p className="text-gray-400 text-xs mb-1">Total Manfaat Akumulasi</p>
                                    <h4 className="text-4xl font-black text-white tabular-nums">Rp 124.500.250</h4>
                                    <div className="inline-flex items-center gap-2 mt-4 px-3 py-1 bg-white/10 rounded-full text-[9px] font-bold text-gray-300">
                                        <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse"></span>
                                        LIVE UPDATE: HARI INI 09:00
                                    </div>

                                    <button className="w-full mt-10 bg-bri-orange text-white font-black py-4 rounded-3xl shadow-xl shadow-bri-orange/20 hover:scale-[1.02] active:scale-95 transition-all text-xs uppercase tracking-[0.2em]">
                                        LIHAT HISTORI MUTASI
                                    </button>
                                </div>
                            </section>

                            <div className="p-6 bg-amber-50 rounded-3xl border border-amber-100 flex items-start gap-4">
                                <span className="text-xl">🔔</span>
                                <p className="text-[11px] text-amber-800 font-bold leading-relaxed">
                                    Terdapat 1 pengajuan perubahan data (Keluarga) yang sedang dalam proses verifikasi oleh Checker.
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </motion.div>
        </div>
    );
};

export default InfoKepesertaan;
