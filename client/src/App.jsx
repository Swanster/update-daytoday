import { useState, useEffect } from 'react';
import SpreadsheetTable from './components/SpreadsheetTable';
import DailyTable from './components/DailyTable';
import EntryForm from './components/EntryForm';
import DailyEntryForm from './components/DailyEntryForm';
import LoginForm from './components/LoginForm';
import ActivityLog from './components/ActivityLog';
import UserManagement from './components/UserManagement';
import { projectsApi } from './api/projects';
import { dailiesApi } from './api/dailies';

function App() {
    const [user, setUser] = useState(null);
    const [token, setToken] = useState(null);
    const [activeTab, setActiveTab] = useState('project');
    const [projects, setProjects] = useState([]);
    const [dailies, setDailies] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [isActivityOpen, setIsActivityOpen] = useState(false);
    const [isUserMgmtOpen, setIsUserMgmtOpen] = useState(false);
    const [editData, setEditData] = useState(null);
    const [error, setError] = useState(null);

    // Quarterly state
    const [quarters, setQuarters] = useState([]);
    const [selectedQuarter, setSelectedQuarter] = useState(null);

    // Check if user is admin or superuser
    const isAdminOrSuper = () => {
        return user && (user.role === 'admin' || user.role === 'superuser');
    };

    // Check for saved auth on mount
    useEffect(() => {
        const savedToken = localStorage.getItem('token');
        const savedUser = localStorage.getItem('user');
        if (savedToken && savedUser) {
            setToken(savedToken);
            setUser(JSON.parse(savedUser));
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

    // Initialize current quarter
    useEffect(() => {
        const current = getCurrentQuarter();
        setSelectedQuarter(current);
    }, []);

    // Fetch data when tab or quarter changes
    useEffect(() => {
        if (selectedQuarter && user) {
            fetchData();
            fetchQuarters();
        }
    }, [activeTab, selectedQuarter, user]);

    const fetchQuarters = async () => {
        try {
            const api = activeTab === 'project' ? projectsApi : dailiesApi;
            const data = await api.getQuarters();

            const current = getCurrentQuarter();
            if (!data.find(q => q.quarter === current.quarter)) {
                data.unshift(current);
            }

            setQuarters(data);
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
    };

    const handleLogout = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        setUser(null);
        setToken(null);
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
            } catch (err) {
                console.error('Error deleting entry:', err);
                alert('Failed to delete entry. Please try again.');
            }
        }
    };

    const handleSave = async (formData) => {
        if (activeTab === 'project') {
            if (editData && editData._id) {
                await projectsApi.update(editData._id, formData);
            } else {
                await projectsApi.create(formData);
            }
        } else {
            if (editData && editData._id) {
                await dailiesApi.update(editData._id, formData);
            } else {
                await dailiesApi.create(formData);
            }
        }
        await fetchData();
        await fetchQuarters();
    };

    const handleFormClose = () => {
        setIsFormOpen(false);
        setEditData(null);
    };

    const handleQuarterChange = (e) => {
        const value = e.target.value;
        const [quarter, year] = value.split('|');
        setSelectedQuarter({ quarter, year: parseInt(year) });
    };

    // Show login if not authenticated
    if (!user) {
        return <LoginForm onLogin={handleLogin} />;
    }

    return (
        <div className="app">
            <header className="app-header">
                <h1>PROJECT SURVEY TRACKER</h1>

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
                <button
                    className={`tab-btn ${activeTab === 'project' ? 'active' : ''}`}
                    onClick={() => setActiveTab('project')}
                >
                    📋 Project
                </button>
                <button
                    className={`tab-btn ${activeTab === 'daily' ? 'active' : ''}`}
                    onClick={() => setActiveTab('daily')}
                >
                    📅 Daily
                </button>
            </div>

            <main className="app-container">
                {loading ? (
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
                        projects={projects}
                        onEdit={handleEdit}
                        onDelete={handleDelete}
                    />
                ) : (
                    <DailyTable
                        dailies={dailies}
                        onEdit={handleEdit}
                        onDelete={handleDelete}
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
                />
            )}

            {/* Daily Entry Form */}
            {activeTab === 'daily' && (
                <DailyEntryForm
                    isOpen={isFormOpen}
                    onClose={handleFormClose}
                    onSave={handleSave}
                    editData={editData}
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
        </div>
    );
}

export default App;
