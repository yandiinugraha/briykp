import React, { useState, useEffect } from 'react';
import axios from 'axios';

import {
    Upload, CheckCircle2, XCircle
} from 'lucide-react';
import { DataTable, type ColumnDef } from '../../components/DataTable';
import { useAuth } from '../../context/AuthContext';

// --- Shared Types ---
interface InvestmentProposal {
    id: number;
    proposal_no: string;
    jenis_investasi: string;
    kode_efek: string;
    nama_emiten: string;
    tipe_transaksi: string;
    nominal_usulan: number;
    range_harga: string;
    range_yield: string;
    keterangan: string;
    status_approval: string;
    maker_id: string;
    created_at: string;
}

interface InvestmentTransaction {
    id: number;
    proposal_id: number;
    transaction_no: string;
    jenis_transaksi: string;
    kode_efek: string;
    nama_emiten: string;
    nominal: number;
    harga_percent: number;
    yield: number;
    tgl_transaksi: string;
    sekuritas: string;
    status: string;
}

// --- Shared Helper ---
const getStatusStyle = (status: string) => {
    switch (status) {
        case 'FINAL_APPROVED': return 'bg-green-100 text-green-700 border-green-200';
        case 'CHECKED': return 'bg-blue-100 text-blue-700 border-blue-200';
        case 'PENDING': return 'bg-amber-100 text-amber-700 border-amber-200';
        case 'REJECTED': return 'bg-red-100 text-red-700 border-red-200';
        default: return 'bg-gray-100 text-gray-700 border-gray-200';
    }
};

const formatCurrency = (val: number) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(val);

