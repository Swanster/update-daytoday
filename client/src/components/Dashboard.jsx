import { useState, useEffect, useCallback } from 'react';
import { dashboardApi } from '../api/dashboard';
// import './Dashboard.css'; // Removed custom CSS

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

    const [currentPage, setCurrentPage] = useState(1);
    const ITEMS_PER_PAGE = 10;

    // ... existing code ...

    // Calculate pagination
    const totalPages = Math.ceil(overdue.length / ITEMS_PER_PAGE);
    const paginatedOverdue = overdue.slice(
        (currentPage - 1) * ITEMS_PER_PAGE,
        currentPage * ITEMS_PER_PAGE
    );

    const handlePageChange = (newPage) => {
        if (newPage >= 1 && newPage <= totalPages) {
            setCurrentPage(newPage);
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
        <div className="flex flex-col gap-6 h-full">
            {/* Dashboard Header */}
            <div className="flex justify-between items-end border-b border-gray-200/50 pb-4">
                <div>
                    <h2 className="text-2xl font-bold text-primary-dark">📊 Dashboard Overview</h2>
                    <p className="text-gray-500 text-sm mt-1">Real-time project insights</p>
                </div>
                <div className="text-right hidden sm:block">
                    {lastUpdated && (
                        <div className="text-xs text-gray-500 font-medium">
                            🔄 Last updated: {formatTime(lastUpdated)}
                        </div>
                    )}
                    <div className="text-[10px] text-gray-400 mt-0.5">
                        Auto-refresh: 30s
                    </div>
                </div>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
                <div className="bg-white rounded-xl p-4 md:p-6 shadow-custom hover:translate-y-[-2px] transition-transform border-l-4 border-blue-500 relative overflow-hidden group">
                    <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:scale-110 transition-transform text-6xl">📁</div>
                    <div className="relative z-10">
                        <div className="text-3xl md:text-4xl font-bold text-gray-800 mb-1">{stats?.activeProjects || 0}</div>
                        <div className="text-sm text-gray-500 font-medium uppercase tracking-wide">Active Projects</div>
                    </div>
                </div>

                <div className="bg-white rounded-xl p-4 md:p-6 shadow-custom hover:translate-y-[-2px] transition-transform border-l-4 border-green-500 relative overflow-hidden group">
                    <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:scale-110 transition-transform text-6xl">✅</div>
                    <div className="relative z-10">
                        <div className="text-3xl md:text-4xl font-bold text-gray-800 mb-1">{stats?.completedThisQuarter || 0}</div>
                        <div className="text-sm text-gray-500 font-medium uppercase tracking-wide">Completed ({stats?.currentQuarter})</div>
                    </div>
                </div>

                <div className="bg-white rounded-xl p-4 md:p-6 shadow-custom hover:translate-y-[-2px] transition-transform border-l-4 border-accent-coral relative overflow-hidden group">
                    <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:scale-110 transition-transform text-6xl">📅</div>
                    <div className="relative z-10">
                        <div className="text-3xl md:text-4xl font-bold text-gray-800 mb-1">{stats?.dailiesThisMonth || 0}</div>
                        <div className="text-sm text-gray-500 font-medium uppercase tracking-wide">Daily This Month</div>
                    </div>
                </div>

                <div className="bg-white rounded-xl p-4 md:p-6 shadow-custom hover:translate-y-[-2px] transition-transform border-l-4 border-orange-400 relative overflow-hidden group">
                    <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:scale-110 transition-transform text-6xl">⏸️</div>
                    <div className="relative z-10">
                        <div className="text-3xl md:text-4xl font-bold text-gray-800 mb-1">{stats?.onHold || 0}</div>
                        <div className="text-sm text-gray-500 font-medium uppercase tracking-wide">On Hold</div>
                    </div>
                </div>
            </div>

            {/* Main Content Grid */}
            <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 items-stretch">
                {/* Progress Projects Section */}
                <div className="xl:col-span-2 flex flex-col gap-4 h-full">
                    <div className="flex items-center justify-between">
                        <h3 className="text-lg font-bold text-primary-dark flex items-center gap-2">
                            🚀 Progress Projects
                            <span className="bg-gray-100 text-gray-600 text-xs px-2 py-0.5 rounded-full">{overdue.length}</span>
                        </h3>
                    </div>

                    <div className="bg-white rounded-xl shadow-custom overflow-hidden border border-gray-100 flex flex-col flex-1">
                        {overdue.length === 0 ? (
                            <div className="p-8 text-center text-gray-400 flex flex-col items-center justify-center flex-1">
                                <span className="text-4xl mb-2 opacity-50">📋</span>
                                <p>No projects in progress.</p>
                            </div>
                        ) : (
                            <div className="flex flex-col flex-1">
                                <div className="overflow-x-auto flex-1">
                                    <table className="w-full text-sm text-left">
                                        <thead className="bg-gray-50 text-gray-500 font-semibold uppercase text-xs border-b border-gray-100 sticky top-0 z-10">
                                            <tr>
                                                <th className="px-4 py-3">Project Name</th>
                                                <th className="px-4 py-3">Due Date</th>
                                                <th className="px-4 py-3">Timeline</th>
                                                <th className="px-4 py-3 hidden md:table-cell">Service</th>
                                                <th className="px-4 py-3 hidden sm:table-cell">Material</th>
                                                <th className="px-4 py-3 hidden sm:table-cell">Vendor</th>
                                                <th className="px-4 py-3">Action</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-gray-100">
                                            {paginatedOverdue.map((item) => (
                                                <tr key={item._id} className={`hover:bg-gray-50 transition-colors ${item.isOverdue ? 'bg-red-50/30' : ''}`}>
                                                    <td className="px-4 py-3 font-medium text-gray-800">{item.name}</td>
                                                    <td className="px-4 py-3 text-gray-600 whitespace-nowrap">{formatDate(item.dueDate)}</td>
                                                    <td className="px-4 py-3 whitespace-nowrap">
                                                        {item.daysUntilDue !== null ? (
                                                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${item.isOverdue ? 'bg-red-100 text-red-800 border-red-200' : 'bg-green-100 text-green-800 border-green-200'}`}>
                                                                {item.isOverdue 
                                                                    ? `${item.daysUntilDue}d overdue`
                                                                    : `${item.daysUntilDue}d left`
                                                                }
                                                            </span>
                                                        ) : (
                                                            <span className="text-gray-400">-</span>
                                                        )}
                                                    </td>
                                                    <td className="px-4 py-3 hidden md:table-cell">
                                                        <div className="flex flex-wrap gap-1">
                                                            {Array.isArray(item.services) && item.services.slice(0, 2).map((svc, idx) => (
                                                                <span key={idx} className="bg-blue-50 text-blue-700 border border-blue-100 px-1.5 py-0.5 rounded text-[10px]">{svc}</span>
                                                            ))}
                                                        </div>
                                                    </td>
                                                    <td className="px-4 py-3 hidden sm:table-cell">
                                                        <button
                                                            className={`text-xs px-2 py-1 rounded transition-colors ${item.material === 'Done Installation' ? 'bg-green-100 text-green-700 cursor-default' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
                                                            onClick={() => item.material !== 'Done Installation' && handleUpdateField(item._id, 'material', 'Done Installation')}
                                                            disabled={item.material === 'Done Installation' || updatingField === `${item._id}-material`}
                                                        >
                                                            {updatingField === `${item._id}-material` ? '...' : item.material === 'Done Installation' ? 'Done' : 'Mark Done'}
                                                        </button>
                                                    </td>
                                                    <td className="px-4 py-3 hidden sm:table-cell">
                                                        <button
                                                            className={`text-xs px-2 py-1 rounded transition-colors ${item.wo === 'Done' ? 'bg-green-100 text-green-700 cursor-default' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
                                                            onClick={() => item.wo !== 'Done' && handleUpdateField(item._id, 'wo', 'Done')}
                                                            disabled={item.wo === 'Done' || updatingField === `${item._id}-wo`}
                                                        >
                                                            {updatingField === `${item._id}-wo` ? '...' : item.wo === 'Done' ? 'Done' : 'Mark Done'}
                                                        </button>
                                                    </td>
                                                    <td className="px-4 py-3">
                                                        <button
                                                            className="text-white bg-green-500 hover:bg-green-600 shadow-sm px-3 py-1.5 rounded-lg text-xs font-bold transition-all active:scale-95"
                                                            onClick={() => handleMarkDone(item._id, item.type)}
                                                            disabled={markingDone === item._id}
                                                        >
                                                            {markingDone === item._id ? '...' : '✓ Done'}
                                                        </button>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                                {/* Pagination Controls */}
                                {totalPages > 1 && (
                                    <div className="px-4 py-3 border-t border-gray-100 flex items-center justify-between bg-gray-50/50">
                                        <button
                                            onClick={() => handlePageChange(currentPage - 1)}
                                            disabled={currentPage === 1}
                                            className="px-3 py-1 rounded-lg text-xs font-medium bg-white border border-gray-200 text-gray-600 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                                        >
                                            Previous
                                        </button>
                                        <span className="text-xs text-gray-500 font-medium">
                                            Page {currentPage} of {totalPages}
                                        </span>
                                        <button
                                            onClick={() => handlePageChange(currentPage + 1)}
                                            disabled={currentPage === totalPages}
                                            className="px-3 py-1 rounded-lg text-xs font-medium bg-white border border-gray-200 text-gray-600 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                                        >
                                            Next
                                        </button>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                </div>

                {/* Recent Activity Section */}
                <div className="xl:col-span-1 flex flex-col gap-4 h-full">
                    <div className="flex items-center justify-between">
                        <h3 className="text-lg font-bold text-primary-dark">⚡ Recent Activity</h3>
                    </div>
                    
                    <div className="bg-white rounded-xl shadow-custom p-4 border border-gray-100 flex-1 overflow-y-auto">
                         {(!activity || activity.length === 0) ? (
                            <div className="text-center text-gray-400 py-8 h-full flex items-center justify-center">
                                <p>No recent activity.</p>
                            </div>
                        ) : (
                            <div className="space-y-4">
                                {activity.map((log) => (
                                    <div key={log._id} className="flex gap-3 items-start p-2 hover:bg-gray-50 rounded-lg transition-colors">
                                        <div className={`
                                            w-8 h-8 rounded-full flex items-center justify-center shrink-0 text-xs
                                            ${log.action === 'CREATE' ? 'bg-blue-100 text-blue-600' : ''}
                                            ${log.action === 'UPDATE' ? 'bg-orange-100 text-orange-600' : ''}
                                            ${log.action === 'DELETE' ? 'bg-red-100 text-red-600' : ''}
                                            ${log.action === 'DONE' ? 'bg-green-100 text-green-600' : ''}
                                            ${!['CREATE', 'UPDATE', 'DELETE', 'DONE'].includes(log.action) ? 'bg-gray-100 text-gray-600' : ''}
                                        `}>
                                            {log.action === 'CREATE' && '➕'}
                                            {log.action === 'UPDATE' && '✏️'}
                                            {log.action === 'DELETE' && '🗑️'}
                                            {log.action === 'DONE' && '✅'}
                                            {!['CREATE', 'UPDATE', 'DELETE', 'DONE'].includes(log.action) && '📋'}
                                        </div>
                                        <div>
                                            <p className="text-sm text-gray-800 leading-snug">{log.details}</p>
                                            <div className="flex items-center gap-2 mt-1 text-xs text-gray-400">
                                                <span className="font-medium text-gray-500">{log.username}</span>
                                                <span>•</span>
                                                <span>{formatTime(log.createdAt)}</span>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Quick Add Project Modal */}
            {showAddModal && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[100] flex items-center justify-center p-4" onClick={() => setShowAddModal(false)}>
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden animate-scale-in" onClick={(e) => e.stopPropagation()}>
                        <div className="bg-primary-dark px-6 py-4 flex justify-between items-center">
                            <h3 className="text-white font-bold text-lg">➕ Quick Add Project</h3>
                            <button className="text-white/70 hover:text-white text-xl" onClick={() => setShowAddModal(false)}>×</button>
                        </div>
                        <form onSubmit={handleQuickAddProject} className="p-6 flex flex-col gap-4">
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-1" htmlFor="projectName">Project Name *</label>
                                <input
                                    type="text"
                                    id="projectName"
                                    value={newProject.projectName}
                                    onChange={(e) => setNewProject({...newProject, projectName: e.target.value})}
                                    placeholder="Enter project name"
                                    required
                                    autoFocus
                                    className="w-full px-4 py-2 border rounded-lg focus:border-accent-coral focus:ring-2 focus:ring-accent-coral/20 outline-none transition-all"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-1" htmlFor="services">Services</label>
                                <input
                                    type="text"
                                    id="services"
                                    value={newProject.services}
                                    onChange={(e) => setNewProject({...newProject, services: e.target.value})}
                                    placeholder="e.g., Fiber, Internet"
                                    className="w-full px-4 py-2 border rounded-lg focus:border-accent-coral focus:ring-2 focus:ring-accent-coral/20 outline-none transition-all"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-1" htmlFor="picTeam">PIC Team</label>
                                <input
                                    type="text"
                                    id="picTeam"
                                    value={newProject.picTeam}
                                    onChange={(e) => setNewProject({...newProject, picTeam: e.target.value})}
                                    placeholder="e.g., John, Jane"
                                    className="w-full px-4 py-2 border rounded-lg focus:border-accent-coral focus:ring-2 focus:ring-accent-coral/20 outline-none transition-all"
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-1" htmlFor="dueDate">Due Date</label>
                                    <input
                                        type="date"
                                        id="dueDate"
                                        value={newProject.dueDate}
                                        onChange={(e) => setNewProject({...newProject, dueDate: e.target.value})}
                                        className="w-full px-4 py-2 border rounded-lg focus:border-accent-coral focus:ring-2 focus:ring-accent-coral/20 outline-none transition-all"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-1" htmlFor="status">Status</label>
                                    <select
                                        id="status"
                                        value={newProject.status}
                                        onChange={(e) => setNewProject({...newProject, status: e.target.value})}
                                        className="w-full px-4 py-2 border rounded-lg focus:border-accent-coral focus:ring-2 focus:ring-accent-coral/20 outline-none transition-all"
                                    >
                                        <option value="Done">Done</option>
                                        <option value="Progress">Progress</option>
                                        <option value="Hold">Hold</option>
                                    </select>
                                </div>
                            </div>
                            <div className="flex justify-end gap-3 mt-4">
                                <button type="button" className="px-4 py-2 text-gray-600 font-medium hover:bg-gray-100 rounded-lg transition-colors" onClick={() => setShowAddModal(false)}>
                                    Cancel
                                </button>
                                <button type="submit" className="px-6 py-2 bg-accent-coral text-white font-bold rounded-lg shadow-md hover:bg-[#ff6b47] transition-all disabled:opacity-70" disabled={addingProject}>
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
