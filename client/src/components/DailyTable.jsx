import { useMemo, useState } from 'react';
import AttachmentViewer from './AttachmentViewer';

export default function DailyTable({ dailies, onEdit, onDelete, selectedIds = [], onSelectionChange, onBatchStatusUpdate, onAddEntry }) {
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
        const baseClasses = "inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border";
        const statusLower = status.toLowerCase();
        
        if (statusLower.includes('done') || statusLower.includes('complete')) {
            return `${baseClasses} bg-green-100 text-green-800 border-green-200`;
        } else if (statusLower.includes('progress')) {
            return `${baseClasses} bg-blue-100 text-blue-800 border-blue-200`;
        } else if (statusLower.includes('hold')) {
            return `${baseClasses} bg-orange-100 text-orange-800 border-orange-200`;
        } else {
            return `${baseClasses} bg-gray-100 text-gray-800 border-gray-200`;
        }
    };

    const getActionBadgeClass = (action) => {
        if (!action) return '';
        const baseClasses = "inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border";
        const actionLower = action.toLowerCase();
        
        if (actionLower.includes('monitor')) return `${baseClasses} bg-indigo-100 text-indigo-800 border-indigo-200`;
        if (actionLower.includes('config')) return `${baseClasses} bg-purple-100 text-purple-800 border-purple-200`;
        if (actionLower.includes('install')) return `${baseClasses} bg-teal-100 text-teal-800 border-teal-200`;
        
        return `${baseClasses} bg-gray-100 text-gray-800 border-gray-200`;
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

    if (dailies.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center p-12 text-center text-gray-400 bg-white rounded-xl shadow-custom border border-gray-100">
                <div className="text-4xl mb-4 opacity-50">📋</div>
                <h3 className="text-xl font-bold text-gray-700 mb-2">No Daily Entries Yet</h3>
                <p>Click the "Add Entry" button to create your first daily entry.</p>
            </div>
        );
    }

    const clientNames = Object.keys(groupedDailies);

    return (
        <div className="flex flex-col gap-4">
            {/* Batch Action Bar */}
            {selectedIds.length > 0 && (
                <div className="flex flex-wrap items-center gap-4 bg-orange-50 p-3 rounded-xl shadow-sm border border-orange-100 animate-slide-up">
                    <span className="text-sm font-semibold text-orange-800 px-2">{selectedIds.length} selected</span>
                    <div className="h-6 w-px bg-orange-200 hidden sm:block"></div>
                    <div className="flex items-center gap-2">
                        <span className="text-xs font-medium text-orange-700 uppercase tracking-wide mr-2 hidden sm:inline">Set Status:</span>
                        <button
                            className="px-3 py-1.5 bg-white text-green-600 text-xs font-bold rounded-lg border border-green-200 hover:bg-green-50 transition-colors shadow-sm"
                            onClick={() => onBatchStatusUpdate('Done')}
                        >
                            ✓ Done
                        </button>
                        <button
                            className="px-3 py-1.5 bg-white text-blue-600 text-xs font-bold rounded-lg border border-blue-200 hover:bg-blue-50 transition-colors shadow-sm"
                            onClick={() => onBatchStatusUpdate('Progress')}
                        >
                            ⏳ Progress
                        </button>
                        <button
                            className="px-3 py-1.5 bg-white text-orange-600 text-xs font-bold rounded-lg border border-orange-200 hover:bg-orange-50 transition-colors shadow-sm"
                            onClick={() => onBatchStatusUpdate('Hold')}
                        >
                            ⏸ Hold
                        </button>
                    </div>
                    <div className="flex-1"></div>
                    <button
                        className="px-3 py-1.5 text-gray-500 hover:text-gray-700 text-xs font-semibold"
                        onClick={() => onSelectionChange([])}
                    >
                        ✕ Clear Selection
                    </button>
                </div>
            )}

            <div className="bg-white rounded-xl shadow-custom overflow-hidden border border-gray-200/60">
                <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left border-collapse">
                        <thead className="bg-gray-50 text-gray-600 font-semibold uppercase text-xs">
                            <tr>
                                <th className="p-4 w-4 border-b border-gray-200">
                                    <input
                                        type="checkbox"
                                        checked={allSelected}
                                        ref={el => { if (el) el.indeterminate = someSelected; }}
                                        onChange={handleSelectAll}
                                        title="Select all"
                                        className="rounded border-gray-300 text-accent-coral focus:ring-accent-coral"
                                    />
                                </th>
                                <th className="px-4 py-3 border-b border-gray-200 whitespace-nowrap">No</th>
                                <th className="px-4 py-3 border-b border-gray-200 whitespace-nowrap w-48">Client Name</th>
                                <th className="px-4 py-3 border-b border-gray-200 whitespace-nowrap">Services</th>
                                <th className="px-4 py-3 border-b border-gray-200 whitespace-nowrap">Case & Issue</th>
                                <th className="px-4 py-3 border-b border-gray-200 whitespace-nowrap">Action</th>
                                <th className="px-4 py-3 border-b border-gray-200 whitespace-nowrap">Date</th>
                                <th className="px-4 py-3 border-b border-gray-200 whitespace-nowrap">PIC Team</th>
                                <th className="px-4 py-3 border-b border-gray-200 whitespace-nowrap min-w-[200px]">Detail Action</th>
                                <th className="px-4 py-3 border-b border-gray-200 whitespace-nowrap">Status</th>
                                <th className="px-4 py-3 border-b border-gray-200 whitespace-nowrap text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {clientNames.map((clientName, clientIndex) => {
                                const clientEntries = groupedDailies[clientName];
                                // Alternate colors by CLIENT, not by row
                                const clientColorClass = clientIndex % 2 === 0 ? 'bg-gray-100' : 'bg-white';

                                return clientEntries.map((entry, entryIndex) => (
                                    <tr
                                        key={entry._id}
                                        className={`${clientColorClass} ${selectedIds.includes(entry._id) ? 'bg-blue-50/50' : ''} hover:bg-gray-50 transition-colors group`}
                                    >
                                        {/* Checkbox */}
                                        <td className="px-4 py-3 border-r border-gray-100/50">
                                            <input
                                                type="checkbox"
                                                checked={selectedIds.includes(entry._id)}
                                                onChange={() => handleSelectOne(entry._id)}
                                                className="rounded border-gray-300 text-accent-coral focus:ring-accent-coral"
                                            />
                                        </td>

                                        {/* Row Number - only show on first entry of group, using quarterSequence */}
                                        {entryIndex === 0 && (
                                            <td
                                                rowSpan={clientEntries.length}
                                                className="px-4 py-3 text-center text-gray-400 font-medium border-r border-gray-100/50 align-top"
                                            >
                                                {entry.quarterSequence || '-'}
                                            </td>
                                        )}

                                        {/* Client Name - merged for same clients, clickable to add entry */}
                                        {entryIndex === 0 && (
                                            <td
                                                className={`px-4 py-3 font-semibold text-gray-800 border-r border-gray-100/50 align-top cursor-pointer hover:text-accent-coral transition-colors relative ${clientEntries.length > 1 ? 'align-top pt-4' : ''}`}
                                                rowSpan={clientEntries.length}
                                                onClick={() => onAddEntry && onAddEntry(clientName)}
                                                title="Click to add new entry for this client"
                                            >
                                                {clientName}
                                                <span className="absolute top-2 right-2 text-xs opacity-0 group-hover:opacity-100 text-accent-coral bg-orange-100 px-1 rounded transition-opacity">+</span>
                                            </td>
                                        )}

                                        {/* Services/Categories */}
                                        <td className="px-4 py-3">
                                            <div className="flex flex-wrap gap-1">
                                                {entry.services && entry.services.length > 0 ? (
                                                    (Array.isArray(entry.services) ? entry.services : [entry.services]).map((cat, idx) => (
                                                        <span key={idx} className="bg-gray-100 text-gray-600 border border-gray-200 px-2 py-0.5 rounded text-xs font-medium">{cat}</span>
                                                    ))
                                                ) : <span className="text-gray-300">-</span>}
                                            </div>
                                        </td>

                                        {/* Case & Issue */}
                                        <td className="px-4 py-3">
                                            <div className="flex flex-wrap gap-1">
                                                {entry.caseIssue && (Array.isArray(entry.caseIssue) ? entry.caseIssue.length > 0 : entry.caseIssue) ? (
                                                    (Array.isArray(entry.caseIssue) ? entry.caseIssue : [entry.caseIssue]).map((ct, idx) => (
                                                        <span key={idx} className="bg-gray-100 text-gray-600 border border-gray-200 px-2 py-0.5 rounded text-xs font-medium">{ct}</span>
                                                    ))
                                                ) : <span className="text-gray-300">-</span>}
                                            </div>
                                        </td>

                                        {/* Action */}
                                        <td className="px-4 py-3 whitespace-nowrap">
                                            {entry.action ? (
                                                <span className={getActionBadgeClass(entry.action)}>
                                                    {entry.action}
                                                </span>
                                            ) : <span className="text-gray-300">-</span>}
                                        </td>

                                        {/* Date */}
                                        <td className="px-4 py-3 whitespace-nowrap text-gray-600 font-mono text-xs">{formatDate(entry.date)}</td>

                                        {/* PIC Team */}
                                        <td className="px-4 py-3">
                                            <div className="flex flex-wrap gap-1">
                                                {entry.picTeam && entry.picTeam.length > 0 ? (
                                                    entry.picTeam.map((member, idx) => (
                                                        <span key={idx} className="bg-teal-50 text-teal-700 border border-teal-100 px-2 py-0.5 rounded text-xs">{member}</span>
                                                    ))
                                                ) : <span className="text-gray-300">-</span>}
                                            </div>
                                        </td>

                                        {/* Detail Action */}
                                        <td className="px-4 py-3 min-w-[300px]">
                                            <div className="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap">
                                                {entry.detailAction ? (
                                                    entry.detailAction.split('\n').map((line, idx) => (
                                                        <div key={idx} className="flex gap-2">
                                                            <span className="text-gray-400">•</span>
                                                            <span>{line}</span>
                                                        </div>
                                                    ))
                                                ) : <span className="text-gray-300">-</span>}
                                            </div>
                                        </td>

                                        {/* Status */}
                                        <td className="px-4 py-3 whitespace-nowrap">
                                            {entry.status ? (
                                                <span className={getStatusBadgeClass(entry.status)}>
                                                    {entry.status}
                                                </span>
                                            ) : <span className="text-gray-300">-</span>}
                                        </td>

                                        {/* Actions */}
                                        <td className="px-4 py-3 text-right whitespace-nowrap">
                                            <div className="flex items-center justify-end gap-1">
                                                {entry.attachments && entry.attachments.length > 0 && (
                                                    <button
                                                        className="p-1.5 text-blue-500 hover:bg-blue-50 rounded-lg transition-colors"
                                                        title={`${entry.attachments.length} file(s) attached - Click to view`}
                                                        onClick={() => setViewingAttachments(entry)}
                                                    >
                                                        📎<span className="text-xs font-bold ml-0.5">{entry.attachments.length}</span>
                                                    </button>
                                                )}
                                                <button
                                                    className="p-1.5 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                                                    onClick={() => onEdit(entry)}
                                                    title="Edit"
                                                >
                                                    ✏️
                                                </button>
                                                <button
                                                    className="p-1.5 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                                    onClick={() => onDelete(entry._id)}
                                                    title="Delete"
                                                >
                                                    🗑️
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ));
                            })}
                        </tbody>
                    </table>
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
