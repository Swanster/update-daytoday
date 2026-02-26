import { useState, useEffect, useCallback } from 'react';
import { dashboardApi } from '../api/dashboard';
import { workOrdersApi } from '../api/workOrders'; // Import workOrdersApi
import { toast } from 'react-toastify';
// import './Dashboard.css'; // Removed custom CSS

const REFRESH_INTERVAL = 30000; // 30 seconds

function Dashboard({ user, onClientClick, onNavigateToWO, onNavigateToProject, onNavigateToDaily }) {
    const [stats, setStats] = useState(null);
    const [overdue, setOverdue] = useState([]);
    const [workOrders, setWorkOrders] = useState([]); // Add workOrders state
    const [topClients, setTopClients] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [lastUpdated, setLastUpdated] = useState(null);
    const [showAddModal, setShowAddModal] = useState(false);
    const [addingProject, setAddingProject] = useState(false);
    const [markingDone, setMarkingDone] = useState(null); // tracks which item is being marked
    const [newProject, setNewProject] = useState({ projectName: '', services: '', picTeam: '', dueDate: '', status: 'Done' });

    // Get current quarter logic (same as App.jsx)
    const getCurrentQuarter = () => {
        const now = new Date();
        const month = now.getMonth();
        const year = now.getFullYear();
        const quarter = Math.floor(month / 3) + 1;
        return { quarter: `Q${quarter}-${year}`, year };
    };

    const fetchDashboardData = useCallback(async () => {
        try {
            const currentQ = getCurrentQuarter();
            
            const [statsData, overdueData, workOrdersData, topClientsData] = await Promise.all([
                dashboardApi.getStats(),
                dashboardApi.getOverdue(),
                workOrdersApi.getAll(currentQ.quarter, currentQ.year), // Fetch current quarter WOs
                dashboardApi.getTopClients()
            ]);
            setStats(statsData);
            setOverdue(overdueData);
            setWorkOrders(workOrdersData);
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
            toast.success(`Marked as Done!`);
        } catch (err) {
            console.error('Failed to mark as done:', err);
            toast.error('Failed to mark item as done. Please try again.');
        } finally {
            setMarkingDone(null);
        }
    };

    // Handle quick add project
    const handleQuickAddProject = async (e) => {
        e.preventDefault();
        if (!newProject.projectName.trim()) {
            toast.warning('Project name is required');
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
            toast.success('Project added successfully!');
        } catch (err) {
            console.error('Failed to add project:', err);
            toast.error('Failed to add project. Please try again.');
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
            toast.success('Updated successfully!');
        } catch (err) {
            console.error('Failed to update field:', err);
            toast.error('Failed to update. Please try again.');
        } finally {
            setUpdatingField(null);
        }
    };

    const [currentPage, setCurrentPage] = useState(1);
    const ITEMS_PER_PAGE = 10;
    
    // Work Order Pagination
    const [woPage, setWoPage] = useState(1);
    const WO_ITEMS_PER_PAGE = 5;

    // Filter Progress Work Orders and Sort by Due Date (Ascending: Overdue/Nearest first)
    const progressWOs = workOrders
        .filter(wo => wo.status === 'Progress')
        .sort((a, b) => new Date(a.dueDate) - new Date(b.dueDate));

    const doneWOsCount = workOrders.filter(wo => wo.status === 'Done' || wo.status === 'Complete').length;

    // Calculate WO pagination
    const totalWOPages = Math.ceil(progressWOs.length / WO_ITEMS_PER_PAGE);
    const paginatedWOs = progressWOs.slice(
        (woPage - 1) * WO_ITEMS_PER_PAGE,
        woPage * WO_ITEMS_PER_PAGE
    );

    // Calculate pagination for Overdue Projects
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

    const handleWOPageChange = (newPage) => {
        if (newPage >= 1 && newPage <= totalWOPages) {
            setWoPage(newPage);
        }
    };

    if (loading) {
        return (
            <div className="flex flex-col gap-6 h-full p-2">
                {/* Header Skeleton */}
                <div className="flex justify-between items-end border-b border-ch-soft/60 pb-5 mb-2 animate-fade-in">
                    <div>
                        <div className="h-10 w-64 bg-ch-soft rounded-xl mb-2 animate-pulse"></div>
                        <div className="h-4 w-48 bg-ch-soft rounded-lg ml-14 animate-pulse"></div>
                    </div>
                </div>

                {/* Grid Skeleton */}
                <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-5 md:gap-6 animate-fade-in-up">
                    {[...Array(6)].map((_, i) => (
                        <div key={i} className="bg-white/50 border border-ch-soft rounded-2xl p-6 h-32 relative overflow-hidden">
                            {/* Shimmer overlay */}
                            <div className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/40 to-transparent animate-shimmer" style={{ backgroundSize: '1000px 100%' }}></div>
                            <div className="h-8 w-16 bg-ch-soft/80 rounded-lg mb-3"></div>
                            <div className="h-4 w-24 bg-ch-soft/80 rounded-md"></div>
                        </div>
                    ))}
                </div>

                {/* Main Content Skeleton */}
                <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 items-stretch animate-fade-in-up" style={{ animationDelay: '100ms' }}>
                    <div className="xl:col-span-2 h-96 bg-white/50 border border-ch-soft rounded-2xl relative overflow-hidden">
                        <div className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/40 to-transparent animate-shimmer" style={{ backgroundSize: '1000px 100%' }}></div>
                        <div className="p-6 border-b border-ch-soft/50">
                            <div className="h-6 w-32 bg-ch-soft/80 rounded-lg"></div>
                        </div>
                        <div className="p-6 space-y-4">
                             {[...Array(4)].map((_, i) => (
                                 <div key={i} className="h-12 w-full bg-ch-soft/80 rounded-xl"></div>
                             ))}
                        </div>
                    </div>
                    <div className="xl:col-span-1 h-96 bg-white/50 border border-ch-soft rounded-2xl relative overflow-hidden">
                        <div className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/40 to-transparent animate-shimmer" style={{ backgroundSize: '1000px 100%' }}></div>
                         <div className="p-6 border-b border-ch-soft/50">
                            <div className="h-6 w-40 bg-ch-soft/80 rounded-lg"></div>
                        </div>
                        <div className="p-6 space-y-4">
                             {[...Array(3)].map((_, i) => (
                                 <div key={i} className="flex gap-4">
                                     <div className="h-12 w-12 rounded-xl bg-ch-soft/80 shrink-0"></div>
                                     <div className="flex-1 space-y-2">
                                         <div className="h-4 w-full bg-ch-soft/80 rounded-md"></div>
                                         <div className="h-3 w-1/2 bg-ch-soft/80 rounded-md"></div>
                                     </div>
                                 </div>
                             ))}
                        </div>
                    </div>
                </div>
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
            <div className="flex justify-between items-end border-b border-ch-soft/60 pb-5 mb-2">
                <div>
                    <h2 className="text-3xl font-extrabold text-ch-dark tracking-tight flex items-center gap-3">
                        <span className="bg-ch-soft text-ch-primary p-2 rounded-xl text-2xl shadow-sm">📊</span> 
                        Dashboard Overview
                    </h2>
                    <p className="text-ch-primary font-medium ml-14 mt-1">Real-time project insights & analytics</p>
                </div>
                <div className="text-right hidden sm:flex flex-col items-end gap-1">
                    {lastUpdated && (
                        <div className="text-xs text-ch-primary font-bold bg-ch-soft px-3 py-1.5 rounded-lg border border-ch-soft">
                            🔄 Last updated: <span className="text-ch-dark">{formatTime(lastUpdated)}</span>
                        </div>
                    )}
                    <div className="text-[10px] font-bold text-ch-primary uppercase tracking-widest mr-1">
                        Auto-refresh: 30s
                    </div>
                </div>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-6 md:gap-8">
                <div onClick={() => onNavigateToProject?.('Progress')} className="bg-white rounded-3xl p-5 md:p-6 shadow-sm hover:shadow-custom-lg hover:-translate-y-1 transition-[transform,box-shadow] duration-300 border border-ch-soft/50 relative overflow-hidden group cursor-pointer">
                    <div className="absolute -top-6 -right-6 p-4 opacity-[0.03] group-hover:scale-125 group-hover:opacity-10 transition-all duration-500 text-8xl">📁</div>
                    <div className="absolute top-0 left-0 w-1 h-full bg-ch-primary rounded-l-2xl"></div>
                    <div className="relative z-10 pl-2">
                        <div className="text-4xl md:text-5xl font-black text-ch-dark mb-2 tracking-tight">{stats?.activeProjects || 0}</div>
                        <div className="text-xs text-ch-primary font-bold uppercase tracking-widest bg-ch-soft inline-block px-2 py-1 rounded-md">Active Projects</div>
                    </div>
                </div>

                <div onClick={() => onNavigateToProject?.('Done')} className="bg-white rounded-3xl p-5 md:p-6 shadow-sm hover:shadow-custom-lg hover:-translate-y-1 transition-[transform,box-shadow] duration-300 border border-ch-soft/50 relative overflow-hidden group cursor-pointer">
                    <div className="absolute -top-6 -right-6 p-4 opacity-[0.03] group-hover:scale-125 group-hover:opacity-10 transition-all duration-500 text-8xl">✅</div>
                    <div className="absolute top-0 left-0 w-1 h-full bg-emerald-500 rounded-l-2xl"></div>
                    <div className="relative z-10 pl-2">
                        <div className="text-4xl md:text-5xl font-black text-ch-dark mb-2 tracking-tight">{stats?.completedThisQuarter || 0}</div>
                        <div className="text-xs text-emerald-600 font-bold uppercase tracking-widest bg-emerald-50 inline-block px-2 py-1 rounded-md">Completed ({stats?.currentQuarter})</div>
                    </div>
                </div>

                <div onClick={() => onNavigateToDaily?.()} className="bg-white rounded-3xl p-5 md:p-6 shadow-sm hover:shadow-custom-lg hover:-translate-y-1 transition-[transform,box-shadow] duration-300 border border-ch-soft/50 relative overflow-hidden group cursor-pointer">
                    <div className="absolute -top-6 -right-6 p-4 opacity-[0.03] group-hover:scale-125 group-hover:opacity-10 transition-all duration-500 text-8xl">📅</div>
                    <div className="absolute top-0 left-0 w-1 h-full bg-blue-500 rounded-l-2xl"></div>
                    <div className="relative z-10 pl-2">
                        <div className="text-4xl md:text-5xl font-black text-ch-dark mb-2 tracking-tight">{stats?.dailiesThisMonth || 0}</div>
                        <div className="text-xs text-blue-600 font-bold uppercase tracking-widest bg-blue-50 inline-block px-2 py-1 rounded-md">Daily This Month</div>
                    </div>
                </div>

                <div onClick={() => onNavigateToProject?.('Hold')} className="bg-white rounded-3xl p-5 md:p-6 shadow-sm hover:shadow-custom-lg hover:-translate-y-1 transition-[transform,box-shadow] duration-300 border border-ch-soft/50 relative overflow-hidden group cursor-pointer">
                    <div className="absolute -top-6 -right-6 p-4 opacity-[0.03] group-hover:scale-125 group-hover:opacity-10 transition-all duration-500 text-8xl">⏸️</div>
                    <div className="absolute top-0 left-0 w-1 h-full bg-amber-500 rounded-l-2xl"></div>
                    <div className="relative z-10 pl-2">
                        <div className="text-4xl md:text-5xl font-black text-ch-dark mb-2 tracking-tight">{stats?.onHold || 0}</div>
                        <div className="text-xs text-amber-600 font-bold uppercase tracking-widest bg-amber-50 inline-block px-2 py-1 rounded-md">On Hold</div>
                    </div>
                </div>

                <div onClick={() => onNavigateToWO?.('Progress')} className="bg-white rounded-3xl p-5 md:p-6 shadow-sm hover:shadow-custom-lg hover:-translate-y-1 transition-[transform,box-shadow] duration-300 border border-ch-soft/50 relative overflow-hidden group cursor-pointer">
                    <div className="absolute -top-6 -right-6 p-4 opacity-[0.03] group-hover:scale-125 group-hover:opacity-10 transition-all duration-500 text-8xl">🛠️</div>
                    <div className="absolute top-0 left-0 w-1 h-full bg-orange-500 rounded-l-2xl"></div>
                    <div className="relative z-10 pl-2">
                        <div className="text-4xl md:text-5xl font-black text-ch-dark mb-2 tracking-tight">{progressWOs.length}</div>
                        <div className="text-xs text-orange-600 font-bold uppercase tracking-widest bg-orange-50 inline-block px-2 py-1 rounded-md">Onprogress WO</div>
                    </div>
                </div>

                <div onClick={() => onNavigateToWO?.('Done')} className="bg-white rounded-3xl p-5 md:p-6 shadow-sm hover:shadow-custom-lg hover:-translate-y-1 transition-[transform,box-shadow] duration-300 border border-ch-soft/50 relative overflow-hidden group cursor-pointer">
                    <div className="absolute -top-6 -right-6 p-4 opacity-[0.03] group-hover:scale-125 group-hover:opacity-10 transition-all duration-500 text-8xl">✔️</div>
                    <div className="absolute top-0 left-0 w-1 h-full bg-teal-500 rounded-l-2xl"></div>
                    <div className="relative z-10 pl-2">
                        <div className="text-4xl md:text-5xl font-black text-ch-dark mb-2 tracking-tight">{doneWOsCount}</div>
                        <div className="text-xs text-teal-600 font-bold uppercase tracking-widest bg-teal-50 inline-block px-2 py-1 rounded-md">Done WO</div>
                    </div>
                </div>
            </div>

            {/* Main Content Grid */}
            <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 md:gap-8 items-stretch">
                {/* Progress Projects Section */}
                <div className="xl:col-span-2 flex flex-col gap-4 h-full">
                    <div className="flex items-center justify-between">
                        <h3 className="text-xl font-extrabold text-ch-dark flex items-center gap-2">
                            🚀 Progress Projects
                            <span className="bg-ch-soft text-ch-dark text-xs px-2.5 py-0.5 rounded-full font-bold ml-1">{overdue.length}</span>
                        </h3>
                    </div>

                    <div className="bg-white rounded-3xl shadow-sm overflow-hidden border border-ch-soft/50 flex flex-col flex-1">
                        {overdue.length === 0 ? (
                            <div className="p-12 text-center text-ch-primary flex flex-col items-center justify-center flex-1">
                                <span className="text-5xl mb-4 opacity-40">📋</span>
                                <p className="font-semibold text-lg">No projects in progress.</p>
                                <p className="text-sm mt-1">Check back later or start a new project.</p>
                            </div>
                        ) : (
                            <div className="flex flex-col flex-1">
                                {/* Desktop Table View */}
                                <div className="hidden md:block overflow-x-auto flex-1">
                                    <table className="w-full text-sm text-left">
                                        <thead className="bg-ch-light text-ch-primary font-bold uppercase text-[10px] tracking-widest border-b border-ch-soft sticky top-0 z-10">
                                            <tr>
                                                <th className="px-5 py-4">Project Name</th>
                                                <th className="px-5 py-4">Due Date</th>
                                                <th className="px-5 py-4">Timeline</th>
                                                <th className="px-5 py-4 hidden lg:table-cell">Service</th>
                                                <th className="px-5 py-4 hidden xl:table-cell">Material</th>
                                                <th className="px-5 py-4 hidden xl:table-cell">Desc/WO</th>
                                                <th className="px-5 py-4">Action</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-ch-soft">
                                            {paginatedOverdue.map((item) => (
                                                <tr key={item._id} className={`hover:bg-ch-light transition-colors ${item.isOverdue ? 'bg-red-50/20' : ''}`}>
                                                    <td className="px-5 py-4 font-bold text-ch-dark">
                                                        {item.name}
                                                        <div className="lg:hidden mt-1.5 text-xs text-ch-primary font-medium">
                                                            {Array.isArray(item.services) && item.services.slice(0, 2).join(', ')}
                                                        </div>
                                                    </td>
                                                    <td className="px-5 py-4 text-ch-dark font-medium whitespace-nowrap">{formatDate(item.dueDate)}</td>
                                                    <td className="px-5 py-4 whitespace-nowrap">
                                                        {item.daysUntilDue !== null ? (
                                                            <span className={`inline-flex items-center px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wide border ${item.isOverdue ? 'bg-red-50 text-red-700 border-red-200' : 'bg-emerald-50 text-emerald-700 border-emerald-200'}`}>
                                                                {item.isOverdue 
                                                                    ? `${item.daysUntilDue}d overdue`
                                                                    : `${item.daysUntilDue}d left`
                                                                }
                                                            </span>
                                                        ) : (
                                                            <span className="text-ch-soft">-</span>
                                                        )}
                                                    </td>
                                                    <td className="px-5 py-4 hidden lg:table-cell">
                                                        <div className="flex flex-wrap gap-1.5">
                                                            {Array.isArray(item.services) && item.services.slice(0, 2).map((svc, idx) => (
                                                                <span key={idx} className="bg-ch-soft text-ch-dark border border-ch-soft/50 px-2 py-0.5 rounded-md text-[10px] font-bold">{svc}</span>
                                                            ))}
                                                        </div>
                                                    </td>
                                                    <td className="px-5 py-4 hidden xl:table-cell">
                                                        <button
                                                            className={`text-[11px] font-bold px-3 py-1.5 rounded-lg transition-all shadow-sm active:scale-95 ${item.material === 'Done Installation' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200 cursor-default shadow-none' : 'bg-white border border-ch-soft text-ch-dark hover:bg-ch-light hover:border-ch-soft'}`}
                                                            onClick={() => item.material !== 'Done Installation' && handleUpdateField(item._id, 'material', 'Done Installation')}
                                                            disabled={item.material === 'Done Installation' || updatingField === `${item._id}-material`}
                                                        >
                                                            {updatingField === `${item._id}-material` ? '...' : item.material === 'Done Installation' ? '✓ Done' : 'Mark Done'}
                                                        </button>
                                                    </td>
                                                    <td className="px-5 py-4 hidden xl:table-cell">
                                                        <button
                                                            className={`text-[11px] font-bold px-3 py-1.5 rounded-lg transition-all shadow-sm active:scale-95 ${item.wo === 'Done' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200 cursor-default shadow-none' : 'bg-white border border-ch-soft text-ch-dark hover:bg-ch-light hover:border-ch-soft'}`}
                                                            onClick={() => item.wo !== 'Done' && handleUpdateField(item._id, 'wo', 'Done')}
                                                            disabled={item.wo === 'Done' || updatingField === `${item._id}-wo`}
                                                        >
                                                            {updatingField === `${item._id}-wo` ? '...' : item.wo === 'Done' ? '✓ Done' : 'Mark Done'}
                                                        </button>
                                                    </td>
                                                    <td className="px-5 py-4">
                                                        <button
                                                            className="text-white bg-emerald-500 hover:bg-emerald-600 shadow-sm shadow-emerald-200 px-4 py-2 rounded-lg text-xs font-bold transition-all active:scale-95 min-w-[90px]"
                                                            onClick={() => handleMarkDone(item._id, item.type)}
                                                            disabled={markingDone === item._id}
                                                        >
                                                            {markingDone === item._id ? 'Saving...' : '✓ Done'}
                                                        </button>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>

                                {/* Mobile Card View */}
                                <div className="md:hidden flex flex-col gap-4 p-4 bg-ch-light/50">
                                    {paginatedOverdue.map((item) => (
                                        <div key={item._id} className="bg-white p-5 rounded-2xl shadow-sm border border-ch-soft flex flex-col gap-4">
                                            <div className="flex justify-between items-start">
                                                <div>
                                                    <h4 className="font-bold text-ch-dark text-base">{item.name}</h4>
                                                    <div className="flex flex-wrap gap-1.5 mt-2">
                                                        {Array.isArray(item.services) && item.services.map((svc, idx) => (
                                                            <span key={idx} className="bg-ch-soft text-ch-dark border border-ch-soft/50 px-2 py-0.5 rounded-md text-[10px] font-bold">{svc}</span>
                                                        ))}
                                                    </div>
                                                </div>
                                                {item.daysUntilDue !== null && (
                                                    <span className={`px-2.5 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider border ${item.isOverdue ? 'bg-red-50 text-red-700 border-red-200' : 'bg-emerald-50 text-emerald-700 border-emerald-200'}`}>
                                                        {item.isOverdue ? `${item.daysUntilDue}d Late` : `${item.daysUntilDue}d Left`}
                                                    </span>
                                                )}
                                            </div>
                                            
                                            <div className="flex items-center gap-2 text-xs font-bold text-ch-primary">
                                                <span>📅 {formatDate(item.dueDate)}</span>
                                            </div>

                                            <div className="grid grid-cols-2 gap-3 mt-1">
                                                <button
                                                    className={`text-xs font-bold px-3 py-2 rounded-xl border text-center transition-all shadow-sm active:scale-95 ${item.material === 'Done Installation' ? 'bg-emerald-50 text-emerald-700 border-emerald-200 shadow-none' : 'bg-white text-ch-dark border-ch-soft hover:bg-ch-light hover:border-ch-soft'}`}
                                                    onClick={() => item.material !== 'Done Installation' && handleUpdateField(item._id, 'material', 'Done Installation')}
                                                    disabled={item.material === 'Done Installation' || updatingField === `${item._id}-material`}
                                                >
                                                    {updatingField === `${item._id}-material` ? '...' : item.material === 'Done Installation' ? 'Material: Done' : 'Material: Pending'}
                                                </button>
                                                <button
                                                    className={`text-xs font-bold px-3 py-2 rounded-xl border text-center transition-all shadow-sm active:scale-95 ${item.wo === 'Done' ? 'bg-emerald-50 text-emerald-700 border-emerald-200 shadow-none' : 'bg-white text-ch-dark border-ch-soft hover:bg-ch-light hover:border-ch-soft'}`}
                                                    onClick={() => item.wo !== 'Done' && handleUpdateField(item._id, 'wo', 'Done')}
                                                    disabled={item.wo === 'Done' || updatingField === `${item._id}-wo`}
                                                >
                                                    {updatingField === `${item._id}-wo` ? '...' : item.wo === 'Done' ? 'WO: Done' : 'WO: Pending'}
                                                </button>
                                            </div>

                                            <button
                                                className="w-full text-white bg-emerald-500 hover:bg-emerald-600 shadow-sm shadow-emerald-200 px-4 py-3 rounded-xl text-sm font-bold transition-all active:scale-95 flex items-center justify-center gap-2 mt-2"
                                                onClick={() => handleMarkDone(item._id, item.type)}
                                                disabled={markingDone === item._id}
                                            >
                                                {markingDone === item._id ? 'Processing...' : '✓ Mark Project as Done'}
                                            </button>
                                        </div>
                                    ))}
                                </div>

                                {/* Pagination Controls */}
                                {totalPages > 1 && (
                                    <div className="px-5 py-4 border-t border-ch-soft flex items-center justify-between bg-white md:bg-ch-light/50 sticky bottom-0 z-10 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)] md:shadow-none">
                                        <button
                                            onClick={() => handlePageChange(currentPage - 1)}
                                            disabled={currentPage === 1}
                                            className="px-4 py-2 rounded-xl text-xs font-bold bg-white border border-ch-soft text-ch-dark hover:bg-ch-light hover:border-ch-soft disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-sm active:scale-95"
                                        >
                                            Previous
                                        </button>
                                        <span className="text-xs text-ch-primary font-bold uppercase tracking-widest">
                                            Page {currentPage} of {totalPages}
                                        </span>
                                        <button
                                            onClick={() => handlePageChange(currentPage + 1)}
                                            disabled={currentPage === totalPages}
                                            className="px-4 py-2 rounded-xl text-xs font-bold bg-white border border-ch-soft text-ch-dark hover:bg-ch-light hover:border-ch-soft disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-sm active:scale-95"
                                        >
                                            Next
                                        </button>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                </div>

                {/* Progress Work Orders Section */}
                <div className="xl:col-span-1 flex flex-col gap-4 h-full">
                    <div className="flex items-center justify-between">
                        <h3 className="text-xl font-extrabold text-ch-dark flex items-center gap-2">
                             🛠️ Progress Work Orders
                            <span className="bg-ch-soft text-ch-dark text-xs px-2.5 py-0.5 rounded-full font-bold ml-1">{progressWOs.length}</span>
                        </h3>
                    </div>
                    
                    <div className="bg-white rounded-2xl shadow-custom p-5 border border-ch-soft flex-1 overflow-y-auto">
                         {progressWOs.length === 0 ? (
                            <div className="text-center text-ch-primary py-12 h-full flex flex-col items-center justify-center">
                                <span className="text-4xl mb-3 opacity-40">🛠️</span>
                                <p className="font-semibold">No work orders in progress.</p>
                            </div>
                        ) : (
                            <>
                                <div className="space-y-4 flex-1 flex flex-col">
                                    {paginatedWOs.map((wo) => (
                                        <div key={wo._id} className="flex gap-4 items-start p-4 hover:bg-ch-light/80 rounded-2xl transition-all duration-300 border border-ch-soft shadow-sm hover:shadow-md">
                                            <div className="w-12 h-12 rounded-xl flex items-center justify-center shrink-0 text-2xl bg-ch-soft border border-ch-soft">
                                                🛠️
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <p className="font-bold text-ch-dark text-sm truncate">{wo.clientName}</p>
                                                <div className="flex items-center gap-2 mt-1.5">
                                                     <span className="bg-ch-soft text-ch-dark px-2 py-0.5 rounded-md text-[10px] font-bold border border-ch-soft truncate max-w-[120px]">
                                                        {wo.services || 'No Service'}
                                                    </span>
                                                </div>
                                                {wo.detailRequest && (
                                                    <p className="text-xs text-ch-primary mt-2 line-clamp-2 leading-relaxed italic">"{wo.detailRequest}"</p>
                                                )}
                                                <div className="flex items-center gap-2 mt-3 text-xs font-bold text-ch-primary">
                                                    <span>📅 Due: {formatDate(wo.dueDate)}</span>
                                                </div>
                                            </div>
                                            <div className="shrink-0 flex items-center">
                                                 <span className="inline-flex items-center px-2.5 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider border bg-amber-50 text-amber-700 border-amber-200">
                                                    {wo.status}
                                                </span>
                                            </div>
                                        </div>
                                    ))}
                                </div>

                                {/* WO Pagination Controls */}
                                {totalWOPages > 1 && (
                                    <div className="mt-5 pt-4 border-t border-ch-soft flex items-center justify-between">
                                        <button
                                            onClick={() => handleWOPageChange(woPage - 1)}
                                            disabled={woPage === 1}
                                            className="px-3 py-1.5 rounded-lg text-[11px] font-bold bg-white border border-ch-soft text-ch-dark hover:bg-ch-light hover:border-ch-soft disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-sm active:scale-95"
                                        >
                                            Prev
                                        </button>
                                        <span className="text-[11px] text-ch-primary font-bold uppercase tracking-widest">
                                            {woPage} / {totalWOPages}
                                        </span>
                                        <button
                                            onClick={() => handleWOPageChange(woPage + 1)}
                                            disabled={woPage === totalWOPages}
                                            className="px-3 py-1.5 rounded-lg text-[11px] font-bold bg-white border border-ch-soft text-ch-dark hover:bg-ch-light hover:border-ch-soft disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-sm active:scale-95"
                                        >
                                            Next
                                        </button>
                                    </div>
                                )}
                            </>
                        )}
                    </div>
                </div>
            </div>

            {/* Quick Add Project Modal */}
            {showAddModal && (
                <div className="fixed inset-0 bg-ch-dark/40 backdrop-blur-md z-[100] flex items-center justify-center p-4 transition-opacity" onClick={() => setShowAddModal(false)}>
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden transform transition-all animate-scale-in" onClick={(e) => e.stopPropagation()}>
                        <div className="bg-ch-dark px-6 py-4 flex justify-between items-center border-b border-white/10">
                            <h3 className="text-white font-extrabold text-lg flex items-center gap-2">
                                <span className="bg-white/20 p-1 rounded-lg text-sm">➕</span> Quick Add Project
                            </h3>
                            <button className="text-ch-primary hover:text-white text-xl transition-colors p-1" onClick={() => setShowAddModal(false)}>✕</button>
                        </div>
                        <form onSubmit={handleQuickAddProject} className="p-6 flex flex-col gap-5">
                            <div>
                                <label className="block text-xs font-bold text-ch-dark mb-1.5 uppercase tracking-wide" htmlFor="projectName">Project Name <span className="text-red-500">*</span></label>
                                <input
                                    type="text"
                                    id="projectName"
                                    value={newProject.projectName}
                                    onChange={(e) => setNewProject({...newProject, projectName: e.target.value})}
                                    placeholder="Enter project name"
                                    required
                                    autoFocus
                                    className="w-full px-4 py-2.5 bg-ch-light border border-ch-soft rounded-xl focus:border-ch-primary focus:ring-4 focus:ring-ch-primary/10 focus:bg-white outline-none transition-all text-sm font-medium text-ch-dark"
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-ch-dark mb-1.5 uppercase tracking-wide" htmlFor="services">Services</label>
                                <input
                                    type="text"
                                    id="services"
                                    value={newProject.services}
                                    onChange={(e) => setNewProject({...newProject, services: e.target.value})}
                                    placeholder="e.g., Fiber, Internet"
                                    className="w-full px-4 py-2.5 bg-ch-light border border-ch-soft rounded-xl focus:border-ch-primary focus:ring-4 focus:ring-ch-primary/10 focus:bg-white outline-none transition-all text-sm font-medium text-ch-dark"
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-ch-dark mb-1.5 uppercase tracking-wide" htmlFor="picTeam">PIC Team</label>
                                <input
                                    type="text"
                                    id="picTeam"
                                    value={newProject.picTeam}
                                    onChange={(e) => setNewProject({...newProject, picTeam: e.target.value})}
                                    placeholder="e.g., John, Jane"
                                    className="w-full px-4 py-2.5 bg-ch-light border border-ch-soft rounded-xl focus:border-ch-primary focus:ring-4 focus:ring-ch-primary/10 focus:bg-white outline-none transition-all text-sm font-medium text-ch-dark"
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-bold text-ch-dark mb-1.5 uppercase tracking-wide" htmlFor="dueDate">Due Date</label>
                                    <input
                                        type="date"
                                        id="dueDate"
                                        value={newProject.dueDate}
                                        onChange={(e) => setNewProject({...newProject, dueDate: e.target.value})}
                                        className="w-full px-4 py-2.5 bg-ch-light border border-ch-soft rounded-xl focus:border-ch-primary focus:ring-4 focus:ring-ch-primary/10 focus:bg-white outline-none transition-all text-sm font-medium text-ch-dark"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-ch-dark mb-1.5 uppercase tracking-wide" htmlFor="status">Status</label>
                                    <select
                                        id="status"
                                        value={newProject.status}
                                        onChange={(e) => setNewProject({...newProject, status: e.target.value})}
                                        className="w-full px-4 py-2.5 bg-ch-light border border-ch-soft rounded-xl focus:border-ch-primary focus:ring-4 focus:ring-ch-primary/10 focus:bg-white outline-none transition-all text-sm font-medium text-ch-dark cursor-pointer"
                                    >
                                        <option value="Done">Done</option>
                                        <option value="Progress">Progress</option>
                                        <option value="Hold">Hold</option>
                                    </select>
                                </div>
                            </div>
                            <div className="flex justify-end gap-3 mt-4 pt-4 border-t border-ch-soft">
                                <button type="button" className="px-5 py-2.5 text-ch-primary font-bold hover:bg-ch-soft hover:text-ch-dark rounded-xl transition-colors" onClick={() => setShowAddModal(false)}>
                                    Cancel
                                </button>
                                <button type="submit" className="px-6 py-2.5 bg-ch-primary text-white font-bold rounded-xl shadow-sm hover:bg-ch-dark hover:shadow-md hover:-translate-y-0.5 transition-all disabled:opacity-70 disabled:hover:translate-y-0 active:scale-95" disabled={addingProject}>
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
