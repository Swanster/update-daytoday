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
    const [showAddModal, setShowAddModal] = useState(false);
    const [addingProject, setAddingProject] = useState(false);
    const [markingDone, setMarkingDone] = useState(null); // tracks which item is being marked
    const [newProject, setNewProject] = useState({ projectName: '', services: '', picTeam: '', dueDate: '', status: 'Done' });

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

    // Handle marking an item as Done
    const handleMarkDone = async (id, type) => {
        setMarkingDone(id);
        try {
            await dashboardApi.markDone(id, type);
            // Refresh dashboard data
            await fetchDashboardData();
        } catch (err) {
            console.error('Failed to mark as done:', err);
            alert('Failed to mark item as done. Please try again.');
        } finally {
            setMarkingDone(null);
        }
    };

    // Handle quick add project
    const handleQuickAddProject = async (e) => {
        e.preventDefault();
        if (!newProject.projectName.trim()) {
            alert('Project name is required');
            return;
        }

        setAddingProject(true);
        try {
            const projectData = {
                projectName: newProject.projectName.trim(),
                services: newProject.services ? newProject.services.split(',').map(s => s.trim()).filter(s => s) : [],
                picTeam: newProject.picTeam ? newProject.picTeam.split(',').map(s => s.trim()).filter(s => s) : [],
                dueDate: newProject.dueDate || null,
                status: newProject.status || 'Done'
            };
            await dashboardApi.quickAddProject(projectData);
            setShowAddModal(false);
            setNewProject({ projectName: '', services: '', picTeam: '', dueDate: '', status: 'Done' });
            // Refresh dashboard data
            await fetchDashboardData();
        } catch (err) {
            console.error('Failed to add project:', err);
            alert('Failed to add project. Please try again.');
        } finally {
            setAddingProject(false);
        }
    };

    // Handle updating a specific field (Material, Vendor/WO)
    const [updatingField, setUpdatingField] = useState(null);
    
    const handleUpdateField = async (id, field, value) => {
        setUpdatingField(`${id}-${field}`);
        try {
            await dashboardApi.updateField(id, field, value);
            // Refresh dashboard data
            await fetchDashboardData();
        } catch (err) {
            console.error('Failed to update field:', err);
            alert('Failed to update. Please try again.');
        } finally {
            setUpdatingField(null);
        }
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
            {/* Split Row: Progress Projects & Activity */}
            <div className="dashboard-split-row">
                {/* Progress Projects Section */}
                <div className="dashboard-section progress-section">
                    <div className="section-header progress-header">
                        <h3>🚀 Progress Projects</h3>
                        <span className="section-count">{overdue.length} projects</span>
                    </div>
                    {overdue.length === 0 ? (
                        <div className="empty-section">
                            <span className="empty-icon">📋</span>
                            <p>No projects in progress.</p>
                        </div>
                    ) : (
                        <div className="overdue-table-container">
                            <table className="overdue-table progress-table">
                                <thead>
                                    <tr>
                                        <th>Project Name</th>
                                        <th>Due Date</th>
                                        <th>Timeline</th>
                                        <th>Service</th>
                                        <th>Material</th>
                                        <th>Vendor</th>
                                        <th>Action</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {overdue.map((item) => (
                                        <tr key={item._id} className={item.isOverdue ? 'urgency-critical' : ''}>
                                            <td className="item-name">{item.name}</td>
                                            <td>{formatDate(item.dueDate)}</td>
                                            <td>
                                                {item.daysUntilDue !== null ? (
                                                    <span className={`days-badge ${item.isOverdue ? 'critical' : 'on-track'}`}>
                                                        {item.isOverdue 
                                                            ? `⚠️ ${item.daysUntilDue}d overdue`
                                                            : `📅 ${item.daysUntilDue}d left`
                                                        }
                                                    </span>
                                                ) : (
                                                    <span className="days-badge no-date">-</span>
                                                )}
                                            </td>
                                            <td>
                                                <div className="service-tags">
                                                    {Array.isArray(item.services) && item.services.slice(0, 2).map((svc, idx) => (
                                                        <span key={idx} className="service-tag">{svc}</span>
                                                    ))}
                                                    {Array.isArray(item.services) && item.services.length > 2 && (
                                                        <span className="service-tag more">+{item.services.length - 2}</span>
                                                    )}
                                                    {(!Array.isArray(item.services) || item.services.length === 0) && '-'}
                                                </div>
                                            </td>
                                            <td>
                                                {item.material === 'Done Installation' ? (
                                                    <span className="status-done">✓ Done</span>
                                                ) : (
                                                    <button
                                                        className="btn btn-field-done"
                                                        onClick={() => handleUpdateField(item._id, 'material', 'Done Installation')}
                                                        disabled={updatingField === `${item._id}-material`}
                                                    >
                                                        {updatingField === `${item._id}-material` ? '⏳' : '✓ Done'}
                                                    </button>
                                                )}
                                            </td>
                                            <td>
                                                {item.wo === 'Done' ? (
                                                    <span className="status-done">✓ Done</span>
                                                ) : (
                                                    <button
                                                        className="btn btn-field-done"
                                                        onClick={() => handleUpdateField(item._id, 'wo', 'Done')}
                                                        disabled={updatingField === `${item._id}-wo`}
                                                    >
                                                        {updatingField === `${item._id}-wo` ? '⏳' : '✓ Done'}
                                                    </button>
                                                )}
                                            </td>
                                            <td>
                                                <button
                                                    className="btn btn-mark-done"
                                                    onClick={() => handleMarkDone(item._id, item.type)}
                                                    disabled={markingDone === item._id}
                                                >
                                                    {markingDone === item._id ? '⏳' : '✓ Done'}
                                                </button>
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
                    <div className="section-header activity-header">
                        <h3>⚡ Recent Activity</h3>
                        <span className="section-count">{activity?.length || 0} events</span>
                    </div>
                    <div className="activity-list">
                        {(!activity || activity.length === 0) ? (
                            <div className="empty-section compact">
                                <span className="empty-icon small">📝</span>
                                <p>No recent activity.</p>
                            </div>
                        ) : (
                            activity.map((log) => (
                                <div key={log._id} className="activity-item">
                                    <div className={`activity-icon ${log.action.toLowerCase()}`}>
                                        {log.action === 'CREATE' && '➕'}
                                        {log.action === 'UPDATE' && '✏️'}
                                        {log.action === 'DELETE' && '🗑️'}
                                        {log.action === 'DONE' && '✅'}
                                        {!['CREATE', 'UPDATE', 'DELETE', 'DONE'].includes(log.action) && '📋'}
                                    </div>
                                    <div className="activity-details">
                                        <p className="activity-text">{log.details}</p>
                                        <div className="activity-meta">
                                            <span className="activity-user">👤 {log.username}</span>
                                            <span className="activity-time">🕒 {formatTime(log.createdAt)}</span>
                                        </div>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            </div>
            </div>

            {/* Quick Add Project Modal */}
            {showAddModal && (
                <div className="modal-overlay" onClick={() => setShowAddModal(false)}>
                    <div className="quick-add-modal" onClick={(e) => e.stopPropagation()}>
                        <div className="modal-header">
                            <h3>➕ Quick Add Project</h3>
                            <button className="modal-close" onClick={() => setShowAddModal(false)}>×</button>
                        </div>
                        <form onSubmit={handleQuickAddProject}>
                            <div className="form-group">
                                <label htmlFor="projectName">Project Name *</label>
                                <input
                                    type="text"
                                    id="projectName"
                                    value={newProject.projectName}
                                    onChange={(e) => setNewProject({...newProject, projectName: e.target.value})}
                                    placeholder="Enter project name"
                                    required
                                    autoFocus
                                />
                            </div>
                            <div className="form-group">
                                <label htmlFor="services">Services (comma separated)</label>
                                <input
                                    type="text"
                                    id="services"
                                    value={newProject.services}
                                    onChange={(e) => setNewProject({...newProject, services: e.target.value})}
                                    placeholder="e.g., Fiber, Internet"
                                />
                            </div>
                            <div className="form-group">
                                <label htmlFor="picTeam">PIC Team (comma separated)</label>
                                <input
                                    type="text"
                                    id="picTeam"
                                    value={newProject.picTeam}
                                    onChange={(e) => setNewProject({...newProject, picTeam: e.target.value})}
                                    placeholder="e.g., John, Jane"
                                />
                            </div>
                            <div className="form-row">
                                <div className="form-group">
                                    <label htmlFor="dueDate">Due Date</label>
                                    <input
                                        type="date"
                                        id="dueDate"
                                        value={newProject.dueDate}
                                        onChange={(e) => setNewProject({...newProject, dueDate: e.target.value})}
                                    />
                                </div>
                                <div className="form-group">
                                    <label htmlFor="status">Status</label>
                                    <select
                                        id="status"
                                        value={newProject.status}
                                        onChange={(e) => setNewProject({...newProject, status: e.target.value})}
                                    >
                                        <option value="Done">Done</option>
                                        <option value="Progress">Progress</option>
                                        <option value="Hold">Hold</option>
                                    </select>
                                </div>
                            </div>
                            <div className="modal-actions">
                                <button type="button" className="btn btn-cancel" onClick={() => setShowAddModal(false)}>
                                    Cancel
                                </button>
                                <button type="submit" className="btn btn-primary" disabled={addingProject}>
                                    {addingProject ? 'Adding...' : 'Add Project'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}

export default Dashboard;
