import { useState, useEffect, useCallback } from 'react';
import { clientsApi } from '../api/clients';
import { dailiesApi } from '../api/dailies';
// import './ClientTab.css'; // Removed custom CSS

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
        } catch (err) {
            console.error('Add entry error:', err);
            alert('Failed to add entry: ' + (err.response?.data?.message || err.message));
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
            <div className="flex flex-col items-center justify-center h-full text-indigo-500">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-500 mb-4"></div>
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
                    className="px-4 py-2 bg-indigo-500 text-white rounded-lg hover:bg-indigo-600 transition-colors shadow-sm"
                    onClick={fetchClients}
                >
                    Retry
                </button>
            </div>
        );
    }

    return (
        <div className="flex h-[calc(100vh-theme(spacing.24))] md:h-[calc(100vh-theme(spacing.20))] bg-white rounded-xl shadow-custom overflow-hidden border border-gray-100">
            {/* Client List Panel */}
            <div className={`w-full md:w-80 lg:w-96 flex flex-col border-r border-gray-100 bg-white z-10 ${selectedClient ? 'hidden md:flex' : 'flex'}`}>
                <div className="p-4 border-b border-gray-100 bg-gray-50/50">
                    <div className="flex items-center justify-between mb-3">
                        <h3 className="font-bold text-gray-800 flex items-center gap-2">
                             🏢 Clients
                        </h3>
                        <span className="bg-indigo-100 text-indigo-600 text-xs px-2 py-0.5 rounded-full font-bold">
                            {clients.length}
                        </span>
                    </div>
                    <div className="relative">
                        <span className="absolute left-3 top-2.5 text-gray-400">🔍</span>
                        <input
                            type="text"
                            placeholder="Search clients..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-9 pr-8 py-2 bg-white border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
                        />
                        {searchTerm && (
                            <button 
                                className="absolute right-3 top-2.5 text-gray-400 hover:text-gray-600"
                                onClick={() => setSearchTerm('')}
                            >
                                ✕
                            </button>
                        )}
                    </div>
                </div>
                <div className="flex-1 overflow-y-auto custom-scrollbar p-2 space-y-1">
                    {filteredClients.length === 0 ? (
                        <div className="text-center py-8 text-gray-400 text-sm">No clients found</div>
                    ) : (
                        filteredClients.map((client) => (
                            <div
                                key={client.clientName}
                                className={`p-3 rounded-lg cursor-pointer transition-all border border-transparent ${selectedClient?.clientName === client.clientName ? 'bg-indigo-50 border-indigo-100 shadow-sm' : 'hover:bg-gray-50 hover:border-gray-100'}`}
                                onClick={() => handleClientClick(client)}
                            >
                                <div className={`font-semibold text-sm mb-1.5 ${selectedClient?.clientName === client.clientName ? 'text-indigo-700' : 'text-gray-700'}`}>
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
            <div className={`flex-1 flex flex-col bg-gray-50/30 overflow-hidden relative ${!selectedClient ? 'hidden md:flex' : 'flex'}`}>
                {!selectedClient ? (
                    <div className="flex-1 flex flex-col items-center justify-center text-gray-400 bg-gray-50/50">
                        <div className="text-5xl mb-4 opacity-50">👈</div>
                        <h3 className="text-xl font-bold text-gray-600 mb-2">Select a Client</h3>
                        <p className="text-sm">Click on a client from the list to view their activity history</p>
                    </div>
                ) : detailLoading ? (
                    <div className="flex-1 flex flex-col items-center justify-center text-indigo-500">
                        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-indigo-500 mb-4"></div>
                        <p className="animate-pulse">Loading client details...</p>
                    </div>
                ) : clientDetail ? (
                    <>
                        {/* Client Header */}
                        <div className="px-6 py-4 bg-white border-b border-gray-100 flex items-center justify-between shadow-sm z-10">
                            <div className="flex items-center gap-3">
                                <button 
                                    className="md:hidden p-2 -ml-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
                                    onClick={handleBackToList}
                                >
                                    ←
                                </button>
                                <h2 className="text-xl font-bold text-gray-800 truncate">{clientDetail.clientName}</h2>
                            </div>
                            <button 
                                className="hidden md:flex items-center gap-2 px-3 py-1.5 bg-indigo-50 text-indigo-600 rounded-lg hover:bg-indigo-100 transition-colors text-sm font-medium"
                                onClick={() => {/* Extra action if needed */}}
                            >
                                🏢 Profile
                            </button>
                        </div>

                        <div className="flex-1 overflow-y-auto custom-scrollbar p-4 md:p-6 space-y-6">
                            {/* Summary Cards */}
                            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 md:gap-4">
                                <div className="bg-white p-3 md:p-4 rounded-xl shadow-sm border border-gray-100 flex flex-col items-center justify-center text-center">
                                    <div className="text-2xl mb-1">📅</div>
                                    <div className="text-lg font-bold text-gray-800">{clientDetail.summary.totalDaily}</div>
                                    <div className="text-[10px] uppercase tracking-wide text-gray-400 font-bold">Daily Entries</div>
                                </div>
                                <div className="bg-white p-3 md:p-4 rounded-xl shadow-sm border border-gray-100 flex flex-col items-center justify-center text-center">
                                    <div className="text-2xl mb-1">📋</div>
                                    <div className="text-lg font-bold text-gray-800">{clientDetail.summary.totalProjects}</div>
                                    <div className="text-[10px] uppercase tracking-wide text-gray-400 font-bold">Projects</div>
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
                                <div className="bg-white p-3 md:p-4 rounded-xl shadow-sm border border-gray-100 flex flex-col items-center justify-center text-center">
                                    <div className="text-2xl mb-1">🏃</div>
                                    <div className="text-lg font-bold text-gray-800">{clientDetail.summary.onsiteCount}</div>
                                    <div className="text-[10px] uppercase tracking-wide text-gray-400 font-bold">Onsite</div>
                                </div>
                                <div className="bg-white p-3 md:p-4 rounded-xl shadow-sm border border-gray-100 flex flex-col items-center justify-center text-center">
                                    <div className="text-2xl mb-1">💻</div>
                                    <div className="text-lg font-bold text-gray-800">{clientDetail.summary.remoteCount}</div>
                                    <div className="text-[10px] uppercase tracking-wide text-gray-400 font-bold">Remote</div>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                                {/* Case Breakdown */}
                                {clientDetail.caseBreakdown && clientDetail.caseBreakdown.length > 0 && (
                                    <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-100">
                                        <h3 className="text-sm font-bold text-gray-800 uppercase tracking-wide mb-4">🔥 Most Common Cases</h3>
                                        <div className="space-y-3">
                                            {clientDetail.caseBreakdown.map((item, index) => (
                                                <div key={index} className="flex items-center gap-3">
                                                    <div className="w-24 text-xs font-semibold text-gray-600 truncate" title={item.caseType}>
                                                        {item.caseType}
                                                    </div>
                                                    <div className="flex-1 bg-gray-100 rounded-full h-2 overflow-hidden">
                                                        <div
                                                            className="h-full bg-gradient-to-r from-orange-400 to-pink-500 rounded-full"
                                                            style={{ width: `${(item.count / getMaxCount(clientDetail.caseBreakdown)) * 100}%` }}
                                                        ></div>
                                                    </div>
                                                    <div className="w-8 text-xs font-bold text-gray-700 text-right">{item.count}</div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {/* Services Breakdown */}
                                {clientDetail.servicesBreakdown && clientDetail.servicesBreakdown.length > 0 && (
                                    <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-100">
                                        <h3 className="text-sm font-bold text-gray-800 uppercase tracking-wide mb-4">🛠️ Services Provided</h3>
                                        <div className="flex flex-wrap gap-2">
                                            {clientDetail.servicesBreakdown.map((item, index) => (
                                                <span key={index} className="inline-flex items-center px-2.5 py-1 rounded-lg bg-indigo-50 text-indigo-700 border border-indigo-100 text-xs font-medium">
                                                    {item.service} 
                                                    <span className="ml-1.5 px-1.5 py-0.5 bg-white text-indigo-600 rounded shadow-sm text-[10px] font-bold">
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
                                <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-100">
                                    <h3 className="text-sm font-bold text-gray-800 uppercase tracking-wide mb-4">📊 Activity by Year</h3>
                                    <div className="space-y-4">
                                        {clientDetail.activityByYear.map((item) => (
                                            <div key={item.year} className="flex items-center gap-4">
                                                <div className="w-12 text-sm font-bold text-gray-700">{item.year}</div>
                                                <div className="flex-1 flex gap-1 h-3 bg-gray-100 rounded-full overflow-hidden">
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
                                                <div className="w-12 text-sm font-bold text-gray-700 text-right">{item.total}</div>
                                            </div>
                                        ))}
                                    </div>
                                    <div className="flex justify-end gap-4 mt-3 text-xs font-medium text-gray-500">
                                        <span className="flex items-center gap-1"><div className="w-2 h-2 bg-blue-400 rounded-full"></div> Daily</span>
                                        <span className="flex items-center gap-1"><div className="w-2 h-2 bg-emerald-400 rounded-full"></div> Projects</span>
                                    </div>
                                </div>
                            )}

                            {/* Activity History */}
                            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                                <div className="p-4 border-b border-gray-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-gray-50/30">
                                    <h3 className="text-lg font-bold text-gray-800">📋 Activity History</h3>
                                    <div className="flex p-1 bg-gray-100 rounded-lg">
                                        <button
                                            className={`flex-1 sm:flex-none px-4 py-1.5 text-xs font-bold rounded-md transition-all ${activeSubTab === 'daily' ? 'bg-white text-indigo-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
                                            onClick={() => setActiveSubTab('daily')}
                                        >
                                            📅 Daily ({clientDetail.dailyEntries?.length || 0})
                                        </button>
                                        <button
                                            className={`flex-1 sm:flex-none px-4 py-1.5 text-xs font-bold rounded-md transition-all ${activeSubTab === 'projects' ? 'bg-white text-emerald-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
                                            onClick={() => setActiveSubTab('projects')}
                                        >
                                            📋 Projects ({clientDetail.projectEntries?.length || 0})
                                        </button>
                                    </div>
                                </div>

                                <div className="overflow-x-auto">
                                    {activeSubTab === 'daily' ? (
                                        <table className="w-full text-sm text-left border-collapse">
                                            <thead className="bg-gray-50 text-gray-600 font-semibold uppercase text-xs">
                                                <tr>
                                                    <th className="px-4 py-3 whitespace-nowrap">Date</th>
                                                    <th className="px-4 py-3">Case/Issue</th>
                                                    <th className="px-4 py-3 whitespace-nowrap">Action</th>
                                                    <th className="px-4 py-3 whitespace-nowrap">Status</th>
                                                    <th className="px-4 py-3 whitespace-nowrap">PIC Team</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-gray-100">
                                                {clientDetail.dailyEntries?.length === 0 ? (
                                                    <tr>
                                                        <td colSpan="5" className="p-8 text-center text-gray-400">No daily entries</td>
                                                    </tr>
                                                ) : (
                                                    clientDetail.dailyEntries?.map((entry) => (
                                                        <tr key={entry._id} className="hover:bg-gray-50 transition-colors">
                                                            <td className="px-4 py-3 font-mono text-xs whitespace-nowrap text-gray-600">{formatDate(entry.date)}</td>
                                                            <td className="px-4 py-3 max-w-xs truncate" title={entry.caseIssue}>{entry.caseIssue || '-'}</td>
                                                            <td className="px-4 py-3 whitespace-nowrap">
                                                                <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium border ${
                                                                    entry.action?.toLowerCase().includes('monitor') ? 'bg-indigo-50 text-indigo-700 border-indigo-100' : 
                                                                    entry.action?.toLowerCase().includes('config') ? 'bg-purple-50 text-purple-700 border-purple-100' : 
                                                                    'bg-gray-50 text-gray-700 border-gray-100'
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
                                                                        <span key={idx} className="bg-gray-100 text-gray-600 px-1.5 py-0.5 rounded text-[10px] border border-gray-200">{pic}</span>
                                                                    ))}
                                                                    {entry.picTeam?.length > 2 && (
                                                                        <span className="bg-gray-100 text-gray-600 px-1.5 py-0.5 rounded text-[10px] border border-gray-200">+{entry.picTeam.length - 2}</span>
                                                                    )}
                                                                </div>
                                                            </td>
                                                        </tr>
                                                    ))
                                                )}
                                                {/* Add Entry Row */}
                                                <tr 
                                                    className="bg-indigo-50/50 hover:bg-indigo-50 cursor-pointer transition-colors border-t-2 border-dashed border-indigo-100"
                                                    onClick={() => setShowAddModal(true)}
                                                >
                                                    <td colSpan="5" className="p-3 text-center text-indigo-600 font-bold text-sm">
                                                        <span className="flex items-center justify-center gap-2">➕ Add New Entry</span>
                                                    </td>
                                                </tr>
                                            </tbody>
                                        </table>
                                    ) : (
                                        <table className="w-full text-sm text-left border-collapse">
                                            <thead className="bg-gray-50 text-gray-600 font-semibold uppercase text-xs">
                                                <tr>
                                                    <th className="px-4 py-3 whitespace-nowrap">Date</th>
                                                    <th className="px-4 py-3 whitespace-nowrap">Quarter</th>
                                                    <th className="px-4 py-3">Services</th>
                                                    <th className="px-4 py-3 whitespace-nowrap">Status</th>
                                                    <th className="px-4 py-3 whitespace-nowrap">PIC Team</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-gray-100">
                                                {clientDetail.projectEntries?.length === 0 ? (
                                                    <tr>
                                                        <td colSpan="5" className="p-8 text-center text-gray-400">No project entries</td>
                                                    </tr>
                                                ) : (
                                                    clientDetail.projectEntries?.map((entry) => (
                                                        <tr key={entry._id} className="hover:bg-gray-50 transition-colors">
                                                            <td className="px-4 py-3 font-mono text-xs whitespace-nowrap text-gray-600">{formatDate(entry.date)}</td>
                                                            <td className="px-4 py-3 text-gray-700">{entry.quarter || '-'}</td>
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
                                                                        <span key={idx} className="bg-gray-100 text-gray-600 px-1.5 py-0.5 rounded text-[10px] border border-gray-200">{pic}</span>
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
                        className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden animate-scale-in border border-gray-100" 
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="px-6 py-4 border-b border-gray-100 bg-gray-50 flex items-center justify-between">
                            <h3 className="font-bold text-lg text-gray-800">➕ Add Entry for {selectedClient?.clientName}</h3>
                            <button className="w-8 h-8 flex items-center justify-center rounded-full bg-white text-gray-400 hover:text-gray-600 hover:bg-gray-100 border border-gray-200 transition-all shadow-sm" onClick={() => setShowAddModal(false)}>✕</button>
                        </div>
                        <form onSubmit={handleAddEntry}>
                            <div className="p-6 space-y-4">
                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-1.5">📅 Date</label>
                                    <input
                                        type="date"
                                        value={newEntry.date}
                                        onChange={(e) => setNewEntry(prev => ({ ...prev, date: e.target.value }))}
                                        required
                                        className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all font-mono text-sm"
                                    />
                                </div>
                                
                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-1.5">👤 PIC</label>
                                    <input
                                        type="text"
                                        placeholder="Enter names (comma separated)"
                                        value={newEntry.picInput || ''}
                                        onChange={handlePicChange}
                                        className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all text-sm mb-2"
                                    />
                                    {newEntry.picTeam.length > 0 && (
                                        <div className="flex flex-wrap gap-2">
                                            {newEntry.picTeam.map((pic, idx) => (
                                                <span key={idx} className="px-2 py-1 bg-indigo-50 text-indigo-700 rounded-lg text-xs font-medium border border-indigo-100">{pic}</span>
                                            ))}
                                        </div>
                                    )}
                                </div>
                                
                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-1.5">📝 Description</label>
                                    <textarea
                                        placeholder="Describe the activity..."
                                        value={newEntry.description}
                                        onChange={(e) => setNewEntry(prev => ({ ...prev, description: e.target.value }))}
                                        rows={3}
                                        className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all text-sm"
                                    />
                                </div>
                                
                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-1.5">📎 Attachment</label>
                                    <div className="relative">
                                        <input
                                            type="file"
                                            onChange={(e) => setNewEntry(prev => ({ ...prev, attachment: e.target.files[0] }))}
                                            className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100 transition-all"
                                        />
                                    </div>
                                    {newEntry.attachment && (
                                        <div className="mt-2 text-xs text-green-600 flex items-center gap-1 font-medium bg-green-50 p-2 rounded-lg border border-green-100">
                                            📄 {newEntry.attachment.name}
                                        </div>
                                    )}
                                </div>
                            </div>
                            
                            <div className="px-6 py-4 bg-gray-50 border-t border-gray-100 flex justify-end gap-3">
                                <button type="button" className="px-4 py-2 text-gray-600 font-bold text-sm hover:bg-gray-200/50 rounded-xl transition-colors" onClick={() => setShowAddModal(false)}>
                                    Cancel
                                </button>
                                <button type="submit" className="px-6 py-2 bg-indigo-600 text-white font-bold text-sm rounded-xl hover:bg-indigo-700 focus:ring-4 focus:ring-indigo-500/30 transition-all shadow-md disabled:opacity-70 disabled:cursor-not-allowed" disabled={submitting}>
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
