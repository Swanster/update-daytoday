import { useMemo, useState } from 'react';

export default function BriefingTable({ 
    briefings, 
    onEdit, 
    onDelete, 
    selectedIds = [], 
    onSelectionChange, 
    onBatchStatusUpdate,
    onAddEntry,
    onStatusUpdate,
    onSyncFromSheet,
    onSyncToSheet,
    syncing = false 
}) {
    const formatDate = (dateString) => {
        if (!dateString) return '-';
        const date = new Date(dateString);
        return date.toLocaleDateString('id-ID', {
            day: 'numeric',
            month: 'long',
            year: 'numeric'
        });
    };

    const getStatusBadgeClass = (status) => {
        if (!status) return '';
        const baseClasses = "inline-flex items-center px-2.5 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider border shadow-sm";
        const statusLower = status.toLowerCase();

        if (statusLower === 'done' || statusLower === 'selesai') {
            return baseClasses + " bg-emerald-50 text-emerald-700 border-emerald-200";
        } else if (statusLower === 'progress' || statusLower === 'proses') {
            return baseClasses + " bg-blue-50 text-blue-700 border-blue-200";
        } else if (statusLower === 'hold') {
            return baseClasses + " bg-amber-50 text-amber-700 border-amber-200";
        } else if (statusLower === 'pending' || statusLower === 'antrian') {
            return baseClasses + " bg-gray-100 text-gray-700 border-gray-200";
        } else {
            return baseClasses + " bg-ch-light text-ch-dark border-ch-soft";
        }
    };

    // Check if all briefings are selected
    const allSelected = briefings.length > 0 && selectedIds.length === briefings.length;
    const someSelected = selectedIds.length > 0 && selectedIds.length < briefings.length;

    // Handle select all checkbox
    const handleSelectAll = () => {
        if (allSelected) {
            onSelectionChange([]);
        } else {
            onSelectionChange(briefings.map(b => b._id));
        }
    };

    // Handle individual checkbox
    const handleSelectOne = (id) => {
        if (selectedIds.includes(id)) {
            onSelectionChange(selectedIds.filter(i => i !== id));
        } else {
            onSelectionChange([...selectedIds, id]);
        }
    };

    // Mobile expand state
    const [expandedId, setExpandedId] = useState(null);

    const toggleExpand = (id) => {
        if (expandedId === id) {
            setExpandedId(null);
        } else {
            setExpandedId(id);
        }
    };

    if (briefings.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center p-12 text-center text-ch-primary bg-white/95 rounded-2xl shadow-custom border border-ch-soft mb-6">
                <div className="text-5xl mb-4 opacity-40">📝</div>
                <h3 className="text-xl font-extrabold text-ch-dark mb-2">No Briefing Entries Yet</h3>
                <p className="font-medium mb-4">Click the "Add Entry" button or sync from Google Sheets to get started.</p>
                <div className="flex gap-3">
                    <button
                        onClick={onAddEntry}
                        className="px-4 py-2 bg-ch-dark text-white rounded-lg hover:bg-ch-dark/90 transition-colors font-bold text-sm"
                    >
                        + Add Briefing
                    </button>
                    <button
                        onClick={onSyncFromSheet}
                        disabled={syncing}
                        className="px-4 py-2 bg-white text-ch-primary border border-ch-soft rounded-lg hover:bg-ch-soft transition-colors font-bold text-sm disabled:opacity-50"
                    >
                        🔄 Sync from Sheet
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="flex flex-col gap-4">
            {/* Batch Action Bar */}
            {selectedIds.length > 0 && (
                <div className="flex flex-wrap items-center gap-4 bg-ch-soft p-4 rounded-2xl shadow-sm border border-ch-soft animate-slide-up sticky top-0 z-20">
                    <span className="text-sm font-bold text-ch-dark px-2">{selectedIds.length} selected</span>
                    <div className="h-6 w-px bg-ch-soft hidden sm:block"></div>
                    <div className="flex items-center gap-2">
                        <span className="text-[11px] font-bold text-ch-dark uppercase tracking-widest mr-2 hidden sm:inline">Change Status:</span>
                        <button
                            className="px-3 py-1.5 bg-white text-emerald-600 text-[11px] font-bold rounded-lg border border-emerald-200 hover:bg-emerald-50 hover:border-emerald-300 transition-all shadow-sm active:scale-95 flex items-center gap-1.5"
                            onClick={() => onBatchStatusUpdate('Done')}
                        >
                            ✓ Done
                        </button>
                        <button
                            className="px-3 py-1.5 bg-white text-blue-600 text-[11px] font-bold rounded-lg border border-blue-200 hover:bg-blue-50 hover:border-blue-300 transition-all shadow-sm active:scale-95 flex items-center gap-1.5"
                            onClick={() => onBatchStatusUpdate('Progress')}
                        >
                            ⏳ Progress
                        </button>
                        <button
                            className="px-3 py-1.5 bg-white text-amber-600 text-[11px] font-bold rounded-lg border border-amber-200 hover:bg-amber-50 hover:border-amber-300 transition-all shadow-sm active:scale-95 flex items-center gap-1.5"
                            onClick={() => onBatchStatusUpdate('Hold')}
                        >
                            ⏸ Hold
                        </button>
                        <button
                            className="px-3 py-1.5 bg-white text-gray-600 text-[11px] font-bold rounded-lg border border-gray-200 hover:bg-gray-50 hover:border-gray-300 transition-all shadow-sm active:scale-95 flex items-center gap-1.5"
                            onClick={() => onBatchStatusUpdate('Pending')}
                        >
                            📋 Pending
                        </button>
                    </div>
                    <div className="flex-1"></div>
                    <button
                        className="px-3 py-1.5 text-ch-primary hover:text-ch-dark hover:bg-ch-soft/50 rounded-lg text-[11px] font-bold transition-colors flex items-center gap-1.5"
                        onClick={() => onSelectionChange([])}
                    >
                        ✕ Clear
                    </button>
                </div>
            )}

            <div className="bg-white/95 rounded-2xl shadow-custom overflow-hidden border border-ch-soft">
                {/* Desktop Table */}
                <div className="hidden md:block overflow-x-auto">
                    <table className="w-full text-sm text-left border-collapse">
                        <thead className="bg-ch-light text-ch-primary font-bold uppercase text-[10px] tracking-widest sticky top-0 z-10">
                            <tr>
                                <th className="p-4 w-4 border-b border-ch-soft">
                                    <input
                                        type="checkbox"
                                        checked={allSelected}
                                        ref={el => { if (el) el.indeterminate = someSelected; }}
                                        onChange={handleSelectAll}
                                        title="Select all"
                                        className="rounded border-ch-soft text-ch-primary focus:ring-ch-primary focus:ring-offset-0 w-4 h-4 cursor-pointer"
                                    />
                                </th>
                                <th className="px-5 py-4 border-b border-ch-soft whitespace-nowrap">No</th>
                                <th className="px-5 py-4 border-b border-ch-soft whitespace-nowrap">Tanggal</th>
                                <th className="px-5 py-4 border-b border-ch-soft whitespace-nowrap">Lokasi / Site</th>
                                <th className="px-5 py-4 border-b border-ch-soft whitespace-nowrap">Pekerjaan</th>
                                <th className="px-5 py-4 border-b border-ch-soft whitespace-nowrap">PIC</th>
                                <th className="px-5 py-4 border-b border-ch-soft whitespace-nowrap">Status</th>
                                <th className="px-5 py-4 border-b border-ch-soft whitespace-nowrap">Checklist</th>
                                <th className="px-5 py-4 border-b border-ch-soft whitespace-nowrap min-w-[200px]">Catatan</th>
                                <th className="px-5 py-4 border-b border-ch-soft whitespace-nowrap text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-ch-soft">
                            {briefings.map((briefing, index) => {
                                const isSelected = selectedIds.includes(briefing._id);
                                const rowColorClass = index % 2 === 0 ? 'bg-ch-light/50' : 'bg-white';
                                
                                let rowClassName = rowColorClass;
                                if (isSelected) {
                                    rowClassName += ' bg-ch-soft/60 transition-colors duration-300';
                                }
                                rowClassName += ' hover:bg-ch-soft/80 transition-colors group relative';

                                return (
                                    <tr key={briefing._id} className={rowClassName}>
                                        {/* Selection Highlight bar on left */}
                                        {isSelected && (
                                            <td className="absolute left-0 top-0 bottom-0 w-1 bg-ch-primary"></td>
                                        )}

                                        <td className="p-4">
                                            <input
                                                type="checkbox"
                                                checked={isSelected}
                                                onChange={() => handleSelectOne(briefing._id)}
                                                className="rounded border-ch-soft text-ch-primary focus:ring-ch-primary focus:ring-offset-0 w-4 h-4 cursor-pointer"
                                            />
                                        </td>
                                        <td className="px-5 py-4 text-ch-primary font-bold">{index + 1}</td>
                                        <td className="px-5 py-4 whitespace-nowrap text-ch-dark font-medium">
                                            {formatDate(briefing.tanggal)}
                                        </td>
                                        <td className="px-5 py-4 text-ch-dark font-medium max-w-[200px] truncate" title={briefing.lokasi}>
                                            {briefing.lokasi}
                                        </td>
                                        <td className="px-5 py-4 text-ch-dark max-w-[250px] truncate" title={briefing.pekerjaan}>
                                            {briefing.pekerjaan}
                                        </td>
                                        <td className="px-5 py-4 text-ch-primary font-medium whitespace-nowrap">
                                            {briefing.pic}
                                        </td>
                                        <td className="px-5 py-4">
                                            <select
                                                value={briefing.status || ''}
                                                onChange={(e) => onStatusUpdate(briefing._id, e.target.value)}
                                                className={`${getStatusBadgeClass(briefing.status)} cursor-pointer appearance-none text-center`}
                                                title="Click to change status"
                                            >
                                                <option value="Pending">Pending</option>
                                                <option value="Progress">Progress</option>
                                                <option value="Done">Done</option>
                                                <option value="Hold">Hold</option>
                                            </select>
                                        </td>
                                        <td className="px-5 py-4 text-ch-dark max-w-[150px] truncate" title={briefing.checklist}>
                                            {briefing.checklist || '-'}
                                        </td>
                                        <td className="px-5 py-4 text-ch-primary text-sm max-w-[200px] truncate" title={briefing.catatan}>
                                            {briefing.catatan || '-'}
                                        </td>
                                        <td className="px-5 py-4 text-right whitespace-nowrap">
                                            <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                                <button
                                                    className="p-2 hover:bg-ch-soft rounded-lg text-ch-primary transition-colors"
                                                    onClick={() => onEdit(briefing)}
                                                    title="Edit"
                                                >
                                                    ✏️
                                                </button>
                                                <button
                                                    className="p-2 hover:bg-red-50 rounded-lg text-ch-primary hover:text-red-500 transition-colors"
                                                    onClick={() => onDelete(briefing._id, briefing.pekerjaan)}
                                                    title="Delete"
                                                >
                                                    🗑️
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>

                {/* Mobile View */}
                <div className="md:hidden divide-y divide-ch-soft">
                    {briefings.map((briefing, index) => (
                        <div
                            key={briefing._id}
                            className={`p-4 ${index % 2 === 0 ? 'bg-ch-light/50' : 'bg-white'}`}
                        >
                            <div className="flex items-start justify-between gap-3">
                                <div className="flex items-start gap-3 flex-1 min-w-0">
                                    <input
                                        type="checkbox"
                                        checked={selectedIds.includes(briefing._id)}
                                        onChange={() => handleSelectOne(briefing._id)}
                                        className="rounded border-ch-soft text-ch-primary focus:ring-ch-primary focus:ring-offset-0 w-4 h-4 cursor-pointer mt-1"
                                    />
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-start justify-between gap-2">
                                            <div className="flex-1 min-w-0">
                                                <p className="text-xs text-ch-primary font-bold mb-1">#{index + 1}</p>
                                                <p className="text-sm font-bold text-ch-dark truncate">{briefing.pekerjaan}</p>
                                                <p className="text-xs text-ch-primary mt-0.5">{briefing.lokasi}</p>
                                            </div>
                                            <button
                                                onClick={() => toggleExpand(briefing._id)}
                                                className="p-2 hover:bg-ch-soft rounded-lg text-ch-primary transition-colors shrink-0"
                                                title="Expand"
                                            >
                                                {expandedId === briefing._id ? '▲' : '▼'}
                                            </button>
                                        </div>
                                        <div className="flex items-center gap-2 mt-2">
                                            <span className="text-xs text-ch-primary">📅 {formatDate(briefing.tanggal)}</span>
                                            <span className={`text-xs ${getStatusBadgeClass(briefing.status)}`}>
                                                {briefing.status || 'Pending'}
                                            </span>
                                        </div>
                                        {expandedId === briefing._id && (
                                            <div className="mt-3 pt-3 border-t border-ch-soft space-y-2 text-sm">
                                                <div>
                                                    <span className="font-bold text-ch-dark">PIC:</span>
                                                    <span className="text-ch-primary ml-2">{briefing.pic}</span>
                                                </div>
                                                {briefing.checklist && (
                                                    <div>
                                                        <span className="font-bold text-ch-dark">Checklist:</span>
                                                        <span className="text-ch-primary ml-2">{briefing.checklist}</span>
                                                    </div>
                                                )}
                                                {briefing.catatan && (
                                                    <div>
                                                        <span className="font-bold text-ch-dark">Catatan:</span>
                                                        <p className="text-ch-primary mt-1">{briefing.catatan}</p>
                                                    </div>
                                                )}
                                                <div className="flex gap-2 pt-2">
                                                    <button
                                                        onClick={() => onEdit(briefing)}
                                                        className="flex-1 px-3 py-2 bg-ch-primary text-white rounded-lg text-xs font-bold hover:bg-ch-primary/90 transition-colors"
                                                    >
                                                        ✏️ Edit
                                                    </button>
                                                    <button
                                                        onClick={() => onDelete(briefing._id, briefing.pekerjaan)}
                                                        className="px-3 py-2 bg-red-50 text-red-500 rounded-lg text-xs font-bold hover:bg-red-100 transition-colors"
                                                    >
                                                        🗑️
                                                    </button>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
