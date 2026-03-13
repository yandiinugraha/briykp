import React, { useState, useEffect, useRef } from 'react';
import type { ReactNode } from 'react';
import { NavLink, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';
import { MODULES } from '../config/modules';
import type { MenuGroup } from '../config/modules';
import {
    LayoutDashboard, ChevronDown, ChevronRight, LogOut, Bell,
    Search
} from 'lucide-react';

interface LayoutProps {
    children: ReactNode;
}





const Layout: React.FC<LayoutProps> = ({ children }) => {
    const { user, logout } = useAuth();
    const location = useLocation();
    const navigate = useNavigate();
    const [openGroups, setOpenGroups] = useState<string[]>([]);
    const [openSubMenus, setOpenSubMenus] = useState<string[]>([]);
    const [globalSearch, setGlobalSearch] = useState('');
    const [notifications, setNotifications] = useState<any[]>([]);
    const [isNotifOpen, setIsNotifOpen] = useState(false);
    const notifRef = useRef<HTMLDivElement>(null);
    const apiUrl = import.meta.env.VITE_API_URL;

    // ─── ACTIVE MODULE DETECTION ───────────────────────────────────
    const activeModule = React.useMemo(() => {
        const path = location.pathname;
        if (path === '/dashboard') return null;

        const mod = MODULES.find(m => path.startsWith(m.basePath));
        if (!mod) {
            if (['/approval', '/finance', '/upload', '/audit'].includes(path)) {
                return MODULES.find(m => m.id === 'operasional') || null;
            }
        }
        return mod || null;
    }, [location.pathname]);

    // ─── AUTO-OPEN LARGE GROUPS BY DEFAULT ────────────────────────
    useEffect(() => {
        const allGroups = MODULES.flatMap(m => m.menus.map(g => g.groupLabel));
        setOpenGroups(allGroups);
        // Close all sub-menus by default as requested
        setOpenSubMenus([]);
    }, []);

    // Ensure current group is always open when navigating
    useEffect(() => {
        const path = location.pathname;
        let groupToOpen = '';
        if (path.startsWith('/kepesertaan')) groupToOpen = 'KEPESERTAAN';
        else if (path.startsWith('/investasi')) groupToOpen = 'INVESTASI';
        else if (['/approval', '/finance', '/upload', '/audit'].includes(path) || path.startsWith('/operasional')) groupToOpen = 'OPERASIONAL & SISTEM';

        if (groupToOpen) {
            setOpenGroups(prev => prev.includes(groupToOpen) ? prev : [...prev, groupToOpen]);
        }
    }, [location.pathname]);

    // ─── NOTIFICATIONS ─────────────────────────────────────────────
    const fetchNotifications = async () => {
        if (!user) return;
        try {
            const res = await axios.get(`${apiUrl}/notifications`);
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
            await axios.put(`${apiUrl}/notifications/${id}/read`);
            fetchNotifications();
        } catch (error) {
            console.error("Error marking read", error);
        }
    };

    // ─── HELPERS ────────────────────────────────────────────────────
    const toggleGroup = (groupLabel: string) => {
        setOpenGroups(prev => prev.includes(groupLabel) ? prev.filter(g => g !== groupLabel) : [...prev, groupLabel]);
    };

    const toggleSubMenu = (label: string) => {
        setOpenSubMenus(prev => prev.includes(label) ? prev.filter(l => l !== label) : [...prev, label]);
    };

    // Calculate all available menus for global search
    const allMenus = React.useMemo(() => {
        const menus: { label: string, path: string, pathGroup: string }[] = [];
        const processGroup = (group: MenuGroup, modName: string) => {
            group.items.forEach(item => {
                if (item.path) {
                    menus.push({ label: item.label, path: item.path, pathGroup: `${modName} / ${group.groupLabel}` });
                }
                if (item.children) {
                    item.children.forEach(child => {
                        if (child.path) {
                            menus.push({ label: `${item.label} › ${child.label}`, path: child.path, pathGroup: `${modName} / ${group.groupLabel}` });
                        }
                    });
                }
            });
        };

        MODULES.forEach(mod => {
            mod.menus.forEach(group => processGroup(group, mod.name));
        });

        menus.push({ label: 'App Launcher / Workspace', path: '/dashboard', pathGroup: 'System' });
        menus.push({ label: 'Info Kepesertaan Saya', path: '/profile', pathGroup: 'Profil' });
        return menus;
    }, []);
    const searchResults = globalSearch ? allMenus.filter(m => m.label.toLowerCase().includes(globalSearch.toLowerCase()) || m.pathGroup.toLowerCase().includes(globalSearch.toLowerCase())) : [];

    const getRoleInitial = (role: string | undefined) => {
        if (!role) return 'U';
        return role.charAt(0).toUpperCase();
    };


    const isPathActive = (path: string) => location.pathname === path;

    const getPageTitle = () => {
        const path = location.pathname;
        if (path === '/kepesertaan') return 'Modul Kepesertaan Overview';
        if (path === '/investasi') return 'Modul Investasi & Treasury';
        if (path === '/purchase') return 'Modul Procurement (Purchase)';
        if (path === '/inventory') return 'Modul Supply Chain (Inventory)';
        if (path.startsWith('/kepesertaan/iuran')) return 'Iuran Peserta';
        if (path.startsWith('/kepesertaan/tht')) return 'Pembayaran Manfaat THT (PHK)';
        if (path.startsWith('/kepesertaan/distribusi')) return 'Distribusi Pengembangan Prospens';
        if (path.startsWith('/kepesertaan/phk')) return 'Pekerja PHK Normal → Peserta Prospens';
        if (path.startsWith('/kepesertaan/nonaktif')) return 'Penonaktifan Peserta Prospens';
        if (path.startsWith('/investasi/obligasi')) return 'Obligasi';
        if (path.startsWith('/investasi/saham')) return 'Saham';
        if (path === '/approval') return 'Workspace Penyetujuan';
        if (path === '/finance') return 'Mutasi Keuangan';
        if (path === '/upload') return 'Sinkronisasi Data Eksternal';
        if (path === '/audit') return 'Audit Trail System';
        if (path === '/kepesertaan/data-kepesertaan') return 'Data Kepesertaan (Maker)';
        if (path === '/kepesertaan/approval-kepesertaan') return 'Approval Data Kepesertaan';
        if (path === '/peserta') return 'Data Kepesertaan';
        if (path === '/proyeksi') return 'Proyeksi Pendaftaran';
        if (path === '/bpjs') return 'Pendaftaran BPJS';
        if (path === '/brilife') return 'Pendaftaran BRI Life';
        if (path === '/feedback') return 'Feedback BPJS';
        if (path === '/sk') return 'Surat Keputusan';
        if (path === '/kepesertaan/profile') return 'Profil Kepesertaan Saya';
        return 'YKP BRI Enterprise';
    };

    // ─── RENDER MENU GROUP ──────────────────────────────────────────
    const renderMenuGroup = (group: MenuGroup) => {
        const isOpen = openGroups.includes(group.groupLabel);
        const isGroupActive = group.items.some(item => {
            if (item.path) return isPathActive(item.path);
            if (item.children) return item.children.some(c => isPathActive(c.path));
            return false;
        });

        return (
            <div className="pt-2" key={group.groupLabel}>
                <button
                    onClick={() => toggleGroup(group.groupLabel)}
                    className={`w-full text-left px-4 py-3 rounded-lg font-bold uppercase tracking-wider text-xs hover:text-white flex justify-between items-center group transition-colors ${isGroupActive ? 'text-bri-orange' : 'text-bri-light/60'
                        }`}
                >
                    <div className="flex items-center gap-2">
                        {group.groupIcon}
                        <span>{group.groupLabel}</span>
                    </div>
                    <ChevronDown
                        size={14}
                        className={`transform transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}
                    />
                </button>

                <div className={`grid transition-[grid-template-rows,opacity] duration-200 ease-out ${isOpen ? 'grid-rows-[1fr] opacity-100 mt-1' : 'grid-rows-[0fr] opacity-0'}`}>
                    <div className="overflow-hidden">
                        <div className="space-y-0.5 pl-2 border-l border-bri-blue/30 ml-4 pb-2">
                            {group.items.map(item => {
                                // Direct link item
                                if (item.path) {
                                    return (
                                        <NavLink
                                            key={item.path}
                                            to={item.path}
                                            className={({ isActive }) =>
                                                `w-full text-left px-3 py-2.5 rounded-lg transition-colors flex items-center gap-2 text-sm ${isActive
                                                    ? 'bg-bri-blue text-white font-medium'
                                                    : 'text-bri-light/80 hover:bg-bri-blue/50 hover:text-white'
                                                }`
                                            }
                                        >
                                            {item.icon}
                                            <span className="truncate">{item.label}</span>
                                        </NavLink>
                                    );
                                }

                                // Expandable sub-menu item
                                if (item.children) {
                                    const isSubOpen = openSubMenus.includes(item.label);
                                    const isSubActive = item.children.some(c => isPathActive(c.path));
                                    return (
                                        <div key={item.label}>
                                            <button
                                                onClick={() => toggleSubMenu(item.label)}
                                                className={`w-full text-left px-3 py-2.5 rounded-lg transition-colors flex items-center justify-between text-sm group ${isSubActive
                                                    ? 'text-white bg-bri-blue/30 font-medium'
                                                    : 'text-bri-light/80 hover:bg-bri-blue/30 hover:text-white'
                                                    }`}
                                            >
                                                <div className="flex items-center gap-2 truncate">
                                                    {item.icon}
                                                    <span className="truncate">{item.label}</span>
                                                </div>
                                                <ChevronRight
                                                    size={12}
                                                    className={`transform transition-transform duration-200 flex-shrink-0 ${isSubOpen ? 'rotate-90' : ''}`}
                                                />
                                            </button>
                                            <div className={`grid transition-[grid-template-rows,opacity] duration-200 ease-out ${isSubOpen ? 'grid-rows-[1fr] opacity-100 mt-0.5 mb-1' : 'grid-rows-[0fr] opacity-0'}`}>
                                                <div className="overflow-hidden">
                                                    <div className="space-y-0.5 pl-3 border-l border-bri-blue/20 ml-3">
                                                        {item.children.map(child => (
                                                            <NavLink
                                                                key={child.path}
                                                                to={child.path}
                                                                className={({ isActive }) =>
                                                                    `w-full text-left px-3 py-2 rounded-md transition-colors flex items-center gap-3 text-sm ${isActive
                                                                        ? 'bg-bri-blue text-white font-medium'
                                                                        : 'text-bri-light/70 hover:bg-bri-blue/40 hover:text-white'
                                                                    }`
                                                                }
                                                            >
                                                                <div className="w-1 h-1 rounded-full bg-current opacity-50 flex-shrink-0" />
                                                                <span className="truncate">{child.label}</span>
                                                            </NavLink>
                                                        ))}
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    );
                                }

                                return null;
                            })}
                        </div>
                    </div>
                </div>
            </div>
        );
    };

    return (
        <div className="min-h-screen flex bg-gray-50 font-sans">
            {/* Sidebar */}
            <aside className="w-72 bg-bri-dark text-white shadow-xl flex flex-col fixed inset-y-0 left-0 z-20">
                <div className="p-5 border-b border-bri-blue/50">
                    <h1 className="flex items-center gap-2">
                        <img src="/logo.png" alt="Logo" className="h-8 bg-white p-1 rounded-md" />
                        <div>
                            <span className="text-lg font-bold tracking-tight text-white block leading-tight">YKP BRI</span>
                            <span className="text-[10px] text-bri-light/70 block">Sistem Kepesertaan & Investasi</span>
                        </div>
                    </h1>
                </div>

                <nav className="flex-1 p-3 space-y-0.5 overflow-y-auto overflow-x-hidden text-sm custom-scrollbar">
                    {/* App Launcher Button */}
                    <NavLink
                        to="/dashboard"
                        className={({ isActive }) =>
                            `flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 shadow-sm border mb-4 mt-2 mx-2 ${isActive
                                ? 'bg-bri-blue/20 text-blue-400 border-bri-blue/30 font-bold'
                                : 'bg-white/5 text-bri-light hover:bg-white/10 border-white/5 font-medium'
                            }`
                        }
                    >
                        <LayoutDashboard size={18} />
                        <span>Workspaces</span>
                    </NavLink>

                    {/* Active Module Title */}
                    {activeModule && (
                        <div className="mb-4 mt-6">
                            <div className="px-4 text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2 flex items-center gap-2 text-blue-400 font-black">
                                <span className={`w-2 h-2 rounded-full ${activeModule.color}`}></span>
                                {activeModule.name}
                            </div>
                        </div>
                    )}

                    {/* Render menus ONLY for active module */}
                    {activeModule && activeModule.menus.map((group) => renderMenuGroup(group))}

                    {/* Peserta specific fallback (if we need to guarantee they see their menu) */}
                    {user?.role === 'Peserta' && !activeModule && MODULES.find(m => m.id === 'kepesertaan')?.menus.map((g: any) => renderMenuGroup(g))}
                </nav>

                <div className="p-4 border-t border-bri-blue/50">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-bri-orange flex items-center justify-center text-white font-bold text-sm">
                            {getRoleInitial(user?.role)}
                        </div>
                        <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium truncate">{user?.username || 'Guest'}</p>
                            <p className="text-xs text-bri-light/70">{user?.role || 'Visitor'}</p>
                        </div>
                        <button
                            onClick={logout}
                            className="p-2 rounded-lg text-bri-light/60 hover:text-red-400 hover:bg-red-500/10 transition-colors"
                            title="Logout"
                        >
                            <LogOut size={16} />
                        </button>
                    </div>
                </div>
            </aside>

            {/* Main Content Area */}
            <div className="flex-1 flex flex-col ml-72 min-h-screen">
                {/* Top Header */}
                <header className="bg-white shadow-sm border-b border-gray-200 h-16 flex items-center justify-between px-8 sticky top-0 z-10 w-full">
                    <h2 className="text-lg font-semibold text-gray-800">
                        {getPageTitle()}
                    </h2>
                    <div className="flex items-center gap-6">
                        {/* Global Menu Search */}
                        <div className="relative w-64 hidden md:block">
                            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
                            <input
                                type="text"
                                value={globalSearch}
                                onChange={e => setGlobalSearch(e.target.value)}
                                placeholder="Cari menu / fitur..."
                                className="w-full pl-9 pr-4 py-2 bg-gray-100/70 border border-transparent rounded-full text-xs focus:outline-none focus:bg-white focus:ring-2 focus:ring-bri-blue/30 focus:border-bri-blue transition-all"
                            />
                            {globalSearch && (
                                <div className="absolute top-12 left-0 w-80 bg-white rounded-xl shadow-xl border border-gray-100 z-50 overflow-hidden max-h-96 overflow-y-auto">
                                    <div className="p-3 bg-gray-50 border-b border-gray-100 font-bold text-xs text-gray-600">Hasil Pencarian</div>
                                    {searchResults.length === 0 ? (
                                        <div className="p-4 text-center text-xs text-gray-500 italic">Menu tidak ditemukan</div>
                                    ) : (
                                        searchResults.map(res => (
                                            <div
                                                key={res.path}
                                                onClick={() => { navigate(res.path); setGlobalSearch(''); }}
                                                className="px-4 py-3 hover:bg-blue-50 cursor-pointer border-b border-gray-50 last:border-0 transition-colors"
                                            >
                                                <div className="flex items-center gap-2 mb-1">
                                                    <span className="text-[10px] bg-blue-100 text-blue-700 font-bold px-1.5 py-0.5 rounded uppercase tracking-wider">{res.pathGroup}</span>
                                                </div>
                                                <div className="text-sm font-medium text-gray-800">{res.label}</div>
                                            </div>
                                        ))
                                    )}
                                </div>
                            )}
                        </div>

                        {/* Notification Bell */}
                        <div className="relative" ref={notifRef}>
                            <button
                                onClick={() => setIsNotifOpen(!isNotifOpen)}
                                className="relative p-2 text-gray-500 hover:text-bri-blue transition-colors rounded-full hover:bg-gray-100 focus:outline-none"
                            >
                                <Bell size={20} />
                                {notifications.filter(n => !n.is_read).length > 0 && (
                                    <span className="absolute top-1 right-1 flex h-4 w-4">
                                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75" />
                                        <span className="relative inline-flex rounded-full h-4 w-4 bg-red-500 text-[9px] font-bold text-white items-center justify-center">
                                            {notifications.filter(n => !n.is_read).length}
                                        </span>
                                    </span>
                                )}
                            </button>

                            {/* Dropdown Notif */}
                            {isNotifOpen && (
                                <div className="absolute right-0 mt-2 w-80 bg-white rounded-xl shadow-2xl border border-gray-100 z-50 overflow-hidden">
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
                                                        {!notif.is_read && <span className="w-2 h-2 rounded-full bg-bri-blue mt-1" />}
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
