import React, { useState } from 'react';
import { useLocation } from 'react-router-dom';
import { MODULES } from '../config/modules';
import { DataTable } from '../components/DataTable';
import { Plus, Edit2, Trash2 } from 'lucide-react';

const PlaceholderPage: React.FC = () => {
    const location = useLocation();

    // Get Title based on Path
    const getMenuInfo = () => {
        let title = 'General Entry';
        let moduleName = 'Module';
        for (const mod of MODULES) {
            if (location.pathname.startsWith(mod.basePath)) {
                moduleName = mod.name;
                for (const group of mod.menus) {
                    for (const item of group.items) {
                        if (item.path && location.pathname === item.path) title = item.label;
                        if (item.children) {
                            for (const child of item.children) {
                                if (location.pathname === child.path) title = child.label;
                            }
                        }
                    }
                }
            }
        }
        return { title, moduleName };
    };

    const { title, moduleName } = getMenuInfo();

    // Dummy State for CRUD
    const [data, setData] = useState([
        { id: 1, kode: 'DOC-001', keterangan: 'Contoh Data 1', status: 'Aktif' },
        { id: 2, kode: 'DOC-002', keterangan: 'Contoh Data 2', status: 'Aktif' },
        { id: 3, kode: 'DOC-003', keterangan: 'Contoh Data 3', status: 'Non-Aktif' },
    ]);

    const handleAdd = () => {
        const newId = data.length > 0 ? Math.max(...data.map(d => d.id)) + 1 : 1;
        const inputKode = prompt("Masukkan Kode Dokumen:", `DOC-00${newId}`);
        if (!inputKode) return;
        const inputKeterangan = prompt("Masukkan Keterangan Data:", `Contoh Data Baru ${newId}`);

        setData([...data, { id: newId, kode: inputKode, keterangan: inputKeterangan || '-', status: 'Aktif' }]);
    };

    const handleEdit = (id: number) => {
        const item = data.find(d => d.id === id);
        if (!item) return;
        const inputKeterangan = prompt("Ubah Keterangan:", item.keterangan);
        if (inputKeterangan !== null) {
            setData(data.map(d => d.id === id ? { ...d, keterangan: inputKeterangan } : d));
        }
    };

    const handleDelete = (id: number) => {
        if (confirm("Hapus data ini?")) {
            setData(data.filter(d => d.id !== id));
        }
    };

    const columns = [
        { header: 'ID', accessor: 'id', id: 'id' },
        { header: 'Kode', accessor: 'kode', id: 'kode' },
        { header: 'Keterangan / Nilai', accessor: 'keterangan', id: 'keterangan' },
        {
            header: 'Status',
            id: 'status',
            accessor: (row: any) => (
                <span className={`px-2 py-1 text-[11px] font-medium rounded-full ${row.status === 'Aktif' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'}`}>
                    {row.status}
                </span>
            )
        },
        {
            header: 'Aksi',
            id: 'aksi',
            accessor: (row: any) => (
                <div className="flex gap-2 justify-center">
                    <button onClick={() => handleEdit(row.id)} className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg" title="Edit">
                        <Edit2 size={16} />
                    </button>
                    <button onClick={() => handleDelete(row.id)} className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg" title="Hapus">
                        <Trash2 size={16} />
                    </button>
                </div>
            )
        }
    ];

    return (
        <div className="space-y-6 animate-in fade-in zoom-in duration-300">
            <div className="flex justify-between items-end border-b pb-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-800">{title}</h1>
                    <p className="text-gray-500 text-sm mt-1">Management CRUD untuk modul {moduleName} / {title}</p>
                </div>
                <div className="flex gap-3">
                    <button onClick={handleAdd} className="bg-bri-blue text-white px-4 py-2 rounded-lg flex items-center gap-2 text-sm font-medium hover:bg-bri-blue/90 transition-colors shadow-sm">
                        <Plus size={16} /> Input Baru
                    </button>
                </div>
            </div>

            <DataTable<any>
                data={data}
                columns={columns}
            />

            <div className="mt-8 bg-blue-50 border border-blue-100 p-4 rounded-lg flex gap-3 text-sm text-blue-800">
                Informasi: Halaman ini adalah versi dinamis generic CRUD. Path URL aktif: <code>{location.pathname}</code>
            </div>
        </div>
    );
};

export default PlaceholderPage;
