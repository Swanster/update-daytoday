import { useMemo } from 'react';

export default function SpreadsheetTable({ projects, onEdit, onDelete }) {
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
            <table className="spreadsheet-table">
                <thead>
                    <tr>
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
                            <tr key={entry._id} className={projectColorClass}>
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
