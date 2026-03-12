import React, { useState, useEffect } from 'react';
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
    Search
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

const SettlementIuran: React.FC = () => {
    const { token } = useAuth();
    const [data, setData] = useState<SettlementData[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');

    const headers = { Authorization: `Bearer ${token}` };

    const fetchData = async () => {
        setLoading(true);
        try {
            const res = await axios.get(API, { headers });
            setData(res.data || []);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchData(); }, []);

    const totalNominal = data.reduce((sum, item) => sum + item.total_tht + item.total_prospens, 0);
    const totalTht = data.reduce((sum, item) => sum + item.total_tht, 0);
    const totalProspens = data.reduce((sum, item) => sum + item.total_prospens, 0);
    const totalPeserta = data.length > 0 ? (data[0].count_tht + data[0].count_prospens) / 2 : 0; // Avg last month approx

    const chartData = data.slice(0, 6).reverse().map(item => ({
        name: `${MONTHS[item.bulan - 1].substring(0, 3)} ${item.tahun}`,
        THT: item.total_tht,
        Prospens: item.total_prospens
    }));

    const pieData = [
        { name: 'THT', value: totalTht, color: '#3b82f6' },
        { name: 'Prospens', value: totalProspens, color: '#f97316' }
    ];

    const columns: ColumnDef<SettlementData>[] = [
        {
            header: 'Periode',
            accessor: (row) => `${MONTHS[row.bulan - 1]} ${row.tahun}`,
            id: 'periode'
        },
        {
            header: 'Total Peserta',
            accessor: (row) => (
                <div className="flex flex-col">
                    <span className="text-xs text-blue-600 font-medium">{row.count_tht.toLocaleString()} THT</span>
                    <span className="text-xs text-orange-600 font-medium">{row.count_prospens.toLocaleString()} Prospens</span>
                </div>
            ),
            id: 'peserta'
        },
        {
            header: 'Nominal THT',
            accessor: (row) => `Rp ${row.total_tht.toLocaleString()}`,
            id: 'nominal_tht'
        },
        {
            header: 'Nominal Prospens',
            accessor: (row) => `Rp ${row.total_prospens.toLocaleString()}`,
            id: 'nominal_prospens'
        },
        {
            header: 'Total Dana Masuk',
            accessor: (row) => (
                <span className="font-bold text-gray-800 text-sm">
                    Rp ${(row.total_tht + row.total_prospens).toLocaleString()}
                </span>
            ),
            id: 'total'
        },
        {
            header: 'Status',
            accessor: () => <span className="px-2 py-1 rounded-full bg-green-100 text-green-700 text-[10px] font-bold">SETTLED</span>,
            id: 'status'
        }
    ];

    return (
        <div className="p-6 max-w-7xl mx-auto space-y-8 animate-in fade-in duration-500">
            {/* Header Section */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h2 className="text-3xl font-extrabold text-gray-900 tracking-tight">Settlement Iuran</h2>
                    <p className="text-gray-500 mt-1 flex items-center gap-2">
                        <Calendar size={14} /> Ringkasan dana masuk dari iuran THT & Prospens yang telah disetujui.
                    </p>
                </div>
                <div className="flex items-center gap-3">
                    <button className="flex items-center gap-2 bg-white border border-gray-200 px-4 py-2 rounded-xl text-sm font-semibold text-gray-700 hover:bg-gray-50 transition-all shadow-sm">
                        <Download size={16} /> Export Laporan
                    </button>
                    <button onClick={fetchData} className="bg-blue-600 text-white px-6 py-2 rounded-xl text-sm font-bold hover:bg-blue-700 transition-all shadow-md active:scale-95">
                        Refresh Data
                    </button>
                </div>
            </div>

            {loading ? (
                <div className="flex flex-col items-center justify-center py-20 bg-white rounded-2xl border border-gray-100">
                    <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mb-4"></div>
                    <p className="text-gray-500 font-medium tracking-wide">Menghubungkan ke pusat data ykpbri...</p>
                </div>
            ) : (
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
                        {/* Bar Chart - Trend */}
                        <div className="lg:col-span-2 bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
                            <div className="flex items-center justify-between mb-6">
                                <h3 className="font-bold text-gray-800 flex items-center gap-2">
                                    <BarChart3 size={18} className="text-blue-500" /> Tren Iuran 6 Bulan Terakhir
                                </h3>
                                <div className="text-xs text-gray-400 font-medium uppercase tracking-wider">Nominal dalam Rupiah</div>
                            </div>
                            <div className="h-[300px]">
                                <ResponsiveContainer width="100%" height="100%">
                                    <BarChart data={chartData}>
                                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                                        <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#9ca3af' }} />
                                        <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#9ca3af' }} tickFormatter={(val: number) => `Rp${(val / 1000000).toFixed(0)}M`} />
                                        <Tooltip
                                            contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                                            formatter={(value: any) => `Rp ${value.toLocaleString()}`}
                                        />
                                        <Legend iconType="circle" wrapperStyle={{ paddingTop: '20px' }} />
                                        <Bar dataKey="THT" fill="#3b82f6" radius={[4, 4, 0, 0]} barSize={24} />
                                        <Bar dataKey="Prospens" fill="#f97316" radius={[4, 4, 0, 0]} barSize={24} />
                                    </BarChart>
                                </ResponsiveContainer>
                            </div>
                        </div>

                        {/* Pie Chart - Distribution */}
                        <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
                            <h3 className="font-bold text-gray-800 flex items-center gap-2 mb-6">
                                <PieChartIcon size={18} className="text-orange-500" /> Distribusi Portofolio
                            </h3>
                            <div className="h-[250px] relative">
                                <ResponsiveContainer width="100%" height="100%">
                                    <PieChart>
                                        <Pie
                                            data={pieData}
                                            cx="50%"
                                            cy="50%"
                                            innerRadius={70}
                                            outerRadius={90}
                                            paddingAngle={5}
                                            dataKey="value"
                                        >
                                            {pieData.map((entry, index) => (
                                                <Cell key={`cell-${index}`} fill={entry.color} />
                                            ))}
                                        </Pie>
                                        <Tooltip formatter={(value: any) => `Rp ${value.toLocaleString()}`} />
                                    </PieChart>
                                </ResponsiveContainer>
                                <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                                    <span className="text-[10px] font-bold text-gray-400 uppercase">Total Dana</span>
                                    <span className="text-lg font-extrabold text-gray-800">
                                        Rp {(totalNominal / 1000000000).toFixed(1)}M
                                    </span>
                                </div>
                            </div>
                            <div className="mt-4 space-y-2">
                                {pieData.map((item) => (
                                    <div key={item.name} className="flex items-center justify-between text-sm">
                                        <div className="flex items-center gap-2 text-gray-600 font-medium">
                                            <div className="w-2 h-2 rounded-full" style={{ backgroundColor: item.color }}></div>
                                            {item.name}
                                        </div>
                                        <span className="font-bold text-gray-800">
                                            {totalNominal ? ((item.value / totalNominal) * 100).toFixed(1) : 0}%
                                        </span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Table Section */}
                    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                        <div className="p-6 border-b border-gray-50 flex flex-col md:flex-row md:items-center justify-between gap-4">
                            <h3 className="font-bold text-gray-800 flex items-center gap-2">
                                <Database size={18} className="text-indigo-500" /> Data Settlement Per-Batch
                            </h3>
                            <div className="relative w-full md:w-64">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                                <input
                                    type="text"
                                    placeholder="Cari Batch / Periode..."
                                    className="w-full pl-10 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all text-gray-700"
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                />
                            </div>
                        </div>
                        <div className="p-4 bg-gray-50/50">
                            <DataTable
                                data={data.filter(d => `${MONTHS[d.bulan - 1]} ${d.tahun}`.toLowerCase().includes(searchTerm.toLowerCase()))}
                                columns={columns}
                                searchable={false}
                            />
                        </div>
                    </div>
                </>
            )}
        </div>
    );
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
                <div className={`p-3 rounded-xl ${colorClasses[color]} group-hover:scale-110 transition-transform`}>
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

export default SettlementIuran;

const Database = ({ size, className }: any) => <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><ellipse cx="12" cy="5" rx="9" ry="3"></ellipse><path d="M21 12c0 1.66-4 3-9 3s-9-1.34-9-3"></path><path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5"></path></svg>;
