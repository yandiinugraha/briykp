import React, { useState, useEffect, useMemo } from 'react';
import axios from 'axios';
import { useAuth } from '../../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { DataTable } from '../../components/DataTable';
import type { ColumnDef } from '../../components/DataTable';
import { Eye, Check, X } from 'lucide-react';

const apiUrl = import.meta.env.VITE_API_URL;

const API = `${apiUrl}/kepesertaan/iuran`;

const MONTHS = [
    "Januari", "Februari", "Maret", "April", "Mei", "Juni",
    "Juli", "Agustus", "September", "Oktober", "November", "Desember"
];

const statusColor: Record<string, string> = {
    'PENDING_CHECKER': 'bg-yellow-100 text-yellow-700',
    'PENDING_SIGNER': 'bg-orange-100 text-orange-700',
    'APPROVED': 'bg-green-100 text-green-700',
    'REJECTED': 'bg-red-100 text-red-700',
};

interface IuranUpload {
    id: number;
    bulan: number;
    tahun: number;
    jenis_iuran: string;
    file_name: string;
    total_rows: number;
    total_nominal: number;
    uploaded_by: string;
    status_approval: string;
    checker_id: string | null;
    signer_id: string | null;
    catatan_checker: string | null;
    catatan_signer: string | null;
    created_at: string;
}

