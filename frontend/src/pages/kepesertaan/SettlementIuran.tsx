import React, { useState, useEffect, useMemo } from 'react';
import axios from 'axios';
import { useAuth } from '../../context/AuthContext';
import { DataTable } from '../../components/DataTable';
import type { ColumnDef } from '../../components/DataTable';
import {
    Coins,
    TrendingUp,
    Users,
    Calendar,
    Download,
    PieChart as PieChartIcon,
    BarChart3,
    ArrowUpRight,
    ArrowDownRight,
    Search,
    ChevronDown,
    Database,
    Trash2
} from 'lucide-react';
import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    Legend,
    Cell,
    PieChart,
    Pie
} from 'recharts';

const API = 'http://localhost:3000/api/kepesertaan/iuran/settlement';

const MONTHS = [
    "Januari", "Februari", "Maret", "April", "Mei", "Juni",
    "Juli", "Agustus", "September", "Oktober", "November", "Desember"
];

interface SettlementData {
    bulan: number;
    tahun: number;
    total_tht: number;
    total_prospens: number;
    count_tht: number;
    count_prospens: number;
    status: string;
}

const formatBulan = (bulan: number) => {
    if (!bulan || bulan < 1 || bulan > 12) return 'Unknown';
    return MONTHS[bulan - 1];
};

const formatBulanShort = (bulan: number) => {
    const b = formatBulan(bulan);
    return b.substring(0, 3);
};



const StatCard = ({ title, value, icon, trend, trendUp, color }: any) => {
    const colorClasses: any = {
        blue: 'text-blue-600 bg-blue-50',
        indigo: 'text-indigo-600 bg-indigo-50',
        orange: 'text-orange-600 bg-orange-50',
        teal: 'text-teal-600 bg-teal-50',
    };

    return (
        <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-all group">
            <div className="flex items-start justify-between mb-4">
                <div className={`p-3 rounded-xl ${colorClasses[color] || 'text-gray-600 bg-gray-50'} group-hover:scale-110 transition-transform`}>
                    {icon}
                </div>
                <div className={`flex items-center gap-0.5 text-xs font-bold ${trendUp ? 'text-green-600' : 'text-red-500'}`}>
                    {trendUp ? <ArrowUpRight size={14} /> : <ArrowDownRight size={14} />}
                    {trend}
                </div>
            </div>
            <div className="space-y-1">
                <h4 className="text-gray-500 text-xs font-bold uppercase tracking-wider">{title}</h4>
                <div className="text-xl font-extrabold text-gray-900">{value}</div>
            </div>
        </div>
    );
};

interface SettlementIuranProps {
    defaultTab?: 'settlement' | 'history' | 'reports' | 'overview';
}

