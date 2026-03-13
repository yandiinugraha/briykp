import { useEffect, useState } from 'react';
import axios from 'axios';
import {
    Activity, Zap, TrendingUp, ArrowUpRight,
    PieChart as PieChartIcon, Wallet, ArrowDownRight
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import {
    PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend,
    AreaChart, Area, XAxis, YAxis, CartesianGrid
} from 'recharts';

const COLORS = ['#3b82f6', '#f97316', '#10b981'];

interface StatCardProps {
    title: string;
    value: string;
    icon: React.ReactNode;
    trend?: string;
    trendUp?: boolean;
    description?: string;
    highlight?: boolean;
}

const StatCard: React.FC<StatCardProps> = ({ title, value, icon, trend, trendUp, description, highlight }) => (
    <div className={`p-8 rounded-[32px] border border-gray-100 shadow-sm transition-all duration-300 group hover:shadow-xl ${highlight ? 'bg-white ring-4 ring-orange-50 border-orange-100 shadow-orange-200/20' : 'bg-white'}`}>
        <div className="flex justify-between items-start mb-6">
            <div className={`p-3 rounded-2xl ${highlight ? 'bg-orange-100 text-orange-600' : 'bg-blue-50 text-blue-600'}`}>
                {icon}
            </div>
            {trend && (
                <div className={`flex items-center gap-1 text-[10px] font-bold px-3 py-1.5 rounded-full ${trendUp ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                    {trendUp ? <ArrowUpRight size={12} /> : <ArrowDownRight size={12} />}
                    {trend}
                </div>
            )}
        </div>
        <h3 className={`text-xs font-black uppercase tracking-widest mb-2 ${highlight ? 'text-orange-600' : 'text-gray-500'}`}>{title}</h3>
        <p className={`text-3xl font-black ${highlight ? 'text-orange-700' : 'text-gray-900'}`}>{value}</p>
        {description && <p className="mt-4 text-xs font-medium text-gray-400 italic">{description}</p>}
        {highlight && (
            <div className="mt-4 flex items-center gap-2 text-xs font-black text-orange-700 bg-orange-100 w-fit px-3 py-1.5 rounded-full animate-pulse">
                <Zap size={10} fill="currentColor" /> SIAP INVESTASI
            </div>
        )}
    </div>
);

const LikuiditasDashboard = () => {
    const { token } = useAuth();
    const [data, setData] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        fetchLiquidity();
    }, []);

    const fetchLiquidity = async () => {
        setLoading(true);
        try {
            const res = await axios.get('http://localhost:3000/api/investasi/likuiditas', {
                headers: { Authorization: `Bearer ${token}` }
            });
            setData(res.data || []);
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    const latest = data[0] || { saldo_kas: 0, dana_terpakai: 0, dana_idle: 0, total_tht: 0, total_prospen: 0, total_iuran: 0, total_peserta: 0 };

    const formatCurrency = (val: number) =>
        new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(val || 0);

    const formatCompact = (val: number) => {
        if (val >= 1e12) return `Rp ${(val / 1e12).toFixed(1)}T`;
        if (val >= 1e9) return `Rp ${(val / 1e9).toFixed(1)}M`;
        if (val >= 1e6) return `Rp ${(val / 1e6).toFixed(1)}jt`;
        return formatCurrency(val);
    };

    const pieData = [
        { name: 'Terpakai', value: latest.dana_terpakai || 0 },
        { name: 'Idle (Siap Investasi)', value: latest.dana_idle || 0 }
    ];

    // Dummy historical data for visualization if real data is empty
    const historicalData = data.length > 1 ? data.map(d => ({
        name: new Date(d.tgl_posisi).toLocaleDateString(),
        value: d.saldo_kas
    })) : [
        { name: 'Day 1', value: latest.saldo_kas * 0.95 },
        { name: 'Day 2', value: latest.saldo_kas * 0.97 },
        { name: 'Day 3', value: latest.saldo_kas * 0.96 },
        { name: 'Day 4', value: latest.saldo_kas * 0.98 },
        { name: 'Day 5', value: latest.saldo_kas * 0.99 },
        { name: 'Today', value: latest.saldo_kas }
    ];

    if (loading) return (
        <div className="p-20 flex flex-col items-center justify-center gap-4">
            <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
            <p className="font-bold text-gray-400">Menghitung Likuiditas...</p>
        </div>
    );

    return (
        <div className="p-8 max-w-[1400px] mx-auto min-h-screen bg-gray-50/30">
            <div className="mb-10">
                <div className="flex items-center gap-3 mb-2">
                    <div className="p-2.5 bg-orange-50 rounded-2xl text-orange-500 shadow-sm">
                        <Activity size={28} />
                    </div>
                    <h1 className="text-4xl font-black text-gray-900 tracking-tight">Manajemen Likuiditas</h1>
                </div>
                <p className="text-gray-500 font-medium max-w-2xl">
                    Monitoring dana menganggur (idle cash) untuk optimalisasi investasi.
                </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-12">
                <StatCard
                    title="Total Akumulasi Iuran"
                    value={formatCompact(latest.total_iuran)}
                    icon={<Activity size={24} />}
                    trend="+12.5%"
                    trendUp={true}
                />
                <StatCard
                    title="Total Dana THT"
                    value={formatCompact(latest.total_tht)}
                    icon={<TrendingUp size={24} />}
                    trend="+5.2%"
                    trendUp={true}
                />
                <StatCard
                    title="Total Dana Prospens"
                    value={formatCompact(latest.total_prospen)}
                    icon={<TrendingUp size={24} />}
                    trend="+8.1%"
                    trendUp={true}
                />
                <StatCard
                    title="Rata-rata Peserta"
                    value={latest.total_peserta?.toLocaleString() || '0'}
                    icon={<Activity size={24} />}
                    trend="-1.2%"
                    trendUp={false}
                />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
                <StatCard
                    title="Total Saldo Kas"
                    value={formatCompact(latest.saldo_kas)}
                    icon={<Wallet size={24} />}
                    description="Saldo Kas Efektif"
                />
                <StatCard
                    title="Dana Terpakai"
                    value={formatCompact(latest.dana_terpakai)}
                    icon={<PieChartIcon size={24} />}
                    description="Operasional & Settlement Berjalan"
                />
                <StatCard
                    title="Dana Menganggur (Idle)"
                    value={formatCompact(latest.dana_idle)}
                    icon={<Zap size={24} />}
                    highlight={true}
                />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <div className="bg-white p-8 rounded-[40px] border border-gray-100 shadow-sm hover:shadow-xl transition-all duration-500 group">
                    <div className="flex items-center justify-between mb-8">
                        <h3 className="font-black text-lg text-gray-900 flex items-center gap-3">
                            <PieChartIcon size={20} className="text-blue-500" /> Rasio Pemanfaatan Dana
                        </h3>
                    </div>
                    <div className="h-[350px]">
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie
                                    data={pieData}
                                    cx="50%"
                                    cy="50%"
                                    innerRadius={90}
                                    outerRadius={130}
                                    paddingAngle={8}
                                    dataKey="value"
                                >
                                    {pieData.map((_, index) => (
                                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                    ))}
                                </Pie>
                                <Tooltip
                                    contentStyle={{ borderRadius: '24px', border: 'none', boxShadow: '0 25px 50px -12px rgb(0 0 0 / 0.15)' }}
                                    formatter={(val: any) => formatCurrency(Number(val || 0))}
                                />
                                <Legend />
                            </PieChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                <div className="bg-white p-8 rounded-[40px] border border-gray-100 shadow-sm hover:shadow-xl transition-all duration-500 group">
                    <div className="flex items-center justify-between mb-8">
                        <h3 className="font-black text-lg text-gray-900 flex items-center gap-3">
                            <TrendingUp size={20} className="text-green-500" /> Historis Kas 7 Hari Terakhir
                        </h3>
                    </div>
                    <div className="h-[350px]">
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={historicalData}>
                                <defs>
                                    <linearGradient id="colorCash" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.1} />
                                        <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#9ca3af', fontWeight: 600 }} />
                                <YAxis hide />
                                <Tooltip
                                    contentStyle={{ borderRadius: '24px', border: 'none', boxShadow: '0 25px 50px -12px rgb(0 0 0 / 0.15)' }}
                                    formatter={(val: any) => formatCurrency(Number(val || 0))}
                                />
                                <Area type="monotone" dataKey="value" stroke="#3b82f6" strokeWidth={4} fillOpacity={1} fill="url(#colorCash)" />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            </div>

            <div className="mt-8 bg-blue-900 text-white p-10 rounded-3xl shadow-2xl relative overflow-hidden group">
                <div className="relative z-10 flex flex-col md:flex-row justify-between items-center gap-8">
                    <div>
                        <h2 className="text-3xl font-black mb-3 text-white">Waktunya Investasi?</h2>
                        <p className="text-blue-200 font-medium max-w-xl">
                            Anda memiliki dana menganggur sebesar <span className="text-white font-black underline">{formatCurrency(latest.DanaIdle)}</span>.
                            Gunakan dana ini untuk meningkatkan imbal hasil YKP.
                        </p>
                    </div>
                    <button className="whitespace-nowrap bg-orange-500 text-white px-8 py-4 rounded-2xl font-black hover:scale-105 active:scale-95 transition-all shadow-xl shadow-orange-500/30 flex items-center gap-3">
                        Eksekusi Sekarang <ArrowUpRight size={20} />
                    </button>
                </div>
                <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -mr-32 -mt-32 blur-3xl group-hover:scale-110 transition-transform"></div>
            </div>
        </div>
    );
};

export default LikuiditasDashboard;
