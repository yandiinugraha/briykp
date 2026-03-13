import { useState, useEffect } from 'react';
import axios from 'axios';
import {
    Calculator, Receipt,
    ArrowUpRight
} from 'lucide-react';
import { DataTable, type ColumnDef } from '../../components/DataTable';
import { useAuth } from '../../context/AuthContext';

const InvestmentAccounting = () => {
    const { token } = useAuth();
    const [income, setIncome] = useState<any[]>([]);
    const [summary, setSummary] = useState<any>({
        realized_pnl: 0,
        unrealized_pnl: 0,
        total_income: 0,
        total_tax: 0,
        net_income: 0
    });
    const [portfolio, setPortfolio] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);
    const [showModal, setShowModal] = useState(false);
    const [form, setForm] = useState({
        jenis_investasi: 'SAHAM',
        nama_emiten: '',
        keterangan: '',
        nominal_gross: 0,
        pajak_pph: 0,
        tanggal_cair: new Date().toISOString().split('T')[0]
    });
    const apiUrl = import.meta.env.VITE_API_URL;

    useEffect(() => {
        fetchAllData();
    }, []);

    const fetchAllData = async () => {
        setLoading(true);
        try {
            const [incRes, sumRes, portRes] = await Promise.all([
                axios.get(`${apiUrl}/investasi/income`, { headers: { Authorization: `Bearer ${token}` } }),
                axios.get(`${apiUrl}/investasi/accounting-summary`, { headers: { Authorization: `Bearer ${token}` } }),
                axios.get(`${apiUrl}/investasi/saham/portfolio`, { headers: { Authorization: `Bearer ${token}` } })
            ]);
            setIncome(incRes.data || []);
            setSummary(sumRes.data || {});
            setPortfolio(portRes.data || []);
        } catch (e) { console.error(e); }
        setLoading(false);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            await axios.post(`${apiUrl}/investasi/income`, form, {
                headers: { Authorization: `Bearer ${token} ` }
            });
            alert('Pendapatan investasi berhasil dicatat!');
            setShowModal(false);
            fetchAllData();
        } catch (e) { alert('Gagal mencatat pendapatan'); }
    };

    const formatCurrency = (val: number) =>
        new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(val);

    const formatShortAmount = (amount: number) => {
        const absAmount = Math.abs(amount);
        const sign = amount < 0 ? '-' : '';
        if (absAmount >= 1e12) return sign + (absAmount / 1e12).toFixed(1) + 'T';
        if (absAmount >= 1e9) return sign + (absAmount / 1e9).toFixed(1) + 'M';
        if (absAmount >= 1e6) return sign + (absAmount / 1e6).toFixed(1) + 'jt';
        return sign + absAmount.toLocaleString('id-ID');
    };

    const columns: ColumnDef<any>[] = [
        { header: 'Tgl Cair', accessor: (row) => new Date(row.tanggal_cair).toLocaleDateString('id-ID'), id: 'tgl' },
        { header: 'Instrumen', accessor: 'nama_emiten', id: 'emiten' },
        { header: 'Keterangan', accessor: 'keterangan', id: 'ket' },
        { header: 'Gross', accessor: (row) => formatCurrency(row.nominal_gross), id: 'gross' },
        {
            header: 'Pajak (PPh)',
            accessor: (row) => <span className="text-red-500">{formatCurrency(row.pajak_pph)}</span>,
            id: 'tax'
        },
        {
            header: 'Net Terima',
            accessor: (row) => <span className="font-bold text-green-600">{formatCurrency(row.nominal_net)}</span>,
            id: 'net'
        },
        {
            header: 'Status',
            accessor: () => <span className="px-2 py-0.5 bg-blue-50 text-blue-600 text-[10px] font-black rounded-full border border-blue-100 uppercase tracking-widest">TERCATAT</span>,
            id: 'status'
        }
    ];

    return (
        <div className="p-8 bg-gray-50/50 min-h-screen">
            <header className="mb-10 flex justify-between items-end">
                <div>
                    <div className="flex items-center gap-3 mb-2">
                        <div className="p-2.5 bg-cyan-500/10 text-cyan-600 rounded-xl">
                            <Calculator size={24} />
                        </div>
                        <h1 className="text-4xl font-black text-gray-900 tracking-tight">Akuntansi & Pajak Investasi</h1>
                    </div>
                    <p className="text-gray-500 font-medium">Pecatatan pendapatan (Dividen/Kupon) dan perhitungan PPh Final otomatis.</p>
                </div>
                <button
                    onClick={() => setShowModal(true)}
                    className="bg-bri-blue text-white px-6 py-3.5 rounded-2xl font-black text-sm shadow-xl shadow-bri-blue/20 hover:scale-105 transition-all flex items-center gap-2"
                >
                    <Receipt size={18} /> Catat Pendapatan
                </button>
            </header>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-10">
                <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm">
                    <h3 className="text-gray-400 font-bold text-[10px] uppercase tracking-widest mb-2">Realized Gain/Loss</h3>
                    <div className={`text-2xl font-black ${summary.realized_pnl >= 0 ? 'text-green-600' : 'text-rose-600'}`}>
                        Rp {formatShortAmount(summary.realized_pnl)}
                    </div>
                </div>
                <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm">
                    <h3 className="text-gray-400 font-bold text-[10px] uppercase tracking-widest mb-2">Unrealized (MTM)</h3>
                    <div className={`text-2xl font-black ${summary.unrealized_pnl >= 0 ? 'text-indigo-600' : 'text-rose-600'}`}>
                        Rp {formatShortAmount(summary.unrealized_pnl)}
                    </div>
                </div>
                <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm">
                    <h3 className="text-gray-400 font-bold text-[10px] uppercase tracking-widest mb-2">Total Dividen (Net)</h3>
                    <div className="text-2xl font-black text-gray-900">
                        Rp {formatShortAmount(summary.net_income)}
                    </div>
                </div>
                <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm">
                    <h3 className="text-gray-400 font-bold text-[10px] uppercase tracking-widest mb-2">Total Tax (PPh)</h3>
                    <div className="text-2xl font-black text-rose-500">
                        Rp {formatShortAmount(summary.total_tax)}
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-10">
                <div className="lg:col-span-2 bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
                    <div className="p-8 border-b border-gray-50 flex justify-between items-center">
                        <h3 className="font-black text-gray-900 flex items-center gap-2">
                            <Receipt size={20} className="text-cyan-500" /> History Pendapatan (Dividen/Kupon)
                        </h3>
                    </div>
                    <DataTable data={income} columns={columns} loading={loading} />
                </div>
                <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
                    <div className="p-8 border-b border-gray-50">
                        <h3 className="font-black text-gray-900 flex items-center gap-2">
                            <ArrowUpRight size={20} className="text-green-500" /> Valuation Saham
                        </h3>
                    </div>
                    <div className="p-4">
                        <table className="w-full text-left text-xs">
                            <thead>
                                <tr className="text-gray-400 font-black uppercase tracking-tighter border-b border-gray-50">
                                    <th className="pb-4">Efek</th>
                                    <th className="pb-4 text-right">Cost (HPP)</th>
                                    <th className="pb-4 text-right">Market</th>
                                    <th className="pb-4 text-right">PnL</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-50">
                                {portfolio.map((p, idx) => (
                                    <tr key={idx} className="group hover:bg-gray-50/50 transition-colors">
                                        <td className="py-4 font-bold text-gray-900">{p.kode_saham}</td>
                                        <td className="py-4 text-right font-medium text-gray-500">Rp {formatShortAmount(p.total_lembar * p.hpp)}</td>
                                        <td className="py-4 text-right font-bold text-gray-900">Rp {formatShortAmount(p.market_value)}</td>
                                        <td className={`py-4 text-right font-black ${p.floating_profit >= 0 ? 'text-green-600' : 'text-rose-600'}`}>
                                            {p.floating_profit >= 0 ? '+' : ''}{((p.floating_profit / (p.market_value - p.floating_profit)) * 100).toFixed(1)}%
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>

            {showModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
                    <div className="bg-white rounded-3xl p-8 w-full max-w-lg shadow-2xl">
                        <h2 className="text-2xl font-black mb-6">Input Pendapatan Investasi</h2>
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div>
                                <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-2">Jenis Aset</label>
                                <select
                                    className="w-full p-4 bg-gray-50 border border-gray-100 rounded-2xl font-bold focus:ring-2 focus:ring-bri-blue outline-none"
                                    value={form.jenis_investasi}
                                    onChange={(e) => setForm({ ...form, jenis_investasi: e.target.value })}
                                >
                                    <option value="SAHAM">Saham</option>
                                    <option value="OBLIGASI">Obligasi</option>
                                    <option value="DEPOSITO">Deposito</option>
                                    <option value="REKSADANA">Reksadana</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-2">Nama Emiten / Bank</label>
                                <input
                                    type="text"
                                    className="w-full p-4 bg-gray-50 border border-gray-100 rounded-2xl font-bold focus:ring-2 focus:ring-bri-blue outline-none"
                                    placeholder="Contoh: BANK BRI"
                                    value={form.nama_emiten}
                                    onChange={(e) => setForm({ ...form, nama_emiten: e.target.value })}
                                    required
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-2">Nominal Gross</label>
                                    <input
                                        type="number"
                                        className="w-full p-4 bg-gray-50 border border-gray-100 rounded-2xl font-bold focus:ring-2 focus:ring-bri-blue outline-none"
                                        value={form.nominal_gross}
                                        onChange={(e) => setForm({ ...form, nominal_gross: Number(e.target.value) })}
                                        required
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-2">PPh Final</label>
                                    <input
                                        type="number"
                                        className="w-full p-4 bg-gray-50 border border-gray-100 rounded-2xl font-bold focus:ring-2 focus:ring-bri-blue outline-none"
                                        value={form.pajak_pph}
                                        onChange={(e) => setForm({ ...form, pajak_pph: Number(e.target.value) })}
                                        required
                                    />
                                </div>
                            </div>
                            <div>
                                <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-2">Keterangan</label>
                                <input
                                    type="text"
                                    className="w-full p-4 bg-gray-50 border border-gray-100 rounded-2xl font-bold focus:ring-2 focus:ring-bri-blue outline-none"
                                    placeholder="Contoh: Dividen Final 2023"
                                    value={form.keterangan}
                                    onChange={(e) => setForm({ ...form, keterangan: e.target.value })}
                                    required
                                />
                            </div>
                            <div className="flex gap-3 pt-6">
                                <button type="button" onClick={() => setShowModal(false)} className="flex-1 py-4 font-black text-gray-400 uppercase tracking-widest text-xs">Batal</button>
                                <button type="submit" className="flex-2 bg-bri-blue text-white py-4 px-8 rounded-2xl font-black uppercase tracking-widest text-xs shadow-xl shadow-bri-blue/20">Simpan Pendapatan</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default InvestmentAccounting;
