import { useMemo, useState, useEffect } from 'react';
import AttachmentViewer from './AttachmentViewer';
import StatusCell from './StatusCell';

export default function SpreadsheetTable({ projects, onEdit, onDelete, selectedIds = [], onSelectionChange, onBatchStatusUpdate, onAddEntry, onStatusUpdate }) {
    const [expandedId, setExpandedId] = useState(null);
    // Group projects by name for merged cell display
    const groupedProjects = useMemo(() => {
        const groups = {};

        projects.forEach(project => {
            if (!groups[project.projectName]) {
                groups[project.projectName] = [];
            }
            groups[project.projectName].push(project);
        });

        return groups;
    }, [projects]);

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
            return `${baseClasses} bg-emerald-50 text-emerald-700 border-emerald-200`;
        } else if (statusLower.includes('progress')) {
            return `${baseClasses} bg-ch-soft text-ch-dark border-ch-soft`;
        } else if (statusLower.includes('hold')) {
            return `${baseClasses} bg-amber-50 text-amber-700 border-amber-200`;
        } else {
            return `${baseClasses} bg-ch-light text-ch-dark border-ch-soft`;
        }
    };

    // Check if all projects are selected
    const allSelected = projects.length > 0 && selectedIds.length === projects.length;
    const someSelected = selectedIds.length > 0 && selectedIds.length < projects.length;

    // Handle select all checkbox
    const handleSelectAll = () => {
        if (allSelected) {
            onSelectionChange([]);
        } else {
            onSelectionChange(projects.map(p => p._id));
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

    if (projects.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center p-12 text-center text-ch-primary bg-white/95 rounded-2xl shadow-custom border border-ch-soft mb-6">
                <div className="text-5xl mb-4 opacity-40">📋</div>
                <h3 className="text-xl font-extrabold text-ch-dark mb-2">No Projects Yet</h3>
                <p className="font-medium">Click the "Add Entry" button to create your first project entry.</p>
            </div>
        );
    }

    const projectNames = Object.keys(groupedProjects);

    const paginatedProjectNames = projectNames;
    let rowNumber = 0;

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

            <div className="hidden md:block overflow-x-auto bg-white/95 rounded-2xl shadow-custom overflow-hidden border border-ch-soft">
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
                            <th className="px-5 py-4 border-b border-ch-soft whitespace-nowrap w-48">Survey Project<br />(Name Client)</th>
                            <th className="px-5 py-4 border-b border-ch-soft whitespace-nowrap">Service</th>
                            <th className="px-5 py-4 border-b border-ch-soft whitespace-nowrap">Report Survey</th>
                            <th className="px-5 py-4 border-b border-ch-soft whitespace-nowrap">WO</th>
                            <th className="px-5 py-4 border-b border-ch-soft whitespace-nowrap">Material</th>
                            <th className="px-5 py-4 border-b border-ch-soft whitespace-nowrap">Due Date</th>
                            <th className="px-5 py-4 border-b border-ch-soft whitespace-nowrap">Date</th>
                            <th className="px-5 py-4 border-b border-ch-soft whitespace-nowrap">PIC TIM</th>
                            <th className="px-5 py-4 border-b border-ch-soft whitespace-nowrap min-w-[200px]">Progress</th>
                            <th className="px-5 py-4 border-b border-ch-soft whitespace-nowrap">Status</th>
                            <th className="px-5 py-4 border-b border-ch-soft whitespace-nowrap text-right">Actions</th>
                        </tr>
                    </thead>
                        <tbody className="divide-y divide-ch-soft">
                            {paginatedProjectNames.map((projectName, projectIndex) => {
                                const projectEntries = groupedProjects[projectName];
                                rowNumber++;
                                // Alternate colors by PROJECT, not by row
                                const projectColorClass = projectIndex % 2 === 0 ? 'bg-ch-light/30' : 'bg-white';

                                return projectEntries.map((entry, entryIndex) => (
                                    <tr
                                        key={entry._id}
                                        className={`${projectColorClass} ${selectedIds.includes(entry._id) ? 'bg-ch-soft/50' : ''} hover:bg-ch-light transition-colors group relative`}
                                    >
                                        {/* Checkbox */}
                                        <td className="px-4 py-3 border-r border-ch-soft/50">
                                            <input
                                                type="checkbox"
                                                checked={selectedIds.includes(entry._id)}
                                                onChange={() => handleSelectOne(entry._id)}
                                                className="rounded border-ch-soft text-ch-primary focus:ring-ch-primary focus:ring-offset-0 w-4 h-4 cursor-pointer transition-colors"
                                            />
                                        </td>

                                        {/* Row Number - only show on first entry of group */}
                                        {entryIndex === 0 && (
                                            <td
                                                rowSpan={projectEntries.length}
                                                className="px-4 py-3 text-center text-ch-primary font-extrabold border-r border-ch-soft/50 align-top text-xs"
                                            >
                                                {rowNumber}
                                            </td>
                                        )}

                                        {/* Project Name - merged for same projects, clickable to add entry */}
                                        {entryIndex === 0 && (
                                            <td
                                                className={`px-4 py-3 font-extrabold text-ch-dark border-r border-ch-soft/50 align-top cursor-pointer hover:text-ch-primary transition-colors relative group/client ${projectEntries.length > 1 ? 'align-top pt-4' : ''}`}
                                                rowSpan={projectEntries.length}
                                                onClick={() => onAddEntry && onAddEntry(projectName)}
                                                title="Click to add new entry for this project"
                                            >
                                                {projectName}
                                                <span className="absolute top-2 right-2 text-[10px] font-bold opacity-0 group-hover/client:opacity-100 text-ch-primary bg-ch-soft border border-ch-soft px-1.5 py-0.5 rounded-md transition-all shadow-sm transform group-hover/client:scale-100 scale-95">+ Add</span>
                                            </td>
                                        )}

                                        {/* Services/Categories */}
                                        <td className="px-4 py-3">
                                            <div className="flex flex-wrap gap-1">
                                                {entry.services && entry.services.length > 0 ? (
                                                    (Array.isArray(entry.services) ? entry.services : [entry.services]).map((cat, idx) => (
                                                        <span key={idx} className="bg-ch-soft text-ch-dark border border-ch-soft px-2 py-0.5 rounded text-[10px] font-extrabold tracking-widest uppercase shadow-sm">{cat}</span>
                                                    ))
                                                ) : <span className="text-ch-soft">-</span>}
                                            </div>
                                        </td>

                                        {/* Report Survey */}
                                        <td className="px-4 py-3 whitespace-nowrap">
                                            {entry.reportSurvey ? (
                                                <StatusCell
                                                    value={entry.reportSurvey}
                                                    type="reportSurvey"
                                                    onUpdate={(val) => onStatusUpdate(entry._id, 'reportSurvey', val)}
                                                />
                                            ) : <span className="text-ch-soft">-</span>}
                                        </td>

                                        {/* WO */}
                                        <td className="px-4 py-3 whitespace-nowrap">
                                            {entry.wo ? (
                                                <StatusCell
                                                    value={entry.wo}
                                                    type="wo"
                                                    onUpdate={(val) => onStatusUpdate(entry._id, 'wo', val)}
                                                />
                                            ) : <span className="text-ch-soft">-</span>}
                                        </td>

                                        {/* Material */}
                                        <td className="px-4 py-3 whitespace-nowrap">
                                            {entry.material ? (
                                                <StatusCell
                                                    value={entry.material}
                                                    type="material"
                                                    onUpdate={(val) => onStatusUpdate(entry._id, 'material', val)}
                                                />
                                            ) : <span className="text-ch-soft">-</span>}
                                        </td>

                                        {/* Due Date */}
                                        <td className="px-4 py-3 whitespace-nowrap text-ch-dark font-mono text-[11px] font-bold">{formatDate(entry.dueDate)}</td>

                                        {/* Date */}
                                        <td className="px-4 py-3 whitespace-nowrap text-ch-dark font-mono text-[11px] font-bold">{formatDate(entry.date)}</td>

                                        {/* PIC Team */}
                                        <td className="px-4 py-3">
                                            <div className="flex flex-wrap gap-1">
                                                {entry.picTeam && entry.picTeam.length > 0 ? (
                                                    entry.picTeam.map((member, idx) => (
                                                        <span key={idx} className="bg-purple-50 text-purple-700 border border-purple-100 px-2 py-0.5 rounded-md text-[10px] font-extrabold uppercase tracking-widest shadow-sm">{member}</span>
                                                    ))
                                                ) : <span className="text-ch-soft">-</span>}
                                            </div>
                                        </td>

                                        {/* Progress */}
                                        <td className="px-4 py-3 min-w-[300px]">
                                            <div className="text-xs text-ch-dark leading-relaxed font-medium whitespace-pre-wrap">
                                                {entry.progress ? (
                                                    entry.progress.split('\n').map((line, idx) => (
                                                        <div key={idx} className="flex gap-2">
                                                            <span className="text-ch-primary font-bold shrink-0">•</span>
                                                            <span className="line-clamp-2 md:line-clamp-none hover:line-clamp-none transition-all">{line}</span>
                                                        </div>
                                                    ))
                                                ) : <span className="text-ch-soft">-</span>}
                                            </div>
                                        </td>

                                        {/* Status */}
                                        <td className="px-4 py-3 whitespace-nowrap">
                                            {entry.status ? (
                                                <StatusCell
                                                    value={entry.status}
                                                    type="status"
                                                    onUpdate={(val) => onStatusUpdate(entry._id, 'status', val)}
                                                />
                                            ) : <span className="text-ch-soft">-</span>}
                                        </td>

                                        {/* Actions */}
                                        <td className="px-4 py-3 text-right whitespace-nowrap">
                                            <div className="flex items-center justify-end gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                                                {entry.attachments && entry.attachments.length > 0 && (
                                                    <button
                                                        className="p-1.5 text-blue-500 bg-blue-50 hover:bg-blue-100 border border-blue-200 rounded-lg transition-all shadow-sm active:scale-95 flex items-center justify-center relative"
                                                        title={`${entry.attachments.length} file(s) attached - Click to view`}
                                                        onClick={() => setViewingAttachments(entry)}
                                                    >
                                                        📎
                                                        <span className="absolute -top-1.5 -right-1.5 bg-red-500 text-white text-[9px] font-bold w-4 h-4 rounded-full flex items-center justify-center shadow-sm">
                                                            {entry.attachments.length}
                                                        </span>
                                                    </button>
                                                )}
                                                <button
                                                    className="p-1.5 text-ch-primary bg-white border border-ch-soft hover:text-ch-primary hover:bg-ch-light hover:border-ch-soft rounded-lg transition-all shadow-sm active:scale-95 flex items-center justify-center"
                                                    onClick={() => onEdit(entry)}
                                                    title="Edit"
                                                >
                                                    <span className="text-xs">✏️</span>
                                                </button>
                                                <button
                                                    className="p-1.5 text-ch-primary bg-white border border-ch-soft hover:text-red-600 hover:bg-red-50 hover:border-red-200 rounded-lg transition-all shadow-sm active:scale-95 flex items-center justify-center"
                                                    onClick={() => onDelete(entry._id)}
                                                    title="Delete"
                                                >
                                                    <span className="text-xs">🗑️</span>
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ));
                            })}
                        </tbody>
                    </table>
                </div>

                {/* Mobile Expandable Card View */}
                <div className="md:hidden flex flex-col gap-4 p-4 bg-ch-light/50">
                    {paginatedProjectNames.map((projectName) => {
                         const projectEntries = groupedProjects[projectName];
                         return projectEntries.map((entry) => (
                            <div key={entry._id} className={`bg-white rounded-2xl shadow-sm border transition-all duration-300 overflow-hidden ${expandedId === entry._id ? 'border-ch-soft shadow-md ring-1 ring-ch-soft/50' : 'border-ch-soft hover:border-ch-soft hover:shadow-md'}`}>
                                {/* Card Header / Preview */}
                                <div 
                                    className="p-4 cursor-pointer relative"
                                    onClick={() => setExpandedId(expandedId === entry._id ? null : entry._id)}
                                >
                                    <div className="flex justify-between items-start gap-4">
                                        <div className="flex-1 min-w-0">
                                            <h4
                                                className="font-extrabold text-ch-dark text-sm flex items-center gap-1.5 cursor-pointer hover:text-ch-primary transition-colors truncate group/title"
                                                onClick={(e) => { e.stopPropagation(); onAddEntry && onAddEntry(entry.projectName); }}
                                            >
                                                {entry.projectName}
                                                <span className="text-ch-primary opacity-0 group-hover/title:opacity-100 transition-opacity bg-ch-soft px-1.5 py-0.5 rounded text-[10px] font-bold border border-ch-soft">＋ Add</span>
                                            </h4>
                                            
                                            {/* Preview: Progress (Truncated) */}
                                            <div className="mt-2 text-xs text-ch-primary flex items-start gap-1.5">
                                                <span className="text-ch-primary shrink-0 mt-0.5">📈</span>
                                                <span className="line-clamp-2 font-medium leading-relaxed">
                                                    {entry.progress || '-'}
                                                </span>
                                            </div>
                                        </div>

                                        <div className="shrink-0 flex flex-col items-end gap-2" onClick={(e) => e.stopPropagation()}>
                                            <StatusCell
                                                value={entry.status}
                                                type="status"
                                                onUpdate={(val) => onStatusUpdate(entry._id, 'status', val)}
                                            />
                                        </div>
                                    </div>
                                    <div className="flex justify-center mt-3 border-t border-ch-light pt-2">
                                        <span className={`text-ch-soft text-[10px] transform transition-transform duration-300 flex items-center justify-center w-6 h-6 rounded-full bg-ch-light ${expandedId === entry._id ? 'rotate-180 bg-ch-soft text-ch-primary' : ''}`}>▼</span>
                                    </div>
                                </div>

                                {/* Expanded Details */}
                                {expandedId === entry._id && (
                                    <div className="px-5 pb-5 pt-2 border-t border-ch-light bg-ch-light/50 animate-slide-down">
                                        <div className="flex flex-col gap-4 mt-2">
                                            
                                            <div className="flex justify-between text-xs font-bold text-ch-primary">
                                                <span>📅 {formatDate(entry.date)}</span>
                                                {entry.dueDate && <span className="bg-ch-soft text-ch-dark px-2 py-0.5 rounded-md shadow-sm">Due: {formatDate(entry.dueDate)}</span>}
                                            </div>

                                            <div className="bg-white p-3 rounded-xl border border-ch-soft shadow-sm mt-1">
                                                <span className="text-[10px] font-extrabold text-ch-primary uppercase tracking-widest block mb-2">Full Progress</span>
                                                <div className="text-xs text-ch-dark font-medium whitespace-pre-wrap leading-relaxed">
                                                    {entry.progress || '-'}
                                                </div>
                                            </div>

                                            <div className="grid grid-cols-2 gap-3 text-xs">
                                                <div className="bg-white p-3 rounded-xl border border-ch-soft shadow-sm">
                                                    <span className="text-[10px] font-extrabold text-ch-primary uppercase tracking-widest block mb-2">Service</span>
                                                    <div className="flex flex-wrap gap-1.5">
                                                        {entry.services && (Array.isArray(entry.services) ? entry.services : [entry.services]).map((s, idx) => (
                                                             <span key={idx} className="bg-ch-light text-ch-dark font-bold border border-ch-soft px-2 py-1 rounded-md">{s}</span>
                                                        ))}
                                                    </div>
                                                </div>
                                                <div className="bg-white p-3 rounded-xl border border-ch-soft shadow-sm">
                                                    <span className="text-[10px] font-extrabold text-ch-primary uppercase tracking-widest block mb-2">PIC TEAM</span>
                                                    <div className="flex flex-wrap gap-1.5">
                                                        {entry.picTeam && entry.picTeam.map((p, idx) => (
                                                             <span key={idx} className="bg-purple-50 text-purple-700 px-2 py-1 rounded-md font-bold border border-purple-100">{p}</span>
                                                        ))}
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Statuses Grid */}
                                            <div className="grid grid-cols-3 gap-3 text-[10px]">
                                                <div className="bg-white p-2 rounded-xl border border-ch-soft shadow-sm flex flex-col items-center justify-between">
                                                    <span className="font-extrabold text-ch-primary uppercase tracking-widest block mb-2">Report</span>
                                                    {entry.reportSurvey ? (
                                                        <StatusCell
                                                            value={entry.reportSurvey}
                                                            type="reportSurvey"
                                                            onUpdate={(val) => onStatusUpdate(entry._id, 'reportSurvey', val)}
                                                        />
                                                    ) : <span className="text-ch-soft font-bold">-</span>}
                                                </div>
                                                <div className="bg-white p-2 rounded-xl border border-ch-soft shadow-sm flex flex-col items-center justify-between">
                                                    <span className="font-extrabold text-ch-primary uppercase tracking-widest block mb-2">WO</span>
                                                    {entry.wo ? (
                                                        <StatusCell
                                                            value={entry.wo}
                                                            type="wo"
                                                            onUpdate={(val) => onStatusUpdate(entry._id, 'wo', val)}
                                                        />
                                                    ) : <span className="text-ch-soft font-bold">-</span>}
                                                </div>
                                                <div className="bg-white p-2 rounded-xl border border-ch-soft shadow-sm flex flex-col items-center justify-between">
                                                    <span className="font-extrabold text-ch-primary uppercase tracking-widest block mb-2">Material</span>
                                                    {entry.material ? (
                                                        <StatusCell
                                                            value={entry.material}
                                                            type="material"
                                                            onUpdate={(val) => onStatusUpdate(entry._id, 'material', val)}
                                                        />
                                                    ) : <span className="text-ch-soft font-bold">-</span>}
                                                </div>
                                            </div>

                                            <div className="flex gap-2 mt-2 pt-4 border-t border-ch-soft">
                                                <button
                                                    className="flex-1 py-2 bg-ch-soft text-ch-dark border border-ch-soft rounded-xl text-[11px] font-bold hover:bg-ch-soft hover:border-ch-primary transition-all shadow-sm active:scale-95 flex items-center justify-center gap-1.5"
                                                    onClick={(e) => { e.stopPropagation(); onAddEntry && onAddEntry(entry.projectName); }}
                                                >
                                                    ＋ Quick Add
                                                </button>
                                                <button
                                                    className="flex-1 py-2 bg-white text-ch-dark border border-ch-soft rounded-xl text-[11px] font-bold hover:text-ch-primary hover:bg-ch-light transition-all shadow-sm active:scale-95 flex items-center justify-center gap-1.5"
                                                    onClick={(e) => { e.stopPropagation(); onEdit(entry); }}
                                                >
                                                    ✏️ Edit
                                                </button>
                                                <button
                                                    className="flex-1 py-2 bg-white text-ch-primary border border-ch-soft rounded-xl text-[11px] font-bold hover:text-red-600 hover:bg-red-50 transition-all shadow-sm active:scale-95 flex items-center justify-center gap-1.5"
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

                
                {/* Attachment Viewer Modal */}
                <AttachmentViewer
                    isOpen={!!viewingAttachments}
                    onClose={() => setViewingAttachments(null)}
                    attachments={viewingAttachments?.attachments || []}
                    entryName={viewingAttachments?.projectName || ''}
                />
        </div>
    );
}
