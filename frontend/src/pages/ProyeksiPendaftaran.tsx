import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { motion } from 'framer-motion';
import { DataTable, type ColumnDef } from '../components/DataTable';

interface PesertaData {
    id_peserta: string;
    nama_peserta: string;
    nik_bri: string;
    tgl_phk: string;
    kelompok?: { nama: string };
    kelas?: { nama: string };
    status_bpjs?: { nama: string };
    status_brilife?: { nama: string };
}

const ProyeksiPendaftaran: React.FC = () => {
    const [peserta, setPeserta] = useState<PesertaData[]>([]);
    const [loading, setLoading] = useState(false);
    const [filterDate, setFilterDate] = useState('');
    const apiUrl = import.meta.env.VITE_API_URL;

    const fetchProyeksi = async (date: string) => {
        setLoading(true);
        try {
            const token = localStorage.getItem('token');
            const url = date
                ? `http://localhost:3000/api/proyeksi?tanggal=${date}`
                : `${apiUrl}/proyeksi`;

            const res = await axios.get(url, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setPeserta(res.data);
        } catch (error) {
            console.error('Error fetching proyeksi:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchProyeksi('');
    }, []);

    const handleFilter = (e: React.FormEvent) => {
        e.preventDefault();
        fetchProyeksi(filterDate);
    };

    const columns: ColumnDef<PesertaData>[] = [
        { header: 'ID Peserta', accessor: 'id_peserta', id: 'id_peserta' },
        {
            header: 'Nama / NIK',
            accessor: (row) => (
                <div>
                    <div className="font-bold text-gray-900">{row.nama_peserta}</div>
                    <div className="text-xs text-gray-500">{row.nik_bri}</div>
                </div>
            ),
            id: 'nama_nik'
        },
        {
            header: 'Tgl PHK',
            accessor: (row) => row.tgl_phk ? new Date(row.tgl_phk).toLocaleDateString('id-ID', { year: 'numeric', month: 'short', day: 'numeric' }) : '-',
            id: 'tgl_phk'
        },
        {
            header: 'Kelompok',
            accessor: (row) => (
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                    {row.kelompok?.nama || '-'}
                </span>
            ),
            id: 'kelompok'
        },
        {
            header: 'Kelas',
            accessor: (row) => (
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-50 text-blue-700 border border-blue-100">
                    {row.kelas?.nama || '-'}
                </span>
            ),
            id: 'kelas'
        }
    ];

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="p-8 w-full max-w-7xl mx-auto"
        >
            <div className="mb-8">
                <h1 className="text-3xl font-black text-gray-900 tracking-tight">Proyeksi Pendaftaran</h1>
                <p className="text-gray-500 mt-1">Daftar proyeksi kepesertaan berdasarkan tanggal mutasi / PHK.</p>
            </div>

            <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden mb-8 p-6">
                <form onSubmit={handleFilter} className="flex gap-4 items-end">
                    <div className="flex-1 max-w-xs">
                        <label className="block text-sm font-bold text-gray-700 mb-2">Pilih Tanggal Proyeksi PHK</label>
                        <input
                            type="date"
                            value={filterDate}
                            onChange={(e) => setFilterDate(e.target.value)}
                            className="w-full border-2 border-gray-200 rounded-xl p-3 focus:outline-none focus:border-bri-blue focus:ring-1 focus:ring-bri-blue transition-all"
                        />
                    </div>
                    <button
                        type="submit"
                        className="bg-bri-blue hover:bg-blue-800 text-white px-6 py-3 rounded-xl font-bold transition-all active:scale-95"
                    >
                        Tampilkan List
                    </button>
                    <button
                        type="button"
                        onClick={() => { setFilterDate(''); fetchProyeksi(''); }}
                        className="bg-gray-100 hover:bg-gray-200 text-gray-700 px-6 py-3 rounded-xl font-bold transition-all active:scale-95"
                    >
                        Reset
                    </button>
                </form>
            </div>

            <DataTable
                data={peserta}
                columns={columns}
                loading={loading}
                exportFileName={`Proyeksi_Pendaftaran_${filterDate || 'All'} `}
                onEdit={(row) => alert(`Proses Data Mutasi untuk: ${row.nama_peserta} `)}
            />
        </motion.div>
    );
};

export default ProyeksiPendaftaran;
