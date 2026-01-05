import { useMemo, useState } from 'react';
import AttachmentViewer from './AttachmentViewer';

export default function DailyTable({ dailies, onEdit, onDelete, selectedIds = [], onSelectionChange, onBatchStatusUpdate }) {
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
        const statusLower = status.toLowerCase().replace(/\s+/g, '-');
        return `status-badge ${statusLower}`;
    };

    const getActionBadgeClass = (action) => {
        if (!action) return '';
        return `status-badge ${action.toLowerCase()}`;
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
            <div className="spreadsheet-container">
                <div className="empty-state">
                    <div className="empty-state-icon">📋</div>
                    <h3>No Daily Entries Yet</h3>
                    <p>Click the "Add Entry" button to create your first daily entry.</p>
                </div>
            </div>
        );
    }

    const clientNames = Object.keys(groupedDailies);

    return (
        <div className="spreadsheet-container">
            {/* Batch Action Bar */}
            {selectedIds.length > 0 && (
                <div className="batch-action-bar">
                    <span className="selected-count">{selectedIds.length} selected</span>
                    <div className="batch-buttons">
                        <span className="batch-label">Set Status:</span>
                        <button
                            className="batch-btn batch-done"
                            onClick={() => onBatchStatusUpdate('Done')}
                        >
                            ✓ Done
                        </button>
                        <button
                            className="batch-btn batch-progress"
                            onClick={() => onBatchStatusUpdate('Progress')}
                        >
                            ⏳ Progress
                        </button>
                        <button
                            className="batch-btn batch-hold"
                            onClick={() => onBatchStatusUpdate('Hold')}
                        >
                            ⏸ Hold
                        </button>
                    </div>
                    <button
                        className="batch-btn batch-clear"
                        onClick={() => onSelectionChange([])}
                    >
                        ✕ Clear
                    </button>
                </div>
            )}

            <table className="spreadsheet-table daily-table">
                <thead>
                    <tr>
                        <th className="checkbox-cell">
                            <input
                                type="checkbox"
                                checked={allSelected}
                                ref={el => { if (el) el.indeterminate = someSelected; }}
                                onChange={handleSelectAll}
                                title="Select all"
                            />
                        </th>
                        <th>No</th>
                        <th>Client Name</th>
                        <th>Services</th>
                        <th>Case & Issue</th>
                        <th>Action</th>
                        <th>Date</th>
                        <th>PIC Team</th>
                        <th>Detail Action</th>
                        <th>Status</th>
                        <th>Actions</th>
                    </tr>
                </thead>
                <tbody>
                    {clientNames.map((clientName, clientIndex) => {
                        const clientEntries = groupedDailies[clientName];
                        // Alternate colors by CLIENT, not by row
                        const clientColorClass = clientIndex % 2 === 0 ? 'project-row-cream' : 'project-row-green';

                        return clientEntries.map((entry, entryIndex) => (
                            <tr
                                key={entry._id}
                                className={`${clientColorClass} ${selectedIds.includes(entry._id) ? 'row-selected' : ''}`}
                            >
                                {/* Checkbox */}
                                <td className="checkbox-cell">
                                    <input
                                        type="checkbox"
                                        checked={selectedIds.includes(entry._id)}
                                        onChange={() => handleSelectOne(entry._id)}
                                    />
                                </td>

                                {/* Row Number - only show on first entry of group, using quarterSequence */}
                                {entryIndex === 0 && (
                                    <td
                                        rowSpan={clientEntries.length}
                                        className="row-number-cell"
                                    >
                                        {entry.quarterSequence || '-'}
                                    </td>
                                )}

                                {/* Client Name - merged for same clients */}
                                {entryIndex === 0 && (
                                    <td
                                        className={`project-name-cell ${clientEntries.length > 1 ? 'merged' : ''}`}
                                        rowSpan={clientEntries.length}
                                    >
                                        {clientName}
                                    </td>
                                )}

                                {/* Services/Categories */}
                                <td>
                                    <div className="category-tags">
                                        {entry.services && entry.services.length > 0 ? (
                                            (Array.isArray(entry.services) ? entry.services : [entry.services]).map((cat, idx) => (
                                                <span key={idx} className="category-badge">{cat}</span>
                                            ))
                                        ) : '-'}
                                    </div>
                                </td>

                                {/* Case & Issue */}
                                <td>
                                    <div className="category-tags">
                                        {entry.caseIssue && (Array.isArray(entry.caseIssue) ? entry.caseIssue.length > 0 : entry.caseIssue) ? (
                                            (Array.isArray(entry.caseIssue) ? entry.caseIssue : [entry.caseIssue]).map((ct, idx) => (
                                                <span key={idx} className="category-badge">{ct}</span>
                                            ))
                                        ) : '-'}
                                    </div>
                                </td>

                                {/* Action */}
                                <td>
                                    {entry.action && (
                                        <span className={getActionBadgeClass(entry.action)}>
                                            {entry.action}
                                        </span>
                                    )}
                                    {!entry.action && '-'}
                                </td>

                                {/* Date */}
                                <td>{formatDate(entry.date)}</td>

                                {/* PIC Team */}
                                <td>
                                    <div className="pic-tags">
                                        {entry.picTeam && entry.picTeam.length > 0 ? (
                                            entry.picTeam.map((member, idx) => (
                                                <span key={idx} className="pic-tag">{member}</span>
                                            ))
                                        ) : '-'}
                                    </div>
                                </td>

                                {/* Detail Action */}
                                <td>
                                    <div className="progress-text">
                                        {entry.detailAction ? (
                                            entry.detailAction.split('\n').map((line, idx) => (
                                                <div key={idx}>- {line}</div>
                                            ))
                                        ) : '-'}
                                    </div>
                                </td>

                                {/* Status */}
                                <td>
                                    {entry.status && (
                                        <span className={getStatusBadgeClass(entry.status)}>
                                            {entry.status}
                                        </span>
                                    )}
                                    {!entry.status && '-'}
                                </td>

                                {/* Actions */}
                                <td>
                                    <div className="action-buttons">
                                        {entry.attachments && entry.attachments.length > 0 && (
                                            <button
                                                className="attachment-indicator"
                                                title={`${entry.attachments.length} file(s) attached - Click to view`}
                                                onClick={() => setViewingAttachments(entry)}
                                            >
                                                📎{entry.attachments.length}
                                            </button>
                                        )}
                                        <button
                                            className="action-btn edit"
                                            onClick={() => onEdit(entry)}
                                            title="Edit"
                                        >
                                            ✏️
                                        </button>
                                        <button
                                            className="action-btn delete"
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
