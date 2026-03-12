import React, { useState, useMemo } from 'react';
import { ChevronLeft, ChevronRight, Search, Download, Edit, Trash2, Eye } from 'lucide-react';

export interface ColumnDef<T> {
    header: string | React.ReactNode;
    accessor: keyof T | ((row: T) => React.ReactNode);
    id: string;
    sortable?: boolean;
}

export interface DataTableProps<T> {
    data: T[];
    columns: ColumnDef<T>[];
    loading?: boolean;
    onEdit?: (row: T) => void;
    onDelete?: (row: T) => void;
    onView?: (row: T) => void;
    exportFileName?: string;
    searchable?: boolean;
    exportable?: boolean;
}

export function DataTable<T extends Record<string, any>>({
    data,
    columns,
    loading = false,
    onEdit,
    onDelete,
    onView,
    exportFileName = 'export_data',
    searchable = true,
    exportable = true
}: DataTableProps<T>) {
    const [searchQuery, setSearchQuery] = useState('');
    const [searchColumn, setSearchColumn] = useState<string>('all');
    const [currentPage, setCurrentPage] = useState(1);
    const [pageSize, setPageSize] = useState(10);

    // Filtering
    const filteredData = useMemo(() => {
        if (!searchQuery) return data;
        const query = searchQuery.toLowerCase();

        return data.filter((row) => {
            if (searchColumn === 'all') {
                return columns.some((col) => {
                    if (typeof col.accessor === 'function') return false; // Skip complex renders for generic search
                    const val = row[col.accessor as keyof T];
                    return String(val).toLowerCase().includes(query);
                });
            } else {
                const col = columns.find(c => c.id === searchColumn);
                if (!col || typeof col.accessor === 'function') return false;
                const val = row[col.accessor as keyof T];
                return String(val).toLowerCase().includes(query);
            }
        });
    }, [data, columns, searchQuery, searchColumn]);

    // Pagination
    const totalRows = filteredData.length;
    const totalPages = Math.ceil(totalRows / pageSize);

    // Ensure currentPage is valid after filtering
    const validCurrentPage = Math.min(currentPage, Math.max(1, totalPages));

    const paginatedData = useMemo(() => {
        const start = (validCurrentPage - 1) * pageSize;
        return filteredData.slice(start, start + pageSize);
    }, [filteredData, validCurrentPage, pageSize]);

    // Export to CSV
    const handleExport = () => {
        const headers = columns.map(c => c.header).join(',');
        const rows = filteredData.map(row => {
            return columns.map(col => {
                if (typeof col.accessor === 'function') {
                    // Try to get raw value if it's a function, fallback to empty string
                    return '""';
                }
                const val = row[col.accessor as keyof T];
                // Escape quotes and wrap in quotes to handle commas in data
                const stringVal = String(val ?? '').replace(/"/g, '""');
                return `"${stringVal}"`;
            }).join(',');
        });

        const csvContent = "data:text/csv;charset=utf-8,\uFEFF" + headers + "\n" + rows.join("\n");
        const encodedUri = encodeURI(csvContent);
        const link = document.createElement("a");
        link.setAttribute("href", encodedUri);
        link.setAttribute("download", `${exportFileName}_${new Date().toISOString().slice(0, 10)}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    return (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 flex flex-col w-full overflow-hidden">
            {/* Toolbar */}
            <div className="p-4 border-b border-gray-100 bg-gray-50 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 hidden-scrollbar overflow-x-auto">

                {/* Search & Filter */}
                {searchable && (
                    <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 w-full sm:w-auto">
                        <div className="flex items-center w-full sm:w-auto">
                            <select
                                className="bg-white border border-gray-300 text-gray-700 text-sm rounded-l-md px-3 py-2 border-r-0 focus:outline-none focus:ring-1 focus:ring-bri-blue focus:border-bri-blue h-[38px]"
                                value={searchColumn}
                                onChange={(e) => {
                                    setSearchColumn(e.target.value);
                                    setCurrentPage(1);
                                }}
                            >
                                <option value="all">Semua Kolom</option>
                                {columns.filter(c => typeof c.accessor !== 'function').map(c => (
                                    <option key={c.id} value={c.id}>{c.header}</option>
                                ))}
                            </select>
                            <div className="relative flex-1 sm:w-64">
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                    <Search size={14} className="text-gray-400" />
                                </div>
                                <input
                                    type="text"
                                    className="bg-white border border-gray-300 text-gray-900 text-sm rounded-r-md block w-full pl-9 pr-3 py-2 focus:outline-none focus:ring-1 focus:ring-bri-blue focus:border-bri-blue h-[38px]"
                                    placeholder="Cari..."
                                    value={searchQuery}
                                    onChange={(e) => {
                                        setSearchQuery(e.target.value);
                                        setCurrentPage(1);
                                    }}
                                />
                            </div>
                        </div>
                    </div>
                )}

                {/* Actions */}
                <div className="flex items-center gap-2">
                    {exportable && (
                        <button
                            onClick={handleExport}
                            className="flex items-center gap-2 bg-green-50 text-green-700 border border-green-200 hover:bg-green-100 px-3 py-1.5 rounded-md text-sm font-medium transition-colors h-[38px]"
                        >
                            <Download size={16} />
                            Export
                        </button>
                    )}
                    {/* Placeholder for "Add New" button to be passed from parent if needed */}
                </div>
            </div>

            {/* Table wrapper */}
            <div className="overflow-x-auto w-full">
                <table className="w-full text-sm text-left text-gray-500">
                    <thead className="text-xs text-gray-700 uppercase bg-gray-50 border-b border-gray-200">
                        <tr>
                            <th scope="col" className="px-6 py-3 text-center w-12">No</th>
                            {columns.map((col) => (
                                <th key={col.id} scope="col" className="px-6 py-3 whitespace-nowrap">
                                    {col.header}
                                </th>
                            ))}
                            {(onView || onEdit || onDelete) && (
                                <th scope="col" className="px-6 py-3 text-center sticky right-0 bg-gray-50 shadow-[-4px_0_4px_-4px_rgba(0,0,0,0.1)]">
                                    Aksi
                                </th>
                            )}
                        </tr>
                    </thead>
                    <tbody>
                        {loading ? (
                            <tr>
                                <td colSpan={columns.length + ((onView || onEdit || onDelete) ? 2 : 1)} className="px-6 py-12 text-center text-gray-500 italic">
                                    <div className="flex justify-center items-center gap-2">
                                        <div className="w-4 h-4 border-2 border-bri-blue border-t-transparent rounded-full animate-spin"></div>
                                        Memuat data...
                                    </div>
                                </td>
                            </tr>
                        ) : paginatedData.length === 0 ? (
                            <tr>
                                <td colSpan={columns.length + ((onView || onEdit || onDelete) ? 2 : 1)} className="px-6 py-12 text-center text-gray-500 italic">
                                    Data tidak ditemukan.
                                </td>
                            </tr>
                        ) : (
                            paginatedData.map((row, index) => (
                                <tr key={index} className="bg-white border-b border-gray-100 hover:bg-gray-50 transition-colors">
                                    <td className="px-6 py-4 text-center text-gray-400 font-medium">
                                        {(validCurrentPage - 1) * pageSize + index + 1}
                                    </td>
                                    {columns.map((col) => (
                                        <td key={col.id} className="px-6 py-4 text-gray-900 whitespace-nowrap">
                                            {typeof col.accessor === 'function'
                                                ? col.accessor(row)
                                                : String(row[col.accessor as keyof T] ?? '')}
                                        </td>
                                    ))}
                                    {(onView || onEdit || onDelete) && (
                                        <td className="px-6 py-4 text-center sticky right-0 bg-white shadow-[-4px_0_4px_-4px_rgba(0,0,0,0.1)] opacity-100 before:absolute before:inset-0 before:bg-inherit before:hover:bg-gray-50 before:-z-10 group-hover:before:bg-gray-50">
                                            <div className="flex items-center justify-center gap-2">
                                                {onView && (
                                                    <button onClick={() => onView(row)} className="text-blue-500 hover:bg-blue-50 p-1.5 rounded-md transition-colors" title="Lihat Detail">
                                                        <Eye size={16} />
                                                    </button>
                                                )}
                                                {onEdit && (
                                                    <button onClick={() => onEdit(row)} className="text-amber-500 hover:bg-amber-50 p-1.5 rounded-md transition-colors" title="Edit Data">
                                                        <Edit size={16} />
                                                    </button>
                                                )}
                                                {onDelete && (
                                                    <button onClick={() => onDelete(row)} className="text-red-500 hover:bg-red-50 p-1.5 rounded-md transition-colors" title="Hapus Data">
                                                        <Trash2 size={16} />
                                                    </button>
                                                )}
                                            </div>
                                        </td>
                                    )}
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>

            {/* Pagination & Footer */}
            <div className="px-4 py-3 border-t border-gray-200 bg-gray-50 flex flex-col sm:flex-row items-center justify-between gap-3 text-sm text-gray-600">
                <div className="flex items-center gap-4">
                    <span>
                        Total <span className="font-bold text-gray-900">{totalRows}</span> baris data
                    </span>
                    <div className="hidden sm:flex items-center gap-2">
                        <span className="text-gray-500">Baris per halaman:</span>
                        <select
                            value={pageSize}
                            onChange={(e) => {
                                setPageSize(Number(e.target.value));
                                setCurrentPage(1);
                            }}
                            className="bg-transparent border border-gray-300 rounded px-1 py-1 focus:ring-1 focus:ring-bri-blue h-7"
                        >
                            <option value={5}>5</option>
                            <option value={10}>10</option>
                            <option value={20}>20</option>
                            <option value={50}>50</option>
                        </select>
                    </div>
                </div>

                {totalPages > 0 && (
                    <div className="flex items-center gap-1">
                        <button
                            onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                            disabled={validCurrentPage === 1}
                            className={`p-1 rounded ${validCurrentPage === 1 ? 'text-gray-300 cursor-not-allowed' : 'text-gray-600 hover:bg-gray-200'}`}
                        >
                            <ChevronLeft size={20} />
                        </button>

                        <div className="flex items-center mx-2 gap-1">
                            <span className="font-medium text-gray-900">{validCurrentPage}</span>
                            <span className="text-gray-500">dari</span>
                            <span className="font-medium text-gray-700">{totalPages}</span>
                        </div>

                        <button
                            onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                            disabled={validCurrentPage === totalPages}
                            className={`p-1 rounded ${validCurrentPage === totalPages ? 'text-gray-300 cursor-not-allowed' : 'text-gray-600 hover:bg-gray-200'}`}
                        >
                            <ChevronRight size={20} />
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}
