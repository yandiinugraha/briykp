import React, { useState, useEffect, useRef } from 'react';
import type { ReactNode } from 'react';
import { NavLink, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';

interface LayoutProps {
    children: ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
    const { user, logout } = useAuth();
    const location = useLocation();
    const navigate = useNavigate();
    const [openMenu, setOpenMenu] = useState<string | null>(null);
    const [notifications, setNotifications] = useState<any[]>([]);
    const [isNotifOpen, setIsNotifOpen] = useState(false);
    const notifRef = useRef<HTMLDivElement>(null);

    // Auto-open menus based on current path
    useEffect(() => {
        const path = location.pathname;
        if (['/peserta', '/proyeksi', '/bpjs', '/brilife', '/feedback', '/sk'].includes(path)) {
            setOpenMenu('Kepesertaan');
        } else if (['/approval', '/finance', '/upload', '/audit'].includes(path)) {
            setOpenMenu('Operasional');
        }
    }, [location.pathname]);

    // Fetch Notifications
    const fetchNotifications = async () => {
        if (!user) return;
        try {
            const res = await axios.get('http://localhost:3000/api/notifications');
            setNotifications(res.data || []);
        } catch (error) {
            console.error("Error fetching notifications", error);
        }
    };

    useEffect(() => {
        fetchNotifications();
        const interval = setInterval(fetchNotifications, 30000);
        return () => clearInterval(interval);
    }, [user]);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (notifRef.current && !notifRef.current.contains(event.target as Node)) {
                setIsNotifOpen(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const markAsRead = async (id: number) => {
        try {
            await axios.put(`http://localhost:3000/api/notifications/${id}/read`);
            fetchNotifications();
        } catch (error) {
            console.error("Error marking read", error);
        }
    };

    const toggleMenu = (menuName: string) => {
        setOpenMenu(prev => prev === menuName ? null : menuName);
    };

    const getRoleInitial = (role: string | undefined) => {
        if (!role) return 'U';
        return role.charAt(0).toUpperCase();
    };

    const hasPermission = (path: string) => {
        if (!user) return false;
        if (user.role === 'Super Admin') return true;

        switch (path) {
            case 'DASHBOARD':
                return true;
            case 'PESERTA':
            case 'PROYEKSI':
            case 'BPJS':
            case 'BRILIFE':
            case 'FEEDBACK':
            case 'SK':
                return ['Admin', 'Staff'].includes(user.role);
            case 'APPROVAL':
                return ['Admin', 'Staff'].includes(user.role);
            case 'FINANCE':
                return user.role === 'Admin';
            case 'UPLOAD':
                return user.role === 'Admin';
            case 'AUDIT':
                return user.role === 'Admin' || user.role === 'Super Admin';
            case 'PROFILE':
                return user.role === 'Peserta';
            default:
                return false;
        }
    };

    const navLinkClass = ({ isActive }: { isActive: boolean }) =>
        `w-full text-left px-4 py-2 rounded-lg shadow-sm transition-colors flex items-center gap-3 ${isActive ? 'bg-bri-blue text-white font-medium' : 'text-bri-light/80 hover:bg-bri-blue/50 hover:text-white'}`;

    const subNavLinkClass = ({ isActive }: { isActive: boolean }) =>
        `w-full text-left px-3 py-2 rounded-lg transition-colors flex items-center gap-2 ${isActive ? 'bg-bri-blue text-white font-medium' : 'text-bri-light/80 hover:bg-bri-blue/50 hover:text-white'}`;

    const getPageTitle = () => {
        const path = location.pathname;
        if (path === '/dashboard') return 'Dashboard Overview';
        if (path === '/peserta') return 'Data Kepesertaan';
        if (path === '/approval') return 'Workspace Penyetujuan';
        if (path === '/finance') return 'Mutasi Keuangan';
        if (path === '/upload') return 'Sinkronisasi Data Eksternal';
        if (path === '/audit') return 'Audit Trail System';
        if (path === '/proyeksi') return 'Proyeksi Pendaftaran';
        if (path === '/bpjs') return 'Pendaftaran BPJS';
        if (path === '/brilife') return 'Pendaftaran BRI Life';
        if (path === '/feedback') return 'Feedback BPJS';
        if (path === '/sk') return 'Surat Keputusan';
        if (path === '/profile') return 'Profil Saya';
        return '';
    };

    return (
        <div className="min-h-screen flex bg-gray-50 font-sans">
            {/* Sidebar */}
            <aside className="w-64 bg-bri-dark text-white shadow-xl flex flex-col fixed inset-y-0 left-0 z-20">
                <div className="p-6 border-b border-bri-blue/50">
                    <h1 className="flex items-center gap-2">
                        <img src="/logo.png" alt="Logo" className="h-8 bg-white p-1 rounded-md" />
                        <span className="text-xl font-bold tracking-tight text-white">YKP BRI</span>
                    </h1>
                    <p className="text-xs mt-1 text-bri-light/80">Sistem Kepesertaan Prospens</p>
                </div>

                <nav className="flex-1 p-4 space-y-1 overflow-y-auto overflow-x-hidden text-sm">
                    {hasPermission('DASHBOARD') && (
                        <NavLink to="/dashboard" className={navLinkClass}>
                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="7" height="9"></rect><rect x="14" y="3" width="7" height="5"></rect><rect x="14" y="12" width="7" height="9"></rect><rect x="3" y="16" width="7" height="5"></rect></svg>
                            Dashboard
                        </NavLink>
                    )}

                    {/* KEPESERTAAN GROUP */}
                    {hasPermission('PESERTA') && (
                        <div className="pt-2">
                            <button
                                onClick={() => toggleMenu('Kepesertaan')}
                                className="w-full text-left px-4 py-2 rounded-lg text-bri-light/60 font-bold uppercase tracking-wider text-[10px] hover:text-white flex justify-between items-center group"
                            >
                                <div className="flex items-center gap-2">
                                    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle><path d="M23 21v-2a4 4 0 0 0-3-3.87"></path><path d="M16 3.13a4 4 0 0 1 0 7.75"></path></svg>
                                    <span>Kepesertaan</span>
                                </div>
                                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={`transform transition-transform ${openMenu === 'Kepesertaan' ? 'rotate-180' : ''}`}><polyline points="6 9 12 15 18 9"></polyline></svg>
                            </button>

                            {openMenu === 'Kepesertaan' && (
                                <div className="mt-1 space-y-1 pl-2 border-l border-bri-blue/30 ml-2">
                                    <NavLink to="/peserta" className={subNavLinkClass}>
                                        <div className="w-1.5 h-1.5 rounded-full bg-current opacity-50"></div>
                                        Manajemen Peserta
                                    </NavLink>
                                    <NavLink to="/proyeksi" className={subNavLinkClass}>
                                        <div className="w-1.5 h-1.5 rounded-full bg-current opacity-50"></div>
                                        Proyeksi Pendaftaran
                                    </NavLink>
                                    <NavLink to="/bpjs" className={subNavLinkClass}>
                                        <div className="w-1.5 h-1.5 rounded-full bg-current opacity-50"></div>
                                        Pendaftaran BPJS
                                    </NavLink>
                                    <NavLink to="/brilife" className={subNavLinkClass}>
                                        <div className="w-1.5 h-1.5 rounded-full bg-current opacity-50"></div>
                                        Pendaftaran BRI Life
                                    </NavLink>
                                    <NavLink to="/feedback" className={subNavLinkClass}>
                                        <div className="w-1.5 h-1.5 rounded-full bg-current opacity-50"></div>
                                        Upload Feedback BPJS
                                    </NavLink>
                                    <NavLink to="/sk" className={subNavLinkClass}>
                                        <div className="w-1.5 h-1.5 rounded-full bg-current opacity-50"></div>
                                        Dokumen Surat Keputusan
                                    </NavLink>
                                </div>
                            )}
                        </div>
                    )}

                    {/* OPERASIONAL GROUP */}
                    {(hasPermission('APPROVAL') || hasPermission('FINANCE') || hasPermission('UPLOAD')) && (
                        <div className="pt-2">
                            <button
                                onClick={() => toggleMenu('Operasional')}
                                className="w-full text-left px-4 py-2 rounded-lg text-bri-light/60 font-bold uppercase tracking-wider text-[10px] hover:text-white flex justify-between items-center group"
                            >
                                <div className="flex items-center gap-2">
                                    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21.2 15c.7-1.2 1-2.5.7-3.9-.6-2-2.4-3.5-4.4-3.5h-1.2c-.7-3-3.2-5.2-6.2-5.6-3-.3-5.9 1.3-7.3 4-1.2 2.5-1 6.5.5 8.8m8.7-1.6V21"></path><path d="M16 16l-4-4-4 4"></path></svg>
                                    <span>Operasional & Sistem</span>
                                </div>
                                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={`transform transition-transform ${openMenu === 'Operasional' ? 'rotate-180' : ''}`}><polyline points="6 9 12 15 18 9"></polyline></svg>
                            </button>

                            {openMenu === 'Operasional' && (
                                <div className="mt-1 space-y-1 pl-2 border-l border-bri-blue/30 ml-2">
                                    {hasPermission('APPROVAL') && (
                                        <NavLink to="/approval" className={subNavLinkClass}>
                                            <div className="w-1.5 h-1.5 rounded-full bg-current opacity-50"></div>
                                            Approval Workspace
                                        </NavLink>
                                    )}
                                    {hasPermission('FINANCE') && (
                                        <NavLink to="/finance" className={subNavLinkClass}>
                                            <div className="w-1.5 h-1.5 rounded-full bg-current opacity-50"></div>
                                            Keuangan & Premi
                                        </NavLink>
                                    )}
                                    {hasPermission('UPLOAD') && (
                                        <NavLink to="/upload" className={subNavLinkClass}>
                                            <div className="w-1.5 h-1.5 rounded-full bg-current opacity-50"></div>
                                            Upload HC & Sinkronisasi
                                        </NavLink>
                                    )}
                                    {hasPermission('AUDIT') && (
                                        <NavLink to="/audit" className={subNavLinkClass}>
                                            <div className="w-1.5 h-1.5 rounded-full bg-current opacity-50"></div>
                                            Audit Trail System
                                        </NavLink>
                                    )}
                                </div>
                            )}
                        </div>
                    )}

                    {/* PROFILE GROUP (PESERTA) */}
                    {hasPermission('PROFILE') && (
                        <div className="pt-2">
                            <NavLink to="/profile" className={navLinkClass}>
                                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>
                                Info Kepesertaan Saya
                            </NavLink>
                        </div>
                    )}
                </nav>

                <div className="p-4 border-t border-bri-blue/50">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-bri-orange flex items-center justify-center text-white font-bold text-sm">
                            {getRoleInitial(user?.role)}
                        </div>
                        <div>
                            <p className="text-sm font-medium truncate w-32">{user?.username || 'Guest'}</p>
                            <p className="text-xs text-bri-light/70">{user?.role || 'Visitor'}</p>
                        </div>
                    </div>
                </div>
            </aside>

            {/* Main Content Area */}
            <div className="flex-1 flex flex-col ml-64 min-h-screen">
                {/* Top Header */}
                <header className="bg-white shadow-sm border-b border-gray-200 h-16 flex items-center justify-between px-8 sticky top-0 z-10 w-full">
                    <h2 className="text-lg font-semibold text-gray-800">
                        {getPageTitle()}
                    </h2>
                    <div className="flex items-center gap-6">
                        {/* Notification Bell */}
                        <div className="relative" ref={notifRef}>
                            <button
                                onClick={() => setIsNotifOpen(!isNotifOpen)}
                                className="relative p-2 text-gray-500 hover:text-bri-blue transition-colors rounded-full hover:bg-gray-100 focus:outline-none"
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                                </svg>
                                {notifications.filter(n => !n.is_read).length > 0 && (
                                    <span className="absolute top-1 right-1 flex h-4 w-4">
                                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                                        <span className="relative inline-flex rounded-full h-4 w-4 bg-red-500 text-[9px] font-bold text-white items-center justify-center">
                                            {notifications.filter(n => !n.is_read).length}
                                        </span>
                                    </span>
                                )}
                            </button>

                            {/* Dropdown Notif */}
                            {isNotifOpen && (
                                <div className="absolute right-0 mt-2 w-80 bg-white rounded-xl shadow-2xl border border-gray-100 z-50 overflow-hidden animate-in fade-in slide-in-from-top-2">
                                    <div className="p-3 border-b border-gray-100 bg-gray-50 flex justify-between items-center">
                                        <h3 className="text-sm font-bold text-gray-800">Notifikasi</h3>
                                        <span className="text-[10px] text-gray-500 bg-white px-2 py-1 rounded border border-gray-200">
                                            {notifications.filter(n => !n.is_read).length} Baru
                                        </span>
                                    </div>
                                    <div className="max-h-[300px] overflow-y-auto">
                                        {notifications.length === 0 ? (
                                            <div className="p-6 text-center text-xs text-gray-400 italic">
                                                Tidak ada notifikasi
                                            </div>
                                        ) : (
                                            notifications.map((notif: any) => (
                                                <div
                                                    key={notif.id}
                                                    onClick={() => {
                                                        markAsRead(notif.id);
                                                        if (notif.link_url) navigate('/approval');
                                                    }}
                                                    className={`p-3 border-b border-gray-50 hover:bg-gray-50 cursor-pointer transition-colors ${!notif.is_read ? 'bg-blue-50/30' : ''}`}
                                                >
                                                    <div className="flex justify-between items-start mb-1">
                                                        <p className={`text-xs font-bold ${!notif.is_read ? 'text-gray-900' : 'text-gray-600'}`}>
                                                            {notif.title}
                                                        </p>
                                                        {!notif.is_read && <span className="w-2 h-2 rounded-full bg-bri-blue mt-1"></span>}
                                                    </div>
                                                    <p className="text-[10px] text-gray-500 line-clamp-2">{notif.message}</p>
                                                    <p className="text-[9px] text-gray-400 mt-1">{new Date(notif.created_at).toLocaleString('id-ID')}</p>
                                                </div>
                                            ))
                                        )}
                                    </div>
                                </div>
                            )}
                        </div>

                        <div className="h-6 w-px bg-gray-300"></div>

                        <button
                            onClick={logout}
                            className="text-sm font-medium text-red-600 hover:text-red-700 hover:bg-red-50 px-3 py-1.5 rounded-md transition-colors"
                        >
                            Logout
                        </button>
                    </div>
                </header>

                {/* Dynamic Body */}
                <main className="flex-1 overflow-auto p-8 bg-gray-50/50">
                    {children}
                </main>
            </div>
        </div>
    );
};

export default Layout;
