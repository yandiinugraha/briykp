import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { motion } from 'framer-motion';
import { DataTable, type ColumnDef } from '../components/DataTable';

interface SkProspensData {
    id_sk: string;
    id_pengajuan: string;
    tgl_diterbitkan: string;
    pendaftaran: {
        jenis_manfaat: string;
        peserta: {
            nama_peserta: string;
            nik_bri: string;
            jenis_mutasi: string;
        }
    }
}

const SkProspens: React.FC = () => {
    const [sks, setSks] = useState<SkProspensData[]>([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        fetchSks();
    }, []);

    const fetchSks = async () => {
        setLoading(true);
        try {
            const token = localStorage.getItem('token');
            const res = await axios.get('http://localhost:3000/api/sk', {
                headers: { Authorization: `Bearer ${token}` }
            });
            setSks(res.data || []);
        } catch (error) {
            console.error('Error fetching SKs:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleDownload = (sk: SkProspensData) => {
        const content = `
            SURAT KEPUTUSAN PROSPENS\n
            Nomor: ${sk.id_sk}\n
            Tanggal: ${new Date(sk.tgl_diterbitkan).toLocaleDateString('id-ID')}\n\n
            Diberikan Kepada:\n
            Nama: ${sk.pendaftaran.peserta.nama_peserta}\n
            NIK: ${sk.pendaftaran.peserta.nik_bri}\n
            Jenis Mutasi: ${sk.pendaftaran.peserta.jenis_mutasi || '-'}\n\n
            -- Dokumen Digital YKP BRI --
        `;

        const blob = new Blob([content], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${sk.id_sk} - ${sk.pendaftaran.peserta.nama_peserta}.txt`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    };

    const columns: ColumnDef<SkProspensData>[] = [
        { header: 'ID SK', accessor: 'id_sk', id: 'id_sk' },
        { header: 'ID Pengajuan', accessor: 'id_pengajuan', id: 'id_pengajuan' },
        {
            header: 'Tanggal Diterbitkan',
            accessor: (row) => new Date(row.tgl_diterbitkan).toLocaleDateString('id-ID', { year: 'numeric', month: 'long', day: 'numeric' }),
            id: 'tgl_diterbitkan'
        },
        {
            header: 'Nama / NIK',
            accessor: (row) => (
                <div>
                    <div className="font-bold text-gray-900">{row.pendaftaran?.peserta?.nama_peserta || '-'}</div>
                    <div className="text-xs text-gray-500">{row.pendaftaran?.peserta?.nik_bri || '-'}</div>
                </div>
            ),
            id: 'nama_nik'
        },
        {
            header: 'Jenis Mutasi',
            accessor: (row) => (
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-gray-100 text-gray-800 border border-gray-200">
                    {row.pendaftaran?.peserta?.jenis_mutasi || '-'}
                </span>
            ),
            id: 'jenis_mutasi'
        }
    ];

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="p-8 w-full max-w-7xl mx-auto"
        >
            <div className="mb-8">
                <h1 className="text-3xl font-black text-gray-900 tracking-tight">Dokumen SK Prospens</h1>
                <p className="text-gray-500 mt-1">Daftar Surat Keputusan yang telah diterbitkan (Approval Signer Selesai).</p>
            </div>

            <DataTable
                data={sks}
                columns={columns}
                loading={loading}
                exportFileName="Dokumen_SK_Prospens"
                onView={(row) => handleDownload(row)}
            />
        </motion.div>
    );
};

export default SkProspens;
