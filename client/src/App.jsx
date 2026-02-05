import { useState, useEffect, useMemo } from 'react';
import SpreadsheetTable from './components/SpreadsheetTable';
import DailyTable from './components/DailyTable';
import EntryForm from './components/EntryForm';
import DailyEntryForm from './components/DailyEntryForm';
import QuickAddModal from './components/QuickAddModal';
import LoginForm from './components/LoginForm';
import ActivityLog from './components/ActivityLog';
import UserManagement from './components/UserManagement';
import CSVImportModal from './components/CSVImportModal';
import ReportModal from './components/ReportModal';
import CategoryManagement from './components/CategoryManagement';
import CaseTypeManagement from './components/CaseTypeManagement';
import PicMemberManagement from './components/PicMemberManagement';
import Dashboard from './components/Dashboard';
import ClientTab from './components/ClientTab';
import PWAInstallPrompt from './components/PWAInstallPrompt';
import { useToast } from './components/ToastProvider';
import { projectsApi } from './api/projects';
import { dailiesApi } from './api/dailies';
import { workOrdersApi } from './api/workOrders';
import WOTable from './components/WOTable';
import WOEntryForm from './components/WOEntryForm';


function App() {
    const [user, setUser] = useState(null);
    const [token, setToken] = useState(null);
    const [activeTab, setActiveTab] = useState(null); // Will be set after login based on role
    const [selectedClientName, setSelectedClientName] = useState(null); // For Client tab navigation
    const [projects, setProjects] = useState([]);
    const [dailies, setDailies] = useState([]);
    const [workOrders, setWorkOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [isActivityOpen, setIsActivityOpen] = useState(false);
    const [isUserMgmtOpen, setIsUserMgmtOpen] = useState(false);
    const [isCSVImportOpen, setIsCSVImportOpen] = useState(false);
    const [isReportOpen, setIsReportOpen] = useState(false);
    const [isCategoryMgmtOpen, setIsCategoryMgmtOpen] = useState(false);
    const [isCaseTypeMgmtOpen, setIsCaseTypeMgmtOpen] = useState(false);
    const [isPicMemberMgmtOpen, setIsPicMemberMgmtOpen] = useState(false);
    const [editData, setEditData] = useState(null);
    const [error, setError] = useState(null);

    // Quick Add Modal state
    const [isQuickAddOpen, setIsQuickAddOpen] = useState(false);
    const [quickAddName, setQuickAddName] = useState('');
    const [quickAddType, setQuickAddType] = useState('daily');

    // Selection state for batch operations
    const [selectedProjectIds, setSelectedProjectIds] = useState([]);
    const [selectedDailyIds, setSelectedDailyIds] = useState([]);
    const [selectedWOIds, setSelectedWOIds] = useState([]);

    // Quarterly state - separate for each tab
    const [projectQuarters, setProjectQuarters] = useState([]);
    const [dailyQuarters, setDailyQuarters] = useState([]);
    const [woQuarters, setWOQuarters] = useState([]);
    const [projectSelectedQuarter, setProjectSelectedQuarter] = useState(null);
    const [dailySelectedQuarter, setDailySelectedQuarter] = useState(null);
    const [woSelectedQuarter, setWOSelectedQuarter] = useState(null);

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
        setWOSelectedQuarter(current);
    }, []);

    // Get current quarter/quarters based on active tab
    const selectedQuarter = activeTab === 'project' ? projectSelectedQuarter : (activeTab === 'wo' ? woSelectedQuarter : dailySelectedQuarter);
    const quarters = activeTab === 'project' ? projectQuarters : (activeTab === 'wo' ? woQuarters : dailyQuarters);

    // Fetch data when tab or quarter changes
    useEffect(() => {
        const quarter = activeTab === 'project' ? projectSelectedQuarter : (activeTab === 'wo' ? woSelectedQuarter : dailySelectedQuarter);
        if (quarter && user) {
            fetchData();
            fetchQuarters();
        }
    }, [activeTab, projectSelectedQuarter, dailySelectedQuarter, woSelectedQuarter, user]);

    const fetchQuarters = async () => {
        try {
            const currentQuarter = activeTab === 'project' ? projectSelectedQuarter : (activeTab === 'wo' ? woSelectedQuarter : dailySelectedQuarter);
            const api = activeTab === 'project' ? projectsApi : (activeTab === 'wo' ? workOrdersApi : dailiesApi);
            let data = await api.getQuarters();

            // Filter out any invalid quarters (null or empty)
            data = data.filter(q => q.quarter && q.year);

            const current = getCurrentQuarter();
            if (!data.find(q => q.quarter === current.quarter)) {
                data.unshift(current);
            }

            if (activeTab === 'project') {
                setProjectQuarters(data);
            } else if (activeTab === 'wo') {
                setWOQuarters(data);
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
            } else if (activeTab === 'wo') {
                const data = await workOrdersApi.getAll(
                    selectedQuarter?.quarter,
                    selectedQuarter?.year
                );
                setWorkOrders(data);
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
                } else if (activeTab === 'wo') {
                    await workOrdersApi.delete(id);
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
            } else if (activeTab === 'wo') {
                if (isEdit) {
                    await workOrdersApi.update(editData._id, formData);
                } else {
                    await workOrdersApi.create(formData);
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
        } else if (activeTab === 'wo') {
            setWOSelectedQuarter(newQuarter);
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

    // Handle WO batch status update
    const handleWOBatchStatusUpdate = async (status) => {
        if (selectedWOIds.length === 0) return;

        try {
            const result = await workOrdersApi.batchUpdateStatus(selectedWOIds, status);
            toast.success(result.message);
            setSelectedWOIds([]);
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

    // Handle add entry from client name click in table
    const handleAddEntryForClient = (clientName) => {
        setQuickAddName(clientName);
        setQuickAddType('daily');
        setIsQuickAddOpen(true);
    };

    // Handle add entry from project name click in table
    const handleAddEntryForProject = (projectName) => {
        setQuickAddName(projectName);
        setQuickAddType('project');
        setIsQuickAddOpen(true);
    };

    // Handle quick add save
    const handleQuickAddSave = async (formData) => {
        if (quickAddType === 'daily') {
            await dailiesApi.create(formData);
        } else {
            await projectsApi.create(formData);
        }
        await fetchData();
        toast.success('Entry added successfully!');
    };

    // Filter and sort data
    const filteredProjects = useMemo(() => {
        let result = [...projects];

        // Filter by search term
        if (searchTerm.trim()) {
            const term = searchTerm.toLowerCase();
            result = result.filter(p =>
                p.projectName?.toLowerCase().includes(term) ||
                (Array.isArray(p.services) && p.services.some(s => typeof s === 'string' && s.toLowerCase().includes(term))) ||
                (Array.isArray(p.picTeam) && p.picTeam.some(pic => typeof pic === 'string' && pic.toLowerCase().includes(term)))
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
                (Array.isArray(d.services) && d.services.some(s => typeof s === 'string' && s.toLowerCase().includes(term))) ||
                (Array.isArray(d.caseIssue) ? d.caseIssue.some(c => typeof c === 'string' && c.toLowerCase().includes(term)) : (typeof d.caseIssue === 'string' && d.caseIssue.toLowerCase().includes(term))) ||
                (Array.isArray(d.picTeam) && d.picTeam.some(pic => typeof pic === 'string' && pic.toLowerCase().includes(term)))
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
        <div className="min-h-screen bg-bg-cream text-text-dark font-lexend flex flex-col">
            {/* Header - Sticky Top */}
            <div className="sticky top-0 z-50 bg-primary-dark text-white shadow-lg transition-all duration-300">
                <header className="px-4 py-3 flex justify-between items-center">
                <h1 className="text-xl md:text-2xl font-bold flex items-center gap-2 truncate">
                    <span className="text-2xl">📊</span> 
                    <span className="hidden md:inline">DAILY ACTIVITY INFRASTRUCTURE ENGINEER</span>
                    <span className="md:hidden">Daily Activity</span>
                </h1>

                <div className="flex items-center gap-3">
                    {/* Quarter Selector - Hidden on very small screens if needed, or compacted */}
                    <div className="flex items-center gap-2 bg-white/10 rounded-lg px-2 py-1">
                        <label className="hidden md:block text-sm font-semibold">Quarter:</label>
                        <select
                            className="bg-transparent border-none text-white text-sm font-semibold focus:ring-0 cursor-pointer outline-none"
                            value={selectedQuarter ? `${selectedQuarter.quarter}|${selectedQuarter.year}` : ''}
                            onChange={handleQuarterChange}
                        >
                            {quarters.map((q, idx) => (
                                <option key={idx} value={`${q.quarter}|${q.year}`} className="text-black">
                                    {q.quarter}
                                </option>
                            ))}
                        </select>
                    </div>

                    {(activeTab === 'project' || activeTab === 'daily' || activeTab === 'wo') && (
                        <>
                            <button 
                                className="hidden md:flex bg-accent-coral text-white px-4 py-1.5 rounded-lg font-semibold items-center gap-1 shadow-md hover:bg-[#ff6b47] hover:-translate-y-0.5 transition-all active:scale-95"
                                onClick={handleAddClick}
                            >
                                <span>+</span> Add Entry
                            </button>
                             {/* Mobile Add Button (Icon only) */}
                            <button 
                                className="md:hidden w-8 h-8 flex items-center justify-center bg-accent-coral text-white rounded-full shadow-md active:scale-90"
                                onClick={handleAddClick}
                            >
                                +
                            </button>
                        </>
                    )}

                    {/* User Menu */}
                    <div className="flex items-center gap-3 ml-2">
                        <div className="hidden md:flex flex-col items-end leading-tight">
                            <span className="font-semibold text-sm">{user.displayName || user.username}</span>
                            {user.role !== 'user' && <span className="text-xs opacity-75 uppercase tracking-wider">{user.role}</span>}
                        </div>

                        {/* Admin-only buttons - Desktop */}
                        {isAdminOrSuper() && (
                            <div className="hidden md:flex gap-2">
                                <button className="p-1.5 hover:bg-white/10 rounded-full transition-colors" onClick={() => setIsUserMgmtOpen(true)} title="User Management">👥</button>
                                <button className="p-1.5 hover:bg-white/10 rounded-full transition-colors" onClick={() => setIsActivityOpen(true)} title="Activity Log">📋</button>
                            </div>
                        )}

                        <button className="text-xl p-1.5 hover:bg-white/10 rounded-full transition-colors text-gray-300 hover:text-white" onClick={handleLogout} title="Logout">
                            🚪
                        </button>
                    </div>
                </div>
            </header>

            {/* Desktop Tab Navigation */}
            <div className="hidden md:flex px-6 gap-1 overflow-x-auto">
                {isAdminOrSuper() && (
                    <button
                        className={`px-6 py-2.5 rounded-t-lg font-semibold text-sm transition-all flex items-center gap-2
                            ${activeTab === 'dashboard' ? 'bg-bg-cream text-primary-dark shadow-sm translate-y-[1px]' : 'text-white/70 hover:text-white hover:bg-white/10'}`}
                        onClick={() => { setActiveTab('dashboard'); setSearchTerm(''); }}
                    >
                        📊 Dashboard
                    </button>
                )}
                {isAdminOrSuper() && (
                    <button
                        className={`px-6 py-2.5 rounded-t-lg font-semibold text-sm transition-all flex items-center gap-2
                            ${activeTab === 'client' ? 'bg-bg-cream text-primary-dark shadow-sm translate-y-[1px]' : 'text-white/70 hover:text-white hover:bg-white/10'}`}
                        onClick={() => { setActiveTab('client'); setSearchTerm(''); setSelectedClientName(null); }}
                    >
                        🏢 Client
                    </button>
                )}
                <button
                    className={`px-6 py-2.5 rounded-t-lg font-semibold text-sm transition-all flex items-center gap-2
                        ${activeTab === 'wo' ? 'bg-bg-cream text-primary-dark shadow-sm translate-y-[1px]' : 'text-white/70 hover:text-white hover:bg-white/10'}`}
                    onClick={() => { setActiveTab('wo'); setSearchTerm(''); }}
                >
                    🛠️ WO
                </button>
                <button
                    className={`px-6 py-2.5 rounded-t-lg font-semibold text-sm transition-all flex items-center gap-2
                        ${activeTab === 'project' ? 'bg-bg-cream text-primary-dark shadow-sm translate-y-[1px]' : 'text-white/70 hover:text-white hover:bg-white/10'}`}
                    onClick={() => { setActiveTab('project'); setSearchTerm(''); }}
                >
                    📋 Project
                </button>

                <button
                    className={`px-6 py-2.5 rounded-t-lg font-semibold text-sm transition-all flex items-center gap-2
                        ${activeTab === 'daily' ? 'bg-bg-cream text-primary-dark shadow-sm translate-y-[1px]' : 'text-white/70 hover:text-white hover:bg-white/10'}`}
                    onClick={() => { setActiveTab('daily'); setSearchTerm(''); }}
                >
                    📅 Daily
                </button>
            </div>

            {/* Search and Sort Controls */}
            {activeTab !== 'dashboard' && activeTab !== 'client' && (
                <div className="bg-white p-4 shadow-sm border-b border-gray-200 flex flex-col md:flex-row gap-4 items-center justify-between sticky top-[60px] md:static z-40">
                    <div className="relative w-full md:w-96 group">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-accent-coral transition-colors">🔍</span>
                        <input
                            type="text"
                            placeholder={activeTab === 'project' ? 'Search projects...' : (activeTab === 'wo' ? 'Search work orders...' : 'Search daily activities...')}
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-10 pr-10 py-2 border-2 border-gray-200 rounded-full text-sm focus:outline-none focus:border-accent-coral focus:ring-4 focus:ring-accent-coral/10 transition-all bg-gray-50 focus:bg-white"
                        />
                        {searchTerm && (
                            <button className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-accent-coral" onClick={() => setSearchTerm('')}>✕</button>
                        )}
                    </div>
                    
                    <div className="flex gap-2 w-full md:w-auto overflow-x-auto pb-2 md:pb-0">
                         <div className="flex items-center gap-2 bg-gray-100 rounded-lg px-3 py-1.5 shrink-0">
                            <label className="text-xs font-bold text-gray-600">Sort:</label>
                            <select 
                                value={sortBy} 
                                onChange={(e) => setSortBy(e.target.value)}
                                className="bg-transparent border-none text-sm font-medium focus:ring-0 cursor-pointer text-gray-800"
                            >
                                <option value="sequence">Sequence (No.)</option>
                                <option value="name">{activeTab === 'project' ? 'Project Name' : (activeTab === 'wo' ? 'Client Name' : 'Client Name')}</option>
                                <option value="date">Date</option>
                                <option value="status">Status</option>
                            </select>
                        </div>

                        {/* Admin Actions - Desktop & Mobile Horizontal Scroll */}
                        {isAdminOrSuper() && (
                            <>
                                {activeTab === 'project' && (
                                     <button className="px-3 py-1.5 bg-white border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 hover:text-accent-coral hover:border-accent-coral transition-all shrink-0 flex items-center gap-1" onClick={handleCarryForward}>
                                        📥 <span className="hidden sm:inline">Carry Fwd</span>
                                    </button>
                                )}
                                <button className="px-3 py-1.5 bg-white border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 hover:text-accent-coral hover:border-accent-coral transition-all shrink-0 flex items-center gap-1" onClick={() => setIsCSVImportOpen(true)}>
                                    📤 <span className="hidden sm:inline">Import</span>
                                </button>
                                <button className="px-3 py-1.5 bg-white border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 hover:text-accent-coral hover:border-accent-coral transition-all shrink-0 flex items-center gap-1" onClick={() => setIsReportOpen(true)}>
                                    📊 <span className="hidden sm:inline">Report</span>
                                </button>
                                
                                {/* More Menu for Management (Hidden on Mobile usually, but let's keep accessible) */}
                                <div className="flex gap-1">
                                    <button className="p-2 bg-gray-100 rounded-lg hover:bg-accent-coral hover:text-white transition-colors" onClick={() => setIsCategoryMgmtOpen(true)} title="Manage Categories">🏷️</button>
                                    <button className="p-2 bg-gray-100 rounded-lg hover:bg-accent-coral hover:text-white transition-colors" onClick={() => setIsCaseTypeMgmtOpen(true)} title="Manage Case Types">📋</button>
                                    {user?.role === 'superuser' && (
                                         <button className="p-2 bg-gray-100 rounded-lg hover:bg-accent-coral hover:text-white transition-colors" onClick={() => setIsPicMemberMgmtOpen(true)} title="Manage PICs">👥</button>
                                    )}
                                </div>
                            </>
                        )}
                    </div>
                </div>
            )}
            </div>

            <main className="flex-1 p-4 md:p-6 overflow-x-hidden md:overflow-visible pb-24 md:pb-6">
                {activeTab === 'dashboard' ? (
                    <Dashboard user={user} onClientClick={handleClientClick} />
                ) : activeTab === 'client' ? (
                    <ClientTab
                        user={user}
                        selectedClientName={selectedClientName}
                        onClientSelect={setSelectedClientName}
                    />
                ) : loading ? (
                     <div className="flex flex-col items-center justify-center py-20">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-accent-coral"></div>
                        <p className="mt-4 text-gray-500 font-medium">Loading data...</p>
                    </div>
                ) : error ? (
                    <div className="bg-red-50 border-l-4 border-red-500 p-6 rounded-lg max-w-2xl mx-auto my-10 shadow-sm">
                        <div className="flex items-center gap-3 mb-2">
                             <span className="text-2xl">⚠️</span>
                             <h3 className="text-lg font-bold text-red-700">Connection Error</h3>
                        </div>
                        <p className="text-red-600 mb-4">{error}</p>
                        <button className="bg-red-600 text-white px-4 py-2 rounded-lg font-semibold hover:bg-red-700 transition-colors" onClick={fetchData}>
                            Retry Connection
                        </button>
                    </div>
                ) : activeTab === 'project' ? (
                    <SpreadsheetTable
                        projects={filteredProjects}
                        onEdit={handleEdit}
                        onDelete={handleDelete}
                        selectedIds={selectedProjectIds}
                        onSelectionChange={setSelectedProjectIds}
                        onBatchStatusUpdate={handleBatchStatusUpdate}
                        onAddEntry={handleAddEntryForProject}
                    />
                ) : activeTab === 'wo' ? (
                     <WOTable
                        workOrders={workOrders}
                        onEdit={handleEdit}
                        onDelete={handleDelete}
                        selectedIds={selectedWOIds}
                        onSelectionChange={setSelectedWOIds}
                        onBatchStatusUpdate={handleWOBatchStatusUpdate}
                    />
                ) : (
                    <DailyTable
                        dailies={filteredDailies}
                        onEdit={handleEdit}
                        onDelete={handleDelete}
                        selectedIds={selectedDailyIds}
                        onSelectionChange={setSelectedDailyIds}
                        onBatchStatusUpdate={handleDailyBatchStatusUpdate}
                        onAddEntry={handleAddEntryForClient}
                    />
                )}
            </main>

            {/* Mobile Bottom Navigation Bar */}
            <div className="md:hidden fixed bottom-0 left-0 w-full bg-primary-dark text-gray-400 flex justify-around items-center p-2 z-50 border-t border-gray-700 pb-safe">
                {isAdminOrSuper() && (
                    <button 
                        className={`flex flex-col items-center p-2 rounded-xl transition-all ${activeTab === 'dashboard' ? 'text-accent-coral bg-white/10' : 'hover:text-white'}`}
                        onClick={() => { setActiveTab('dashboard'); setSearchTerm(''); }}
                    >
                        <span className="text-xl mb-0.5">📊</span>
                        <span className="text-[10px] font-medium">Dash</span>
                    </button>
                )}
                {isAdminOrSuper() && (
                    <button 
                        className={`flex flex-col items-center p-2 rounded-xl transition-all ${activeTab === 'client' ? 'text-accent-coral bg-white/10' : 'hover:text-white'}`}
                        onClick={() => { setActiveTab('client'); setSearchTerm(''); setSelectedClientName(null); }}
                    >
                        <span className="text-xl mb-0.5">🏢</span>
                        <span className="text-[10px] font-medium">Client</span>
                    </button>
                )}
                <button 
                    className={`flex flex-col items-center p-2 rounded-xl transition-all ${activeTab === 'project' ? 'text-accent-coral bg-white/10' : 'hover:text-white'}`}
                    onClick={() => { setActiveTab('project'); setSearchTerm(''); }}
                >
                    <span className="text-xl mb-0.5">📋</span>
                    <span className="text-[10px] font-medium">Project</span>
                </button>
                <button 
                    className={`flex flex-col items-center p-2 rounded-xl transition-all ${activeTab === 'wo' ? 'text-accent-coral bg-white/10' : 'hover:text-white'}`}
                    onClick={() => { setActiveTab('wo'); setSearchTerm(''); }}
                >
                    <span className="text-xl mb-0.5">🛠️</span>
                    <span className="text-[10px] font-medium">WO</span>
                </button>
                <button 
                    className={`flex flex-col items-center p-2 rounded-xl transition-all ${activeTab === 'daily' ? 'text-accent-coral bg-white/10' : 'hover:text-white'}`}
                    onClick={() => { setActiveTab('daily'); setSearchTerm(''); }}
                >
                    <span className="text-xl mb-0.5">📅</span>
                    <span className="text-[10px] font-medium">Daily</span>
                </button>
                 {isAdminOrSuper() && (
                     <button 
                        className="flex flex-col items-center p-2 rounded-xl hover:text-white"
                        onClick={() => setIsActivityOpen(true)}
                    >
                        <span className="text-xl mb-0.5">⋮</span>
                        <span className="text-[10px] font-medium">Menu</span>
                    </button>
                 )}
            </div>

            {/* Modals & Components */}
            {activeTab === 'project' && (
                <EntryForm
                    isOpen={isFormOpen}
                    onClose={handleFormClose}
                    onSave={handleSave}
                    editData={editData}
                    user={user}
                />
            )}

            {activeTab === 'daily' && (
                <DailyEntryForm
                    isOpen={isFormOpen}
                    onClose={handleFormClose}
                    onSave={handleSave}
                    editData={editData}
                    user={user}
                />
            )}

            {activeTab === 'wo' && (
                <WOEntryForm
                    isOpen={isFormOpen}
                    onClose={handleFormClose}
                    onSave={handleSave}
                    editData={editData}
                    user={user}
                />
            )}

            {isAdminOrSuper() && (
                <ActivityLog token={token} isOpen={isActivityOpen} onClose={() => setIsActivityOpen(false)} />
            )}

            {isAdminOrSuper() && (
                <UserManagement token={token} isOpen={isUserMgmtOpen} onClose={() => setIsUserMgmtOpen(false)} currentUser={user} />
            )}

            <CSVImportModal isOpen={isCSVImportOpen} onClose={() => setIsCSVImportOpen(false)} onSuccess={handleCSVImportSuccess} apiType={activeTab} />
            
            <ReportModal isOpen={isReportOpen} onClose={() => setIsReportOpen(false)} apiType={activeTab} quarters={activeTab === 'project' ? projectQuarters : (activeTab === 'wo' ? woQuarters : dailyQuarters)} />
            
            {isAdminOrSuper() && <CategoryManagement isOpen={isCategoryMgmtOpen} onClose={() => setIsCategoryMgmtOpen(false)} />}
            {isAdminOrSuper() && <CaseTypeManagement isOpen={isCaseTypeMgmtOpen} onClose={() => setIsCaseTypeMgmtOpen(false)} />}
            {user?.role === 'superuser' && <PicMemberManagement isOpen={isPicMemberMgmtOpen} onClose={() => setIsPicMemberMgmtOpen(false)} />}
            
            <QuickAddModal isOpen={isQuickAddOpen} onClose={() => setIsQuickAddOpen(false)} onSave={handleQuickAddSave} entryName={quickAddName} entryType={quickAddType} />
            <PWAInstallPrompt />
        </div>
    );
}

export default App;
