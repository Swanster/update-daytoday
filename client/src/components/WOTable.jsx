import { useState } from 'react';

export default function WOTable({ workOrders, onEdit, onDelete, selectedIds = [], onSelectionChange, onBatchStatusUpdate }) {
    
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
            return `${baseClasses} bg-green-100 text-green-800 border-green-200`;
        } else if (statusLower.includes('progress')) {
            return `${baseClasses} bg-blue-100 text-blue-800 border-blue-200`;
        } else if (statusLower.includes('hold')) {
            return `${baseClasses} bg-orange-100 text-orange-800 border-orange-200`;
        } else {
            return `${baseClasses} bg-gray-100 text-gray-800 border-gray-200`;
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
                                        className="rounded border-gray-300 text-accent-coral focus:ring-accent-coral"
                                    />
                                </th>
                                <th className="px-4 py-3 border-b border-gray-200 whitespace-nowrap">No</th>
                                <th className="px-4 py-3 border-b border-gray-200 whitespace-nowrap w-48">Client</th>
                                <th className="px-4 py-3 border-b border-gray-200 whitespace-nowrap">Sales</th>
                                <th className="px-4 py-3 border-b border-gray-200 whitespace-nowrap">Services</th>
                                <th className="px-4 py-3 border-b border-gray-200 min-w-[200px]">Detail Request</th>
                                <th className="px-4 py-3 border-b border-gray-200 whitespace-nowrap">Due Date</th>
                                <th className="px-4 py-3 border-b border-gray-200 whitespace-nowrap">Request</th>
                                <th className="px-4 py-3 border-b border-gray-200 whitespace-nowrap">Barang</th>
                                <th className="px-4 py-3 border-b border-gray-200 whitespace-nowrap">Jasa</th>
                                <th className="px-4 py-3 border-b border-gray-200 min-w-[150px]">Keterangan</th>
                                <th className="px-4 py-3 border-b border-gray-200 whitespace-nowrap">Status</th>
                                <th className="px-4 py-3 border-b border-gray-200 whitespace-nowrap text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {workOrders.map((wo, index) => (
                                <tr key={wo._id} className={`hover:bg-gray-50 transition-colors ${selectedIds.includes(wo._id) ? 'bg-blue-50/50' : (index % 2 === 0 ? 'bg-white' : 'bg-gray-50')}`}>
                                    <td className="px-4 py-3 border-r border-gray-100/50">
                                        <input
                                            type="checkbox"
                                            checked={selectedIds.includes(wo._id)}
                                            onChange={() => handleSelectOne(wo._id)}
                                            className="rounded border-gray-300 text-accent-coral focus:ring-accent-coral"
                                        />
                                    </td>
                                    <td className="px-4 py-3 text-center text-gray-400 font-medium">{wo.quarterSequence}</td>
                                    <td className="px-4 py-3 font-semibold text-gray-800">{wo.clientName}</td>
                                    <td className="px-4 py-3 text-gray-600">{wo.sales || '-'}</td>
                                    <td className="px-4 py-3 text-gray-600">
                                        <span className="bg-indigo-50 text-indigo-700 px-2 py-0.5 rounded text-xs font-medium border border-indigo-100">
                                            {wo.services || '-'}
                                        </span>
                                    </td>
                                    <td className="px-4 py-3 text-gray-700 text-xs">{wo.detailRequest || '-'}</td>
                                    <td className="px-4 py-3 whitespace-nowrap text-gray-600 font-mono text-xs">{formatDate(wo.dueDate)}</td>
                                    <td className="px-4 py-3 text-gray-600 text-xs">{wo.request || '-'}</td>
                                    <td className="px-4 py-3 text-gray-600 text-xs">{wo.barang || '-'}</td>
                                    <td className="px-4 py-3 text-gray-600 text-xs">{wo.jasa || '-'}</td>
                                    <td className="px-4 py-3 text-gray-600 text-xs italic">{wo.keterangan || '-'}</td>
                                    <td className="px-4 py-3 whitespace-nowrap">
                                        <span className={getStatusBadgeClass(wo.status)}>
                                            {wo.status}
                                        </span>
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
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
