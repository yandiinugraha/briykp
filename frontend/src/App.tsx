import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { AuthProvider, useAuth } from './context/AuthContext';
import Layout from './components/Layout';

// Existing pages
import Dashboard from './pages/Dashboard';
import PesertaManagement from './pages/PesertaManagement';
import ApprovalWorkspace from './pages/ApprovalWorkspace';
import SinkronisasiData from './pages/SinkronisasiData';
import ModulKeuangan from './pages/ModulKeuangan';
import InfoKepesertaan from './pages/InfoKepesertaan';
import ProyeksiPendaftaran from './pages/ProyeksiPendaftaran';
import SkProspens from './pages/SkProspens';
import PendaftaranBpjs from './pages/PendaftaranBpjs';
import PendaftaranBrilife from './pages/PendaftaranBrilife';
import UploadFeedbackBpjs from './pages/UploadFeedbackBpjs';
import Login from './pages/Login';
import AuditTrail from './pages/AuditTrail';
import DataKepesertaan from './pages/DataKepesertaan';
import ApprovalKepesertaan from './pages/ApprovalKepesertaan';
import WorkspaceHome from './pages/WorkspaceHome';
import DummyPage from './pages/DummyPage';

// ─── KEPESERTAAN MODULE ─────────────────────────────────────────
import IuranPeserta from './pages/kepesertaan/IuranPeserta';
import ApprovalIuran from './pages/kepesertaan/ApprovalIuran';
import IuranPreview from './pages/kepesertaan/IuranPreview';
import IuranNewMember from './pages/kepesertaan/IuranNewMember';
import IuranMissing from './pages/kepesertaan/IuranMissing';
import IuranDuplicate from './pages/kepesertaan/IuranDuplicate';
import SettlementIuran from './pages/kepesertaan/SettlementIuran';

// PHK
import PhkUploadPage from './pages/kepesertaan/PhkUpload';
import PhkPreview from './pages/kepesertaan/PhkPreview';

import {
  ThtInput, ThtValidasi, ThtPerhitungan, ThtApproval, ThtGenerate,
  ThtLikuiditas, ThtAkuntansi, ThtAudit, ThtLaporan
} from './pages/kepesertaan/PembayaranTht';

import {
  DistribusiInputOtomatis, DistribusiPerhitungan, DistribusiPerhitunganLanjutan,
  DistribusiSimulasi, DistribusiApproval, DistribusiPosting,
  DistribusiAkuntansi, DistribusiRekonsiliasi, DistribusiLaporan
} from './pages/kepesertaan/DistribusiPengembangan';

import PhkPembayaran from './pages/PhkPembayaran';
import PhkFeedbackBrilife from './pages/PhkFeedbackBrilife';

import {
  NonaktifSetup, NonaktifValidasi, NonaktifProses, NonaktifUpdate,
  NonaktifDampak, NonaktifAudit, NonaktifLaporan
} from './pages/kepesertaan/Penonaktifan';

// ─── INVESTASI MODULE ───────────────────────────────────────────
import Saham from './pages/investasi/Saham';
import LikuiditasDashboard from './pages/investasi/LikuiditasDashboard';
import InvestasiEntry from './pages/investasi/InvestasiEntry';
import InvestmentSettlement from './pages/investasi/InvestmentSettlement';
import InvestmentAccounting from './pages/investasi/InvestmentAccounting';
import {
  ObligasiTransaksi
} from './pages/investasi/Obligasi';

const pageVariants = {
  initial: { opacity: 0, x: 10 },
  in: { opacity: 1, x: 0 },
  out: { opacity: 0, x: -10 },
};

const pageTransition: any = {
  type: 'tween',
  ease: 'easeOut',
  duration: 0.3,
};

const Page = ({ children, pageKey }: { children: React.ReactNode; pageKey: string }) => (
  <motion.div key={pageKey} initial="initial" animate="in" exit="out" variants={pageVariants} transition={pageTransition} className="w-full">
    {children}
  </motion.div>
);

