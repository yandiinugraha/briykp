import { useState } from 'react';
import {
    Landmark, Wallet, Layers,
    ArrowRight, Info, Plus,
    TrendingUp
} from 'lucide-react';
import { motion } from 'framer-motion';
import { ObligasiProposal } from './Obligasi';
import Saham from './Saham';

const InvestasiEntry = () => {
    const [selectedAsset, setSelectedAsset] = useState<'SAHAM' | 'OBLIGASI' | 'REKSADANA' | 'DEPOSITO' | null>(null);

    const assetCards = [
        { id: 'SAHAM', name: 'Saham', icon: <TrendingUp size={32} />, color: 'blue', desc: 'Investasi pada pasar modal' },
        { id: 'OBLIGASI', name: 'Obligasi', icon: <Landmark size={32} />, color: 'orange', desc: 'Surat utang negara/korporasi' },
        { id: 'REKSADANA', name: 'Reksadana', icon: <Layers size={32} />, color: 'indigo', desc: 'Diversifikasi dana kelolaan' },
        { id: 'DEPOSITO', name: 'Deposito', icon: <Wallet size={32} />, color: 'green', desc: 'Simpanan berjangka perbankan' },
    ];

    const renderAssetContent = () => {
        switch (selectedAsset) {
            case 'SAHAM': return <Saham defaultTab="proposal" />;
            case 'OBLIGASI': return <ObligasiProposal />;
            default: return (
                <div className="p-20 text-center bg-white rounded-3xl border border-dashed border-gray-200">
                    <div className="w-20 h-20 bg-gray-50 flex items-center justify-center rounded-3xl mx-auto mb-6 text-gray-300">
                        {assetCards.find(a => a.id === selectedAsset)?.icon}
                    </div>
                    <h3 className="text-2xl font-black text-gray-800 mb-2">Modul {selectedAsset}</h3>
                    <p className="text-gray-500 max-w-md mx-auto mb-8">
                        Fitur penempatan {selectedAsset?.toLowerCase()} sedang disiapkan.
                        Modul ini mencakup pengajuan proposal dealer hingga persetujuan signer.
                    </p>
                    <button className="bg-bri-blue text-white px-8 py-3 rounded-2xl font-black text-sm uppercase tracking-widest shadow-xl shadow-bri-blue/20">
                        Kembali ke Pilihan
                    </button>
                </div>
            );
        }
    };

    return (
        <div className="p-8 max-w-[1600px] mx-auto min-h-screen">
            <header className="mb-10 flex justify-between items-end">
                <div>
                    <div className="flex items-center gap-3 mb-2">
                        <div className="p-2.5 bg-bri-blue/10 rounded-xl text-bri-blue">
                            <Plus size={24} />
                        </div>
                        <h1 className="text-4xl font-black text-gray-900 tracking-tight">Transaksi Investasi</h1>
                    </div>
                    <p className="text-gray-500 font-medium">Pilih jenis instrumen untuk memulai usulan investasi baru.</p>
                </div>
                {selectedAsset && (
                    <button
                        onClick={() => setSelectedAsset(null)}
                        className="text-bri-blue font-black text-xs uppercase tracking-widest hover:underline flex items-center gap-2"
                    >
                        Ganti Instrumen
                    </button>
                )}
            </header>

            {!selectedAsset ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    {assetCards.map((asset) => (
                        <motion.button
                            key={asset.id}
                            whileHover={{ y: -5 }}
                            whileTap={{ scale: 0.98 }}
                            onClick={() => setSelectedAsset(asset.id as any)}
                            className="bg-white p-8 rounded-[40px] border border-gray-100 shadow-sm hover:shadow-2xl transition-all text-left group overflow-hidden relative"
                        >
                            <div className={`w-16 h-16 rounded-2xl flex items-center justify-center mb-6 transition-colors ${asset.color === 'blue' ? 'bg-blue-50 text-blue-600 group-hover:bg-blue-600 group-hover:text-white' :
                                asset.color === 'orange' ? 'bg-orange-50 text-orange-600 group-hover:bg-orange-600 group-hover:text-white' :
                                    asset.color === 'indigo' ? 'bg-indigo-50 text-indigo-600 group-hover:bg-indigo-600 group-hover:text-white' :
                                        'bg-green-50 text-green-600 group-hover:bg-green-600 group-hover:text-white'
                                }`}>
                                {asset.icon}
                            </div>
                            <h3 className="text-2xl font-black text-gray-900 mb-2">{asset.name}</h3>
                            <p className="text-gray-500 text-sm font-medium pr-8">{asset.desc}</p>

                            <div className="mt-8 flex items-center gap-2 text-bri-blue font-black text-xs uppercase tracking-widest opacity-0 group-hover:opacity-100 transition-opacity">
                                Pilih <ArrowRight size={14} />
                            </div>

                            <div className="absolute -bottom-10 -right-10 w-32 h-32 bg-gray-50 rounded-full opacity-50 group-hover:scale-150 transition-transform duration-500"></div>
                        </motion.button>
                    ))}
                </div>
            ) : (
                <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                    {renderAssetContent()}
                </div>
            )}

            {!selectedAsset && (
                <div className="mt-12 bg-gray-900 rounded-[40px] p-12 text-white flex flex-col md:flex-row items-center justify-between gap-10">
                    <div className="max-w-xl">
                        <div className="flex items-center gap-2 text-bri-orange font-black text-xs uppercase tracking-[0.2em] mb-4">
                            <Info size={16} /> Penting
                        </div>
                        <h2 className="text-3xl font-black mb-4">Pastikan Likuiditas Tersedia</h2>
                        <p className="text-gray-400 font-medium leading-relaxed">
                            Sebelum melakukan usulan investasi, pastikan dana menganggur mencukupi di dashboard Likuiditas.
                            Seluruh usulan akan melewati alur persetujuan Maker-Checker-Signer.
                        </p>
                    </div>
                    <div className="flex gap-4">
                        <div className="bg-white/10 p-6 rounded-3xl border border-white/10 text-center">
                            <div className="text-3xl font-black text-white mb-1">Rp 15M</div>
                            <div className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Dana Idle</div>
                        </div>
                        <div className="bg-white/10 p-6 rounded-3xl border border-white/10 text-center">
                            <div className="text-3xl font-black text-bri-orange mb-1">4</div>
                            <div className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Opsi Aset</div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default InvestasiEntry;
