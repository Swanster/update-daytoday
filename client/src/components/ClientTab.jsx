import { useState, useEffect, useCallback } from 'react';
import { clientsApi } from '../api/clients';

function ClientTab({ user, selectedClientName, onClientSelect }) {
    const [clients, setClients] = useState([]);
    const [selectedClient, setSelectedClient] = useState(null);
    const [clientDetail, setClientDetail] = useState(null);
    const [loading, setLoading] = useState(true);
    const [detailLoading, setDetailLoading] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [activeSubTab, setActiveSubTab] = useState('daily');
    const [error, setError] = useState(null);

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
            <div className="client-tab-loading">
                <div className="loading-spinner"></div>
                <p>Loading clients...</p>
            </div>
        );
    }

    if (error) {
        return (
            <div className="client-tab-error">
                <div className="error-icon">⚠️</div>
                <h3>Error Loading Clients</h3>
                <p>{error}</p>
                <button className="btn btn-primary" onClick={fetchClients}>Retry</button>
            </div>
        );
    }

    return (
        <div className="client-tab">
            {/* Client List Panel */}
            <div className="client-list-panel">
                <div className="client-list-header">
                    <h3>🏢 Clients</h3>
                    <span className="client-count">{clients.length}</span>
                </div>
                <div className="client-search">
                    <span className="search-icon">🔍</span>
                    <input
                        type="text"
                        placeholder="Search clients..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                    {searchTerm && (
                        <button className="clear-btn" onClick={() => setSearchTerm('')}>✕</button>
                    )}
                </div>
                <div className="client-list">
                    {filteredClients.length === 0 ? (
                        <div className="no-clients">No clients found</div>
                    ) : (
                        filteredClients.map((client) => (
                            <div
                                key={client.clientName}
                                className={`client-item ${selectedClient?.clientName === client.clientName ? 'selected' : ''}`}
                                onClick={() => handleClientClick(client)}
                            >
                                <div className="client-item-name">{client.clientName}</div>
                                <div className="client-item-stats">
                                    <span className="stat-badge daily">{client.totalDaily}</span>
                                    <span className="stat-badge project">{client.totalProjects}</span>
                                    {client.openIssues > 0 && (
                                        <span className="stat-badge open">{client.openIssues}</span>
                                    )}
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>

            {/* Client Detail Panel */}
            <div className="client-detail-panel">
                {!selectedClient ? (
                    <div className="no-selection">
                        <div className="no-selection-icon">👈</div>
                        <h3>Select a Client</h3>
                        <p>Click on a client from the list to view their activity history</p>
                    </div>
                ) : detailLoading ? (
                    <div className="detail-loading">
                        <div className="loading-spinner"></div>
                        <p>Loading client details...</p>
                    </div>
                ) : clientDetail ? (
                    <>
                        {/* Client Header */}
                        <div className="client-detail-header">
                            <h2>{clientDetail.clientName}</h2>
                        </div>

                        {/* Summary Cards */}
                        <div className="client-summary-cards">
                            <div className="summary-card">
                                <div className="summary-icon">📅</div>
                                <div className="summary-value">{clientDetail.summary.totalDaily}</div>
                                <div className="summary-label">Daily Entries</div>
                            </div>
                            <div className="summary-card">
                                <div className="summary-icon">📋</div>
                                <div className="summary-value">{clientDetail.summary.totalProjects}</div>
                                <div className="summary-label">Projects</div>
                            </div>
                            <div className="summary-card open">
                                <div className="summary-icon">⚠️</div>
                                <div className="summary-value">{clientDetail.summary.openDaily + clientDetail.summary.openProjects}</div>
                                <div className="summary-label">Open Issues</div>
                            </div>
                            <div className="summary-card done">
                                <div className="summary-icon">✅</div>
                                <div className="summary-value">{clientDetail.summary.doneDaily + clientDetail.summary.doneProjects}</div>
                                <div className="summary-label">Resolved</div>
                            </div>
                            <div className="summary-card onsite">
                                <div className="summary-icon">🏃</div>
                                <div className="summary-value">{clientDetail.summary.onsiteCount}</div>
                                <div className="summary-label">Onsite</div>
                            </div>
                            <div className="summary-card remote">
                                <div className="summary-icon">💻</div>
                                <div className="summary-value">{clientDetail.summary.remoteCount}</div>
                                <div className="summary-label">Remote</div>
                            </div>
                        </div>

                        {/* Case Breakdown */}
                        {clientDetail.caseBreakdown && clientDetail.caseBreakdown.length > 0 && (
                            <div className="breakdown-section">
                                <h3>🔥 Most Common Cases</h3>
                                <div className="breakdown-bars">
                                    {clientDetail.caseBreakdown.map((item, index) => (
                                        <div key={index} className="breakdown-item">
                                            <div className="breakdown-label" title={item.caseType}>
                                                {item.caseType}
                                            </div>
                                            <div className="breakdown-bar-container">
                                                <div
                                                    className="breakdown-bar"
                                                    style={{ width: `${(item.count / getMaxCount(clientDetail.caseBreakdown)) * 100}%` }}
                                                ></div>
                                            </div>
                                            <div className="breakdown-count">{item.count}</div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Services Breakdown */}
                        {clientDetail.servicesBreakdown && clientDetail.servicesBreakdown.length > 0 && (
                            <div className="breakdown-section services">
                                <h3>🛠️ Services Provided</h3>
                                <div className="services-tags">
                                    {clientDetail.servicesBreakdown.map((item, index) => (
                                        <span key={index} className="service-tag">
                                            {item.service} <span className="service-count">({item.count})</span>
                                        </span>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Activity by Year */}
                        {clientDetail.activityByYear && clientDetail.activityByYear.length > 0 && (
                            <div className="breakdown-section yearly">
                                <h3>📊 Activity by Year</h3>
                                <div className="year-bars">
                                    {clientDetail.activityByYear.map((item) => (
                                        <div key={item.year} className="year-item">
                                            <div className="year-label">{item.year}</div>
                                            <div className="year-bar-container">
                                                <div
                                                    className="year-bar daily-bar"
                                                    style={{ width: `${(item.daily / getMaxCount(clientDetail.activityByYear)) * 100}%` }}
                                                    title={`Daily: ${item.daily}`}
                                                ></div>
                                                <div
                                                    className="year-bar project-bar"
                                                    style={{ width: `${(item.projects / getMaxCount(clientDetail.activityByYear)) * 100}%` }}
                                                    title={`Projects: ${item.projects}`}
                                                ></div>
                                            </div>
                                            <div className="year-count">{item.total}</div>
                                        </div>
                                    ))}
                                </div>
                                <div className="year-legend">
                                    <span className="legend-item daily">📅 Daily</span>
                                    <span className="legend-item project">📋 Projects</span>
                                </div>
                            </div>
                        )}

                        {/* Activity History */}
                        <div className="activity-history-section">
                            <div className="history-header">
                                <h3>📋 Activity History</h3>
                                <div className="history-tabs">
                                    <button
                                        className={`history-tab ${activeSubTab === 'daily' ? 'active' : ''}`}
                                        onClick={() => setActiveSubTab('daily')}
                                    >
                                        📅 Daily ({clientDetail.dailyEntries?.length || 0})
                                    </button>
                                    <button
                                        className={`history-tab ${activeSubTab === 'projects' ? 'active' : ''}`}
                                        onClick={() => setActiveSubTab('projects')}
                                    >
                                        📋 Projects ({clientDetail.projectEntries?.length || 0})
                                    </button>
                                </div>
                            </div>

                            <div className="history-table-container">
                                {activeSubTab === 'daily' ? (
                                    <table className="history-table">
                                        <thead>
                                            <tr>
                                                <th>Date</th>
                                                <th>Case/Issue</th>
                                                <th>Action</th>
                                                <th>Status</th>
                                                <th>PIC Team</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {clientDetail.dailyEntries?.length === 0 ? (
                                                <tr>
                                                    <td colSpan="5" className="no-data">No daily entries</td>
                                                </tr>
                                            ) : (
                                                clientDetail.dailyEntries?.map((entry) => (
                                                    <tr key={entry._id}>
                                                        <td>{formatDate(entry.date)}</td>
                                                        <td className="case-cell" title={entry.caseIssue}>{entry.caseIssue || '-'}</td>
                                                        <td>
                                                            <span className={`action-badge ${entry.action?.toLowerCase()}`}>
                                                                {entry.action || '-'}
                                                            </span>
                                                        </td>
                                                        <td>
                                                            <span className={`status-badge ${entry.status?.toLowerCase()}`}>
                                                                {entry.status || '-'}
                                                            </span>
                                                        </td>
                                                        <td>
                                                            <div className="pic-tags">
                                                                {entry.picTeam?.slice(0, 2).map((pic, idx) => (
                                                                    <span key={idx} className="pic-tag">{pic}</span>
                                                                ))}
                                                                {entry.picTeam?.length > 2 && (
                                                                    <span className="pic-tag more">+{entry.picTeam.length - 2}</span>
                                                                )}
                                                            </div>
                                                        </td>
                                                    </tr>
                                                ))
                                            )}
                                        </tbody>
                                    </table>
                                ) : (
                                    <table className="history-table">
                                        <thead>
                                            <tr>
                                                <th>Date</th>
                                                <th>Quarter</th>
                                                <th>Services</th>
                                                <th>Status</th>
                                                <th>PIC Team</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {clientDetail.projectEntries?.length === 0 ? (
                                                <tr>
                                                    <td colSpan="5" className="no-data">No project entries</td>
                                                </tr>
                                            ) : (
                                                clientDetail.projectEntries?.map((entry) => (
                                                    <tr key={entry._id}>
                                                        <td>{formatDate(entry.date)}</td>
                                                        <td>{entry.quarter || '-'}</td>
                                                        <td>
                                                            <div className="services-mini">
                                                                {Array.isArray(entry.services) ? (
                                                                    <>
                                                                        {entry.services.slice(0, 2).map((s, idx) => (
                                                                            <span key={idx} className="service-mini">{s}</span>
                                                                        ))}
                                                                        {entry.services.length > 2 && (
                                                                            <span className="service-mini more">+{entry.services.length - 2}</span>
                                                                        )}
                                                                    </>
                                                                ) : entry.services ? (
                                                                    <span className="service-mini">{entry.services}</span>
                                                                ) : (
                                                                    '-'
                                                                )}
                                                            </div>
                                                        </td>
                                                        <td>
                                                            <span className={`status-badge ${entry.status?.toLowerCase()}`}>
                                                                {entry.status || '-'}
                                                            </span>
                                                        </td>
                                                        <td>
                                                            <div className="pic-tags">
                                                                {entry.picTeam?.slice(0, 2).map((pic, idx) => (
                                                                    <span key={idx} className="pic-tag">{pic}</span>
                                                                ))}
                                                                {entry.picTeam?.length > 2 && (
                                                                    <span className="pic-tag more">+{entry.picTeam.length - 2}</span>
                                                                )}
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
                    </>
                ) : (
                    <div className="no-data-message">
                        <p>Unable to load client details</p>
                    </div>
                )}
            </div>
        </div>
    );
}

export default ClientTab;
