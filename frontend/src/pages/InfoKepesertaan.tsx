import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';

const InfoKepesertaan: React.FC = () => {
    const { user } = useAuth();
    const [peserta, setPeserta] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // In a real app, we'd fetch based on the logged in user's ID
        // For this demo, we'll fetch a sample participant
        const fetchProfile = async () => {
            try {
                const token = localStorage.getItem('token');
                const res = await axios.get('http://localhost:3000/api/peserta', {
                    headers: { Authorization: `Bearer ${token}` }
                });
                // Find the one matching the current username if possible, or just take the first one
                setPeserta(res.data[0]);
            } catch (err) {
                console.error(err);
            } finally {
                setLoading(false);
            }
        };

        fetchProfile();
    }, []);

    if (loading) return <div className="p-8 text-center text-gray-500">Memuat data kepesertaan...</div>;

    return (
        <div className="max-w-4xl mx-auto py-8">
            <div className="bg-white rounded-2xl shadow-xl overflow-hidden border border-gray-100">
                <div className="bg-bri-blue p-8 text-white relative h-48 flex items-end">
                    <div className="absolute top-0 right-0 p-8 opacity-10">
                        <svg className="w-48 h-48" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" />
                        </svg>
                    </div>
                    <div>
                        <h2 className="text-3xl font-black mb-1">{peserta?.nama_peserta || user?.username}</h2>
                        <p className="text-blue-100 font-medium">Peserta Aktif Prospens YKP BRI • {peserta?.nik_bri || '-'}</p>
                    </div>
                </div>

                <div className="p-8">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
                        <div className="space-y-8">
                            <section>
                                <h3 className="text-xs font-black text-gray-400 uppercase tracking-widest mb-4">Informasi Utama</h3>
                                <div className="space-y-4">
                                    <div className="flex justify-between items-center pb-3 border-b border-gray-50">
                                        <span className="text-gray-500">ID Peserta</span>
                                        <span className="font-bold text-gray-900">{peserta?.id_peserta || '-'}</span>
                                    </div>
                                    <div className="flex justify-between items-center pb-3 border-b border-gray-50">
                                        <span className="text-gray-500">Kelompok Kepesertaan</span>
                                        <span className="font-bold text-gray-900">{peserta?.kelompok?.nama || '-'}</span>
                                    </div>
                                    <div className="flex justify-between items-center pb-3 border-b border-gray-50">
                                        <span className="text-gray-500">Kelas Layanan</span>
                                        <span className="font-bold text-gray-900">{peserta?.kelas?.nama || '-'}</span>
                                    </div>
                                </div>
                            </section>

                            <section>
                                <h3 className="text-xs font-black text-gray-400 uppercase tracking-widest mb-4">Status Layanan</h3>
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="p-4 rounded-xl bg-green-50 border border-green-100">
                                        <p className="text-[10px] font-bold text-green-600 uppercase mb-1">BPJS Kesehatan</p>
                                        <p className="text-lg font-black text-green-800">{peserta?.status_bpjs?.nama || 'Aktif'}</p>
                                    </div>
                                    <div className="p-4 rounded-xl bg-blue-50 border border-blue-100">
                                        <p className="text-[10px] font-bold text-blue-600 uppercase mb-1">BRI Life (DPLK)</p>
                                        <p className="text-lg font-black text-blue-800">{peserta?.status_brilife?.nama || 'Berjalan'}</p>
                                    </div>
                                </div>
                            </section>
                        </div>

                        <div className="space-y-8">
                            <section className="bg-gray-50 rounded-2xl p-6 border border-gray-200">
                                <h3 className="text-xs font-black text-gray-400 uppercase tracking-widest mb-4 text-center">Estimasi Saldo Iuran</h3>
                                <div className="text-center">
                                    <p className="text-gray-500 text-xs mb-1">Total Manfaat Terakumulasi</p>
                                    <h4 className="text-3xl font-black text-bri-blue">Rp 124.500.250</h4>
                                    <p className="text-[10px] text-gray-400 mt-2 italic font-medium">*Data sinkronisasi terakhir: Hari ini, 09:00 WIB</p>
                                </div>
                                <button className="w-full mt-6 bg-white border-2 border-bri-blue text-bri-blue font-black py-3 rounded-xl hover:bg-bri-blue hover:text-white transition-all active:scale-95 text-sm uppercase tracking-wider">
                                    Lihat Rincian Mutasi
                                </button>
                            </section>

                            <div className="p-4 border-2 border-dashed border-gray-200 rounded-2xl">
                                <p className="text-xs text-center text-gray-400 font-medium">Terdapat 1 pengajuan perubahan data yang sedang dalam proses approval.</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default InfoKepesertaan;
