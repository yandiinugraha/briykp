import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { MODULES } from '../config/modules';
import { ArrowRight, ChevronRight } from 'lucide-react';

const WorkspaceHome: React.FC = () => {
    const navigate = useNavigate();
    const location = useLocation();

    const activeModule = React.useMemo(() => {
        const path = location.pathname;
        return MODULES.find(m => path.startsWith(m.basePath)) || null;
    }, [location.pathname]);

    if (!activeModule) return null;

    return (
        <div className="max-w-7xl mx-auto p-4 md:p-8">
            <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                className="mb-10 flex items-center gap-4"
            >
                <div className={`w-16 h-16 rounded-2xl flex items-center justify-center text-white shadow-lg ${activeModule.color}`}>
                    {React.createElement(activeModule.icon, { size: 32 })}
                </div>
                <div>
                    <h1 className="text-4xl font-black text-gray-900 tracking-tight">{activeModule.name}</h1>
                    <p className="text-gray-500 text-lg mt-1">{activeModule.description}</p>
                </div>
            </motion.div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {activeModule.menus.map((group) => (
                    <React.Fragment key={group.groupLabel}>
                        {group.items.map((item, idx) => (
                            <motion.div
                                key={item.label}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: idx * 0.05 }}
                                onClick={() => item.path ? navigate(item.path) : null}
                                className={`group relative bg-white rounded-3xl p-6 shadow-sm border border-gray-100 transition-all duration-300 ${item.path ? 'hover:shadow-xl hover:-translate-y-1 cursor-pointer' : ''}`}
                            >
                                <div className="flex items-start justify-between mb-4">
                                    <div className={`p-3 rounded-2xl bg-gray-50 text-gray-700 group-hover:${activeModule.color.replace('bg-', 'bg-opacity-10 text-')} transition-colors`}>
                                        {item.icon}
                                    </div>
                                    {item.path && (
                                        <div className="text-gray-300 group-hover:text-blue-500 transition-colors">
                                            <ArrowRight size={20} />
                                        </div>
                                    )}
                                </div>

                                <h3 className="text-xl font-bold text-gray-900 mb-2 truncate">{item.label}</h3>

                                {item.children ? (
                                    <div className="space-y-2 mt-4">
                                        {item.children.slice(0, 4).map((child) => (
                                            <div
                                                key={child.path}
                                                onClick={(e) => { e.stopPropagation(); navigate(child.path); }}
                                                className="flex items-center justify-between p-3 rounded-xl hover:bg-gray-50 text-sm text-gray-600 font-medium transition-colors cursor-pointer border border-transparent hover:border-gray-100 group/child"
                                            >
                                                <span className="truncate">{child.label}</span>
                                                <ChevronRight size={14} className="opacity-0 group-hover/child:opacity-100 -translate-x-2 group-hover/child:translate-x-0 transition-all" />
                                            </div>
                                        ))}
                                        {item.children.length > 4 && (
                                            <p className="text-xs text-blue-500 font-bold mt-2 pl-3">+{item.children.length - 4} Menu lainnya</p>
                                        )}
                                    </div>
                                ) : (
                                    <p className="text-sm text-gray-500 line-clamp-2 mt-2">
                                        Buka modul {item.label} untuk melihat detail data dan proses terkait.
                                    </p>
                                )}

                                {/* Decorative Background Element */}
                                <div className={`absolute top-0 right-0 w-32 h-32 ${activeModule.color} opacity-[0.02] rounded-bl-full pointer-events-none group-hover:opacity-[0.05] transition-opacity`}></div>
                            </motion.div>
                        ))}
                    </React.Fragment>
                ))}
            </div>
        </div>
    );
};

export default WorkspaceHome;