// --- Component: ObligasiProposal ---
export const ObligasiProposal = () => {
    const { token, user } = useAuth();
    const [proposals, setProposals] = useState<InvestmentProposal[]>([]);
    const [loading, setLoading] = useState(false);
    const [showUpload, setShowUpload] = useState(false);
    const [file, setFile] = useState<File | null>(null);
    const apiUrl = import.meta.env.VITE_API_URL;

    useEffect(() => { fetchProposals(); }, []);

    const fetchProposals = async () => {
        setLoading(true);
        try {
            const res = await axios.get(`${apiUrl}/investasi/proposals`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            // Filter only OBLIGASI
            setProposals((res.data || []).filter((p: any) => p.jenis_investasi === 'OBLIGASI'));
        } catch (e) { console.error(e); }
        setLoading(false);
    };

    const handleUpload = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!file) return;
        const formData = new FormData();
        formData.append('file', file);
        try {
            await axios.post(`${apiUrl}/investasi/proposals/upload`, formData, {
                headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'multipart/form-data' }
            });
            alert('Proposal Obligasi berhasil diunggah!');
            setShowUpload(false);
            fetchProposals();
        } catch (e) { alert('Gagal mengunggah proposal'); }
    };

    const handleAction = async (id: number, status: 'APPROVED' | 'REJECTED') => {
        const catatan = prompt(`Catatan ${status}:`) || '';
        try {
            await axios.post(`${apiUrl}/investasi/proposals/${id}/approve`,
                { status, catatan },
                { headers: { Authorization: `Bearer ${token}` } }
            );
            fetchProposals();
        } catch (e) { alert('Gagal memproses approval'); }
    };

    const columns: ColumnDef<InvestmentProposal>[] = [
        { header: 'No. Proposal', accessor: 'proposal_no', id: 'no' },
        {
            header: 'Instrumen',
            accessor: (row) => (
                <div className="flex flex-col">
                    <span className="font-bold text-bri-blue">{row.kode_efek}</span>
                    <span className="text-xs text-gray-500">{row.nama_emiten}</span>
                </div>
            ),
            id: 'instrument'
        },
        { header: 'Tipe', accessor: 'tipe_transaksi', id: 'type' },
        { header: 'Nominal', accessor: (row) => formatCurrency(row.nominal_usulan), id: 'nominal' },
        {
            header: 'Target (Px/Yld)',
            accessor: (row) => `${row.range_harga || '-'} / ${row.range_yield || '-'}%`,
            id: 'targets'
        },
        {
            header: 'Status',
            accessor: (row) => (
                <span className={`px-2.5 py-1 rounded-full text-[10px] font-black border ${getStatusStyle(row.status_approval)}`}>
                    {row.status_approval}
                </span>
            ),
            id: 'status'
        },
        {
            header: 'Aksi',
            accessor: (row) => {
                const canCheck = user?.role === 'Admin' && row.status_approval === 'PENDING';
                const canSign = user?.role === 'Super Admin' && row.status_approval === 'CHECKED';
                if (!canCheck && !canSign) return <span className="text-gray-400 text-xs">-</span>;
                return (
                    <div className="flex gap-1">
                        <button onClick={() => handleAction(row.id, 'APPROVED')} className="p-1.5 bg-green-500 text-white rounded-lg hover:bg-green-600"><CheckCircle2 size={14} /></button>
                        <button onClick={() => handleAction(row.id, 'REJECTED')} className="p-1.5 bg-red-500 text-white rounded-lg hover:bg-red-600"><XCircle size={14} /></button>
                    </div>
                );
            },
            id: 'actions'
        }
    ];

    return (
        <div className="p-6 bg-gray-50/50 min-h-screen">
            <div className="flex justify-between items-end mb-8">
                <div>
                    <h1 className="text-2xl font-black text-gray-900 flex items-center gap-2">
                        <div className="w-1.5 h-6 bg-bri-orange rounded-full"></div>
                        Proposal Investasi Obligasi
                    </h1>
                    <p className="text-gray-500 text-sm">Alur Maker-Checker-Signer untuk Usulan obligasi.</p>
                </div>
                {user?.role === 'Staff' && (
                    <button onClick={() => setShowUpload(true)} className="flex items-center gap-2 bg-bri-blue text-white px-5 py-2.5 rounded-xl font-bold hover:scale-105 transition-all shadow-lg">
                        <Upload size={18} /> Upload Proposal
                    </button>
                )}
            </div>

            <div className="bg-white rounded-2xl shadow-sm border border-gray-100">
                <DataTable data={proposals} columns={columns} loading={loading} searchable />
            </div>

            {showUpload && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
                    <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-2xl">
                        <h2 className="text-xl font-bold mb-4">Upload Proposal CSV</h2>
                        <div className="p-4 bg-blue-50 text-blue-800 rounded-xl text-xs mb-4">
                            <strong>Format:</strong> Jenis(OBLIGASI), KodeEfek, NamaEmiten, Tipe(BELI/JUAL), Nominal, RangeHarga, RangeYield, Keterangan
                        </div>
                        <form onSubmit={handleUpload}>
                            <input type="file" onChange={(e) => setFile(e.target.files?.[0] || null)} className="w-full p-4 border-2 border-dashed border-gray-200 rounded-xl mb-6" />
                            <div className="flex gap-2">
                                <button type="button" onClick={() => setShowUpload(false)} className="flex-1 py-2 text-gray-500 font-bold">Batal</button>
                                <button type="submit" className="flex-2 py-2 bg-bri-blue text-white rounded-xl font-bold">Upload</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

// --- Component: ObligasiTransaksi ---
export const ObligasiTransaksi = () => {
    const { token, user } = useAuth();
    const [txs, setTxs] = useState<InvestmentTransaction[]>([]);
    const [loading, setLoading] = useState(false);
    const [showUpload, setShowUpload] = useState(false);
    const [file, setFile] = useState<File | null>(null);
    const apiUrl = import.meta.env.VITE_API_URL;

    useEffect(() => { fetchTxs(); }, []);

    const fetchTxs = async () => {
        setLoading(true);
        try {
            const res = await axios.get(`${apiUrl}/investasi/transactions`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setTxs(res.data || []);
        } catch (e) { console.error(e); }
        setLoading(false);
    };

    const handleUpload = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!file) return;
        const formData = new FormData();
        formData.append('file', file);
        try {
            await axios.post(`${apiUrl}/investasi/transactions/upload`, formData, {
                headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'multipart/form-data' }
            });
            alert('Transaksi Obligasi berhasil diunggah!');
            setShowUpload(false);
            fetchTxs();
        } catch (e) { alert('Gagal mengunggah transaksi. Pastikan Proposal sudah FINAL_APPROVED'); }
    };

    const columns: ColumnDef<InvestmentTransaction>[] = [
        { header: 'No. Transaksi', accessor: 'transaction_no', id: 'no' },
        { header: 'Efek', accessor: 'kode_efek', id: 'efek' },
        { header: 'Emiten', accessor: 'nama_emiten', id: 'emiten' },
        { header: 'Tipe', accessor: 'jenis_transaksi', id: 'type' },
        { header: 'Nominal', accessor: (row) => formatCurrency(row.nominal), id: 'nominal' },
        { header: 'Harga (%)', accessor: (row) => `${row.harga_percent}%`, id: 'price' },
        { header: 'Yield', accessor: (row) => `${row.yield}%`, id: 'yield' },
        { header: 'Tgl Transaksi', accessor: (row) => new Date(row.tgl_transaksi).toLocaleDateString('id-ID'), id: 'date' },
        { header: 'Status', accessor: (row) => <span className="px-2 py-0.5 bg-green-100 text-green-700 text-[10px] font-bold rounded-full">{row.status}</span>, id: 'status' }
    ];

    return (
        <div className="p-6 bg-gray-50/50 min-h-screen">
            <div className="flex justify-between items-end mb-8">
                <div>
                    <h1 className="text-2xl font-black text-gray-900 flex items-center gap-2">
                        <div className="w-1.5 h-6 bg-green-500 rounded-full"></div>
                        Pencatatan Transaksi Obligasi
                    </h1>
                    <p className="text-gray-500 text-sm">Detail realisasi transaksi berdasarkan proposal yang disetujui.</p>
                </div>
                {user?.role === 'Staff' && (
                    <button onClick={() => setShowUpload(true)} className="flex items-center gap-2 bg-green-600 text-white px-5 py-2.5 rounded-xl font-bold hover:scale-105 transition-all shadow-lg">
                        <Upload size={18} /> Upload Transaksi
                    </button>
                )}
            </div>

            <div className="bg-white rounded-2xl shadow-sm border border-gray-100">
                <DataTable data={txs} columns={columns} loading={loading} searchable />
            </div>

            {showUpload && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
                    <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-2xl">
                        <h2 className="text-xl font-bold mb-4">Upload Transaksi CSV</h2>
                        <div className="p-4 bg-green-50 text-green-800 rounded-xl text-xs mb-4">
                            <strong>Format:</strong> NoProposal, KodeEfek, NamaEmiten, Tipe, Nominal, HargaPercent, Yield, Sekuritas, Tgl(YYYY-MM-DD)
                        </div>
                        <form onSubmit={handleUpload}>
                            <input type="file" onChange={(e) => setFile(e.target.files?.[0] || null)} className="w-full p-4 border-2 border-dashed border-gray-200 rounded-xl mb-6" />
                            <div className="flex gap-2">
                                <button type="button" onClick={() => setShowUpload(false)} className="flex-1 py-2 text-gray-500 font-bold">Batal</button>
                                <button type="submit" className="flex-2 py-2 bg-green-600 text-white rounded-xl font-bold">Konfirmasi</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

// --- Empty Placeholders for other steps ---
const STEPS = ['Proposal', 'Transaksi', 'Settlement', 'Likuiditas', 'Akuntansi', 'Perhitungan Accrual Bunga & Amortisasi', 'Kupon', 'Valuasi Mark to Market', 'Jatuh Tempo', 'Laporan'];
import PlaceholderPage from '../../components/PlaceholderPage';

export const ObligasiSettlement = () => <PlaceholderPage moduleName="Investasi" featureName="Obligasi" stepName="Settlement" stepNumber={3} totalSteps={10} steps={STEPS} accentColor="#F37021" />;
export const ObligasiLikuiditas = () => <PlaceholderPage moduleName="Investasi" featureName="Obligasi" stepName="Likuiditas" stepNumber={4} totalSteps={10} steps={STEPS} accentColor="#F37021" />;
export const ObligasiAkuntansi = () => <PlaceholderPage moduleName="Investasi" featureName="Obligasi" stepName="Akuntansi" stepNumber={5} totalSteps={10} steps={STEPS} accentColor="#F37021" />;
export const ObligasiAccrual = () => <PlaceholderPage moduleName="Investasi" featureName="Obligasi" stepName="Perhitungan Accrual Bunga & Amortisasi" stepNumber={6} totalSteps={10} steps={STEPS} accentColor="#F37021" />;
export const ObligasiKupon = () => <PlaceholderPage moduleName="Investasi" featureName="Obligasi" stepName="Kupon" stepNumber={7} totalSteps={10} steps={STEPS} accentColor="#F37021" />;
export const ObligasiValuasi = () => <PlaceholderPage moduleName="Investasi" featureName="Obligasi" stepName="Valuasi Mark to Market" stepNumber={8} totalSteps={10} steps={STEPS} accentColor="#F37021" />;
export const ObligasiJatuhTempo = () => <PlaceholderPage moduleName="Investasi" featureName="Obligasi" stepName="Jatuh Tempo" stepNumber={9} totalSteps={10} steps={STEPS} accentColor="#F37021" />;
export const ObligasiLaporan = () => <PlaceholderPage moduleName="Investasi" featureName="Obligasi" stepName="Laporan" stepNumber={10} totalSteps={10} steps={STEPS} accentColor="#F37021" />;
