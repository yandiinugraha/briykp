import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';

interface PesertaData {
    id_peserta: string;
    nama_peserta: string;
    nik_bri: string;
    status_bpjs: { nama: string };
    status_brilife: { nama: string };
    kelompok: { nama: string };
}

const Dashboard: React.FC = () => {
    const { token } = useAuth();
    const [stats, setStats] = useState({ totalActive: 0, pendingChecker: 12, pendingSigner: 4 });
    const [recentPeserta, setRecentPeserta] = useState<PesertaData[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchDashboardData = async () => {
            if (!token) return;
            try {
                const res = await axios.get('http://localhost:3000/api/peserta', {
                    headers: { Authorization: `Bearer ${token}` }
                });
                const pList = Array.isArray(res.data) ? res.data : [];

                setStats(prev => ({
                    ...prev,
                    totalActive: pList.filter((p: any) => p.status_bpjs?.nama === 'Aktif' || p.status_brilife?.nama === 'Aktif').length || pList.length
                }));
                setRecentPeserta(pList.slice(0, 5));
            } catch (error) {
                console.error(error);
                setRecentPeserta([]);
            } finally {
                setLoading(false);
            }
        };
        fetchDashboardData();
    }, [token]);

    return (
        <>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                {/* Status Card: Total Peserta */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 hover:shadow-md transition-shadow">
                    <div className="flex justify-between items-start">
                        <div>
                            <p className="text-sm font-medium text-gray-500 mb-1">Total Peserta Aktif</p>
                            <h3 className="text-3xl font-bold text-gray-800">
                                {loading ? '...' : stats.totalActive}
                            </h3>
                        </div>
                        <div className="p-3 bg-blue-50 text-bri-blue rounded-lg">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                            </svg>
                        </div>
                    </div>
                </div>

                <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 hover:shadow-md transition-shadow relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-2 h-full bg-yellow-400"></div>
                    <div className="flex justify-between items-start">
                        <div>
                            <p className="text-sm font-medium text-gray-500 mb-1">Tiket di Checker</p>
                            <h3 className="text-3xl font-bold text-gray-800">{stats.pendingChecker}</h3>
                        </div>
                        <div className="p-3 bg-yellow-50 text-yellow-600 rounded-lg">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
                            </svg>
                        </div>
                    </div>
                </div>

                <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 hover:shadow-md transition-shadow relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-2 h-full bg-bri-orange"></div>
                    <div className="flex justify-between items-start">
                        <div>
                            <p className="text-sm font-medium text-gray-500 mb-1">Tiket di Signer</p>
                            <h3 className="text-3xl font-bold text-gray-800">{stats.pendingSigner}</h3>
                        </div>
                        <div className="p-3 bg-orange-50 text-bri-orange rounded-lg">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                            </svg>
                        </div>
                    </div>
                </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center">
                    <h3 className="text-lg font-semibold text-gray-800">Riwayat Peserta Tersinkronisasi (Dari Database)</h3>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-gray-50 text-gray-500 text-xs uppercase tracking-wider">
                                <th className="px-6 py-4 font-medium">ID API</th>
                                <th className="px-6 py-4 font-medium">Nama Peserta / NIK</th>
                                <th className="px-6 py-4 font-medium">Kelompok</th>
                                <th className="px-6 py-4 font-medium text-right">Aksi Singkat</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100 text-sm">
                            {loading ? (
                                <tr><td colSpan={5} className="text-center py-6 text-gray-500">Memuat koneksi Database...</td></tr>
                            ) : recentPeserta.length === 0 ? (
                                <tr><td colSpan={5} className="text-center py-6 text-gray-500 text-xs font-mono">Select * From db_ykpbri.t_peserta is empty.</td></tr>
                            ) : (
                                recentPeserta.map((p) => (
                                    <tr key={p.id_peserta} className="hover:bg-gray-50/50 transition-colors">
                                        <td className="px-6 py-4 font-medium text-gray-900">{p.id_peserta?.slice(0, 10)}...</td>
                                        <td className="px-6 py-4 text-gray-600">
                                            {p.nama_peserta}
                                            <div className="text-xs text-gray-400">NIK: {p.nik_bri}</div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                                                {p.kelompok?.nama || "Pensiunan"}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <button className="text-bri-blue hover:text-bri-dark font-medium px-3 py-1 border border-bri-blue rounded-md hover:bg-bri-blue hover:text-white transition-all">Lihat</button>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </>
    );
};

export default Dashboard;
