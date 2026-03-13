import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../../context/AuthContext';
import { DataTable } from '../../components/DataTable';
import type { ColumnDef } from '../../components/DataTable';
import { UserPlus, Save, CheckCircle2 } from 'lucide-react';

const apiUrl = import.meta.env.VITE_API_URL;
const API = `${apiUrl}/kepesertaan/iuran`;

const MONTHS = [
    "Januari", "Februari", "Maret", "April", "Mei", "Juni",
    "Juli", "Agustus", "September", "Oktober", "November", "Desember"
];

interface Discrepancy {
    id: number;
    bulan: number;
    tahun: number;
    nik_bri: string;
    pernr: string;
    nama_peserta: string;
    jenis_selisih: string;
    nominal_tht: number;
    nominal_prospens: number;
}

const IuranNewMember: React.FC = () => {
    const { token } = useAuth();
    const [data, setData] = useState<Discrepancy[]>([]);
    const [loading, setLoading] = useState(true);
    const [bulan, setBulan] = useState(new Date().getMonth() + 1);
    const [tahun, setTahun] = useState(new Date().getFullYear());
    const [processing, setProcessing] = useState(false);

    const headers = { Authorization: `Bearer ${ token }` };

    const loadData = async () => {
        setLoading(true);
        try {
            const res = await axios.get(`${API}/discrepancy/${bulan}/${tahun}`, { headers });
            const allDiscrepancies: Discrepancy[] = res.data.discrepancies || [];
            setData(allDiscrepancies.filter(d => d.jenis_selisih === 'NEW_MEMBER'));
        } catch (error) {
            console.error('Failed fetching data', error);
        } finally {
            setLoading(false);
        }
    };

useEffect(() => {
    if (token) loadData();
}, [token, bulan, tahun]);

const handleApproveAll = async () => {
    if (data.length === 0) return;
    if (!confirm(`Apakah Anda yakin ingin mendaftarkan ${data.length} anggota baru ke database peserta?`)) return;

    setProcessing(true);
    try {
        await axios.post(`${API}/new-member/approve`, { ids: data.map(d => d.id) }, { headers });
        alert('✅ Berhasil, seluruh anggota baru telah didaftarkan dan diintegrasikan ke master peserta.');
        loadData();
    } catch (error: any) {
        alert(`❌ ${error.response?.data?.error || 'Gagal mendaftarkan anggota'}`);
    } finally {
        setProcessing(false);
    }
};

const columns: ColumnDef<Discrepancy>[] = [
    { header: 'Periode', accessor: (row) => `${MONTHS[row.bulan - 1]} ${row.tahun}`, id: 'periode' },
    { header: 'NIK BRI', accessor: 'nik_bri', id: 'nik' },
    { header: 'PERNR', accessor: 'pernr', id: 'pernr' },
    { header: 'Nama Peserta', accessor: (row) => row.nama_peserta || '-', id: 'nama' },
    {
        header: 'Aksi', accessor: (_) => (
            <button className="px-3 py-1 bg-green-100 hover:bg-green-200 text-green-700 text-xs font-bold rounded-lg flex items-center gap-1">
                <CheckCircle2 size={12} /> Daftarkan
            </button>
        ), id: 'aksi'
    }
];

return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
                <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
                    <UserPlus className="text-blue-600" /> Proses Anggota Baru
                </h2>
                <p className="text-gray-500 text-sm mt-1">Data kepesertaan yang ada di file Iuran namun belum terdaftar di database eksisting.</p>
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
                    <button onClick={handleApproveAll} disabled={processing || data.length === 0} className={`px-5 py-2.5 rounded-lg text-sm font-bold flex items-center gap-2 shadow-sm ${data.length > 0 ? 'bg-blue-600 text-white hover:bg-blue-700 cursor-pointer' : 'bg-gray-100 text-gray-400 cursor-not-allowed'}`}>
                        {processing ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div> : <Save size={16} />}
                        {processing ? 'Mendaftarkan...' : 'Daftarkan Semua (Approve)'}
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
                            exportFileName={`Peserta_Baru_${MONTHS[bulan - 1]}_${tahun}`}
                        />
                    </div>
                )}
            </div>
        </div>
    </div>
);
};

export default IuranNewMember;
