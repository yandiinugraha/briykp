import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { AuthProvider, useAuth } from './context/AuthContext';
import Layout from './components/Layout';
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

  if (!token) {
    return (
      <AnimatePresence mode="wait">
        <motion.div
          key="login"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="h-full w-full"
        >
          <Login />
        </motion.div>
      </AnimatePresence>
    );
  }

  return (
    <Layout>
      <AnimatePresence mode="wait">
        <Routes>
          <Route path="/dashboard" element={
            <motion.div key="dashboard" initial="initial" animate="in" exit="out" variants={pageVariants} transition={pageTransition} className="w-full">
              <Dashboard />
            </motion.div>
          } />
          <Route path="/peserta" element={
            <motion.div key="peserta" initial="initial" animate="in" exit="out" variants={pageVariants} transition={pageTransition} className="w-full">
              <PesertaManagement />
            </motion.div>
          } />
          <Route path="/proyeksi" element={
            <motion.div key="proyeksi" initial="initial" animate="in" exit="out" variants={pageVariants} transition={pageTransition} className="w-full">
              <ProyeksiPendaftaran />
            </motion.div>
          } />
          <Route path="/bpjs" element={
            <motion.div key="bpjs" initial="initial" animate="in" exit="out" variants={pageVariants} transition={pageTransition} className="w-full">
              <PendaftaranBpjs />
            </motion.div>
          } />
          <Route path="/brilife" element={
            <motion.div key="brilife" initial="initial" animate="in" exit="out" variants={pageVariants} transition={pageTransition} className="w-full">
              <PendaftaranBrilife />
            </motion.div>
          } />
          <Route path="/feedback" element={
            <motion.div key="feedback" initial="initial" animate="in" exit="out" variants={pageVariants} transition={pageTransition} className="w-full">
              <UploadFeedbackBpjs />
            </motion.div>
          } />
          <Route path="/sk" element={
            <motion.div key="sk" initial="initial" animate="in" exit="out" variants={pageVariants} transition={pageTransition} className="w-full">
              <SkProspens />
            </motion.div>
          } />
          <Route path="/approval" element={
            <motion.div key="approval" initial="initial" animate="in" exit="out" variants={pageVariants} transition={pageTransition} className="w-full">
              <ApprovalWorkspace />
            </motion.div>
          } />
          <Route path="/upload" element={
            <motion.div key="upload" initial="initial" animate="in" exit="out" variants={pageVariants} transition={pageTransition} className="w-full">
              <SinkronisasiData />
            </motion.div>
          } />
          <Route path="/finance" element={
            <motion.div key="finance" initial="initial" animate="in" exit="out" variants={pageVariants} transition={pageTransition} className="w-full">
              <ModulKeuangan />
            </motion.div>
          } />
          <Route path="/audit" element={
            <motion.div key="audit" initial="initial" animate="in" exit="out" variants={pageVariants} transition={pageTransition} className="w-full">
              <AuditTrail />
            </motion.div>
          } />
          <Route path="/profile" element={
            <motion.div key="profile" initial="initial" animate="in" exit="out" variants={pageVariants} transition={pageTransition} className="w-full">
              <InfoKepesertaan />
            </motion.div>
          } />
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
