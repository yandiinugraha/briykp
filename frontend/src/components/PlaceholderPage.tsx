import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Construction, Plus, Edit2, Trash2, Download } from 'lucide-react';
import { DataTable } from './DataTable';

interface PlaceholderPageProps {
    moduleName: string;
    featureName: string;
    stepName: string;
    stepNumber?: number;
    totalSteps?: number;
    steps?: string[];
    icon?: React.ReactNode;
    accentColor?: string;
}

const PlaceholderPage: React.FC<PlaceholderPageProps> = ({
    moduleName,
    featureName,
    stepName,
    stepNumber,
    totalSteps,
    steps = [],
    accentColor = '#0B5E9E',
}) => {
    // ─── GENERIC CRUD STATE ───
    const [data, setData] = useState([
        { id: 1, kode: `${featureName.substring(0, 3).toUpperCase()}-001`, keterangan: `Data Awal ${stepName} 1`, status: 'Draft' },
        { id: 2, kode: `${featureName.substring(0, 3).toUpperCase()}-002`, keterangan: `Data Awal ${stepName} 2`, status: 'Draft' },
    ]);

    const handleAdd = () => {
        const newId = data.length > 0 ? Math.max(...data.map(d => d.id)) + 1 : 1;
        const inputKode = prompt("Masukkan Kode Dokumen Baru:", `${featureName.substring(0, 3).toUpperCase()}-00${newId}`);
        if (!inputKode) return;
        const inputKeterangan = prompt("Masukkan Keterangan / Nilai:", `Data Baru ${stepName}`);
        setData([...data, { id: newId, kode: inputKode, keterangan: inputKeterangan || '-', status: 'Draft' }]);
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
        if (confirm("Hapus data ini secara permanen?")) {
            setData(data.filter(d => d.id !== id));
        }
    };

    const columns = [
        { header: 'ID', accessor: 'id', id: 'id' },
        { header: 'Kode Form', accessor: 'kode', id: 'kode' },
        { header: 'Deskripsi Transaksi', accessor: 'keterangan', id: 'keterangan' },
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
                <div className="flex gap-2">
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
        <div className="space-y-6">
            {/* Breadcrumb */}
            <div className="flex items-center gap-2 text-sm text-gray-500">
                <span className="font-medium" style={{ color: accentColor }}>{moduleName}</span>
                <span>›</span>
                <span className="font-medium">{featureName}</span>
                <span>›</span>
                <span className="text-gray-800 font-semibold">{stepName}</span>
            </div>

            {/* Main Card */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4 }}
                className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden"
            >
                {/* Header with gradient */}
                <div
                    className="px-8 py-6"
                    style={{
                        background: `linear-gradient(135deg, ${accentColor}10 0%, ${accentColor}05 100%)`,
                        borderBottom: `2px solid ${accentColor}20`,
                    }}
                >
                    <div className="flex items-center justify-between">
                        <div>
                            <h1 className="text-2xl font-bold text-gray-900">{stepName}</h1>
                            <p className="text-sm text-gray-500 mt-1">
                                {featureName} — {moduleName}
                            </p>
                        </div>
                        {stepNumber && totalSteps && (
                            <div
                                className="flex items-center gap-2 px-4 py-2 rounded-full text-sm font-bold text-white"
                                style={{ backgroundColor: accentColor }}
                            >
                                Tahap {stepNumber}/{totalSteps}
                            </div>
                        )}
                    </div>
                </div>

                {/* Body: Enhanced with simple CRUD Form/Table */}
                <div className="px-8 py-8">
                    <div className="flex justify-between items-center mb-6">
                        <div className="flex gap-4">
                            <button onClick={handleAdd} className="bg-bri-blue text-white px-4 py-2 rounded-lg flex items-center gap-2 text-sm font-medium hover:bg-bri-blue/90 transition-colors shadow-sm">
                                <Plus size={16} /> Input Transaksi
                            </button>
                            <button className="border border-gray-300 text-gray-700 px-4 py-2 rounded-lg flex items-center gap-2 text-sm font-medium hover:bg-gray-50 transition-colors shadow-sm">
                                <Download size={16} /> Export
                            </button>
                        </div>
                    </div>

                    <DataTable<any>
                        data={data}
                        columns={columns}
                    />

                    <div className="mt-8 bg-blue-50 border border-blue-100 p-4 rounded-lg flex gap-3 text-sm text-blue-800">
                        <Construction size={20} className="shrink-0 text-blue-500" />
                        <div>
                            <strong>Modul Prototipe.</strong> Halaman <strong>{stepName}</strong> pada modul <strong>{featureName}</strong> ini mendukung standard operasi CRUD ERP Simpel. Data akan tersimpan sesuai standar ERP yang dibutuhkan.
                        </div>
                    </div>
                </div>
            </motion.div>

            {/* Steps Overview */}
            {steps.length > 0 && (
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.4, delay: 0.15 }}
                    className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6"
                >
                    <h3 className="text-sm font-bold text-gray-800 mb-4">
                        Alur Tahapan — {featureName}
                    </h3>
                    <div className="flex flex-wrap gap-2">
                        {steps.map((step, index) => (
                            <div
                                key={index}
                                className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-all ${step === stepName
                                    ? 'text-white border-transparent shadow-md'
                                    : 'text-gray-500 border-gray-200 bg-gray-50'
                                    }`}
                                style={
                                    step === stepName
                                        ? { backgroundColor: accentColor }
                                        : {}
                                }
                            >
                                {index + 1}. {step}
                            </div>
                        ))}
                    </div>
                </motion.div>
            )}
        </div>
    );
};

export default PlaceholderPage;
