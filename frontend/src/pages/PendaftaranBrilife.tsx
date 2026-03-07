import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { motion } from 'framer-motion';

interface PesertaData {
    id_peserta: string;
    nama_peserta: string;
    nik_bri: string;
    tmt_pertanggungan: string;
    kelompok?: { nama: string };
    kelas?: { nama: string };
    status_brilife?: { nama: string };
}

const PendaftaranBrilife: React.FC = () => {
    const [candidates, setCandidates] = useState<PesertaData[]>([]);
    const [loading, setLoading] = useState(false);
    const [filterDate, setFilterDate] = useState('');
    const [selectedIds, setSelectedIds] = useState<string[]>([]);
    const [submitLoading, setSubmitLoading] = useState(false);

    useEffect(() => {
        fetchCandidates('');
    }, []);

    const fetchCandidates = async (date: string) => {
        setLoading(true);
        try {
            const token = localStorage.getItem('token');
            const url = date
                ? `http://localhost:3000/api/brilife/candidates?tmt_pertanggungan=${date}`
                : 'http://localhost:3000/api/brilife/candidates';

            const res = await axios.get(url, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setCandidates(res.data);
            setSelectedIds([]); // Reset selection on new fetch
        } catch (error) {
            console.error('Error fetching BRI Life candidates:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleFilter = (e: React.FormEvent) => {
        e.preventDefault();
        fetchCandidates(filterDate);
    };

    const toggleSelection = (id: string) => {
        setSelectedIds(prev =>
            prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
        );
    };

    const selectAll = () => {
        if (selectedIds.length === candidates.length) {
            setSelectedIds([]);
        } else {
            setSelectedIds(candidates.map(c => c.id_peserta));
        }
    };

    const handleSubmit = async () => {
        if (selectedIds.length === 0) return;

        setSubmitLoading(true);
        try {
            const token = localStorage.getItem('token');
            await axios.post('http://localhost:3000/api/brilife/submit',
                { id_peserta_list: selectedIds },
                { headers: { Authorization: `Bearer ${token}` } }
            );
            alert('Berhasil diajukan ke Checker!');
            fetchCandidates(filterDate); // Refresh list
        } catch (error) {
            console.error('Error submitting BRI Life registration:', error);
            alert('Gagal mengajukan pendaftaran.');
        } finally {
            setSubmitLoading(false);
        }
    };

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="p-8 w-full max-w-7xl mx-auto"
        >
            <div className="flex justify-between items-end mb-8">
                <div>
                    <h1 className="text-3xl font-black text-gray-900 tracking-tight">Pendaftaran BRI Life</h1>
                    <p className="text-gray-500 mt-1">Daftar kandidat peserta yang akan didaftarkan ke BRI Life.</p>
                </div>

                <form onSubmit={handleFilter} className="flex gap-3">
                    <div className="flex flex-col">
                        <label className="text-xs font-bold text-gray-500 mb-1 uppercase tracking-wider">Filter TMT Pertanggungan</label>
                        <input
                            type="date"
                            className="border border-gray-300 rounded-lg px-4 py-2 text-sm focus:ring-2 focus:ring-blue-600 focus:border-transparent outline-none transition-all shadow-sm"
                            value={filterDate}
                            onChange={(e) => setFilterDate(e.target.value)}
                        />
                    </div>
                    <button
                        type="submit"
                        className="bg-white border border-gray-300 text-gray-700 hover:bg-gray-50 px-6 py-2 rounded-lg font-bold text-sm transition-all shadow-sm self-end h-10 flex items-center gap-2"
                    >
                        <i className="fas fa-filter"></i> Filter
                    </button>
                    {filterDate && (
                        <button
                            type="button"
                            onClick={() => { setFilterDate(''); fetchCandidates(''); }}
                            className="bg-red-50 text-red-600 hover:bg-red-100 px-4 py-2 rounded-lg font-bold text-sm transition-all shadow-sm self-end h-10"
                        >
                            Reset
                        </button>
                    )}
                </form>
            </div>

            <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden mb-6">
                <div className="flex justify-between items-center p-4 border-b border-gray-100 bg-gray-50">
                    <div className="flex items-center gap-3">
                        <div className="bg-blue-100 text-blue-800 font-bold px-3 py-1 rounded-full text-sm">
                            {selectedIds.length} Terpilih
                        </div>
                        <button
                            onClick={selectAll}
                            className="text-sm font-medium text-gray-600 hover:text-blue-600 underline decoration-dotted underline-offset-4"
                        >
                            {selectedIds.length === candidates.length && candidates.length > 0 ? 'Batalkan Semua' : 'Pilih Semua'}
                        </button>
                    </div>

                    <button
                        onClick={handleSubmit}
                        disabled={selectedIds.length === 0 || submitLoading}
                        className={`px-6 py-2 rounded-lg font-bold text-sm transition-all shadow-sm flex items-center gap-2 ${selectedIds.length > 0 ? 'bg-blue-600 text-white hover:bg-blue-700' : 'bg-gray-200 text-gray-400 cursor-not-allowed'}`}
                    >
                        {submitLoading ? (
                            <>
                                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                Mengajukan...
                            </>
                        ) : (
                            <>
                                <i className="fas fa-paper-plane"></i> Ajukan ke Checker
                            </>
                        )}
                    </button>
                </div>

                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50/50">
                            <tr>
                                <th className="px-6 py-4 text-left text-xs font-black text-gray-500 uppercase tracking-wider w-10">
                                    <input
                                        type="checkbox"
                                        className="rounded text-blue-600 focus:ring-blue-600 w-4 h-4"
                                        checked={selectedIds.length === candidates.length && candidates.length > 0}
                                        onChange={selectAll}
                                    />
                                </th>
                                <th className="px-6 py-4 text-left text-xs font-black text-gray-500 uppercase tracking-wider">ID Peserta</th>
                                <th className="px-6 py-4 text-left text-xs font-black text-gray-500 uppercase tracking-wider">Nama / NIK</th>
                                <th className="px-6 py-4 text-left text-xs font-black text-gray-500 uppercase tracking-wider">TMT Pertanggungan</th>
                                <th className="px-6 py-4 text-left text-xs font-black text-gray-500 uppercase tracking-wider">Kelompok / Kelas</th>
                                <th className="px-6 py-4 text-left text-xs font-black text-gray-500 uppercase tracking-wider">Status BRI Life</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-100">
                            {loading ? (
                                <tr>
                                    <td colSpan={6} className="px-6 py-12 text-center text-gray-500">
                                        <div className="flex justify-center mb-4">
                                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                                        </div>
                                        Memuat data kandidat...
                                    </td>
                                </tr>
                            ) : candidates.length === 0 ? (
                                <tr>
                                    <td colSpan={6} className="px-6 py-12 text-center text-gray-500 font-medium bg-gray-50/50">
                                        Tidak ada kandidat BRI Life.
                                    </td>
                                </tr>
                            ) : (
                                candidates.map((p) => (
                                    <tr key={p.id_peserta} className={selectedIds.includes(p.id_peserta) ? 'bg-blue-50/30' : 'hover:bg-gray-50'}>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <input
                                                type="checkbox"
                                                className="rounded text-blue-600 focus:ring-blue-600 w-4 h-4"
                                                checked={selectedIds.includes(p.id_peserta)}
                                                onChange={() => toggleSelection(p.id_peserta)}
                                            />
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-gray-900 border-l-2 border-transparent">
                                            {p.id_peserta}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="text-sm font-bold text-gray-900">{p.nama_peserta}</div>
                                            <div className="text-sm text-gray-500">{p.nik_bri}</div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 font-medium">
                                            {p.tmt_pertanggungan ? new Date(p.tmt_pertanggungan).toLocaleDateString('id-ID') : '-'}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="text-sm text-gray-900">{p.kelompok?.nama || '-'}</div>
                                            <div className="text-sm text-gray-500 text-xs">Kelas {p.kelas?.nama || '-'}</div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <span className="px-3 py-1 inline-flex text-xs leading-5 font-bold rounded-full bg-red-100 text-red-800">
                                                {p.status_brilife?.nama || 'TIDAK TERDAFTAR'}
                                            </span>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            <div className="bg-blue-50 border border-blue-100 rounded-xl p-4 flex gap-3">
                <div className="text-blue-600 mt-0.5"><i className="fas fa-info-circle"></i></div>
                <div>
                    <h4 className="text-sm font-bold text-blue-900 mb-1">Informasi Pendaftaran BRI Life</h4>
                    <p className="text-xs text-blue-800">Pilih kandidat peserta yang akan didaftarkan asuransi BRI Life. Setelah diajukan, permohonan akan masuk ke menu Approval Workspace untuk direview oleh Checker dan disetujui (Signer).</p>
                </div>
            </div>
        </motion.div>
    );
};

export default PendaftaranBrilife;
