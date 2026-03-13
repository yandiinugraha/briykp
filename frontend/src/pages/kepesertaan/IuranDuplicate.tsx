import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../../context/AuthContext';
import { DataTable } from '../../components/DataTable';
import type { ColumnDef } from '../../components/DataTable';
import { RefreshCcw, Eye, Settings2 } from 'lucide-react';

const API = 'http://localhost:3000/api/kepesertaan/iuran';

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

const IuranDuplicate: React.FC = () => {
    const { token } = useAuth();
    const [data, setData] = useState<Discrepancy[]>([]);
    const [loading, setLoading] = useState(true);
    const [bulan, setBulan] = useState(new Date().getMonth() + 1);
    const [tahun, setTahun] = useState(new Date().getFullYear());

    const headers = { Authorization: `Bearer ${token}` };

    const loadData = async () => {
        setLoading(true);
        try {
            const res = await axios.get(`${API}/discrepancy/${bulan}/${tahun}`, { headers });
            const allDiscrepancies: Discrepancy[] = res.data.discrepancies || [];
            setData(allDiscrepancies.filter(d =>
                d.jenis_selisih === 'DUPLICATE_IURAN' || d.jenis_selisih === 'THT_PROSPENS_DIFF'
            ));
        } catch (error) {
            console.error('Failed fetching data', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (token) loadData();
    }, [token, bulan, tahun]);

    const columns: ColumnDef<Discrepancy>[] = [
        { header: 'Periode', accessor: (row) => `${MONTHS[row.bulan - 1]} ${row.tahun}`, id: 'periode' },
        { header: 'NIK BRI', accessor: 'nik_bri', id: 'nik' },
        { header: 'Nama Peserta', accessor: (row) => row.nama_peserta || '-', id: 'nama' },
        {
            header: 'Jenis Isu', accessor: (row) => (
                <span className="bg-amber-100 text-amber-700 px-2 py-0.5 rounded text-xs font-bold">{row.jenis_selisih.replace(/_/g, ' ')}</span>
            ), id: 'isu'
        },
        {
            header: 'Detail THT vs Prospens', accessor: (row) => (
                <div className="text-xs">
                    <div>THT: <span className="font-semibold">Rp {row.nominal_tht?.toLocaleString() || 0}</span></div>
                    <div>Prospens: <span className="font-semibold">Rp {row.nominal_prospens?.toLocaleString() || 0}</span></div>
                </div>
            ), id: 'detail'
        },
        {
            header: 'Aksi', accessor: (_) => (
                <div className="flex gap-2">
                    <button className="px-2 py-1 bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-bold rounded flex items-center gap-1">
                        <Eye size={12} /> Detail
                    </button>
                    <button className="px-2 py-1 bg-blue-100 hover:bg-blue-200 text-blue-700 text-xs font-bold rounded flex items-center gap-1">
                        <Settings2 size={12} /> Update Data
                    </button>
                </div>
            ), id: 'aksi'
        }
    ];

    return (
        <div className="p-6 max-w-7xl mx-auto space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
                        <RefreshCcw className="text-amber-500" /> Tinjau Data Ganda / Pembaruan Identitas
                    </h2>
                    <p className="text-gray-500 text-sm mt-1">Daftar peserta yang memerlukan update data (peserta sudah ada dan iuran masuk) atau selisih data.</p>
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
                        <button onClick={loadData} className="px-5 py-2.5 rounded-lg text-sm font-bold flex items-center gap-2 shadow-sm bg-gray-100 hover:bg-gray-200 text-gray-700">
                            <RefreshCcw size={16} /> Segarkan Data
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
                                exportFileName={`Update_Data_${MONTHS[bulan - 1]}_${tahun}`}
                            />
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default IuranDuplicate;
