import { useState, useEffect } from 'react';
import axios from 'axios';
import { motion } from 'framer-motion';
import { DataTable, type ColumnDef } from '../../components/DataTable';

interface PesertaData {
    id_peserta: string;
    nama_peserta: string;
    nik_bri: string;
    tgl_phk?: string;
    kelompok?: { nama: string };
    kelas?: { nama: string };
}

const PenonaktifanBase = ({ stepName, stepNumber, description }: { stepName: string, stepNumber: number, description: string }) => {
    const [peserta, setPeserta] = useState<PesertaData[]>([]);
    const [loading, setLoading] = useState(false);
    const apiUrl = import.meta.env.VITE_API_URL;

    useEffect(() => {
        fetchPeserta();
    }, []);

    const fetchPeserta = async () => {
        setLoading(true);
        try {
            const token = localStorage.getItem('token');
            // Mocking data by just fetching all peserta 
            const res = await axios.get(`${apiUrl}/peserta`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setPeserta(res.data);
        } catch (error) {
            console.error('Error fetching peserta:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (row: PesertaData) => {
        if (window.confirm(`Konfirmasi penonaktifan / penghapusan data untuk: ${row.nama_peserta} ? `)) {
            try {
                const token = localStorage.getItem('token');
                await axios.delete(`${apiUrl}/peserta/${row.id_peserta}`, {
                    headers: { Authorization: `Bearer ${token}` }
                });
                alert('Data berhasil dinonaktifkan.');
                fetchPeserta();
            } catch (error) {
                alert('Gagal memproses data.');
            }
        }
    };

    const columns: ColumnDef<PesertaData>[] = [
        { header: 'ID Peserta', accessor: 'id_peserta', id: 'id_peserta' },
        {
            header: 'Nama / NIK',
            accessor: (row) => (
                <div>
                    <div className="font-bold text-gray-900">{row.nama_peserta}</div>
                    <div className="text-xs text-gray-500">{row.nik_bri}</div>
                </div>
            ),
            id: 'nama_nik'
        },
        { header: 'Kelompok', accessor: (row) => row.kelompok?.nama || '-', id: 'kelompok' },
        { header: 'Kelas', accessor: (row) => row.kelas?.nama || '-', id: 'kelas' }
    ];

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="p-8 w-full max-w-7xl mx-auto"
        >
            <div className="mb-8 flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4">
                <div>
                    <div className="flex items-center gap-3 mb-2">
                        <span className="bg-red-100 text-red-800 text-xs font-bold px-2 py-1 rounded">Langkah {stepNumber} / 7</span>
                        <span className="text-red-500 font-medium text-sm">Proses Penonaktifan Kepesertaan</span>
                    </div>
                    <h1 className="text-3xl font-black text-gray-900 tracking-tight">{stepName}</h1>
                    <p className="text-gray-500 mt-1">{description}</p>
                </div>
            </div>

            <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
                <DataTable
                    data={peserta}
                    columns={columns}
                    loading={loading}
                    exportFileName={`Penonaktifan_${stepName.replace(/ /g, '_')}`}
                    onDelete={handleDelete}
                    onView={(row) => alert(`Melihat detail penonaktifan untuk: ${row.nama_peserta}`)}
                />
            </div>

            <div className="mt-8 grid grid-cols-7 gap-2">
                {[1, 2, 3, 4, 5, 6, 7].map(num => (
                    <div key={num} className={`h-2 rounded-full ${num <= stepNumber ? 'bg-red-500' : 'bg-gray-200'}`}></div>
                ))}
            </div>
        </motion.div>
    );
};

export const NonaktifSetup = () => <PenonaktifanBase stepName="Setup Penonaktifan" stepNumber={1} description="Kompilasi dan persiapan daftar peserta yang akan diterminasi/dinonaktifkan." />;
export const NonaktifValidasi = () => <PenonaktifanBase stepName="Validasi Data" stepNumber={2} description="Verifikasi silang (crosscheck) kewajiban dan hak peserta sebelum dinonaktifkan." />;
export const NonaktifProses = () => <PenonaktifanBase stepName="Proses Eksekusi" stepNumber={3} description="Eksekusi status penonaktifan secara batch ke dalam sistem inti." />;
export const NonaktifUpdate = () => <PenonaktifanBase stepName="Update Database" stepNumber={4} description="Sinkronisasi status nonaktif peserta dengan pihak ketiga / asuransi." />;
export const NonaktifDampak = () => <PenonaktifanBase stepName="Hitung Dampak" stepNumber={5} description="Estimasi pengurangan liabilitas aktuaria pasca penonaktifan." />;
export const NonaktifAudit = () => <PenonaktifanBase stepName="Audit Trail" stepNumber={6} description="Review log penonaktifan untuk memastikan tidak ada anomali transaksi." />;
export const NonaktifLaporan = () => <PenonaktifanBase stepName="Laporan Final" stepNumber={7} description="Generasi laporan bulanan untuk mutasi keluar kepesertaan." />;
