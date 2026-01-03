import { useMemo, useState } from 'react';
import AttachmentViewer from './AttachmentViewer';

export default function SpreadsheetTable({ projects, onEdit, onDelete, selectedIds = [], onSelectionChange, onBatchStatusUpdate }) {
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
        const statusLower = status.toLowerCase().replace(/\s+/g, '-');
        return `status-badge ${statusLower}`;
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
            <div className="spreadsheet-container">
                <div className="empty-state">
                    <div className="empty-state-icon">📋</div>
                    <h3>No Projects Yet</h3>
                    <p>Click the "Add Entry" button to create your first project entry.</p>
                </div>
            </div>
        );
    }

    let rowNumber = 0;
    const projectNames = Object.keys(groupedProjects);

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

            <table className="spreadsheet-table">
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
                        <th>Survey Project<br />(Name Client)</th>
                        <th>Service</th>
                        <th>Report Survey</th>
                        <th>WO</th>
                        <th>Material</th>
                        <th>Due Date</th>
                        <th>Date</th>
                        <th>PIC TIM</th>
                        <th>Progress</th>
                        <th>Status</th>
                        <th>Actions</th>
                    </tr>
                </thead>
                <tbody>
                    {projectNames.map((projectName, projectIndex) => {
                        const projectEntries = groupedProjects[projectName];
                        rowNumber++;
                        // Alternate colors by PROJECT, not by row
                        const projectColorClass = projectIndex % 2 === 0 ? 'project-row-cream' : 'project-row-green';

                        return projectEntries.map((entry, entryIndex) => (
                            <tr
                                key={entry._id}
                                className={`${projectColorClass} ${selectedIds.includes(entry._id) ? 'row-selected' : ''}`}
                            >
                                {/* Checkbox */}
                                <td className="checkbox-cell">
                                    <input
                                        type="checkbox"
                                        checked={selectedIds.includes(entry._id)}
                                        onChange={() => handleSelectOne(entry._id)}
                                    />
                                </td>

                                {/* Row Number - only show on first entry of group */}
                                {entryIndex === 0 && (
                                    <td
                                        rowSpan={projectEntries.length}
                                        className="row-number-cell"
                                    >
                                        {rowNumber}
                                    </td>
                                )}

                                {/* Project Name - merged for same projects */}
                                {entryIndex === 0 && (
                                    <td
                                        className={`project-name-cell ${projectEntries.length > 1 ? 'merged' : ''}`}
                                        rowSpan={projectEntries.length}
                                    >
                                        {projectName}
                                    </td>
                                )}

                                {/* Services */}
                                <td>{entry.services || '-'}</td>

                                {/* Report Survey */}
                                <td>
                                    {entry.reportSurvey && (
                                        <span className={getStatusBadgeClass(entry.reportSurvey)}>
                                            {entry.reportSurvey}
                                        </span>
                                    )}
                                    {!entry.reportSurvey && '-'}
                                </td>

                                {/* WO */}
                                <td>
                                    {entry.wo && (
                                        <span className={getStatusBadgeClass(entry.wo)}>
                                            {entry.wo}
                                        </span>
                                    )}
                                    {!entry.wo && '-'}
                                </td>

                                {/* Material */}
                                <td>
                                    {entry.material && (
                                        <span className={getStatusBadgeClass(entry.material)}>
                                            {entry.material}
                                        </span>
                                    )}
                                    {!entry.material && '-'}
                                </td>

                                {/* Due Date */}
                                <td>{formatDate(entry.dueDate)}</td>

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

                                {/* Progress */}
                                <td>
                                    <div className="progress-text">
                                        {entry.progress ? (
                                            entry.progress.split('\n').map((line, idx) => (
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
                entryName={viewingAttachments?.projectName || ''}
            />
        </div>
    );
}
