import React, { useState, useEffect } from 'react';
import axios from 'axios';

interface PembayaranData {
    no_nota_dinas: string;
    tanggal: string;
    total_premi: number;
    created_at: string;
}

const ModulKeuangan: React.FC = () => {
    const [history, setHistory] = useState<PembayaranData[]>([]);
    const [filteredHistory, setFilteredHistory] = useState<PembayaranData[]>([]);
    const [loading, setLoading] = useState(true);

    // Filter & Pagination State
    const [searchQuery, setSearchQuery] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const pageSize = 5;

    // Form States
    const [nota, setNota] = useState('');
    const [nominal, setNominal] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Detail Modal State
    const [isDetailOpen, setIsDetailOpen] = useState(false);
    const [selectedTrx, setSelectedTrx] = useState<PembayaranData | null>(null);
    const apiUrl = import.meta.env.VITE_API_URL;

    useEffect(() => {
        fetchHistory();
    }, []);

    const fetchHistory = async () => {
        setLoading(true);
        try {
            const res = await axios.get(`${apiUrl}/finance/pembayaran`);
            setHistory(res.data || []);
            setFilteredHistory(res.data || []);
        } catch (error) {
            console.error('Failed to fetch finance history', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        const q = searchQuery.toLowerCase();
        const filtered = history.filter(h => h.no_nota_dinas.toLowerCase().includes(q));
        setFilteredHistory(filtered);
        setCurrentPage(1);
    }, [searchQuery, history]);

    const paginatedHistory = filteredHistory.slice((currentPage - 1) * pageSize, currentPage * pageSize);
    const totalPages = Math.ceil(filteredHistory.length / pageSize);

    const handleSimpanPembayaran = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);
        try {
            await axios.post(`${apiUrl}/finance/pembayaran`, {
                no_nota_dinas: nota,
                tanggal: new Date().toISOString(), // Use today
                total_premi: parseFloat(nominal)
            });
            setNota('');
            setNominal('');
            fetchHistory(); // Refresh table
        } catch (error) {
            console.error('Failed to save', error);
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleExport = () => {
        const headers = ["No Nota Dinas", "Tanggal", "Total Premi"];
        const rows = filteredHistory.map(h => [
            `"${h.no_nota_dinas}"`,
            new Date(h.tanggal).toLocaleDateString('id-ID'),
            h.total_premi
        ]);

        const csvContent = "data:text/csv;charset=utf-8,\uFEFF"
            + headers.join(",") + "\n"
            + rows.map(e => e.join(",")).join("\n");

        const encodedUri = encodeURI(csvContent);
        const link = document.createElement("a");
        link.setAttribute("href", encodedUri);
        link.setAttribute("download", `riwayat_keuangan_${new Date().toISOString().slice(0, 10)}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const handleView = (trx: PembayaranData) => {
        setSelectedTrx(trx);
        setIsDetailOpen(true);
    };

    return (
        <>
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h2 className="text-2xl font-bold text-gray-800">Modul Keuangan</h2>
                    <p className="text-gray-500 text-sm mt-1">
                        Pencatatan Pembayaran Premi dan Riwayat Nota Dinas
                    </p>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

                {/* Form Input */}
                <div className="lg:col-span-1 border border-gray-200 bg-white shadow-sm p-6 rounded-xl h-fit">
                    <h3 className="text-lg font-semibold text-gray-800 border-b pb-3 mb-4">Input Pembayaran Baru</h3>
                    <form onSubmit={handleSimpanPembayaran} className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">No. Nota Dinas</label>
                            <input
                                type="text"
                                required
                                value={nota}
                                onChange={(e) => setNota(e.target.value)}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:border-bri-blue focus:ring-bri-blue sm:text-sm"
                                placeholder="Contoh: ND-YKP/10/2023"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Total Nominal Premi (Rp)</label>
                            <div className="relative rounded-md shadow-sm">
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                    <span className="text-gray-500 sm:text-sm">Rp</span>
                                </div>
                                <input
                                    type="number"
                                    required
                                    min="0"
                                    value={nominal}
                                    onChange={(e) => setNominal(e.target.value)}
                                    className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-md focus:border-bri-blue focus:ring-bri-blue sm:text-sm"
                                    placeholder="0"
                                />
                            </div>
                        </div>
                        <div className="pt-2">
                            <button
                                type="submit"
                                disabled={isSubmitting}
                                className={`w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white ${isSubmitting ? 'bg-gray-400' : 'bg-bri-blue hover:bg-blue-800'} focus:outline-none transition-colors`}
                            >
                                {isSubmitting ? 'Menyimpan...' : 'Simpan Pembayaran'}
                            </button>
                        </div>
                    </form>
                </div>

                {/* History Table */}
                <div className="lg:col-span-2 flex flex-col gap-4">
                    <div className="border border-gray-200 bg-white shadow-sm rounded-xl overflow-hidden flex flex-col h-full">
                        <div className="px-6 py-4 border-b border-gray-100 flex flex-col sm:flex-row sm:items-center justify-between bg-gray-50/50 gap-4">
                            <h3 className="text-lg font-semibold text-gray-800">Riwayat Pembayaran</h3>
                            <div className="flex gap-2">
                                <div className="relative rounded-md shadow-sm max-w-xs">
                                    <input
                                        type="text"
                                        className="block w-full rounded-md border-gray-300 pl-3 focus:border-bri-blue focus:ring-bri-blue sm:text-xs py-1.5 border px-2"
                                        placeholder="Cari No Nota..."
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                    />
                                </div>
                                <button
                                    onClick={handleExport}
                                    className="bg-white border border-gray-300 text-gray-700 px-3 py-1.5 rounded-md text-xs font-medium hover:bg-gray-50 transition-colors flex items-center gap-1 shadow-sm"
                                >
                                    Export
                                </button>
                                <button onClick={fetchHistory} className="p-1.5 text-gray-400 hover:text-bri-blue transition-colors border border-gray-300 rounded-md bg-white shadow-sm">
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                                    </svg>
                                </button>
                            </div>
                        </div>

                        <div className="overflow-x-auto flex-grow">
                            <table className="w-full text-left border-collapse">
                                <thead>
                                    <tr className="bg-white text-gray-500 text-xs uppercase tracking-wider border-b">
                                        <th className="px-6 py-4 font-medium uppercase tracking-wider">No Nota Dinas</th>
                                        <th className="px-6 py-4 font-medium uppercase tracking-wider">Tanggal Trx</th>
                                        <th className="px-6 py-4 font-medium text-right uppercase tracking-wider">Total Premi</th>
                                        <th className="px-6 py-4 font-medium text-right uppercase tracking-wider">Aksi</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100 text-sm">
                                    {loading ? (
                                        <tr><td colSpan={4} className="text-center py-8 text-gray-400 italic font-medium">Memuat Data Keuangan...</td></tr>
                                    ) : paginatedHistory.length === 0 ? (
                                        <tr><td colSpan={4} className="text-center py-8 text-gray-400 italic">Belum ada riwayat pembayaran tercatat.</td></tr>
                                    ) : (
                                        paginatedHistory.map((item, i) => (
                                            <tr key={i} className="hover:bg-gray-50/50 transition-colors">
                                                <td className="px-6 py-4 font-bold text-bri-blue">{item.no_nota_dinas}</td>
                                                <td className="px-6 py-4 text-gray-600">{new Date(item.tanggal).toLocaleDateString('id-ID')}</td>
                                                <td className="px-6 py-4 text-right font-bold text-gray-900 border-r border-gray-50">
                                                    Rp {new Intl.NumberFormat('id-ID').format(item.total_premi)}
                                                </td>
                                                <td className="px-6 py-4 text-right">
                                                    <button
                                                        onClick={() => handleView(item)}
                                                        className="p-1.5 text-bri-blue hover:text-blue-800 hover:bg-blue-50 rounded-lg transition-colors"
                                                        title="Detail Transaksi"
                                                    >
                                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                                        </svg>
                                                    </button>
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>

                        {/* Pagination Footer */}
                        {!loading && filteredHistory.length > 0 && (
                            <div className="px-6 py-4 bg-gray-50 border-t border-gray-100 flex items-center justify-between mt-auto">
                                <div className="text-xs text-gray-500">
                                    <span className="font-semibold text-gray-900">{filteredHistory.length}</span> Entri
                                </div>
                                <div className="flex gap-1">
                                    <button
                                        onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                                        disabled={currentPage === 1}
                                        className="px-2 py-1 border rounded text-xs font-bold disabled:opacity-30 bg-white"
                                    >Prev</button>
                                    <span className="px-2 py-1 text-xs font-bold text-bri-blue bg-blue-50 rounded border border-blue-100">
                                        {currentPage} / {totalPages}
                                    </span>
                                    <button
                                        onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                                        disabled={currentPage === totalPages}
                                        className="px-2 py-1 border rounded text-xs font-bold disabled:opacity-30 bg-white"
                                    >Next</button>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Detail Modal */}
            {isDetailOpen && selectedTrx && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in duration-200">
                        <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-bri-blue text-white">
                            <h3 className="font-bold">Detail Nota Dinas</h3>
                            <button onClick={() => setIsDetailOpen(false)} className="text-white/70 hover:text-white">✕</button>
                        </div>
                        <div className="p-8 space-y-6">
                            <div className="text-center pb-4 border-b border-gray-100">
                                <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1">Total Pembayaran</p>
                                <h2 className="text-3xl font-black text-gray-900">
                                    Rp {new Intl.NumberFormat('id-ID').format(selectedTrx.total_premi)}
                                </h2>
                            </div>
                            <div className="grid grid-cols-2 gap-4 text-sm">
                                <div>
                                    <p className="text-gray-400 font-medium mb-1">No Nota Dinas</p>
                                    <p className="font-bold text-gray-900">{selectedTrx.no_nota_dinas}</p>
                                </div>
                                <div>
                                    <p className="text-gray-400 font-medium mb-1">Tanggal Transaksi</p>
                                    <p className="font-bold text-gray-900">{new Date(selectedTrx.tanggal).toLocaleDateString('id-ID', { dateStyle: 'long' })}</p>
                                </div>
                            </div>
                            <div className="bg-gray-50 rounded-xl p-4 border border-gray-100">
                                <div className="flex justify-between items-center text-xs">
                                    <span className="text-gray-500 font-medium">Status Verifikasi</span>
                                    <span className="bg-green-100 text-green-800 px-2 py-0.5 rounded-full font-bold">Verified</span>
                                </div>
                            </div>
                        </div>
                        <div className="px-6 py-4 bg-gray-50 border-t border-gray-100 flex justify-end">
                            <button
                                onClick={() => setIsDetailOpen(false)}
                                className="w-full bg-bri-blue text-white font-bold py-2 rounded-lg shadow-lg hover:shadow-bri-blue/30 transition-shadow transition-transform active:scale-95"
                            >
                                Tutup
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
};

export default ModulKeuangan;
