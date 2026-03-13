import React, { useState, useEffect } from 'react';
import axios from 'axios';

const AuditTrail: React.FC = () => {
    const [logs, setLogs] = useState<any[]>([]);
    const [total, setTotal] = useState(0);
    const [page, setPage] = useState(1);
    const limit = 50;

    const [filterModul, setFilterModul] = useState('');
    const [filterAction, setFilterAction] = useState('');
    const apiUrl = import.meta.env.VITE_API_URL;

    const fetchLogs = async () => {
        try {
            const token = localStorage.getItem('token');
            const offset = (page - 1) * limit;

            let url = `${apiUrl}/audit?limit=${limit}&offset=${offset}`;
            if (filterModul) url += `&modul=${filterModul}`;
            if (filterAction) url += `&action=${filterAction}`;

            const res = await axios.get(url, {
                headers: { Authorization: `Bearer ${token}` }
            });

            setLogs(res.data.data || []);
            setTotal(res.data.total || 0);
        } catch (error) {
            console.error("Error fetching audit logs", error);
        }
    };

    useEffect(() => {
        fetchLogs();
    }, [page, filterModul, filterAction]);

    return (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 flex flex-col h-full animate-in fade-in">
            {/* Header section */}
            <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50/50 rounded-t-xl">
                <div>
                    <h2 className="text-lg font-bold text-gray-800">Sistem Audit Trail</h2>
                    <p className="text-sm text-gray-500 mt-1">Laporan aktivitas user dan perubahan data untuk mitigasi compliance.</p>
                </div>
                <div className="flex gap-3">
                    <select
                        value={filterModul}
                        onChange={(e) => { setFilterModul(e.target.value); setPage(1); }}
                        className="text-sm border-gray-300 rounded-md shadow-sm focus:border-bri-blue focus:ring-bri-blue py-2 px-3"
                    >
                        <option value="">Semua Modul</option>
                        <option value="Auth">Auth</option>
                        <option value="Approval">Approval</option>
                        <option value="Peserta">Peserta</option>
                        <option value="Finance">Finance</option>
                    </select>

                    <select
                        value={filterAction}
                        onChange={(e) => { setFilterAction(e.target.value); setPage(1); }}
                        className="text-sm border-gray-300 rounded-md shadow-sm focus:border-bri-blue focus:ring-bri-blue py-2 px-3"
                    >
                        <option value="">Semua Aksi</option>
                        <option value="LOGIN">LOGIN</option>
                        <option value="CREATE">CREATE</option>
                        <option value="UPDATE">UPDATE</option>
                        <option value="DELETE">DELETE</option>
                        <option value="SUBMIT">SUBMIT</option>
                        <option value="APPROVE">APPROVE</option>
                        <option value="REJECT">REJECT</option>
                    </select>
                </div>
            </div>

            {/* Table */}
            <div className="flex-1 overflow-auto">
                <table className="w-full text-left text-sm text-gray-600">
                    <thead className="bg-gray-50 text-gray-700 text-xs uppercase font-medium sticky top-0 z-10 shadow-sm border-b border-gray-200">
                        <tr>
                            <th className="px-6 py-4">Waktu</th>
                            <th className="px-6 py-4">User</th>
                            <th className="px-6 py-4">Modul / Aksi</th>
                            <th className="px-6 py-4">IP Address</th>
                            <th className="px-6 py-4">Keterangan / Value Baru</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                        {logs.map((log: any) => (
                            <tr key={log.id_audit} className="hover:bg-blue-50/30 transition-colors">
                                <td className="px-6 py-4 whitespace-nowrap text-xs">
                                    {new Date(log.created_at).toLocaleString('id-ID')}
                                </td>
                                <td className="px-6 py-4">
                                    <span className="font-medium text-gray-800">{log.user_id}</span>
                                </td>
                                <td className="px-6 py-4">
                                    <div className="flex items-center gap-2">
                                        <span className="bg-gray-100 text-gray-600 px-2 py-0.5 rounded text-[10px] font-bold tracking-wider">{log.modul}</span>
                                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold tracking-wider ${log.action === 'DELETE' || log.action === 'REJECT' ? 'bg-red-100 text-red-700' :
                                            log.action === 'CREATE' || log.action === 'APPROVE' ? 'bg-green-100 text-green-700' :
                                                log.action === 'LOGIN' ? 'bg-blue-100 text-blue-700' :
                                                    'bg-orange-100 text-orange-700'
                                            }`}>{log.action}</span>
                                    </div>
                                </td>
                                <td className="px-6 py-4 font-mono text-xs text-gray-500">
                                    {log.ip_address || '-'}
                                </td>
                                <td className="px-6 py-4">
                                    <div className="max-w-md truncate text-xs text-gray-600 font-mono bg-gray-50 p-1.5 rounded border border-gray-100">
                                        {log.new_value || '-'}
                                    </div>
                                </td>
                            </tr>
                        ))}
                        {logs.length === 0 && (
                            <tr>
                                <td colSpan={5} className="px-6 py-8 text-center text-gray-500 italic">Belum ada log aktivitas.</td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>

            {/* Footer Pagination */}
            <div className="p-4 border-t border-gray-100 flex items-center justify-between text-sm text-gray-600 bg-gray-50">
                <div>
                    Menampilkan <span className="font-bold">{logs.length}</span> dari <span className="font-bold">{total}</span> total logs
                </div>
                <div className="flex gap-2">
                    <button
                        disabled={page === 1}
                        onClick={() => setPage(page - 1)}
                        className="px-3 py-1 bg-white border border-gray-300 rounded hover:bg-gray-50 disabled:opacity-50"
                    >
                        Prev
                    </button>
                    <button
                        className="px-3 py-1 bg-white border border-bri-blue text-bri-blue font-bold rounded"
                    >
                        {page}
                    </button>
                    <button
                        disabled={page * limit >= total}
                        onClick={() => setPage(page + 1)}
                        className="px-3 py-1 bg-white border border-gray-300 rounded hover:bg-gray-50 disabled:opacity-50"
                    >
                        Next
                    </button>
                </div>
            </div>
        </div>
    );
};

export default AuditTrail;
