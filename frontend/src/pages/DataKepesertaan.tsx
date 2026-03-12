import React, { useState, useEffect, useMemo } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { Search, Download, ChevronLeft, ChevronRight, Eye, Edit } from 'lucide-react';

const DataKepesertaan: React.FC = () => {
    const { token } = useAuth();
    const [pesertaList, setPesertaList] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isDetailOpen, setIsDetailOpen] = useState(false);
    const [selectedPeserta, setSelectedPeserta] = useState<any>(null);
    const [formData, setFormData] = useState<any>({});
    const [isSaving, setIsSaving] = useState(false);

    // Master Options
    const [optKelompok, setOptKelompok] = useState<any[]>([]);
    const [optKelas, setOptKelas] = useState<any[]>([]);
    const [optBpjs, setOptBpjs] = useState<any[]>([]);
    const [optBrilife, setOptBrilife] = useState<any[]>([]);

    // Table states
    const [searchTerm, setSearchTerm] = useState('');
    const [page, setPage] = useState(1);
    const limit = 20;

    useEffect(() => {
        if (token) {
            fetchPeserta();
            fetchOptions();
        }
    }, [token]);

    const fetchOptions = async () => {
        try {
            const config = { headers: { Authorization: `Bearer ${token}` } };
            const [kelRes, kelBPJS, kelBrilife, kelKelas] = await Promise.all([
                axios.get('http://localhost:3000/api/master/kelompok', config),
                axios.get('http://localhost:3000/api/master/status-bpjs', config),
                axios.get('http://localhost:3000/api/master/status-brilife', config),
                axios.get('http://localhost:3000/api/master/kelas', config)
            ]);
            setOptKelompok(kelRes.data || []);
            setOptBpjs(kelBPJS.data || []);
            setOptBrilife(kelBrilife.data || []);
            setOptKelas(kelKelas.data || []);
        } catch (err) {
            console.error('Error fetching options', err);
        }
    };

    useEffect(() => {
        setPage(1);
    }, [searchTerm]);

    const filteredList = useMemo(() => {
        if (!searchTerm) return pesertaList;
        const lowerSearch = searchTerm.toLowerCase();
        return pesertaList.filter(p =>
            Object.values(p).some(val =>
                String(val !== null && val !== undefined ? val : '').toLowerCase().includes(lowerSearch)
            )
        );
    }, [pesertaList, searchTerm]);

    const totalPages = Math.max(1, Math.ceil(filteredList.length / limit));
    const paginatedList = filteredList.slice((page - 1) * limit, page * limit);

    const handleExport = () => {
        const headers = ["NIK BRI", "Nama Peserta", "NIK KTP", "No KK", "Tempat Lahir", "Tgl Lahir", "Jenis Kelamin", "Status Kawin"];
        const csvContent = [
            headers.join(","),
            ...filteredList.map(p => [
                p.nik_bri || '',
                p.nama_peserta || '',
                p.nik || '',
                p.no_kk || '',
                p.tempat_lahir || '',
                p.tgl_lahir ? new Date(p.tgl_lahir).toISOString().split('T')[0] : '',
                p.jns_kel === '1' ? 'Laki-Laki' : p.jns_kel === '2' ? 'Perempuan' : p.jns_kel || '',
                p.st_kawin === '1' ? 'Belum Kawin' : p.st_kawin === '2' ? 'Kawin' : p.st_kawin === '3' ? 'Cerai' : p.st_kawin || ''
            ].map(v => `"${v}"`).join(","))
        ].join("\n");

        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement("a");
        const url = URL.createObjectURL(blob);
        link.setAttribute("href", url);
        link.setAttribute("download", `data_kepesertaan_${new Date().getTime()}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };
    const fetchPeserta = async () => {
        setLoading(true);
        try {
            const response = await axios.get('http://localhost:3000/api/peserta', {
                headers: { Authorization: `Bearer ${token}` }
            });
            setPesertaList(response.data || []);
        } catch (error) {
            console.error('Error fetching data:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleAdd = () => {
        setSelectedPeserta(null);
        setFormData({});
        setIsModalOpen(true);
    };

    const handleEdit = (p: any) => {
        setSelectedPeserta(p);
        setFormData(p);
        setIsModalOpen(true);
    };

    const handleSave = async () => {
        setIsSaving(true);
        try {
            const config = { headers: { Authorization: `Bearer ${token}` } };

            // Clean up relational nested objects to avoid backend parsing errors
            const payload = { ...formData };
            delete payload.kelompok;
            delete payload.kelas;
            delete payload.status_bpjs;
            delete payload.status_brilife;
            delete payload.created_at;
            delete payload.updated_at;

            // Ensure numeric IDs are properly formatted (cast empty strings to null for integers)
            ['id_kelompok', 'id_kelas', 'status_bpjs_id', 'status_brilife_id'].forEach(key => {
                if (payload[key] === '') payload[key] = null;
                else if (payload[key]) payload[key] = Number(payload[key]);
            });

            // Format dates to RFC3339 for backend Go time.Time parsing
            ['tgl_phk', 'tgl_mutasi', 'tmt_pertanggungan', 'tgl_lahir'].forEach(key => {
                if (payload[key] && typeof payload[key] === 'string' && payload[key].length === 10) {
                    payload[key] = payload[key] + 'T00:00:00Z';
                }
            });

            if (selectedPeserta) {
                // Edit
                await axios.put(`http://localhost:3000/api/peserta/${selectedPeserta.id_peserta}`, payload, config);
            } else {
                // Add
                await axios.post('http://localhost:3000/api/peserta', payload, config);
            }
            alert('Pengajuan berhasil! Menunggu approval dari Checker/Signer.');
            setIsModalOpen(false);
            fetchPeserta();
        } catch (error) {
            console.error('Error saving data:', error);
            alert('Gagal memproses data.');
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <div className="p-6 max-w-7xl mx-auto">
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h2 className="text-2xl font-bold text-gray-800">Data Kepesertaan Lengkap</h2>
                    <p className="text-gray-500 text-sm mt-1">Sesuai format Excel dt_peserta</p>
                </div>
                <div className="flex items-center gap-3">
                    <div className="relative">
                        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                        <input
                            type="text"
                            placeholder="Cari di semua kolom..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="pl-9 pr-4 py-2 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-bri-blue/30 focus:border-bri-blue outline-none w-64 shadow-sm"
                        />
                    </div>
                    <button
                        onClick={handleExport}
                        className="bg-white border border-gray-200 text-gray-700 px-4 py-2 rounded-lg text-sm font-medium hover:bg-gray-50 shadow-sm flex items-center gap-2 transition-colors"
                    >
                        <Download size={16} /> Export CSV
                    </button>
                    <button
                        onClick={handleAdd}
                        className="bg-bri-blue text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-bri-blue/90 shadow-sm transition-colors"
                    >
                        + Tambah Peserta Baru
                    </button>
                </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-x-auto">
                <table className="w-full text-left border-collapse whitespace-nowrap">
                    <thead>
                        <tr className="bg-gray-50 text-gray-500 text-xs uppercase tracking-wider">
                            <th className="px-6 py-4 font-medium">NIK BRI</th>
                            <th className="px-6 py-4 font-medium">Nama Peserta</th>
                            <th className="px-6 py-4 font-medium">NIK KTP</th>
                            <th className="px-6 py-4 font-medium">No KK</th>
                            <th className="px-6 py-4 font-medium">Tempat, Tgl Lahir</th>
                            <th className="px-6 py-4 font-medium">Jenis Kelamin</th>
                            <th className="px-6 py-4 font-medium">Status Kawin</th>
                            <th className="px-6 py-4 font-medium text-right">Aksi</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100 text-sm">
                        {loading ? (
                            <tr><td colSpan={8} className="text-center py-8 text-gray-500 italic">Memproses data...</td></tr>
                        ) : paginatedList.length === 0 ? (
                            <tr><td colSpan={8} className="text-center py-8 text-gray-500">Hasil tidak ditemukan.</td></tr>
                        ) : (
                            paginatedList.map((p) => (
                                <tr key={p.id_peserta} className="hover:bg-gray-50/50 transition-colors">
                                    <td className="px-6 py-4 font-medium text-gray-900">{p.nik_bri}</td>
                                    <td className="px-6 py-4 text-gray-800 font-medium">{p.nama_peserta}</td>
                                    <td className="px-6 py-4 text-gray-600">{p.nik || '-'}</td>
                                    <td className="px-6 py-4 text-gray-600">{p.no_kk || '-'}</td>
                                    <td className="px-6 py-4 text-gray-600">{p.tempat_lahir}, {p.tgl_lahir ? new Date(p.tgl_lahir).toLocaleDateString('id-ID') : '-'}</td>
                                    <td className="px-6 py-4 text-gray-600">{p.jns_kel === '1' ? 'Laki-Laki' : p.jns_kel === '2' ? 'Perempuan' : p.jns_kel || '-'}</td>
                                    <td className="px-6 py-4 text-gray-600">{p.st_kawin === '1' ? 'Belum Kawin' : p.st_kawin === '2' ? 'Kawin' : p.st_kawin === '3' ? 'Cerai' : p.st_kawin || '-'}</td>
                                    <td className="px-6 py-4 text-right">
                                        <div className="flex items-center justify-end gap-3">
                                            <button
                                                onClick={() => { setSelectedPeserta(p); setIsDetailOpen(true); }}
                                                className="text-gray-500 hover:text-gray-800 transition-colors flex items-center gap-1 text-xs font-semibold"
                                                title="View Detail"
                                            >
                                                <Eye size={14} /> View
                                            </button>
                                            <button
                                                onClick={() => handleEdit(p)}
                                                className="text-bri-blue hover:text-blue-800 transition-colors flex items-center gap-1 text-xs font-semibold"
                                                title="Edit Data"
                                            >
                                                <Edit size={14} /> Edit
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
                {/* Pagination Controls */}
                {!loading && filteredList.length > 0 && (
                    <div className="px-6 py-4 border-t border-gray-100 bg-gray-50 flex items-center justify-between">
                        <div className="text-sm text-gray-500">
                            Menampilkan <span className="font-medium text-gray-900">{(page - 1) * limit + 1}</span> hingga <span className="font-medium text-gray-900">{Math.min(page * limit, filteredList.length)}</span> dari <span className="font-medium text-gray-900">{filteredList.length}</span> entri
                        </div>
                        <div className="flex items-center gap-2">
                            <button
                                onClick={() => setPage(p => Math.max(1, p - 1))}
                                disabled={page === 1}
                                className="p-1 rounded bg-white border border-gray-300 text-gray-600 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                            >
                                <ChevronLeft size={18} />
                            </button>
                            <div className="px-3 py-1 text-sm font-medium border border-bri-blue text-bri-blue bg-blue-50/50 rounded">
                                {page} / {totalPages}
                            </div>
                            <button
                                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                                disabled={page === totalPages}
                                className="p-1 rounded bg-white border border-gray-300 text-gray-600 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                            >
                                <ChevronRight size={18} />
                            </button>
                        </div>
                    </div>
                )}
            </div>

            {isModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-5xl overflow-hidden flex flex-col max-h-[90vh]">
                        <div className="px-6 py-4 border-b border-gray-100 bg-gray-50 flex justify-between items-center">
                            <h3 className="text-xl font-bold text-gray-800">{selectedPeserta ? `Edit Data Kepesertaan` : 'Tambah Data Kepesertaan'}</h3>
                            <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-gray-600 text-2xl leading-none">&times;</button>
                        </div>
                        <div className="p-6 overflow-y-auto bg-gray-50/50 space-y-6">

                            {/* Card 1: Data Pribadi */}
                            <div className="bg-white p-5 rounded-xl border border-gray-100 shadow-sm">
                                <h4 className="font-bold text-bri-blue text-sm uppercase mb-4 flex items-center gap-2">
                                    <div className="w-1.5 h-4 bg-bri-blue rounded-full"></div>Data Pribadi
                                </h4>
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                    <div className="md:col-span-2">
                                        <label className="block text-xs font-semibold text-gray-700 mb-1">Nama Peserta</label>
                                        <input type="text" className="w-full border border-gray-200 rounded-lg p-2.5 text-sm focus:ring-2 focus:ring-bri-blue/20 focus:border-bri-blue transition-all" value={formData.nama_peserta || ''} onChange={(e) => setFormData({ ...formData, nama_peserta: e.target.value })} />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-semibold text-gray-700 mb-1">NIK BRI / NIP</label>
                                        <input type="text" className="w-full border border-gray-200 rounded-lg p-2.5 text-sm focus:ring-2 focus:ring-bri-blue/20 focus:border-bri-blue transition-all" value={formData.nik_bri || ''} onChange={(e) => setFormData({ ...formData, nik_bri: e.target.value })} />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-semibold text-gray-700 mb-1">NIK KTP (nik)</label>
                                        <input type="text" className="w-full border border-gray-200 rounded-lg p-2.5 text-sm focus:ring-2 focus:ring-bri-blue/20 focus:border-bri-blue transition-all" value={formData.nik || ''} onChange={(e) => setFormData({ ...formData, nik: e.target.value })} />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-semibold text-gray-700 mb-1">No. KK (no_kk)</label>
                                        <input type="text" className="w-full border border-gray-200 rounded-lg p-2.5 text-sm focus:ring-2 focus:ring-bri-blue/20 focus:border-bri-blue transition-all" value={formData.no_kk || ''} onChange={(e) => setFormData({ ...formData, no_kk: e.target.value })} />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-semibold text-gray-700 mb-1">Tempat Lahir</label>
                                        <input type="text" className="w-full border border-gray-200 rounded-lg p-2.5 text-sm focus:ring-2 focus:ring-bri-blue/20 focus:border-bri-blue transition-all" value={formData.tempat_lahir || ''} onChange={(e) => setFormData({ ...formData, tempat_lahir: e.target.value })} />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-semibold text-gray-700 mb-1">Tgl Lahir</label>
                                        <input type="date" className="w-full border border-gray-200 rounded-lg p-2.5 text-sm focus:ring-2 focus:ring-bri-blue/20 focus:border-bri-blue transition-all" value={formData.tgl_lahir ? new Date(formData.tgl_lahir).toISOString().split('T')[0] : ''} onChange={(e) => setFormData({ ...formData, tgl_lahir: e.target.value })} />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-semibold text-gray-700 mb-1">Jenis Kelamin</label>
                                        <select className="w-full border border-gray-200 rounded-lg p-2.5 text-sm focus:ring-2 focus:ring-bri-blue/20 focus:border-bri-blue transition-all" value={formData.jns_kel || ''} onChange={(e) => setFormData({ ...formData, jns_kel: e.target.value })}>
                                            <option value="">Pilih Kelamin</option>
                                            <option value="1">1=LAKI LAKI</option>
                                            <option value="2">2=PEREMPUAN</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-xs font-semibold text-gray-700 mb-1">Status Kawin</label>
                                        <select className="w-full border border-gray-200 rounded-lg p-2.5 text-sm focus:ring-2 focus:ring-bri-blue/20 focus:border-bri-blue transition-all" value={formData.st_kawin || ''} onChange={(e) => setFormData({ ...formData, st_kawin: e.target.value })}>
                                            <option value="">Pilih Status</option>
                                            <option value="1">1=Belum Kawin</option>
                                            <option value="2">2=Kawin</option>
                                            <option value="3">3=Cerai</option>
                                        </select>
                                    </div>
                                </div>
                            </div>

                            {/* Card 2: Data Kepesertaan Tambahan */}
                            <div className="bg-white p-5 rounded-xl border border-gray-100 shadow-sm">
                                <h4 className="font-bold text-bri-blue text-sm uppercase mb-4 flex items-center gap-2">
                                    <div className="w-1.5 h-4 bg-bri-blue rounded-full"></div>Data Kepesertaan
                                </h4>
                                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                                    <div>
                                        <label className="block text-xs font-semibold text-gray-700 mb-1">Tgl PHK</label>
                                        <input type="date" className="w-full border border-gray-200 rounded-lg p-2.5 text-sm focus:ring-2 focus:ring-bri-blue/20 focus:border-bri-blue transition-all" value={formData.tgl_phk ? new Date(formData.tgl_phk).toISOString().split('T')[0] : ''} onChange={(e) => setFormData({ ...formData, tgl_phk: e.target.value })} />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-semibold text-gray-700 mb-1">Jenis Mutasi</label>
                                        <input type="text" className="w-full border border-gray-200 rounded-lg p-2.5 text-sm focus:ring-2 focus:ring-bri-blue/20 focus:border-bri-blue transition-all" value={formData.jenis_mutasi || ''} onChange={(e) => setFormData({ ...formData, jenis_mutasi: e.target.value })} />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-semibold text-gray-700 mb-1">Tgl Mutasi</label>
                                        <input type="date" className="w-full border border-gray-200 rounded-lg p-2.5 text-sm focus:ring-2 focus:ring-bri-blue/20 focus:border-bri-blue transition-all" value={formData.tgl_mutasi ? new Date(formData.tgl_mutasi).toISOString().split('T')[0] : ''} onChange={(e) => setFormData({ ...formData, tgl_mutasi: e.target.value })} />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-semibold text-gray-700 mb-1">TMT Pertanggungan</label>
                                        <input type="date" className="w-full border border-gray-200 rounded-lg p-2.5 text-sm focus:ring-2 focus:ring-bri-blue/20 focus:border-bri-blue transition-all" value={formData.tmt_pertanggungan ? new Date(formData.tmt_pertanggungan).toISOString().split('T')[0] : ''} onChange={(e) => setFormData({ ...formData, tmt_pertanggungan: e.target.value })} />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-semibold text-gray-700 mb-1">Kelompok</label>
                                        <select className="w-full border border-gray-200 rounded-lg p-2.5 text-sm focus:ring-2 focus:ring-bri-blue/20 focus:border-bri-blue transition-all" value={formData.id_kelompok || ''} onChange={(e) => setFormData({ ...formData, id_kelompok: e.target.value })}>
                                            <option value="">Pilih Kelompok</option>
                                            {optKelompok.map(o => <option key={o.id} value={o.id}>{o.kode} - {o.nama}</option>)}
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-xs font-semibold text-gray-700 mb-1">Kelas</label>
                                        <select className="w-full border border-gray-200 rounded-lg p-2.5 text-sm focus:ring-2 focus:ring-bri-blue/20 focus:border-bri-blue transition-all" value={formData.id_kelas || ''} onChange={(e) => setFormData({ ...formData, id_kelas: e.target.value })}>
                                            <option value="">Pilih Kelas</option>
                                            {optKelas.map(o => <option key={o.id} value={o.id}>{o.kode} - {o.nama}</option>)}
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-xs font-semibold text-gray-700 mb-1">Status BPJS</label>
                                        <select className="w-full border border-gray-200 rounded-lg p-2.5 text-sm focus:ring-2 focus:ring-bri-blue/20 focus:border-bri-blue transition-all" value={formData.status_bpjs_id || ''} onChange={(e) => setFormData({ ...formData, status_bpjs_id: e.target.value })}>
                                            <option value="">Pilih BPJS</option>
                                            {optBpjs.map(o => <option key={o.id} value={o.id}>{o.nama}</option>)}
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-xs font-semibold text-gray-700 mb-1">Status BRI Life</label>
                                        <select className="w-full border border-gray-200 rounded-lg p-2.5 text-sm focus:ring-2 focus:ring-bri-blue/20 focus:border-bri-blue transition-all" value={formData.status_brilife_id || ''} onChange={(e) => setFormData({ ...formData, status_brilife_id: e.target.value })}>
                                            <option value="">Pilih BRI Life</option>
                                            {optBrilife.map(o => <option key={o.id} value={o.id}>{o.nama}</option>)}
                                        </select>
                                    </div>
                                    <div className="md:col-span-2">
                                        <label className="block text-xs font-semibold text-gray-700 mb-1">No Kartu BRI Life</label>
                                        <input type="text" className="w-full border border-gray-200 rounded-lg p-2.5 text-sm focus:ring-2 focus:ring-bri-blue/20 focus:border-bri-blue transition-all" value={formData.no_kartu_brilife || ''} onChange={(e) => setFormData({ ...formData, no_kartu_brilife: e.target.value })} />
                                    </div>
                                </div>
                            </div>

                            {/* Card 3: Alamat & Kontak + Faskes */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="bg-white p-5 rounded-xl border border-gray-100 shadow-sm">
                                    <h4 className="font-bold text-bri-blue text-sm uppercase mb-4 flex items-center gap-2">
                                        <div className="w-1.5 h-4 bg-bri-blue rounded-full"></div>Alamat & Kontak
                                    </h4>
                                    <div className="space-y-4">
                                        <div>
                                            <label className="block text-xs font-semibold text-gray-700 mb-1">Alamat Lengkap</label>
                                            <textarea className="w-full border border-gray-200 rounded-lg p-2.5 text-sm focus:ring-2 focus:ring-bri-blue/20 focus:border-bri-blue transition-all" rows={2} value={formData.alamat || ''} onChange={(e) => setFormData({ ...formData, alamat: e.target.value })} />
                                        </div>
                                        <div className="grid grid-cols-3 gap-3">
                                            <div>
                                                <label className="block text-xs font-semibold text-gray-700 mb-1">RT</label>
                                                <input type="text" className="w-full border border-gray-200 rounded-lg p-2.5 text-sm focus:ring-2 focus:ring-bri-blue/20 focus:border-bri-blue transition-all" value={formData.rt || ''} onChange={(e) => setFormData({ ...formData, rt: e.target.value })} />
                                            </div>
                                            <div>
                                                <label className="block text-xs font-semibold text-gray-700 mb-1">RW</label>
                                                <input type="text" className="w-full border border-gray-200 rounded-lg p-2.5 text-sm focus:ring-2 focus:ring-bri-blue/20 focus:border-bri-blue transition-all" value={formData.rw || ''} onChange={(e) => setFormData({ ...formData, rw: e.target.value })} />
                                            </div>
                                            <div>
                                                <label className="block text-xs font-semibold text-gray-700 mb-1">Kode Pos</label>
                                                <input type="text" className="w-full border border-gray-200 rounded-lg p-2.5 text-sm focus:ring-2 focus:ring-bri-blue/20 focus:border-bri-blue transition-all" value={formData.kd_pos || ''} onChange={(e) => setFormData({ ...formData, kd_pos: e.target.value })} />
                                            </div>
                                        </div>
                                        <div className="grid grid-cols-2 gap-3">
                                            <div>
                                                <label className="block text-xs font-semibold text-gray-700 mb-1">Kecamatan (al_kec)</label>
                                                <input type="text" className="w-full border border-gray-200 rounded-lg p-2.5 text-sm focus:ring-2 focus:ring-bri-blue/20 focus:border-bri-blue transition-all" value={formData.al_kec || ''} onChange={(e) => setFormData({ ...formData, al_kec: e.target.value })} />
                                            </div>
                                            <div>
                                                <label className="block text-xs font-semibold text-gray-700 mb-1">Kelurahan/Desa</label>
                                                <input type="text" className="w-full border border-gray-200 rounded-lg p-2.5 text-sm focus:ring-2 focus:ring-bri-blue/20 focus:border-bri-blue transition-all" value={formData.al_desa || ''} onChange={(e) => setFormData({ ...formData, al_desa: e.target.value })} />
                                            </div>
                                            <div>
                                                <label className="block text-xs font-semibold text-gray-700 mb-1">No Telepon</label>
                                                <input type="text" className="w-full border border-gray-200 rounded-lg p-2.5 text-sm focus:ring-2 focus:ring-bri-blue/20 focus:border-bri-blue transition-all" value={formData.no_telp || ''} onChange={(e) => setFormData({ ...formData, no_telp: e.target.value })} />
                                            </div>
                                            <div>
                                                <label className="block text-xs font-semibold text-gray-700 mb-1">Email</label>
                                                <input type="email" className="w-full border border-gray-200 rounded-lg p-2.5 text-sm focus:ring-2 focus:ring-bri-blue/20 focus:border-bri-blue transition-all" value={formData.email || ''} onChange={(e) => setFormData({ ...formData, email: e.target.value })} />
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <div className="space-y-6">
                                    <div className="bg-white p-5 rounded-xl border border-gray-100 shadow-sm">
                                        <h4 className="font-bold text-bri-blue text-sm uppercase mb-4 flex items-center gap-2">
                                            <div className="w-1.5 h-4 bg-bri-blue rounded-full"></div>Faskes BPJS
                                        </h4>
                                        <div className="space-y-4">
                                            <div>
                                                <label className="block text-xs font-semibold text-gray-700 mb-1">Nama Faskes Tk.I (nm_faskes1)</label>
                                                <input type="text" className="w-full border border-gray-200 rounded-lg p-2.5 text-sm focus:ring-2 focus:ring-bri-blue/20 focus:border-bri-blue transition-all" value={formData.nm_faskes1 || ''} onChange={(e) => setFormData({ ...formData, nm_faskes1: e.target.value })} />
                                            </div>
                                            <div>
                                                <label className="block text-xs font-semibold text-gray-700 mb-1">Nama Dokter Gigi (nm_fasgigi)</label>
                                                <input type="text" className="w-full border border-gray-200 rounded-lg p-2.5 text-sm focus:ring-2 focus:ring-bri-blue/20 focus:border-bri-blue transition-all" value={formData.nm_fasgigi || ''} onChange={(e) => setFormData({ ...formData, nm_fasgigi: e.target.value })} />
                                            </div>
                                        </div>
                                    </div>

                                    <div className="bg-white p-5 rounded-xl border border-gray-100 shadow-sm">
                                        <h4 className="font-bold text-bri-blue text-sm uppercase mb-4 flex items-center gap-2">
                                            <div className="w-1.5 h-4 bg-bri-blue rounded-full"></div>Informasi Lainnya
                                        </h4>
                                        <div className="grid grid-cols-2 gap-4">
                                            <div>
                                                <label className="block text-xs font-semibold text-gray-700 mb-1">NPWP</label>
                                                <input type="text" className="w-full border border-gray-200 rounded-lg p-2.5 text-sm focus:ring-2 focus:ring-bri-blue/20 focus:border-bri-blue transition-all" value={formData.npwp || ''} onChange={(e) => setFormData({ ...formData, npwp: e.target.value })} />
                                            </div>
                                            <div>
                                                <label className="block text-xs font-semibold text-gray-700 mb-1">No Paspor</label>
                                                <input type="text" className="w-full border border-gray-200 rounded-lg p-2.5 text-sm focus:ring-2 focus:ring-bri-blue/20 focus:border-bri-blue transition-all" value={formData.no_paspor || ''} onChange={(e) => setFormData({ ...formData, no_paspor: e.target.value })} />
                                            </div>
                                            <div className="col-span-2">
                                                <label className="block text-xs font-semibold text-gray-700 mb-1">Status Warga Negara</label>
                                                <input type="text" className="w-full border border-gray-200 rounded-lg p-2.5 text-sm focus:ring-2 focus:ring-bri-blue/20 focus:border-bri-blue transition-all" value={formData.st_warga || ''} onChange={(e) => setFormData({ ...formData, st_warga: e.target.value })} />
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div className="px-6 py-4 bg-white border-t border-gray-100 flex justify-end gap-3 rounded-b-2xl">
                            <button onClick={() => setIsModalOpen(false)} className="px-5 py-2.5 text-sm font-semibold text-gray-700 bg-white border border-gray-300 rounded-xl hover:bg-gray-50 transition-colors shadow-sm">Batal</button>
                            <button onClick={handleSave} disabled={isSaving} className="px-5 py-2.5 text-sm font-semibold text-white bg-bri-blue rounded-xl transition-colors shadow-md hover:bg-blue-800 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2">
                                {isSaving ? <span className="animate-pulse">Memproses...</span> : 'Ajukan Approval (Staging)'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {isDetailOpen && selectedPeserta && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl overflow-hidden flex flex-col max-h-[90vh]">
                        <div className="px-6 py-4 border-b border-gray-100 bg-gray-50 flex justify-between items-center">
                            <h3 className="text-lg font-bold text-gray-800">Informasi Detail Kepesertaan</h3>
                            <span className="px-3 py-1 bg-green-100 text-green-700 text-xs font-bold rounded-full">APPROVED DATA</span>
                        </div>
                        <div className="p-6 overflow-y-auto bg-white">
                            <div className="grid grid-cols-2 md:grid-cols-3 gap-y-6 gap-x-8 text-sm">
                                {/* Iterate and format nicely */}
                                {Object.entries(selectedPeserta).filter(([k]) => !['created_at', 'updated_at', 'kelompok', 'kelas', 'status_bpjs', 'status_brilife'].includes(k)).map(([key, val]) => (
                                    <div key={key} className="flex flex-col border-b border-gray-50 pb-2">
                                        <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">{key.replace(/_/g, ' ')}</span>
                                        <span className="text-gray-800 font-medium truncate">
                                            {val === null || val === '' ? '-' : String(val)}
                                        </span>
                                    </div>
                                ))}
                            </div>
                        </div>
                        <div className="px-6 py-4 bg-gray-50 border-t border-gray-100 flex justify-end">
                            <button onClick={() => setIsDetailOpen(false)} className="px-6 py-2 text-sm font-bold text-white bg-gray-600 rounded-lg hover:bg-gray-700 transition-colors shadow-sm">Tutup</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default DataKepesertaan;