const AppContent = () => {
  const { token, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-bri-dark flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-bri-orange border-t-white rounded-full animate-spin"></div>
          <p className="text-white font-medium">Menjangkau Server YKP...</p>
        </div>
      </div>
    );
  }

  if (!token) {
    return (
      <AnimatePresence mode="wait">
        <motion.div key="login" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="h-full w-full">
          <Login />
        </motion.div>
      </AnimatePresence>
    );
  }

  return (
    <Layout>
      <AnimatePresence mode="wait">
        <Routes>
          <Route path="/dashboard" element={<Page pageKey="dashboard"><Dashboard /></Page>} />

          {/* Legacy routes */}
          <Route path="/peserta" element={<Page pageKey="peserta"><PesertaManagement /></Page>} />
          <Route path="/proyeksi" element={<Page pageKey="proyeksi"><ProyeksiPendaftaran /></Page>} />
          <Route path="/bpjs" element={<Page pageKey="bpjs"><PendaftaranBpjs /></Page>} />
          <Route path="/brilife" element={<Page pageKey="brilife"><PendaftaranBrilife /></Page>} />
          <Route path="/feedback" element={<Page pageKey="feedback"><UploadFeedbackBpjs /></Page>} />
          <Route path="/sk" element={<Page pageKey="sk"><SkProspens /></Page>} />
          <Route path="/approval" element={<Page pageKey="approval"><ApprovalWorkspace /></Page>} />
          <Route path="/upload" element={<Page pageKey="upload"><SinkronisasiData /></Page>} />
          <Route path="/finance" element={<Page pageKey="finance"><ModulKeuangan /></Page>} />
          <Route path="/audit" element={<Page pageKey="audit"><AuditTrail /></Page>} />

          {/* ─── MODULE BASE PAGES ──────────────────────────── */}
          <Route path="/kepesertaan" element={<Page pageKey="kepesertaan-home"><WorkspaceHome /></Page>} />
          <Route path="/investasi" element={<Page pageKey="investasi-home"><WorkspaceHome /></Page>} />
          <Route path="/purchase" element={<Page pageKey="purchase-home"><WorkspaceHome /></Page>} />
          <Route path="/inventory" element={<Page pageKey="inventory-home"><WorkspaceHome /></Page>} />
          <Route path="/hris" element={<Page pageKey="hris-home"><WorkspaceHome /></Page>} />
          <Route path="/accounting" element={<Page pageKey="accounting-home"><WorkspaceHome /></Page>} />
          <Route path="/operasional" element={<Page pageKey="operasional-home"><WorkspaceHome /></Page>} />

          {/* ─── KEPESERTAAN: Data Kepesertaan ────────────────────── */}
          <Route path="/kepesertaan/profile" element={<Page pageKey="profile"><InfoKepesertaan /></Page>} />
          <Route path="/kepesertaan/data-kepesertaan" element={<Page pageKey="data-kepesertaan"><DataKepesertaan /></Page>} />
          <Route path="/kepesertaan/approval-kepesertaan" element={<Page pageKey="approval-kepesertaan"><ApprovalKepesertaan /></Page>} />

          {/* ─── KEPESERTAAN: Iuran Peserta ──────────────────────── */}
          <Route path="/kepesertaan/iuran/data" element={<Page pageKey="iuran-data"><IuranPeserta /></Page>} />
          <Route path="/kepesertaan/iuran/upload/:id/preview" element={<Page pageKey="iuran-preview"><IuranPreview /></Page>} />
          <Route path="/kepesertaan/iuran/approval" element={<Page pageKey="iuran-approval"><ApprovalIuran /></Page>} />
          <Route path="/kepesertaan/iuran/new-member" element={<Page pageKey="iuran-new-member"><IuranNewMember /></Page>} />
          <Route path="/kepesertaan/iuran/missing" element={<Page pageKey="iuran-missing"><IuranMissing /></Page>} />
          <Route path="/kepesertaan/iuran/duplicate" element={<Page pageKey="iuran-duplicate"><IuranDuplicate /></Page>} />
          <Route path="/kepesertaan/iuran/settlement" element={<Page pageKey="iuran-settlement"><SettlementIuran /></Page>} />
          <Route path="/kepesertaan/iuran/history" element={<Page pageKey="iuran-history"><SettlementIuran defaultTab="history" /></Page>} />

          {/* ─── KEPESERTAAN: Pembayaran Manfaat THT ──────────── */}
          <Route path="/kepesertaan/tht/input" element={<Page pageKey="tht-input"><ThtInput /></Page>} />
          <Route path="/kepesertaan/tht/validasi" element={<Page pageKey="tht-validasi"><ThtValidasi /></Page>} />
          <Route path="/kepesertaan/tht/perhitungan" element={<Page pageKey="tht-perhitungan"><ThtPerhitungan /></Page>} />
          <Route path="/kepesertaan/tht/approval" element={<Page pageKey="tht-approval"><ThtApproval /></Page>} />
          <Route path="/kepesertaan/tht/generate" element={<Page pageKey="tht-generate"><ThtGenerate /></Page>} />
          <Route path="/kepesertaan/tht/likuiditas" element={<Page pageKey="tht-likuiditas"><ThtLikuiditas /></Page>} />
          <Route path="/kepesertaan/tht/akuntansi" element={<Page pageKey="tht-akuntansi"><ThtAkuntansi /></Page>} />
          <Route path="/kepesertaan/tht/audit" element={<Page pageKey="tht-audit"><ThtAudit /></Page>} />
          <Route path="/kepesertaan/tht/laporan" element={<Page pageKey="tht-laporan"><ThtLaporan /></Page>} />

          {/* ─── KEPESERTAAN: Distribusi Pengembangan ─────────── */}
          <Route path="/kepesertaan/distribusi/input-otomatis" element={<Page pageKey="distribusi-input"><DistribusiInputOtomatis /></Page>} />
          <Route path="/kepesertaan/distribusi/perhitungan" element={<Page pageKey="distribusi-perhitungan"><DistribusiPerhitungan /></Page>} />
          <Route path="/kepesertaan/distribusi/perhitungan-lanjutan" element={<Page pageKey="distribusi-perhitungan-lanjutan"><DistribusiPerhitunganLanjutan /></Page>} />
          <Route path="/kepesertaan/distribusi/simulasi" element={<Page pageKey="distribusi-simulasi"><DistribusiSimulasi /></Page>} />
          <Route path="/kepesertaan/distribusi/approval" element={<Page pageKey="distribusi-approval"><DistribusiApproval /></Page>} />
          <Route path="/kepesertaan/distribusi/posting" element={<Page pageKey="distribusi-posting"><DistribusiPosting /></Page>} />
          <Route path="/kepesertaan/distribusi/akuntansi" element={<Page pageKey="distribusi-akuntansi"><DistribusiAkuntansi /></Page>} />
          <Route path="/kepesertaan/distribusi/rekonsiliasi" element={<Page pageKey="distribusi-rekonsiliasi"><DistribusiRekonsiliasi /></Page>} />
          <Route path="/kepesertaan/distribusi/laporan" element={<Page pageKey="distribusi-laporan"><DistribusiLaporan /></Page>} />

          {/* ─── KEPESERTAAN: PHK Normal → Prospens ───────────── */}
          <Route path="/kepesertaan/phk/upload" element={<Page pageKey="phk-upload"><PhkUploadPage /></Page>} />
          <Route path="/kepesertaan/phk/upload/:id/preview" element={<Page pageKey="phk-preview"><PhkPreview /></Page>} />
          <Route path="/kepesertaan/phk/proyeksi" element={<Page pageKey="phk-proyeksi"><ProyeksiPendaftaran /></Page>} />
          <Route path="/kepesertaan/phk/sk" element={<Page pageKey="phk-sk"><SkProspens /></Page>} />
          <Route path="/kepesertaan/phk/bpjs" element={<Page pageKey="phk-bpjs"><PendaftaranBpjs /></Page>} />
          <Route path="/kepesertaan/phk/brilife" element={<Page pageKey="phk-brilife"><PendaftaranBrilife /></Page>} />
          <Route path="/kepesertaan/phk/feedback-bpjs" element={<Page pageKey="phk-feedback-bpjs"><UploadFeedbackBpjs /></Page>} />
          <Route path="/kepesertaan/phk/pembayaran" element={<Page pageKey="phk-pembayaran"><PhkPembayaran /></Page>} />
          <Route path="/kepesertaan/phk/feedback-brilife" element={<Page pageKey="phk-feedback-brilife"><PhkFeedbackBrilife /></Page>} />

          {/* ─── KEPESERTAAN: Penonaktifan Peserta ────────────── */}
          <Route path="/kepesertaan/nonaktif/setup" element={<Page pageKey="nonaktif-setup"><NonaktifSetup /></Page>} />
          <Route path="/kepesertaan/nonaktif/validasi" element={<Page pageKey="nonaktif-validasi"><NonaktifValidasi /></Page>} />
          <Route path="/kepesertaan/nonaktif/proses" element={<Page pageKey="nonaktif-proses"><NonaktifProses /></Page>} />
          <Route path="/kepesertaan/nonaktif/update" element={<Page pageKey="nonaktif-update"><NonaktifUpdate /></Page>} />
          <Route path="/kepesertaan/nonaktif/dampak" element={<Page pageKey="nonaktif-dampak"><NonaktifDampak /></Page>} />
          <Route path="/kepesertaan/nonaktif/audit" element={<Page pageKey="nonaktif-audit"><NonaktifAudit /></Page>} />
          <Route path="/kepesertaan/nonaktif/laporan" element={<Page pageKey="nonaktif-laporan"><NonaktifLaporan /></Page>} />

          {/* ─── INVESTASI: NEW FLOW ──────────────────────────── */}
          <Route path="/investasi/likuiditas" element={<Page pageKey="likuiditas-dashboard"><LikuiditasDashboard /></Page>} />

          {/* Transaksi per Instrumen */}
          <Route path="/investasi/transaksi/*" element={<Page pageKey="investasi-entry"><InvestasiEntry /></Page>} />

          <Route path="/investasi/settlement" element={<Page pageKey="investasi-settlement"><InvestmentSettlement /></Page>} />

          {/* Akuntansi & Pajak */}
          <Route path="/investasi/akuntansi/pendapatan" element={<Page pageKey="akuntansi-pendapatan"><InvestmentAccounting /></Page>} />
          <Route path="/investasi/akuntansi/pajak" element={<Page pageKey="akuntansi-pajak"><InvestmentAccounting /></Page>} />
          <Route path="/investasi/akuntansi/jurnal" element={<Page pageKey="akuntansi-jurnal"><InvestmentAccounting /></Page>} />

          {/* Legacy or Old components - partially kept or mapped if needed */}
          <Route path="/investasi/obligasi/transaksi" element={<Page pageKey="obligasi-transaksi"><ObligasiTransaksi /></Page>} />
          <Route path="/investasi/saham/proposal" element={<Page pageKey="saham-proposal"><Saham defaultTab="proposal" /></Page>} />

          {/* ─── NEW ERP MODULES (DUMMIES) ───────────────────── */}
          <Route path="/purchase/:slug" element={<Page pageKey="purchase-dummy"><DummyPage title="Modul Pembelian (Purchase)" /></Page>} />
          <Route path="/inventory/:slug" element={<Page pageKey="inventory-dummy"><DummyPage title="Modul Inventori" /></Page>} />
          <Route path="/hris/:group/:slug" element={<Page pageKey="hris-dummy"><DummyPage title="Modul HRIS" /></Page>} />
          <Route path="/accounting/:slug" element={<Page pageKey="accounting-dummy"><DummyPage title="Modul Akuntansi & Finance" /></Page>} />
          <Route path="/operasional/:slug" element={<Page pageKey="operasional-dummy"><DummyPage title="Manajemen Sistem" /></Page>} />
          <Route path="/investasi/reksadana" element={<Page pageKey="reksadana"><DummyPage title="Investasi Reksadana" /></Page>} />
          <Route path="/investasi/liquiditas" element={<Page pageKey="liquiditas-invest"><DummyPage title="Manajemen Likuiditas" /></Page>} />

          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </AnimatePresence>
    </Layout>
  );
};

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppContent />
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
