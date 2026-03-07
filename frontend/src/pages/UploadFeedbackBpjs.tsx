import React, { useState } from 'react';
import axios from 'axios';
import { motion } from 'framer-motion';

const UploadFeedbackBpjs: React.FC = () => {
    const [file, setFile] = useState<File | null>(null);
    const [loading, setLoading] = useState(false);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files.length > 0) {
            setFile(e.target.files[0]);
        }
    };

    const handleUpload = async () => {
        if (!file) return;

        setLoading(true);
        try {
            const token = localStorage.getItem('token');
            const formData = new FormData();
            formData.append('file', file);

            await axios.post('http://localhost:3000/api/bpjs/feedback', formData, {
                headers: {
                    Authorization: `Bearer ${token}`,
                    'Content-Type': 'multipart/form-data'
                }
            });

            alert('File Feedback BPJS berhasil diunggah! Berkas telah masuk ke Antrian Approval (Checker).');
            setFile(null); // Reset form
        } catch (error) {
            console.error('Error uploading feedback:', error);
            alert('Gagal mengunggah file. Silakan coba lagi.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="p-8 w-full max-w-4xl mx-auto"
        >
            <div className="mb-8 text-center sm:text-left">
                <h1 className="text-3xl font-black text-gray-900 tracking-tight">Upload Feedback BPJS</h1>
                <p className="text-gray-500 mt-2 text-sm max-w-2xl">
                    Unggah file laporan (Excel/CSV) balasan dari BPJS Kesehatan untuk memperbarui status kepesertaan secara otomatis.
                    Setiap file yang diunggah akan melalui proses Multi-Tier Approval terlebih dahulu.
                </p>
            </div>

            <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden mb-8">
                <div className="p-8">
                    <div
                        className={`border-2 border-dashed rounded-xl p-10 flex flex-col items-center justify-center transition-all ${file ? 'border-green-400 bg-green-50' : 'border-gray-300 bg-gray-50 hover:bg-gray-100 hover:border-bri-blue'}`}
                    >
                        <i className={`fas text-4xl mb-4 ${file ? 'fa-file-excel text-green-500' : 'fa-cloud-upload-alt text-gray-400'}`}></i>

                        {file ? (
                            <div className="text-center">
                                <p className="text-sm font-bold text-gray-800 mb-1">{file.name}</p>
                                <p className="text-xs text-gray-500 mb-4">{Math.round(file.size / 1024)} KB</p>
                                <button
                                    onClick={() => setFile(null)}
                                    className="text-xs text-red-500 hover:text-red-700 font-bold hover:underline"
                                >
                                    Pilih File Lain
                                </button>
                            </div>
                        ) : (
                            <div className="text-center">
                                <p className="text-sm font-bold text-gray-700 mb-2">Pilih File Kesepakatan / Feedback BPJS</p>
                                <p className="text-xs text-gray-500 mb-6">Format didukung: .csv, .xls, .xlsx (Max 5MB)</p>

                                <label className="cursor-pointer bg-white border border-gray-300 text-gray-700 hover:bg-gray-50 px-6 py-2 rounded-lg font-bold text-sm transition-all shadow-sm inline-flex items-center gap-2">
                                    <i className="fas fa-search"></i> Telusuri File
                                    <input
                                        type="file"
                                        className="hidden"
                                        accept=".csv, application/vnd.openxmlformats-officedocument.spreadsheetml.sheet, application/vnd.ms-excel"
                                        onChange={handleFileChange}
                                    />
                                </label>
                            </div>
                        )}
                    </div>
                </div>

                <div className="bg-gray-50 p-6 border-t border-gray-100 flex justify-end">
                    <button
                        onClick={handleUpload}
                        disabled={!file || loading}
                        className={`px-8 py-3 rounded-xl font-bold text-sm transition-all shadow-sm flex items-center gap-2 ${file ? 'bg-bri-blue text-white hover:bg-blue-700 active:scale-95' : 'bg-gray-200 text-gray-400 cursor-not-allowed'}`}
                    >
                        {loading ? (
                            <>
                                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                Mengunggah...
                            </>
                        ) : (
                            <>
                                <i className="fas fa-paper-plane"></i> Ajukan ke Checker
                            </>
                        )}
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-blue-50 border border-blue-100 rounded-xl p-5">
                    <div className="w-8 h-8 rounded-full bg-blue-100 text-bri-blue flex items-center justify-center font-bold mb-3">1</div>
                    <h4 className="text-sm font-bold text-blue-900 mb-1">Unggah (Maker)</h4>
                    <p className="text-xs text-blue-800">Pilih dan unggah dokumen feedback dari BPJS Kesehatan.</p>
                </div>
                <div className="bg-yellow-50 border border-yellow-100 rounded-xl p-5">
                    <div className="w-8 h-8 rounded-full bg-yellow-100 text-yellow-600 flex items-center justify-center font-bold mb-3">2</div>
                    <h4 className="text-sm font-bold text-yellow-900 mb-1">Validasi (Checker)</h4>
                    <p className="text-xs text-yellow-800">Staff Checker memverifikasi keabsahan dokumen sebelum diteruskan.</p>
                </div>
                <div className="bg-green-50 border border-green-100 rounded-xl p-5">
                    <div className="w-8 h-8 rounded-full bg-green-100 text-green-600 flex items-center justify-center font-bold mb-3">3</div>
                    <h4 className="text-sm font-bold text-green-900 mb-1">Persetujuan (Signer)</h4>
                    <p className="text-xs text-green-800">Sistem otomatis memproses data dan menerbitkan SK begitu disetujui.</p>
                </div>
            </div>
        </motion.div>
    );
};

export default UploadFeedbackBpjs;
