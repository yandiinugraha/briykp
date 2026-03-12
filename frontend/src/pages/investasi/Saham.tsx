import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Upload, FileText, CheckCircle2, Clock, XCircle,
    AlertCircle, Search, Filter, ArrowRight
} from 'lucide-react';
import { DataTable, type ColumnDef } from '../../components/DataTable';
import { useAuth } from '../../context/AuthContext';

interface InvestmentProposal {
    id: number;
    proposal_no: string;
    jenis_investasi: string;
    nama_emiten: string;
    nominal_usulan: number;
    keterangan: string;
    status_approval: string;
    maker_id: string;
    created_at: string;
}

const SahamProposal = () => {
    const { token, role } = useAuth();
    const [proposals, setProposals] = useState<InvestmentProposal[]>([]);
    const [loading, setLoading] = useState(false);
    const [uploading, setUploading] = useState(false);
    const [showUploadModal, setShowUploadModal] = useState(false);
    const [selectedFile, setSelectedFile] = useState<File | null>(null);

    useEffect(() => {
        fetchProposals();
    }, []);

    const fetchProposals = async () => {
        setLoading(true);
        try {
            const res = await axios.get('http://localhost:3000/api/investasi/proposals', {
                headers: { Authorization: `Bearer ${token}` }
            });
            setProposals(res.data || []);
        } catch (error) {
            console.error('Error fetching proposals:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleFileUpload = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedFile) return;

        setUploading(true);
        const formData = new FormData();
        formData.append('file', selectedFile);

        try {
            await axios.post('http://localhost:3000/api/investasi/proposals/upload', formData, {
                headers: {
                    Authorization: `Bearer ${token}`,
                    'Content-Type': 'multipart/form-data'
                }
            });
            alert('Proposal berhasil diunggah!');
            setShowUploadModal(false);
            setSelectedFile(null);
            fetchProposals();
        } catch (error) {
            console.error('Upload error:', error);
            alert('Gagal mengunggah proposal.');
        } finally {
            setUploading(false);
        }
    };

    const handleApprove = async (id: number, status: 'APPROVED' | 'REJECTED') => {
        const catatan = prompt(`Masukkan catatan untuk ${status}:`);
        if (catatan === null) return;

        try {
            const formData = new FormData();
            formData.append('status', status);
            formData.append('catatan', catatan);

            await axios.post(`http://localhost:3000/api/investasi/proposals/${id}/approve`, formData, {
                headers: { Authorization: `Bearer ${token}` }
            });
            alert(`Proposal ${status.toLowerCase()}!`);
            fetchProposals();
        } catch (error) {
            console.error('Approval error:', error);
            alert('Gagal memproses approval.');
        }
    };

    const getStatusStyle = (status: string) => {
        switch (status) {
            case 'FINAL_APPROVED': return 'bg-green-100 text-green-700 border-green-200';
            case 'CHECKED': return 'bg-blue-100 text-blue-700 border-blue-200';
            case 'PENDING': return 'bg-amber-100 text-amber-700 border-amber-200';
            default: return 'bg-red-100 text-red-700 border-red-200';
        }
    };

    const columns: ColumnDef<InvestmentProposal>[] = [
        { header: 'No. Proposal', accessor: 'proposal_no', id: 'proposal_no' },
        { header: 'Emiten / Instrumen', accessor: 'nama_emiten', id: 'nama_emiten' },
        {
            header: 'Nominal Usulan',
            accessor: (row) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR' }).format(row.nominal_usulan),
            id: 'nominal'
        },
        {
            header: 'Status',
            accessor: (row) => (
                <span className={`px-2.5 py-1 rounded-full text-xs font-bold border ${getStatusStyle(row.status_approval)}`}>
                    {row.status_approval}
                </span>
            ),
            id: 'status'
        },
        {
            header: 'Aksi',
            accessor: (row) => {
                const canCheck = role === 'Admin' && row.status_approval === 'PENDING';
                const canSign = role === 'Super Admin' && row.status_approval === 'CHECKED';

                return (
                    <div className="flex gap-2">
                        {(canCheck || canSign) && (
                            <>
                                <button
                                    onClick={() => handleApprove(row.id, 'APPROVED')}
                                    className="p-1.5 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                                    title="Approve"
                                >
                                    <CheckCircle2 size={14} />
                                </button>
                                <button
                                    onClick={() => handleApprove(row.id, 'REJECTED')}
                                    className="p-1.5 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                                    title="Reject"
                                >
                                    <XCircle size={14} />
                                </button>
                            </>
                        )}
                    </div>
                );
            },
            id: 'actions'
        }
    ];

    return (
        <div className="p-8 max-w-7xl mx-auto min-h-screen bg-gray-50/50">
            <div className="flex justify-between items-end mb-8">
                <div>
                    <h1 className="text-3xl font-black text-gray-900 tracking-tight flex items-center gap-3">
                        <div className="w-2 h-8 bg-bri-orange rounded-full"></div>
                        Proposal Investasi Saham
                    </h1>
                    <p className="text-gray-500 mt-1">Kelola usulan investasi saham dan instrumen lainnya.</p>
                </div>
                {role === 'Staff' && (
                    <button
                        onClick={() => setShowUploadModal(true)}
                        className="flex items-center gap-2 bg-bri-blue text-white px-6 py-3 rounded-xl font-bold shadow-lg shadow-bri-blue/20 hover:scale-[1.02] active:scale-95 transition-all"
                    >
                        <Upload size={18} />
                        Upload Proposal (CSV)
                    </button>
                )}
            </div>

            <div className="bg-white rounded-2xl shadow-xl shadow-gray-200/50 border border-gray-100 overflow-hidden">
                <DataTable
                    data={proposals}
                    columns={columns}
                    loading={loading}
                    searchable
                />
            </div>

            {/* Upload Modal */}
            <AnimatePresence>
                {showUploadModal && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            className="bg-white rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden"
                        >
                            <div className="p-8">
                                <h3 className="text-2xl font-black text-gray-900 mb-2">Upload Proposal</h3>
                                <p className="text-gray-500 text-sm mb-6">Format CSV: Jenis, Emiten, Nominal, Keterangan</p>

                                <form onSubmit={handleFileUpload} className="space-y-6">
                                    <div className="border-2 border-dashed border-gray-200 rounded-2xl p-8 text-center hover:border-bri-blue transition-colors relative group">
                                        <input
                                            type="file"
                                            accept=".csv"
                                            onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
                                            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                                        />
                                        <div className="flex flex-col items-center gap-3">
                                            <div className="w-12 h-12 bg-blue-50 text-bri-blue rounded-full flex items-center justify-center group-hover:scale-110 transition-transform">
                                                <Upload size={24} />
                                            </div>
                                            <div className="text-sm font-medium text-gray-600">
                                                {selectedFile ? selectedFile.name : 'Pilih file CSV atau seret ke sini'}
                                            </div>
                                            <div className="text-xs text-gray-400">Maks. 5MB</div>
                                        </div>
                                    </div>

                                    <div className="flex gap-3">
                                        <button
                                            type="button"
                                            onClick={() => setShowUploadModal(false)}
                                            className="flex-1 px-6 py-3 border border-gray-200 text-gray-600 font-bold rounded-xl hover:bg-gray-50 transition-colors"
                                        >
                                            Batal
                                        </button>
                                        <button
                                            type="submit"
                                            disabled={!selectedFile || uploading}
                                            className="flex-3 px-8 py-3 bg-bri-blue text-white font-bold rounded-xl shadow-lg shadow-bri-blue/20 hover:bg-blue-800 disabled:opacity-50 transition-all flex items-center justify-center gap-2"
                                        >
                                            {uploading ? 'Mengunggah...' : 'Unggah Sekarang'}
                                            <ArrowRight size={18} />
                                        </button>
                                    </div>
                                </form>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
};

export { SahamProposal };
export const SahamTransaksi = () => <div className="p-8">Fitur Transaksi Sedang Dikembangkan</div>;
export const SahamSettlement = () => <div className="p-8">Fitur Settlement Sedang Dikembangkan</div>;
export const SahamAkuntansi = () => <div className="p-8">Fitur Akuntansi Sedang Dikembangkan</div>;
export const SahamLikuiditas = () => <div className="p-8">Fitur Likuiditas Sedang Dikembangkan</div>;
export const SahamValuasi = () => <div className="p-8">Fitur Valuasi Mark to Market Sedang Dikembangkan</div>;
export const SahamAkuntansiLanjutan = () => <div className="p-8">Fitur Akuntansi Lanjutan Sedang Dikembangkan</div>;
export const SahamCorporateAction = () => <div className="p-8">Fitur Corporate Action Sedang Dikembangkan</div>;
export const SahamLaporan = () => <div className="p-8">Fitur Laporan Sedang Dikembangkan</div>;
