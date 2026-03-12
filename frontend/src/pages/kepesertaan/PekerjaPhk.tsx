import React from 'react';
import PlaceholderPage from '../../components/PlaceholderPage';

const MODULE = 'Kepesertaan';
const FEATURE = 'PHK Normal → Prospens';
const ACCENT = '#0B5E9E';
const STEPS = ['Proyeksi Pendaftaran', 'Pembaharuan Data (SK)', 'Pendaftaran BPJS Kes', 'Pendaftaran BRI Life', 'Upload Feedback BPJS', 'Pembayaran Premi', 'Feedback BRI Life'];

export const PhkPembayaran = () => <PlaceholderPage moduleName={MODULE} featureName={FEATURE} stepName="Pembayaran Premi" stepNumber={6} totalSteps={7} steps={STEPS} accentColor={ACCENT} />;
export const PhkFeedbackBrilife = () => <PlaceholderPage moduleName={MODULE} featureName={FEATURE} stepName="Feedback BRI Life" stepNumber={7} totalSteps={7} steps={STEPS} accentColor={ACCENT} />;
