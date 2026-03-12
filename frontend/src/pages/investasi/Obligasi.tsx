import React from 'react';
import PlaceholderPage from '../../components/PlaceholderPage';

const MODULE = 'Investasi';
const FEATURE = 'Obligasi';
const ACCENT = '#F37021';
const STEPS = ['Proposal', 'Transaksi', 'Settlement', 'Likuiditas', 'Akuntansi', 'Perhitungan Accrual Bunga & Amortisasi', 'Kupon', 'Valuasi Mark to Market', 'Jatuh Tempo', 'Laporan'];

export const ObligasiProposal = () => <PlaceholderPage moduleName={MODULE} featureName={FEATURE} stepName="Proposal" stepNumber={1} totalSteps={10} steps={STEPS} accentColor={ACCENT} />;
export const ObligasiTransaksi = () => <PlaceholderPage moduleName={MODULE} featureName={FEATURE} stepName="Transaksi" stepNumber={2} totalSteps={10} steps={STEPS} accentColor={ACCENT} />;
export const ObligasiSettlement = () => <PlaceholderPage moduleName={MODULE} featureName={FEATURE} stepName="Settlement" stepNumber={3} totalSteps={10} steps={STEPS} accentColor={ACCENT} />;
export const ObligasiLikuiditas = () => <PlaceholderPage moduleName={MODULE} featureName={FEATURE} stepName="Likuiditas" stepNumber={4} totalSteps={10} steps={STEPS} accentColor={ACCENT} />;
export const ObligasiAkuntansi = () => <PlaceholderPage moduleName={MODULE} featureName={FEATURE} stepName="Akuntansi" stepNumber={5} totalSteps={10} steps={STEPS} accentColor={ACCENT} />;
export const ObligasiAccrual = () => <PlaceholderPage moduleName={MODULE} featureName={FEATURE} stepName="Perhitungan Accrual Bunga & Amortisasi" stepNumber={6} totalSteps={10} steps={STEPS} accentColor={ACCENT} />;
export const ObligasiKupon = () => <PlaceholderPage moduleName={MODULE} featureName={FEATURE} stepName="Kupon" stepNumber={7} totalSteps={10} steps={STEPS} accentColor={ACCENT} />;
export const ObligasiValuasi = () => <PlaceholderPage moduleName={MODULE} featureName={FEATURE} stepName="Valuasi Mark to Market" stepNumber={8} totalSteps={10} steps={STEPS} accentColor={ACCENT} />;
export const ObligasiJatuhTempo = () => <PlaceholderPage moduleName={MODULE} featureName={FEATURE} stepName="Jatuh Tempo" stepNumber={9} totalSteps={10} steps={STEPS} accentColor={ACCENT} />;
export const ObligasiLaporan = () => <PlaceholderPage moduleName={MODULE} featureName={FEATURE} stepName="Laporan" stepNumber={10} totalSteps={10} steps={STEPS} accentColor={ACCENT} />;