const SettlementIuran: React.FC<SettlementIuranProps> = ({ defaultTab = 'overview' }) => {
    const { token } = useAuth();
    const [data, setData] = useState<SettlementData[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [activeTab, setActiveTab] = useState<'settlement' | 'history' | 'reports' | 'overview'>(defaultTab);
    const [reportData, setReportData] = useState<any[]>([]);
    const [pesertaHistory, setPesertaHistory] = useState<any[]>([]);
    const [searchNik, setSearchNik] = useState('');
    const [searchingHistory, setSearchingHistory] = useState(false);

    // Filters
    const [filterYear, setFilterYear] = useState<string>('');
    const [filterMonth, setFilterMonth] = useState<string>('');
    const [filterStartYear, setFilterStartYear] = useState<string>('');
    const [filterEndYear, setFilterEndYear] = useState<string>('');

    const headers = { Authorization: `Bearer ${token}` };

    const fetchData = async () => {
        setLoading(true);
        try {
            const [settlementRes, reportRes] = await Promise.all([
                axios.get(API, { headers }).catch(e => { console.error('Settlement API Error:', e); return { data: [] }; }),
                axios.get('http://localhost:3000/api/kepesertaan/iuran/report', { headers }).catch(e => { console.error('Report API Error:', e); return { data: [] }; })
            ]);
            setData(Array.isArray(settlementRes.data) ? settlementRes.data : []);
            setReportData(Array.isArray(reportRes.data) ? reportRes.data : []);
        } catch (err) {
            console.error('Fetch error:', err);
        } finally {
            setLoading(false);
        }
    };

    const fetchHistory = async () => {
        if (!searchNik) return;
        setSearchingHistory(true);
        try {
            const res = await axios.get(`http://localhost:3000/api/kepesertaan/iuran/history/${encodeURIComponent(searchNik)}`, { headers });
            setPesertaHistory(Array.isArray(res.data) ? res.data : []);
        } catch (err) {
            console.error('History fetch error:', err);
            setPesertaHistory([]);
        } finally {
            setSearchingHistory(false);
        }
    };

    const handleTruncate = async () => {
        if (!window.confirm('PERHATIAN: Apakah Bapak yakin ingin MENGHAPUS SEMUA data iuran? Tindakan ini tidak dapat dibatalkan.')) return;

        setLoading(true);
        try {
            await axios.delete('http://localhost:3000/api/kepesertaan/iuran/truncate', { headers });
            alert('✅ Semua data iuran telah dikosongkan.');
            fetchData();
        } catch (err: any) {
            alert(`❌ Gagal mengosongkan data: ${err.response?.data?.error || 'Error server'}`);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (token) fetchData();
        else setLoading(false);
    }, [token]);

    const filteredData = useMemo(() => {
        return data.filter(item => {
            const matchYear = !filterYear || item.tahun.toString() === filterYear;
            const matchMonth = !filterMonth || item.bulan.toString() === filterMonth;
            const matchRange = (!filterStartYear || item.tahun >= parseInt(filterStartYear)) &&
                (!filterEndYear || item.tahun <= parseInt(filterEndYear));
            const matchSearch = !searchTerm || `${formatBulan(item.bulan)} ${item.tahun} ${item.status || ''}`.toLowerCase().includes(searchTerm.toLowerCase());
            return matchYear && matchMonth && matchRange && matchSearch;
        });
    }, [data, filterYear, filterMonth, filterStartYear, filterEndYear, searchTerm]);

    const filteredReportData = useMemo(() => {
        return (reportData || []).filter(item => {
            const matchYear = !filterYear || item.tahun.toString() === filterYear;
            const matchMonth = !filterMonth || item.bulan.toString() === filterMonth;
            const yearNum = item.tahun;
            const matchStart = !filterStartYear || yearNum >= parseInt(filterStartYear);
            const matchEnd = !filterEndYear || yearNum <= parseInt(filterEndYear);

            return matchYear && matchMonth && matchStart && matchEnd;
        });
    }, [reportData, filterYear, filterMonth, filterStartYear, filterEndYear]);

    const totalNominal = filteredData.reduce((sum: number, item: SettlementData) => sum + (Number(item.total_tht) || 0) + (Number(item.total_prospens) || 0), 0);
    const totalTht = filteredData.reduce((sum: number, item: SettlementData) => sum + (Number(item.total_tht) || 0), 0);
    const totalProspens = filteredData.reduce((sum: number, item: SettlementData) => sum + (Number(item.total_prospens) || 0), 0);
    const totalPeserta = useMemo(() => {
        if (filteredData.length === 0) return 0;
        const sum = filteredData.reduce((acc: number, item: SettlementData) => acc + (item.count_tht + item.count_prospens) / 2, 0);
        return Math.round(sum / filteredData.length);
    }, [filteredData]);

    const chartData = filteredData.slice(0, 12).reverse().map(item => ({
        name: `${formatBulanShort(item.bulan)} ${item.tahun || ''}`,
        THT: Number(item.total_tht) || 0,
        Prospens: Number(item.total_prospens) || 0
    }));

    const pieData = [
        { name: 'THT', value: totalTht, color: '#3b82f6' },
        { name: 'Prospens', value: totalProspens, color: '#f97316' }
    ];

    const columns: ColumnDef<SettlementData>[] = [
        {
            header: 'Periode',
            accessor: (row) => `${formatBulan(row.bulan)} ${row.tahun || ''}`,
            id: 'periode'
        },
        {
            header: 'Total Peserta',
            accessor: (row) => (
                <div className="flex flex-col">
                    <span className="text-xs text-blue-600 font-medium">{(Number(row.count_tht) || 0).toLocaleString()} THT</span>
                    <span className="text-xs text-orange-600 font-medium">{(Number(row.count_prospens) || 0).toLocaleString()} Prospens</span>
                </div>
            ),
            id: 'peserta'
        },
        {
            header: 'Nominal THT',
            accessor: (row) => `Rp ${(Number(row.total_tht) || 0).toLocaleString()}`,
            id: 'nominal_tht'
        },
        {
            header: 'Nominal Prospens',
            accessor: (row) => `Rp ${(Number(row.total_prospens) || 0).toLocaleString()}`,
            id: 'nominal_prospens'
        },
        {
            header: 'Total Dana Masuk',
            accessor: (row) => (
                <span className="font-bold text-gray-800 text-sm">
                    Rp ${(Number(row.total_tht || 0) + Number(row.total_prospens || 0)).toLocaleString()}
                </span>
            ),
            id: 'total'
        },
        {
            header: 'Status',
            accessor: (row) => {
                const status = row.status || 'UPLOADED';
                const colors: any = {
                    'APPROVED': 'bg-green-100 text-green-700',
                    'UPLOADED': 'bg-gray-100 text-gray-700',
                    'COMPARED': 'bg-blue-100 text-blue-700',
                    'PENDING_CHECKER': 'bg-yellow-100 text-yellow-700',
                    'PENDING_SIGNER': 'bg-orange-100 text-orange-700',
                    'REJECTED': 'bg-red-100 text-red-700',
                };
                return <span className={`px-2 py-1 rounded-full text-[10px] font-bold ${colors[status] || 'bg-gray-100 text-gray-600'}`}>{status.replace(/_/g, ' ')}</span>;
            },
            id: 'status'
        }
    ];

    const historyColumns: ColumnDef<any>[] = [
        {
            header: 'Periode',
            accessor: (row) => `${formatBulan(row.bulan)} ${row.tahun || ''}`,
            id: 'periode'
        },
        {
            header: 'Jenis',
            accessor: (row) => (
                <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${row.jenis_iuran === 'THT' ? 'bg-blue-100 text-blue-700' : 'bg-orange-100 text-orange-700'}`}>
                    {row.jenis_iuran}
                </span>
            ),
            id: 'jenis'
        },
        {
            header: 'Nominal',
            accessor: (row) => `Rp ${(Number(row.nominal_iuran) || 0).toLocaleString()}`,
            id: 'nominal'
        },
        {
            header: 'Status Batch',
            accessor: (row) => row.status_approval || '-',
            id: 'status'
        },
        {
            header: 'Waktu Upload',
            accessor: (row) => row.created_at ? new Date(row.created_at).toLocaleString('id-ID') : '-',
            id: 'created_at'
        },
        {
            header: 'Keterangan',
            accessor: (row) => row.keterangan || '-',
            id: 'keterangan'
        }
    ];

    const reportColumns: ColumnDef<any>[] = [
        {
            header: 'Tahun',
            accessor: 'tahun',
            id: 'tahun'
        },
        {
            header: 'Bulan',
            accessor: (row) => formatBulan(row.bulan),
            id: 'bulan'
        },
        {
            header: 'Jenis',
            accessor: 'jenis_iuran',
            id: 'jenis'
        },
        {
            header: 'Jumlah Record',
            accessor: (row) => (Number(row.total_rows) || 0).toLocaleString(),
            id: 'rows'
        },
        {
            header: 'Total Nominal',
            accessor: (row) => <span className="font-bold">Rp {(Number(row.total_nominal) || 0).toLocaleString()}</span>,
            id: 'nominal'
        }
    ];

    return (
        <div className="p-6 max-w-7xl mx-auto space-y-8 animate-in fade-in duration-500">
            {/* Header Section */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8">
                <div>
                    <h1 className="text-3xl font-black text-gray-900 tracking-tight flex items-center gap-3">
                        Financial & Iuran Settlement
                    </h1>
                    <p className="text-gray-500 mt-2 flex items-center gap-2">
                        <Calendar size={16} className="text-blue-500" /> Ringkasan dana masuk, history peserta, dan laporan summary iuran.
                    </p>
                </div>
                <div className="flex items-center gap-3">
                    <button
                        onClick={handleTruncate}
                        className="flex items-center gap-2 bg-red-50 text-red-600 border border-red-100 px-5 py-2.5 rounded-xl text-sm font-bold hover:bg-red-100 transition-all shadow-sm"
                    >
                        <Trash2 size={16} /> Kosongkan Data
                    </button>
                    <button className="flex items-center gap-2 bg-white text-gray-700 border border-gray-200 px-5 py-2.5 rounded-xl text-sm font-bold hover:bg-gray-50 transition-all shadow-sm">
                        <Download size={16} /> Export Laporan
                    </button>
                    <button onClick={fetchData} className="flex items-center gap-2 bg-blue-600 text-white px-6 py-2.5 rounded-xl text-sm font-black hover:bg-blue-700 transition-all shadow-lg shadow-blue-200 active:scale-95">
                        Refresh Data
                    </button>
                </div>
            </div>

            {/* Global Filter Bar */}
            <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm flex flex-wrap items-center gap-6">
                <div className="flex items-center gap-3">
                    <Calendar size={18} className="text-blue-600" />
                    <span className="text-sm font-bold text-gray-700">Filter Data:</span>
                </div>

                <div className="flex flex-wrap items-center gap-4">
                    <div className="relative">
                        <select
                            value={filterYear}
                            onChange={(e) => setFilterYear(e.target.value)}
                            className="pl-4 pr-10 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm font-bold text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 appearance-none cursor-pointer min-w-[140px]"
                        >
                            <option value="">Semua Tahun</option>
                            <option value="2024">2024</option>
                            <option value="2025">2025</option>
                            <option value="2026">2026</option>
                        </select>
                        <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400" size={16} />
                    </div>

                    <div className="relative">
                        <select
                            value={filterMonth}
                            onChange={(e) => setFilterMonth(e.target.value)}
                            className="pl-4 pr-10 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm font-bold text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 appearance-none cursor-pointer min-w-[160px]"
                        >
                            <option value="">Semua Bulan</option>
                            {MONTHS.map((m, i) => (
                                <option key={m} value={i + 1}>{m}</option>
                            ))}
                        </select>
                        <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400" size={16} />
                    </div>

                    <div className="flex items-center gap-3 bg-gray-50 px-4 py-2 rounded-xl border border-gray-200">
                        <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Rentang Tahun:</span>
                        <input
                            type="number"
                            placeholder="Dari"
                            value={filterStartYear}
                            onChange={(e) => setFilterStartYear(e.target.value)}
                            className="w-20 bg-transparent text-sm font-bold text-gray-700 focus:outline-none placeholder:text-gray-300"
                        />
                        <span className="text-gray-300">→</span>
                        <input
                            type="number"
                            placeholder="Sampai"
                            value={filterEndYear}
                            onChange={(e) => setFilterEndYear(e.target.value)}
                            className="w-20 bg-transparent text-sm font-bold text-gray-700 focus:outline-none placeholder:text-gray-300"
                        />
                    </div>

                    <button
                        onClick={() => {
                            setFilterYear('');
                            setFilterMonth('');
                            setFilterStartYear('');
                            setFilterEndYear('');
                        }}
                        className="text-xs font-bold text-blue-600 hover:text-blue-700 transition-colors px-2"
                    >
                        Reset Filter
                    </button>
                </div>
            </div>

            {/* Tab Navigation */}
            <div className="flex border-b border-gray-200">
                <button
                    onClick={() => setActiveTab('settlement')}
                    className={`px-8 py-4 text-sm font-bold transition-all border-b-2 ${activeTab === 'settlement' ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
                >
                    Overview Settlement
                </button>
                <button
                    onClick={() => setActiveTab('history')}
                    className={`px-8 py-4 text-sm font-bold transition-all border-b-2 ${activeTab === 'history' ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
                >
                    History Per User
                </button>
                <button
                    onClick={() => setActiveTab('reports')}
                    className={`px-8 py-4 text-sm font-bold transition-all border-b-2 ${activeTab === 'reports' ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
                >
                    Summary Reports
                </button>
            </div>

            {loading ? (
                <div className="flex flex-col items-center justify-center py-20 bg-white rounded-2xl border border-gray-100 shadow-sm">
                    <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mb-6"></div>
                    <p className="text-gray-500 font-bold tracking-wide">Menghubungkan ke pusat data ykpbri...</p>
                </div>
            ) : (
                <>
                    {activeTab === 'settlement' && (
                        <>
                            {/* Stats Overview */}
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                                <StatCard
                                    title="Total Akumulasi Iuran"
                                    value={`Rp ${totalNominal.toLocaleString()}`}
                                    icon={<Coins size={24} className="text-blue-600" />}
                                    trend="+12.5%"
                                    trendUp={true}
                                    color="blue"
                                />
                                <StatCard
                                    title="Total Dana THT"
                                    value={`Rp ${totalTht.toLocaleString()}`}
                                    icon={<TrendingUp size={24} className="text-indigo-600" />}
                                    trend="+5.2%"
                                    trendUp={true}
                                    color="indigo"
                                />
                                <StatCard
                                    title="Total Dana Prospens"
                                    value={`Rp ${totalProspens.toLocaleString()}`}
                                    icon={<BarChart3 size={24} className="text-orange-600" />}
                                    trend="+8.1%"
                                    trendUp={true}
                                    color="orange"
                                />
                                <StatCard
                                    title="Rata-rata Peserta"
                                    value={totalPeserta.toLocaleString()}
                                    icon={<Users size={24} className="text-teal-600" />}
                                    trend="-1.2%"
                                    trendUp={false}
                                    color="teal"
                                />
                            </div>

                            {/* Charts Row */}
                            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                                <div className="lg:col-span-2 bg-white p-8 rounded-2xl border border-gray-100 shadow-sm">
                                    <div className="flex items-center justify-between mb-8">
                                        <h3 className="font-extrabold text-gray-900 flex items-center gap-3">
                                            <BarChart3 size={20} className="text-blue-500" /> Tren Iuran Bulanan
                                        </h3>
                                    </div>
                                    <div className="h-[350px]">
                                        <ResponsiveContainer width="100%" height="100%">
                                            <BarChart data={chartData}>
                                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                                                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#9ca3af', fontWeight: 600 }} />
                                                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#9ca3af', fontWeight: 600 }} tickFormatter={(val: number) => `Rp${(val / 1000000).toFixed(0)}Jt`} />
                                                <Tooltip
                                                    cursor={{ fill: '#f8fafc' }}
                                                    contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.1)' }}
                                                    formatter={(value: any) => `Rp ${Number(value || 0).toLocaleString()}`}
                                                />
                                                <Legend iconType="circle" wrapperStyle={{ paddingTop: '30px' }} />
                                                <Bar dataKey="THT" fill="#3b82f6" radius={[6, 6, 0, 0]} barSize={20} />
                                                <Bar dataKey="Prospens" fill="#f97316" radius={[6, 6, 0, 0]} barSize={20} />
                                            </BarChart>
                                        </ResponsiveContainer>
                                    </div>
                                </div>

                                <div className="bg-white p-8 rounded-2xl border border-gray-100 shadow-sm">
                                    <h3 className="font-extrabold text-gray-900 flex items-center gap-3 mb-8">
                                        <PieChartIcon size={20} className="text-orange-500" /> Distribusi Portofolio
                                    </h3>
                                    <div className="h-[280px] relative">
                                        <ResponsiveContainer width="100%" height="100%">
                                            <PieChart>
                                                <Pie
                                                    data={pieData}
                                                    cx="50%"
                                                    cy="50%"
                                                    innerRadius={80}
                                                    outerRadius={110}
                                                    paddingAngle={8}
                                                    dataKey="value"
                                                >
                                                    {pieData.map((entry: any, index: number) => (
                                                        <Cell key={`cell-${index}`} fill={entry.color} />
                                                    ))}
                                                </Pie>
                                                <Tooltip formatter={(value: any) => `Rp ${Number(value || 0).toLocaleString()}`} />
                                            </PieChart>
                                        </ResponsiveContainer>
                                        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                                            <span className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mb-1">Total Dana</span>
                                            <span className="text-2xl font-black text-gray-900 tracking-tighter">
                                                Rp {(totalNominal / 1000000000).toFixed(1)}M
                                            </span>
                                        </div>
                                    </div>
                                    <div className="mt-8 space-y-4">
                                        {pieData.map((item) => (
                                            <div key={item.name} className="flex items-center justify-between p-3 rounded-xl bg-gray-50 border border-gray-100">
                                                <div className="flex items-center gap-3 text-gray-700 font-bold text-sm">
                                                    <div className="w-3 h-3 rounded-full shadow-sm" style={{ backgroundColor: item.color }}></div>
                                                    {item.name}
                                                </div>
                                                <span className="font-black text-gray-900">
                                                    {totalNominal ? ((item.value / totalNominal) * 100).toFixed(1) : 0}%
                                                </span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>

                            {/* Table Section */}
                            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                                <div className="p-8 border-b border-gray-50 flex flex-col md:flex-row md:items-center justify-between gap-6">
                                    <h3 className="font-extrabold text-gray-900 flex items-center gap-3 uppercase tracking-tighter">
                                        <Database size={20} className="text-indigo-500" /> Data Settlement Per-Batch
                                    </h3>
                                    <div className="relative w-full md:w-80">
                                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                                        <input
                                            type="text"
                                            placeholder="Cari Periode / Status..."
                                            className="w-full pl-12 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-2xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all text-gray-900"
                                            value={searchTerm}
                                            onChange={(e) => setSearchTerm(e.target.value)}
                                        />
                                    </div>
                                </div>
                                <div className="p-4">
                                    <DataTable
                                        data={filteredData}
                                        columns={columns}
                                        searchable={false}
                                    />
                                </div>
                            </div>
                        </>
                    )}

                    {activeTab === 'history' && (
                        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 space-y-6">
                            <div className="flex flex-col md:flex-row md:items-end gap-4 max-w-2xl">
                                <div className="flex-1 space-y-1">
                                    <label className="text-xs font-bold text-gray-500 uppercase tracking-tight">NIK Peserta / PN</label>
                                    <div className="relative">
                                        <Users className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                                        <input
                                            type="text"
                                            placeholder="Masukkan NIK Peserta..."
                                            className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all font-medium"
                                            value={searchNik}
                                            onChange={(e) => setSearchNik(e.target.value)}
                                            onKeyPress={(e) => e.key === 'Enter' && fetchHistory()}
                                        />
                                    </div>
                                </div>
                                <button
                                    onClick={fetchHistory}
                                    disabled={searchingHistory || !searchNik}
                                    className="bg-blue-600 text-white px-8 py-2.5 rounded-xl text-sm font-bold hover:bg-blue-700 transition-all shadow-md disabled:bg-gray-300 active:scale-95"
                                >
                                    {searchingHistory ? 'Searching...' : 'Cari History'}
                                </button>
                            </div>

                            {pesertaHistory.length > 0 ? (
                                <div className="animate-in slide-in-from-bottom-4 duration-500">
                                    <h4 className="font-bold text-gray-800 mb-4 flex items-center gap-2">
                                        <TrendingUp size={18} className="text-teal-500" /> Hasil History Iuran untuk: <span className="text-blue-600">{searchNik}</span>
                                    </h4>
                                    <DataTable data={pesertaHistory} columns={historyColumns} searchable={true} />
                                </div>
                            ) : searchNik && !searchingHistory ? (
                                <div className="py-12 flex flex-col items-center text-gray-400">
                                    <Search size={48} className="mb-4 opacity-20" />
                                    <p className="font-medium">Belum ada data history untuk NIK ini.</p>
                                </div>
                            ) : null}
                        </div>
                    )}

                    {activeTab === 'reports' && (
                        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden p-8">
                            <div className="flex items-center gap-3 mb-8">
                                <BarChart3 className="text-orange-500" />
                                <h3 className="text-xl font-extrabold text-gray-900 tracking-tight">Laporan Rekapitulasi Iuran (Bulanan)</h3>
                            </div>
                            <div className="bg-gray-50/50 rounded-2xl border border-gray-100 p-4">
                                <DataTable
                                    data={filteredReportData}
                                    columns={reportColumns}
                                    searchable={true}
                                />
                            </div>
                        </div>
                    )}
                </>
            )}
        </div>
    );
};

export default SettlementIuran;
