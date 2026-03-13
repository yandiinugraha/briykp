import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Activity, TrendingUp, PieChart as PieChartIcon,
    ArrowUpRight, ArrowDownRight, Plus,
    Briefcase, FileText, BarChart3, Upload,
    LayoutDashboard, Database, RefreshCw, Coins
} from 'lucide-react';
import { DataTable } from '../../components/DataTable';
import { useAuth } from '../../context/AuthContext';
import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
    PieChart, Pie, Cell
} from 'recharts';

// --- STYLES & CONSTANTS ---
const COLORS = ['#3b82f6', '#f97316', '#10b981', '#8b5cf6', '#ec4899', '#f59e0b'];

const formatShortAmount = (amount: number) => {
    const absAmount = Math.abs(amount);
    const sign = amount < 0 ? '-' : '';
    if (absAmount >= 1e12) return sign + (absAmount / 1e12).toFixed(1) + 'T';
    if (absAmount >= 1e9) return sign + (absAmount / 1e9).toFixed(1) + 'M';
    if (absAmount >= 1e6) return sign + (absAmount / 1e6).toFixed(1) + 'jt';
    return sign + absAmount.toLocaleString('id-ID');
};

interface StatCardProps {
    title: string;
    value: string;
    icon: React.ReactNode;
    trend?: string;
    trendUp?: boolean;
    color: 'blue' | 'orange' | 'green' | 'indigo' | 'rose' | 'teal';
}

