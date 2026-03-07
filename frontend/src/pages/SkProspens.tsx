import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { motion } from 'framer-motion';

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
            setSks(res.data);
        } catch (error) {
            console.error('Error fetching SKs:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleDownload = (sk: SkProspensData) => {
        // Mock Download PDF logic
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

            {loading ? (
                <div className="flex justify-center p-12">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-bri-blue"></div>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {sks.map((sk) => (
                        <div key={sk.id_sk} className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 flex flex-col justify-between hover:border-bri-blue transition-colors group">
                            <div>
                                <div className="flex justify-between items-start mb-4">
                                    <div className="bg-blue-50 text-bri-blue px-3 py-1 rounded-full text-xs font-bold">
                                        <i className="fas fa-file-signature mr-2"></i> SK Diterbitkan
                                    </div>
                                    <span className="text-xs text-gray-500 font-medium">
                                        {new Date(sk.tgl_diterbitkan).toLocaleDateString('id-ID', { year: 'numeric', month: 'long', day: 'numeric' })}
                                    </span>
                                </div>
                                <h3 className="text-lg font-bold text-gray-900 mb-1">{sk.id_sk}</h3>
                                <p className="text-sm text-gray-500 mb-4 tracking-tight">Ref: {sk.id_pengajuan}</p>

                                <div className="bg-gray-50 rounded-xl p-4 mb-6">
                                    <p className="text-sm font-bold text-gray-800">{sk.pendaftaran.peserta.nama_peserta}</p>
                                    <p className="text-xs text-gray-500 mb-2">{sk.pendaftaran.peserta.nik_bri}</p>
                                    <div className="flex items-center gap-2 mt-2">
                                        <span className="text-xs font-medium text-gray-500">Mutasi:</span>
                                        <span className="text-xs font-bold text-gray-700 bg-white px-2 py-0.5 rounded border border-gray-200">
                                            {sk.pendaftaran.peserta.jenis_mutasi || '-'}
                                        </span>
                                    </div>
                                </div>
                            </div>

                            <button
                                onClick={() => handleDownload(sk)}
                                className="w-full flex items-center justify-center gap-2 bg-gray-50 hover:bg-bri-blue hover:text-white text-gray-700 font-bold py-3 rounded-xl border border-gray-200 hover:border-bri-blue transition-all active:scale-95 group-hover:bg-blue-50 group-hover:text-bri-blue"
                            >
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                                </svg>
                                Download SK
                            </button>
                        </div>
                    ))}
                    {sks.length === 0 && (
                        <div className="col-span-full py-20 text-center bg-white rounded-2xl border border-dashed border-gray-300">
                            <svg className="mx-auto h-12 w-12 text-gray-300 mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                            </svg>
                            <p className="text-lg font-medium text-gray-900">Belum ada SK Prospens</p>
                            <p className="text-sm text-gray-500">SK akan otomatis diterbitkan setelah approval Signer selesai.</p>
                        </div>
                    )}
                </div>
            )}
        </motion.div>
    );
};

export default SkProspens;
