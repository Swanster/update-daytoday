import { useMemo, useState, useEffect } from 'react';
import AttachmentViewer from './AttachmentViewer';
import StatusCell from './StatusCell';

export default function DailyTable({ dailies, onEdit, onDelete, selectedIds = [], onSelectionChange, onBatchStatusUpdate, onAddEntry, onStatusUpdate }) {
    // Group by client name for display
    const groupedDailies = useMemo(() => {
        const groups = {};

        dailies.forEach(daily => {
            if (!groups[daily.clientName]) {
                groups[daily.clientName] = [];
            }
            groups[daily.clientName].push(daily);
        });

        return groups;
    }, [dailies]);

    const formatDate = (dateString) => {
        if (!dateString) return '-';
        const date = new Date(dateString);
        return date.toLocaleDateString('en-GB', {
            day: 'numeric',
            month: 'long',
            year: 'numeric'
        });
    };

    const getStatusBadgeClass = (status) => {
        if (!status) return '';
        const baseClasses = "inline-flex items-center px-2.5 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider border shadow-sm";
        const statusLower = status.toLowerCase();
        
        if (statusLower.includes('done') || statusLower.includes('complete')) {
            return baseClasses + " bg-emerald-50 text-emerald-700 border-emerald-200";
        } else if (statusLower.includes('progress')) {
            return baseClasses + " bg-ch-soft text-ch-dark border-ch-soft";
        } else if (statusLower.includes('hold')) {
            return baseClasses + " bg-amber-50 text-amber-700 border-amber-200";
        } else {
            return baseClasses + " bg-ch-light text-ch-dark border-ch-soft";
        }
    };

    const getActionBadgeClass = (action) => {
        if (!action) return '';
        const baseClasses = "inline-flex items-center px-2.5 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider border shadow-sm";
        const actionLower = action.toLowerCase();
        
        if (actionLower.includes('monitor')) {
            return baseClasses + " bg-blue-50 text-blue-700 border-blue-200";
        }
        if (actionLower.includes('config')) {
            return baseClasses + " bg-purple-50 text-purple-700 border-purple-200";
        }
        if (actionLower.includes('install')) {
            return baseClasses + " bg-teal-50 text-teal-700 border-teal-200";
        }
        
        return baseClasses + " bg-ch-light text-ch-dark border-ch-soft";
    };

    // Check if all dailies are selected
    const allSelected = dailies.length > 0 && selectedIds.length === dailies.length;
    const someSelected = selectedIds.length > 0 && selectedIds.length < dailies.length;

    // Handle select all checkbox
    const handleSelectAll = () => {
        if (allSelected) {
            onSelectionChange([]);
        } else {
            onSelectionChange(dailies.map(d => d._id));
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

    // Attachment viewer state
    const [viewingAttachments, setViewingAttachments] = useState(null);
    
    // Mobile expand state
    const [expandedId, setExpandedId] = useState(null);

    const toggleExpand = (id) => {
        if (expandedId === id) {
            setExpandedId(null);
        } else {
            setExpandedId(id);
        }
    };

    if (dailies.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center p-12 text-center text-ch-primary bg-white/95 rounded-2xl shadow-custom border border-ch-soft mb-6">
                <div className="text-5xl mb-4 opacity-40">📋</div>
                <h3 className="text-xl font-extrabold text-ch-dark mb-2">No Daily Entries Yet</h3>
                <p className="font-medium">Click the "Add Entry" button to create your first daily entry.</p>
            </div>
        );
    }

    const clientNames = Object.keys(groupedDailies);

    // Pagination
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 10;
    const totalPages = Math.ceil(clientNames.length / itemsPerPage);

    // Reset to page 1 if data changes
    useEffect(() => {
        setCurrentPage(1);
    }, [dailies]);

    const paginatedClientNames = clientNames.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

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
                            className="px-3 py-1.5 bg-white text-ch-primary text-[11px] font-bold rounded-lg border border-ch-soft hover:bg-ch-soft hover:border-ch-primary transition-all shadow-sm active:scale-95 flex items-center gap-1.5"
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
                                <th className="px-5 py-4 border-b border-ch-soft whitespace-nowrap w-48">Client Name</th>
                                <th className="px-5 py-4 border-b border-ch-soft whitespace-nowrap">Services</th>
                                <th className="px-5 py-4 border-b border-ch-soft whitespace-nowrap">Case & Issue</th>
                                <th className="px-5 py-4 border-b border-ch-soft whitespace-nowrap">Action</th>
                                <th className="px-5 py-4 border-b border-ch-soft whitespace-nowrap">Date</th>
                                <th className="px-5 py-4 border-b border-ch-soft whitespace-nowrap">PIC Team</th>
                                <th className="px-5 py-4 border-b border-ch-soft whitespace-nowrap min-w-[200px]">Detail Action</th>
                                <th className="px-5 py-4 border-b border-ch-soft whitespace-nowrap">Status</th>
                                <th className="px-5 py-4 border-b border-ch-soft whitespace-nowrap text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-ch-soft">
                            {paginatedClientNames.map((clientName, clientIndex) => {
                                const clientEntries = groupedDailies[clientName];
                                // Alternate colors by CLIENT, not by row
                                const clientColorClass = clientIndex % 2 === 0 ? 'bg-ch-light/50' : 'bg-white';

                                return clientEntries.map((entry, entryIndex) => {
                                    const isSelected = selectedIds.includes(entry._id);
                                    
                                    // Calculate row class name explicitly to avoid parser issues
                                    let rowClassName = clientColorClass;
                                    if (isSelected) {
                                        rowClassName += ' bg-ch-soft/60 transition-colors duration-300';
                                    }
                                    rowClassName += ' hover:bg-ch-soft/80 transition-colors group relative';
                                    
                                    return (
                                        <tr
                                            key={entry._id}
                                            className={rowClassName}
                                        >
                                            {/* Selection Highlight bar on left */}
                                            {isSelected && (
                                                <td className="absolute left-0 top-0 bottom-0 w-1 bg-ch-primary rounded-r z-10 pointer-events-none"></td>
                                            )}
                                        {/* Checkbox */}
                                        <td className="px-5 py-3 border-r border-ch-soft/50 relative z-10">
                                            <input
                                                type="checkbox"
                                                checked={selectedIds.includes(entry._id)}
                                                onChange={() => handleSelectOne(entry._id)}
                                                className="rounded border-ch-soft text-ch-primary focus:ring-ch-primary focus:ring-offset-0 w-4 h-4 cursor-pointer transition-all"
                                            />
                                        </td>

                                        {/* Row Number - only show on first entry of group, using quarterSequence */}
                                        {entryIndex === 0 && (
                                            <td
                                                rowSpan={clientEntries.length}
                                                className="px-5 py-3 text-center text-ch-primary font-bold border-r border-ch-soft/50 align-top"
                                            >
                                                {entry.quarterSequence || '-'}
                                            </td>
                                        )}

                                        {/* Client Name - merged for same clients, clickable to add entry */}
                                        {entryIndex === 0 && (() => {
                                            const clientRowSpan = clientEntries.length;
                                            let clientClassName = "px-5 py-3 font-extrabold text-ch-dark border-r border-ch-soft/50 align-top cursor-pointer hover:text-ch-primary transition-colors relative group/client";
                                            if (clientEntries.length > 1) {
                                                clientClassName += " align-top pt-4";
                                            }
                                            
                                            return (
                                                <td
                                                    className={clientClassName}
                                                    rowSpan={clientRowSpan}
                                                    onClick={() => onAddEntry && onAddEntry(clientName)}
                                                    title="Click to add new entry for this client"
                                                >
                                                    {clientName}
                                                    <span className="absolute top-2 right-2 text-xs opacity-0 group-hover/client:opacity-100 text-ch-primary bg-ch-soft px-1.5 py-0.5 rounded-md font-bold transition-all shadow-sm flex items-center gap-1">+ Add</span>
                                                </td>
                                            );
                                        })()}

                                        {/* Services/Categories */}
                                        <td className="px-5 py-3">
                                            <div className="flex flex-wrap gap-1.5">
                                                {entry.services && entry.services.length > 0 ? (
                                                    (Array.isArray(entry.services) ? entry.services : [entry.services]).map((cat, idx) => (
                                                        <span key={idx} className="bg-ch-soft text-ch-dark border border-ch-soft px-2 py-0.5 rounded-md text-[10px] font-bold">{cat}</span>
                                                    ))
                                                ) : <span className="text-ch-soft">-</span>}
                                            </div>
                                        </td>

                                        {/* Case & Issue */}
                                        <td className="px-5 py-3">
                                            <div className="flex flex-wrap gap-1.5">
                                                {entry.caseIssue && (Array.isArray(entry.caseIssue) ? entry.caseIssue.length > 0 : entry.caseIssue) ? (
                                                    (Array.isArray(entry.caseIssue) ? entry.caseIssue : [entry.caseIssue]).map((ct, idx) => (
                                                        <span key={idx} className="bg-ch-soft text-ch-dark border border-ch-soft px-2 py-0.5 rounded-md text-[10px] font-bold">{ct}</span>
                                                    ))
                                                ) : <span className="text-ch-soft">-</span>}
                                            </div>
                                        </td>

                                        {/* Action */}
                                        <td className="px-5 py-3 whitespace-nowrap">
                                            {entry.action ? (
                                                <span className={getActionBadgeClass(entry.action)}>
                                                    {entry.action}
                                                </span>
                                            ) : <span className="text-ch-soft">-</span>}
                                        </td>

                                        {/* Date */}
                                        <td className="px-5 py-3 whitespace-nowrap text-ch-dark font-medium text-xs font-mono">{formatDate(entry.date)}</td>

                                        {/* PIC Team */}
                                        <td className="px-5 py-3">
                                            <div className="flex flex-wrap gap-1.5">
                                                {entry.picTeam && entry.picTeam.length > 0 ? (
                                                    entry.picTeam.map((member, idx) => (
                                                        <span key={idx} className="bg-ch-dark text-ch-soft border border-ch-dark px-2 py-0.5 rounded-md text-[10px] font-bold tracking-wide">{member}</span>
                                                    ))
                                                ) : <span className="text-ch-soft">-</span>}
                                            </div>
                                        </td>

                                        {/* Detail Action */}
                                        <td className="px-5 py-3 min-w-[300px] max-w-sm">
                                            <div className="text-xs text-ch-dark font-medium leading-relaxed whitespace-pre-wrap">
                                                {entry.detailAction ? (
                                                    entry.detailAction.split('\n').map((line, idx) => (
                                                        <div key={idx} className="flex gap-2">
                                                            <span className="text-ch-soft selection:bg-transparent">•</span>
                                                            <span>{line}</span>
                                                        </div>
                                                    ))
                                                ) : <span className="text-ch-soft">-</span>}
                                            </div>
                                        </td>

                                        {/* Status */}
                                        <td className="px-5 py-3 whitespace-nowrap">
                                            {entry.status ? (
                                                <StatusCell
                                                    value={entry.status}
                                                    type="status"
                                                    onUpdate={(val) => onStatusUpdate(entry._id, 'status', val)}
                                                />
                                            ) : <span className="text-ch-soft">-</span>}
                                        </td>

                                        {/* Actions */}
                                        <td className="px-5 py-3 text-right whitespace-nowrap">
                                            <div className="flex items-center justify-end gap-2 relative z-10">
                                                {entry.attachments && entry.attachments.length > 0 && (() => {
                                                    const attachTitle = entry.attachments.length + " file(s) attached - Click to view";
                                                    return (
                                                        <button
                                                            className="px-2 py-1.5 text-ch-primary bg-ch-soft hover:bg-ch-soft hover:text-ch-dark rounded-lg transition-all shadow-sm active:scale-95 flex items-center"
                                                            title={attachTitle}
                                                            onClick={() => setViewingAttachments(entry)}
                                                        >
                                                            📎<span className="text-[10px] font-bold ml-1">{entry.attachments.length}</span>
                                                        </button>
                                                    );
                                                })()}
                                                <button
                                                    className="p-1.5 text-ch-primary hover:text-ch-primary hover:bg-ch-soft rounded-lg transition-all shadow-sm bg-white border border-ch-soft active:scale-95"
                                                    onClick={() => onEdit(entry)}
                                                    title="Edit"
                                                >
                                                    ✏️
                                                </button>
                                                <button
                                                    className="p-1.5 text-ch-primary hover:text-red-600 hover:bg-red-50 rounded-lg transition-all shadow-sm bg-white border border-ch-soft active:scale-95"
                                                    onClick={() => onDelete(entry._id)}
                                                    title="Delete"
                                                >
                                                    🗑️
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                    );
                                });
                            })}
                        </tbody>
                    </table>
                </div>

                {/* Mobile Expandable Card View */}
                <div className="md:hidden flex flex-col gap-4 p-4 bg-ch-light/50">
                    {paginatedClientNames.map((clientName) => {
                        const clientEntries = groupedDailies[clientName];
                        return clientEntries.map((entry) => (
                            <div key={entry._id} className="bg-white rounded-2xl shadow-sm border border-ch-soft overflow-hidden transition-all duration-300">
                                {/* Card Header / Preview - Click to Expand */}
                                <div 
                                    className="p-5 cursor-pointer hover:bg-ch-light/80 transition-colors"
                                    onClick={() => toggleExpand(entry._id)}
                                >
                                    <div className="flex justify-between items-start gap-3">
                                        <div className="flex-1">
                                            <h4
                                                className="font-extrabold text-ch-dark text-base flex items-center gap-1.5 cursor-pointer hover:text-ch-primary transition-colors group/mobile"
                                                onClick={(e) => { e.stopPropagation(); onAddEntry && onAddEntry(entry.clientName); }}
                                            >
                                                {entry.clientName}
                                                <span className="text-ch-primary text-[10px] bg-ch-soft px-1.5 py-0.5 rounded-md opacity-0 group-hover/mobile:opacity-100 transition-all shadow-sm flex items-center gap-1">+ Add</span>
                                            </h4>
                                            
                                            {/* Preview: Issue & Action (Truncated) */}
                                            <div className="mt-2 text-xs text-ch-primary space-y-1.5 font-medium">
                                                <div className="flex items-start gap-1.5">
                                                     <span className="text-ch-primary shrink-0">⚠️</span>
                                                     <span className="line-clamp-1 opacity-90">
                                                        {entry.caseIssue && (Array.isArray(entry.caseIssue) ? entry.caseIssue.join(', ') : entry.caseIssue) || '-'}
                                                     </span>
                                                </div>
                                                 <div className="flex items-start gap-1.5">
                                                     <span className="text-ch-primary shrink-0">📝</span>
                                                     <span className="line-clamp-1 opacity-90">
                                                        {entry.detailAction ? entry.detailAction.split('\n')[0] : '-'}
                                                     </span>
                                                </div>
                                            </div>
                                        </div>
                                        
                                        {/* Status Badge - Inline Editable */}
                                        <div onClick={(e) => e.stopPropagation()} className="shrink-0">
                                            <StatusCell
                                                value={entry.status}
                                                type="status"
                                                onUpdate={(val) => onStatusUpdate(entry._id, 'status', val)}
                                            />
                                        </div>
                                    </div>
                                    <div className="flex justify-center mt-3 border-t border-ch-light pt-2">
                                        <span className={"text-ch-soft text-[10px] transform transition-transform duration-300 flex items-center justify-center w-6 h-6 rounded-full bg-ch-light " + (expandedId === entry._id ? "rotate-180 bg-ch-soft text-ch-primary" : "")}>▼</span>
                                    </div>
                                </div>

                                {/* Expanded Details */}
                                {expandedId === entry._id && (
                                    <div className="px-5 pb-5 pt-2 border-t border-ch-light bg-ch-light/50 animate-slide-down">
                                        <div className="flex flex-col gap-4 mt-2">
                                            <div className="flex justify-between text-xs font-bold text-ch-primary">
                                                <span>📅 {formatDate(entry.date)}</span>
                                                <span className="bg-ch-soft text-ch-dark px-2 py-0.5 rounded-md shadow-sm">No: {entry.quarterSequence || '-'}</span>
                                            </div>

                                            {/* Full Issue */}
                                            {entry.caseIssue && (
                                                <div className="bg-white p-3 rounded-xl border border-ch-soft shadow-sm">
                                                    <span className="text-[10px] font-extrabold text-ch-primary uppercase tracking-widest block mb-2">Items / Issues</span>
                                                    <div className="flex flex-wrap gap-1.5">
                                                        {(Array.isArray(entry.caseIssue) ? entry.caseIssue : [entry.caseIssue]).map((ct, idx) => (
                                                            <span key={idx} className="bg-ch-light text-ch-dark border border-ch-soft px-2 py-1 rounded-md text-[10px] font-bold">{ct}</span>
                                                        ))}
                                                    </div>
                                                </div>
                                            )}

                                            {/* Full Detail Action */}
                                            <div className="bg-white p-3 rounded-xl border border-ch-soft shadow-sm">
                                                <span className="text-[10px] font-extrabold text-ch-primary uppercase tracking-widest block mb-2">Detailed Action</span>
                                                <div className="text-xs text-ch-dark font-medium whitespace-pre-wrap leading-relaxed">
                                                    {entry.detailAction || '-'}
                                                </div>
                                            </div>

                                            {/* Info Rows */}
                                            <div className="grid grid-cols-2 gap-3 text-xs">
                                                <div className="bg-white p-3 rounded-xl border border-ch-soft shadow-sm">
                                                    <span className="text-[10px] font-extrabold text-ch-primary uppercase tracking-widest block mb-2">Service</span>
                                                    <div className="flex flex-wrap gap-1.5">
                                                        {entry.services && (Array.isArray(entry.services) ? entry.services : [entry.services]).map((s, idx) => (
                                                             <span key={idx} className="text-ch-dark font-bold bg-ch-light px-2 py-0.5 border border-ch-soft rounded-md">{s}</span>
                                                        ))}
                                                    </div>
                                                </div>
                                                <div className="bg-white p-3 rounded-xl border border-ch-soft shadow-sm">
                                                    <span className="text-[10px] font-extrabold text-ch-primary uppercase tracking-widest block mb-2">PIC</span>
                                                    <div className="flex flex-wrap gap-1.5">
                                                        {entry.picTeam && entry.picTeam.map((p, idx) => (
                                                             <span key={idx} className="bg-ch-dark text-ch-soft px-2 py-0.5 rounded-md font-bold tracking-wide">{p}</span>
                                                        ))}
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Action Buttons */}
                                            <div className="flex gap-2 mt-2 pt-4 border-t border-ch-soft">
                                                <button
                                                    className="flex-1 py-2 bg-ch-soft text-ch-primary rounded-xl text-[11px] font-bold hover:bg-ch-soft transition-all shadow-sm active:scale-95"
                                                    onClick={(e) => { e.stopPropagation(); onAddEntry && onAddEntry(entry.clientName); }}
                                                >
                                                    ＋ Quick Add
                                                </button>
                                                 <button
                                                    className="flex-1 py-2 bg-white text-ch-dark border border-ch-soft rounded-xl text-[11px] font-bold hover:text-ch-primary hover:bg-ch-light transition-all shadow-sm active:scale-95 flex items-center justify-center gap-1"
                                                    onClick={(e) => { e.stopPropagation(); onEdit(entry); }}
                                                >
                                                    ✏️ Edit
                                                </button>
                                                <button
                                                    className="flex-1 py-2 bg-white text-ch-primary border border-ch-soft rounded-xl text-[11px] font-bold hover:text-red-600 hover:bg-red-50 transition-all shadow-sm active:scale-95 flex items-center justify-center gap-1"
                                                    onClick={(e) => { e.stopPropagation(); onDelete(entry._id); }}
                                                >
                                                    🗑️ Delete
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>
                        ));
                    })}
                </div>

                {/* Pagination Controls */}
                {totalPages > 1 && (
                    <div className="flex items-center justify-between px-5 py-4 bg-white md:bg-ch-light/50 border-t border-ch-soft rounded-b-2xl relative z-10 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)] md:shadow-none pb-safe">
                        <div className="flex flex-1 justify-between sm:hidden">
                            <button
                                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                                disabled={currentPage === 1}
                                className="relative inline-flex items-center px-4 py-2 border border-ch-soft text-xs font-bold rounded-xl text-ch-dark bg-white hover:bg-ch-light hover:border-ch-soft disabled:opacity-50 transition-all shadow-sm active:scale-95 disabled:active:scale-100"
                            >
                                Previous
                            </button>
                            <span className="text-xs text-ch-primary font-bold uppercase tracking-widest flex items-center justify-center">
                                Page {currentPage} of {totalPages}
                            </span>
                            <button
                                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                                disabled={currentPage === totalPages}
                                className="ml-3 relative inline-flex items-center px-4 py-2 border border-ch-soft text-xs font-bold rounded-xl text-ch-dark bg-white hover:bg-ch-light hover:border-ch-soft disabled:opacity-50 transition-all shadow-sm active:scale-95 disabled:active:scale-100"
                            >
                                Next
                            </button>
                        </div>
                        <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
                            <div>
                                <p className="text-xs text-ch-primary font-medium">
                                    Showing <span className="font-extrabold text-ch-dark">{(currentPage - 1) * itemsPerPage + 1}</span> to <span className="font-extrabold text-ch-dark">{Math.min(currentPage * itemsPerPage, clientNames.length)}</span> of <span className="font-extrabold text-ch-dark">{clientNames.length}</span> clients
                                </p>
                            </div>
                            <div>
                                <nav className="relative z-0 inline-flex rounded-xl shadow-sm space-x-1" aria-label="Pagination">
                                    <button
                                        onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                                        disabled={currentPage === 1}
                                        className="relative inline-flex items-center px-3 py-2 rounded-lg border border-ch-soft bg-white text-xs font-bold text-ch-primary hover:bg-ch-light hover:text-ch-dark disabled:opacity-50 transition-all active:scale-95 disabled:active:scale-100"
                                    >
                                        <span className="sr-only">Previous</span>
                                        <span className="px-1 text-sm tracking-tighter">&laquo;</span>
                                    </button>
                                    <span className="relative inline-flex items-center px-4 py-2 border border-ch-soft bg-ch-light rounded-lg text-xs font-extrabold text-ch-dark shadow-inner">
                                        Page {currentPage} of {totalPages}
                                    </span>
                                    <button
                                        onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                                        disabled={currentPage === totalPages}
                                        className="relative inline-flex items-center px-3 py-2 rounded-lg border border-ch-soft bg-white text-xs font-bold text-ch-primary hover:bg-ch-light hover:text-ch-dark disabled:opacity-50 transition-all active:scale-95 disabled:active:scale-100"
                                    >
                                        <span className="sr-only">Next</span>
                                        <span className="px-1 text-sm tracking-tighter">&raquo;</span>
                                    </button>
                                </nav>
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* Attachment Viewer Modal */}
            <AttachmentViewer
                isOpen={!!viewingAttachments}
                onClose={() => setViewingAttachments(null)}
                attachments={viewingAttachments?.attachments || []}
                entryName={viewingAttachments?.clientName || ''}
            />
        </div>
    );
}
