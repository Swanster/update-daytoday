import { useMemo, useState, useEffect } from 'react';
import AttachmentViewer from './AttachmentViewer';
import StatusCell from './StatusCell';

export default function DailyTable({ dailies, onEdit, onDelete, selectedIds = [], onSelectionChange, onBatchStatusUpdate, onAddEntry, onStatusUpdate }) {

    const formatDate = (dateString) => {
        if (!dateString) return '-';
        const date = new Date(dateString);
        return date.toLocaleDateString('en-GB', {
            day: 'numeric',
            month: 'short',
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
        
        if (actionLower === 'remote') {
            return baseClasses + " bg-blue-50 text-blue-700 border-blue-200";
        }
        if (actionLower === 'onsite') {
            return baseClasses + " bg-teal-50 text-teal-700 border-teal-200";
        }
        
        return baseClasses + " bg-ch-light text-ch-dark border-ch-soft";
    };

    const getActivityBadgeClass = (activity) => {
        if (!activity) return '';
        const baseClasses = "inline-flex items-center px-2.5 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider border shadow-sm";
        const actLower = activity.toLowerCase();
        
        if (actLower === 'installation') {
            return baseClasses + " bg-purple-50 text-purple-700 border-purple-200";
        }
        if (actLower === 'maintenance') {
            return baseClasses + " bg-sky-50 text-sky-700 border-sky-200";
        }
        if (actLower === 'troubleshoot') {
            return baseClasses + " bg-rose-50 text-rose-700 border-rose-200";
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
                {/* Desktop Table View */}
                <div className="hidden md:block overflow-x-auto">
                    <table className="w-full text-sm text-left border-collapse table-fixed">
                        <thead className="bg-ch-light text-ch-primary font-bold uppercase text-[10px] tracking-widest sticky top-0 z-10">
                            <tr>
                                <th className="p-2 w-10 border-b border-ch-soft">
                                    <input
                                        type="checkbox"
                                        checked={allSelected}
                                        ref={el => { if (el) el.indeterminate = someSelected; }}
                                        onChange={handleSelectAll}
                                        title="Select all"
                                        className="rounded border-ch-soft text-ch-primary focus:ring-ch-primary focus:ring-offset-0 w-3.5 h-3.5 cursor-pointer"
                                    />
                                </th>
                                <th className="px-2 py-3 border-b border-ch-soft whitespace-nowrap w-10">No</th>
                                <th className="px-2 py-3 border-b border-ch-soft whitespace-nowrap w-24">Date</th>
                                <th className="px-2 py-3 border-b border-ch-soft whitespace-nowrap w-[14%]">Client Name</th>
                                <th className="px-2 py-3 border-b border-ch-soft whitespace-nowrap w-[12%]">Case & Issue</th>
                                <th className="px-2 py-3 border-b border-ch-soft whitespace-nowrap w-[9%]">Activity</th>
                                <th className="px-2 py-3 border-b border-ch-soft whitespace-nowrap w-16">Action</th>
                                <th className="px-2 py-3 border-b border-ch-soft whitespace-nowrap w-[10%]">PIC Team</th>
                                <th className="px-2 py-3 border-b border-ch-soft whitespace-nowrap">Detail Action</th>
                                <th className="px-2 py-3 border-b border-ch-soft whitespace-nowrap w-20">Status</th>
                                <th className="px-2 py-3 border-b border-ch-soft whitespace-nowrap text-center w-20">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-ch-soft">
                            {dailies.map((entry, index) => {
                                const isSelected = selectedIds.includes(entry._id);
                                const rowBg = index % 2 === 0 ? 'bg-white' : 'bg-ch-light/50';
                                
                                let rowClassName = rowBg;
                                if (isSelected) {
                                    rowClassName += ' bg-ch-soft/60 transition-colors duration-300';
                                }
                                rowClassName += ' hover:bg-ch-soft/80 transition-colors group relative';

                                // Get activity value from services array
                                const activity = entry.services && Array.isArray(entry.services) && entry.services.length > 0 
                                    ? entry.services[0] 
                                    : (typeof entry.services === 'string' ? entry.services : '');
                                
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
                                        <td className="px-2 py-2 border-r border-ch-soft/50 relative z-10">
                                            <input
                                                type="checkbox"
                                                checked={selectedIds.includes(entry._id)}
                                                onChange={() => handleSelectOne(entry._id)}
                                                className="rounded border-ch-soft text-ch-primary focus:ring-ch-primary focus:ring-offset-0 w-3.5 h-3.5 cursor-pointer transition-all"
                                            />
                                        </td>

                                        {/* Row Number */}
                                        <td className="px-2 py-2 text-center text-ch-primary font-bold border-r border-ch-soft/50 text-xs">
                                            {index + 1}
                                        </td>

                                        {/* Date */}
                                        <td className="px-2 py-2 whitespace-nowrap text-ch-dark font-medium text-[11px] font-mono">{formatDate(entry.date)}</td>

                                        {/* Client Name */}
                                        <td className="px-2 py-2 font-extrabold text-ch-dark truncate" title={entry.clientName}>
                                            {entry.clientName}
                                        </td>

                                        {/* Case & Issue */}
                                        <td className="px-2 py-2">
                                            <div className="flex flex-wrap gap-1">
                                                {entry.caseIssue && (Array.isArray(entry.caseIssue) ? entry.caseIssue.length > 0 : entry.caseIssue) ? (
                                                    (Array.isArray(entry.caseIssue) ? entry.caseIssue : [entry.caseIssue]).map((ct, idx) => (
                                                        <span key={idx} className="bg-ch-soft text-ch-dark border border-ch-soft px-1.5 py-0.5 rounded text-[10px] font-extrabold tracking-widest uppercase shadow-sm">{ct}</span>
                                                    ))
                                                ) : <span className="text-ch-soft">-</span>}
                                            </div>
                                        </td>

                                        {/* Activity */}
                                        <td className="px-2 py-2 whitespace-nowrap">
                                            {activity ? (
                                                <span className={getActivityBadgeClass(activity)}>
                                                    {activity}
                                                </span>
                                            ) : <span className="text-ch-soft">-</span>}
                                        </td>

                                        {/* Action */}
                                        <td className="px-2 py-2 whitespace-nowrap">
                                            {entry.action ? (
                                                <span className={getActionBadgeClass(entry.action)}>
                                                    {entry.action}
                                                </span>
                                            ) : <span className="text-ch-soft">-</span>}
                                        </td>

                                        {/* PIC Team */}
                                        <td className="px-2 py-2">
                                            <div className="flex flex-wrap gap-1">
                                                {entry.picTeam && entry.picTeam.length > 0 ? (
                                                    entry.picTeam.map((member, idx) => (
                                                        <span key={idx} className="bg-purple-50 text-purple-700 border border-purple-100 px-2 py-0.5 rounded-md text-[10px] font-extrabold uppercase tracking-widest shadow-sm">{member}</span>
                                                    ))
                                                ) : <span className="text-ch-soft">-</span>}
                                            </div>
                                        </td>

                                        {/* Detail Action */}
                                        <td className="px-2 py-2 max-w-0">
                                            <div className="text-xs text-ch-dark leading-relaxed font-medium truncate" title={entry.detailAction || ''}>
                                                {entry.detailAction || <span className="text-ch-soft">-</span>}
                                            </div>
                                        </td>

                                        {/* Status */}
                                        <td className="px-2 py-2 whitespace-nowrap">
                                            {entry.status ? (
                                                <StatusCell
                                                    value={entry.status}
                                                    type="status"
                                                    onUpdate={(val) => onStatusUpdate(entry._id, 'status', val)}
                                                />
                                            ) : <span className="text-ch-soft">-</span>}
                                        </td>

                                        {/* Actions */}
                                        <td className="px-2 py-2 whitespace-nowrap">
                                            <div className="flex items-center justify-center gap-1 relative z-10">
                                                {entry.attachments && entry.attachments.length > 0 && (() => {
                                                    const attachTitle = entry.attachments.length + " file(s) attached - Click to view";
                                                    return (
                                                        <button
                                                            className="p-1 text-ch-primary bg-ch-soft hover:text-ch-dark rounded transition-all active:scale-95 flex items-center"
                                                            title={attachTitle}
                                                            onClick={() => setViewingAttachments(entry)}
                                                        >
                                                            📎<span className="text-[9px] font-bold">{entry.attachments.length}</span>
                                                        </button>
                                                    );
                                                })()}
                                                <button
                                                    className="p-1 text-ch-primary hover:text-ch-primary hover:bg-ch-soft rounded transition-all bg-white border border-ch-soft active:scale-95"
                                                    onClick={() => onEdit(entry)}
                                                    title="Edit"
                                                >
                                                    ✏️
                                                </button>
                                                <button
                                                    className="p-1 text-ch-primary hover:text-red-600 hover:bg-red-50 rounded transition-all bg-white border border-ch-soft active:scale-95"
                                                    onClick={() => onDelete(entry._id)}
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

                {/* Mobile Expandable Card View */}
                <div className="md:hidden flex flex-col gap-4 p-4 bg-ch-light/50">
                    {dailies.map((entry) => {
                        // Get activity value from services array
                        const activity = entry.services && Array.isArray(entry.services) && entry.services.length > 0 
                            ? entry.services[0] 
                            : (typeof entry.services === 'string' ? entry.services : '');

                        return (
                            <div key={entry._id} className="bg-white rounded-2xl shadow-sm border border-ch-soft overflow-hidden transition-all duration-300">
                                {/* Card Header / Preview - Click to Expand */}
                                <div 
                                    className="p-5 cursor-pointer hover:bg-ch-light/80 transition-colors"
                                    onClick={() => toggleExpand(entry._id)}
                                >
                                    <div className="flex justify-between items-start gap-3">
                                        <div className="flex-1">
                                            <div className="text-[10px] font-bold text-ch-primary mb-1 font-mono">{formatDate(entry.date)}</div>
                                            <h4 className="font-extrabold text-ch-dark text-base">
                                                {entry.clientName}
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

                                            {/* Full Issue */}
                                            {entry.caseIssue && (
                                                <div className="bg-white p-3 rounded-xl border border-ch-soft shadow-sm">
                                                    <span className="text-[10px] font-extrabold text-ch-primary uppercase tracking-widest block mb-2">Case & Issue</span>
                                                    <div className="flex flex-wrap gap-1.5">
                                                        {(Array.isArray(entry.caseIssue) ? entry.caseIssue : [entry.caseIssue]).map((ct, idx) => (
                                                            <span key={idx} className="bg-ch-light text-ch-dark border border-ch-soft px-2 py-1 rounded-md text-[10px] font-bold">{ct}</span>
                                                        ))}
                                                    </div>
                                                </div>
                                            )}

                                            {/* Full Detail Action */}
                                            <div className="bg-white p-3 rounded-xl border border-ch-soft shadow-sm">
                                                <span className="text-[10px] font-extrabold text-ch-primary uppercase tracking-widest block mb-2">Detail Action</span>
                                                <div className="text-xs text-ch-dark font-medium whitespace-pre-wrap leading-relaxed">
                                                    {entry.detailAction || '-'}
                                                </div>
                                            </div>

                                            {/* Info Rows */}
                                            <div className="grid grid-cols-3 gap-3 text-xs">
                                                <div className="bg-white p-3 rounded-xl border border-ch-soft shadow-sm">
                                                    <span className="text-[10px] font-extrabold text-ch-primary uppercase tracking-widest block mb-2">Activity</span>
                                                    {activity ? (
                                                        <span className={getActivityBadgeClass(activity)}>{activity}</span>
                                                    ) : <span className="text-ch-soft text-xs">-</span>}
                                                </div>
                                                <div className="bg-white p-3 rounded-xl border border-ch-soft shadow-sm">
                                                    <span className="text-[10px] font-extrabold text-ch-primary uppercase tracking-widest block mb-2">Action</span>
                                                    {entry.action ? (
                                                        <span className={getActionBadgeClass(entry.action)}>{entry.action}</span>
                                                    ) : <span className="text-ch-soft text-xs">-</span>}
                                                </div>
                                                <div className="bg-white p-3 rounded-xl border border-ch-soft shadow-sm">
                                                    <span className="text-[10px] font-extrabold text-ch-primary uppercase tracking-widest block mb-2">PIC</span>
                                                    <div className="flex flex-wrap gap-1.5">
                                                        {entry.picTeam && entry.picTeam.map((p, idx) => (
                                                             <span key={idx} className="bg-ch-dark text-ch-soft px-2 py-0.5 rounded-md font-bold tracking-wide text-[10px]">{p}</span>
                                                        ))}
                                                        {(!entry.picTeam || entry.picTeam.length === 0) && <span className="text-ch-soft text-xs">-</span>}
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Action Buttons */}
                                            <div className="flex gap-2 mt-2 pt-4 border-t border-ch-soft">
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
                        );
                    })}
                </div>

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