const StatCard: React.FC<StatCardProps> = ({ title, value, icon, trend, trendUp, color }) => {
    const colorMap = {
        blue: 'bg-blue-50 text-blue-600',
        orange: 'bg-orange-50 text-orange-600',
        green: 'bg-green-50 text-green-600',
        indigo: 'bg-indigo-50 text-indigo-600',
        rose: 'bg-rose-50 text-rose-600',
        teal: 'bg-teal-50 text-teal-600',
    };

    return (
        <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow group">
            <div className="flex justify-between items-start mb-4">
                <div className={`p-3 rounded-xl transition-transform group-hover:scale-110 ${colorMap[color]}`}>
                    {icon}
                </div>
                {trend && (
                    <div className={`flex items-center gap-1 text-[10px] font-bold px-2 py-1 rounded-full ${trendUp ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                        {trendUp ? <ArrowUpRight size={10} /> : <ArrowDownRight size={10} />}
                        {trend}
                    </div>
                )}
            </div>
            <h3 className="text-gray-500 text-xs font-bold uppercase tracking-wider mb-1">{title}</h3>
            <p className="text-2xl font-black text-gray-900">{value}</p>
        </div>
    );
};

// --- MAIN PAGE COMPONENT ---

interface SahamProps {
    defaultTab?: 'dashboard' | 'master' | 'proposal' | 'transaksi' | 'reports' | 'corporate-action';
}

const Saham: React.FC<SahamProps> = ({ defaultTab = 'dashboard' }) => {
    const { token, user } = useAuth();
    const role = user?.role;
    const [activeTab, setActiveTab] = useState<'dashboard' | 'master' | 'proposal' | 'transaksi' | 'reports' | 'corporate-action'>(defaultTab);
    const [loading, setLoading] = useState(false);

    // UI States

    const [showFormModal, setShowFormModal] = useState(false);
    const [formType, setFormType] = useState<'master' | 'proposal' | 'transaction' | 'action'>('master');
    const [formData, setFormData] = useState<any>({});

    // Data States
    const [stocks, setStocks] = useState<any[]>([]);
    const [proposals, setProposals] = useState<any[]>([]);
    const [transactions, setTransactions] = useState<any[]>([]);
    const [portfolio, setPortfolio] = useState<any[]>([]);
    const [reportData, setReportData] = useState<any[]>([]);
    const [reportPeriod, setReportPeriod] = useState<'daily' | 'monthly' | 'yearly'>('daily');
    const apiUrl = import.meta.env.VITE_API_URL;

    useEffect(() => {
        fetchAllData();
    }, []);

    useEffect(() => {
        if (activeTab === 'reports') fetchReports();
    }, [activeTab, reportPeriod]);

    const fetchAllData = async () => {
        setLoading(true);
        try {
            const [stocksRes, proposalsRes, txRes, portfolioRes] = await Promise.all([
                axios.get(`${apiUrl}/investasi/saham/master`, { headers: { Authorization: `Bearer ${token}` } }),
                axios.get(`${apiUrl}/investasi/proposals`, { headers: { Authorization: `Bearer ${token}` } }),
                axios.get(`${apiUrl}/investasi/transactions`, { headers: { Authorization: `Bearer ${token}` } }),
                axios.get(`${apiUrl}/investasi/saham/portfolio`, { headers: { Authorization: `Bearer ${token}` } })
            ]);

            setStocks(stocksRes.data || []);
            setProposals(proposalsRes.data || []);
            setTransactions(txRes.data || []);
            setPortfolio(portfolioRes.data || []);
        } catch (error) {
            console.error('Error fetching data:', error);
        } finally {
            setLoading(false);
        }
    };

    const fetchReports = async () => {
        try {
            const res = await axios.get(`${apiUrl}/investasi/saham/reports?period=${reportPeriod}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setReportData(res.data || []);
        } catch (e) {
            console.error(e);
        }
    };


    const handleFormSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        try {
            let endpoint = '';
            let method = 'post';

            switch (formType) {
                case 'master': endpoint = `${apiUrl}/investasi/saham/master`; break;
                case 'proposal': endpoint = `${apiUrl}/investasi/saham/proposals`; break;
                case 'transaction': endpoint = `${apiUrl}/investasi/saham/transactions`; break;
                case 'action': endpoint = `${apiUrl}/investasi/saham/action`; break;
            }

            if (formData.id && formType === 'master') {
                endpoint += `/${formData.id}`;
                method = 'put';
            }

            await axios({
                method,
                url: endpoint,
                data: formData,
                headers: { Authorization: `Bearer ${token}` }
            });

            alert('Data berhasil disimpan');
            setShowFormModal(false);
            setFormData({});
            fetchAllData();
        } catch (error) {
            console.error('Form error:', error);
            alert('Terjadi kesalahan saat menyimpan data');
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (type: string, id: number) => {
        if (!window.confirm('Hapus data ini?')) return;
        try {
            let endpoint = '';
            if (type === 'master') endpoint = `${apiUrl}/investasi/saham/master/${id}`;
            if (type === 'proposal') endpoint = `${apiUrl}/investasi/proposals/${id}`;

            await axios.delete(endpoint, { headers: { Authorization: `Bearer ${token}` } });
            alert('Berhasil dihapus');
            fetchAllData();
        } catch (e) {
            alert('Gagal menghapus');
        }
    };

    const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (!e.target.files?.[0]) return;
        setLoading(true);
        const file = e.target.files[0];
        const formDataUpload = new FormData();
        formDataUpload.append('file', file);

        try {
            await axios.post(`${apiUrl}/investasi/proposals/upload`, formDataUpload, {
                headers: {
                    Authorization: `Bearer ${token}`,
                    'Content-Type': 'multipart/form-data'
                }
            });
            alert('Proposal berhasil diupload');
            fetchAllData();
        } catch (error) {
            console.error('Upload error:', error);
            alert('Gagal mengupload proposal');
        } finally {
            setLoading(false);
        }
    };

    const handleApprove = async (id: number, action: string) => {
        try {
            await axios.post(`${apiUrl}/investasi/proposals/${id}/approve?action=${action}`, {}, {
                headers: { Authorization: `Bearer ${token}` }
            });
            alert(`Proposal ${action === 'APPROVE' ? 'disetujui' : 'ditolak'}`);
            fetchAllData();
        } catch (e) {
            alert('Gagal memproses approval');
        }
    };

    const openForm = (type: any, data: any = {}) => {
        setFormType(type);
        setFormData({
            ...data,
            tgl_transaksi: data.tgl_transaksi || new Date().toISOString()
        });
        setShowFormModal(true);
    };

    // --- RENDER HELPERS ---

    const renderDashboard = () => {
        const totalMarketValue = portfolio.reduce((acc, curr) => acc + curr.market_value, 0);
        const totalProfit = portfolio.reduce((acc, curr) => acc + curr.floating_profit, 0);
        const avgROI = portfolio.length > 0 ? (totalProfit / (totalMarketValue - totalProfit)) * 100 : 0;

        const pieData = portfolio.map(p => ({
            name: p.kode_saham,
            value: p.market_value
        }));

        const barData = portfolio.map(p => ({
            name: p.kode_saham,
            Profit: p.floating_profit,
            Cost: p.market_value - p.floating_profit
        }));

        return (
            <div className="space-y-8 animate-in fade-in duration-500">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    <StatCard
                        title="Market Value"
                        value={`Rp ${formatShortAmount(totalMarketValue)}`}
                        icon={<TrendingUp size={24} />}
                        color="blue"
                    />
                    <StatCard
                        title="Floating P/L"
                        value={`Rp ${formatShortAmount(totalProfit)}`}
                        icon={<Activity size={24} />}
                        trend={`${avgROI.toFixed(1)}%`}
                        trendUp={avgROI >= 0}
                        color={totalProfit >= 0 ? "indigo" : "rose"}
                    />
                    <StatCard
                        title="Nominal Investasi"
                        value={`Rp ${formatShortAmount(totalMarketValue - totalProfit)}`}
                        icon={<Coins size={24} />}
                        color="green"
                    />
                    <StatCard
                        title="Active Items"
                        value={portfolio.length.toString()}
                        icon={<Briefcase size={24} />}
                        color="orange"
                    />
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    <div className="bg-white p-8 rounded-3xl border border-gray-100 shadow-sm">
                        <h3 className="font-black text-gray-900 flex items-center gap-3 mb-8">
                            <PieChartIcon size={20} className="text-orange-500" /> Komposisi Portofolio
                        </h3>
                        <div className="h-[350px]">
                            <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                    <Pie data={pieData} cx="50%" cy="50%" innerRadius={80} outerRadius={120} paddingAngle={5} dataKey="value">
                                        {pieData.map((_, index) => <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />)}
                                    </Pie>
                                    <Tooltip formatter={(val: any) => `Rp ${val.toLocaleString()}`} />
                                    <Legend />
                                </PieChart>
                            </ResponsiveContainer>
                        </div>
                    </div>

                    <div className="bg-white p-8 rounded-3xl border border-gray-100 shadow-sm">
                        <h3 className="font-black text-gray-900 flex items-center gap-3 mb-8">
                            <BarChart3 size={20} className="text-blue-500" /> Profil P&L Per-Saham
                        </h3>
                        <div className="h-[350px]">
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={barData}>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                                    <XAxis dataKey="name" axisLine={false} tickLine={false} />
                                    <YAxis axisLine={false} tickLine={false} tickFormatter={(val) => `Rp${(val / 1000000).toFixed(0)}jt`} />
                                    <Tooltip formatter={(val: any) => `Rp ${val.toLocaleString()}`} />
                                    <Bar dataKey="Cost" fill="#3b82f6" stackId="a" />
                                    <Bar dataKey="Profit" fill="#10b981" stackId="a" />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </div>
                </div>
            </div>
        );
    };

    const renderReports = () => (
        <div className="space-y-6">
            <div className="flex justify-end gap-2 mb-4">
                {(['daily', 'monthly', 'yearly'] as const).map(p => (
                    <button
                        key={p}
                        onClick={() => setReportPeriod(p)}
                        className={`px-4 py-2 rounded-xl font-bold text-xs uppercase tracking-widest transition-all ${reportPeriod === p ? 'bg-bri-blue text-white shadow-lg' : 'bg-white text-gray-500 hover:bg-gray-100'}`}
                    >
                        {p}
                    </button>
                ))}
            </div>
            <div className="bg-white rounded-3xl border border-gray-100 shadow-xl overflow-hidden">
                <DataTable
                    data={reportData}
                    columns={[
                        { header: 'Periode', accessor: 'label', id: 'label' },
                        { header: 'Frekuensi Beli', accessor: 'count_beli', id: 'cb' },
                        { header: 'Total Beli', accessor: (row) => `Rp ${row.total_beli.toLocaleString()}`, id: 'tb' },
                        { header: 'Frekuensi Jual', accessor: 'count_jual', id: 'cj' },
                        { header: 'Total Jual', accessor: (row) => `Rp ${row.total_jual.toLocaleString()}`, id: 'tj' },
                        {
                            header: 'Net Flow',
                            accessor: (row) => (
                                <span className={`font-bold ${(row.total_jual - row.total_beli) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                                    Rp {(row.total_jual - row.total_beli).toLocaleString()}
                                </span>
                            ),
                            id: 'net'
                        },
                    ]}
                />
            </div>
        </div>
    );

    return (
        <div className="p-8 max-w-[1600px] mx-auto min-h-screen bg-gray-50/30">
            {/* Header Area */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 mb-10">
                <div className="space-y-1">
                    <div className="flex items-center gap-3 mb-2">
                        <div className="p-2.5 bg-bri-orange/10 rounded-xl text-bri-orange">
                            <TrendingUp size={24} />
                        </div>
                        <h1 className="text-4xl font-black text-gray-900 tracking-tight">Investasi Saham</h1>
                    </div>
                    <p className="text-gray-500 font-medium max-w-2xl">
                        Sistem manajemen portofolio saham terintegrasi. Kelola master data,
                        pengajuan proposal, transaksi, hingga laporan performa.
                    </p>
                </div>

                <div className="flex flex-wrap gap-3">
                    {['Staff', 'Super Admin'].includes(role || '') && (
                        <>
                            <button
                                onClick={() => openForm('master')}
                                className="flex items-center gap-2 bg-white border-2 border-bri-blue text-bri-blue px-6 py-3.5 rounded-2xl font-black text-sm shadow-sm hover:bg-blue-50 transition-all"
                            >
                                <Plus size={18} /> Master Baru
                            </button>
                            <button
                                onClick={() => openForm('proposal')}
                                className="flex items-center gap-2 bg-bri-blue text-white px-6 py-3.5 rounded-2xl font-black text-sm shadow-xl shadow-bri-blue/20 hover:scale-[1.02] active:scale-95 transition-all"
                            >
                                <FileText size={18} /> Entry Proposal
                            </button>
                            <label className="flex items-center gap-2 bg-white border-2 border-gray-200 text-gray-600 px-6 py-3.5 rounded-2xl font-black text-sm shadow-sm hover:bg-gray-50 transition-all cursor-pointer">
                                <Upload size={18} /> Upload Proposal (CSV)
                                <input type="file" accept=".csv" className="hidden" onChange={handleUpload} />
                            </label>
                            <button
                                onClick={() => openForm('transaction')}
                                className="flex items-center gap-2 bg-bri-orange text-white px-6 py-3.5 rounded-2xl font-black text-sm shadow-xl shadow-orange-500/20 hover:scale-[1.02] active:scale-95 transition-all"
                            >
                                <Plus size={18} /> Entry Transaksi
                            </button>
                        </>
                    )}
                </div>
            </div>

            {/* Tab Navigation */}
            <div className="flex gap-2 p-1.5 bg-gray-100 rounded-2xl w-fit mb-8 sticky top-4 z-40 shadow-sm border border-gray-200/50 backdrop-blur-md bg-white/70 overflow-x-auto max-w-full">
                <button onClick={() => setActiveTab('dashboard')} className={`flex items-center gap-2 px-6 py-3 rounded-xl font-bold text-xs whitespace-nowrap transition-all ${activeTab === 'dashboard' ? 'bg-white text-bri-blue shadow-md' : 'text-gray-500 hover:text-gray-900'}`}><LayoutDashboard size={16} /> Dashboard</button>
                <button onClick={() => setActiveTab('master')} className={`flex items-center gap-2 px-6 py-3 rounded-xl font-bold text-xs whitespace-nowrap transition-all ${activeTab === 'master' ? 'bg-white text-bri-blue shadow-md' : 'text-gray-500 hover:text-gray-900'}`}><Database size={16} /> Master Saham</button>
                <button onClick={() => setActiveTab('proposal')} className={`flex items-center gap-2 px-6 py-3 rounded-xl font-bold text-xs whitespace-nowrap transition-all ${activeTab === 'proposal' ? 'bg-white text-bri-blue shadow-md' : 'text-gray-500 hover:text-gray-900'}`}><FileText size={16} /> Proposal</button>
                <button onClick={() => setActiveTab('transaksi')} className={`flex items-center gap-2 px-6 py-3 rounded-xl font-bold text-xs whitespace-nowrap transition-all ${activeTab === 'transaksi' ? 'bg-white text-bri-blue shadow-md' : 'text-gray-500 hover:text-gray-900'}`}><RefreshCw size={16} /> Transaksi</button>
                <button onClick={() => setActiveTab('reports')} className={`flex items-center gap-2 px-6 py-3 rounded-xl font-bold text-xs whitespace-nowrap transition-all ${activeTab === 'reports' ? 'bg-white text-bri-blue shadow-md' : 'text-gray-500 hover:text-gray-900'}`}><BarChart3 size={16} /> Laporan</button>
                <button onClick={() => setActiveTab('corporate-action')} className={`flex items-center gap-2 px-6 py-3 rounded-xl font-bold text-xs whitespace-nowrap transition-all ${activeTab === 'corporate-action' ? 'bg-white text-bri-blue shadow-md' : 'text-gray-500 hover:text-gray-900'}`}><Coins size={16} /> Action</button>
            </div>

            {/* Content Area */}
            <div className="min-h-[600px]">
                {loading ? (
                    <div className="flex flex-col items-center justify-center py-40">
                        <div className="w-12 h-12 border-4 border-bri-blue border-t-transparent rounded-full animate-spin mb-4"></div>
                        <p className="text-gray-500 font-bold uppercase tracking-widest text-xs">Memproses Data...</p>
                    </div>
                ) : (
                    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                        {activeTab === 'dashboard' && renderDashboard()}
                        {activeTab === 'master' && (
                            <div className="bg-white rounded-3xl border border-gray-100 shadow-xl overflow-hidden">
                                <DataTable data={stocks} columns={[
                                    { header: 'Kode', accessor: 'kode_saham', id: 'k' },
                                    { header: 'Emiten', accessor: 'nama_emiten', id: 'e' },
                                    { header: 'Sektor', accessor: 'sektor', id: 's' },
                                    { header: 'Last Price', accessor: (row) => `Rp ${row.last_price.toLocaleString()}`, id: 'p' },
                                    { header: 'Universe', accessor: (row) => row.is_universe ? 'YES' : 'NO', id: 'u' },
                                    {
                                        header: 'Aksi', accessor: (row) => (
                                            <div className="flex gap-2">
                                                <button onClick={() => openForm('master', row)} className="text-bri-blue font-bold">Edit</button>
                                                <button onClick={() => handleDelete('master', row.id)} className="text-red-500 font-bold">Del</button>
                                            </div>
                                        ), id: 'a'
                                    }
                                ]} searchable />
                            </div>
                        )}
                        {activeTab === 'proposal' && (
                            <div className="bg-white rounded-3xl border border-gray-100 shadow-xl overflow-hidden">
                                <DataTable data={proposals} columns={[
                                    { header: 'No. Proposal', accessor: (row) => <span className="text-[10px] font-mono font-bold text-gray-400">#{row.proposal_no.split('-').pop()}</span>, id: 'n' },
                                    { header: 'Tgl', accessor: (row) => new Date(row.created_at).toLocaleDateString(), id: 't' },
                                    { header: 'Tipe', accessor: 'jenis_investasi', id: 'jt' },
                                    { header: 'Efek', accessor: 'kode_efek', id: 's' },
                                    { header: 'Aksi', accessor: (row) => <span className={`font-black ${row.tipe_transaksi === 'BELI' ? 'text-green-600' : 'text-rose-600'}`}>{row.tipe_transaksi}</span>, id: 'ty' },
                                    { header: 'Nominal Usulan', accessor: (row) => `Rp ${row.nominal_usulan?.toLocaleString()}`, id: 'p' },
                                    { header: 'Target', accessor: (row) => row.range_harga || row.range_yield || '-', id: 'l' },
                                    {
                                        header: 'Status', accessor: (row) => (
                                            <span className={`px-3 py-1 rounded-full text-[10px] font-black ${row.status_approval === 'APPROVED' ? 'bg-green-100 text-green-700' : row.status_approval === 'PENDING' ? 'bg-yellow-100 text-yellow-700' : 'bg-blue-100 text-blue-700'}`}>
                                                {row.status_approval}
                                            </span>
                                        ), id: 'st'
                                    },
                                    {
                                        header: 'Approval', accessor: (row) => (
                                            <div className="flex gap-2">
                                                {row.status_approval === 'PENDING' && (['Checker', 'Admin', 'Super Admin'].includes(role || '')) && (
                                                    <div className="flex gap-1">
                                                        <button onClick={() => handleApprove(row.id, 'APPROVE')} className="bg-green-500 text-white px-2 py-1 rounded text-[10px] font-bold uppercase tracking-tight">Checker OK</button>
                                                        <button onClick={() => handleApprove(row.id, 'REJECT')} className="bg-red-500 text-white px-2 py-1 rounded text-[10px] font-bold uppercase tracking-tight">Reject</button>
                                                    </div>
                                                )}
                                                {row.status_approval === 'PENDING_SIGNER' && (['Signer', 'Super Admin'].includes(role || '')) && (
                                                    <div className="flex gap-1">
                                                        <button onClick={() => handleApprove(row.id, 'APPROVE')} className="bg-blue-600 text-white px-2 py-1 rounded text-[10px] font-bold uppercase tracking-tight">Signer OK</button>
                                                        <button onClick={() => handleApprove(row.id, 'REJECT')} className="bg-red-500 text-white px-2 py-1 rounded text-[10px] font-bold uppercase tracking-tight">Reject</button>
                                                    </div>
                                                )}
                                                {row.status_approval === 'APPROVED' && (
                                                    <button
                                                        onClick={() => openForm('transaction', {
                                                            proposal_id: row.id,
                                                            kode_efek: row.kode_efek,
                                                            nama_emiten: row.nama_emiten,
                                                            jenis_transaksi: row.tipe_transaksi === 'BELI' ? 'BUY' : 'SELL',
                                                            nominal: row.nominal_usulan
                                                        })}
                                                        className="bg-orange-500 text-white px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest flex items-center gap-1"
                                                    >
                                                        Eksekusi <ArrowUpRight size={10} />
                                                    </button>
                                                )}
                                            </div>
                                        ), id: 'ap'
                                    }
                                ]} searchable />
                            </div>
                        )}
                        {activeTab === 'transaksi' && (
                            <div className="bg-white rounded-3xl border border-gray-100 shadow-xl overflow-hidden">
                                <DataTable data={transactions} columns={[
                                    { header: 'TX No.', accessor: 'transaction_no', id: 'n' },
                                    { header: 'Tgl', accessor: (row) => new Date(row.tgl_transaksi).toLocaleDateString(), id: 't' },
                                    { header: 'Efek', accessor: (row) => row.kode_efek || row.kode_saham, id: 's' },
                                    { header: 'Tipe', accessor: (row) => row.jenis_transaksi || row.tipe_transaksi, id: 'ty' },
                                    { header: 'Harga/Yield', accessor: (row) => row.harga_transaksi ? `Rp ${row.harga_transaksi.toLocaleString()}` : row.yield ? `${row.yield}%` : row.harga_percent ? `${row.harga_percent}%` : '-', id: 'p' },
                                    { header: 'Nominal/Qty', accessor: (row) => (row.nominal || row.jumlah_lembar)?.toLocaleString() || '-', id: 'l' },
                                    { header: 'Sekuritas', accessor: 'sekuritas', id: 'sk' }
                                ]} searchable />
                            </div>
                        )}
                        {activeTab === 'reports' && renderReports()}
                        {activeTab === 'corporate-action' && (
                            <div className="bg-white p-20 rounded-3xl border border-dashed border-gray-200 text-center">
                                <Coins size={64} className="text-gray-300 mx-auto mb-6" />
                                <h3 className="text-xl font-black text-gray-800 mb-2">Pencatatan Aksi Korporasi</h3>
                                <p className="text-gray-500 mb-8 max-w-sm mx-auto">Input Dividen, Stock Split, atau Right Issue Saham.</p>
                                <button onClick={() => openForm('action')} className="bg-bri-blue text-white px-8 py-3 rounded-2xl font-black">Input Sekarang</button>
                            </div>
                        )}
                    </div>
                )}
            </div>

            {/* Form Modal */}
            <AnimatePresence>
                {showFormModal && (
                    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
                        <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="bg-white rounded-[32px] w-full max-w-2xl p-10 overflow-hidden shadow-2xl">
                            <h2 className="text-2xl font-black mb-8 capitalize px-2">Entry Data {formType}</h2>
                            <form onSubmit={handleFormSubmit} className="grid grid-cols-2 gap-6 p-2 max-h-[70vh] overflow-y-auto custom-scrollbar">
                                {formType === 'master' && (
                                    <>
                                        <div className="col-span-1">
                                            <label className="text-[10px] font-black uppercase text-gray-400 mb-2 block">Kode Saham</label>
                                            <input required className="w-full px-4 py-3 bg-gray-50 rounded-xl border-none font-bold" value={formData.kode_saham || ''} onChange={e => setFormData({ ...formData, kode_saham: e.target.value })} placeholder="Misal: BBRI" />
                                        </div>
                                        <div className="col-span-1">
                                            <label className="text-[10px] font-black uppercase text-gray-400 mb-2 block">Nama Emiten</label>
                                            <input required className="w-full px-4 py-3 bg-gray-50 rounded-xl border-none font-bold" value={formData.nama_emiten || ''} onChange={e => setFormData({ ...formData, nama_emiten: e.target.value })} placeholder="Bank Rakyat Indonesia" />
                                        </div>
                                        <div className="col-span-1">
                                            <label className="text-[10px] font-black uppercase text-gray-400 mb-2 block">Sektor</label>
                                            <input className="w-full px-4 py-3 bg-gray-50 rounded-xl border-none font-bold" value={formData.sektor || ''} onChange={e => setFormData({ ...formData, sektor: e.target.value })} />
                                        </div>
                                        <div className="col-span-1">
                                            <label className="text-[10px] font-black uppercase text-gray-400 mb-2 block">Harga Terakhir</label>
                                            <input type="number" className="w-full px-4 py-3 bg-gray-50 rounded-xl border-none font-bold" value={formData.last_price || 0} onChange={e => setFormData({ ...formData, last_price: Number(e.target.value) })} />
                                        </div>
                                    </>
                                )}
                                {formType === 'proposal' && (
                                    <>
                                        <div className="col-span-1">
                                            <label className="text-[10px] font-black uppercase text-gray-400 mb-2 block">Jenis Investasi</label>
                                            <select required className="w-full px-4 py-3 bg-gray-50 rounded-xl border-none font-bold" value={formData.jenis_investasi || ''} onChange={e => setFormData({ ...formData, jenis_investasi: e.target.value })}>
                                                <option value="">-- Pilih --</option>
                                                <option value="SAHAM">SAHAM</option>
                                                <option value="OBLIGASI">OBLIGASI</option>
                                                <option value="REKSADANA">REKSADANA</option>
                                                <option value="DEPOSITO">DEPOSITO</option>
                                            </select>
                                        </div>
                                        <div className="col-span-1">
                                            <label className="text-[10px] font-black uppercase text-gray-400 mb-2 block">Kode Efek / Isin</label>
                                            <input required className="w-full px-4 py-3 bg-gray-50 rounded-xl border-none font-bold" value={formData.kode_efek || formData.kode_saham || ''} onChange={e => setFormData({ ...formData, kode_efek: e.target.value, kode_saham: e.target.value })} placeholder="Misal: BBRI / FR0080" />
                                        </div>
                                        <div className="col-span-2">
                                            <label className="text-[10px] font-black uppercase text-gray-400 mb-2 block">Nama Emiten / Seri</label>
                                            <input required className="w-full px-4 py-3 bg-gray-50 rounded-xl border-none font-bold" value={formData.nama_emiten || ''} onChange={e => setFormData({ ...formData, nama_emiten: e.target.value })} placeholder="Bank Rakyat Indonesia / FR0080" />
                                        </div>
                                        <div className="col-span-1">
                                            <label className="text-[10px] font-black uppercase text-gray-400 mb-2 block">Tipe Transaksi</label>
                                            <select className="w-full px-4 py-3 bg-gray-50 rounded-xl border-none font-bold" value={formData.tipe_transaksi || 'BELI'} onChange={e => setFormData({ ...formData, tipe_transaksi: e.target.value })}>
                                                <option value="BELI">BELI (BUY)</option>
                                                <option value="JUAL">JUAL (SELL)</option>
                                            </select>
                                        </div>
                                        <div className="col-span-1">
                                            <label className="text-[10px] font-black uppercase text-gray-400 mb-2 block">Nominal Usulan (Rp)</label>
                                            <input type="number" required className="w-full px-4 py-3 bg-gray-50 rounded-xl border-none font-bold" value={formData.nominal_usulan || ''} onChange={e => setFormData({ ...formData, nominal_usulan: Number(e.target.value) })} />
                                        </div>
                                        <div className="col-span-1">
                                            <label className="text-[10px] font-black uppercase text-gray-400 mb-2 block">Range Harga / Yield</label>
                                            <input className="w-full px-4 py-3 bg-gray-50 rounded-xl border-none font-bold" value={formData.range_harga || ''} onChange={e => setFormData({ ...formData, range_harga: e.target.value })} placeholder="Misal: 4500-4700 / 6.5%" />
                                        </div>
                                        <div className="col-span-1">
                                            <label className="text-[10px] font-black uppercase text-gray-400 mb-2 block">Tanggal Proyeksi</label>
                                            <input type="date" className="w-full px-4 py-3 bg-gray-50 rounded-xl border-none font-bold" value={formData.tgl_proposal || ''} onChange={e => setFormData({ ...formData, tgl_proposal: e.target.value })} />
                                        </div>
                                    </>
                                )}
                                {formType === 'transaction' && (
                                    <>
                                        <div className="col-span-2">
                                            <label className="text-[10px] font-black uppercase text-gray-400 mb-2 block">Tautkan ke Proposal</label>
                                            <select className="w-full px-4 py-3 bg-gray-50 rounded-xl border-none font-bold" onChange={e => {
                                                const p = proposals.find(pr => pr.proposal_no === e.target.value);
                                                if (p) {
                                                    setFormData({
                                                        ...formData,
                                                        proposal_id: p.id,
                                                        kode_efek: p.kode_efek,
                                                        nama_emiten: p.nama_emiten,
                                                        jenis_transaksi: p.tipe_transaksi === 'BELI' ? 'BUY' : 'SELL',
                                                        nominal: p.nominal_usulan
                                                    });
                                                }
                                            }}>
                                                <option value="">-- Lewati Link Proposal --</option>
                                                {proposals.filter(p => p.status_approval === 'APPROVED').map(p => <option key={p.id} value={p.proposal_no}>{p.proposal_no} ({p.kode_efek})</option>)}
                                            </select>
                                        </div>
                                        <div className="col-span-1">
                                            <label className="text-[10px] font-black uppercase text-gray-400 mb-2 block">Kode Efek</label>
                                            <input required className="w-full px-4 py-3 bg-gray-50 rounded-xl border-none font-bold" value={formData.kode_efek || ''} onChange={e => setFormData({ ...formData, kode_efek: e.target.value })} />
                                        </div>
                                        <div className="col-span-1">
                                            <label className="text-[10px] font-black uppercase text-gray-400 mb-2 block">Harga Per Unit / Lembar</label>
                                            <input type="number" required className="w-full px-4 py-3 bg-gray-50 rounded-xl border-none font-bold" value={formData.harga_transaksi || ''} onChange={e => setFormData({ ...formData, harga_transaksi: Number(e.target.value) })} />
                                        </div>
                                        <div className="col-span-1">
                                            <label className="text-[10px] font-black uppercase text-gray-400 mb-2 block">Lembar (Khusus Saham)</label>
                                            <input type="number" className="w-full px-4 py-3 bg-gray-50 rounded-xl border-none font-bold" value={formData.jumlah_lembar || ''} onChange={e => setFormData({ ...formData, jumlah_lembar: Number(e.target.value) })} />
                                        </div>
                                        <div className="col-span-1">
                                            <label className="text-[10px] font-black uppercase text-gray-400 mb-2 block">Fee / Pajak</label>
                                            <input type="number" className="w-full px-4 py-3 bg-gray-50 rounded-xl border-none font-bold" value={formData.fee_broker || ''} onChange={e => setFormData({ ...formData, fee_broker: Number(e.target.value) })} />
                                        </div>
                                        <div className="col-span-1">
                                            <label className="text-[10px] font-black uppercase text-gray-400 mb-2 block">Broker / Bank</label>
                                            <input className="w-full px-4 py-3 bg-gray-50 rounded-xl border-none font-bold" value={formData.sekuritas || ''} onChange={e => setFormData({ ...formData, sekuritas: e.target.value })} placeholder="Misal: BRIDS" />
                                        </div>
                                        <div className="col-span-1">
                                            <label className="text-[10px] font-black uppercase text-gray-400 mb-2 block">Tgl Eksekusi</label>
                                            <input type="date" required className="w-full px-4 py-3 bg-gray-50 rounded-xl border-none font-bold" value={formData.tgl_transaksi?.split('T')[0] || ''} onChange={e => setFormData({ ...formData, tgl_transaksi: new Date(e.target.value).toISOString() })} />
                                        </div>
                                    </>
                                )}
                                {formType === 'action' && (
                                    <>
                                        <div className="col-span-2">
                                            <label className="text-[10px] font-black uppercase text-gray-400 mb-2 block">Saham</label>
                                            <select required className="w-full px-4 py-3 bg-gray-50 rounded-xl border-none font-bold" onChange={e => setFormData({ ...formData, kode_saham: e.target.value })}>
                                                <option value="">-- Pilih --</option>
                                                {stocks.map(s => <option key={s.id} value={s.kode_saham}>{s.kode_saham}</option>)}
                                            </select>
                                        </div>
                                        <div className="col-span-1">
                                            <label className="text-[10px] font-black uppercase text-gray-400 mb-2 block">Jenis Action</label>
                                            <select className="w-full px-4 py-3 bg-gray-50 rounded-xl border-none font-bold" onChange={e => setFormData({ ...formData, jenis_action: e.target.value })}>
                                                <option value="DIVIDEN_CASH">Dividend (Tunai)</option>
                                                <option value="STOCK_SPLIT">Stock Split</option>
                                                <option value="RIGHT_ISSUE">Right Issue / Warrant</option>
                                            </select>
                                        </div>
                                        <div className="col-span-1">
                                            <label className="text-[10px] font-black uppercase text-gray-400 mb-2 block">Nominal Per Lembar (Jika Dividen)</label>
                                            <input type="number" className="w-full px-4 py-3 bg-gray-50 rounded-xl border-none font-bold" onChange={e => setFormData({ ...formData, nominal_per_lembar: Number(e.target.value) })} />
                                        </div>
                                    </>
                                )}
                                <div className="col-span-2 flex gap-4 mt-8">
                                    <button type="button" onClick={() => setShowFormModal(false)} className="flex-1 py-4 border-2 border-gray-100 rounded-2xl font-black text-xs uppercase text-gray-400">Batal</button>
                                    <button type="submit" className="flex-2 py-4 bg-bri-blue text-white rounded-2xl font-black text-xs uppercase shadow-xl shadow-bri-blue/30">Simpan Data</button>
                                </div>
                            </form>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default Saham;
