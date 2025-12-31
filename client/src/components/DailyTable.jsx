import { useMemo } from 'react';

export default function DailyTable({ dailies, onEdit, onDelete }) {
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

    let rowNumber = 0;
    const clientNames = Object.keys(groupedDailies);

    return (
        <div className="spreadsheet-container">
            <table className="spreadsheet-table daily-table">
                <thead>
                    <tr>
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
                        rowNumber++;
                        // Alternate colors by CLIENT, not by row
                        const clientColorClass = clientIndex % 2 === 0 ? 'project-row-cream' : 'project-row-green';

                        return clientEntries.map((entry, entryIndex) => (
                            <tr key={entry._id} className={clientColorClass}>
                                {/* Row Number - only show on first entry of group */}
                                {entryIndex === 0 && (
                                    <td
                                        rowSpan={clientEntries.length}
                                        className="row-number-cell"
                                    >
                                        {rowNumber}
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

                                {/* Services */}
                                <td>{entry.services || '-'}</td>

                                {/* Case & Issue */}
                                <td>
                                    <div className="progress-text">
                                        {entry.caseIssue || '-'}
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
        </div>
    );
}
