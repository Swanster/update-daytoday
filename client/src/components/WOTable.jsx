import React, { useState, useRef, useEffect } from 'react';
import StatusCell from './StatusCell';

export default function WOTable({ workOrders, onEdit, onDelete, selectedIds = [], onSelectionChange, onBatchStatusUpdate, onStatusUpdate }) {
    const [expandedId, setExpandedId] = useState(null);
    
    // Check if all are selected
    const allSelected = workOrders.length > 0 && selectedIds.length === workOrders.length;
    const someSelected = selectedIds.length > 0 && selectedIds.length < workOrders.length;

    // Handle select all
     const handleSelectAll = () => {
        if (allSelected) {
            onSelectionChange([]);
        } else {
            onSelectionChange(workOrders.map(w => w._id));
        }
    };

    // Handle individual select
    const handleSelectOne = (id) => {
        if (selectedIds.includes(id)) {
            onSelectionChange(selectedIds.filter(i => i !== id));
        } else {
            onSelectionChange([...selectedIds, id]);
        }
    };

    const formatDate = (dateString) => {
        if (!dateString) return '-';
        return new Date(dateString).toLocaleDateString('en-GB', {
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

    if (workOrders.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center p-12 text-center text-ch-primary bg-white/95 rounded-2xl shadow-custom border border-ch-soft mb-6">
                <div className="text-5xl mb-4 opacity-40">📋</div>
                <h3 className="text-xl font-extrabold text-ch-dark mb-2">No Work Orders Yet</h3>
                <p className="font-medium">Click "Add Entry" to create your first work order.</p>
            </div>
        );
    }

    const [groupMode, setGroupMode] = useState('client'); // 'none', 'client', 'status'

    // Group work orders
    const groupedData = {};

    if (groupMode === 'client') {
        workOrders.forEach(wo => {
            const groupKey = wo.clientName || 'Unknown';
            if (!groupedData[groupKey]) {
                groupedData[groupKey] = [];
            }
            groupedData[groupKey].push(wo);
        });
    } else if (groupMode === 'status') {
        workOrders.forEach(wo => {
            const groupKey = wo.clientStatus || 'Unknown Status';
            if (!groupedData[groupKey]) {
                groupedData[groupKey] = [];
            }
            groupedData[groupKey].push(wo);
        });
    }

    const groupKeys = Object.keys(groupedData).sort();
    const paginatedClientNames = groupMode !== 'none' ? groupKeys : [];
    const paginatedWorkOrders = groupMode === 'none' ? workOrders : [];

    const renderRows = (orders) => {
        return orders.map((wo, index) => (
            <tr key={wo._id} className={`hover:bg-ch-soft/80 transition-colors duration-300 group relative ${selectedIds.includes(wo._id) ? 'bg-ch-soft/60' : (index % 2 === 0 && groupMode === 'none' ? 'bg-white' : 'bg-ch-light/50')}`}>
                {/* Selection Highlight bar on left */}
                {selectedIds.includes(wo._id) && (
                    <td className="absolute left-0 top-0 bottom-0 w-1 bg-ch-primary rounded-r z-10 pointer-events-none"></td>
                )}
                <td className="px-5 py-3 border-r border-ch-soft/50 relative z-10">
                    <input
                        type="checkbox"
                        checked={selectedIds.includes(wo._id)}
                        onChange={() => handleSelectOne(wo._id)}
                        className="rounded border-ch-soft text-ch-primary focus:ring-ch-primary focus:ring-offset-0 w-4 h-4 cursor-pointer transition-all"
                    />
                </td>
                <td className="px-5 py-3 text-center text-ch-primary font-bold border-r border-ch-soft/50">{wo.quarterSequence}</td>
                <td className="px-5 py-3 text-center">
                    <span className={`inline-flex items-center px-2 py-1 rounded-md text-[10px] font-bold uppercase tracking-widest border shadow-sm ${
                        wo.clientStatus === 'New Client' 
                            ? 'bg-purple-50 text-purple-700 border-purple-200' 
                            : (wo.clientStatus === 'Existing' ? 'bg-blue-50 text-blue-700 border-blue-200' : 'bg-ch-light text-ch-dark border-ch-soft')
                    }`}>
                        {wo.clientStatus || '-'}
                    </span>
                </td>
                <td className="px-5 py-3 font-extrabold text-ch-dark">{wo.clientName}</td>
                <td className="px-5 py-3 text-ch-dark font-medium text-xs">{wo.sales || '-'}</td>
                <td className="px-5 py-3 text-ch-dark">
                    <span className="bg-ch-soft text-ch-dark px-2 py-0.5 rounded-md text-[10px] font-bold border border-ch-soft hover:bg-ch-soft transition-colors shadow-sm">
                        {wo.services || '-'}
                    </span>
                </td>
                <td className="px-5 py-3 text-ch-dark text-xs font-medium leading-relaxed max-w-sm whitespace-pre-wrap">{wo.detailRequest || '-'}</td>
                <td className="px-5 py-3 whitespace-nowrap text-ch-dark font-medium text-xs font-mono">{formatDate(wo.dueDate)}</td>
                <td className="px-5 py-3 text-ch-dark text-xs text-center border-l border-ch-soft/50">
                    <StatusCell 
                        value={wo.requestBarang} 
                        type="requestBarang" 
                        onUpdate={(val) => onStatusUpdate(wo._id, 'requestBarang', val)}
                    />
                </td>
                <td className="px-5 py-3 text-ch-dark text-xs text-center border-r border-ch-soft/50">
                    <StatusCell 
                        value={wo.requestJasa} 
                        type="requestJasa" 
                        onUpdate={(val) => onStatusUpdate(wo._id, 'requestJasa', val)}
                    />
                </td>
                <td className="px-5 py-3 text-amber-600 text-xs font-medium italic">{wo.keterangan || '-'}</td>
                <td className="px-5 py-3 whitespace-nowrap">
                    <StatusCell 
                        value={wo.status} 
                        type="status" 
                        onUpdate={(val) => onStatusUpdate(wo._id, 'status', val)}
                    />
                </td>
                <td className="px-5 py-3 text-right whitespace-nowrap relative z-10">
                    <div className="flex items-center justify-end gap-2">
                        <button
                            className="p-1.5 text-ch-primary hover:text-ch-primary hover:bg-ch-soft rounded-lg transition-all shadow-sm bg-white border border-ch-soft active:scale-95"
                            onClick={() => onEdit(wo)}
                            title="Edit"
                        >
                            ✏️
                        </button>
                        <button
                            className="p-1.5 text-ch-primary hover:text-red-600 hover:bg-red-50 rounded-lg transition-all shadow-sm bg-white border border-ch-soft active:scale-95"
                            onClick={() => onDelete(wo._id)}
                            title="Delete"
                        >
                            🗑️
                        </button>
                    </div>
                </td>
            </tr>
        ));
    };

    return (
        <div className="flex flex-col gap-4">
             {/* Batch Action Bar & Group Toggle */}
             <div className="flex flex-wrap items-center justify-between gap-4">
                {selectedIds.length > 0 ? (
                    <div className="flex flex-wrap items-center gap-4 bg-ch-soft p-4 rounded-2xl shadow-sm border border-ch-soft animate-slide-up flex-1 sticky top-0 z-20">
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
                ) : (
                    <div className="flex-1"></div>
                )}

                <div className="flex bg-white/50 p-1 rounded-2xl border border-ch-soft shadow-sm overflow-hidden">
                    <button
                        onClick={() => setGroupMode('none')}
                        className={`flex items-center gap-2 px-4 py-2 rounded-xl text-[11px] font-bold transition-all ${
                            groupMode === 'none' 
                                ? 'bg-ch-primary text-white shadow-md' 
                                : 'text-ch-dark hover:bg-ch-light'
                        }`}
                    >
                        <span>📄</span> List
                    </button>
                    <button
                        onClick={() => setGroupMode('client')}
                        className={`flex items-center gap-2 px-4 py-2 rounded-xl text-[11px] font-bold transition-all ${
                            groupMode === 'client' 
                                ? 'bg-ch-primary text-white shadow-md' 
                                : 'text-ch-dark hover:bg-ch-light'
                        }`}
                    >
                        <span>📂</span> By Client
                    </button>
                    <button
                        onClick={() => setGroupMode('status')}
                        className={`flex items-center gap-2 px-4 py-2 rounded-xl text-[11px] font-bold transition-all ${
                            groupMode === 'status' 
                                ? 'bg-ch-primary text-white shadow-md' 
                                : 'text-ch-dark hover:bg-ch-light'
                        }`}
                    >
                        <span>📊</span> By Status
                    </button>
                </div>
             </div>

                <div className="hidden md:block overflow-x-auto bg-white/95 rounded-2xl shadow-custom overflow-hidden border border-ch-soft mt-2">
                    <table className="w-full text-sm text-left border-collapse">
                        <thead className="bg-ch-light text-ch-primary font-bold uppercase text-[10px] tracking-widest sticky top-0 z-10">
                            <tr>
                                <th className="p-4 w-4 border-b border-ch-soft">
                                    <input
                                        type="checkbox"
                                        checked={allSelected}
                                        ref={el => { if (el) el.indeterminate = someSelected; }}
                                        onChange={handleSelectAll}
                                        className="rounded border-ch-soft text-ch-primary focus:ring-ch-primary focus:ring-offset-0 w-4 h-4 cursor-pointer"
                                    />
                                </th>
                                <th className="px-5 py-4 border-b border-ch-soft whitespace-nowrap">No</th>
                                <th className="px-5 py-4 border-b border-ch-soft whitespace-nowrap w-32">Status Client</th>
                                <th className="px-5 py-4 border-b border-ch-soft whitespace-nowrap w-48">Client Name</th>
                                <th className="px-5 py-4 border-b border-ch-soft whitespace-nowrap">Sales</th>
                                <th className="px-5 py-4 border-b border-ch-soft whitespace-nowrap">Services</th>
                                <th className="px-5 py-4 border-b border-ch-soft min-w-[200px]">Detail Request</th>
                                <th className="px-5 py-4 border-b border-ch-soft whitespace-nowrap">Due Date</th>
                                <th className="px-5 py-4 border-b border-ch-soft whitespace-nowrap">Req Barang</th>
                                <th className="px-5 py-4 border-b border-ch-soft whitespace-nowrap">Req Jasa</th>
                                <th className="px-5 py-4 border-b border-ch-soft min-w-[150px]">Keterangan</th>
                                <th className="px-5 py-4 border-b border-ch-soft whitespace-nowrap">Status</th>
                                <th className="px-5 py-4 border-b border-ch-soft whitespace-nowrap text-right">Actions</th>
                            </tr>
                        </thead>
                        
                        {groupMode !== 'none' ? (
                            <tbody className="divide-y divide-ch-soft border-b border-ch-soft">
                                {paginatedClientNames.map((groupKey, index) => (
                                    <React.Fragment key={groupKey}>
                                        <tr className={`${index % 2 === 0 ? 'bg-ch-soft/50' : 'bg-ch-light/50'}`}>
                                            <td colSpan="13" className={`px-5 py-2 font-extrabold text-ch-dark border-l-4 border-ch-primary`}>
                                                {groupKey} <span className="text-ch-primary text-[10px] ml-2 font-bold tracking-widest uppercase bg-white px-2 py-0.5 rounded shadow-sm border border-ch-soft">({groupedData[groupKey].length} orders)</span>
                                            </td>
                                        </tr>
                                        {renderRows(groupedData[groupKey])}
                                    </React.Fragment>
                                ))}
                            </tbody>
                        ) : (
                            <tbody className="divide-y divide-ch-soft border-b border-ch-soft">
                                {paginatedWorkOrders.length === 0 ? (
                                    <tr>
                                        <td colSpan="13" className="px-5 py-8 text-center font-medium text-ch-primary">
                                            No work orders match your search.
                                        </td>
                                    </tr>
                                ) : (
                                    renderRows(paginatedWorkOrders)
                                )}
                            </tbody>
                        )}
                    </table>
                </div>

                <div className="md:hidden flex flex-col gap-4 p-4 bg-ch-light/50">
                    {(groupMode !== 'none' ? paginatedClientNames.flatMap(name => groupedData[name]) : paginatedWorkOrders).map((wo) => (
                        <div key={wo._id} className={`bg-white rounded-2xl shadow-sm border transition-all duration-300 overflow-hidden ${expandedId === wo._id ? 'border-ch-soft shadow-md ring-1 ring-ch-soft/50' : 'border-ch-soft hover:border-ch-soft hover:shadow-md'}`}>
                             {/* Card Header / Preview */}
                             <div 
                                className="p-4 cursor-pointer relative"
                                onClick={() => setExpandedId(expandedId === wo._id ? null : wo._id)}
                            >
                                <div className="flex justify-between items-start gap-4">
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2 mb-1.5">
                                            <span className={`px-2 py-0.5 rounded-md text-[10px] font-extrabold tracking-wider uppercase border shadow-sm ${
                                                wo.clientStatus === 'New Client' 
                                                    ? 'bg-purple-50 text-purple-700 border-purple-200' 
                                                    : (wo.clientStatus === 'Existing' ? 'bg-blue-50 text-blue-700 border-blue-200' : 'bg-ch-light text-ch-dark border-ch-soft')
                                            }`}>
                                                {wo.clientStatus === 'New Client' ? 'New' : 'Ex'}
                                            </span>
                                            <h4 className="font-extrabold text-ch-dark text-sm truncate">{wo.clientName}</h4>
                                        </div>
                                        
                                        {/* Preview: Detail Request (Truncated) */}
                                        <div className="text-xs text-ch-primary flex items-start gap-1.5 mt-2">
                                             <span className="text-ch-primary shrink-0 mt-0.5">📝</span>
                                             <span className="line-clamp-2 font-medium leading-relaxed">
                                                {wo.detailRequest || '-'}
                                             </span>
                                        </div>
                                    </div>

                                    <div className="flex flex-col items-end gap-2 shrink-0">
                                        <div onClick={(e) => e.stopPropagation()}>
                                            <StatusCell 
                                                value={wo.status} 
                                                type="status" 
                                                onUpdate={(val) => onStatusUpdate(wo._id, 'status', val)}
                                            />
                                        </div>
                                    </div>
                                </div>
                                <div className="flex justify-center mt-3 border-t border-ch-light pt-2">
                                    <span className={`text-ch-soft text-[10px] transform transition-transform duration-300 flex items-center justify-center w-6 h-6 rounded-full bg-ch-light ${expandedId === wo._id ? 'rotate-180 bg-ch-soft text-ch-primary' : ''}`}>▼</span>
                                </div>
                            </div>

                            {/* Expanded Details */}
                            {expandedId === wo._id && (
                                <div className="px-5 pb-5 pt-2 border-t border-ch-light bg-ch-light/50 animate-slide-down">
                                    <div className="flex flex-col gap-4 mt-2">
                                        
                                        <div className="flex justify-between text-xs font-bold text-ch-primary">
                                            <span>📅 {formatDate(wo.dueDate)}</span>
                                            <span className="bg-ch-soft text-ch-dark px-2 py-0.5 rounded-md shadow-sm">No: {wo.quarterSequence || '-'}</span>
                                        </div>

                                        <div className="bg-white p-3 rounded-xl border border-ch-soft shadow-sm mt-1">
                                            <span className="text-[10px] font-extrabold text-ch-primary uppercase tracking-widest block mb-2">Full Detail Request</span>
                                            <div className="text-xs text-ch-dark font-medium whitespace-pre-wrap leading-relaxed">
                                                {wo.detailRequest || '-'}
                                            </div>
                                        </div>

                                        <div className="grid grid-cols-2 gap-3 text-xs">
                                            <div className="bg-white p-3 rounded-xl border border-ch-soft shadow-sm">
                                                <span className="text-[10px] font-extrabold text-ch-primary uppercase tracking-widest block mb-2">Service</span>
                                                <span className="text-ch-dark font-bold bg-ch-light px-2 py-1 border border-ch-soft rounded-md inline-block">{wo.services || '-'}</span>
                                            </div>
                                            <div className="bg-white p-3 rounded-xl border border-ch-soft shadow-sm">
                                                <span className="text-[10px] font-extrabold text-ch-primary uppercase tracking-widest block mb-1">Sales</span>
                                                <span className="text-ch-primary font-bold">{wo.sales || '-'}</span>
                                            </div>
                                        </div>

                                        <div className="grid grid-cols-2 gap-3 text-xs mb-1">
                                            <div className="bg-white p-3 rounded-xl border border-ch-soft shadow-sm flex flex-col justify-between">
                                                <span className="text-[10px] font-extrabold text-ch-primary uppercase tracking-widest block mb-2">Req Barang</span>
                                                <div className="self-start">
                                                    <StatusCell 
                                                        value={wo.requestBarang} 
                                                        type="requestBarang" 
                                                        onUpdate={(val) => onStatusUpdate(wo._id, 'requestBarang', val)}
                                                    />
                                                </div>
                                            </div>
                                            <div className="bg-white p-3 rounded-xl border border-ch-soft shadow-sm flex flex-col justify-between">
                                                <span className="text-[10px] font-extrabold text-ch-primary uppercase tracking-widest block mb-2">Req Jasa</span>
                                                <div className="self-start">
                                                    <StatusCell 
                                                        value={wo.requestJasa} 
                                                        type="requestJasa" 
                                                        onUpdate={(val) => onStatusUpdate(wo._id, 'requestJasa', val)}
                                                    />
                                                </div>
                                            </div>
                                        </div>
                                        
                                        {wo.keterangan && (
                                            <div className="bg-amber-50 p-3 rounded-xl border border-amber-100 shadow-sm">
                                                <span className="text-[10px] font-extrabold text-amber-600 uppercase tracking-widest block mb-2">Keterangan</span>
                                                <span className="text-xs text-amber-800 font-medium italic">{wo.keterangan}</span>
                                            </div>
                                        )}

                                        <div className="flex gap-2 mt-2 pt-4 border-t border-ch-soft">
                                             <button
                                                className="flex-1 py-2 bg-white text-ch-dark border border-ch-soft rounded-xl text-[11px] font-bold hover:text-ch-primary hover:bg-ch-light transition-all shadow-sm active:scale-95 flex items-center justify-center gap-1.5"
                                                onClick={(e) => { e.stopPropagation(); onEdit(wo); }}
                                            >
                                                ✏️ Edit
                                            </button>
                                            <button
                                                className="flex-1 py-2 bg-white text-ch-primary border border-ch-soft rounded-xl text-[11px] font-bold hover:text-red-600 hover:bg-red-50 transition-all shadow-sm active:scale-95 flex items-center justify-center gap-1.5"
                                                onClick={(e) => { e.stopPropagation(); onDelete(wo._id); }}
                                            >
                                                🗑️ Delete
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    ))}
                </div>

        </div>
    );
}
