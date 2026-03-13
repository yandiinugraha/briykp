import React, { useState, useRef } from 'react';
import axios from 'axios';

const SinkronisasiData: React.FC = () => {
    const [file, setFile] = useState<File | null>(null);
    const [isUploading, setIsUploading] = useState(false);
    const [uploadResult, setUploadResult] = useState<{ total_row: number; inserted: number; failed: number } | null>(null);
    const [errorMsg, setErrorMsg] = useState<string | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const apiUrl = import.meta.env.VITE_API_URL;

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files.length > 0) {
            setFile(e.target.files[0]);
            setUploadResult(null);
            setErrorMsg(null);
        }
    };

    const handleUpload = async () => {
        if (!file) return;

        setIsUploading(true);
        setErrorMsg(null);

        const formData = new FormData();
        formData.append('file', file);

        try {
            const response = await axios.post(`${apiUrl}/upload/peserta`, formData, {
                headers: {
                    'Content-Type': 'multipart/form-data',
                },
            });

            setUploadResult(response.data);
            setFile(null); // Reset after successful upload
            if (fileInputRef.current) {
                fileInputRef.current.value = '';
            }
        } catch (error: any) {
            console.error('Upload Error:', error);
            setErrorMsg(error.response?.data?.error || 'Terjadi kesalahan saat mengunggah file.');
        } finally {
            setIsUploading(false);
        }
    };

    return (
        <>
            <div className="mb-6">
                <h2 className="text-2xl font-bold text-gray-800">Sinkronisasi Data Eksternal</h2>
                <p className="text-gray-500 text-sm mt-1">
                    Unggah feedback file dari BPJS, BRI Life, atau Data Induk HC BRI (Format .xlsx).
                </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Upload Section */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                    <h3 className="text-lg font-semibold text-gray-800 mb-4 border-b pb-2">Upload File Excel</h3>

                    <div className="mt-4">
                        <div className="flex items-center justify-center w-full">
                            <label htmlFor="dropzone-file" className="flex flex-col items-center justify-center w-full h-64 border-2 border-dashed rounded-lg cursor-pointer bg-gray-50 border-gray-300 hover:bg-blue-50 hover:border-bri-blue transition-colors">
                                <div className="flex flex-col items-center justify-center pt-5 pb-6">
                                    <svg className="w-10 h-10 mb-3 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"></path>
                                    </svg>
                                    <p className="mb-2 text-sm text-gray-500"><span className="font-semibold text-bri-blue">Klik untuk memilih file</span> atau tarik dan lepas file ke sini</p>
                                    <p className="text-xs text-gray-500">Mendukung format XLSX. Maksimum 10MB.</p>
                                </div>
                                <input
                                    id="dropzone-file"
                                    type="file"
                                    className="hidden"
                                    accept=".xlsx, application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
                                    onChange={handleFileChange}
                                    ref={fileInputRef}
                                />
                            </label>
                        </div>
                    </div>

                    {file && (
                        <div className="mt-4 p-4 bg-blue-50 border border-blue-100 rounded-lg flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                </svg>
                                <div>
                                    <p className="text-sm font-semibold text-gray-800">{file.name}</p>
                                    <p className="text-xs text-gray-500">{(file.size / 1024).toFixed(2)} KB</p>
                                </div>
                            </div>
                            <button
                                onClick={handleUpload}
                                disabled={isUploading}
                                className={`px - 4 py - 2 rounded - md font - medium text - white text - sm transition - all ${isUploading ? 'bg-gray-400 cursor-not-allowed' : 'bg-bri-blue hover:bg-blue-800 shadow-md'}`}
                            >
                                {isUploading ? 'Memproses...' : 'Mulai Sinkronisasi'}
                            </button>
                        </div>
                    )}

                    {errorMsg && (
                        <div className="mt-4 p-4 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm flex items-center gap-2">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                            </svg>
                            {errorMsg}
                        </div>
                    )}

                    {uploadResult && (
                        <div className="mt-4 p-5 bg-green-50 border border-green-200 rounded-lg">
                            <h4 className="text-green-800 font-bold mb-2 flex items-center gap-2">
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                </svg>
                                Proses Berhasil
                            </h4>
                            <div className="grid grid-cols-3 gap-4 mt-3">
                                <div className="bg-white p-3 rounded shadow-sm text-center">
                                    <p className="text-xs text-gray-500 mb-1">Total Baris</p>
                                    <p className="text-xl font-bold text-gray-800">{uploadResult.total_row}</p>
                                </div>
                                <div className="bg-white p-3 rounded shadow-sm text-center border-b-2 border-green-500">
                                    <p className="text-xs text-gray-500 mb-1">Sukses Masuk</p>
                                    <p className="text-xl font-bold text-green-600">{uploadResult.inserted}</p>
                                </div>
                                <div className="bg-white p-3 rounded shadow-sm text-center border-b-2 border-red-500">
                                    <p className="text-xs text-gray-500 mb-1">Gagal / Duplikat</p>
                                    <p className="text-xl font-bold text-red-500">{uploadResult.failed}</p>
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                {/* Instructions / Template Section */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                    <h3 className="text-lg font-semibold text-gray-800 mb-4 border-b pb-2">Informasi Format (Template)</h3>
                    <div className="text-sm text-gray-600 space-y-4">
                        <p>
                            Sistem akan mengekstraksi data Excel (format <code className="bg-gray-100 px-1 py-0.5 rounded text-bri-blue">.xlsx</code>) secara otomatis dengan melakukan pembacaan pada kolom pertama (NIK) dan kolom kedua (Nama Peserta).
                        </p>

                        <div className="bg-yellow-50 p-4 border border-yellow-100 rounded-lg">
                            <h4 className="font-semibold text-yellow-800 flex items-center gap-2 mb-2">
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                                </svg>
                                Syarat dan Ketentuan Kolom
                            </h4>
                            <ul className="list-disc pl-5 space-y-1 text-yellow-900/80">
                                <li><strong>Baris pertama (header) akan diabaikan.</strong> Mulailah data pada baris kedua.</li>
                                <li>Kolom A (ke-1): <b>Wajib diisi NIK valid</b> (harus unik).</li>
                                <li>Kolom B (ke-2): Wajib diisi Nama Peserta lengkap.</li>
                                <li>Data duplikat NIK yang sudah ada di Database akan dilewati (Failed) untuk melindungi integritas tabel transaksi.</li>
                            </ul>
                        </div>

                        <button className="flex items-center gap-2 text-bri-blue font-medium hover:underline">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                            </svg>
                            Download Template Contoh.xlsx
                        </button>
                    </div>
                </div>
            </div>
        </>
    );
};

export default SinkronisasiData;
