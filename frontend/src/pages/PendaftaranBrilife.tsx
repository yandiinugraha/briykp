import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { motion } from 'framer-motion';
import { DataTable, type ColumnDef } from '../components/DataTable';

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
    const apiUrl = import.meta.env.VITE_API_URL;

    useEffect(() => {
        fetchCandidates('');
    }, []);

    const fetchCandidates = async (date: string) => {
        setLoading(true);
        try {
            const token = localStorage.getItem('token');
            const url = date
                ? `${apiUrl}/brilife/candidates?tmt_pertanggungan=${date}`
                : `${apiUrl}/brilife/candidates`;

            const res = await axios.get(url, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setCandidates(res.data || []);
            setSelectedIds([]);
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
        if (selectedIds.length === candidates.length && candidates.length > 0) {
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
            await axios.post(`${apiUrl} /brilife/submit`,
                { id_peserta_list: selectedIds },
                { headers: { Authorization: `Bearer ${token}` } }
            );
            alert('Berhasil diajukan ke Checker!');
            fetchCandidates(filterDate);
        } catch (error) {
            console.error('Error submitting BRI Life registration:', error);
            alert('Gagal mengajukan pendaftaran.');
        } finally {
            setSubmitLoading(false);
        }
    };

    const HeaderCheckbox = () => (
        <input
            type="checkbox"
            className="rounded border-gray-300 text-blue-600 focus:ring-blue-600 w-4 h-4 cursor-pointer"
            checked={selectedIds.length === candidates.length && candidates.length > 0}
            onChange={selectAll}
        />
    );

    const columns: ColumnDef<PesertaData>[] = [
        {
            header: <HeaderCheckbox />,
            accessor: (row) => (
                <input
                    type="checkbox"
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-600 w-4 h-4 cursor-pointer"
                    checked={selectedIds.includes(row.id_peserta)}
                    onChange={() => toggleSelection(row.id_peserta)}
                />
            ),
            id: 'selection',
            sortable: false
        },
        { header: 'ID Peserta', accessor: 'id_peserta', id: 'id_peserta' },
        {
            header: 'Nama / NIK',
            accessor: (row) => (
                <div>
                    <div className="font-bold text-gray-900">{row.nama_peserta}</div>
                    <div className="text-xs text-gray-500">{row.nik_bri}</div>
                </div>
            ),
            id: 'nama_nik'
        },
        {
            header: 'TMT Pertanggungan',
            accessor: (row) => row.tmt_pertanggungan ? new Date(row.tmt_pertanggungan).toLocaleDateString('id-ID', { year: 'numeric', month: 'short', day: 'numeric' }) : '-',
            id: 'tmt_pertanggungan'
        },
        {
            header: 'Kelompok & Kelas',
            accessor: (row) => (
                <div>
                    <div className="text-sm text-gray-900">{row.kelompok?.nama || '-'}</div>
                    <div className="text-xs text-gray-500">Kelas {row.kelas?.nama || '-'}</div>
                </div>
            ),
            id: 'kel_kelas'
        },
        {
            header: 'Status BRI Life',
            accessor: (row) => (
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-100 text-amber-800 border border-amber-200">
                    {row.status_brilife?.nama || 'TIDAK TERDAFTAR'}
                </span>
            ),
            id: 'status_brilife'
        }
    ];

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="p-8 w-full max-w-7xl mx-auto"
        >
            <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-8 gap-4">
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
                        Filter
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
                    </div>

                    <button
                        onClick={handleSubmit}
                        disabled={selectedIds.length === 0 || submitLoading}
                        className={`px - 6 py - 2 rounded - lg font - bold text - sm transition - all shadow - sm flex items - center gap - 2 ${selectedIds.length > 0 ? 'bg-blue-600 text-white hover:bg-blue-700' : 'bg-gray-200 text-gray-400 cursor-not-allowed'}`}
                    >
                        {submitLoading ? 'Mengajukan...' : 'Ajukan ke Checker'}
                    </button>
                </div>

                <DataTable
                    data={candidates}
                    columns={columns}
                    loading={loading}
                    exportFileName="Kandidat_BRILife"
                />
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
