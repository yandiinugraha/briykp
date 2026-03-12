import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { DataTable } from '../../components/DataTable';
import type { ColumnDef } from '../../components/DataTable';
import { Upload, FileSpreadsheet, GitCompare, CheckCircle2, AlertTriangle, XCircle, Send, Eye } from 'lucide-react';

const API = 'http://localhost:3000/api/kepesertaan/iuran';

const MONTHS = [
    "Januari", "Februari", "Maret", "April", "Mei", "Juni",
    "Juli", "Agustus", "September", "Oktober", "November", "Desember"
];

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
    created_at: string;
}

interface Discrepancy {
    id: number;
    nik_bri: string;
    pernr: string;
    nama_peserta: string;
    jenis_selisih: string;
    nominal_tht: number;
    nominal_prospens: number;
}

const statusColor: Record<string, string> = {
    'UPLOADED': 'bg-gray-100 text-gray-700',
    'COMPARED': 'bg-blue-100 text-blue-700',
    'PENDING_CHECKER': 'bg-yellow-100 text-yellow-700',
    'PENDING_SIGNER': 'bg-orange-100 text-orange-700',
    'APPROVED': 'bg-green-100 text-green-700',
    'REJECTED': 'bg-red-100 text-red-700',
};

const IuranPeserta: React.FC = () => {
    const { token } = useAuth();
    const navigate = useNavigate();
    const [uploads, setUploads] = useState<IuranUpload[]>([]);
    const [loading, setLoading] = useState(true);
    const [bulan, setBulan] = useState(new Date().getMonth() + 1);
    const [tahun, setTahun] = useState(new Date().getFullYear());
    const [thtFile, setThtFile] = useState<File | null>(null);
    const [prospensFile, setProspensFile] = useState<File | null>(null);
    const [uploading, setUploading] = useState(false);
    const [comparing, setComparing] = useState(false);
    const [discrepancies, setDiscrepancies] = useState<Discrepancy[]>([]);
    const [showDiscrepancies, setShowDiscrepancies] = useState(false);
    const [activeTab, setActiveTab] = useState<string>('ALL');

    const headers = { Authorization: `Bearer ${token}` };

    const fetchUploads = async () => {
        setLoading(true);
        try {
            const res = await axios.get(`${API}/uploads`, { headers });
            setUploads(res.data || []);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchUploads(); }, []);

    const handleUpload = async (jenis: string, file: File) => {
        setUploading(true);
        try {
            const formData = new FormData();
            formData.append('file', file);
            formData.append('jenis_iuran', jenis);
            formData.append('bulan', bulan.toString());
            formData.append('tahun', tahun.toString());

            const res = await axios.post(`${API}/upload`, formData, {
                headers: { ...headers, 'Content-Type': 'multipart/form-data' }
            });
            alert(`✅ ${res.data.message}`);
            fetchUploads();
            if (jenis === 'THT') setThtFile(null);
            else setProspensFile(null);
        } catch (err: any) {
            alert(`❌ ${err.response?.data?.error || 'Gagal upload'}`);
        } finally {
            setUploading(false);
        }
    };

    const handleCompare = async () => {
        setComparing(true);
        try {
            const res = await axios.post(`${API}/compare/${bulan}/${tahun}`, {}, { headers });
            setDiscrepancies(res.data.discrepancies || []);
            setShowDiscrepancies(true);
            fetchUploads();
            alert(`✅ ${res.data.message} — ${res.data.total_discrepancies} selisih ditemukan`);
        } catch (err: any) {
            alert(`❌ ${err.response?.data?.error || 'Gagal membandingkan'}`);
        } finally {
            setComparing(false);
        }
    };

    const handleSubmit = async (id: number) => {
        try {
            await axios.post(`${API}/upload/${id}/submit`, {}, { headers });
            alert('✅ Disubmit ke Checker');
            fetchUploads();
        } catch (err: any) {
            alert(`❌ ${err.response?.data?.error || 'Gagal submit'}`);
        }
    };

    const handleViewDetail = (id: number) => {
        navigate(`/kepesertaan/iuran/upload/${id}/preview`);
    };

    const loadDiscrepancies = async () => {
        try {
            const res = await axios.get(`${API}/discrepancies/${bulan}/${tahun}`, { headers });
            setDiscrepancies(res.data.discrepancies || []);
            setShowDiscrepancies(true);
        } catch (err) {
            console.error(err);
        }
    };

    const filteredDiscrepancies = activeTab === 'ALL'
        ? discrepancies
        : discrepancies.filter(d => d.jenis_selisih === activeTab);

    // Check if both THT and Prospens are uploaded for current period
    const periodUploads = uploads.filter(u => u.bulan === bulan && u.tahun === tahun);
    const hasTHT = periodUploads.some(u => u.jenis_iuran === 'THT');
    const hasProspens = periodUploads.some(u => u.jenis_iuran === 'PROSPENS');

    const uploadColumns: ColumnDef<IuranUpload>[] = [
        { header: 'Periode', accessor: (row) => `${MONTHS[row.bulan - 1]} ${row.tahun}`, id: 'periode' },
        {
            header: 'Jenis',
            accessor: (row) => <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${row.jenis_iuran === 'THT' ? 'bg-blue-100 text-blue-700' : 'bg-orange-100 text-orange-700'}`}>{row.jenis_iuran}</span>,
            id: 'jenis'
        },
        { header: 'File', accessor: 'file_name', id: 'file_name' },
        { header: 'Rows', accessor: (row) => row.total_rows.toLocaleString(), id: 'rows' },
        { header: 'Total Nominal', accessor: (row) => `Rp ${row.total_nominal.toLocaleString()}`, id: 'nominal' },
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
                    {(row.status_approval === 'UPLOADED' || row.status_approval === 'COMPARED') && (
                        <button onClick={() => handleSubmit(row.id)} className="p-1.5 rounded-lg bg-blue-100 hover:bg-blue-200 text-blue-700" title="Submit ke Checker">
                            <Send size={14} />
                        </button>
                    )}
                </div>
            )
        }
    ];

    const discrepancyColumns: ColumnDef<Discrepancy>[] = [
        { header: 'NIK BRI', accessor: 'nik_bri', id: 'nik' },
        { header: 'PERNR', accessor: 'pernr', id: 'pernr' },
        { header: 'Nama', accessor: (row) => row.nama_peserta || '-', id: 'nama' },
        {
            header: 'Jenis',
            id: 'jenis',
            accessor: (d) => <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold whitespace-nowrap ${d.jenis_selisih === 'THT_PROSPENS_DIFF' ? 'bg-amber-100 text-amber-700' : d.jenis_selisih === 'NEW_MEMBER' ? 'bg-blue-100 text-blue-700' : 'bg-red-100 text-red-700'}`}>{d.jenis_selisih.replace(/_/g, ' ')}</span>
        },
        { header: 'Nominal THT', accessor: (d) => d.nominal_tht ? `Rp ${d.nominal_tht.toLocaleString()}` : '-', id: 'tht' },
        { header: 'Nominal Prospens', accessor: (d) => d.nominal_prospens ? `Rp ${d.nominal_prospens.toLocaleString()}` : '-', id: 'prospens' }
    ];

    return (
        <div className="p-6 max-w-7xl mx-auto space-y-6">
            {/* Header */}
            <div>
                <h2 className="text-2xl font-bold text-gray-800">Upload & Perbandingan Data Iuran</h2>
                <p className="text-gray-500 text-sm mt-1">Upload data THT dan Prospens, bandingkan otomatis, dan submit untuk approval</p>
            </div>

            {/* Period Selector + Upload Cards */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 space-y-5">
                <div className="flex flex-wrap items-end gap-4">
                    <div className="min-w-[180px]">
                        <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Periode Bulan</label>
                        <select className="w-full border border-gray-300 rounded-lg text-sm p-2.5 focus:ring-blue-500 focus:border-blue-500" value={bulan} onChange={e => setBulan(Number(e.target.value))}>
                            {MONTHS.map((m, i) => <option key={m} value={i + 1}>{m}</option>)}
                        </select>
                    </div>
                    <div className="w-28">
                        <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Tahun</label>
                        <input type="number" className="w-full border border-gray-300 rounded-lg text-sm p-2.5 focus:ring-blue-500 focus:border-blue-500" value={tahun} onChange={e => setTahun(Number(e.target.value))} />
                    </div>
                    <div className="ml-auto flex gap-2">
                        {hasTHT && hasProspens && (
                            <button onClick={handleCompare} disabled={comparing} className="bg-indigo-600 text-white px-5 py-2.5 rounded-lg text-sm font-bold hover:bg-indigo-700 flex items-center gap-2 shadow-sm disabled:opacity-50">
                                <GitCompare size={16} /> {comparing ? 'Membandingkan...' : 'Bandingkan THT & Prospens'}
                            </button>
                        )}
                        {discrepancies.length > 0 && (
                            <button onClick={loadDiscrepancies} className="bg-amber-500 text-white px-5 py-2.5 rounded-lg text-sm font-bold hover:bg-amber-600 flex items-center gap-2 shadow-sm">
                                <AlertTriangle size={16} /> Lihat Selisih
                            </button>
                        )}
                    </div>
                </div>

                {/* Upload Cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* THT Upload */}
                    <div className={`border-2 border-dashed rounded-xl p-6 text-center transition-colors ${hasTHT ? 'border-green-300 bg-green-50' : 'border-gray-300 hover:border-blue-400 hover:bg-blue-50/30'}`}>
                        <FileSpreadsheet size={36} className={`mx-auto mb-3 ${hasTHT ? 'text-green-500' : 'text-gray-400'}`} />
                        <h4 className="font-bold text-gray-800 mb-1">Data Iuran THT</h4>
                        {hasTHT ? (
                            <p className="text-green-600 text-sm font-medium flex items-center justify-center gap-1"><CheckCircle2 size={14} /> Sudah diupload</p>
                        ) : (
                            <>
                                <p className="text-gray-500 text-xs mb-3">Format: Excel (.xlsx) — Kolom: NIK BRI, Nama, Nominal</p>
                                <input type="file" accept=".xlsx,.xls" onChange={e => setThtFile(e.target.files?.[0] || null)} className="text-sm mb-2" />
                                {thtFile && (
                                    <button onClick={() => handleUpload('THT', thtFile)} disabled={uploading} className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-bold hover:bg-blue-700 flex items-center gap-2 mx-auto disabled:opacity-50">
                                        <Upload size={14} /> {uploading ? 'Uploading...' : 'Upload THT'}
                                    </button>
                                )}
                            </>
                        )}
                    </div>

                    {/* Prospens Upload */}
                    <div className={`border-2 border-dashed rounded-xl p-6 text-center transition-colors ${hasProspens ? 'border-green-300 bg-green-50' : 'border-gray-300 hover:border-orange-400 hover:bg-orange-50/30'}`}>
                        <FileSpreadsheet size={36} className={`mx-auto mb-3 ${hasProspens ? 'text-green-500' : 'text-gray-400'}`} />
                        <h4 className="font-bold text-gray-800 mb-1">Data Iuran Prospens</h4>
                        {hasProspens ? (
                            <p className="text-green-600 text-sm font-medium flex items-center justify-center gap-1"><CheckCircle2 size={14} /> Sudah diupload</p>
                        ) : (
                            <>
                                <p className="text-gray-500 text-xs mb-3">Format: Excel (.xlsx) — Kolom: NIK BRI, Nama, Nominal</p>
                                <input type="file" accept=".xlsx,.xls" onChange={e => setProspensFile(e.target.files?.[0] || null)} className="text-sm mb-2" />
                                {prospensFile && (
                                    <button onClick={() => handleUpload('PROSPENS', prospensFile)} disabled={uploading} className="bg-orange-600 text-white px-4 py-2 rounded-lg text-sm font-bold hover:bg-orange-700 flex items-center gap-2 mx-auto disabled:opacity-50">
                                        <Upload size={14} /> {uploading ? 'Uploading...' : 'Upload Prospens'}
                                    </button>
                                )}
                            </>
                        )}
                    </div>
                </div>
            </div>

            {/* Discrepancy View */}
            {showDiscrepancies && discrepancies.length > 0 && (
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                    <div className="p-4 border-b border-gray-200 bg-amber-50 flex items-center justify-between">
                        <h3 className="text-md font-bold text-amber-800 flex items-center gap-2">
                            <AlertTriangle size={18} /> Hasil Perbandingan — {MONTHS[bulan - 1]} {tahun}
                        </h3>
                        <button onClick={() => setShowDiscrepancies(false)} className="text-gray-400 hover:text-gray-600"><XCircle size={18} /></button>
                    </div>
                    {/* Tabs */}
                    <div className="flex gap-1 p-3 border-b border-gray-100 bg-gray-50 flex-wrap">
                        {[
                            { key: 'ALL', label: `Semua (${discrepancies.length})` },
                            { key: 'THT_PROSPENS_DIFF', label: `Selisih THT/Prospens (${discrepancies.filter(d => d.jenis_selisih === 'THT_PROSPENS_DIFF').length})` },
                            { key: 'NEW_MEMBER', label: `Anggota Baru (${discrepancies.filter(d => d.jenis_selisih === 'NEW_MEMBER').length})` },
                            { key: 'REMOVED_MEMBER', label: `Pengurangan (${discrepancies.filter(d => d.jenis_selisih === 'REMOVED_MEMBER').length})` },
                        ].map(tab => (
                            <button key={tab.key} onClick={() => setActiveTab(tab.key)}
                                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${activeTab === tab.key ? 'bg-amber-500 text-white' : 'bg-white text-gray-600 hover:bg-amber-100 border border-gray-200'}`}>
                                {tab.label}
                            </button>
                        ))}
                    </div>
                    <div className="p-4">
                        <DataTable
                            data={filteredDiscrepancies}
                            columns={discrepancyColumns}
                            searchable={true}
                            exportable={true}
                            exportFileName={`Selisih_Iuran_${MONTHS[bulan - 1]}_${tahun}`}
                        />
                    </div>
                </div>
            )}

            {/* Upload History */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                <div className="p-4 border-b border-gray-200">
                    <h3 className="text-md font-bold text-gray-800">Riwayat Upload</h3>
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
                            exportFileName={`Riwayat_Upload_Iuran`}
                        />
                    </div>
                )}
            </div>
        </div>
    );
};

export default IuranPeserta;
