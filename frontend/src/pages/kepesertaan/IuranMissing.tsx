import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../../context/AuthContext';
import { DataTable } from '../../components/DataTable';
import type { ColumnDef } from '../../components/DataTable';
import { UserMinus, AlertTriangle } from 'lucide-react';

const apiUrl = import.meta.env.VITE_API_URL;
const API = `${apiUrl}/kepesertaan/iuran`;

const MONTHS = [
    "Januari", "Februari", "Maret", "April", "Mei", "Juni",
    "Juli", "Agustus", "September", "Oktober", "November", "Desember"
];

interface MissingMember {
    id: number;
    bulan: number;
    tahun: number;
    nik_bri: string;
    nama_peserta: string;
    keterangan: string;
    jenis_selisih?: string;
}

const IuranMissing: React.FC = () => {
    const { token } = useAuth();
    const [data, setData] = useState<MissingMember[]>([]);
    const [loading, setLoading] = useState(true);
    const [bulan, setBulan] = useState(new Date().getMonth() + 1);
    const [tahun, setTahun] = useState(new Date().getFullYear());
    const [processing, setProcessing] = useState(false);

    const headers = { Authorization: `Bearer ${ token }` };

    const loadData = async () => {
        setLoading(true);
        try {
            const res = await axios.get(`${API}/discrepancy/${bulan}/${tahun}`, { headers });
            const allDiscrepancies = res.data.discrepancies || [];
            setData(allDiscrepancies.filter((d: any) => d.jenis_selisih === 'REMOVED_MEMBER'));
        } catch (error) {
            console.error('Failed fetching data', error);
        } finally {
            setLoading(false);
        }
    };

useEffect(() => {
    if (token) loadData();
}, [token, bulan, tahun]);

const handleComparePHK = async () => {
    if (data.length === 0) return;
    setProcessing(true);
    try {
        // Placeholder logic to cross-check with PHK table
        alert('✅ Sistem sedang membandingkan data dengan tabel PHK. (Placeholder)');
    } catch (error: any) {
        alert(`❌ Gagal membandingkan PHK`);
    } finally {
        setProcessing(false);
    }
};

const columns: ColumnDef<MissingMember>[] = [
    { header: 'Periode', accessor: (row) => `${MONTHS[row.bulan - 1]} ${row.tahun}`, id: 'periode' },
    { header: 'NIK BRI', accessor: 'nik_bri', id: 'nik' },
    { header: 'Nama Peserta', accessor: (row) => row.nama_peserta || '-', id: 'nama' },
    { header: 'Keterangan Sistem', accessor: 'keterangan', id: 'keterangan' },
    {
        header: 'Status PHK', accessor: (_) => (
            <span className="text-gray-400 italic text-xs">Menunggu Komparasi...</span>
        ), id: 'status_phk'
    },
];

return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
                <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
                    <UserMinus className="text-red-500" /> Proses Anggota Non-Iuran (PHK)
                </h2>
                <p className="text-gray-500 text-sm mt-1">Daftar peserta yang masih ada di Database namun TIDAK mempunyai iuran bulan ini.</p>
            </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 space-y-4">
            <div className="flex flex-wrap items-end gap-4">
                <div className="w-48">
                    <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Periode Bulan</label>
                    <select className="w-full border border-gray-300 rounded-lg text-sm p-2.5 focus:ring-blue-500 focus:border-blue-500" value={bulan} onChange={e => setBulan(Number(e.target.value))}>
                        {MONTHS.map((m, i) => <option key={i} value={i + 1}>{m}</option>)}
                    </select>
                </div>
                <div className="w-32">
                    <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Tahun</label>
                    <input type="number" className="w-full border border-gray-300 rounded-lg text-sm p-2.5 focus:ring-blue-500 focus:border-blue-500" value={tahun} onChange={e => setTahun(Number(e.target.value))} />
                </div>
                <div className="ml-auto">
                    <button onClick={handleComparePHK} disabled={processing || data.length === 0} className={`px-5 py-2.5 rounded-lg text-sm font-bold flex items-center gap-2 shadow-sm ${data.length > 0 ? 'bg-amber-600 text-white hover:bg-amber-700 cursor-pointer' : 'bg-gray-100 text-gray-400 cursor-not-allowed'}`}>
                        {processing ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div> : <AlertTriangle size={16} />}
                        {processing ? 'Memproses...' : 'Bandingkan dengan Data PHK'}
                    </button>
                </div>
            </div>

            <div className="border border-gray-100 rounded-lg overflow-hidden">
                {loading ? (
                    <div className="p-10 text-center text-gray-400">Memuat data...</div>
                ) : (
                    <div className="p-4 bg-gray-50">
                        <DataTable
                            data={data}
                            columns={columns}
                            searchable={true}
                            exportable={true}
                            exportFileName={`Non_Iuran_PHK_${MONTHS[bulan - 1]}_${tahun}`}
                        />
                    </div>
                )}
            </div>
        </div>
    </div>
);
};

export default IuranMissing;
