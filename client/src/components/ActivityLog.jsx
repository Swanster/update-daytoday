import { useState, useEffect } from 'react';
import { activityLogsApi } from '../api/auth';

export default function ActivityLog({ token, isOpen, onClose }) {
    const [logs, setLogs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState('ALL');

    useEffect(() => {
        if (isOpen && token) {
            fetchLogs();
        }
    }, [isOpen, token, filter]);

    const fetchLogs = async () => {
        setLoading(true);
        try {
            const entityType = filter === 'ALL' ? null : filter;
            const data = await activityLogsApi.getAll(token, 1, 100, entityType);
            setLogs(data.logs);
        } catch (error) {
            console.error('Error fetching logs:', error);
        } finally {
            setLoading(false);
        }
    };

    const formatDate = (dateString) => {
        const date = new Date(dateString);
        return date.toLocaleString('en-GB', {
            day: 'numeric',
            month: 'short',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    const getActionBadge = (action) => {
        const colors = {
            CREATE: 'done',
            UPDATE: 'progress',
            DELETE: 'hold',
            LOGIN: 'remote',
            LOGOUT: 'logistic',
            REGISTER: 'done'
        };
        return `status-badge ${colors[action] || ''}`;
    };

    const getActionIcon = (action) => {
        const icons = {
            CREATE: '➕',
            UPDATE: '✏️',
            DELETE: '🗑️',
            LOGIN: '🔓',
            LOGOUT: '🔒',
            REGISTER: '👤'
        };
        return icons[action] || '📝';
    };

    if (!isOpen) return null;

    return (
        <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
            <div className="modal-content activity-log-modal">
                <div className="modal-header">
                    <h2>📋 Activity Log</h2>
                    <button className="modal-close" onClick={onClose}>&times;</button>
                </div>

                <div className="modal-body">
                    <div className="activity-filters">
                        <button
                            className={`filter-btn ${filter === 'ALL' ? 'active' : ''}`}
                            onClick={() => setFilter('ALL')}
                        >
                            All
                        </button>
                        <button
                            className={`filter-btn ${filter === 'PROJECT' ? 'active' : ''}`}
                            onClick={() => setFilter('PROJECT')}
                        >
                            Projects
                        </button>
                        <button
                            className={`filter-btn ${filter === 'DAILY' ? 'active' : ''}`}
                            onClick={() => setFilter('DAILY')}
                        >
                            Daily
                        </button>
                        <button
                            className={`filter-btn ${filter === 'USER' ? 'active' : ''}`}
                            onClick={() => setFilter('USER')}
                        >
                            Users
                        </button>
                    </div>

                    {loading ? (
                        <div className="loading">
                            <div className="loading-spinner"></div>
                        </div>
                    ) : logs.length === 0 ? (
                        <div className="empty-state">
                            <div className="empty-state-icon">📜</div>
                            <h3>No Activity Yet</h3>
                            <p>Activity logs will appear here when actions are performed.</p>
                        </div>
                    ) : (
                        <div className="activity-list">
                            {logs.map((log) => (
                                <div key={log._id} className="activity-item">
                                    <div className="activity-icon">{getActionIcon(log.action)}</div>
                                    <div className="activity-content">
                                        <div className="activity-header">
                                            <span className={getActionBadge(log.action)}>{log.action}</span>
                                            <span className="activity-entity">{log.entityType}</span>
                                        </div>
                                        <div className="activity-details">
                                            <strong>{log.username}</strong> {log.details}
                                            {log.entityName && <span className="entity-name"> - {log.entityName}</span>}
                                        </div>
                                        <div className="activity-time">{formatDate(log.createdAt)}</div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
