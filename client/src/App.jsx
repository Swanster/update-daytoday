import { useState, useEffect, useMemo } from 'react';
import SpreadsheetTable from './components/SpreadsheetTable';
import DailyTable from './components/DailyTable';
import EntryForm from './components/EntryForm';
import DailyEntryForm from './components/DailyEntryForm';
import LoginForm from './components/LoginForm';
import ActivityLog from './components/ActivityLog';
import UserManagement from './components/UserManagement';
import CSVImportModal from './components/CSVImportModal';
import ReportModal from './components/ReportModal';
import CategoryManagement from './components/CategoryManagement';
import Dashboard from './components/Dashboard';
import ClientTab from './components/ClientTab';
import { useToast } from './components/ToastProvider';
import { projectsApi } from './api/projects';
import { dailiesApi } from './api/dailies';

function App() {
    const [user, setUser] = useState(null);
    const [token, setToken] = useState(null);
    const [activeTab, setActiveTab] = useState(null); // Will be set after login based on role
    const [selectedClientName, setSelectedClientName] = useState(null); // For Client tab navigation
    const [projects, setProjects] = useState([]);
    const [dailies, setDailies] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [isActivityOpen, setIsActivityOpen] = useState(false);
    const [isUserMgmtOpen, setIsUserMgmtOpen] = useState(false);
    const [isCSVImportOpen, setIsCSVImportOpen] = useState(false);
    const [isReportOpen, setIsReportOpen] = useState(false);
    const [isCategoryMgmtOpen, setIsCategoryMgmtOpen] = useState(false);
    const [editData, setEditData] = useState(null);
    const [error, setError] = useState(null);

    // Selection state for batch operations
    const [selectedProjectIds, setSelectedProjectIds] = useState([]);
    const [selectedDailyIds, setSelectedDailyIds] = useState([]);

    // Quarterly state - separate for each tab
    const [projectQuarters, setProjectQuarters] = useState([]);
    const [dailyQuarters, setDailyQuarters] = useState([]);
    const [projectSelectedQuarter, setProjectSelectedQuarter] = useState(null);
    const [dailySelectedQuarter, setDailySelectedQuarter] = useState(null);

    // Search and sort state
    const [searchTerm, setSearchTerm] = useState('');
    const [sortBy, setSortBy] = useState('sequence'); // sequence, name, date, status

    // Toast notifications
    const toast = useToast();

    // Check if user is admin or superuser
    const isAdminOrSuper = () => {
        return user && (user.role === 'admin' || user.role === 'superuser');
    };

    // Check for saved auth on mount
    useEffect(() => {
        const savedToken = localStorage.getItem('token');
        const savedUser = localStorage.getItem('user');
        if (savedToken && savedUser) {
            const parsedUser = JSON.parse(savedUser);
            setToken(savedToken);
            setUser(parsedUser);
            // Set default tab based on role
            if (parsedUser.role === 'admin' || parsedUser.role === 'superuser') {
                setActiveTab('dashboard');
            } else {
                setActiveTab('project');
            }
        } else {
            setActiveTab('project');
        }
    }, []);

    // Get current quarter
    const getCurrentQuarter = () => {
        const now = new Date();
        const month = now.getMonth();
        const year = now.getFullYear();
        const quarter = Math.floor(month / 3) + 1;
        return { quarter: `Q${quarter}-${year}`, year };
    };

    // Get previous quarter
    const getPreviousQuarter = (currentQuarter, currentYear) => {
        const qNum = parseInt(currentQuarter.charAt(1));
        if (qNum === 1) {
            return { quarter: `Q4-${currentYear - 1}`, year: currentYear - 1 };
        }
        return { quarter: `Q${qNum - 1}-${currentYear}`, year: currentYear };
    };

    // Initialize current quarter for both tabs
    useEffect(() => {
        const current = getCurrentQuarter();
        setProjectSelectedQuarter(current);
        setDailySelectedQuarter(current);
    }, []);

    // Get current quarter/quarters based on active tab
    const selectedQuarter = activeTab === 'project' ? projectSelectedQuarter : dailySelectedQuarter;
    const quarters = activeTab === 'project' ? projectQuarters : dailyQuarters;

    // Fetch data when tab or quarter changes
    useEffect(() => {
        const quarter = activeTab === 'project' ? projectSelectedQuarter : dailySelectedQuarter;
        if (quarter && user) {
            fetchData();
            fetchQuarters();
        }
    }, [activeTab, projectSelectedQuarter, dailySelectedQuarter, user]);

    const fetchQuarters = async () => {
        try {
            const currentQuarter = activeTab === 'project' ? projectSelectedQuarter : dailySelectedQuarter;
            const api = activeTab === 'project' ? projectsApi : dailiesApi;
            let data = await api.getQuarters();

            // Filter out any invalid quarters (null or empty)
            data = data.filter(q => q.quarter && q.year);

            const current = getCurrentQuarter();
            if (!data.find(q => q.quarter === current.quarter)) {
                data.unshift(current);
            }

            if (activeTab === 'project') {
                setProjectQuarters(data);
            } else {
                setDailyQuarters(data);
            }
        } catch (err) {
            console.error('Error fetching quarters:', err);
        }
    };

    const fetchData = async () => {
        try {
            setLoading(true);
            setError(null);

            if (activeTab === 'project') {
                const data = await projectsApi.getAll(
                    selectedQuarter?.quarter,
                    selectedQuarter?.year
                );
                setProjects(data);
            } else {
                const data = await dailiesApi.getAll(
                    selectedQuarter?.quarter,
                    selectedQuarter?.year
                );
                setDailies(data);
            }
        } catch (err) {
            console.error('Error fetching data:', err);
            setError('Failed to load data. Make sure the server is running.');
        } finally {
            setLoading(false);
        }
    };

    const handleLogin = (userData, authToken) => {
        setUser(userData);
        setToken(authToken);
        // Set default tab based on role
        if (userData.role === 'admin' || userData.role === 'superuser') {
            setActiveTab('dashboard');
        } else {
            setActiveTab('project');
        }
        toast.success(`Welcome back, ${userData.displayName || userData.username}!`);
    };

    const handleLogout = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        setUser(null);
        setToken(null);
        toast.info('You have been logged out');
    };

    const handleAddClick = () => {
        setEditData(null);
        setIsFormOpen(true);
    };

    const handleEdit = (entry) => {
        setEditData(entry);
        setIsFormOpen(true);
    };

    const handleDelete = async (id) => {
        if (window.confirm('Are you sure you want to delete this entry?')) {
            try {
                if (activeTab === 'project') {
                    await projectsApi.delete(id);
                } else {
                    await dailiesApi.delete(id);
                }
                await fetchData();
                toast.success('Entry deleted successfully');
            } catch (err) {
                console.error('Error deleting entry:', err);
                toast.error('Failed to delete entry. Please try again.');
            }
        }
    };

    const handleSave = async (formData) => {
        const isEdit = editData && editData._id;
        try {
            if (activeTab === 'project') {
                if (isEdit) {
                    await projectsApi.update(editData._id, formData);
                } else {
                    await projectsApi.create(formData);
                }
            } else {
                if (isEdit) {
                    await dailiesApi.update(editData._id, formData);
                } else {
                    await dailiesApi.create(formData);
                }
            }
            await fetchData();
            await fetchQuarters();
            toast.success(isEdit ? 'Entry updated successfully!' : 'New entry created successfully!');
        } catch (err) {
            console.error('Error saving entry:', err);
            toast.error('Failed to save entry. Please try again.');
            throw err; // Re-throw to let form handle it
        }
    };

    const handleFormClose = () => {
        setIsFormOpen(false);
        setEditData(null);
    };

    const handleQuarterChange = (e) => {
        const value = e.target.value;
        const [quarter, year] = value.split('|');
        const newQuarter = { quarter, year: parseInt(year) };

        if (activeTab === 'project') {
            setProjectSelectedQuarter(newQuarter);
        } else {
            setDailySelectedQuarter(newQuarter);
        }
    };

    // Carry forward unfinished projects from previous quarter
    const handleCarryForward = async () => {
        if (!selectedQuarter) return;

        const prev = getPreviousQuarter(selectedQuarter.quarter, selectedQuarter.year);

        try {
            const result = await projectsApi.carryForward(
                prev.quarter,
                prev.year,
                selectedQuarter.quarter,
                selectedQuarter.year
            );

            if (result.copied > 0) {
                toast.success(`Carried forward ${result.copied} project(s): ${result.projects.join(', ')}`);
                await fetchData();
            } else {
                toast.info('No unfinished projects to carry forward');
            }
        } catch (err) {
            console.error('Carry forward error:', err);
            toast.error('Failed to carry forward projects');
        }
    };

    // Handle CSV import success
    const handleCSVImportSuccess = async (result) => {
        toast.success(result.message);
        await fetchData();
        await fetchQuarters();
    };

    // Handle batch status update
    const handleBatchStatusUpdate = async (status) => {
        if (selectedProjectIds.length === 0) return;

        try {
            const result = await projectsApi.batchUpdateStatus(selectedProjectIds, status);
            toast.success(result.message);
            setSelectedProjectIds([]);
        } catch (err) {
            console.error('Batch status update error:', err);
            toast.error('Failed to update status. Please try again.');
            return;
        }

        // Refresh data after success
        try {
            await fetchData();
        } catch (err) {
            console.error('Error refreshing data:', err);
        }
    };

    // Handle daily batch status update
    const handleDailyBatchStatusUpdate = async (status) => {
        if (selectedDailyIds.length === 0) return;

        try {
            const result = await dailiesApi.batchUpdateStatus(selectedDailyIds, status);
            toast.success(result.message);
            setSelectedDailyIds([]);
        } catch (err) {
            console.error('Batch status update error:', err);
            toast.error('Failed to update status. Please try again.');
            return;
        }

        // Refresh data after success
        try {
            await fetchData();
        } catch (err) {
            console.error('Error refreshing data:', err);
        }
    };

    // Handle client click from dashboard - navigate to Client tab
    const handleClientClick = (clientName) => {
        setSelectedClientName(clientName);
        setActiveTab('client');
    };

    // Filter and sort data
    const filteredProjects = useMemo(() => {
        let result = [...projects];

        // Filter by search term
        if (searchTerm.trim()) {
            const term = searchTerm.toLowerCase();
            result = result.filter(p =>
                p.projectName?.toLowerCase().includes(term) ||
                (Array.isArray(p.services) && p.services.some(s => s.toLowerCase().includes(term))) ||
                p.picTeam?.some(pic => pic.toLowerCase().includes(term))
            );
        }

        // Sort
        result.sort((a, b) => {
            switch (sortBy) {
                case 'name':
                    return (a.projectName || '').localeCompare(b.projectName || '');
                case 'date':
                    return new Date(b.createdAt || 0) - new Date(a.createdAt || 0);
                case 'status':
                    return (a.status || '').localeCompare(b.status || '');
                case 'sequence':
                default:
                    return (a.quarterSequence || 0) - (b.quarterSequence || 0);
            }
        });

        return result;
    }, [projects, searchTerm, sortBy]);

    const filteredDailies = useMemo(() => {
        let result = [...dailies];

        // Filter by search term
        if (searchTerm.trim()) {
            const term = searchTerm.toLowerCase();
            result = result.filter(d =>
                d.clientName?.toLowerCase().includes(term) ||
                (Array.isArray(d.services) && d.services.some(s => s.toLowerCase().includes(term))) ||
                d.caseIssue?.toLowerCase().includes(term) ||
                d.picTeam?.some(pic => pic.toLowerCase().includes(term))
            );
        }

        // Sort
        result.sort((a, b) => {
            switch (sortBy) {
                case 'name':
                    return (a.clientName || '').localeCompare(b.clientName || '');
                case 'date':
                    return new Date(b.date || 0) - new Date(a.date || 0);
                case 'status':
                    return (a.status || '').localeCompare(b.status || '');
                case 'sequence':
                default:
                    return (a.quarterSequence || 0) - (b.quarterSequence || 0);
            }
        });

        return result;
    }, [dailies, searchTerm, sortBy]);

    // Show login if not authenticated
    if (!user) {
        return <LoginForm onLogin={handleLogin} />;
    }

    return (
        <div className="app">
            <header className="app-header">
                <h1>DAILY ACTIVITY INFRASTRUCTURE ENGINEER</h1>

                <div className="header-controls">
                    {/* Quarter Selector */}
                    <div className="quarter-selector">
                        <label>Quarter:</label>
                        <select
                            value={selectedQuarter ? `${selectedQuarter.quarter}|${selectedQuarter.year}` : ''}
                            onChange={handleQuarterChange}
                        >
                            {quarters.map((q, idx) => (
                                <option key={idx} value={`${q.quarter}|${q.year}`}>
                                    {q.quarter}
                                </option>
                            ))}
                        </select>
                    </div>

                    <button className="add-btn" onClick={handleAddClick}>
                        <span>+</span> Add Entry
                    </button>

                    {/* User Menu */}
                    <div className="user-menu">
                        <span className="user-name">
                            👤 {user.displayName || user.username}
                            {user.role !== 'user' && <span className="role-indicator">({user.role})</span>}
                        </span>

                        {/* Admin-only buttons */}
                        {isAdminOrSuper() && (
                            <>
                                <button className="icon-btn" onClick={() => setIsUserMgmtOpen(true)} title="User Management">
                                    👥
                                </button>
                                <button className="icon-btn" onClick={() => setIsActivityOpen(true)} title="Activity Log">
                                    📋
                                </button>
                            </>
                        )}

                        <button className="icon-btn logout-btn" onClick={handleLogout} title="Logout">
                            🚪
                        </button>
                    </div>
                </div>
            </header>

            {/* Tab Navigation */}
            <div className="tab-navigation">
                {isAdminOrSuper() && (
                    <button
                        className={`tab-btn ${activeTab === 'dashboard' ? 'active' : ''}`}
                        onClick={() => { setActiveTab('dashboard'); setSearchTerm(''); }}
                    >
                        📊 Dashboard
                    </button>
                )}
                {isAdminOrSuper() && (
                    <button
                        className={`tab-btn ${activeTab === 'client' ? 'active' : ''}`}
                        onClick={() => { setActiveTab('client'); setSearchTerm(''); setSelectedClientName(null); }}
                    >
                        🏢 Client
                    </button>
                )}
                <button
                    className={`tab-btn ${activeTab === 'project' ? 'active' : ''}`}
                    onClick={() => { setActiveTab('project'); setSearchTerm(''); }}
                >
                    📋 Project
                </button>
                <button
                    className={`tab-btn ${activeTab === 'daily' ? 'active' : ''}`}
                    onClick={() => { setActiveTab('daily'); setSearchTerm(''); }}
                >
                    📅 Daily
                </button>
            </div>

            {/* Search and Sort Controls - hide on dashboard and client tab */}
            {activeTab !== 'dashboard' && activeTab !== 'client' && (
                <div className="search-sort-controls">
                    <div className="search-box">
                        <span className="search-icon">🔍</span>
                        <input
                            type="text"
                            placeholder={activeTab === 'project' ? 'Search projects...' : 'Search daily activities...'}
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="search-input"
                        />
                        {searchTerm && (
                            <button className="clear-search" onClick={() => setSearchTerm('')}>✕</button>
                        )}
                    </div>
                    <div className="sort-box">
                        <label>Sort by:</label>
                        <select value={sortBy} onChange={(e) => setSortBy(e.target.value)}>
                            <option value="sequence">Sequence (No.)</option>
                            <option value="name">{activeTab === 'project' ? 'Project Name' : 'Client Name'}</option>
                            <option value="date">Date</option>
                            <option value="status">Status</option>
                        </select>
                    </div>
                    {activeTab === 'project' && isAdminOrSuper() && (
                        <>
                            <button className="carry-forward-btn" onClick={handleCarryForward}>
                                📥 Carry Forward
                            </button>
                            <button className="carry-forward-btn" onClick={() => setIsCSVImportOpen(true)}>
                                📤 Import TSV
                            </button>
                        </>
                    )}
                    {activeTab === 'daily' && isAdminOrSuper() && (
                        <button className="carry-forward-btn" onClick={() => setIsCSVImportOpen(true)}>
                            📤 Import TSV
                        </button>
                    )}
                    {isAdminOrSuper() && (
                        <button className="carry-forward-btn" onClick={() => setIsReportOpen(true)}>
                            📊 Report
                        </button>
                    )}
                    {user.role === 'superuser' && (
                        <button className="manage-categories-btn" onClick={() => setIsCategoryMgmtOpen(true)}>
                            🏷️ Manage Categories
                        </button>
                    )}
                </div>
            )}

            <main className="app-container">
                {activeTab === 'dashboard' ? (
                    <Dashboard user={user} onClientClick={handleClientClick} />
                ) : activeTab === 'client' ? (
                    <ClientTab
                        user={user}
                        selectedClientName={selectedClientName}
                        onClientSelect={setSelectedClientName}
                    />
                ) : loading ? (
                    <div className="loading">
                        <div className="loading-spinner"></div>
                    </div>
                ) : error ? (
                    <div className="spreadsheet-container">
                        <div className="empty-state">
                            <div className="empty-state-icon">⚠️</div>
                            <h3>Connection Error</h3>
                            <p>{error}</p>
                            <button className="btn btn-primary" onClick={fetchData}>
                                Retry
                            </button>
                        </div>
                    </div>
                ) : activeTab === 'project' ? (
                    <SpreadsheetTable
                        projects={filteredProjects}
                        onEdit={handleEdit}
                        onDelete={handleDelete}
                        selectedIds={selectedProjectIds}
                        onSelectionChange={setSelectedProjectIds}
                        onBatchStatusUpdate={handleBatchStatusUpdate}
                    />
                ) : (
                    <DailyTable
                        dailies={filteredDailies}
                        onEdit={handleEdit}
                        onDelete={handleDelete}
                        selectedIds={selectedDailyIds}
                        onSelectionChange={setSelectedDailyIds}
                        onBatchStatusUpdate={handleDailyBatchStatusUpdate}
                    />
                )}
            </main>

            {/* Project Entry Form */}
            {activeTab === 'project' && (
                <EntryForm
                    isOpen={isFormOpen}
                    onClose={handleFormClose}
                    onSave={handleSave}
                    editData={editData}
                    user={user}
                />
            )}

            {/* Daily Entry Form */}
            {activeTab === 'daily' && (
                <DailyEntryForm
                    isOpen={isFormOpen}
                    onClose={handleFormClose}
                    onSave={handleSave}
                    editData={editData}
                    user={user}
                />
            )}

            {/* Activity Log Modal - Admin only */}
            {isAdminOrSuper() && (
                <ActivityLog
                    token={token}
                    isOpen={isActivityOpen}
                    onClose={() => setIsActivityOpen(false)}
                />
            )}

            {/* User Management Modal - Admin only */}
            {isAdminOrSuper() && (
                <UserManagement
                    token={token}
                    isOpen={isUserMgmtOpen}
                    onClose={() => setIsUserMgmtOpen(false)}
                    currentUser={user}
                />
            )}

            {/* TSV Import Modal */}
            <CSVImportModal
                isOpen={isCSVImportOpen}
                onClose={() => setIsCSVImportOpen(false)}
                onSuccess={handleCSVImportSuccess}
                apiType={activeTab}
            />

            {/* Report Modal */}
            <ReportModal
                isOpen={isReportOpen}
                onClose={() => setIsReportOpen(false)}
                apiType={activeTab}
                quarters={activeTab === 'project' ? projectQuarters : dailyQuarters}
            />

            {/* Category Management Modal - Superuser only */}
            {user.role === 'superuser' && (
                <CategoryManagement
                    isOpen={isCategoryMgmtOpen}
                    onClose={() => setIsCategoryMgmtOpen(false)}
                />
            )}
        </div>
    );
}

export default App;
