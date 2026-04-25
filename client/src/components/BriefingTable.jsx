import { useMemo, Fragment } from 'react';

export default function BriefingTable({ 
    briefings, 
    onEdit, 
    onDelete, 
    selectedIds = [], 
    onSelectionChange, 
    onBatchStatusUpdate,
    onAddEntry,
    onSyncFromSheet,
    onSyncToSheet,
    syncing = false,
    sortBy = 'name',
    onSort,
    onStatusUpdate
}) {
    const renderSortIcon = (field) => {
        if (sortBy === field) {
            return <span className="ml-1 text-ch-primary">↓</span>;
        }
        return <span className="ml-1 text-ch-soft group-hover/sort:text-ch-primary/50 transition-colors">↕</span>;
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

    // Derived Metrics & Grouping
    const { metrics, groupedBriefings } = useMemo(() => {
        let total = 0, done = 0, progress = 0, hold = 0, pending = 0;
        
        const groups = {};

        briefings.forEach(b => {
            // Metrics calculation based on individual entries
            total++;
            const s = b.status?.toLowerCase();
            if (s === 'done' || s === 'selesai') done++;
            else if (s === 'progress' || s === 'proses') progress++;
            else if (s === 'hold') hold++;
            else pending++;

            // Grouping logic
            // Use Client Name (lokasi) and Case (pekerjaan) as the composite key
            const clientName = (b.lokasi || 'Unknown Client').trim();
            const caseName = (b.pekerjaan || 'Unknown Case').trim();
            const key = `${clientName}|${caseName}`.toLowerCase();

            if (!groups[key]) {
                groups[key] = {
                    _id: b._id, // Use the first encountered ID as the primary ID for the group
                    allIds: [b._id],
                    clientName: clientName,
                    caseName: caseName,
                    picList: b.pic ? [b.pic] : [],
                    pic: b.pic || 'Unassigned',
                    status: b.status || 'Pending',
                    originalEntries: [b]
                };
            } else {
                groups[key].allIds.push(b._id);
                groups[key].originalEntries.push(b);
                
                // Merge PICs uniquely
                if (b.pic && !groups[key].picList.includes(b.pic)) {
                    groups[key].picList.push(b.pic);
                }
                groups[key].pic = groups[key].picList.join(', ') || 'Unassigned';

                // Keep the most recent status (assuming array is sorted newest first)
            }
        });

        return {
            metrics: { total, done, progress, pending, hold },
            groupedBriefings: Object.values(groups)
        };
    }, [briefings]);

    // Group cards visually by selected mode
    const displayGroups = useMemo(() => {
        if (sortBy === 'date' || sortBy === 'sequence') {
            return [{
                groupName: 'All Briefings',
                hideHeader: true,
                cards: [...groupedBriefings].sort((a, b) => {
                    if (sortBy === 'date') {
                        const dateA = new Date(a.originalEntries[0]?.tanggal || 0);
                        const dateB = new Date(b.originalEntries[0]?.tanggal || 0);
                        return dateB - dateA; // newest first
                    }
                    return 0; // retain original array sequence (which is default)
                })
            }];
        }

        const cGroups = {};
        groupedBriefings.forEach(card => {
            const groupKey = sortBy === 'status' ? card.status : card.clientName;
            if (!cGroups[groupKey]) {
                cGroups[groupKey] = [];
            }
            cGroups[groupKey].push(card);
        });
        
        // Sort groups alphabetically, and cases alphabetically within
        return Object.entries(cGroups)
            .sort((a, b) => a[0].localeCompare(b[0]))
            .map(([groupName, cards]) => ({
                groupName,
                cards: cards.sort((a, b) => a.caseName.localeCompare(b.caseName))
            }));
    }, [groupedBriefings, sortBy]);

    // Check if all groups are selected (using their primary _id)
    const allSelected = groupedBriefings.length > 0 && 
                        groupedBriefings.every(g => selectedIds.includes(g._id));
    
    const someSelected = selectedIds.length > 0 && !allSelected;

    const handleSelectAll = () => {
        if (allSelected) {
            onSelectionChange([]);
        } else {
            // Select all primary IDs
            onSelectionChange(groupedBriefings.map(g => g._id));
        }
    };

    const handleSelectOne = (id) => {
        if (selectedIds.includes(id)) {
            onSelectionChange(selectedIds.filter(i => i !== id));
        } else {
            onSelectionChange([...selectedIds, id]);
        }
    };

    // Handlers for grouped actions
    const handleGroupStatusUpdate = (group, newStatus) => {
        group.allIds.forEach(id => {
            onStatusUpdate(id, newStatus);
        });
    };

    const handleGroupDelete = (group) => {
        group.allIds.forEach(id => {
            onDelete(id, group.caseName);
        });
    };

    const handleGroupEdit = (group) => {
        onEdit(group.originalEntries[0]);
    };

    const handleBatchAction = (newStatus) => {
        selectedIds.forEach(selectedId => {
            const group = groupedBriefings.find(g => g._id === selectedId);
            if (group) {
                handleGroupStatusUpdate(group, newStatus);
            }
        });
        onSelectionChange([]);
    };

    if (groupedBriefings.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center p-12 text-center text-ch-primary bg-white/95 rounded-3xl shadow-custom border border-ch-soft mb-6">
                <div className="w-24 h-24 mb-6 bg-ch-soft rounded-full flex items-center justify-center border-4 border-white shadow-sm">
                    <span className="text-4xl">📝</span>
                </div>
                <h3 className="text-2xl font-extrabold text-ch-dark mb-2 tracking-tight">No Briefings Yet</h3>
                <p className="font-medium text-ch-primary/80 mb-6 max-w-md">Get started by creating a new briefing entry or syncing data directly from your Google Sheets.</p>
                <div className="flex flex-wrap justify-center gap-3">
                    <button
                        onClick={onAddEntry}
                        className="px-6 py-2.5 bg-ch-dark text-white rounded-xl hover:bg-black hover:-translate-y-0.5 transition-all font-bold text-sm shadow-md"
                    >
                        + Add Briefing
                    </button>
                    <button
                        onClick={onSyncFromSheet}
                        disabled={syncing}
                        className="px-6 py-2.5 bg-white text-ch-primary border-2 border-ch-soft rounded-xl hover:bg-ch-soft hover:border-ch-primary/30 transition-all font-bold text-sm disabled:opacity-50 flex items-center gap-2"
                    >
                        <span className={syncing ? "animate-spin" : ""}>🔄</span> 
                        {syncing ? "Syncing..." : "Sync from Sheet"}
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="flex flex-col gap-6">
            {/* Dashboard Summary Metrics */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-white/80 backdrop-blur-md border border-ch-soft p-5 rounded-2xl shadow-sm hover:shadow-md transition-shadow">
                    <p className="text-xs font-bold text-ch-primary uppercase tracking-widest mb-1 opacity-70">Total Entries</p>
                    <h4 className="text-3xl font-extrabold text-ch-dark">{metrics.total}</h4>
                </div>
                <div className="bg-blue-50/80 backdrop-blur-md border border-blue-100 p-5 rounded-2xl shadow-sm hover:shadow-md transition-shadow">
                    <p className="text-xs font-bold text-blue-600 uppercase tracking-widest mb-1 opacity-70">In Progress</p>
                    <h4 className="text-3xl font-extrabold text-blue-800">{metrics.progress}</h4>
                </div>
                <div className="bg-emerald-50/80 backdrop-blur-md border border-emerald-100 p-5 rounded-2xl shadow-sm hover:shadow-md transition-shadow">
                    <p className="text-xs font-bold text-emerald-600 uppercase tracking-widest mb-1 opacity-70">Completed</p>
                    <h4 className="text-3xl font-extrabold text-emerald-800">{metrics.done}</h4>
                </div>
                <div className="bg-amber-50/80 backdrop-blur-md border border-amber-100 p-5 rounded-2xl shadow-sm hover:shadow-md transition-shadow">
                    <p className="text-xs font-bold text-amber-600 uppercase tracking-widest mb-1 opacity-70">Pending / Hold</p>
                    <h4 className="text-3xl font-extrabold text-amber-800">{metrics.pending + metrics.hold}</h4>
                </div>
            </div>

            {/* Batch Action Bar */}
            {selectedIds.length > 0 && (
                <div className="flex flex-wrap items-center gap-4 bg-ch-dark/95 backdrop-blur-md p-4 rounded-2xl shadow-lg border border-ch-dark animate-slide-up sticky top-4 z-30">
                    <div className="flex items-center gap-3">
                        <span className="flex items-center justify-center w-6 h-6 bg-white text-ch-dark rounded-full text-xs font-bold">
                            {selectedIds.length}
                        </span>
                        <span className="text-sm font-bold text-white">selected groups</span>
                    </div>
                    <div className="h-6 w-px bg-white/20 hidden sm:block"></div>
                    <div className="flex items-center gap-2">
                        <span className="text-[11px] font-bold text-white/70 uppercase tracking-widest mr-2 hidden sm:inline">Set Status:</span>
                        <button
                            className="px-3 py-1.5 bg-emerald-500/20 text-emerald-300 text-[11px] font-bold rounded-lg border border-emerald-500/30 hover:bg-emerald-500/40 transition-all shadow-sm active:scale-95 flex items-center gap-1.5"
                            onClick={() => handleBatchAction('Done')}
                        >
                            ✓ Done
                        </button>
                        <button
                            className="px-3 py-1.5 bg-blue-500/20 text-blue-300 text-[11px] font-bold rounded-lg border border-blue-500/30 hover:bg-blue-500/40 transition-all shadow-sm active:scale-95 flex items-center gap-1.5"
                            onClick={() => handleBatchAction('Progress')}
                        >
                            ⏳ Progress
                        </button>
                        <button
                            className="px-3 py-1.5 bg-amber-500/20 text-amber-300 text-[11px] font-bold rounded-lg border border-amber-500/30 hover:bg-amber-500/40 transition-all shadow-sm active:scale-95 flex items-center gap-1.5"
                            onClick={() => handleBatchAction('Hold')}
                        >
                            ⏸ Hold
                        </button>
                    </div>
                    <div className="flex-1"></div>
                    <button
                        className="px-4 py-1.5 text-white/70 hover:text-white hover:bg-white/10 rounded-lg text-[11px] font-bold transition-colors flex items-center gap-1.5"
                        onClick={() => onSelectionChange([])}
                    >
                        ✕ Clear Selection
                    </button>
                </div>
            )}

            {/* List Controls */}
            <div className="flex flex-wrap items-center justify-between gap-4 bg-white/50 px-4 py-3 rounded-xl border border-ch-soft">
                <div className="flex items-center gap-3">
                    <input
                        type="checkbox"
                        checked={allSelected}
                        ref={el => { if (el) el.indeterminate = someSelected; }}
                        onChange={handleSelectAll}
                        id="selectAllCards"
                        className="rounded border-ch-primary/30 text-ch-primary focus:ring-ch-primary focus:ring-offset-0 w-4 h-4 cursor-pointer"
                    />
                    <label htmlFor="selectAllCards" className="text-xs font-bold text-ch-dark cursor-pointer select-none">
                        Select All Groups
                    </label>
                </div>
                
                <div className="text-xs font-bold text-ch-primary/60 uppercase tracking-widest hidden sm:block">
                    Showing {groupedBriefings.length} cases {displayGroups.length > 1 ? `across ${displayGroups.length} groups` : ''}
                </div>
            </div>

            {/* Visually Grouped Briefings - Compact Table */}
            <div className="bg-white rounded-2xl shadow-sm border border-ch-soft overflow-hidden animate-fade-in-up">
                <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left border-collapse">
                        <thead>
                            <tr className="bg-ch-light/50 border-b border-ch-soft">
                                <th className="w-12 px-4 py-4 text-center">
                                    {/* Column left empty for checkboxes */}
                                </th>
                                <th className="px-4 py-4 text-[10px] font-bold text-ch-primary/70 uppercase tracking-widest cursor-pointer group/sort hover:text-ch-primary transition-colors" onClick={() => onSort && onSort('name')}>
                                    <div className="flex items-center">
                                        Case Details
                                        {renderSortIcon('name')}
                                    </div>
                                </th>
                                <th className="px-4 py-4 text-[10px] font-bold text-ch-primary/70 uppercase tracking-widest w-48">PIC</th>
                                <th className="px-4 py-4 text-[10px] font-bold text-ch-primary/70 uppercase tracking-widest w-40 text-center cursor-pointer group/sort hover:text-ch-primary transition-colors" onClick={() => onSort && onSort('status')}>
                                    <div className="flex items-center justify-center">
                                        Status
                                        {renderSortIcon('status')}
                                    </div>
                                </th>
                                <th className="px-4 py-4 text-[10px] font-bold text-ch-primary/70 uppercase tracking-widest w-24 text-center">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {displayGroups.map((groupData) => (
                                <Fragment key={groupData.groupName}>
                                    {/* Client Subheader */}
                                    {!groupData.hideHeader && (
                                        <tr className="bg-ch-soft/40 border-b border-ch-soft/50 group/header">
                                            <td colSpan="5" className="px-4 py-3">
                                                <div className="flex items-center gap-3">
                                                    <span className="text-xl font-extrabold text-ch-dark tracking-tight">
                                                        {groupData.groupName}
                                                    </span>
                                                    <span className="bg-white text-ch-primary text-[10px] font-bold uppercase tracking-widest px-2.5 py-1 rounded-md shadow-sm border border-ch-soft">
                                                        {groupData.cards.length} {groupData.cards.length === 1 ? 'Case' : 'Cases'}
                                                    </span>
                                                </div>
                                            </td>
                                        </tr>
                                    )}

                                    {/* Case Rows */}
                                    {groupData.cards.map((group) => {
                                        const isSelected = selectedIds.includes(group._id);
                                        return (
                                            <tr 
                                                key={group._id} 
                                                className={`border-b border-ch-soft/40 last:border-0 hover:bg-ch-light/30 transition-colors ${isSelected ? 'bg-ch-primary/5' : ''}`}
                                            >
                                                {/* Checkbox */}
                                                <td className="px-4 py-3 text-center align-middle">
                                                    <input
                                                        type="checkbox"
                                                        checked={isSelected}
                                                        onChange={() => handleSelectOne(group._id)}
                                                        className="rounded border-ch-soft text-ch-primary focus:ring-ch-primary focus:ring-offset-0 w-4 h-4 cursor-pointer shadow-sm transition-transform active:scale-90"
                                                    />
                                                </td>

                                                {/* Case Name */}
                                                <td className="px-4 py-3 align-middle">
                                                    <div className="flex flex-col gap-0.5">
                                                        {sortBy !== 'name' && (
                                                            <span className="text-[10px] font-extrabold text-ch-primary/50 uppercase tracking-widest truncate" title={group.clientName}>
                                                                {group.clientName}
                                                            </span>
                                                        )}
                                                        <span className="text-sm font-bold text-ch-dark line-clamp-2" title={group.caseName}>
                                                            {group.caseName}
                                                        </span>
                                                        {group.allIds.length > 1 && (
                                                            <span className="text-[10px] font-bold text-ch-primary bg-ch-primary/10 px-2 py-0.5 rounded w-max mt-1">
                                                                {group.allIds.length} Entries Merged
                                                            </span>
                                                        )}
                                                    </div>
                                                </td>

                                                {/* PIC */}
                                                <td className="px-4 py-3 align-middle">
                                                    <div className="flex flex-wrap gap-1">
                                                        {group.pic ? group.pic.split(',').map((p, idx) => {
                                                            const picName = p.trim();
                                                            if (!picName) return null;
                                                            return (
                                                                <span key={idx} className="bg-purple-50 text-purple-700 border border-purple-100 px-2 py-0.5 rounded-md text-[10px] font-extrabold uppercase tracking-widest shadow-sm">
                                                                    {picName}
                                                                </span>
                                                            );
                                                        }) : <span className="text-ch-soft">-</span>}
                                                    </div>
                                                </td>

                                                {/* Status Dropdown */}
                                                <td className="px-4 py-3 align-middle text-center">
                                                    <select
                                                        value={group.status || ''}
                                                        onChange={(e) => handleGroupStatusUpdate(group, e.target.value)}
                                                        className={`${getStatusBadgeClass(group.status)} cursor-pointer appearance-none text-center hover:scale-105 transition-transform !py-1.5`}
                                                        title="Click to change status for all merged entries"
                                                    >
                                                        <option value="Pending">Pending</option>
                                                        <option value="Progress">Progress</option>
                                                        <option value="Done">Done</option>
                                                        <option value="Hold">Hold</option>
                                                    </select>
                                                </td>

                                                {/* Actions */}
                                                <td className="px-4 py-3 align-middle text-center">
                                                    <div className="flex items-center justify-center gap-1.5">
                                                        <button
                                                            onClick={() => handleGroupEdit(group)}
                                                            className="p-1.5 text-ch-primary hover:bg-ch-primary hover:text-white rounded-lg transition-all active:scale-95"
                                                            title="Edit Briefing"
                                                        >
                                                            ✏️
                                                        </button>
                                                        <button
                                                            onClick={() => handleGroupDelete(group)}
                                                            className="p-1.5 text-red-400 hover:bg-red-500 hover:text-white rounded-lg transition-all active:scale-95"
                                                            title="Delete Briefing (deletes all merged entries)"
                                                        >
                                                            🗑️
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </Fragment>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
