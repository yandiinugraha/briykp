import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';

interface MasterOption {
    id: number;
    nama: string;
}

interface PesertaData {
    id_peserta: string;
    nama_peserta: string;
    nik_bri: string;
    tgl_phk: string;
    jenis_mutasi?: string;
    tgl_mutasi?: string;
    tmt_pertanggungan?: string;
    id_kelompok?: number;
    id_kelas?: number;
    status_bpjs_id?: number;
    status_brilife_id?: number;
    kelompok?: { nama: string };
    kelas?: { nama: string };
    status_bpjs?: { nama: string };
    status_brilife?: { nama: string };
}

const PesertaManagement: React.FC = () => {
    const { user, token } = useAuth();
    const navigate = useNavigate();
    const [activeTab, setActiveTab] = useState<'ALL' | 'ACTIVE' | 'INACTIVE'>('ALL');
    const [searchQuery, setSearchQuery] = useState('');
    const [searchColumn, setSearchColumn] = useState<'all' | 'nama_peserta' | 'nik_bri'>('all');
    const [pesertaList, setPesertaList] = useState<PesertaData[]>([]);
    const [filteredList, setFilteredList] = useState<PesertaData[]>([]);
    const [loading, setLoading] = useState(true);

    // Master Data
    const [kelompokOpts, setKelompokOpts] = useState<MasterOption[]>([]);
    const [kelasOpts, setKelasOpts] = useState<MasterOption[]>([]);
    const [statusBpjsOpts, setStatusBpjsOpts] = useState<MasterOption[]>([]);
    const [statusBrilifeOpts, setStatusBrilifeOpts] = useState<MasterOption[]>([]);

    // Modal State
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isDetailOpen, setIsDetailOpen] = useState(false);
    const [selectedPeserta, setSelectedPeserta] = useState<PesertaData | null>(null);
    const [formData, setFormData] = useState<Partial<PesertaData>>({});
    const [isSaving, setIsSaving] = useState(false);

    // Pagination State
    const [currentPage, setCurrentPage] = useState(1);
    const pageSize = 10;

    useEffect(() => {
        if (token) {
            fetchPeserta();
            fetchMasterData();
        }
    }, [token]);

    const fetchPeserta = async () => {
        if (!token) return;
        setLoading(true);
        try {
            const response = await axios.get('http://localhost:3000/api/peserta', {
                headers: { Authorization: `Bearer ${token}` }
            });
            setPesertaList(response.data || []);
            setFilteredList(response.data || []);
        } catch (error) {
            console.error('Error fetching data:', error);
        } finally {
            setLoading(false);
        }
    };

    const fetchMasterData = async () => {
        if (!token) return;
        try {
            const config = { headers: { Authorization: `Bearer ${token}` } };
            const [k1, k2, b1, b2] = await Promise.all([
                axios.get('http://localhost:3000/api/master/kelompok', config),
                axios.get('http://localhost:3000/api/master/kelas', config),
                axios.get('http://localhost:3000/api/master/status-bpjs', config),
                axios.get('http://localhost:3000/api/master/status-brilife', config)
            ]);
            setKelompokOpts(k1.data);
            setKelasOpts(k2.data);
            setStatusBpjsOpts(b1.data);
            setStatusBrilifeOpts(b2.data);
        } catch (error) {
            console.error('Error fetching master data:', error);
        }
    };

    // Apply Filters and Search
    useEffect(() => {
        let result = [...pesertaList];
        if (activeTab === 'ACTIVE') {
            result = result.filter(p => p.status_bpjs?.nama === 'Aktif');
        } else if (activeTab === 'INACTIVE') {
            result = result.filter(p => p.status_bpjs?.nama !== 'Aktif');
        }
        if (searchQuery) {
            const q = searchQuery.toLowerCase();
            result = result.filter(p => {
                if (searchColumn === 'nama_peserta') return p.nama_peserta.toLowerCase().includes(q);
                if (searchColumn === 'nik_bri') return p.nik_bri.includes(q);
                return p.nama_peserta.toLowerCase().includes(q) || p.nik_bri.includes(q);
            });
        }
        setFilteredList(result);
        setCurrentPage(1); // Reset to page 1 on filter change
    }, [activeTab, searchQuery, searchColumn, pesertaList]);

    // Pagination Logic
    const totalPages = Math.ceil(filteredList.length / pageSize);
    const paginatedList = filteredList.slice((currentPage - 1) * pageSize, currentPage * pageSize);

    const handleEdit = (p: PesertaData) => {
        setSelectedPeserta(p);
        setFormData({
            nama_peserta: p.nama_peserta,
            nik_bri: p.nik_bri,
            id_kelompok: p.id_kelompok,
            id_kelas: p.id_kelas,
            status_bpjs_id: p.status_bpjs_id,
            status_brilife_id: p.status_brilife_id
        });
        setIsModalOpen(true);
    };

    const handleView = (p: PesertaData) => {
        setSelectedPeserta(p);
        setIsDetailOpen(true);
    };

    const handleAdd = () => {
        setSelectedPeserta(null);
        setFormData({
            nama_peserta: '',
            nik_bri: '',
            id_kelompok: kelompokOpts[0]?.id,
            id_kelas: kelasOpts[0]?.id,
            status_bpjs_id: statusBpjsOpts[0]?.id,
            status_brilife_id: statusBrilifeOpts[0]?.id
        });
        setIsModalOpen(true);
    };

    const handleSave = async () => {
        setIsSaving(true);
        try {
            const token = localStorage.getItem('token');
            const config = { headers: { Authorization: `Bearer ${token}` } };

            if (user?.role === 'Staff') {
                // MAKER flow: Create pendaftaran request instead of direct CRUD
                const pendaftaranData = {
                    id_peserta: selectedPeserta ? selectedPeserta.id_peserta : null,
                    jenis_manfaat: selectedPeserta ? 'PEMBARUAN_PESERTA' : 'PENDAFTARAN_PESERTA_BARU',
                    data_baru: JSON.stringify(formData)
                };

                await axios.post('http://localhost:3000/api/approval/submit', pendaftaranData, config);
                alert('Berhasil! Pengajuan telah dikirim ke Approval Workspace untuk diverifikasi oleh Admin (Checker).');
            } else {
                // ADMIN flow: Direct commit (as originally implemented)
                if (selectedPeserta) {
                    await axios.put(`http://localhost:3000/api/peserta/${selectedPeserta.id_peserta}`, formData, config);
                } else {
                    await axios.post('http://localhost:3000/api/peserta', formData, config);
                }
                alert('Data berhasil disimpan secara langsung.');
            }

            setIsModalOpen(false);
            fetchPeserta();
        } catch (error) {
            console.error('Error saving data:', error);
            alert('Terjadi kesalahan saat memproses data.');
        } finally {
            setIsSaving(false);
        }
    };

    const handleDelete = async (id: string) => {
        if (!window.confirm('Apakah Anda yakin ingin menghapus peserta ini?')) return;
        try {
            const token = localStorage.getItem('token');
            await axios.delete(`http://localhost:3000/api/peserta/${id}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            fetchPeserta();
        } catch (error) {
            console.error('Error deleting data:', error);
            alert('Gagal menghapus data.');
        }
    };

    const handleExport = () => {
        const headers = ["ID Peserta", "Nama Peserta", "NIK BRI", "Kelompok", "Kelas", "Status BPJS", "Status BRI Life"];
        const rows = filteredList.map(p => [
            p.id_peserta,
            `"${p.nama_peserta}"`,
            `'${p.nik_bri}`,
            `"${p.kelompok?.nama || '-'}"`,
            `"${p.kelas?.nama || '-'}"`,
            `"${p.status_bpjs?.nama || '-'}"`,
            `"${p.status_brilife?.nama || '-'}"`
        ]);

        const csvContent = "data:text/csv;charset=utf-8,\uFEFF"
            + headers.join(",") + "\n"
            + rows.map(e => e.join(",")).join("\n");

        const encodedUri = encodeURI(csvContent);
        const link = document.createElement("a");
        link.setAttribute("href", encodedUri);
        link.setAttribute("download", `data_peserta_${new Date().toISOString().slice(0, 10)}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    return (
        <>
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h2 className="text-2xl font-bold text-gray-800">Manajemen Peserta</h2>
                    <p className="text-gray-500 text-sm mt-1">Kelola data kepesertaan Prospens YKP BRI</p>
                </div>
                <div className="flex gap-3">
                    <button
                        className="bg-white border border-gray-300 text-gray-700 px-4 py-2 rounded-lg text-sm font-medium hover:bg-gray-50 transition-colors flex items-center gap-2 shadow-sm"
                        onClick={() => navigate('/upload')}
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                        </svg>
                        Upload Excel
                    </button>
                    <button
                        onClick={handleExport}
                        className="bg-white border border-gray-300 text-gray-700 px-4 py-2 rounded-lg text-sm font-medium hover:bg-gray-50 transition-colors flex items-center gap-2 shadow-sm"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                        </svg>
                        Export CSV
                    </button>
                    <button
                        onClick={handleAdd}
                        className="bg-bri-blue text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-bri-blue/90 transition-colors flex items-center gap-2 shadow-sm"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                        </svg>
                        Tambah Peserta
                    </button>
                </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                <div className="border-b border-gray-200 p-4 sm:flex sm:items-center sm:justify-between">
                    <div className="flex space-x-6">
                        {['ALL', 'ACTIVE', 'INACTIVE'].map((t) => (
                            <button
                                key={t}
                                onClick={() => setActiveTab(t as any)}
                                className={`${activeTab === t ? 'border-bri-orange text-bri-orange' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'} whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
                            >
                                {t === 'ALL' ? 'Semua Peserta' : t === 'ACTIVE' ? 'BPJS Aktif' : 'Non-Aktif'}
                            </button>
                        ))}
                    </div>
                    <div className="mt-3 sm:mt-0 sm:ml-4 flex items-center gap-2">
                        <select
                            value={searchColumn}
                            onChange={(e) => setSearchColumn(e.target.value as any)}
                            className="text-sm border-gray-300 rounded-md focus:ring-bri-blue focus:border-bri-blue border px-2 py-2"
                        >
                            <option value="all">Semua Kolom</option>
                            <option value="nama_peserta">Nama</option>
                            <option value="nik_bri">NIK BRI</option>
                        </select>
                        <div className="relative rounded-md shadow-sm max-w-xs">
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                <svg className="h-4 w-4 text-gray-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                                    <path fillRule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clipRule="evenodd" />
                                </svg>
                            </div>
                            <input
                                type="text"
                                className="block w-full rounded-md border-gray-300 pl-10 focus:border-bri-blue focus:ring-bri-blue sm:text-sm py-2 border px-3"
                                placeholder="Cari data..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                            />
                        </div>
                    </div>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-gray-50 text-gray-500 text-xs uppercase tracking-wider">
                                <th className="px-6 py-4 font-medium">NIK BRI</th>
                                <th className="px-6 py-4 font-medium">Nama Peserta</th>
                                <th className="px-6 py-4 font-medium">Kelompok / Kelas</th>
                                <th className="px-6 py-4 font-medium">Status BPJS</th>
                                <th className="px-6 py-4 font-medium">Status BRI Life</th>
                                <th className="px-6 py-4 font-medium text-right">Aksi</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100 text-sm">
                            {loading ? (
                                <tr><td colSpan={6} className="text-center py-8 text-gray-500 italic">Memproses data...</td></tr>
                            ) : paginatedList.length === 0 ? (
                                <tr><td colSpan={6} className="text-center py-8 text-gray-500">Hasil tidak ditemukan.</td></tr>
                            ) : (
                                paginatedList.map((p) => (
                                    <tr key={p.id_peserta} className="hover:bg-gray-50/50 transition-colors">
                                        <td className="px-6 py-4 font-medium text-gray-900">{p.nik_bri}</td>
                                        <td className="px-6 py-4 text-gray-800 font-medium">
                                            {p.nama_peserta}
                                            <div className="text-xs text-gray-500 font-normal">{p.id_peserta.slice(0, 8)}...</div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="text-gray-800">{p.kelompok?.nama || '-'}</div>
                                            <div className="text-gray-500 text-xs">{p.kelas?.nama || '-'}</div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${p.status_bpjs?.nama === 'Aktif' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>
                                                {p.status_bpjs?.nama || 'Unknown'}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${p.status_brilife?.nama === 'Aktif' ? 'bg-blue-100 text-blue-800' : 'bg-gray-100 text-gray-800'}`}>
                                                {p.status_brilife?.nama || 'Unknown'}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-right flex items-center justify-end gap-2">
                                            <button onClick={() => handleView(p)} className="p-1.5 text-gray-500 hover:text-bri-blue hover:bg-blue-50 rounded-lg transition-colors" title="Lihat Detail">
                                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                                </svg>
                                            </button>
                                            <button onClick={() => handleEdit(p)} className="p-1.5 text-bri-blue hover:text-bri-dark hover:bg-blue-50 rounded-lg transition-colors" title="Edit Data">
                                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                                </svg>
                                            </button>
                                            <button onClick={() => handleDelete(p.id_peserta)} className="p-1.5 text-red-500 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors" title="Hapus Data">
                                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                                </svg>
                                            </button>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Pagination Controls */}
                {!loading && filteredList.length > 0 && (
                    <div className="px-6 py-4 bg-gray-50 border-t border-gray-100 flex items-center justify-between">
                        <div className="text-sm text-gray-500">
                            Menampilkan <span className="font-medium">{(currentPage - 1) * pageSize + 1}</span> - <span className="font-medium">{Math.min(currentPage * pageSize, filteredList.length)}</span> dari <span className="font-medium">{filteredList.length}</span> data
                        </div>
                        <div className="flex gap-2">
                            <button
                                onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                                disabled={currentPage === 1}
                                className={`px-3 py-1 border rounded-md text-sm font-medium transition-colors ${currentPage === 1 ? 'bg-gray-100 text-gray-400 cursor-not-allowed' : 'bg-white text-gray-700 hover:bg-gray-50'}`}
                            >
                                Prev
                            </button>
                            {/* Simple pagination numbers */}
                            {Array.from({ length: totalPages }, (_, i) => i + 1).map((pNum) => (
                                <button
                                    key={pNum}
                                    onClick={() => setCurrentPage(pNum)}
                                    className={`px-3 py-1 border rounded-md text-sm font-medium transition-colors ${currentPage === pNum ? 'bg-bri-blue text-white shadow-sm' : 'bg-white text-gray-700 hover:bg-gray-50'}`}
                                >
                                    {pNum}
                                </button>
                            ))}
                            <button
                                onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                                disabled={currentPage === totalPages}
                                className={`px-3 py-1 border rounded-md text-sm font-medium transition-colors ${currentPage === totalPages ? 'bg-gray-100 text-gray-400 cursor-not-allowed' : 'bg-white text-gray-700 hover:bg-gray-50'}`}
                            >
                                Next
                            </button>
                        </div>
                    </div>
                )}
            </div>

            {/* Modal for Add / Edit */}
            {isModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh]">
                        <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50">
                            <h3 className="text-lg font-bold text-gray-800">{selectedPeserta ? `Edit Peserta` : 'Tambah Peserta Baru'}</h3>
                            <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-gray-600">
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                        </div>
                        <div className="p-6 overflow-y-auto space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Nama Peserta</label>
                                <input
                                    type="text"
                                    className="block w-full rounded-lg border-gray-300 shadow-sm focus:border-bri-blue focus:ring-bri-blue sm:text-sm border py-2 px-3"
                                    value={formData.nama_peserta || ''}
                                    onChange={(e) => setFormData({ ...formData, nama_peserta: e.target.value })}
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">NIK BRI</label>
                                <input
                                    type="text"
                                    className="block w-full rounded-lg border-gray-300 shadow-sm focus:border-bri-blue focus:ring-bri-blue sm:text-sm border py-2 px-3"
                                    value={formData.nik_bri || ''}
                                    onChange={(e) => setFormData({ ...formData, nik_bri: e.target.value })}
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Tanggal PHK</label>
                                    <input
                                        type="date"
                                        className="block w-full rounded-lg border-gray-300 shadow-sm focus:border-bri-blue focus:ring-bri-blue sm:text-sm border py-2 px-3"
                                        value={formData.tgl_phk ? new Date(formData.tgl_phk).toISOString().split('T')[0] : ''}
                                        onChange={(e) => setFormData({ ...formData, tgl_phk: e.target.value })}
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Jenis Mutasi</label>
                                    <select
                                        className="block w-full rounded-lg border-gray-300 shadow-sm focus:border-bri-blue focus:ring-bri-blue sm:text-sm border py-2 px-3"
                                        value={formData.jenis_mutasi || ''}
                                        onChange={(e) => setFormData({ ...formData, jenis_mutasi: e.target.value })}
                                    >
                                        <option value="">Pilih Jenis Mutasi</option>
                                        <option value="PHK Normal">PHK Normal</option>
                                        <option value="PHK Dini">PHK Dini</option>
                                        <option value="Janda/Duda">Janda/Duda</option>
                                        <option value="Anak">Anak</option>
                                        <option value="Meninggal Dunia">Meninggal Dunia</option>
                                    </select>
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Tanggal Mutasi</label>
                                    <input
                                        type="date"
                                        className="block w-full rounded-lg border-gray-300 shadow-sm focus:border-bri-blue focus:ring-bri-blue sm:text-sm border py-2 px-3"
                                        value={formData.tgl_mutasi ? new Date(formData.tgl_mutasi).toISOString().split('T')[0] : ''}
                                        onChange={(e) => setFormData({ ...formData, tgl_mutasi: e.target.value })}
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">TMT Pertanggungan</label>
                                    <input
                                        type="date"
                                        className="block w-full rounded-lg border-gray-300 shadow-sm focus:border-bri-blue focus:ring-bri-blue sm:text-sm border py-2 px-3"
                                        value={formData.tmt_pertanggungan ? new Date(formData.tmt_pertanggungan).toISOString().split('T')[0] : ''}
                                        onChange={(e) => setFormData({ ...formData, tmt_pertanggungan: e.target.value })}
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Kelompok</label>
                                    <select
                                        className="block w-full rounded-lg border-gray-300 shadow-sm focus:border-bri-blue focus:ring-bri-blue sm:text-sm border py-2 px-3"
                                        value={formData.id_kelompok || ''}
                                        onChange={(e) => setFormData({ ...formData, id_kelompok: Number(e.target.value) })}
                                    >
                                        {kelompokOpts.map(o => <option key={o.id} value={o.id}>{o.nama}</option>)}
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Kelas</label>
                                    <select
                                        className="block w-full rounded-lg border-gray-300 shadow-sm focus:border-bri-blue focus:ring-bri-blue sm:text-sm border py-2 px-3"
                                        value={formData.id_kelas || ''}
                                        onChange={(e) => setFormData({ ...formData, id_kelas: Number(e.target.value) })}
                                    >
                                        {kelasOpts.map(o => <option key={o.id} value={o.id}>{o.nama}</option>)}
                                    </select>
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Status BPJS</label>
                                    <select
                                        className="block w-full rounded-lg border-gray-300 shadow-sm focus:border-bri-blue focus:ring-bri-blue sm:text-sm border py-2 px-3"
                                        value={formData.status_bpjs_id || ''}
                                        onChange={(e) => setFormData({ ...formData, status_bpjs_id: Number(e.target.value) })}
                                    >
                                        {statusBpjsOpts.map(o => <option key={o.id} value={o.id}>{o.nama}</option>)}
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Status BRI Life</label>
                                    <select
                                        className="block w-full rounded-lg border-gray-300 shadow-sm focus:border-bri-blue focus:ring-bri-blue sm:text-sm border py-2 px-3"
                                        value={formData.status_brilife_id || ''}
                                        onChange={(e) => setFormData({ ...formData, status_brilife_id: Number(e.target.value) })}
                                    >
                                        {statusBrilifeOpts.map(o => <option key={o.id} value={o.id}>{o.nama}</option>)}
                                    </select>
                                </div>
                            </div>
                        </div>
                        <div className="px-6 py-4 bg-gray-50 border-t border-gray-100 flex justify-end gap-3">
                            <button
                                onClick={() => setIsModalOpen(false)}
                                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                            >Batal</button>
                            <button
                                onClick={handleSave}
                                disabled={isSaving}
                                className={`px-4 py-2 text-sm font-medium text-white bg-bri-blue rounded-lg transition-colors shadow-md ${isSaving ? 'opacity-50 cursor-not-allowed' : 'hover:bg-blue-800'}`}
                            >
                                {isSaving ? 'Memproses...' : (user?.role === 'Staff' ? 'Ajukan Persetujuan' : 'Simpan Perubahan')}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Modal for Detail View */}
            {isDetailOpen && selectedPeserta && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh]">
                        <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-bri-blue text-white">
                            <h3 className="text-lg font-bold">Detail Data Peserta</h3>
                            <button onClick={() => setIsDetailOpen(false)} className="text-white/80 hover:text-white transition-colors">
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                        </div>
                        <div className="p-8 overflow-y-auto">
                            <div className="flex items-center gap-6 mb-8">
                                <div className="w-20 h-20 bg-gray-100 rounded-2xl flex items-center justify-center text-bri-blue">
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                                    </svg>
                                </div>
                                <div>
                                    <h2 className="text-2xl font-bold text-gray-900">{selectedPeserta.nama_peserta}</h2>
                                    <p className="text-bri-orange font-medium">NIK BRI: {selectedPeserta.nik_bri}</p>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-8">
                                <div className="space-y-4">
                                    <div>
                                        <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">ID Peserta Sistem</label>
                                        <p className="text-gray-900 font-medium">{selectedPeserta.id_peserta}</p>
                                    </div>
                                    <div>
                                        <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">Kelompok Prospens</label>
                                        <p className="text-gray-900 font-medium">{selectedPeserta.kelompok?.nama || '-'}</p>
                                    </div>
                                    <div>
                                        <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">Kelas Layanan</label>
                                        <p className="text-gray-900 font-medium">{selectedPeserta.kelas?.nama || '-'}</p>
                                    </div>
                                </div>
                                <div className="space-y-4">
                                    <div>
                                        <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">Status BPJS</label>
                                        <div>
                                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold mt-1 ${selectedPeserta.status_bpjs?.nama === 'Aktif' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>
                                                {selectedPeserta.status_bpjs?.nama || '-'}
                                            </span>
                                        </div>
                                    </div>
                                    <div>
                                        <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">Status BRI Life</label>
                                        <div>
                                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold mt-1 ${selectedPeserta.status_brilife?.nama === 'Aktif' ? 'bg-blue-100 text-blue-800' : 'bg-gray-100 text-gray-800'}`}>
                                                {selectedPeserta.status_brilife?.nama || '-'}
                                            </span>
                                        </div>
                                    </div>
                                    <div>
                                        <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">Tanggal PHK / Pensiun</label>
                                        <p className="text-gray-900 font-medium">{selectedPeserta.tgl_phk ? new Date(selectedPeserta.tgl_phk).toLocaleDateString('id-ID') : '-'}</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div className="px-6 py-4 border-t border-gray-100 flex justify-end bg-gray-50">
                            <button
                                onClick={() => setIsDetailOpen(false)}
                                className="px-6 py-2 text-sm font-bold text-white bg-bri-blue rounded-lg hover:bg-blue-700 shadow-md transition-all active:scale-95"
                            >Tutup Detail</button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
};

export default PesertaManagement;
