import React, { useState, useEffect, useMemo } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { Search, Download, ChevronLeft, ChevronRight, Eye, Check, X } from 'lucide-react';

const ApprovalKepesertaan: React.FC = () => {
    const { token, user } = useAuth();
    const [stagingRequests, setStagingRequests] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [isProcessing, setIsProcessing] = useState(false);

    // Modal state for tracking review note
    const [selectedReq, setSelectedReq] = useState<any>(null);
    const [reviewAction, setReviewAction] = useState<'APPROVE' | 'REJECT' | null>(null);
    const [catatan, setCatatan] = useState('');
    const [isDetailOpen, setIsDetailOpen] = useState(false);
    const [isModalOpen, setIsModalOpen] = useState(false);

    useEffect(() => {
        if (token) fetchStaging();
    }, [token]);

    const fetchStaging = async () => {
        setLoading(true);
        try {
            const response = await axios.get('http://localhost:3000/api/peserta/staging/requests', {
                headers: { Authorization: `Bearer ${token}` }
            });
            setStagingRequests(response.data || []);
        } catch (error) {
            console.error('Error fetching staging data:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleActionClick = (req: any, action: 'APPROVE' | 'REJECT') => {
        setSelectedReq(req);
        setReviewAction(action);
        setCatatan('');
        setIsModalOpen(true);
    };

    const submitReview = async () => {
        setIsProcessing(true);
        try {
            await axios.post(`http://localhost:3000/api/peserta/staging/${selectedReq.id_staging}/process`,
                { action: reviewAction, catatan: catatan },
                { headers: { Authorization: `Bearer ${token}` } });

            alert(`Berhasil melakukan ${reviewAction} data!`);
            setIsModalOpen(false);
            fetchStaging();
        } catch (error) {
            console.error('Error processing approval:', error);
            alert('Gagal memproses persetujuan. Pastikan role Anda sesuai (Admin/Checker atau Super Admin/Signer).');
        } finally {
            setIsProcessing(false);
        }
    };

    // Table states
    const [searchTerm, setSearchTerm] = useState('');
    const [page, setPage] = useState(1);
    const limit = 10;

    useEffect(() => {
        setPage(1);
    }, [searchTerm]);

    const finalFilteredList = useMemo(() => {
        let list = stagingRequests.filter(req => {
            const userRole = user?.role?.toLowerCase() || '';
            if (userRole === 'admin' || userRole === 'staff') return req.status_approval === 'PENDING_CHECKER';
            if (userRole === 'super admin') return req.status_approval === 'PENDING_SIGNER' || req.status_approval === 'PENDING_CHECKER';
            return true;
        });

        if (searchTerm) {
            const lowerSearch = searchTerm.toLowerCase();
            list = list.filter(p => Object.values(p).some(val =>
                String(val !== null && val !== undefined ? val : '').toLowerCase().includes(lowerSearch)
            ));
        }
        return list;
    }, [stagingRequests, user?.role, searchTerm]);

    const totalPages = Math.max(1, Math.ceil(finalFilteredList.length / limit));
    const paginatedList = finalFilteredList.slice((page - 1) * limit, page * limit);

    const handleExport = () => {
        const headers = ["Req ID", "Tipe", "Maker", "Status Approval"];
        const csvContent = [
            headers.join(","),
            ...finalFilteredList.map(req => [
                req.id_staging || '',
                req.jenis_pengajuan || '',
                req.maker_id || '',
                req.status_approval || ''
            ].map(v => `"${v}"`).join(","))
        ].join("\n");

        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement("a");
        const url = URL.createObjectURL(blob);
        link.setAttribute("href", url);
        link.setAttribute("download", `approval_kepesertaan_${new Date().getTime()}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    return (
        <div className="p-6 max-w-7xl mx-auto">
            <div className="mb-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h2 className="text-2xl font-bold text-gray-800">Approval Kepesertaan</h2>
                    <p className="text-gray-500 text-sm mt-1">Review data hasil penambahan/perubahan dari Maker sebelum masuk ke database utama.</p>
                    <div className="mt-2 inline-block px-3 py-1 bg-blue-100 text-blue-800 text-xs font-bold rounded-full">
                        Role Anda saat ini: {user?.role || 'Unknown'}
                    </div>
                </div>
                <div className="flex items-center gap-3">
                    <div className="relative">
                        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                        <input
                            type="text"
                            placeholder="Cari Req ID, Tipe..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="pl-9 pr-4 py-2 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-bri-blue/30 focus:border-bri-blue outline-none w-64 shadow-sm"
                        />
                    </div>
                    <button
                        onClick={handleExport}
                        className="bg-white border border-gray-200 text-gray-700 px-4 py-2 rounded-lg text-sm font-medium hover:bg-gray-50 shadow-sm flex items-center gap-2 transition-colors"
                    >
                        <Download size={16} /> Export CSV
                    </button>
                    <button onClick={fetchStaging} className="bg-gray-100 text-gray-700 px-4 py-2 rounded-lg text-sm font-medium hover:bg-gray-200 shadow-sm transition-colors">
                        Refresh
                    </button>
                </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-x-auto">
                <table className="w-full text-left border-collapse whitespace-nowrap">
                    <thead>
                        <tr className="bg-gray-50 text-gray-500 text-xs uppercase tracking-wider">
                            <th className="px-6 py-4 font-medium">Req ID</th>
                            <th className="px-6 py-4 font-medium">Nama Peserta</th>
                            <th className="px-6 py-4 font-medium">Tipe</th>
                            <th className="px-6 py-4 font-medium">Maker</th>
                            <th className="px-6 py-4 font-medium">Status Approval</th>
                            <th className="px-6 py-4 font-medium text-right">Aksi</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100 text-sm">
                        {loading ? (
                            <tr><td colSpan={5} className="text-center py-8 text-gray-500 italic">Memproses data...</td></tr>
                        ) : paginatedList.length === 0 ? (
                            <tr><td colSpan={5} className="text-center py-8 text-gray-500">Belum ada data pending review.</td></tr>
                        ) : (
                            paginatedList.map((req) => {
                                let namaPeserta = '-';
                                try {
                                    if (req.data_json) {
                                        const parsed = JSON.parse(req.data_json);
                                        namaPeserta = parsed.nama_peserta || '-';
                                    }
                                } catch (e) {
                                    console.error('Failed to parse data_json for row', req.id_staging);
                                }

                                return (
                                    <tr key={req.id_staging} className="hover:bg-gray-50/50 transition-colors">
                                        <td className="px-6 py-4 font-medium text-gray-900">#{req.id_staging}</td>
                                        <td className="px-6 py-4 text-gray-900 font-semibold">{namaPeserta}</td>
                                        <td className="px-6 py-4 text-gray-800 font-bold">
                                            <span className={`px-2 py-1 rounded text-xs ${req.jenis_pengajuan === 'BARU' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>
                                                {req.jenis_pengajuan}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-gray-600">{req.maker_id}</td>
                                        <td className="px-6 py-4">
                                            <span className={`px-2 py-1 rounded-full text-xs font-bold ${req.status_approval === 'PENDING_CHECKER' ? 'bg-orange-100 text-orange-800' : 'bg-purple-100 text-purple-800'}`}>
                                                {req.status_approval.replace('_', ' ')}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <div className="flex items-center justify-end gap-2">
                                                <button
                                                    onClick={() => { setSelectedReq(req); setIsDetailOpen(true); }}
                                                    className="text-gray-600 hover:text-gray-900 bg-gray-100 hover:bg-gray-200 transition-colors flex items-center gap-1 text-xs font-semibold px-3 py-1.5 rounded-lg shadow-sm"
                                                    title="View Detail"
                                                >
                                                    <Eye size={14} /> View
                                                </button>
                                                <button
                                                    onClick={() => handleActionClick(req, 'APPROVE')}
                                                    className="text-white bg-green-600 hover:bg-green-700 transition-colors flex items-center gap-1 text-xs font-semibold px-3 py-1.5 rounded-lg shadow-sm"
                                                    title="Approve"
                                                >
                                                    <Check size={14} /> Apprv
                                                </button>
                                                <button
                                                    onClick={() => handleActionClick(req, 'REJECT')}
                                                    className="text-white bg-red-500 hover:bg-red-600 transition-colors flex items-center gap-1 text-xs font-semibold px-3 py-1.5 rounded-lg shadow-sm"
                                                    title="Reject"
                                                >
                                                    <X size={14} /> Rjct
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                )
                            })
                        )}
                    </tbody>
                </table>
                {/* Pagination Controls */}
                {!loading && finalFilteredList.length > 0 && (
                    <div className="px-6 py-4 border-t border-gray-100 bg-gray-50 flex items-center justify-between">
                        <div className="text-sm text-gray-500">
                            Menampilkan <span className="font-medium text-gray-900">{(page - 1) * limit + 1}</span> hingga <span className="font-medium text-gray-900">{Math.min(page * limit, finalFilteredList.length)}</span> dari <span className="font-medium text-gray-900">{finalFilteredList.length}</span> entri
                        </div>
                        <div className="flex items-center gap-2">
                            <button
                                onClick={() => setPage(p => Math.max(1, p - 1))}
                                disabled={page === 1}
                                className="p-1 rounded bg-white border border-gray-300 text-gray-600 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                            >
                                <ChevronLeft size={18} />
                            </button>
                            <div className="px-3 py-1 text-sm font-medium border border-bri-blue text-bri-blue bg-blue-50/50 rounded">
                                {page} / {totalPages}
                            </div>
                            <button
                                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                                disabled={page === totalPages}
                                className="p-1 rounded bg-white border border-gray-300 text-gray-600 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                            >
                                <ChevronRight size={18} />
                            </button>
                        </div>
                    </div>
                )}
            </div>

            {isModalOpen && selectedReq && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden flex flex-col">
                        <div className={`px-6 py-4 border-b border-gray-100 ${reviewAction === 'APPROVE' ? 'bg-green-50' : 'bg-red-50'}`}>
                            <h3 className={`text-lg font-bold ${reviewAction === 'APPROVE' ? 'text-green-800' : 'text-red-800'}`}>
                                Konfirmasi {reviewAction} (ID: {selectedReq.id_staging})
                            </h3>
                        </div>
                        <div className="p-6">
                            <label className="block text-sm font-medium text-gray-700 mb-2">Catatan Review (Opsional)</label>
                            <textarea
                                className="w-full border rounded-md p-3 text-sm focus:ring-2 focus:ring-bri-blue"
                                rows={4}
                                placeholder="Masukkan catatan jika ada..."
                                value={catatan}
                                onChange={(e) => setCatatan(e.target.value)}
                            />
                        </div>
                        <div className="px-6 py-4 bg-gray-50 border-t border-gray-100 flex justify-end gap-3">
                            <button onClick={() => setIsModalOpen(false)} className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50">Batal</button>
                            <button onClick={submitReview} disabled={isProcessing} className={`px-4 py-2 text-sm font-medium text-white rounded-lg shadow-md ${reviewAction === 'APPROVE' ? 'bg-green-600 hover:bg-green-700' : 'bg-red-500 hover:bg-red-600'} ${isProcessing ? 'opacity-50 cursor-not-allowed' : ''}`}>
                                {isProcessing ? 'Memproses...' : `Ya, ${reviewAction}`}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {isDetailOpen && selectedReq && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl overflow-hidden flex flex-col max-h-[90vh]">
                        <div className="px-6 py-4 border-b border-gray-100 bg-gray-50 flex justify-between items-center">
                            <h3 className="text-lg font-bold text-gray-800">Preview Data Staging</h3>
                            <span className="px-3 py-1 bg-yellow-100 text-yellow-700 text-xs font-bold rounded-full">{selectedReq.jenis_pengajuan}</span>
                        </div>
                        <div className="p-6 overflow-y-auto bg-white">
                            <div className="grid grid-cols-2 md:grid-cols-3 gap-y-6 gap-x-8 text-sm">
                                {(() => {
                                    try {
                                        const parsed = JSON.parse(selectedReq.data_json);
                                        return Object.entries(parsed).filter(([k]) => !['created_at', 'updated_at', 'kelompok', 'kelas', 'status_bpjs', 'status_brilife'].includes(k)).map(([k, v]) => (
                                            <div key={k} className="flex flex-col border-b border-gray-50 pb-2">
                                                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">{k.replace(/_/g, ' ')}</span>
                                                <span className="text-gray-800 font-medium truncate">
                                                    {v === null || v === '' ? '-' : String(v)}
                                                </span>
                                            </div>
                                        ));
                                    } catch (e) {
                                        return <div className="col-span-3 text-red-500 p-4 bg-red-50 rounded">Gagal parse JSON Data. Record tidak valid.</div>;
                                    }
                                })()}
                            </div>
                        </div>
                        <div className="px-6 py-4 bg-gray-50 border-t border-gray-100 flex justify-end gap-3">
                            <button onClick={() => setIsDetailOpen(false)} className="px-6 py-2 text-sm font-bold text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors shadow-sm">Tutup Preview</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ApprovalKepesertaan;
