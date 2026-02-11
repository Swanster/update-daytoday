import { useState, useRef, useEffect } from 'react';
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
        const baseClasses = "inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border";
        const statusLower = status.toLowerCase();
        
        if (statusLower.includes('done') || statusLower.includes('complete')) {
            return baseClasses + " bg-green-100 text-green-800 border-green-200";
        } else if (statusLower.includes('progress')) {
            return baseClasses + " bg-blue-100 text-blue-800 border-blue-200";
        } else if (statusLower.includes('hold')) {
            return baseClasses + " bg-orange-100 text-orange-800 border-orange-200";
        } else {
            return baseClasses + " bg-gray-100 text-gray-800 border-gray-200";
        }
    };

    if (workOrders.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center p-12 text-center text-gray-400 bg-white rounded-xl shadow-custom border border-gray-100">
                <div className="text-4xl mb-4 opacity-50">📋</div>
                <h3 className="text-xl font-bold text-gray-700 mb-2">No Work Orders Yet</h3>
                <p>Click "Add Entry" to create your first work order.</p>
            </div>
        );
    }

    const [isGrouped, setIsGrouped] = useState(true);

    // Group work orders
    const groupedWOs = {
        'New Client': [],
        'Existing': [],
        'Other': []
    };

    if (isGrouped) {
        workOrders.forEach(wo => {
            const status = wo.clientStatus === 'New Client' ? 'New Client' : (wo.clientStatus === 'Existing' ? 'Existing' : 'Other');
            groupedWOs[status].push(wo);
        });
    }

    const renderRows = (orders) => {
        return orders.map((wo, index) => (
            <tr key={wo._id} className={`hover:bg-gray-50 transition-colors ${selectedIds.includes(wo._id) ? 'bg-blue-50/50' : (index % 2 === 0 && !isGrouped ? 'bg-white' : 'bg-gray-50')}`}>
                <td className="px-4 py-3 border-r border-gray-100/50">
                    <input
                        type="checkbox"
                        checked={selectedIds.includes(wo._id)}
                        onChange={() => handleSelectOne(wo._id)}
                        className="rounded border-gray-300 text-accent-coral focus:ring-accent-coral"
                    />
                </td>
                <td className="px-4 py-3 text-center text-gray-400 font-medium">{wo.quarterSequence}</td>
                <td className="px-4 py-3 text-center">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${
                        wo.clientStatus === 'New Client' 
                            ? 'bg-purple-100 text-purple-800 border-purple-200' 
                            : (wo.clientStatus === 'Existing' ? 'bg-blue-100 text-blue-800 border-blue-200' : 'bg-gray-100 text-gray-800 border-gray-200')
                    }`}>
                        {wo.clientStatus || '-'}
                    </span>
                </td>
                <td className="px-4 py-3 font-semibold text-gray-800">{wo.clientName}</td>
                <td className="px-4 py-3 text-gray-600">{wo.sales || '-'}</td>
                <td className="px-4 py-3 text-gray-600">
                    <span className="bg-indigo-50 text-indigo-700 px-2 py-0.5 rounded text-xs font-medium border border-indigo-100">
                        {wo.services || '-'}
                    </span>
                </td>
                <td className="px-4 py-3 text-gray-700 text-xs">{wo.detailRequest || '-'}</td>
                <td className="px-4 py-3 whitespace-nowrap text-gray-600 font-mono text-xs">{formatDate(wo.dueDate)}</td>
                <td className="px-4 py-3 text-gray-600 text-xs text-center">
                    <StatusCell 
                        value={wo.requestBarang} 
                        type="requestBarang" 
                        onUpdate={(val) => onStatusUpdate(wo._id, 'requestBarang', val)}
                    />
                </td>
                <td className="px-4 py-3 text-gray-600 text-xs text-center">
                    <StatusCell 
                        value={wo.requestJasa} 
                        type="requestJasa" 
                        onUpdate={(val) => onStatusUpdate(wo._id, 'requestJasa', val)}
                    />
                </td>
                <td className="px-4 py-3 text-gray-600 text-xs italic">{wo.keterangan || '-'}</td>
                <td className="px-4 py-3 whitespace-nowrap">
                    <StatusCell 
                        value={wo.status} 
                        type="status" 
                        onUpdate={(val) => onStatusUpdate(wo._id, 'status', val)}
                    />
                </td>
                <td className="px-4 py-3 text-right whitespace-nowrap">
                    <div className="flex items-center justify-end gap-1">
                        <button
                            className="p-1.5 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                            onClick={() => onEdit(wo)}
                            title="Edit"
                        >
                            ✏️
                        </button>
                        <button
                            className="p-1.5 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
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
                    <div className="flex flex-wrap items-center gap-4 bg-orange-50 p-3 rounded-xl shadow-sm border border-orange-100 animate-slide-up flex-1">
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
                ) : (
                    <div className="flex-1"></div>
                )}

                <button
                    onClick={() => setIsGrouped(!isGrouped)}
                    className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors border shadow-sm ${
                        isGrouped 
                            ? 'bg-indigo-50 text-indigo-700 border-indigo-200 hover:bg-indigo-100' 
                            : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                    }`}
                >
                    {isGrouped ? (
                        <>
                            <span>📂</span> Grouped by Status
                        </>
                    ) : (
                        <>
                            <span>📄</span> List View
                        </>
                    )}
                </button>
             </div>

                <div className="hidden md:block overflow-x-auto">
                    <table className="w-full text-sm text-left border-collapse">
                        <thead className="bg-gray-50 text-gray-600 font-semibold uppercase text-xs">
                            <tr>
                                <th className="p-4 w-4 border-b border-gray-200">
                                    <input
                                        type="checkbox"
                                        checked={allSelected}
                                        ref={el => { if (el) el.indeterminate = someSelected; }}
                                        onChange={handleSelectAll}
                                        className="rounded border-gray-300 text-accent-coral focus:ring-accent-coral"
                                    />
                                </th>
                                <th className="px-4 py-3 border-b border-gray-200 whitespace-nowrap">No</th>
                                <th className="px-4 py-3 border-b border-gray-200 whitespace-nowrap w-32">Status Client</th>
                                <th className="px-4 py-3 border-b border-gray-200 whitespace-nowrap w-48">Client Name</th>
                                <th className="px-4 py-3 border-b border-gray-200 whitespace-nowrap">Sales</th>
                                <th className="px-4 py-3 border-b border-gray-200 whitespace-nowrap">Services</th>
                                <th className="px-4 py-3 border-b border-gray-200 min-w-[200px]">Detail Request</th>
                                <th className="px-4 py-3 border-b border-gray-200 whitespace-nowrap">Due Date</th>
                                <th className="px-4 py-3 border-b border-gray-200 whitespace-nowrap">Request Barang</th>
                                <th className="px-4 py-3 border-b border-gray-200 whitespace-nowrap">Request Jasa</th>
                                <th className="px-4 py-3 border-b border-gray-200 min-w-[150px]">Keterangan</th>
                                <th className="px-4 py-3 border-b border-gray-200 whitespace-nowrap">Status</th>
                                <th className="px-4 py-3 border-b border-gray-200 whitespace-nowrap text-right">Actions</th>
                            </tr>
                        </thead>
                        
                        {isGrouped ? (
                            <>
                                {groupedWOs['New Client'].length > 0 && (
                                    <tbody className="divide-y divide-gray-100 border-b border-gray-200">
                                        <tr className="bg-purple-50/50">
                                            <td colSpan="13" className="px-4 py-2 font-bold text-purple-800 border-l-4 border-purple-400">
                                                New Client ({groupedWOs['New Client'].length})
                                            </td>
                                        </tr>
                                        {renderRows(groupedWOs['New Client'])}
                                    </tbody>
                                )}
                                {groupedWOs['Existing'].length > 0 && (
                                    <tbody className="divide-y divide-gray-100 border-b border-gray-200">
                                        <tr className="bg-blue-50/50">
                                            <td colSpan="13" className="px-4 py-2 font-bold text-blue-800 border-l-4 border-blue-400">
                                                Existing Client ({groupedWOs['Existing'].length})
                                            </td>
                                        </tr>
                                        {renderRows(groupedWOs['Existing'])}
                                    </tbody>
                                )}
                                {groupedWOs['Other'].length > 0 && (
                                    <tbody className="divide-y divide-gray-100 border-b border-gray-200">
                                        <tr className="bg-gray-50/50">
                                            <td colSpan="13" className="px-4 py-2 font-bold text-gray-700 border-l-4 border-gray-400">
                                                Other ({groupedWOs['Other'].length})
                                            </td>
                                        </tr>
                                        {renderRows(groupedWOs['Other'])}
                                    </tbody>
                                )}
                            </>
                        ) : (
                            <tbody className="divide-y divide-gray-100">
                                {workOrders.length === 0 ? (
                                    <tr>
                                        <td colSpan="13" className="px-4 py-8 text-center text-gray-400">
                                            No work orders match your search.
                                        </td>
                                    </tr>
                                ) : (
                                    renderRows(workOrders)
                                )}
                            </tbody>
                        )}
                    </table>
                </div>

                {/* Mobile Expandable Card View */}
                <div className="md:hidden flex flex-col gap-3 p-4 bg-gray-50/50">
                    {workOrders.map((wo) => (
                        <div key={wo._id} className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                             {/* Card Header / Preview */}
                             <div 
                                className="p-4 cursor-pointer hover:bg-gray-50 transition-colors"
                                onClick={() => setExpandedId(expandedId === wo._id ? null : wo._id)}
                            >
                                <div className="flex justify-between items-start gap-3">
                                    <div className="flex-1">
                                        <div className="flex items-center gap-2 mb-1">
                                            <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold border ${
                                                wo.clientStatus === 'New Client' 
                                                    ? 'bg-purple-50 text-purple-700 border-purple-100' 
                                                    : (wo.clientStatus === 'Existing' ? 'bg-blue-50 text-blue-700 border-blue-100' : 'bg-gray-50 text-gray-600 border-gray-100')
                                            }`}>
                                                {wo.clientStatus === 'New Client' ? 'New' : 'Ex'}
                                            </span>
                                            <h4 className="font-bold text-gray-800 text-sm truncate">{wo.clientName}</h4>
                                        </div>
                                        
                                        {/* Preview: Detail Request (Truncated) */}
                                        <div className="text-xs text-gray-600 flex items-start gap-1">
                                             <span className="text-gray-400 shrink-0">📝</span>
                                             <span className="line-clamp-2 opacity-80">
                                                {wo.detailRequest || '-'}
                                             </span>
                                        </div>
                                    </div>

                                    <div className="flex flex-col items-end gap-1">
                                        <StatusCell 
                                            value={wo.status} 
                                            type="status" 
                                            onUpdate={(val) => onStatusUpdate(wo._id, 'status', val)}
                                        />
                                    </div>
                                </div>
                                <div className="flex justify-center mt-1">
                                    <span className={`text-gray-300 text-[10px] transform transition-transform ${expandedId === wo._id ? 'rotate-180' : ''}`}>▼</span>
                                </div>
                            </div>

                            {/* Expanded Details */}
                            {expandedId === wo._id && (
                                <div className="px-4 pb-4 pt-0 border-t border-gray-50 bg-gray-50/30 animate-slide-down">
                                    <div className="flex flex-col gap-3 mt-3">
                                        
                                        <div className="grid grid-cols-2 gap-2 text-xs">
                                            <div className="bg-white p-2 rounded border border-gray-100">
                                                <span className="text-[10px] font-bold text-gray-500 uppercase block mb-1">No WO</span>
                                                <span className="font-mono text-gray-700">{wo.quarterSequence || '-'}</span>
                                            </div>
                                             <div className="bg-white p-2 rounded border border-gray-100">
                                                <span className="text-[10px] font-bold text-gray-500 uppercase block mb-1">Due Date</span>
                                                <span className="font-mono text-gray-700">{formatDate(wo.dueDate)}</span>
                                            </div>
                                        </div>

                                        <div className="bg-white p-2 rounded border border-gray-100">
                                            <span className="text-[10px] font-bold text-gray-500 uppercase block mb-1">Full Detail Request</span>
                                            <div className="text-xs text-gray-700 whitespace-pre-wrap">
                                                {wo.detailRequest || '-'}
                                            </div>
                                        </div>

                                        <div className="grid grid-cols-2 gap-2 text-xs">
                                            <div className="bg-white p-2 rounded border border-gray-100">
                                                <span className="text-[10px] font-bold text-gray-500 uppercase block mb-1">Service</span>
                                                <span className="text-gray-700">{wo.services || '-'}</span>
                                            </div>
                                            <div className="bg-white p-2 rounded border border-gray-100">
                                                <span className="text-[10px] font-bold text-gray-500 uppercase block mb-1">Sales</span>
                                                <span className="text-gray-700">{wo.sales || '-'}</span>
                                            </div>
                                        </div>

                                        <div className="grid grid-cols-2 gap-2 text-xs">
                                            <div className="bg-white p-2 rounded border border-gray-100 flex flex-col justify-between">
                                                <span className="text-[10px] font-bold text-gray-500 uppercase block mb-1">Req Barang</span>
                                                <div className="self-start">
                                                    <StatusCell 
                                                        value={wo.requestBarang} 
                                                        type="requestBarang" 
                                                        onUpdate={(val) => onStatusUpdate(wo._id, 'requestBarang', val)}
                                                    />
                                                </div>
                                            </div>
                                            <div className="bg-white p-2 rounded border border-gray-100 flex flex-col justify-between">
                                                <span className="text-[10px] font-bold text-gray-500 uppercase block mb-1">Req Jasa</span>
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
                                            <div className="bg-orange-50 p-2 rounded border border-orange-100">
                                                <span className="text-[10px] font-bold text-orange-600 uppercase block mb-1">Keterangan</span>
                                                <span className="text-xs text-orange-800 italic">{wo.keterangan}</span>
                                            </div>
                                        )}

                                        <div className="flex gap-2 mt-2 pt-3 border-t border-gray-100">
                                             <button
                                                className="flex-1 py-2 bg-blue-50 text-blue-600 rounded-lg text-xs font-bold hover:bg-blue-100 transition-colors"
                                                onClick={(e) => { e.stopPropagation(); onEdit(wo); }}
                                            >
                                                ✏️ Edit
                                            </button>
                                            <button
                                                className="flex-1 py-2 bg-red-50 text-red-600 rounded-lg text-xs font-bold hover:bg-red-100 transition-colors"
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
