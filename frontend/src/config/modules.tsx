import type { ReactNode } from 'react';
import {
    ShoppingCart, Box, Users, Calculator, ShieldCheck,
    TrendingUp, Settings, FileText, ClipboardList, Package,
    MapPin, CheckSquare, Activity, UserPlus, Fingerprint, Calendar,
    CreditCard, Coins, RefreshCw, BarChart3, Database,
    FileSpreadsheet, FileBarChart, Zap, Wallet
} from 'lucide-react';

export interface SubMenuItem {
    label: string;
    path: string;
}

export interface MenuItem {
    label: string;
    icon: ReactNode;
    path?: string;
    children?: SubMenuItem[];
}

export interface MenuGroup {
    groupLabel: string;
    groupIcon: ReactNode;
    items: MenuItem[];
}

export interface ErpModule {
    id: string;
    name: string;
    description: string;
    icon: any; // Lucide icon
    color: string;
    basePath: string;
    menus: MenuGroup[];
}

// Reusable icons mapping
export const MODULES: ErpModule[] = [
    {
        id: 'kepesertaan',
        name: 'Kepesertaan',
        description: 'Sistem Kepesertaan & Iuran',
        icon: ShieldCheck,
        color: 'bg-blue-600',
        basePath: '/kepesertaan',
        menus: [
            {
                groupLabel: 'KEPESERTAAN',
                groupIcon: <ShieldCheck size={16} />,
                items: [
                    {
                        label: 'Dashboard Iuran',
                        icon: <Activity size={18} />,
                        path: '/kepesertaan/iuran/settlement',
                    },
                    {
                        label: 'Data Kepesertaan',
                        icon: <Users size={18} />,
                        children: [
                            { label: 'Data Peserta', path: '/kepesertaan/data-kepesertaan' },
                            { label: 'Approval Data Kepesertaan', path: '/kepesertaan/approval-kepesertaan' },
                            { label: 'Info Kepesertaan Saya', path: '/kepesertaan/profile' },
                        ],
                    },
                    {
                        label: 'Iuran Peserta',
                        icon: <Coins size={18} />,
                        children: [
                            { label: 'Data Iuran', path: '/kepesertaan/iuran/data' },
                            { label: 'Approval Iuran', path: '/kepesertaan/iuran/approval' },
                            { label: 'Data Iuran Detail', path: '/kepesertaan/iuran/history' },
                            { label: 'Proses Anggota Baru', path: '/kepesertaan/iuran/new-member' },
                            { label: 'Proses Anggota Non-Iuran', path: '/kepesertaan/iuran/missing' },
                            { label: 'Tinjau Data Ganda/Update', path: '/kepesertaan/iuran/duplicate' },
                        ],
                    },
                    {
                        label: 'PHK Normal → Prospens',
                        icon: <RefreshCw size={18} />,
                        children: [
                            { label: 'Upload Data PHK', path: '/kepesertaan/phk/upload' },
                            { label: 'Proyeksi Pendaftaran (Maker)', path: '/kepesertaan/phk/proyeksi' },
                            { label: 'Penerbitan SK Prospens', path: '/kepesertaan/phk/sk' },
                            { label: 'Pendaftaran BPJS (Otomatis)', path: '/kepesertaan/phk/bpjs' },
                            { label: 'Pendaftaran BRILife (Otomatis)', path: '/kepesertaan/phk/brilife' },
                            { label: 'Feedback File BPJS', path: '/kepesertaan/phk/feedback-bpjs' },
                            { label: 'Pembayaran (Checker/Signer)', path: '/kepesertaan/phk/pembayaran' },
                            { label: 'Feedback BRI Life (Maker)', path: '/kepesertaan/phk/feedback-brilife' },
                        ],
                    },
                    {
                        label: 'Pembayaran Manfaat THT',
                        icon: <Wallet size={18} />,
                        children: [
                            { label: 'Input Data Otomatis', path: '/kepesertaan/tht/input' },
                            { label: 'Validasi Persyaratan', path: '/kepesertaan/tht/validasi' },
                            { label: 'Perhitungan Manfaat', path: '/kepesertaan/tht/perhitungan' },
                            { label: 'Approval', path: '/kepesertaan/tht/approval' },
                            { label: 'Generate Pembayaran', path: '/kepesertaan/tht/generate' },
                            { label: 'Kebutuhan Likuiditas', path: '/kepesertaan/tht/likuiditas' },
                            { label: 'Proses Akuntansi', path: '/kepesertaan/tht/akuntansi' },
                            { label: 'Audit Trail', path: '/kepesertaan/tht/audit' },
                            { label: 'Laporan Output', path: '/kepesertaan/tht/laporan' },
                        ],
                    },
                    {
                        label: 'Distribusi Pengembangan',
                        icon: <Calculator size={18} />,
                        children: [
                            { label: 'Input Parameter', path: '/kepesertaan/distribusi/input-otomatis' },
                            { label: 'Perhitungan Individu', path: '/kepesertaan/distribusi/perhitungan' },
                            { label: 'Perhitungan Lanjutan', path: '/kepesertaan/distribusi/perhitungan-lanjutan' },
                            { label: 'Simulasi Perhitungan', path: '/kepesertaan/distribusi/simulasi' },
                            { label: 'Approval Distribusi', path: '/kepesertaan/distribusi/approval' },
                            { label: 'Posting ke Individu', path: '/kepesertaan/distribusi/posting' },
                            { label: 'Integrasi Akuntansi', path: '/kepesertaan/distribusi/akuntansi' },
                            { label: 'Rekonsiliasi', path: '/kepesertaan/distribusi/rekonsiliasi' },
                            { label: 'Laporan', path: '/kepesertaan/distribusi/laporan' },
                        ],
                    },

                    {
                        label: 'Penonaktifan Peserta',
                        icon: <UserPlus size={18} />,
                        children: [
                            { label: 'Setup Auto-Trigger', path: '/kepesertaan/nonaktif/setup' },
                            { label: 'Validasi System', path: '/kepesertaan/nonaktif/validasi' },
                            { label: 'Proses Penonaktifan', path: '/kepesertaan/nonaktif/proses' },
                            { label: 'Update Status Batch', path: '/kepesertaan/nonaktif/update' },
                            { label: 'Dampak Perhitungan', path: '/kepesertaan/nonaktif/dampak' },
                            { label: 'Audit Trail', path: '/kepesertaan/nonaktif/audit' },
                            { label: 'Laporan Penonaktifan', path: '/kepesertaan/nonaktif/laporan' },
                        ],
                    },
                ],
            }
        ]
    },
    {
        id: 'investasi',
        name: 'Investasi',
        description: 'Likuiditas, Investasi & Settlement',
        icon: TrendingUp,
        color: 'bg-cyan-600',
        basePath: '/investasi',
        menus: [
            {
                groupLabel: 'INVESTASI FLOW',
                groupIcon: <TrendingUp size={16} />,
                items: [
                    {
                        label: 'Likuiditas',
                        icon: <Activity size={18} />,
                        path: '/investasi/likuiditas',
                    },
                    {
                        label: 'Transaksi Investasi',
                        icon: <TrendingUp size={18} />,
                        children: [
                            { label: 'Saham', path: '/investasi/transaksi/saham' },
                            { label: 'Obligasi', path: '/investasi/transaksi/obligasi' },
                            { label: 'Reksadana', path: '/investasi/transaksi/reksadana' },
                            { label: 'Deposito', path: '/investasi/transaksi/deposito' },
                        ],
                    },
                    {
                        label: 'Settlement',
                        icon: <RefreshCw size={18} />,
                        path: '/investasi/settlement',
                    },
                    {
                        label: 'Akuntansi & Pajak',
                        icon: <Calculator size={18} />,
                        children: [
                            { label: 'Pendapatan Investasi', path: '/investasi/akuntansi/pendapatan' },
                            { label: 'Pelaporan Pajak PPh', path: '/investasi/akuntansi/pajak' },
                            { label: 'Jurnal Otomatis', path: '/investasi/akuntansi/jurnal' },
                        ],
                    },
                ],
            }
        ]
    },
    {
        id: 'purchase',
        name: 'Purchase',
        description: 'Vendor, PR, PO, Quotation & Invoice',
        icon: ShoppingCart,
        color: 'bg-emerald-500',
        basePath: '/purchase',
        menus: [
            {
                groupLabel: 'PURCHASE',
                groupIcon: <ShoppingCart size={16} />,
                items: [
                    { label: 'Vendor', icon: <Users size={18} />, path: '/purchase/vendor' },
                    { label: 'Purchase Request (PR)', icon: <ClipboardList size={18} />, path: '/purchase/pr' },
                    {
                        label: 'Purchase Order (PO)', icon: <CheckSquare size={18} />, path: '/purchase/po'
                    },
                    {
                        label: 'Quotation', icon: <FileText size={18} />, path: '/purchase/quotation'
                    },
                    {
                        label: 'Invoice Vendor', icon: <FileSpreadsheet size={18} />, path: '/purchase/invoice'
                    },
                ],
            }
        ]
    },
    {
        id: 'inventory',
        name: 'Inventory',
        description: 'Item, Location, Stock & Movement',
        icon: Box,
        color: 'bg-amber-500',
        basePath: '/inventory',
        menus: [
            {
                groupLabel: 'INVENTORY',
                groupIcon: <Box size={16} />,
                items: [
                    { label: 'Dashboard', icon: <Activity size={18} />, path: '/inventory/dashboard' },
                    {
                        label: 'Item / Master Data', icon: <Package size={18} />, path: '/inventory/item'
                    },
                    {
                        label: 'Location', icon: <MapPin size={18} />, path: '/inventory/location'
                    },
                    {
                        label: 'Stock', icon: <Database size={18} />, path: '/inventory/stock'
                    },
                    {
                        label: 'Movement', icon: <RefreshCw size={18} />, path: '/inventory/movement'
                    },
                    {
                        label: 'Loss & Adjustment', icon: <Zap size={18} />, path: '/inventory/adjustment'
                    },
                    {
                        label: 'History', icon: <FileText size={18} />, path: '/inventory/history'
                    },
                ],
            }
        ]
    },
    {
        id: 'hris',
        name: 'HRIS',
        description: 'Recruitment, Employee, Attendance & Payroll',
        icon: Users,
        color: 'bg-indigo-500',
        basePath: '/hris',
        menus: [
            {
                groupLabel: 'RECRUITMENT',
                groupIcon: <UserPlus size={16} />,
                items: [
                    { label: 'MPP', icon: <BarChart3 size={18} />, path: '/hris/recruitment/mpp' },
                    {
                        label: 'Campaign / Lowongan', icon: <Zap size={18} />, path: '/hris/recruitment/campaign'
                    },
                    {
                        label: 'Candidate Profile', icon: <Users size={18} />, path: '/hris/recruitment/candidate'
                    },
                    {
                        label: 'Test', icon: <CheckSquare size={18} />, path: '/hris/recruitment/test'
                    },
                    {
                        label: 'OnBoarding', icon: <Fingerprint size={18} />, path: '/hris/recruitment/onboarding'
                    },
                ],
            },
            {
                groupLabel: 'EMPLOYEE MANAGEMENT',
                groupIcon: <Users size={16} />,
                items: [
                    { label: 'Organisation Chart', icon: <Activity size={18} />, path: '/hris/employee/org' },
                    {
                        label: 'Employee', icon: <Users size={18} />, path: '/hris/employee/list'
                    },
                    {
                        label: 'Contract', icon: <FileText size={18} />, path: '/hris/employee/contract'
                    },
                    {
                        label: 'Training', icon: <Zap size={18} />, path: '/hris/employee/training'
                    },
                    {
                        label: 'Punishment', icon: <ShieldCheck size={18} />, path: '/hris/employee/punishment'
                    },
                    {
                        label: 'Layoff', icon: <UserPlus size={18} />, path: '/hris/employee/layoff'
                    },
                ],
            },
            {
                groupLabel: 'ATTENDANCE',
                groupIcon: <Calendar size={16} />,
                items: [
                    { label: 'Shift', icon: <RefreshCw size={18} />, path: '/hris/attendance/shift' },
                    {
                        label: 'Workplace', icon: <MapPin size={18} />, path: '/hris/attendance/workplace'
                    },
                    {
                        label: 'Attendance', icon: <Fingerprint size={18} />, path: '/hris/attendance/log'
                    },
                    {
                        label: 'Leave', icon: <Calendar size={18} />, path: '/hris/attendance/leave'
                    },
                    {
                        label: 'Overtime', icon: <Activity size={18} />, path: '/hris/attendance/overtime'
                    },
                    {
                        label: 'Trip', icon: <MapPin size={18} />, path: '/hris/attendance/trip'
                    },
                ],
            },
            {
                groupLabel: 'PAYROLL',
                groupIcon: <Coins size={16} />,
                items: [
                    { label: 'Payroll Component', icon: <Settings size={18} />, path: '/hris/payroll/component' },
                    {
                        label: 'Payroll Date', icon: <Calendar size={18} />, path: '/hris/payroll/date'
                    },
                    {
                        label: 'Payroll', icon: <CreditCard size={18} />, path: '/hris/payroll/process'
                    },
                ],
            }
        ]
    },
    {
        id: 'accounting',
        name: 'FA & Accounting',
        description: 'COA, Jurnal, Tax & Reports',
        icon: Calculator,
        color: 'bg-rose-500',
        basePath: '/accounting',
        menus: [
            {
                groupLabel: 'FA & ACCOUNTING',
                groupIcon: <Calculator size={16} />,
                items: [
                    { label: 'COA (Chart of Account)', icon: <FileText size={18} />, path: '/accounting/coa' },
                    {
                        label: 'Jurnal Entry', icon: <ClipboardList size={18} />, path: '/accounting/jurnal'
                    },
                    {
                        label: 'Transaction', icon: <RefreshCw size={18} />, path: '/accounting/transaction'
                    },
                    {
                        label: 'Voucher Payment', icon: <CreditCard size={18} />, path: '/accounting/voucher'
                    },
                    {
                        label: 'Tax', icon: <FileSpreadsheet size={18} />, path: '/accounting/tax'
                    },
                    {
                        label: 'Report',
                        icon: <FileBarChart size={18} />,
                        children: [
                            { label: 'Balance Sheet', path: '/accounting/report/balance-sheet' },
                            { label: 'Profit and Loss', path: '/accounting/report/profit-loss' },
                            { label: 'Account List', path: '/accounting/report/account-list' },
                            { label: 'General Ledger', path: '/accounting/report/ledger' },
                            { label: 'Trial Balance', path: '/accounting/report/trial-balance' },
                            { label: 'Aging AP & AR', path: '/accounting/report/aging' },
                            { label: 'Tax', path: '/accounting/report/tax' },
                        ],
                    },
                ],
            }
        ]
    },
    {
        id: 'operasional',
        name: 'Operasional System',
        description: 'Setting & Konfigurasi',
        icon: Settings,
        color: 'bg-gray-700',
        basePath: '/operasional',
        menus: [
            {
                groupLabel: 'OPERASIONAL & SISTEM',
                groupIcon: <Settings size={16} />,
                items: [
                    { label: 'User Management', icon: <Users size={18} />, path: '/operasional/users' },
                    {
                        label: 'Roles & Permissions', icon: <ShieldCheck size={18} />, path: '/operasional/roles'
                    },
                    {
                        label: 'Audit Trail', icon: <Activity size={18} />, path: '/operasional/audit'
                    },
                    {
                        label: 'System Settings', icon: <Settings size={18} />, path: '/operasional/settings'
                    },
                ],
            }
        ]
    }
];


