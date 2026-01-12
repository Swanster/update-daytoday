import { useState, useEffect, useCallback } from 'react';
import { dashboardApi } from '../api/dashboard';
import './Dashboard.css';

const REFRESH_INTERVAL = 30000; // 30 seconds

function Dashboard({ user, onClientClick }) {
    const [stats, setStats] = useState(null);
    const [overdue, setOverdue] = useState([]);
    const [activity, setActivity] = useState([]);
    const [topClients, setTopClients] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [lastUpdated, setLastUpdated] = useState(null);

    const fetchDashboardData = useCallback(async () => {
        try {
            const [statsData, overdueData, activityData, topClientsData] = await Promise.all([
                dashboardApi.getStats(),
                dashboardApi.getOverdue(),
                dashboardApi.getActivity(),
                dashboardApi.getTopClients()
            ]);
            setStats(statsData);
            setOverdue(overdueData);
            setActivity(activityData);
            setTopClients(topClientsData);
            setLastUpdated(new Date());
            setError(null);
        } catch (err) {
            console.error('Dashboard fetch error:', err);
            setError('Failed to load dashboard data');
        } finally {
            setLoading(false);
        }
    }, []);

    // Initial fetch and auto-refresh
    useEffect(() => {
        fetchDashboardData();

        const interval = setInterval(() => {
            fetchDashboardData();
        }, REFRESH_INTERVAL);

        return () => clearInterval(interval);
    }, [fetchDashboardData]);

    const formatDate = (dateString) => {
        if (!dateString) return '-';
        return new Date(dateString).toLocaleDateString('en-GB', {
            day: '2-digit',
            month: 'short',
            year: 'numeric'
        });
    };

    const formatTime = (dateString) => {
        if (!dateString) return '-';
        return new Date(dateString).toLocaleTimeString('en-GB', {
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    const getUrgencyClass = (daysOverdue) => {
        if (daysOverdue >= 7) return 'critical';
        if (daysOverdue >= 3) return 'warning';
        return 'caution';
    };

    if (loading) {
        return (
            <div className="dashboard-loading">
                <div className="loading-spinner"></div>
                <p>Loading dashboard...</p>
            </div>
        );
    }

    if (error) {
        return (
            <div className="dashboard-error">
                <div className="error-icon">⚠️</div>
                <h3>Error Loading Dashboard</h3>
                <p>{error}</p>
                <button className="btn btn-primary" onClick={fetchDashboardData}>
                    Retry
                </button>
            </div>
        );
    }

    return (
        <div className="dashboard">
            {/* Dashboard Header */}
            <div className="dashboard-header">
                <h2>📊 Dashboard Overview</h2>
                <div className="dashboard-meta">
                    {lastUpdated && (
                        <span className="last-updated">
                            🔄 Last updated: {formatTime(lastUpdated)}
                        </span>
                    )}
                    <span className="auto-refresh-indicator">
                        Auto-refresh: 30s
                    </span>
                </div>
            </div>

            {/* Stats Cards */}
            <div className="stats-grid">
                <div className="stat-card active-projects">
                    <div className="stat-icon">📁</div>
                    <div className="stat-content">
                        <div className="stat-value">{stats?.activeProjects || 0}</div>
                        <div className="stat-label">Active Projects</div>
                    </div>
                </div>

                <div className="stat-card completed">
                    <div className="stat-icon">✅</div>
                    <div className="stat-content">
                        <div className="stat-value">{stats?.completedThisQuarter || 0}</div>
                        <div className="stat-label">Completed ({stats?.currentQuarter})</div>
                    </div>
                </div>

                <div className="stat-card daily">
                    <div className="stat-icon">📅</div>
                    <div className="stat-content">
                        <div className="stat-value">{stats?.dailiesThisMonth || 0}</div>
                        <div className="stat-label">Daily This Month</div>
                    </div>
                </div>

                <div className="stat-card on-hold">
                    <div className="stat-icon">⏸️</div>
                    <div className="stat-content">
                        <div className="stat-value">{stats?.onHold || 0}</div>
                        <div className="stat-label">On Hold</div>
                    </div>
                </div>

                <div className={`stat-card overdue ${(stats?.overdueTotal || 0) > 0 ? 'has-overdue' : ''}`}>
                    <div className="stat-icon">⚠️</div>
                    <div className="stat-content">
                        <div className="stat-value">{stats?.overdueTotal || 0}</div>
                        <div className="stat-label">Overdue Items</div>
                    </div>
                </div>

                {stats?.pendingUsers > 0 && (
                    <div className="stat-card pending-users">
                        <div className="stat-icon">👥</div>
                        <div className="stat-content">
                            <div className="stat-value">{stats.pendingUsers}</div>
                            <div className="stat-label">Pending Approvals</div>
                        </div>
                    </div>
                )}
            </div>

            {/* Main Content Grid */}
            <div className="dashboard-content">
                {/* Overdue Items Section */}
                <div className="dashboard-section overdue-section">
                    <div className="section-header">
                        <h3>⚠️ Overdue Items</h3>
                        <span className="section-count">{overdue.length} items</span>
                    </div>
                    {overdue.length === 0 ? (
                        <div className="empty-section">
                            <span className="empty-icon">🎉</span>
                            <p>No overdue items! Great job keeping on track.</p>
                        </div>
                    ) : (
                        <div className="overdue-table-container">
                            <table className="overdue-table">
                                <thead>
                                    <tr>
                                        <th>Type</th>
                                        <th>Name</th>
                                        <th>Due Date</th>
                                        <th>Days Overdue</th>
                                        <th>Status</th>
                                        <th>PIC Team</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {overdue.map((item) => (
                                        <tr key={item._id} className={`urgency-${getUrgencyClass(item.daysOverdue)}`}>
                                            <td>
                                                <span className={`type-badge ${item.type}`}>
                                                    {item.type === 'project' ? '📋 Project' : '📅 Daily'}
                                                </span>
                                            </td>
                                            <td className="item-name">{item.name}</td>
                                            <td>{formatDate(item.dueDate)}</td>
                                            <td>
                                                <span className={`days-badge ${getUrgencyClass(item.daysOverdue)}`}>
                                                    {item.daysOverdue} days
                                                </span>
                                            </td>
                                            <td>
                                                <span className={`status-badge ${item.status?.toLowerCase()}`}>
                                                    {item.status || '-'}
                                                </span>
                                            </td>
                                            <td>
                                                <div className="pic-tags">
                                                    {item.picTeam?.slice(0, 2).map((pic, idx) => (
                                                        <span key={idx} className="pic-tag">{pic}</span>
                                                    ))}
                                                    {item.picTeam?.length > 2 && (
                                                        <span className="pic-tag more">+{item.picTeam.length - 2}</span>
                                                    )}
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>

                {/* Recent Activity Section */}
                <div className="dashboard-section activity-section">
                    <div className="section-header">
                        <h3>📋 Recent Activity</h3>
                    </div>
                    {activity.length === 0 ? (
                        <div className="empty-section">
                            <span className="empty-icon">📭</span>
                            <p>No recent activity</p>
                        </div>
                    ) : (
                        <div className="activity-list">
                            {activity.map((log) => (
                                <div key={log._id} className="activity-item">
                                    <div className="activity-icon">
                                        {log.action === 'CREATE' && '➕'}
                                        {log.action === 'UPDATE' && '✏️'}
                                        {log.action === 'DELETE' && '🗑️'}
                                        {log.action === 'LOGIN' && '🔑'}
                                        {log.action === 'REGISTER' && '👤'}
                                        {!['CREATE', 'UPDATE', 'DELETE', 'LOGIN', 'REGISTER'].includes(log.action) && '📝'}
                                    </div>
                                    <div className="activity-content">
                                        <div className="activity-text">
                                            <strong>{log.username}</strong> {log.details}
                                        </div>
                                        <div className="activity-time">
                                            {formatDate(log.createdAt)} at {formatTime(log.createdAt)}
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            {/* Top Clients Section */}
            <div className="dashboard-section top-clients-section">
                <div className="section-header">
                    <h3>🏆 Most Troubleshooted Clients</h3>
                    <span className="section-count">Top 10</span>
                </div>
                {topClients.length === 0 ? (
                    <div className="empty-section">
                        <span className="empty-icon">📊</span>
                        <p>No client data available</p>
                    </div>
                ) : (
                    <div className="top-clients-container">
                        <table className="top-clients-table">
                            <thead>
                                <tr>
                                    <th>#</th>
                                    <th>Client Name</th>
                                    <th>Total</th>
                                    <th>Open</th>
                                    <th>Resolved</th>
                                    <th>Onsite</th>
                                    <th>Remote</th>
                                    <th>Last Activity</th>
                                </tr>
                            </thead>
                            <tbody>
                                {topClients.map((client, index) => (
                                    <tr key={client.clientName} className={index < 3 ? 'top-rank' : ''}>
                                        <td className="rank-cell">
                                            {index === 0 && '🥇'}
                                            {index === 1 && '🥈'}
                                            {index === 2 && '🥉'}
                                            {index > 2 && <span className="rank-number">{index + 1}</span>}
                                        </td>
                                        <td className="client-name clickable" onClick={() => onClientClick && onClientClick(client.clientName)}>
                                            {client.clientName}
                                        </td>
                                        <td>
                                            <span className="count-badge total">{client.totalEntries}</span>
                                        </td>
                                        <td>
                                            <span className={`count-badge open ${client.openIssues > 0 ? 'has-open' : ''}`}>
                                                {client.openIssues}
                                            </span>
                                        </td>
                                        <td>
                                            <span className="count-badge resolved">{client.resolvedIssues}</span>
                                        </td>
                                        <td>
                                            <span className="action-badge onsite">{client.onsiteCount}</span>
                                        </td>
                                        <td>
                                            <span className="action-badge remote">{client.remoteCount}</span>
                                        </td>
                                        <td className="last-activity">{formatDate(client.lastActivity)}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </div>
    );
}

export default Dashboard;
