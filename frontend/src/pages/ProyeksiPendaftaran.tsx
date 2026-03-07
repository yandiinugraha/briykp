import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { motion } from 'framer-motion';

interface PesertaData {
    id_peserta: string;
    nama_peserta: string;
    nik_bri: string;
    tgl_phk: string;
    kelompok?: { nama: string };
    kelas?: { nama: string };
    status_bpjs?: { nama: string };
    status_brilife?: { nama: string };
}

const ProyeksiPendaftaran: React.FC = () => {
    const [peserta, setPeserta] = useState<PesertaData[]>([]);
    const [loading, setLoading] = useState(false);
    const [filterDate, setFilterDate] = useState('');

    const fetchProyeksi = async (date: string) => {
        setLoading(true);
        try {
            const token = localStorage.getItem('token');
            const url = date
                ? `http://localhost:3000/api/proyeksi?tanggal=${date}`
                : 'http://localhost:3000/api/proyeksi';

            const res = await axios.get(url, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setPeserta(res.data);
        } catch (error) {
            console.error('Error fetching proyeksi:', error);
        } finally {
            setLoading(false);
        }
    };

    // Initial load
    useEffect(() => {
        fetchProyeksi('');
    }, []);

    const handleFilter = (e: React.FormEvent) => {
        e.preventDefault();
        fetchProyeksi(filterDate);
    };

    const handleExport = () => {
        const headers = ['ID Peserta', 'NAMA PESERTA', 'NIK BRI', 'TANGGAL PHK', 'KELOMPOK', 'KELAS', 'STATUS BPJS', 'STATUS BRILIFE'];

        const rows = peserta.map(p => [
            p.id_peserta,
            `"${p.nama_peserta}"`,
            `"${p.nik_bri}"`,
            p.tgl_phk ? new Date(p.tgl_phk).toLocaleDateString('id-ID') : '-',
            `"${p.kelompok?.nama || '-'}"`,
            `"${p.kelas?.nama || '-'}"`,
            `"${p.status_bpjs?.nama || '-'}"`,
            `"${p.status_brilife?.nama || '-'}"`
        ]);

        const csvContent = "data:text/csv;charset=utf-8,"
            + headers.join(',') + "\n"
            + rows.map(e => e.join(',')).join("\n");

        const encodedUri = encodeURI(csvContent);
        const link = document.createElement("a");
        link.setAttribute("href", encodedUri);
        link.setAttribute("download", `Proyeksi_Pendaftaran_${filterDate || 'All'}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="p-8 w-full max-w-7xl mx-auto"
        >
            <div className="flex justify-between items-center mb-8">
                <div>
                    <h1 className="text-3xl font-black text-gray-900 tracking-tight">Proyeksi Pendaftaran</h1>
                    <p className="text-gray-500 mt-1">Daftar proyeksi kepesertaan berdasarkan tanggal mutasi / PHK.</p>
                </div>

                <button
                    onClick={handleExport}
                    disabled={peserta.length === 0}
                    className="flex items-center gap-2 bg-green-600 hover:bg-green-700 disabled:bg-gray-300 text-white px-4 py-2 rounded-xl font-bold shadow-sm transition-all active:scale-95"
                >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    Export Excel
                </button>
            </div>

            <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden mb-8 p-6">
                <form onSubmit={handleFilter} className="flex gap-4 items-end">
                    <div className="flex-1 max-w-xs">
                        <label className="block text-sm font-bold text-gray-700 mb-2">Pilih Tanggal Proyeksi PHK</label>
                        <input
                            type="date"
                            value={filterDate}
                            onChange={(e) => setFilterDate(e.target.value)}
                            className="w-full border-2 border-gray-200 rounded-xl p-3 focus:outline-none focus:border-bri-blue focus:ring-1 focus:ring-bri-blue transition-all"
                        />
                    </div>
                    <button
                        type="submit"
                        className="bg-bri-blue hover:bg-blue-800 text-white px-6 py-3 rounded-xl font-bold transition-all active:scale-95"
                    >
                        Tampilkan List
                    </button>
                    <button
                        type="button"
                        onClick={() => { setFilterDate(''); fetchProyeksi(''); }}
                        className="bg-gray-100 hover:bg-gray-200 text-gray-700 px-6 py-3 rounded-xl font-bold transition-all active:scale-95"
                    >
                        Reset
                    </button>
                </form>
            </div>

            {loading ? (
                <div className="flex justify-center p-12">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-bri-blue"></div>
                </div>
            ) : (
                <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="bg-gray-50 border-b-2 border-gray-200">
                                    <th className="p-4 text-xs font-black text-gray-500 uppercase tracking-wider">Nama / NIK</th>
                                    <th className="p-4 text-xs font-black text-gray-500 uppercase tracking-wider">Tgl PHK</th>
                                    <th className="p-4 text-xs font-black text-gray-500 uppercase tracking-wider">Kelompok</th>
                                    <th className="p-4 text-xs font-black text-gray-500 uppercase tracking-wider">Kelas</th>
                                    <th className="p-4 pr-6 text-right text-xs font-black text-gray-500 uppercase tracking-wider">Aksi</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {peserta.map((p) => (
                                    <tr key={p.id_peserta} className="hover:bg-blue-50/50 transition-colors group">
                                        <td className="p-4">
                                            <div className="font-bold text-gray-900">{p.nama_peserta}</div>
                                            <div className="text-xs text-gray-500">{p.nik_bri}</div>
                                        </td>
                                        <td className="p-4 text-sm font-medium text-gray-900">
                                            {p.tgl_phk ? new Date(p.tgl_phk).toLocaleDateString('id-ID', { year: 'numeric', month: 'short', day: 'numeric' }) : '-'}
                                        </td>
                                        <td className="p-4">
                                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                                                {p.kelompok?.nama || '-'}
                                            </span>
                                        </td>
                                        <td className="p-4">
                                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-50 text-blue-700 border border-blue-100">
                                                {p.kelas?.nama || '-'}
                                            </span>
                                        </td>
                                        <td className="p-4 pr-6 text-right">
                                            <button className="text-bri-blue hover:text-blue-800 p-2 rounded-lg hover:bg-blue-50 transition-colors" title="Proses Data (Mutasi)">
                                                <svg className="w-5 h-5 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 5l7 7-7 7M5 5l7 7-7 7"></path>
                                                </svg>
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                                {peserta.length === 0 && (
                                    <tr>
                                        <td colSpan={5} className="p-12 text-center text-gray-400">
                                            <svg className="mx-auto h-12 w-12 text-gray-300 mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
                                            </svg>
                                            <p className="text-lg font-medium text-gray-900">Tidak ada data proyeksi</p>
                                            <p className="text-sm">Silakan ubah filter tanggal PHK.</p>
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}
        </motion.div>
    );
};

export default ProyeksiPendaftaran;
