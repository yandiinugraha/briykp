import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../../context/AuthContext';
import { DataTable } from '../../components/DataTable';
import type { ColumnDef } from '../../components/DataTable';
import { ArrowLeft, FileText } from 'lucide-react';

const API = 'http://localhost:3000/api/kepesertaan/iuran';

interface DetailRow {
    id: number;
    nik_bri: string;
    pernr: string;
    nama_peserta: string;
    nominal_iuran: number;
    keterangan: string;
}

const IuranPreview: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const { token } = useAuth();

    const [data, setData] = useState<DetailRow[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchDetails = async () => {
            setLoading(true);
            try {
                const res = await axios.get(`${API}/upload/${id}/details`, {
                    headers: { Authorization: `Bearer ${token}` }
                });
                setData(res.data || []);
            } catch (err: any) {
                setError(err.response?.data?.error || 'Gagal memuat detail data');
            } finally {
                setLoading(false);
            }
        };

        if (id) {
            fetchDetails();
        }
    }, [id, token]);

    const columns: ColumnDef<DetailRow>[] = [
        { header: 'NIK BRI', accessor: 'nik_bri', id: 'nik' },
        { header: 'PERNR', accessor: 'pernr', id: 'pernr' },
        { header: 'Nama Peserta', accessor: (row) => row.nama_peserta || '-', id: 'nama' },
        {
            header: 'Nominal',
            accessor: (row) => `Rp ${(row.nominal_iuran || 0).toLocaleString()}`,
            id: 'nominal'
        },
        { header: 'Keterangan', accessor: (row) => row.keterangan || '-', id: 'keterangan' }
    ];

    return (
        <div className="p-6 max-w-7xl mx-auto space-y-6">
            <div className="flex items-center gap-4">
                <button
                    onClick={() => navigate('/kepesertaan/iuran/data')}
                    className="p-2 hover:bg-gray-100 rounded-lg text-gray-500 transition-colors"
                >
                    <ArrowLeft size={24} />
                </button>
                <div>
                    <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
                        <FileText className="text-bri-blue" /> Detail Upload #{id}
                    </h2>
                    <p className="text-gray-500 text-sm mt-1">
                        Preview data baris iuran dari file yang diupload. Memuat {data.length.toLocaleString()} baris data.
                    </p>
                </div>
            </div>

            {error ? (
                <div className="bg-red-50 text-red-600 p-4 rounded-xl border border-red-200">
                    {error}
                </div>
            ) : (
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                    {loading ? (
                        <div className="p-16 flex flex-col items-center justify-center gap-5">
                            <div className="w-12 h-12 border-4 border-bri-blue border-t-transparent rounded-full animate-spin"></div>
                            <p className="text-gray-500 font-medium animate-pulse text-lg">Memuat data besar dari server, harap tunggu sebentar...</p>
                        </div>
                    ) : (
                        <div className="p-4 bg-gray-50">
                            <DataTable
                                data={data}
                                columns={columns}
                                searchable={true}
                                exportable={true}
                                exportFileName={`Detail_Upload_${id}`}
                            />
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

export default IuranPreview;
