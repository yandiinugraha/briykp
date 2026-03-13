import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';

const ApprovalWorkspace: React.FC = () => {
    const { user } = useAuth();

    // Determine default role based on user.role
    const getInitialRole = () => {
        if (user?.role === 'Super Admin') return 'SIGNER';
        if (user?.role === 'Admin') return 'CHECKER';
        return 'MAKER';
    };

    // Demo Role state - switchable for demonstration, but defaulted correctly
    const [roleMode, setRoleMode] = useState<'MAKER' | 'CHECKER' | 'SIGNER'>(getInitialRole());

    useEffect(() => {
        setRoleMode(getInitialRole());
    }, [user]);

    // Tickets State
    const [tickets, setTickets] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    const [searchQuery, setSearchQuery] = useState('');
    const [searchColumn, setSearchColumn] = useState<'id' | 'person' | 'all'>('all');
    const [currentPage, setCurrentPage] = useState(1);
    const pageSize = 4;

    const [selectedId, setSelectedId] = useState('');
    const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
    const [catatan, setCatatan] = useState('');
    const apiUrl = import.meta.env.VITE_API_URL;
    const storageUrl = import.meta.env.VITE_STORAGE_URL;

    useEffect(() => {
        fetchTickets();
    }, []);

    const fetchTickets = async () => {
        setLoading(true);
        try {
            const token = localStorage.getItem('token');
            const res = await axios.get(`${apiUrl}/approval/pendaftaran`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            const mapped = res.data.map((item: any) => {
                let parsedData = null;
                try {
                    if (item.data_baru) parsedData = JSON.parse(item.data_baru);
                } catch (e) {
                    console.error('Failed to parse data_baru', e);
                }

                let personName = item.peserta?.nama_peserta || parsedData?.nama_peserta || 'Peserta Baru';
                let personNik = item.peserta?.nik_bri || parsedData?.nik_bri || '-';

                // Handle Array for Batch BPJS/Brilife registration
                if (Array.isArray(parsedData)) {
                    personName = `Batch Registration (${parsedData.length} records)`;
                    personNik = '-';
                }

                // Handle BPJS Feedback processing
                if (item.jenis_manfaat === 'FEEDBACK_BPJS') {
                    personName = `File: ${parsedData?.filename || 'Unknown File'}`;
                    personNik = `${Math.round((parsedData?.size || 0) / 1024)} KB`;
                }

                return {
                    id: item.id_pengajuan,
                    type: item.jenis_manfaat,
                    person: personName,
                    nik: personNik,
                    time: new Date(item.tgl_pengajuan).toLocaleDateString('id-ID'),
                    status: item.status_approval,
                    category: item.jenis_manfaat.includes('PENDAFTARAN') || item.jenis_manfaat.includes('DAFTAR') ? 'Pendaftaran' : 'Perubahan',
                    rawData: parsedData, // Store for detail view
                    lampirans: item.lampirans || [],
                    approval_logs: item.approval_logs || []
                };
            });
            setTickets(mapped);
            if (mapped.length > 0 && !selectedId) {
                setSelectedId(mapped[0].id);
            }
        } catch (error) {
            console.error('Error fetching tickets:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleAction = async (action: 'APPROVE' | 'REJECT') => {
        if (!selectedId) return;
        try {
            const token = localStorage.getItem('token');
            await axios.post(`${apiUrl}/approval`, {
                id_transaksi: selectedId,
                action: action,
                catatan: catatan
            }, {
                headers: { Authorization: `Bearer ${token}` }
            });
            alert(`Berhasil: ${action === 'APPROVE' ? 'Persetujuan' : 'Penolakan'} diproses.`);
            setCatatan('');
            fetchTickets(); // Refresh
        } catch (error) {
            console.error('Error processing approval:', error);
            alert('Gagal memproses approval.');
        }
    };

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (!e.target.files || e.target.files.length === 0 || !selectedId) return;
        const file = e.target.files[0];
        const formData = new FormData();
        formData.append('file', file);
        formData.append('id_pengajuan', selectedId);

        try {
            const token = localStorage.getItem('token');
            await axios.post(`${apiUrl}/approval/lampiran`, formData, {
                headers: {
                    Authorization: `Bearer ${token}`,
                    'Content-Type': 'multipart/form-data'
                }
            });
            alert('File berhasil diunggah.');
            fetchTickets();
        } catch (error) {
            console.error('Error uploading file:', error);
            alert('Gagal mengunggah file.');
        }
    };

    const handleDeleteFile = async (lampiranId: number) => {
        if (!window.confirm("Yakin ingin menghapus dokumen ini?")) return;
        try {
            const token = localStorage.getItem('token');
            await axios.delete(`${apiUrl}/approval/lampiran/${lampiranId}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            fetchTickets();
        } catch (error) {
            console.error('Error deleting file:', error);
            alert('Gagal menghapus file.');
        }
    };

    // Filter Logic
    const filteredTickets = tickets.filter(t => {
        // Enforce role-based viewing of status
        if (roleMode === 'CHECKER' && t.status !== 'PENDING_CHECKER') return false;
        if (roleMode === 'SIGNER' && t.status !== 'PENDING_SIGNER') return false;
        if (roleMode === 'MAKER' && t.status !== 'REJECTED' && t.status !== 'PENDING_CHECKER') return false;

        const q = searchQuery.toLowerCase();
        if (searchColumn === 'id') return t.id.toLowerCase().includes(q);
        if (searchColumn === 'person') return t.person.toLowerCase().includes(q);
        return t.id.toLowerCase().includes(q) || t.person.toLowerCase().includes(q) || t.type.toLowerCase().includes(q);
    });

    const paginatedTickets = filteredTickets.slice((currentPage - 1) * pageSize, currentPage * pageSize);
    const totalPages = Math.ceil(filteredTickets.length / pageSize);

    const activeTicket = tickets.find(t => t.id === selectedId) || tickets[0] || {
        id: '-',
        type: 'Tidak ada data',
        person: '-',
        nik: '-',
        time: '-',
        status: '-',
        category: '-',
        lampirans: [],
        approval_logs: []
    };

    const handleExport = () => {
        const headers = ["ID Pengajuan", "Jenis", "Nama Peserta", "NIK", "Waktu", "Status"];
        const rows = filteredTickets.map(t => [
            t.id, t.type, t.person, `'${t.nik}`, t.time, t.status
        ]);
        const csvContent = "data:text/csv;charset=utf-8,\uFEFF" + headers.join(",") + "\n" + rows.map(e => e.join(",")).join("\n");
        const encodedUri = encodeURI(csvContent);
        const link = document.createElement("a");
        link.setAttribute("href", encodedUri);
        link.setAttribute("download", `data_pengajuan_${new Date().toISOString().slice(0, 10)}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    return (
        <>
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h2 className="text-2xl font-bold text-gray-800">Approval Workspace</h2>
                    <p className="text-gray-500 text-sm mt-1">
                        Modul <span className="font-semibold text-bri-blue">{roleMode}</span> untuk verifikasi dan persetujuan
                    </p>
                </div>

                {/* Helper to switch roles during demo */}
                <div className="flex bg-white rounded-lg border border-gray-200 p-1 shadow-sm">
                    <button
                        onClick={() => setRoleMode('MAKER')}
                        className={`px-3 py-1 text-xs font-medium rounded-md transition-colors ${roleMode === 'MAKER' ? 'bg-gray-100 text-gray-800' : 'text-gray-500 hover:text-gray-700'}`}
                    >View as Maker</button>
                    <button
                        onClick={() => setRoleMode('CHECKER')}
                        className={`px-3 py-1 text-xs font-medium rounded-md transition-colors ${roleMode === 'CHECKER' ? 'bg-gray-100 text-gray-800' : 'text-gray-500 hover:text-gray-700'}`}
                    >View as Checker</button>
                    <button
                        onClick={() => setRoleMode('SIGNER')}
                        className={`px-3 py-1 text-xs font-medium rounded-md transition-colors ${roleMode === 'SIGNER' ? 'bg-gray-100 text-gray-800' : 'text-gray-500 hover:text-gray-700'}`}
                    >View as Signer</button>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

                <div className="lg:col-span-1 bg-white rounded-xl shadow-sm border border-gray-200 flex flex-col h-[700px]">
                    <div className="p-4 border-b border-gray-100 bg-gray-50/50 rounded-t-xl space-y-3">
                        <div className="flex justify-between items-center">
                            <h3 className="text-sm font-bold text-gray-700">Daftar Antrian ({filteredTickets.length})</h3>
                            <button onClick={handleExport} className="text-[10px] bg-white border border-gray-300 px-2 py-1 rounded hover:bg-gray-50 font-bold transition-colors">Export CSV</button>
                        </div>
                        <div className="flex gap-2">
                            <select
                                value={searchColumn}
                                onChange={(e) => setSearchColumn(e.target.value as any)}
                                className="text-[10px] border-gray-300 rounded px-1 py-1 bg-white focus:ring-bri-blue border shadow-sm"
                            >
                                <option value="all">Semua</option>
                                <option value="id">ID</option>
                                <option value="person">Nama</option>
                            </select>
                            <div className="relative flex-1">
                                <input
                                    type="text"
                                    className="block w-full rounded border-gray-300 py-1.5 px-3 focus:border-bri-blue focus:ring-bri-blue text-xs border bg-white"
                                    placeholder="Cari..."
                                    value={searchQuery}
                                    onChange={(e) => {
                                        setSearchQuery(e.target.value);
                                        setCurrentPage(1);
                                    }}
                                />
                            </div>
                        </div>
                    </div>

                    <div className="flex-1 overflow-y-auto w-full p-2 space-y-2 bg-gray-50/30">
                        {loading ? (
                            <div className="text-center py-10 text-gray-400 text-sm animate-pulse italic">Memuat data...</div>
                        ) : paginatedTickets.length === 0 ? (
                            <div className="text-center py-10 text-gray-400 text-sm italic">Data tidak ditemukan</div>
                        ) : (
                            paginatedTickets.map(t => (
                                <div
                                    key={t.id}
                                    onClick={() => setSelectedId(t.id)}
                                    className={`p-3 rounded-lg border-2 cursor-pointer transition-all ${selectedId === t.id ? 'border-bri-blue bg-blue-50 shadow-sm' : 'border-transparent bg-white hover:bg-gray-50'}`}
                                >
                                    <div className="flex justify-between items-start mb-1">
                                        <span className={`text-[10px] font-bold ${selectedId === t.id ? 'text-bri-blue' : 'text-gray-400'}`}>{t.id}</span>
                                        <span className="text-[10px] text-gray-400">{t.time}</span>
                                    </div>
                                    <h4 className="text-xs font-bold text-gray-800 mb-1">{t.type}</h4>
                                    <div className="flex justify-between items-end">
                                        <p className="text-[10px] text-gray-500 font-medium">{t.person} ({t.nik})</p>
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                setSelectedId(t.id);
                                                setIsDetailModalOpen(true);
                                            }}
                                            className="p-1 text-bri-blue hover:bg-blue-50 rounded transition-colors"
                                            title="Buka Detail"
                                        >
                                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                            </svg>
                                        </button>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>

                    {/* Simple Pagination */}
                    {totalPages > 1 && (
                        <div className="p-3 border-t border-gray-100 flex items-center justify-between bg-white rounded-b-xl">
                            <button
                                disabled={currentPage === 1}
                                onClick={() => setCurrentPage(p => p - 1)}
                                className="text-[10px] font-bold text-gray-500 disabled:opacity-30"
                            >Prev</button>
                            <span className="text-[10px] font-bold text-bri-blue">{currentPage} / {totalPages}</span>
                            <button
                                disabled={currentPage === totalPages}
                                onClick={() => setCurrentPage(p => p + 1)}
                                className="text-[10px] font-bold text-gray-500 disabled:opacity-30"
                            >Next</button>
                        </div>
                    )}
                </div>

                {/* Ticket Detail (Right Columns) */}
                <div className="lg:col-span-2 bg-white rounded-xl shadow-sm border border-gray-200 flex flex-col h-[700px]">
                    {/* Header */}
                    <div className="p-6 border-b border-gray-100 flex justify-between items-start">
                        <div>
                            <div className="flex items-center gap-2 mb-1">
                                <h3 className="text-xl font-bold text-gray-800">{activeTicket.type}</h3>
                                {roleMode === 'CHECKER' && (
                                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                                        Menunggu Validasi
                                    </span>
                                )}
                                {roleMode === 'SIGNER' && (
                                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-orange-100 text-orange-800">
                                        Menunggu Persetujuan
                                    </span>
                                )}
                                {roleMode === 'MAKER' && (
                                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                                        Draft / Revisi
                                    </span>
                                )}
                            </div>
                            <p className="text-sm text-gray-500">ID: {activeTicket.id} • Dibuat oleh Maker Pendaftaran pada 01 Okt 2023</p>
                        </div>

                        <button className="text-gray-400 hover:text-gray-600">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                            </svg>
                        </button>
                    </div>

                    {/* Body Content */}
                    <div className="flex-1 overflow-y-auto p-6">

                        {/* Card Info Peserta */}
                        <div className="bg-gray-50 rounded-lg p-4 border border-gray-100 mb-6">
                            <h4 className="text-sm font-semibold text-gray-800 mb-3 border-b border-gray-200 pb-2">Informasi Pendaftaran</h4>
                            {activeTicket.type === 'FEEDBACK_BPJS' ? (
                                <div>
                                    <p className="text-sm text-gray-700 font-medium mb-2">Pembaruan Staging Data BPJS via Feedback File.</p>
                                    <div className="bg-white border border-gray-200 rounded p-3 text-sm flex justify-between items-center">
                                        <div className="flex items-center gap-2">
                                            <i className="fas fa-file-excel text-green-600 text-xl"></i>
                                            <span className="font-bold text-gray-800">{activeTicket.rawData?.filename}</span>
                                        </div>
                                        <span className="text-xs text-gray-500">{Math.round((activeTicket.rawData?.size || 0) / 1024)} KB</span>
                                    </div>
                                    <p className="text-xs text-gray-500 mt-2 italic">* Approval Final (Signer) akan memproses isi file ini dan mengupdate status BPJS peserta ke Aktif.</p>
                                </div>
                            ) : Array.isArray(activeTicket.rawData) ? (
                                <div>
                                    <p className="text-sm text-gray-700 font-medium mb-2">Sebanyak <span className="text-bri-blue font-bold">{activeTicket.rawData.length}</span> peserta diajukan untuk pendaftaran batch ini.</p>
                                    <div className="max-h-32 overflow-y-auto bg-white border border-gray-200 rounded p-2 text-xs text-gray-600 font-mono">
                                        {activeTicket.rawData.join(", ")}
                                    </div>
                                </div>
                            ) : (
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <span className="text-xs text-gray-500 block mb-1">Nama / NIK</span>
                                        <span className="text-sm font-medium text-gray-900">{activeTicket.person} ({activeTicket.nik})</span>
                                    </div>
                                    <div>
                                        <span className="text-xs text-gray-500 block mb-1">Tanggal PHK Estimasi</span>
                                        <span className="text-sm font-medium text-gray-900">{activeTicket.rawData?.tgl_phk || '01 Nov 2023'}</span>
                                    </div>
                                    <div>
                                        <span className="text-xs text-gray-500 block mb-1">Kelompok</span>
                                        <span className="text-sm font-medium text-gray-900">
                                            {activeTicket.rawData?.id_kelompok === 1 ? 'Pensiunan Normal' :
                                                activeTicket.rawData?.id_kelompok === 2 ? 'Pensiunan Dipercepat' :
                                                    activeTicket.rawData?.id_kelompok === 3 ? 'Janda/Duda' : 'Pensiunan Normal'}
                                        </span>
                                    </div>
                                    <div>
                                        <span className="text-xs text-gray-500 block mb-1">Kelas Pertanggungan</span>
                                        <span className="text-sm font-medium text-gray-900">
                                            {activeTicket.rawData?.id_kelas === 1 ? 'Kelas A' :
                                                activeTicket.rawData?.id_kelas === 2 ? 'Kelas B' :
                                                    activeTicket.rawData?.id_kelas === 3 ? 'Kelas C' : 'Kelas B'}
                                        </span>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Dokumen Lampiran */}
                        <div className="mb-6">
                            <div className="flex justify-between items-center mb-3">
                                <h4 className="text-sm font-semibold text-gray-800">Dokumen Lampiran</h4>
                                {roleMode === 'MAKER' && activeTicket.id !== '-' && (
                                    <div>
                                        <input
                                            type="file"
                                            id="file-upload"
                                            className="hidden"
                                            onChange={handleFileUpload}
                                        />
                                        <label
                                            htmlFor="file-upload"
                                            className="text-xs font-bold bg-white border border-bri-blue text-bri-blue px-3 py-1.5 rounded cursor-pointer hover:bg-blue-50 transition-colors flex items-center gap-1"
                                        >
                                            <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                                            </svg>
                                            Tambah File
                                        </label>
                                    </div>
                                )}
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                {activeTicket.lampirans?.length === 0 && (
                                    <div className="col-span-2 text-center py-4 text-xs italic text-gray-400 border border-dashed border-gray-200 rounded-lg">
                                        Belum ada dokumen yang dilampirkan.
                                    </div>
                                )}
                                {activeTicket.lampirans?.map((l: any) => (
                                    <div key={l.id} className="border border-gray-200 rounded-lg p-3 flex flex-col justify-between hover:bg-gray-50 transition-colors">
                                        <div className="flex items-start gap-3 mb-2">
                                            <div className="bg-blue-50 p-2 rounded text-bri-blue mt-0.5">
                                                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                                </svg>
                                            </div>
                                            <div className="truncate flex-1">
                                                <p className="text-sm font-medium text-gray-800 truncate" title={l.file_name}>{l.file_name}</p>
                                                <p className="text-xs text-gray-400">{Math.round(l.file_size / 1024)} KB • Oleh {l.uploaded_by}</p>
                                            </div>
                                        </div>
                                        <div className="flex justify-end items-center gap-3 mt-2 border-t border-gray-100 pt-2">
                                            {roleMode === 'MAKER' && (
                                                <button onClick={() => handleDeleteFile(l.id)} className="text-red-500 text-xs hover:underline font-medium">Hapus</button>
                                            )}
                                            <a href={`${storageUrl}${l.file_url}`} target="_blank" rel="noreferrer" className="text-bri-blue text-xs bg-blue-50 px-2 py-1 rounded hover:bg-blue-100 font-medium">Download</a>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* History Log */}
                        <div>
                            <h4 className="text-sm font-semibold text-gray-800 mb-4">Riwayat Aktivitas</h4>

                            <div className="relative border-l-2 border-gray-200 ml-3 space-y-6">
                                <div className="relative pl-6">
                                    <div className={`absolute -left-[9px] top-1 border-2 w-4 h-4 rounded-full ${activeTicket.status === 'APPROVED' ? 'bg-green-500 border-green-500' : activeTicket.status === 'REJECTED' ? 'bg-red-500 border-red-500' : 'bg-white border-bri-blue'}`}></div>
                                    <p className="text-sm font-medium text-gray-800">Status Saat Ini: {activeTicket.status?.replace('_', ' ')}</p>
                                    <p className="text-xs text-gray-500 mt-0.5">Role bertugas: {roleMode}</p>
                                </div>

                                {activeTicket.approval_logs && [...activeTicket.approval_logs].reverse().map((log: any) => (
                                    <div key={log.id} className="relative pl-6">
                                        <div className="absolute -left-[9px] top-1 bg-gray-200 border-2 border-white w-4 h-4 rounded-full"></div>
                                        <p className="text-sm font-medium text-gray-600">
                                            {log.status === 'APPROVE' ? 'Disetujui / Validasi' : log.status === 'REJECT' ? 'Ditolak / Dikembalikan' : 'Status: ' + log.status}
                                        </p>
                                        <p className="text-xs text-gray-500 mt-0.5">
                                            Oleh {log.role} &bull; {new Date(log.timestamp).toLocaleString('id-ID')}
                                        </p>
                                        {log.catatan && (
                                            <p className="text-xs bg-gray-50 p-2 rounded mt-2 text-gray-600 border border-gray-100 italic">
                                                "{log.catatan}"
                                            </p>
                                        )}
                                    </div>
                                ))}

                                <div className="relative pl-6">
                                    <div className="absolute -left-[9px] top-1 bg-gray-300 border-2 border-white w-4 h-4 rounded-full"></div>
                                    <p className="text-sm font-medium text-gray-500">Pengajuan Dibuat</p>
                                    <p className="text-xs text-gray-400 mt-0.5">{activeTicket.time}</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Action Footer */}
                    <div className="p-4 border-t border-gray-100 bg-gray-50 rounded-b-xl flex justify-between items-center">
                        <div className="w-1/2">
                            <input
                                type="text"
                                placeholder="Tambahkan catatan (opsional)..."
                                value={catatan}
                                onChange={(e) => setCatatan(e.target.value)}
                                className="w-full text-sm border-gray-300 rounded-md focus:border-bri-blue focus:ring-bri-blue py-2 px-3 border"
                            />
                        </div>

                        <div className="flex gap-3">
                            {(roleMode === 'CHECKER' || roleMode === 'SIGNER') && (
                                <>
                                    <button
                                        onClick={() => handleAction('REJECT')}
                                        className="bg-white border border-red-300 text-red-600 px-5 py-2 rounded-lg text-sm font-medium hover:bg-red-50 hover:border-red-400 transition-colors shadow-sm"
                                    >
                                        Tolak / Kembalikan
                                    </button>
                                    <button
                                        onClick={() => handleAction('APPROVE')}
                                        className="bg-bri-blue text-white px-5 py-2 rounded-lg text-sm font-medium hover:bg-bri-blue/90 transition-colors shadow-sm focus:ring-2 focus:ring-offset-2 focus:ring-bri-blue flex items-center gap-2"
                                    >
                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                        </svg>
                                        {roleMode === 'CHECKER' ? 'Validasi Dokumen' : 'Setujui & Buat Surat'}
                                    </button>
                                </>
                            )}
                            {roleMode === 'MAKER' && (
                                <button className="bg-bri-blue text-white px-5 py-2 rounded-lg text-sm font-medium hover:bg-bri-blue/90 transition-colors shadow-sm">
                                    Simpan Perubahan
                                </button>
                            )}
                        </div>
                    </div>

                </div>
            </div>

            {/* Global Detail Modal (Consistent with user request) */}
            {isDetailModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden animate-in fade-in slide-in-from-bottom duration-300">
                        <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-bri-blue text-white">
                            <h3 className="font-bold">Detail Summary Pengajuan</h3>
                            <button onClick={() => setIsDetailModalOpen(false)} className="text-white/70 hover:text-white">✕</button>
                        </div>
                        <div className="p-8 space-y-6">
                            <div className="flex items-center gap-4">
                                <div className="bg-blue-50 p-4 rounded-xl text-bri-blue">
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                    </svg>
                                </div>
                                <div>
                                    <h2 className="text-xl font-black text-gray-900">{activeTicket.id}</h2>
                                    <p className="text-sm text-gray-500 font-medium">{activeTicket.type}</p>
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-y-4 text-sm border-t border-gray-100 pt-6">
                                <div>
                                    <p className="text-gray-400 font-bold uppercase text-[10px] tracking-widest mb-1">Peserta</p>
                                    <p className="font-bold text-gray-900">{activeTicket.person}</p>
                                </div>
                                <div>
                                    <p className="text-gray-400 font-bold uppercase text-[10px] tracking-widest mb-1">NIK</p>
                                    <p className="font-bold text-gray-900">{activeTicket.nik}</p>
                                </div>
                                <div>
                                    <p className="text-gray-400 font-bold uppercase text-[10px] tracking-widest mb-1">Status Sistem</p>
                                    <span className="bg-yellow-100 text-yellow-800 px-2 py-0.5 rounded text-[10px] font-black uppercase">{activeTicket.status}</span>
                                </div>
                                <div>
                                    <p className="text-gray-400 font-bold uppercase text-[10px] tracking-widest mb-1">Kategori</p>
                                    <p className="font-bold text-gray-900">{activeTicket.category}</p>
                                </div>
                            </div>
                        </div>
                        <div className="px-6 py-4 bg-gray-50 border-t border-gray-100 flex justify-end">
                            <button
                                onClick={() => setIsDetailModalOpen(false)}
                                className="bg-bri-blue text-white font-bold px-6 py-2 rounded-lg shadow-md hover:shadow-bri-blue/30 transition-all active:scale-95"
                            >
                                Tutup Summary
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
};

export default ApprovalWorkspace;
