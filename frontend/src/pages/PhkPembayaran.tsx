import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { motion } from 'framer-motion';
import { DataTable, type ColumnDef } from '../components/DataTable';

interface PembayaranData {
    no_nota_dinas: string;
    tanggal: string;
    total_premi: number;
    id_status_pembayaran?: string;
    file_bukti_bayar?: string;
}

const PhkPembayaran: React.FC = () => {
    const [pembayaran, setPembayaran] = useState<PembayaranData[]>([]);
    const [loading, setLoading] = useState(false);

    // Form state
    const [isFormVisible, setIsFormVisible] = useState(false);
    const [formData, setFormData] = useState({ total_premi: 0 });
    const [submitLoading, setSubmitLoading] = useState(false);

    useEffect(() => {
        fetchPembayaran();
    }, []);

    const fetchPembayaran = async () => {
        setLoading(true);
        try {
            const token = localStorage.getItem('token');
            const res = await axios.get('http://localhost:3000/api/finance/pembayaran', {
                headers: { Authorization: `Bearer ${token}` }
            });

            // Sort by descending date
            const sorted = (res.data || []).sort((a: PembayaranData, b: PembayaranData) =>
                new Date(b.tanggal).getTime() - new Date(a.tanggal).getTime()
            );

            setPembayaran(sorted);
        } catch (error) {
            console.error('Error fetching pembayaran:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleCreate = async (e: React.FormEvent) => {
        e.preventDefault();
        setSubmitLoading(true);
        try {
            const token = localStorage.getItem('token');
            await axios.post('http://localhost:3000/api/finance/pembayaran', {
                tanggal: new Date().toISOString(),
                total_premi: formData.total_premi
            }, {
                headers: { Authorization: `Bearer ${token}` }
            });

            alert('Catatan Pembayaran Premi Berhasil Disimpan!');
            setIsFormVisible(false);
            setFormData({ total_premi: 0 });
            fetchPembayaran();
        } catch (error) {
            console.error('Error creating pembayaran:', error);
            alert('Gagal menyimpan pembayaran.');
        } finally {
            setSubmitLoading(false);
        }
    };

    const columns: ColumnDef<PembayaranData>[] = [
        { header: 'No. Nota Dinas', accessor: 'no_nota_dinas', id: 'no_nota_dinas' },
        {
            header: 'Tanggal Rekam',
            accessor: (row) => new Date(row.tanggal).toLocaleDateString('id-ID', { year: 'numeric', month: 'long', day: 'numeric' }),
            id: 'tanggal'
        },
        {
            header: 'Total Premi (Rp)',
            accessor: (row) => (
                <div className="font-bold text-gray-900 border border-gray-200 bg-gray-50 px-3 py-1 rounded inline-block">
                    Rp {row.total_premi.toLocaleString('id-ID')}
                </div>
            ),
            id: 'total_premi'
        },
        {
            header: 'Sistem Status',
            accessor: (row) => (
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-green-100 text-green-800 border border-green-200">
                    {row.id_status_pembayaran || 'TERCATAT'}
                </span>
            ),
            id: 'status_pembayaran'
        }
    ];

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="p-8 w-full max-w-7xl mx-auto"
        >
            <div className="flex justify-between items-end mb-8">
                <div>
                    <h1 className="text-3xl font-black text-gray-900 tracking-tight">Pembayaran Premi BPJS/BRI Life</h1>
                    <p className="text-gray-500 mt-1">Daftar riwayat nota dinas pembayaran premi (Modul Keuangan).</p>
                </div>

                <button
                    onClick={() => setIsFormVisible(!isFormVisible)}
                    className="bg-bri-blue hover:bg-blue-800 text-white px-5 py-2.5 rounded-xl font-bold transition-all shadow-sm flex items-center gap-2 active:scale-95"
                >
                    {isFormVisible ? <><i className="fas fa-times"></i> Batal</> : <><i className="fas fa-plus"></i> Rekam Pembayaran</>}
                </button>
            </div>

            {isFormVisible && (
                <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    className="bg-white rounded-2xl shadow-sm border border-bri-blue overflow-hidden mb-8"
                >
                    <div className="bg-blue-50 border-b border-blue-100 p-4">
                        <h3 className="font-bold text-blue-900">Formulir Rekam Pembayaran Premi</h3>
                    </div>
                    <form onSubmit={handleCreate} className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6 items-end">
                        <div>
                            <label className="block text-sm font-bold text-gray-700 mb-2">Total Premi Dibayarkan (Rp)</label>
                            <input
                                type="number"
                                required
                                min="0"
                                value={formData.total_premi || ''}
                                onChange={(e) => setFormData({ ...formData, total_premi: Number(e.target.value) })}
                                className="w-full border-2 border-gray-200 rounded-xl p-3 focus:outline-none focus:border-bri-blue focus:ring-1 focus:ring-bri-blue transition-all"
                                placeholder="Cth: 25000000"
                            />
                        </div>
                        <button
                            type="submit"
                            disabled={submitLoading || formData.total_premi <= 0}
                            className="bg-green-600 hover:bg-green-700 disabled:bg-gray-300 text-white px-6 py-3 rounded-xl font-bold transition-all h-12 flex items-center justify-center gap-2"
                        >
                            {submitLoading ? 'Menyimpan...' : 'Simpan Pembayaran'}
                        </button>
                    </form>
                </motion.div>
            )}

            <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden mb-6">
                <DataTable
                    data={pembayaran}
                    columns={columns}
                    loading={loading}
                    exportFileName="Riwayat_Pembayaran_Premi"
                    onView={(row) => alert(`Detail Nota Dinas: ${row.no_nota_dinas}`)}
                />
            </div>

            <div className="bg-blue-50 border border-blue-100 rounded-xl p-4 flex gap-3">
                <div className="text-bri-blue mt-0.5"><i className="fas fa-info-circle"></i></div>
                <div>
                    <h4 className="text-sm font-bold text-blue-900 mb-1">Integrasi Pembayaran</h4>
                    <p className="text-xs text-blue-800">Riwayat pembayaran ini terintegrasi dengan Modul Keuangan (Finance). Semua pembayaran yang dicatat secara otomatis membentuk jurnal akuntansi transaksi pada sistem.</p>
                </div>
            </div>
        </motion.div>
    );
};

export default PhkPembayaran;
