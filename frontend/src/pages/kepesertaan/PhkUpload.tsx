import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { DataTable } from '../../components/DataTable';
import type { ColumnDef } from '../../components/DataTable';
import { Upload, FileSpreadsheet, Eye, Send, CheckCircle2, XCircle } from 'lucide-react';

const API = 'http://localhost:3000/api/kepesertaan/phk';

const MONTHS = [
    "Januari", "Februari", "Maret", "April", "Mei", "Juni",
    "Juli", "Agustus", "September", "Oktober", "November", "Desember"
];

const statusColor: Record<string, string> = {
    'UPLOADED': 'bg-gray-100 text-gray-700',
    'COMPARED': 'bg-blue-100 text-blue-700',
    'PENDING_CHECKER': 'bg-yellow-100 text-yellow-700',
    'PENDING_SIGNER': 'bg-orange-100 text-orange-700',
    'APPROVED': 'bg-green-100 text-green-700',
    'REJECTED': 'bg-red-100 text-red-700',
};

interface PhkUpload {
    id: number;
    bulan: number;
    tahun: number;
    file_name: string;
    total_rows: number;
    uploaded_by: string;
    status_approval: string;
    created_at: string;
}

const PhkUploadPage: React.FC = () => {
    const { token } = useAuth();
    const navigate = useNavigate();
    const [uploads, setUploads] = useState<PhkUpload[]>([]);
    const [loading, setLoading] = useState(true);
    const [bulan, setBulan] = useState(new Date().getMonth() + 1);
    const [tahun, setTahun] = useState(new Date().getFullYear());
    const [isUploading, setIsUploading] = useState(false);
    const [actionProcessing, setActionProcessing] = useState<number | null>(null);

    const headers = { Authorization: `Bearer ${token}` };

    const fetchUploads = async () => {
        setLoading(true);
        try {
            const res = await axios.get(`${API}/uploads`, { headers });
            setUploads(res.data || []);
        } catch (error) {
            console.error('Failed fetching PHK uploads', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (token) fetchUploads();
    }, [token]);

    const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (!e.target.files || e.target.files.length === 0) return;
        setIsUploading(true);

        const formData = new FormData();
        formData.append('file', e.target.files[0]);
        formData.append('bulan', bulan.toString());
        formData.append('tahun', tahun.toString());

        try {
            await axios.post(`${API}/upload`, formData, {
                headers: { ...headers, 'Content-Type': 'multipart/form-data' },
            });
            alert('✅ Berhasil upload data PHK!');
            fetchUploads();
        } catch (err: any) {
            console.error("Upload error", err);
            alert(`❌ ${err.response?.data?.error || 'Gagal upload file. Harap cek kembali.'}`);
        } finally {
            setIsUploading(false);
            e.target.value = '';
        }
    };

    const handleViewDetail = (id: number) => {
        navigate(`/kepesertaan/phk/upload/${id}/preview`);
    };

    const handleSubmit = async (id: number) => {
        if (!confirm('Submit data ini ke Checker?')) return;
        setActionProcessing(id);
        try {
            await axios.post(`${API}/upload/${id}/submit`, {}, { headers });
            alert('✅ Berhasil disubmit ke Checker');
            fetchUploads();
        } catch (err: any) {
            alert(`❌ Gagal: ${err.response?.data?.error || 'Terjadi kesalahan'}`);
        } finally {
            setActionProcessing(null);
        }
    };

    const handleProcess = async (id: number, action: 'APPROVE' | 'REJECT') => {
        const confirmText = action === 'APPROVE' ? 'Setujui data ini?' : 'Tolak data ini?';
        if (!confirm(confirmText)) return;

        const catatan = prompt("Masukkan catatan (opsional):", "");
        if (catatan === null) return; // User cancelled

        setActionProcessing(id);
        try {
            await axios.post(`${API}/upload/${id}/process`, { action, catatan }, { headers });
            alert(`✅ Data berhasil ${action === 'APPROVE' ? 'disetujui' : 'ditolak'}`);
            fetchUploads();
        } catch (err: any) {
            alert(`❌ Gagal: ${err.response?.data?.error || 'Terjadi kesalahan'}`);
        } finally {
            setActionProcessing(null);
        }
    };

    const uploadColumns: ColumnDef<PhkUpload>[] = [
        { header: 'Periode', accessor: (row) => `${MONTHS[row.bulan - 1]} ${row.tahun}`, id: 'periode' },
        { header: 'File', accessor: 'file_name', id: 'file_name' },
        { header: 'Total Baris', accessor: (row) => row.total_rows.toLocaleString(), id: 'rows' },
        { header: 'Uploader', accessor: 'uploaded_by', id: 'uploader' },
        {
            header: 'Status',
            accessor: (row) => <span className={`px-2 py-1 rounded-full text-[10px] font-bold ${statusColor[row.status_approval] || 'bg-gray-100 text-gray-600'}`}>{row.status_approval.replace(/_/g, ' ')}</span>,
            id: 'status'
        },
        {
            header: 'Aksi',
            id: 'aksi',
            accessor: (row) => (
                <div className="flex justify-center gap-1">
                    <button onClick={() => handleViewDetail(row.id)} className="p-1.5 rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-600" title="Lihat Detail">
                        <Eye size={14} />
                    </button>

                    {/* Submit Action for Maker */}
                    {(row.status_approval === 'UPLOADED' || row.status_approval === 'COMPARED') && (
                        <button onClick={() => handleSubmit(row.id)} disabled={actionProcessing === row.id} className="p-1.5 rounded-lg bg-blue-100 hover:bg-blue-200 text-blue-700 disabled:opacity-50" title="Submit ke Checker">
                            <Send size={14} />
                        </button>
                    )}

                    {/* Approve / Reject Action for Checker / Signer */}
                    {(row.status_approval === 'PENDING_CHECKER' || row.status_approval === 'PENDING_SIGNER') && (
                        <>
                            <button onClick={() => handleProcess(row.id, 'APPROVE')} disabled={actionProcessing === row.id} className="p-1.5 rounded-lg bg-green-100 hover:bg-green-200 text-green-700 disabled:opacity-50" title="Setujui">
                                <CheckCircle2 size={14} />
                            </button>
                            <button onClick={() => handleProcess(row.id, 'REJECT')} disabled={actionProcessing === row.id} className="p-1.5 rounded-lg bg-red-100 hover:bg-red-200 text-red-700 disabled:opacity-50" title="Tolak">
                                <XCircle size={14} />
                            </button>
                        </>
                    )}
                </div>
            )
        }
    ];

    return (
        <div className="p-6 max-w-7xl mx-auto space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
                        <FileSpreadsheet className="text-bri-blue" /> Upload Data PHK
                    </h2>
                    <p className="text-gray-500 text-sm mt-1">Upload file Excel data PHK untuk diintegrasikan ke kepesertaan.</p>
                </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <h3 className="text-lg font-bold mb-4 text-gray-800">Form Upload</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1.5">Bulan</label>
                        <select value={bulan} onChange={e => setBulan(Number(e.target.value))} className="w-full border border-gray-300 rounded-lg p-2.5 text-sm focus:ring-2 focus:ring-blue-500 outline-none">
                            {MONTHS.map((m, i) => <option key={i} value={i + 1}>{m}</option>)}
                        </select>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1.5">Tahun</label>
                        <input type="number" value={tahun} onChange={e => setTahun(Number(e.target.value))} className="w-full border border-gray-300 rounded-lg p-2.5 text-sm focus:ring-2 focus:ring-blue-500 outline-none" min={2000} max={2100} />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1.5">File Excel (.xlsx)</label>
                        <label className={`flex items-center justify-center w-full h-[42px] border-2 border-dashed rounded-lg cursor-pointer transition-colors ${isUploading ? 'border-gray-300 bg-gray-50' : 'border-blue-300 bg-blue-50 hover:bg-blue-100'}`}>
                            <div className="flex items-center gap-2 text-sm text-blue-700 font-medium">
                                {isUploading ? <div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div> : <Upload size={16} />}
                                {isUploading ? 'Mengunggah...' : 'Pilih File Excel'}
                            </div>
                            <input type="file" className="hidden" accept=".xlsx" onChange={handleUpload} disabled={isUploading} />
                        </label>
                    </div>
                </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                <div className="p-4 border-b bg-gray-50 flex items-center justify-between">
                    <h3 className="font-bold text-gray-800 flex items-center gap-2">Riwayat Upload PHK</h3>
                </div>
                {loading ? (
                    <div className="p-8 text-center text-gray-400">Memuat data...</div>
                ) : (
                    <div className="p-4 bg-gray-50">
                        <DataTable
                            data={uploads}
                            columns={uploadColumns}
                            searchable={true}
                            exportable={true}
                            exportFileName={`Riwayat_Upload_PHK`}
                        />
                    </div>
                )}
            </div>
        </div>
    );
};

export default PhkUploadPage;
