import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Upload, FileText, ArrowRight, LayoutDashboard,
    Database, Coins, RefreshCw, BarChart3, TrendingUp,
    Plus, Activity, PieChart as PieChartIcon,
    ArrowUpRight, ArrowDownRight, Briefcase, Globe,
    Download
} from 'lucide-react';
import { DataTable, type ColumnDef } from '../../components/DataTable';
import { useAuth } from '../../context/AuthContext';
import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
    PieChart, Pie, Cell
} from 'recharts';

// --- STYLES & CONSTANTS ---
const COLORS = ['#3b82f6', '#f97316', '#10b981', '#8b5cf6', '#ec4899', '#f59e0b'];

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
    defaultTab?: 'dashboard' | 'master' | 'proposal' | 'transaksi' | 'corporate-action';
}

const Saham: React.FC<SahamProps> = ({ defaultTab = 'dashboard' }) => {
    const { token, user } = useAuth();
    const role = user?.role;
    const [activeTab, setActiveTab] = useState<'dashboard' | 'master' | 'proposal' | 'transaksi' | 'corporate-action'>(defaultTab);
    const [loading, setLoading] = useState(false);
    const [uploading, setUploading] = useState(false);
    const [showUploadModal, setShowUploadModal] = useState(false);
    const [uploadType, setUploadType] = useState<'proposal' | 'transaction'>('proposal');
    const [selectedFile, setSelectedFile] = useState<File | null>(null);

    // Data States
    const [stocks, setStocks] = useState<any[]>([]);
    const [proposals, setProposals] = useState<any[]>([]);
    const [transactions, setTransactions] = useState<any[]>([]);
    const [portfolio, setPortfolio] = useState<any[]>([]);

    useEffect(() => {
        fetchAllData();
    }, []);

    const fetchAllData = async () => {
        setLoading(true);
        try {
            const [stocksRes, proposalsRes, txRes, portfolioRes] = await Promise.all([
                axios.get('http://localhost:3000/api/investasi/saham/master', { headers: { Authorization: `Bearer ${token}` } }),
                axios.get('http://localhost:3000/api/investasi/saham/proposals', { headers: { Authorization: `Bearer ${token}` } }),
                axios.get('http://localhost:3000/api/investasi/saham/transactions', { headers: { Authorization: `Bearer ${token}` } }),
                axios.get('http://localhost:3000/api/investasi/saham/portfolio', { headers: { Authorization: `Bearer ${token}` } })
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

    const handleFileUpload = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedFile) return;

        setUploading(true);
        const formData = new FormData();
        formData.append('file', selectedFile);

        try {
            const endpoint = uploadType === 'proposal'
                ? 'http://localhost:3000/api/investasi/saham/proposals/upload'
                : 'http://localhost:3000/api/investasi/saham/transactions/upload';

            await axios.post(endpoint, formData, {
                headers: {
                    Authorization: `Bearer ${token}`,
                    'Content-Type': 'multipart/form-data'
                }
            });
            alert('Upload berhasil!');
            setShowUploadModal(false);
            setSelectedFile(null);
            fetchAllData();
        } catch (error) {
            console.error('Upload error:', error);
            alert('Gagal mengunggah file.');
        } finally {
            setUploading(false);
        }
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
                        title="Total Market Value"
                        value={`Rp ${totalMarketValue.toLocaleString()}`}
                        icon={<Briefcase size={24} />}
                        trend="+12.5%"
                        trendUp={true}
                        color="blue"
                    />
                    <StatCard
                        title="Floating Profit/Loss"
                        value={`Rp ${totalProfit.toLocaleString()}`}
                        icon={<TrendingUp size={24} />}
                        trend={totalProfit >= 0 ? "+ROI" : "-ROI"}
                        trendUp={totalProfit >= 0}
                        color={totalProfit >= 0 ? "green" : "rose"}
                    />
                    <StatCard
                        title="Average ROI"
                        value={`${avgROI.toFixed(2)}%`}
                        icon={<PieChartIcon size={24} />}
                        color="indigo"
                    />
                    <StatCard
                        title="Active Stock Items"
                        value={portfolio.length.toString()}
                        icon={<Activity size={24} />}
                        color="orange"
                    />
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    <div className="bg-white p-8 rounded-3xl border border-gray-100 shadow-sm shadow-gray-200/50">
                        <div className="flex items-center justify-between mb-8">
                            <h3 className="font-black text-gray-900 flex items-center gap-3">
                                <PieChartIcon size={20} className="text-orange-500" /> Komposisi Portofolio
                            </h3>
                        </div>
                        <div className="h-[350px]">
                            <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                    <Pie
                                        data={pieData}
                                        cx="50%"
                                        cy="50%"
                                        innerRadius={80}
                                        outerRadius={120}
                                        paddingAngle={5}
                                        dataKey="value"
                                    >
                                        {pieData.map((_, index) => (
                                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                        ))}
                                    </Pie>
                                    <Tooltip
                                        contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.1)' }}
                                        formatter={(val: any) => `Rp ${val.toLocaleString()}`}
                                    />
                                    <Legend verticalAlign="middle" align="right" layout="vertical" />
                                </PieChart>
                            </ResponsiveContainer>
                        </div>
                    </div>

                    <div className="bg-white p-8 rounded-3xl border border-gray-100 shadow-sm shadow-gray-200/50">
                        <div className="flex items-center justify-between mb-8">
                            <h3 className="font-black text-gray-900 flex items-center gap-3">
                                <BarChart3 size={20} className="text-blue-500" /> P&L Per-Instrumen
                            </h3>
                        </div>
                        <div className="h-[350px]">
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={barData}>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#9ca3af' }} />
                                    <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#9ca3af' }} tickFormatter={(val) => `Rp${(val / 1000000).toFixed(0)}Jt`} />
                                    <Tooltip cursor={{ fill: '#f8fbfc' }} contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.1)' }} />
                                    <Bar dataKey="Cost" fill="#3b82f6" stackId="a" radius={[0, 0, 0, 0]} />
                                    <Bar dataKey="Profit" fill="#10b981" stackId="a" radius={[4, 4, 0, 0]} />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </div>
                </div>

                <div className="bg-white rounded-3xl border border-gray-100 shadow-sm shadow-gray-200/50 overflow-hidden">
                    <div className="p-8 border-b border-gray-50 bg-gray-50/30 flex justify-between items-center">
                        <h3 className="font-black text-gray-900 flex items-center gap-3">
                            <Globe size={20} className="text-teal-500" /> Posisi Portofolio Detail
                        </h3>
                        <button className="flex items-center gap-2 text-bri-blue font-black text-xs uppercase tracking-widest hover:opacity-70 transition-opacity">
                            <Download size={14} /> Download Report
                        </button>
                    </div>
                    <DataTable
                        data={portfolio}
                        columns={[
                            { header: 'Kode', accessor: 'kode_saham', id: 'kode' },
                            { header: 'Nama Emiten', accessor: 'nama_emiten', id: 'emiten' },
                            { header: 'Lembar', accessor: (row) => row.total_lembar.toLocaleString(), id: 'lembar' },
                            { header: 'HPP Avg', accessor: (row) => `Rp ${row.avg_price.toLocaleString()}`, id: 'hpp' },
                            { header: 'Last Price', accessor: (row) => `Rp ${row.last_price.toLocaleString()}`, id: 'last' },
                            {
                                header: 'Market Value',
                                accessor: (row) => <span className="font-bold text-blue-600">Rp {row.market_value.toLocaleString()}</span>,
                                id: 'market'
                            },
                            {
                                header: 'Profit/Loss',
                                accessor: (row) => (
                                    <span className={`font-bold ${row.floating_profit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                                        Rp {row.floating_profit.toLocaleString()}
                                    </span>
                                ),
                                id: 'profit'
                            },
                        ]}
                        loading={loading}
                    />
                </div>
            </div>
        );
    };

    const masterColumns: ColumnDef<any>[] = [
        { header: 'Kode', accessor: 'kode_saham', id: 'kode' },
        { header: 'Emiten', accessor: 'nama_emiten', id: 'emiten' },
        { header: 'Sektor', accessor: 'sektor', id: 'sektor' },
        {
            header: 'Universe',
            accessor: (row) => (
                <span className={`px-3 py-1 rounded-full text-[10px] font-black tracking-widest ${row.is_universe ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'}`}>
                    {row.is_universe ? 'UNIVERSE' : 'NON-UNIVERSE'}
                </span>
            ),
            id: 'universe'
        },
        { header: 'Last Price', accessor: (row) => `Rp ${row.last_price.toLocaleString()}`, id: 'price' },
        {
            header: 'Status',
            accessor: (row) => (
                <span className="px-3 py-1 rounded-full bg-blue-50 text-blue-700 text-[10px] font-black tracking-widest">
                    {row.status_approval}
                </span>
            ),
            id: 'status'
        }
    ];

    const proposalColumns: ColumnDef<any>[] = [
        { header: 'No. Proposal', accessor: 'proposal_no', id: 'no' },
        { header: 'Tgl', accessor: (row) => new Date(row.tgl_proposal).toLocaleDateString('id-ID'), id: 'tgl' },
        { header: 'Saham', accessor: 'kode_saham', id: 'saham' },
        {
            header: 'Tipe',
            accessor: (row) => (
                <span className={`font-bold px-2 py-0.5 rounded ${row.tipe_transaksi === 'BELI' ? 'text-blue-600 bg-blue-50' : 'text-orange-600 bg-orange-50'}`}>
                    {row.tipe_transaksi}
                </span>
            ),
            id: 'tipe'
        },
        { header: 'Target Harga', accessor: (row) => `Rp ${(row.range_harga_beli || row.range_harga_jual || 0).toLocaleString()}`, id: 'target' },
        { header: 'Lembar', accessor: (row) => row.jumlah_lembar?.toLocaleString(), id: 'lembar' },
        {
            header: 'Status',
            accessor: (row) => (
                <span className={`px-2 py-1 rounded-full text-[10px] font-black ${row.status_approval === 'APPROVED' ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'}`}>
                    {row.status_approval}
                </span>
            ),
            id: 'status'
        }
    ];

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
                        pengajuan proposal, hingga pencatatan transaksi dan aksi korporasi secara real-time.
                    </p>
                </div>

                <div className="flex flex-wrap gap-3">
                    {role === 'Staff' && (
                        <>
                            <button
                                onClick={() => { setUploadType('proposal'); setShowUploadModal(true); }}
                                className="flex items-center gap-2 bg-bri-blue text-white px-6 py-3.5 rounded-2xl font-black text-sm shadow-xl shadow-bri-blue/20 hover:scale-[1.02] active:scale-95 transition-all"
                            >
                                <Plus size={18} />
                                Buat Proposal
                            </button>
                            <button
                                onClick={() => { setUploadType('transaction'); setShowUploadModal(true); }}
                                className="flex items-center gap-2 bg-white border-2 border-bri-blue text-bri-blue px-6 py-3.5 rounded-2xl font-black text-sm hover:bg-bri-blue/5 hover:scale-[1.02] active:scale-95 transition-all"
                            >
                                <Upload size={18} />
                                Catat Transaksi
                            </button>
                        </>
                    )}
                </div>
            </div>

            {/* Tab Navigation */}
            <div className="flex gap-2 p-1.5 bg-gray-100 rounded-2xl w-fit mb-8 sticky top-4 z-40 shadow-sm border border-gray-200/50 backdrop-blur-md bg-white/70">
                <button
                    onClick={() => setActiveTab('dashboard')}
                    className={`flex items-center gap-2 px-6 py-3 rounded-xl font-bold text-xs transition-all ${activeTab === 'dashboard' ? 'bg-white text-bri-blue shadow-md border border-gray-100' : 'text-gray-500 hover:text-gray-900 hover:bg-white/50'}`}
                >
                    <LayoutDashboard size={16} /> Dashboard
                </button>
                <button
                    onClick={() => setActiveTab('master')}
                    className={`flex items-center gap-2 px-6 py-3 rounded-xl font-bold text-xs transition-all ${activeTab === 'master' ? 'bg-white text-bri-blue shadow-md border border-gray-100' : 'text-gray-500 hover:text-gray-900 hover:bg-white/50'}`}
                >
                    <Database size={16} /> Master Saham
                </button>
                <button
                    onClick={() => setActiveTab('proposal')}
                    className={`flex items-center gap-2 px-6 py-3 rounded-xl font-bold text-xs transition-all ${activeTab === 'proposal' ? 'bg-white text-bri-blue shadow-md border border-gray-100' : 'text-gray-500 hover:text-gray-900 hover:bg-white/50'}`}
                >
                    <FileText size={16} /> Proposal Plan
                </button>
                <button
                    onClick={() => setActiveTab('transaksi')}
                    className={`flex items-center gap-2 px-6 py-3 rounded-xl font-bold text-xs transition-all ${activeTab === 'transaksi' ? 'bg-white text-bri-blue shadow-md border border-gray-100' : 'text-gray-500 hover:text-gray-900 hover:bg-white/50'}`}
                >
                    <RefreshCw size={16} /> Transaksi
                </button>
                <button
                    onClick={() => setActiveTab('corporate-action')}
                    className={`flex items-center gap-2 px-6 py-3 rounded-xl font-bold text-xs transition-all ${activeTab === 'corporate-action' ? 'bg-white text-bri-blue shadow-md border border-gray-100' : 'text-gray-500 hover:text-gray-900 hover:bg-white/50'}`}
                >
                    <Coins size={16} /> Corporate Action
                </button>
            </div>

            {/* Content Area */}
            <div className="min-h-[600px]">
                {loading ? (
                    <div className="flex flex-col items-center justify-center py-40">
                        <div className="w-12 h-12 border-4 border-bri-blue border-t-transparent rounded-full animate-spin mb-4"></div>
                        <p className="text-gray-500 font-bold tracking-widest text-xs uppercase">Menyiapkan Data Investasi...</p>
                    </div>
                ) : (
                    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                        {activeTab === 'dashboard' && renderDashboard()}
                        {activeTab === 'master' && (
                            <div className="bg-white rounded-3xl border border-gray-100 shadow-xl overflow-hidden">
                                <DataTable data={stocks} columns={masterColumns} loading={loading} searchable />
                            </div>
                        )}
                        {activeTab === 'proposal' && (
                            <div className="bg-white rounded-3xl border border-gray-100 shadow-xl overflow-hidden">
                                <DataTable data={proposals} columns={proposalColumns} loading={loading} searchable />
                            </div>
                        )}
                        {activeTab === 'transaksi' && (
                            <div className="bg-white rounded-3xl border border-gray-100 shadow-xl overflow-hidden">
                                <DataTable
                                    data={transactions}
                                    columns={[
                                        { header: 'TX No.', accessor: 'transaction_no', id: 'no' },
                                        { header: 'Tgl', accessor: (row) => new Date(row.tgl_transaksi).toLocaleDateString('id-ID'), id: 'tgl' },
                                        { header: 'Emiten', accessor: 'kode_saham', id: 'saham' },
                                        { header: 'Tipe', accessor: 'tipe_transaksi', id: 'tipe' },
                                        { header: 'Harga', accessor: (row) => `Rp ${row.harga_transaksi.toLocaleString()}`, id: 'harga' },
                                        { header: 'Lembar', accessor: (row) => row.jumlah_lembar.toLocaleString(), id: 'lembar' },
                                        { header: 'Total', accessor: (row) => `Rp ${row.total_nominal.toLocaleString()}`, id: 'total' },
                                        { header: 'Sekuritas', accessor: 'sekuritas', id: 'sekuritas' },
                                    ]}
                                    loading={loading}
                                    searchable
                                />
                            </div>
                        )}
                        {activeTab === 'corporate-action' && (
                            <div className="flex flex-col items-center justify-center py-20 bg-white rounded-3xl border border-dashed border-gray-200 text-center">
                                <Coins size={64} className="text-gray-300 mb-6" />
                                <h3 className="text-xl font-black text-gray-800 mb-2">Input Aksi Korporasi</h3>
                                <p className="text-gray-500 max-w-md mx-auto mb-8 font-medium">
                                    Catat pembagian dividen, stock split, atau right issue untuk mengupdate posisi portofolio secara otomatis.
                                </p>
                                <button className="bg-bri-blue text-white px-8 py-3 rounded-2xl font-black text-sm hover:scale-105 transition-all shadow-xl shadow-bri-blue/20">
                                    Mulai Input Manual
                                </button>
                            </div>
                        )}
                    </div>
                )}
            </div>

            {/* Upload Modal */}
            <AnimatePresence>
                {showUploadModal && (
                    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/60 backdrop-blur-md">
                        <motion.div
                            initial={{ opacity: 0, scale: 0.9, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.9, y: 20 }}
                            className="bg-white rounded-[40px] shadow-2xl w-full max-w-xl overflow-hidden border border-white/20"
                        >
                            <div className="p-10 text-center">
                                <div className="w-20 h-20 bg-blue-50 text-bri-blue rounded-3xl flex items-center justify-center mx-auto mb-6 transform -rotate-6">
                                    <Database size={40} />
                                </div>
                                <h3 className="text-3xl font-black text-gray-900 mb-3">
                                    Upload {uploadType === 'proposal' ? 'Proposal CSV' : 'Transaksi CSV'}
                                </h3>
                                <p className="text-gray-500 font-medium mb-8">
                                    {uploadType === 'proposal'
                                        ? 'Format CSV: Tgl, KodeSaham, Tipe(BELI/JUAL), DKP, Book, Harga, Lembar'
                                        : 'Format CSV: ProposalNo, Tgl, KodeSaham, Tipe, Lembar, Harga, Fee, Sekuritas, DKP, Book'}
                                </p>

                                <form onSubmit={handleFileUpload} className="space-y-8">
                                    <div className="border-3 border-dashed border-gray-100 rounded-[32px] p-12 text-center hover:border-bri-blue/50 hover:bg-blue-50/30 transition-all relative group bg-gray-50/50">
                                        <input
                                            type="file"
                                            accept=".csv"
                                            onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
                                            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                                        />
                                        <div className="flex flex-col items-center gap-4">
                                            <div className="w-14 h-14 bg-white text-bri-blue rounded-2xl shadow-sm flex items-center justify-center group-hover:scale-110 transition-transform ring-4 ring-blue-50">
                                                <Upload size={24} />
                                            </div>
                                            <div className="text-base font-black text-gray-700">
                                                {selectedFile ? selectedFile.name : 'Pilih file data atau seret ke sini'}
                                            </div>
                                            <div className="text-xs text-gray-400 font-bold uppercase tracking-widest">Maksimal 50MB (CSV Only)</div>
                                        </div>
                                    </div>

                                    <div className="flex gap-4">
                                        <button
                                            type="button"
                                            onClick={() => { setShowUploadModal(false); setSelectedFile(null); }}
                                            className="flex-1 px-8 py-4 border-2 border-gray-100 text-gray-500 font-black rounded-2xl hover:bg-gray-50 transition-all uppercase tracking-widest text-xs"
                                        >
                                            Batal
                                        </button>
                                        <button
                                            type="submit"
                                            disabled={!selectedFile || uploading}
                                            className="flex-2 px-10 py-4 bg-bri-blue text-white font-black rounded-2xl shadow-2xl shadow-bri-blue/30 hover:bg-blue-800 disabled:opacity-50 transition-all flex items-center justify-center gap-3 uppercase tracking-widest text-xs"
                                        >
                                            {uploading ? 'Memproses Data...' : 'Konfirmasi & Simpan'}
                                            <ArrowRight size={18} />
                                        </button>
                                    </div>
                                </form>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default Saham;
