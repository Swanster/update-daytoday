import { useState, useEffect, useCallback } from 'react';
import { clientsApi } from '../api/clients';
import { dailiesApi } from '../api/dailies';
import { toast } from 'react-toastify';

function ClientTab({ user, selectedClientName, onClientSelect }) {
    const [clients, setClients] = useState([]);
    const [selectedClient, setSelectedClient] = useState(null);
    const [clientDetail, setClientDetail] = useState(null);
    const [loading, setLoading] = useState(true);
    const [detailLoading, setDetailLoading] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [activeSubTab, setActiveSubTab] = useState('daily');
    const [error, setError] = useState(null);
    
    // Modal state for adding new entry
    const [showAddModal, setShowAddModal] = useState(false);
    const [newEntry, setNewEntry] = useState({
        date: new Date().toISOString().split('T')[0],
        picTeam: [],
        description: '',
        attachment: null
    });
    const [submitting, setSubmitting] = useState(false);

    // Fetch all clients
    const fetchClients = useCallback(async () => {
        try {
            setLoading(true);
            const data = await clientsApi.getAll();
            setClients(data);
            setError(null);
        } catch (err) {
            console.error('Fetch clients error:', err);
            setError('Failed to load clients');
        } finally {
            setLoading(false);
        }
    }, []);

    // Fetch client detail
    const fetchClientDetail = useCallback(async (clientName) => {
        try {
            setDetailLoading(true);
            const data = await clientsApi.getHistory(clientName);
            setClientDetail(data);
        } catch (err) {
            console.error('Fetch client detail error:', err);
            setClientDetail(null);
        } finally {
            setDetailLoading(false);
        }
    }, []);

    // Initial load
    useEffect(() => {
        fetchClients();
    }, [fetchClients]);

    // Handle external client selection (from Dashboard)
    useEffect(() => {
        if (selectedClientName && clients.length > 0) {
            const client = clients.find(c => c.clientName === selectedClientName);
            if (client) {
                setSelectedClient(client);
                fetchClientDetail(client.clientName);
            }
        }
    }, [selectedClientName, clients, fetchClientDetail]);

    // Handle client click
    const handleClientClick = (client) => {
        setSelectedClient(client);
        fetchClientDetail(client.clientName);
        if (onClientSelect) {
            onClientSelect(client.clientName);
        }
    };

    // Handle back details mobile
    const handleBackToList = () => {
        setSelectedClient(null);
        if (onClientSelect) onClientSelect(null);
    };

    // Handle add new entry
    const handleAddEntry = async (e) => {
        e.preventDefault();
        if (!selectedClient) return;
        
        setSubmitting(true);
        try {
            const entryData = {
                clientName: selectedClient.clientName,
                date: newEntry.date,
                picTeam: newEntry.picTeam,
                detailAction: newEntry.description,
                services: [],
                caseIssue: [],
                action: '',
                status: 'Progress'
            };
            
            await dailiesApi.create(entryData);
            
            // TODO: Handle file upload if attachment exists
            // if (newEntry.attachment) {
            //     await dailiesApi.uploadAttachment(result._id, newEntry.attachment);
            // }
            
            // Refresh client detail
            fetchClientDetail(selectedClient.clientName);
            
            // Close modal and reset form
            setShowAddModal(false);
            setNewEntry({
                date: new Date().toISOString().split('T')[0],
                picTeam: [],
                description: '',
                attachment: null
            });
            toast.success('Entry added successfully!');
        } catch (err) {
            console.error('Add entry error:', err);
            toast.error('Failed to add entry: ' + (err.response?.data?.message || err.message));
        } finally {
            setSubmitting(false);
        }
    };

    // Handle PIC input (comma separated)
    const handlePicChange = (e) => {
        const value = e.target.value;
        // Convert comma-separated string to array
        const picArray = value.split(',').map(p => p.trim()).filter(p => p);
        setNewEntry(prev => ({ ...prev, picTeam: picArray, picInput: value }));
    };

    // Filter clients by search
    const filteredClients = clients.filter(c =>
        c.clientName.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const formatDate = (dateString) => {
        if (!dateString) return '-';
        return new Date(dateString).toLocaleDateString('en-GB', {
            day: '2-digit',
            month: 'short',
            year: 'numeric'
        });
    };

    const getMaxCount = (items) => {
        if (!items || items.length === 0) return 1;
        return Math.max(...items.map(i => i.count || i.total || 0));
    };

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center h-full text-ch-primary">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-ch-primary mb-4"></div>
                <p className="animate-pulse">Loading clients...</p>
            </div>
        );
    }

    if (error) {
        return (
            <div className="flex flex-col items-center justify-center h-full text-red-500 p-8 text-center">
                <div className="text-4xl mb-4">⚠️</div>
                <h3 className="text-xl font-bold mb-2">Error Loading Clients</h3>
                <p className="mb-4">{error}</p>
                <button 
                    className="px-4 py-2 bg-ch-primary text-white rounded-lg hover:bg-ch-primary transition-colors shadow-sm"
                    onClick={fetchClients}
                >
                    Retry
                </button>
            </div>
        );
    }

    return (
        <div className="flex h-[calc(100vh-theme(spacing.24))] md:h-[calc(100vh-theme(spacing.20))] bg-white rounded-xl shadow-custom overflow-hidden border border-ch-soft">
            {/* Client List Panel */}
            <div className={`w-full md:w-80 lg:w-96 flex flex-col border-r border-ch-soft bg-white z-10 ${selectedClient ? 'hidden md:flex' : 'flex'}`}>
                <div className="p-4 border-b border-ch-soft bg-ch-light/50">
                    <div className="flex items-center justify-between mb-3">
                        <h3 className="font-bold text-ch-dark flex items-center gap-2">
                             🏢 Clients
                        </h3>
                        <span className="bg-ch-soft text-ch-primary text-xs px-2 py-0.5 rounded-full font-bold">
                            {clients.length}
                        </span>
                    </div>
                    <div className="relative">
                        <span className="absolute left-3 top-2.5 text-ch-primary">🔍</span>
                        <input
                            type="text"
                            placeholder="Search clients..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-9 pr-8 py-2 bg-white border border-ch-soft rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-ch-primary/20 focus:border-ch-primary transition-all"
                        />
                        {searchTerm && (
                            <button 
                                className="absolute right-3 top-2.5 text-ch-primary hover:text-ch-dark"
                                onClick={() => setSearchTerm('')}
                            >
                                ✕
                            </button>
                        )}
                    </div>
                </div>
                <div className="flex-1 overflow-y-auto custom-scrollbar p-2 space-y-1">
                    {filteredClients.length === 0 ? (
                        <div className="text-center py-8 text-ch-primary text-sm">No clients found</div>
                    ) : (
                        filteredClients.map((client) => (
                            <div
                                key={client.clientName}
                                className={`p-3 rounded-lg cursor-pointer transition-all border border-transparent ${selectedClient?.clientName === client.clientName ? 'bg-ch-soft border-ch-soft shadow-sm' : 'hover:bg-ch-light hover:border-ch-soft'}`}
                                onClick={() => handleClientClick(client)}
                            >
                                <div className={`font-semibold text-sm mb-1.5 ${selectedClient?.clientName === client.clientName ? 'text-ch-dark' : 'text-ch-dark'}`}>
                                    {client.clientName}
                                </div>
                                <div className="flex gap-2">
                                    <span className="text-[10px] px-1.5 py-0.5 bg-blue-50 text-blue-600 rounded border border-blue-100" title="Total Daily Entries">
                                        📅 {client.totalDaily}
                                    </span>
                                    <span className="text-[10px] px-1.5 py-0.5 bg-emerald-50 text-emerald-600 rounded border border-emerald-100" title="Total Projects">
                                        📋 {client.totalProjects}
                                    </span>
                                    {client.openIssues > 0 && (
                                        <span className="text-[10px] px-1.5 py-0.5 bg-orange-50 text-orange-600 rounded border border-orange-100 font-bold" title="Open Issues">
                                            ⚠️ {client.openIssues}
                                        </span>
                                    )}
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>

            {/* Client Detail Panel */}
            <div className={`flex-1 flex flex-col bg-ch-light/30 overflow-hidden relative ${!selectedClient ? 'hidden md:flex' : 'flex'}`}>
                {!selectedClient ? (
                    <div className="flex-1 flex flex-col items-center justify-center text-ch-primary bg-ch-light/50">
                        <div className="text-5xl mb-4 opacity-50">👈</div>
                        <h3 className="text-xl font-bold text-ch-dark mb-2">Select a Client</h3>
                        <p className="text-sm">Click on a client from the list to view their activity history</p>
                    </div>
                ) : detailLoading ? (
                    <div className="flex-1 flex flex-col items-center justify-center text-ch-primary">
                        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-ch-primary mb-4"></div>
                        <p className="animate-pulse">Loading client details...</p>
                    </div>
                ) : clientDetail ? (
                    <>
                        {/* Client Header */}
                        <div className="px-6 py-4 bg-white border-b border-ch-soft flex items-center justify-between shadow-sm z-10">
                            <div className="flex items-center gap-3">
                                <button 
                                    className="md:hidden p-2 -ml-2 text-ch-primary hover:text-ch-dark hover:bg-ch-soft rounded-lg transition-colors"
                                    onClick={handleBackToList}
                                >
                                    ←
                                </button>
                                <h2 className="text-xl font-bold text-ch-dark truncate">{clientDetail.clientName}</h2>
                            </div>
                            <button 
                                className="hidden md:flex items-center gap-2 px-3 py-1.5 bg-ch-soft text-ch-primary rounded-lg hover:bg-ch-soft transition-colors text-sm font-medium"
                                onClick={() => {/* Extra action if needed */}}
                            >
                                🏢 Profile
                            </button>
                        </div>

                        <div className="flex-1 overflow-y-auto custom-scrollbar p-4 md:p-6 space-y-6">
                            {/* Summary Cards */}
                            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 md:gap-4">
                                <div className="bg-white p-3 md:p-4 rounded-xl shadow-sm border border-ch-soft flex flex-col items-center justify-center text-center">
                                    <div className="text-2xl mb-1">📅</div>
                                    <div className="text-lg font-bold text-ch-dark">{clientDetail.summary.totalDaily}</div>
                                    <div className="text-[10px] uppercase tracking-wide text-ch-primary font-bold">Daily Entries</div>
                                </div>
                                <div className="bg-white p-3 md:p-4 rounded-xl shadow-sm border border-ch-soft flex flex-col items-center justify-center text-center">
                                    <div className="text-2xl mb-1">📋</div>
                                    <div className="text-lg font-bold text-ch-dark">{clientDetail.summary.totalProjects}</div>
                                    <div className="text-[10px] uppercase tracking-wide text-ch-primary font-bold">Projects</div>
                                </div>
                                <div className="bg-orange-50 p-3 md:p-4 rounded-xl shadow-sm border border-orange-100 flex flex-col items-center justify-center text-center">
                                    <div className="text-2xl mb-1">⚠️</div>
                                    <div className="text-lg font-bold text-orange-600">{clientDetail.summary.openDaily + clientDetail.summary.openProjects}</div>
                                    <div className="text-[10px] uppercase tracking-wide text-orange-400 font-bold">Open Issues</div>
                                </div>
                                <div className="bg-green-50 p-3 md:p-4 rounded-xl shadow-sm border border-green-100 flex flex-col items-center justify-center text-center">
                                    <div className="text-2xl mb-1">✅</div>
                                    <div className="text-lg font-bold text-green-600">{clientDetail.summary.doneDaily + clientDetail.summary.doneProjects}</div>
                                    <div className="text-[10px] uppercase tracking-wide text-green-400 font-bold">Resolved</div>
                                </div>
                                <div className="bg-white p-3 md:p-4 rounded-xl shadow-sm border border-ch-soft flex flex-col items-center justify-center text-center">
                                    <div className="text-2xl mb-1">🏃</div>
                                    <div className="text-lg font-bold text-ch-dark">{clientDetail.summary.onsiteCount}</div>
                                    <div className="text-[10px] uppercase tracking-wide text-ch-primary font-bold">Onsite</div>
                                </div>
                                <div className="bg-white p-3 md:p-4 rounded-xl shadow-sm border border-ch-soft flex flex-col items-center justify-center text-center">
                                    <div className="text-2xl mb-1">💻</div>
                                    <div className="text-lg font-bold text-ch-dark">{clientDetail.summary.remoteCount}</div>
                                    <div className="text-[10px] uppercase tracking-wide text-ch-primary font-bold">Remote</div>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                                {/* Case Breakdown */}
                                {clientDetail.caseBreakdown && clientDetail.caseBreakdown.length > 0 && (
                                    <div className="bg-white p-5 rounded-xl shadow-sm border border-ch-soft">
                                        <h3 className="text-sm font-bold text-ch-dark uppercase tracking-wide mb-4">🔥 Most Common Cases</h3>
                                        <div className="space-y-3">
                                            {clientDetail.caseBreakdown.map((item, index) => (
                                                <div key={index} className="flex items-center gap-3">
                                                    <div className="w-24 text-xs font-semibold text-ch-dark truncate" title={item.caseType}>
                                                        {item.caseType}
                                                    </div>
                                                    <div className="flex-1 bg-ch-soft rounded-full h-2 overflow-hidden">
                                                        <div
                                                            className="h-full bg-gradient-to-r from-orange-400 to-pink-500 rounded-full"
                                                            style={{ width: `${(item.count / getMaxCount(clientDetail.caseBreakdown)) * 100}%` }}
                                                        ></div>
                                                    </div>
                                                    <div className="w-8 text-xs font-bold text-ch-dark text-right">{item.count}</div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {/* Services Breakdown */}
                                {clientDetail.servicesBreakdown && clientDetail.servicesBreakdown.length > 0 && (
                                    <div className="bg-white p-5 rounded-xl shadow-sm border border-ch-soft">
                                        <h3 className="text-sm font-bold text-ch-dark uppercase tracking-wide mb-4">🛠️ Services Provided</h3>
                                        <div className="flex flex-wrap gap-2">
                                            {clientDetail.servicesBreakdown.map((item, index) => (
                                                <span key={index} className="inline-flex items-center px-2.5 py-1 rounded-lg bg-ch-soft text-ch-dark border border-ch-soft text-xs font-medium">
                                                    {item.service} 
                                                    <span className="ml-1.5 px-1.5 py-0.5 bg-white text-ch-primary rounded shadow-sm text-[10px] font-bold">
                                                        {item.count}
                                                    </span>
                                                </span>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* Activity by Year */}
                            {clientDetail.activityByYear && clientDetail.activityByYear.length > 0 && (
                                <div className="bg-white p-5 rounded-xl shadow-sm border border-ch-soft">
                                    <h3 className="text-sm font-bold text-ch-dark uppercase tracking-wide mb-4">📊 Activity by Year</h3>
                                    <div className="space-y-4">
                                        {clientDetail.activityByYear.map((item) => (
                                            <div key={item.year} className="flex items-center gap-4">
                                                <div className="w-12 text-sm font-bold text-ch-dark">{item.year}</div>
                                                <div className="flex-1 flex gap-1 h-3 bg-ch-soft rounded-full overflow-hidden">
                                                    <div
                                                        className="h-full bg-blue-400 hover:bg-blue-500 transition-colors"
                                                        style={{ width: `${(item.daily / item.total) * 100}%` }}
                                                        title={`Daily: ${item.daily}`}
                                                    ></div>
                                                    <div
                                                        className="h-full bg-emerald-400 hover:bg-emerald-500 transition-colors"
                                                        style={{ width: `${(item.projects / item.total) * 100}%` }}
                                                        title={`Projects: ${item.projects}`}
                                                    ></div>
                                                </div>
                                                <div className="w-12 text-sm font-bold text-ch-dark text-right">{item.total}</div>
                                            </div>
                                        ))}
                                    </div>
                                    <div className="flex justify-end gap-4 mt-3 text-xs font-medium text-ch-primary">
                                        <span className="flex items-center gap-1"><div className="w-2 h-2 bg-blue-400 rounded-full"></div> Daily</span>
                                        <span className="flex items-center gap-1"><div className="w-2 h-2 bg-emerald-400 rounded-full"></div> Projects</span>
                                    </div>
                                </div>
                            )}

                            {/* Activity History */}
                            <div className="bg-white rounded-xl shadow-sm border border-ch-soft overflow-hidden">
                                <div className="p-4 border-b border-ch-soft flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-ch-light/30">
                                    <h3 className="text-lg font-bold text-ch-dark">📋 Activity History</h3>
                                    <div className="flex p-1 bg-ch-soft rounded-lg">
                                        <button
                                            className={`flex-1 sm:flex-none px-4 py-1.5 text-xs font-bold rounded-md transition-all ${activeSubTab === 'daily' ? 'bg-white text-ch-primary shadow-sm' : 'text-ch-primary hover:text-ch-dark'}`}
                                            onClick={() => setActiveSubTab('daily')}
                                        >
                                            📅 Daily ({clientDetail.dailyEntries?.length || 0})
                                        </button>
                                        <button
                                            className={`flex-1 sm:flex-none px-4 py-1.5 text-xs font-bold rounded-md transition-all ${activeSubTab === 'projects' ? 'bg-white text-emerald-600 shadow-sm' : 'text-ch-primary hover:text-ch-dark'}`}
                                            onClick={() => setActiveSubTab('projects')}
                                        >
                                            📋 Projects ({clientDetail.projectEntries?.length || 0})
                                        </button>
                                    </div>
                                </div>

                                <div className="overflow-x-auto">
                                    {activeSubTab === 'daily' ? (
                                        <table className="w-full text-sm text-left border-collapse">
                                            <thead className="bg-ch-light text-ch-dark font-semibold uppercase text-xs">
                                                <tr>
                                                    <th className="px-4 py-3 whitespace-nowrap">Date</th>
                                                    <th className="px-4 py-3">Case/Issue</th>
                                                    <th className="px-4 py-3 whitespace-nowrap">Action</th>
                                                    <th className="px-4 py-3 whitespace-nowrap">Status</th>
                                                    <th className="px-4 py-3 whitespace-nowrap">PIC Team</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-ch-soft">
                                                {clientDetail.dailyEntries?.length === 0 ? (
                                                    <tr>
                                                        <td colSpan="5" className="p-8 text-center text-ch-primary">No daily entries</td>
                                                    </tr>
                                                ) : (
                                                    clientDetail.dailyEntries?.map((entry) => (
                                                        <tr key={entry._id} className="hover:bg-ch-light transition-colors">
                                                            <td className="px-4 py-3 font-mono text-xs whitespace-nowrap text-ch-dark">{formatDate(entry.date)}</td>
                                                            <td className="px-4 py-3 max-w-xs truncate" title={entry.caseIssue}>{entry.caseIssue || '-'}</td>
                                                            <td className="px-4 py-3 whitespace-nowrap">
                                                                <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium border ${
                                                                    entry.action?.toLowerCase().includes('monitor') ? 'bg-ch-soft text-ch-dark border-ch-soft' : 
                                                                    entry.action?.toLowerCase().includes('config') ? 'bg-purple-50 text-purple-700 border-purple-100' : 
                                                                    'bg-ch-light text-ch-dark border-ch-soft'
                                                                }`}>
                                                                    {entry.action || '-'}
                                                                </span>
                                                            </td>
                                                            <td className="px-4 py-3 whitespace-nowrap">
                                                                <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium border ${
                                                                    entry.status?.toLowerCase() === 'done' ? 'bg-green-50 text-green-700 border-green-100' :
                                                                    'bg-yellow-50 text-yellow-700 border-yellow-100'
                                                                }`}>
                                                                    {entry.status || '-'}
                                                                </span>
                                                            </td>
                                                            <td className="px-4 py-3">
                                                                <div className="flex flex-wrap gap-1">
                                                                    {entry.picTeam?.slice(0, 2).map((pic, idx) => (
                                                                        <span key={idx} className="bg-ch-soft text-ch-dark px-1.5 py-0.5 rounded text-[10px] border border-ch-soft">{pic}</span>
                                                                    ))}
                                                                    {entry.picTeam?.length > 2 && (
                                                                        <span className="bg-ch-soft text-ch-dark px-1.5 py-0.5 rounded text-[10px] border border-ch-soft">+{entry.picTeam.length - 2}</span>
                                                                    )}
                                                                </div>
                                                            </td>
                                                        </tr>
                                                    ))
                                                )}
                                                {/* Add Entry Row */}
                                                <tr 
                                                    className="bg-ch-soft/50 hover:bg-ch-soft cursor-pointer transition-colors border-t-2 border-dashed border-ch-soft"
                                                    onClick={() => setShowAddModal(true)}
                                                >
                                                    <td colSpan="5" className="p-3 text-center text-ch-primary font-bold text-sm">
                                                        <span className="flex items-center justify-center gap-2">➕ Add New Entry</span>
                                                    </td>
                                                </tr>
                                            </tbody>
                                        </table>
                                    ) : (
                                        <table className="w-full text-sm text-left border-collapse">
                                            <thead className="bg-ch-light text-ch-dark font-semibold uppercase text-xs">
                                                <tr>
                                                    <th className="px-4 py-3 whitespace-nowrap">Date</th>
                                                    <th className="px-4 py-3 whitespace-nowrap">Quarter</th>
                                                    <th className="px-4 py-3">Services</th>
                                                    <th className="px-4 py-3 whitespace-nowrap">Status</th>
                                                    <th className="px-4 py-3 whitespace-nowrap">PIC Team</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-ch-soft">
                                                {clientDetail.projectEntries?.length === 0 ? (
                                                    <tr>
                                                        <td colSpan="5" className="p-8 text-center text-ch-primary">No project entries</td>
                                                    </tr>
                                                ) : (
                                                    clientDetail.projectEntries?.map((entry) => (
                                                        <tr key={entry._id} className="hover:bg-ch-light transition-colors">
                                                            <td className="px-4 py-3 font-mono text-xs whitespace-nowrap text-ch-dark">{formatDate(entry.date)}</td>
                                                            <td className="px-4 py-3 text-ch-dark">{entry.quarter || '-'}</td>
                                                            <td className="px-4 py-3">
                                                                <div className="flex flex-wrap gap-1">
                                                                    {Array.isArray(entry.services) ? (
                                                                        entry.services.slice(0, 2).map((s, idx) => (
                                                                            <span key={idx} className="bg-emerald-50 text-emerald-700 px-1.5 py-0.5 rounded text-[10px] border border-emerald-100">{s}</span>
                                                                        ))
                                                                    ) : entry.services ? (
                                                                        <span className="bg-emerald-50 text-emerald-700 px-1.5 py-0.5 rounded text-[10px] border border-emerald-100">{entry.services}</span>
                                                                    ) : '-'}
                                                                </div>
                                                            </td>
                                                            <td className="px-4 py-3 whitespace-nowrap">
                                                                <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium border ${
                                                                    entry.status?.toLowerCase().includes('done') ? 'bg-green-50 text-green-700 border-green-100' :
                                                                    'bg-blue-50 text-blue-700 border-blue-100'
                                                                }`}>
                                                                    {entry.status || '-'}
                                                                </span>
                                                            </td>
                                                            <td className="px-4 py-3">
                                                                <div className="flex flex-wrap gap-1">
                                                                    {entry.picTeam?.slice(0, 2).map((pic, idx) => (
                                                                        <span key={idx} className="bg-ch-soft text-ch-dark px-1.5 py-0.5 rounded text-[10px] border border-ch-soft">{pic}</span>
                                                                    ))}
                                                                </div>
                                                            </td>
                                                        </tr>
                                                    ))
                                                )}
                                            </tbody>
                                        </table>
                                    )}
                                </div>
                            </div>
                        </div>
                    </>
                ) : (
                    <div className="flex-1 flex flex-col items-center justify-center text-red-400">
                        <div className="text-4xl mb-4">⚠️</div>
                        <p>Unable to load client details</p>
                    </div>
                )}
            </div>

            {/* Add Entry Modal */}
            {showAddModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-fade-in" onClick={() => setShowAddModal(false)}>
                    <div 
                        className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden animate-scale-in border border-ch-soft" 
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="px-6 py-4 border-b border-ch-soft bg-ch-light flex items-center justify-between">
                            <h3 className="font-bold text-lg text-ch-dark">➕ Add Entry for {selectedClient?.clientName}</h3>
                            <button className="w-8 h-8 flex items-center justify-center rounded-full bg-white text-ch-primary hover:text-ch-dark hover:bg-ch-soft border border-ch-soft transition-all shadow-sm" onClick={() => setShowAddModal(false)}>✕</button>
                        </div>
                        <form onSubmit={handleAddEntry}>
                            <div className="p-6 space-y-4">
                                <div>
                                    <label className="block text-sm font-semibold text-ch-dark mb-1.5">📅 Date</label>
                                    <input
                                        type="date"
                                        value={newEntry.date}
                                        onChange={(e) => setNewEntry(prev => ({ ...prev, date: e.target.value }))}
                                        required
                                        className="w-full px-4 py-2.5 bg-ch-light border border-ch-soft rounded-xl focus:outline-none focus:ring-2 focus:ring-ch-primary/20 focus:border-ch-primary transition-all font-mono text-sm"
                                    />
                                </div>
                                
                                <div>
                                    <label className="block text-sm font-semibold text-ch-dark mb-1.5">👤 PIC</label>
                                    <input
                                        type="text"
                                        placeholder="Enter names (comma separated)"
                                        value={newEntry.picInput || ''}
                                        onChange={handlePicChange}
                                        className="w-full px-4 py-2.5 bg-ch-light border border-ch-soft rounded-xl focus:outline-none focus:ring-2 focus:ring-ch-primary/20 focus:border-ch-primary transition-all text-sm mb-2"
                                    />
                                    {newEntry.picTeam.length > 0 && (
                                        <div className="flex flex-wrap gap-2">
                                            {newEntry.picTeam.map((pic, idx) => (
                                                <span key={idx} className="px-2 py-1 bg-ch-soft text-ch-dark rounded-lg text-xs font-medium border border-ch-soft">{pic}</span>
                                            ))}
                                        </div>
                                    )}
                                </div>
                                
                                <div>
                                    <label className="block text-sm font-semibold text-ch-dark mb-1.5">📝 Description</label>
                                    <textarea
                                        placeholder="Describe the activity..."
                                        value={newEntry.description}
                                        onChange={(e) => setNewEntry(prev => ({ ...prev, description: e.target.value }))}
                                        rows={3}
                                        className="w-full px-4 py-2.5 bg-ch-light border border-ch-soft rounded-xl focus:outline-none focus:ring-2 focus:ring-ch-primary/20 focus:border-ch-primary transition-all text-sm"
                                    />
                                </div>
                                
                                <div>
                                    <label className="block text-sm font-semibold text-ch-dark mb-1.5">📎 Attachment</label>
                                    <div className="relative">
                                        <input
                                            type="file"
                                            onChange={(e) => setNewEntry(prev => ({ ...prev, attachment: e.target.files[0] }))}
                                            className="block w-full text-sm text-ch-primary file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-ch-soft file:text-ch-dark hover:file:bg-ch-soft transition-all"
                                        />
                                    </div>
                                    {newEntry.attachment && (
                                        <div className="mt-2 text-xs text-green-600 flex items-center gap-1 font-medium bg-green-50 p-2 rounded-lg border border-green-100">
                                            📄 {newEntry.attachment.name}
                                        </div>
                                    )}
                                </div>
                            </div>
                            
                            <div className="px-6 py-4 bg-ch-light border-t border-ch-soft flex justify-end gap-3">
                                <button type="button" className="px-4 py-2 text-ch-dark font-bold text-sm hover:bg-ch-soft/50 rounded-xl transition-colors" onClick={() => setShowAddModal(false)}>
                                    Cancel
                                </button>
                                <button type="submit" className="px-6 py-2 bg-ch-primary text-white font-bold text-sm rounded-xl hover:bg-ch-dark focus:ring-4 focus:ring-ch-primary/30 transition-all shadow-md disabled:opacity-70 disabled:cursor-not-allowed" disabled={submitting}>
                                    {submitting ? 'Adding...' : 'Add Entry'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}

export default ClientTab;
