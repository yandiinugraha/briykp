
import PlaceholderPage from '../../components/PlaceholderPage';

const MODULE = 'Kepesertaan';
const FEATURE = 'Pembayaran Manfaat THT (PHK)';
const ACCENT = '#0B5E9E';
const STEPS = ['Input', 'Validasi', 'Perhitungan', 'Approval', 'Generate', 'Likuiditas', 'Akuntansi', 'Audit', 'Laporan'];

export const ThtInput = () => <PlaceholderPage moduleName={MODULE} featureName={FEATURE} stepName="Input" stepNumber={1} totalSteps={9} steps={STEPS} accentColor={ACCENT} />;
export const ThtValidasi = () => <PlaceholderPage moduleName={MODULE} featureName={FEATURE} stepName="Validasi" stepNumber={2} totalSteps={9} steps={STEPS} accentColor={ACCENT} />;
export const ThtPerhitungan = () => <PlaceholderPage moduleName={MODULE} featureName={FEATURE} stepName="Perhitungan" stepNumber={3} totalSteps={9} steps={STEPS} accentColor={ACCENT} />;
export const ThtApproval = () => <PlaceholderPage moduleName={MODULE} featureName={FEATURE} stepName="Approval" stepNumber={4} totalSteps={9} steps={STEPS} accentColor={ACCENT} />;
export const ThtGenerate = () => <PlaceholderPage moduleName={MODULE} featureName={FEATURE} stepName="Generate" stepNumber={5} totalSteps={9} steps={STEPS} accentColor={ACCENT} />;
export const ThtLikuiditas = () => <PlaceholderPage moduleName={MODULE} featureName={FEATURE} stepName="Likuiditas" stepNumber={6} totalSteps={9} steps={STEPS} accentColor={ACCENT} />;
export const ThtAkuntansi = () => <PlaceholderPage moduleName={MODULE} featureName={FEATURE} stepName="Akuntansi" stepNumber={7} totalSteps={9} steps={STEPS} accentColor={ACCENT} />;
export const ThtAudit = () => <PlaceholderPage moduleName={MODULE} featureName={FEATURE} stepName="Audit" stepNumber={8} totalSteps={9} steps={STEPS} accentColor={ACCENT} />;
export const ThtLaporan = () => <PlaceholderPage moduleName={MODULE} featureName={FEATURE} stepName="Laporan" stepNumber={9} totalSteps={9} steps={STEPS} accentColor={ACCENT} />;
