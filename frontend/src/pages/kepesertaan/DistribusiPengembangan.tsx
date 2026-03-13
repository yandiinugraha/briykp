
import PlaceholderPage from '../../components/PlaceholderPage';

const MODULE = 'Kepesertaan';
const FEATURE = 'Distribusi Pengembangan Prospens';
const ACCENT = '#0B5E9E';
const STEPS = ['Input Otomatis', 'Perhitungan', 'Perhitungan Lanjutan', 'Simulasi', 'Approval', 'Posting', 'Akuntansi', 'Rekonsiliasi', 'Laporan'];

export const DistribusiInputOtomatis = () => <PlaceholderPage moduleName={MODULE} featureName={FEATURE} stepName="Input Otomatis" stepNumber={1} totalSteps={9} steps={STEPS} accentColor={ACCENT} />;
export const DistribusiPerhitungan = () => <PlaceholderPage moduleName={MODULE} featureName={FEATURE} stepName="Perhitungan" stepNumber={2} totalSteps={9} steps={STEPS} accentColor={ACCENT} />;
export const DistribusiPerhitunganLanjutan = () => <PlaceholderPage moduleName={MODULE} featureName={FEATURE} stepName="Perhitungan Lanjutan" stepNumber={3} totalSteps={9} steps={STEPS} accentColor={ACCENT} />;
export const DistribusiSimulasi = () => <PlaceholderPage moduleName={MODULE} featureName={FEATURE} stepName="Simulasi" stepNumber={4} totalSteps={9} steps={STEPS} accentColor={ACCENT} />;
export const DistribusiApproval = () => <PlaceholderPage moduleName={MODULE} featureName={FEATURE} stepName="Approval" stepNumber={5} totalSteps={9} steps={STEPS} accentColor={ACCENT} />;
export const DistribusiPosting = () => <PlaceholderPage moduleName={MODULE} featureName={FEATURE} stepName="Posting" stepNumber={6} totalSteps={9} steps={STEPS} accentColor={ACCENT} />;
export const DistribusiAkuntansi = () => <PlaceholderPage moduleName={MODULE} featureName={FEATURE} stepName="Akuntansi" stepNumber={7} totalSteps={9} steps={STEPS} accentColor={ACCENT} />;
export const DistribusiRekonsiliasi = () => <PlaceholderPage moduleName={MODULE} featureName={FEATURE} stepName="Rekonsiliasi" stepNumber={8} totalSteps={9} steps={STEPS} accentColor={ACCENT} />;
export const DistribusiLaporan = () => <PlaceholderPage moduleName={MODULE} featureName={FEATURE} stepName="Laporan" stepNumber={9} totalSteps={9} steps={STEPS} accentColor={ACCENT} />;
