import { useState, useEffect } from 'react';
import axios from 'axios';
import {
    RefreshCw,
    Search, CreditCard,
    Check
} from 'lucide-react';
import { DataTable, type ColumnDef } from '../../components/DataTable';
import { useAuth } from '../../context/AuthContext';

const InvestmentSettlement = () => {
    const { token } = useAuth();
    const [txs, setTxs] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        fetchTransactions();
    }, []);

    const fetchTransactions = async () => {
        setLoading(true);
        try {
            const res = await axios.get('http://localhost:3000/api/investasi/transactions', {
                headers: { Authorization: `Bearer ${token} ` }
            });
            // Show all transactions, focusing on PENDING if we had a more complex status flow
            setTxs(res.data || []);
        } catch (e) { console.error(e); }
        setLoading(false);
    };

    const handleSettle = async (id: number) => {
        if (!confirm('Proses instruksi pembayaran untuk transaksi ini?')) return;
        try {
            await axios.post(`http://localhost:3000/api/investasi/transactions/${id}/settle`, {}, {
                headers: { Authorization: `Bearer ${token}` }
            });
            alert('Settlement berhasil diproses!');
            fetchTransactions();
        } catch (e) { alert('Gagal memproses settlement'); }
    };

    const formatCurrency = (val: number) =>
        new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(val);

    const columns: ColumnDef<any>[] = [
        { header: 'No. Transaksi', accessor: 'transaction_no', id: 'no' },
        {
            header: 'Efek / Instrumen',
            accessor: (row) => (
                <div className="flex flex-col">
                    <span className="font-bold text-bri-blue">{row.kode_efek}</span>
                    <span className="text-xs text-gray-500">{row.nama_emiten}</span>
                </div>
            ),
            id: 'efek'
        },
        { header: 'Tipe', accessor: 'jenis_transaksi', id: 'type' },
        { header: 'Nominal', accessor: (row) => formatCurrency(row.nominal), id: 'nominal' },
        { header: 'Sekuritas', accessor: 'sekuritas', id: 'sekuritas' },
        {
            header: 'Status',
            accessor: (row) => (
                <span className={`px-2.5 py-1 rounded-full text-[10px] font-black border ${row.status === 'SETTLED' ? 'bg-green-100 text-green-700 border-green-200' : 'bg-amber-100 text-amber-700 border-amber-200'
                    }`}>
                    {row.status}
                </span>
            ),
            id: 'status'
        },
        {
            header: 'Aksi',
            accessor: (row) => (
                row.status !== 'SETTLED' ? (
                    <button
                        onClick={() => handleSettle(row.id)}
                        className="flex items-center gap-2 bg-bri-blue text-white px-3 py-1.5 rounded-lg text-xs font-bold hover:bg-blue-800 transition-colors"
                    >
                        Pelunasan <Check size={14} />
                    </button>
                ) : <span className="text-gray-400 text-xs font-bold">Terbayar</span>
            ),
            id: 'actions'
        }
    ];

    return (
        <div className="p-8 bg-gray-50/50 min-h-screen">
            <header className="mb-10">
                <div className="flex items-center gap-3 mb-2">
                    <div className="p-2.5 bg-green-500/10 text-green-600 rounded-xl">
                        <RefreshCw size={24} />
                    </div>
                    <h1 className="text-4xl font-black text-gray-900 tracking-tight">Settlement Investasi</h1>
                </div>
                <p className="text-gray-500 font-medium">Penyelesaian tagihan broker dan instruksi pembayaran (Money Out).</p>
            </header>

            <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="p-8 border-b border-gray-50 flex justify-between items-center bg-gray-50/20">
                    <h3 className="font-black text-gray-900 text-lg">Daftar Tagihan Menunggu</h3>
                    <div className="flex gap-2">
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                            <input type="text" placeholder="Cari transaksi..." className="pl-10 pr-4 py-2 bg-white border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-bri-blue outline-none" />
                        </div>
                    </div>
                </div>
                <DataTable data={txs} columns={columns} loading={loading} />
            </div>

            <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-blue-50 border border-blue-100 p-6 rounded-2xl flex items-center gap-4">
                    <div className="w-12 h-12 bg-blue-500 text-white rounded-xl flex items-center justify-center shadow-lg">
                        <CreditCard size={20} />
                    </div>
                    <div>
                        <div className="text-xs font-bold text-blue-600 uppercase tracking-widest">Total Tagihan</div>
                        <div className="text-2xl font-black text-blue-900">
                            {formatCurrency(txs.filter(t => t.status !== 'SETTLED').reduce((acc, curr) => acc + curr.nominal, 0))}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default InvestmentSettlement;
