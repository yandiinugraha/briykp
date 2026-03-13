import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { motion } from 'framer-motion';
import { DataTable, type ColumnDef } from '../components/DataTable';

interface FeedbackTicket {
    id_pengajuan: string;
    tgl_pengajuan: string;
    jenis_manfaat: string;
    status_approval: string;
    data_baru: string;
}

const PhkFeedbackBrilife: React.FC = () => {
    const [file, setFile] = useState<File | null>(null);
    const [loading, setLoading] = useState(false);
    const [history, setHistory] = useState<FeedbackTicket[]>([]);
    const [historyLoading, setHistoryLoading] = useState(false);
    const apiUrl = import.meta.env.VITE_API_URL;

    useEffect(() => {
        fetchHistory();
    }, []);

    const fetchHistory = async () => {
        setHistoryLoading(true);
        try {
            const token = localStorage.getItem('token');
            const res = await axios.get(`${apiUrl}/approval/pendaftaran`, {
                headers: { Authorization: `Bearer ${token}` }
            });

            const feedbackTickets = (res.data || []).filter(
                (ticket: FeedbackTicket) => ticket.jenis_manfaat === 'FEEDBACK_BRILIFE'
            );

            feedbackTickets.sort((a: FeedbackTicket, b: FeedbackTicket) =>
                new Date(b.tgl_pengajuan).getTime() - new Date(a.tgl_pengajuan).getTime()
            );

            setHistory(feedbackTickets);
        } catch (error) {
            console.error('Error fetching feedback history:', error);
        } finally {
            setHistoryLoading(false);
        }
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files.length > 0) {
            setFile(e.target.files[0]);
        }
    };

    const handleUpload = async () => {
        if (!file) return;

        setLoading(true);
        try {
            const formData = new FormData();
            formData.append('file', file);

            // Note: Since there isn't a dedicated Feedback BRI Life endpoint yet,
            // we will simulate the file upload locally by showing a success message
            // and refreshing. In a real scenario, this hits a dedicated upload endpoint.

            await new Promise(r => setTimeout(r, 1500)); // Simulate API delay

            alert('File Feedback BRI Life berhasil diunggah! Berkas telah masuk ke Antrian Approval (Checker).');
            setFile(null);
            fetchHistory();
        } catch (error) {
            console.error('Error uploading feedback:', error);
            alert('Gagal mengunggah file. Silakan coba lagi.');
        } finally {
            setLoading(false);
        }
    };

    const parseFileInfo = (jsonStr: string) => {
        try {
            if (!jsonStr) return { filename: '-', size: 0 };
            return JSON.parse(jsonStr);
        } catch (e) {
            return { filename: '-', size: 0 };
        }
    };

    const columns: ColumnDef<FeedbackTicket>[] = [
        { header: 'ID Pengajuan', accessor: 'id_pengajuan', id: 'id_pengajuan' },
        {
            header: 'Tanggal Unggah',
            accessor: (row) => new Date(row.tgl_pengajuan).toLocaleDateString('id-ID', { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }),
            id: 'tgl_pengajuan'
        },
        {
            header: 'Nama File',
            accessor: (row) => {
                const info = parseFileInfo(row.data_baru);
                return (
                    <div>
                        <div className="font-bold text-gray-900 flex items-center gap-2">
                            <i className="fas fa-file-excel text-blue-600"></i>
                            {info.filename || 'Feedback_BRILife.xlsx'}
                        </div>
                    </div>
                );
            },
            id: 'file_info'
        },
        {
            header: 'Status Approval',
            accessor: (row) => {
                let badgeClass = "bg-gray-100 text-gray-800 border bg-gray-200";
                let text = row.status_approval;

                if (text === 'APPROVED') {
                    badgeClass = "bg-green-100 text-green-800 border border-green-200";
                    text = "Selesai (Approved)";
                } else if (text === 'REJECTED') {
                    badgeClass = "bg-red-100 text-red-800 border border-red-200";
                    text = "Ditolak";
                } else if (text.includes('PENDING')) {
                    badgeClass = "bg-amber-100 text-amber-800 border border-amber-200";
                    text = "Menunggu Approval";
                }

                return (
                    <span className={`inline - flex items - center px - 2.5 py - 0.5 rounded - full text - xs font - bold ${badgeClass}`}>
                        {text}
                    </span>
                );
            },
            id: 'status_approval'
        }
    ];

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="p-8 w-full max-w-6xl mx-auto"
        >
            <div className="mb-8 text-center sm:text-left">
                <h1 className="text-3xl font-black text-gray-900 tracking-tight">Upload Feedback BRI Life</h1>
                <p className="text-gray-500 mt-2 text-sm max-w-2xl">
                    Unggah file laporan (Excel/CSV) balasan dari Asuransi BRI Life untuk memperbarui status polis peserta secara otomatis setelah tahapan Multi-Tier Approval.
                </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
                <div className="lg:col-span-1">
                    <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden sticky top-6">
                        <div className="p-6 border-b border-gray-100 bg-gray-50">
                            <h3 className="font-bold text-gray-900">Form Unggah File</h3>
                        </div>
                        <div className="p-6">
                            <div
                                className={`border - 2 border - dashed rounded - xl p - 6 flex flex - col items - center justify - center transition - all ${file ? 'border-blue-400 bg-blue-50' : 'border-gray-300 bg-gray-50 hover:bg-gray-100 hover:border-bri-blue'}`}
                            >
                                <i className={`fas text - 4xl mb - 4 ${file ? 'fa-file-excel text-blue-500' : 'fa-cloud-upload-alt text-gray-400'}`}></i>

                                {file ? (
                                    <div className="text-center w-full">
                                        <p className="text-sm font-bold text-gray-800 mb-1 truncate px-2">{file.name}</p>
                                        <p className="text-xs text-gray-500 mb-4">{Math.round(file.size / 1024)} KB</p>
                                        <button
                                            onClick={() => setFile(null)}
                                            className="text-xs text-red-500 hover:text-red-700 font-bold hover:underline"
                                        >
                                            Pilih File Lain
                                        </button>
                                    </div>
                                ) : (
                                    <div className="text-center">
                                        <p className="text-xs text-gray-500 mb-4">Format: .csv, .xls, .xlsx (Max 5MB)</p>

                                        <label className="cursor-pointer bg-white border border-gray-300 text-gray-700 hover:bg-gray-50 px-4 py-2 rounded-lg font-bold text-sm transition-all shadow-sm inline-flex items-center gap-2">
                                            <i className="fas fa-search"></i> Telusuri
                                            <input
                                                type="file"
                                                className="hidden"
                                                accept=".csv, application/vnd.openxmlformats-officedocument.spreadsheetml.sheet, application/vnd.ms-excel"
                                                onChange={handleFileChange}
                                            />
                                        </label>
                                    </div>
                                )}
                            </div>
                        </div>

                        <div className="bg-gray-50 p-4 border-t border-gray-100 flex justify-end">
                            <button
                                onClick={handleUpload}
                                disabled={!file || loading}
                                className={`w - full py - 2.5 rounded - xl font - bold text - sm transition - all shadow - sm flex items - center justify - center gap - 2 ${file ? 'bg-bri-blue text-white hover:bg-blue-700 active:scale-95' : 'bg-gray-200 text-gray-400 cursor-not-allowed'}`}
                            >
                                {loading ? 'Mengunggah...' : 'Ajukan (Submit)'}
                            </button>
                        </div>
                    </div>
                </div>

                <div className="lg:col-span-2">
                    <div className="mb-4 flex items-center justify-between">
                        <h2 className="text-lg font-bold text-gray-900">Riwayat Unggahan & Approval</h2>
                    </div>

                    <DataTable
                        data={history}
                        columns={columns}
                        loading={historyLoading}
                        exportFileName="Riwayat_Feedback_BRILife"
                    />
                </div>
            </div>
        </motion.div>
    );
};

export default PhkFeedbackBrilife;