const ApprovalIuran: React.FC = () => {
    const { token, user } = useAuth();
    const navigate = useNavigate();
    const [uploads, setUploads] = useState<IuranUpload[]>([]);
    const [loading, setLoading] = useState(true);

    const [selectedReq, setSelectedReq] = useState<IuranUpload | null>(null);
    const [reviewAction, setReviewAction] = useState<'APPROVE' | 'REJECT' | null>(null);
    const [catatan, setCatatan] = useState('');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isProcessing, setIsProcessing] = useState(false);

    const headers = { Authorization: `Bearer ${token}` };

    const fetchUploads = async () => {
        setLoading(true);
        try {
            const res = await axios.get(`${API}/uploads`, { headers });
            setUploads(res.data || []);
        } catch (error) {
            console.error('Failed fetching iuran uploads', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (token) fetchUploads();
    }, [token]);

    // Filter based on role: Checker sees PENDING_CHECKER, Signer sees PENDING_SIGNER
    const filteredList = useMemo(() => {
        const userRole = user?.role?.toLowerCase() || '';
        let list = uploads.filter(u => {
            if (userRole === 'admin' || userRole === 'staff') return u.status_approval === 'PENDING_CHECKER';
            if (userRole === 'super admin') return ['PENDING_CHECKER', 'PENDING_SIGNER'].includes(u.status_approval);
            return ['PENDING_CHECKER', 'PENDING_SIGNER'].includes(u.status_approval);
        });

        return list;
    }, [uploads, user?.role]);

    const handleActionClick = (req: IuranUpload, action: 'APPROVE' | 'REJECT') => {
        setSelectedReq(req);
        setReviewAction(action);
        setCatatan('');
        setIsModalOpen(true);
    };

    const submitReview = async () => {
        if (!selectedReq || !reviewAction) return;
        setIsProcessing(true);
        try {
            await axios.post(`${API}/upload/${selectedReq.id}/process`, {
                action: reviewAction,
                catatan: catatan,
            }, { headers });
            alert(`✅ Iuran ${selectedReq.jenis_iuran} ${MONTHS[selectedReq.bulan - 1]} ${selectedReq.tahun} berhasil di-${reviewAction.toLowerCase()}`);
            setIsModalOpen(false);
            setCatatan('');
            fetchUploads();
        } catch (error: any) {
            alert(`❌ ${error.response?.data?.error || `Gagal memproses ${reviewAction.toLowerCase()}`}`);
        } finally {
            setIsProcessing(false);
        }
    };

    const handleViewDetail = (id: number) => {
        navigate(`/kepesertaan/iuran/upload/${id}/preview`);
    };

    const columns: ColumnDef<IuranUpload>[] = [
        { header: 'Periode', accessor: (row) => `${MONTHS[row.bulan - 1]} ${row.tahun}`, id: 'periode' },
        {
            header: 'Jenis',
            accessor: (row) => <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${row.jenis_iuran === 'THT' ? 'bg-blue-100 text-blue-700' : 'bg-orange-100 text-orange-700'}`}>{row.jenis_iuran}</span>,
            id: 'jenis'
        },
        { header: 'File', accessor: 'file_name', id: 'file_name' },
        { header: 'Rows', accessor: (row) => row.total_rows.toLocaleString(), id: 'rows' },
        { header: 'Total Nominal', accessor: (row) => `Rp ${row.total_nominal.toLocaleString()}`, id: 'nominal' },
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
                <div className="flex justify-center gap-1.5">
                    <button onClick={() => handleViewDetail(row.id)} className="p-1.5 rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-600" title="Lihat Detail">
                        <Eye size={14} />
                    </button>
                    <button onClick={() => handleActionClick(row, 'APPROVE')} className="p-1.5 rounded-lg bg-green-100 hover:bg-green-200 text-green-700" title="Approve">
                        <Check size={14} />
                    </button>
                    <button onClick={() => handleActionClick(row, 'REJECT')} className="p-1.5 rounded-lg bg-red-100 hover:bg-red-200 text-red-700" title="Reject">
                        <X size={14} />
                    </button>
                </div>
            )
        }
    ];

    return (
        <div className="p-6 max-w-7xl mx-auto">
            <div className="mb-6">
                <h2 className="text-2xl font-bold text-gray-800">Approval Data Iuran</h2>
                <p className="text-gray-500 text-sm mt-1">Review dan approve/reject data iuran THT & Prospens yang sudah diupload.</p>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                {loading ? (
                    <div className="p-8 text-center text-gray-400">Memuat data...</div>
                ) : (
                    <div className="p-4 bg-gray-50">
                        <DataTable
                            data={filteredList}
                            columns={columns}
                            searchable={true}
                            exportable={true}
                            exportFileName={`Approval_Iuran`}
                        />
                    </div>
                )}
            </div>

            {/* Approval Modal */}
            {isModalOpen && selectedReq && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden">
                        <div className={`px-6 py-4 border-b ${reviewAction === 'APPROVE' ? 'bg-green-50' : 'bg-red-50'}`}>
                            <h3 className={`text-lg font-bold ${reviewAction === 'APPROVE' ? 'text-green-800' : 'text-red-800'}`}>
                                {reviewAction} — {selectedReq.jenis_iuran} {MONTHS[selectedReq.bulan - 1]} {selectedReq.tahun}
                            </h3>
                            <p className="text-sm text-gray-600 mt-1">
                                {selectedReq.total_rows} baris • Rp {selectedReq.total_nominal.toLocaleString()} • Oleh: {selectedReq.uploaded_by}
                            </p>
                        </div>
                        <div className="p-6">
                            <label className="block text-sm font-medium text-gray-700 mb-2">Catatan (Opsional)</label>
                            <textarea className="w-full border border-gray-300 rounded-lg p-3 text-sm focus:ring-2 focus:ring-blue-500 outline-none" rows={3} placeholder="Masukkan catatan..." value={catatan} onChange={(e) => setCatatan(e.target.value)} />
                        </div>
                        <div className="px-6 py-4 bg-gray-50 border-t flex justify-end gap-3">
                            <button onClick={() => setIsModalOpen(false)} className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50">Batal</button>
                            <button onClick={submitReview} disabled={isProcessing}
                                className={`px-5 py-2 text-sm font-bold text-white rounded-lg shadow-md ${reviewAction === 'APPROVE' ? 'bg-green-600 hover:bg-green-700' : 'bg-red-500 hover:bg-red-600'} ${isProcessing ? 'opacity-50' : ''}`}>
                                {isProcessing ? 'Memproses...' : `Ya, ${reviewAction}`}
                            </button>
                        </div>
                    </div>
                </div>
            )}

        </div>
    );
};

export default ApprovalIuran;
