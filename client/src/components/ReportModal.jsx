import { useState, useEffect, useRef } from 'react';
import { projectsApi } from '../api/projects';
import { dailiesApi } from '../api/dailies';
import * as XLSX from 'xlsx';
import './ReportModal.css';

export default function ReportModal({ isOpen, onClose, apiType = 'project', quarters = [] }) {
    const [reportData, setReportData] = useState(null);
    const [loading, setLoading] = useState(false);
    const [selectedQuarter, setSelectedQuarter] = useState('');
    const [isYearly, setIsYearly] = useState(false);
    const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
    const [viewMode, setViewMode] = useState('summary'); // 'summary' or 'detail'
    const printRef = useRef(null);

    // Get unique years from quarters
    const years = [...new Set(quarters.map(q => q.year))].sort((a, b) => b - a);

    useEffect(() => {
        if (quarters.length > 0 && !selectedQuarter) {
            setSelectedQuarter(quarters[0].quarter);
            setSelectedYear(quarters[0].year);
        }
    }, [quarters]);

    useEffect(() => {
        if (isOpen && (selectedQuarter || isYearly)) {
            fetchReport();
        }
    }, [isOpen, selectedQuarter, isYearly, selectedYear]);

    const fetchReport = async () => {
        setLoading(true);
        try {
            const api = apiType === 'daily' ? dailiesApi : projectsApi;
            const quarter = quarters.find(q => q.quarter === selectedQuarter);
            const data = await api.getReport(
                selectedQuarter,
                isYearly ? selectedYear : quarter?.year || selectedYear,
                isYearly
            );
            setReportData(data);
        } catch (err) {
            console.error('Failed to fetch report:', err);
        } finally {
            setLoading(false);
        }
    };

    const handleExportExcel = () => {
        if (!reportData) return;

        const items = apiType === 'daily' ? reportData.dailies : reportData.projects;

        // Prepare data for Excel
        const excelData = items.map((item, idx) => {
            if (apiType === 'daily') {
                return {
                    'No': idx + 1,
                    'Client': item.clientName,
                    'Service': Array.isArray(item.services) ? item.services.join(', ') : item.services,
                    'Case/Issue': item.caseIssue,
                    'Action': item.action,
                    'Date': item.date ? new Date(item.date).toLocaleDateString('id-ID') : '',
                    'PIC Team': Array.isArray(item.picTeam) ? item.picTeam.join(', ') : item.picTeam,
                    'Detail Action': item.detailAction,
                    'Status': item.status
                };
            } else {
                return {
                    'No': idx + 1,
                    'Project': item.projectName,
                    'Service': Array.isArray(item.services) ? item.services.join(', ') : item.services,
                    'Report Survey': item.reportSurvey,
                    'WO': item.wo,
                    'Material': item.material,
                    'Due Date': item.dueDate ? new Date(item.dueDate).toLocaleDateString('id-ID') : '',
                    'Date': item.date ? new Date(item.date).toLocaleDateString('id-ID') : '',
                    'PIC Team': Array.isArray(item.picTeam) ? item.picTeam.join(', ') : item.picTeam,
                    'Progress': item.progress,
                    'Status': item.status
                };
            }
        });

        // Create summary sheet
        const summaryData = [
            { 'Metric': 'Total Entries', 'Value': reportData.summary.total },
            { 'Metric': 'Done', 'Value': reportData.summary.done, 'Percentage': `${reportData.summary.donePercent || 0}%` },
            { 'Metric': 'Progress', 'Value': reportData.summary.progress, 'Percentage': `${reportData.summary.progressPercent || 0}%` },
            { 'Metric': 'Hold', 'Value': reportData.summary.hold, 'Percentage': `${reportData.summary.holdPercent || 0}%` },
            { 'Metric': 'No Status', 'Value': reportData.summary.noStatus }
        ];

        // Service breakdown sheet
        const serviceData = Object.entries(reportData.serviceStats || {}).map(([service, stats]) => ({
            'Service': service,
            'Total': stats.total,
            'Done': stats.done,
            'Progress': stats.progress,
            'Hold': stats.hold
        }));

        // PIC team sheet
        const picData = Object.entries(reportData.picStats || {}).map(([pic, stats]) => ({
            'PIC Member': pic,
            'Total': stats.total,
            'Done': stats.done,
            'Progress': stats.progress,
            'Hold': stats.hold
        }));

        const wb = XLSX.utils.book_new();

        // Add sheets
        const wsSummary = XLSX.utils.json_to_sheet(summaryData);
        XLSX.utils.book_append_sheet(wb, wsSummary, 'Summary');

        if (serviceData.length > 0) {
            const wsService = XLSX.utils.json_to_sheet(serviceData);
            XLSX.utils.book_append_sheet(wb, wsService, 'Service Breakdown');
        }

        if (picData.length > 0) {
            const wsPic = XLSX.utils.json_to_sheet(picData);
            XLSX.utils.book_append_sheet(wb, wsPic, 'PIC Team');
        }

        const wsData = XLSX.utils.json_to_sheet(excelData);
        XLSX.utils.book_append_sheet(wb, wsData, apiType === 'daily' ? 'Daily Activity' : 'Projects');

        // Generate filename
        const period = isYearly ? `Year-${selectedYear}` : selectedQuarter;
        const filename = `${apiType === 'daily' ? 'Daily_Activity' : 'Project'}_Report_${period}.xlsx`;

        XLSX.writeFile(wb, filename);
    };

    const handlePrint = () => {
        const printContent = printRef.current;
        const printWindow = window.open('', '_blank');

        printWindow.document.write(`
            <!DOCTYPE html>
            <html>
            <head>
                <title>Report - ${apiType === 'daily' ? 'Daily Activity' : 'Project'}</title>
                <style>
                    * { margin: 0; padding: 0; box-sizing: border-box; }
                    body { 
                        font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; 
                        padding: 40px;
                        color: #333;
                    }
                    .report-header {
                        text-align: center;
                        border-bottom: 3px solid #FF6347;
                        padding-bottom: 20px;
                        margin-bottom: 30px;
                    }
                    .report-header h1 {
                        font-size: 24px;
                        color: #1a1a2e;
                        margin-bottom: 5px;
                    }
                    .report-header h2 {
                        font-size: 18px;
                        color: #FF6347;
                        font-weight: normal;
                    }
                    .report-header p {
                        color: #666;
                        margin-top: 10px;
                    }
                    .summary-cards {
                        display: flex;
                        justify-content: space-around;
                        background: #f8f9fa;
                        padding: 20px;
                        border-radius: 8px;
                        margin-bottom: 30px;
                    }
                    .summary-card {
                        text-align: center;
                        padding: 15px 20px;
                    }
                    .summary-card .value {
                        font-size: 32px;
                        font-weight: bold;
                    }
                    .summary-card .percent {
                        font-size: 14px;
                        color: #666;
                    }
                    .summary-card .label {
                        font-size: 12px;
                        color: #888;
                        text-transform: uppercase;
                    }
                    .summary-card.done .value { color: #22c55e; }
                    .summary-card.progress .value { color: #f59e0b; }
                    .summary-card.hold .value { color: #ef4444; }
                    .chart-container {
                        background: #fff;
                        border: 1px solid #e5e7eb;
                        border-radius: 8px;
                        padding: 20px;
                        margin-bottom: 20px;
                    }
                    .chart-container h4 {
                        margin-bottom: 15px;
                        color: #374151;
                    }
                    .bar-chart { margin-bottom: 20px; }
                    .bar-item {
                        display: flex;
                        align-items: center;
                        margin-bottom: 8px;
                    }
                    .bar-label {
                        width: 100px;
                        font-size: 12px;
                        font-weight: 500;
                    }
                    .bar-track {
                        flex: 1;
                        height: 20px;
                        background: #f1f5f9;
                        border-radius: 4px;
                        overflow: hidden;
                    }
                    .bar-fill {
                        height: 100%;
                        border-radius: 4px;
                    }
                    .bar-fill.done { background: #22c55e; }
                    .bar-fill.progress { background: #f59e0b; }
                    .bar-fill.hold { background: #ef4444; }
                    .bar-fill.total { background: #6366f1; }
                    .bar-value {
                        width: 40px;
                        text-align: right;
                        font-size: 12px;
                        font-weight: 600;
                        margin-left: 8px;
                    }
                    table {
                        width: 100%;
                        border-collapse: collapse;
                        font-size: 11px;
                        margin-top: 10px;
                    }
                    th {
                        background: #1a1a2e;
                        color: white;
                        padding: 10px 8px;
                        text-align: left;
                        font-weight: 600;
                    }
                    td {
                        padding: 8px;
                        border-bottom: 1px solid #e0e0e0;
                        vertical-align: top;
                    }
                    tr:nth-child(even) { background: #f8f9fa; }
                    .status-done { color: #22c55e; font-weight: 600; }
                    .status-progress { color: #f59e0b; font-weight: 600; }
                    .status-hold { color: #ef4444; font-weight: 600; }
                    .footer {
                        margin-top: 30px;
                        text-align: center;
                        color: #999;
                        font-size: 11px;
                        border-top: 1px solid #e0e0e0;
                        padding-top: 15px;
                    }
                    @media print {
                        body { padding: 20px; }
                        .summary-cards { page-break-inside: avoid; }
                        .chart-container { page-break-inside: avoid; }
                    }
                </style>
            </head>
            <body>
                ${printContent.innerHTML}
            </body>
            </html>
        `);

        printWindow.document.close();
        printWindow.focus();
        setTimeout(() => {
            printWindow.print();
            printWindow.close();
        }, 250);
    };

    const handleClose = () => {
        setReportData(null);
        onClose();
    };

    if (!isOpen) return null;

    const items = reportData ? (apiType === 'daily' ? reportData.dailies : reportData.projects) : [];

    const formatDate = (date) => {
        if (!date) return '-';
        return new Date(date).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' });
    };

    const getStatusClass = (status) => {
        if (status === 'Done') return 'status-done';
        if (status === 'Progress') return 'status-progress';
        if (status === 'Hold') return 'status-hold';
        return '';
    };

    // Calculate max value for bar charts
    const getMaxValue = (stats) => {
        if (!stats) return 1;
        return Math.max(...Object.values(stats).map(s => s.total || 0), 1);
    };

    // Render bar chart
    const renderBarChart = (data, maxValue, showStatus = false) => {
        const entries = Object.entries(data || {}).sort((a, b) => b[1].total - a[1].total).slice(0, 8);
        
        return (
            <div className="bar-chart">
                {entries.map(([label, stats]) => (
                    <div key={label} className="bar-item">
                        <span className="bar-label" title={label}>{label}</span>
                        <div className="bar-track">
                            {showStatus ? (
                                <div style={{ display: 'flex', height: '100%' }}>
                                    {stats.done > 0 && (
                                        <div className="bar-fill done" style={{ width: `${(stats.done / maxValue) * 100}%` }} />
                                    )}
                                    {stats.progress > 0 && (
                                        <div className="bar-fill progress" style={{ width: `${(stats.progress / maxValue) * 100}%` }} />
                                    )}
                                    {stats.hold > 0 && (
                                        <div className="bar-fill hold" style={{ width: `${(stats.hold / maxValue) * 100}%` }} />
                                    )}
                                </div>
                            ) : (
                                <div className="bar-fill total" style={{ width: `${(stats.total / maxValue) * 100}%` }} />
                            )}
                        </div>
                        <span className="bar-value">{stats.total}</span>
                    </div>
                ))}
            </div>
        );
    };

    // Render quarterly trend as bars
    const renderQuarterlyTrend = () => {
        if (!reportData?.quarterlyTrend || reportData.quarterlyTrend.length === 0) return null;

        const maxTotal = Math.max(...reportData.quarterlyTrend.map(q => q.total), 1);

        return (
            <div className="chart-container" style={{ gridColumn: '1 / -1' }}>
                <h4>📈 Quarterly Trend - {selectedYear}</h4>
                <div className="quarterly-chart">
                    {reportData.quarterlyTrend.map(q => (
                        <div key={q.quarter} className="quarter-bar-group">
                            <div className="quarter-bars">
                                <div 
                                    className="quarter-bar done" 
                                    style={{ height: `${maxTotal > 0 ? (q.done / maxTotal) * 160 : 0}px` }}
                                    title={`Done: ${q.done}`}
                                />
                                <div 
                                    className="quarter-bar progress" 
                                    style={{ height: `${maxTotal > 0 ? (q.progress / maxTotal) * 160 : 0}px` }}
                                    title={`Progress: ${q.progress}`}
                                />
                                <div 
                                    className="quarter-bar hold" 
                                    style={{ height: `${maxTotal > 0 ? (q.hold / maxTotal) * 160 : 0}px` }}
                                    title={`Hold: ${q.hold}`}
                                />
                            </div>
                            <div className="quarter-label">{q.quarter}</div>
                            <div className="quarter-total">{q.total} total</div>
                        </div>
                    ))}
                </div>
                <div className="chart-legend">
                    <div className="legend-item"><span className="legend-color done"></span> Done</div>
                    <div className="legend-item"><span className="legend-color progress"></span> Progress</div>
                    <div className="legend-item"><span className="legend-color hold"></span> Hold</div>
                </div>
            </div>
        );
    };

    return (
        <div className="modal-overlay" onClick={handleClose}>
            <div className="modal-content report-modal" onClick={(e) => e.stopPropagation()}>
                <div className="modal-header">
                    <h2>📊 Professional Report</h2>
                    <button className="close-btn" onClick={handleClose}>&times;</button>
                </div>

                <div className="modal-body">
                    {/* Report Options */}
                    <div className="report-options">
                        <div className="option-group">
                            <label>
                                <input
                                    type="radio"
                                    checked={!isYearly}
                                    onChange={() => setIsYearly(false)}
                                /> Quarterly Report
                            </label>
                            <label>
                                <input
                                    type="radio"
                                    checked={isYearly}
                                    onChange={() => setIsYearly(true)}
                                /> Yearly Report
                            </label>
                        </div>

                        {!isYearly ? (
                            <select
                                value={selectedQuarter}
                                onChange={(e) => {
                                    setSelectedQuarter(e.target.value);
                                    const q = quarters.find(q => q.quarter === e.target.value);
                                    if (q) setSelectedYear(q.year);
                                }}
                            >
                                {quarters.map(q => (
                                    <option key={q.quarter} value={q.quarter}>{q.quarter}</option>
                                ))}
                            </select>
                        ) : (
                            <select
                                value={selectedYear}
                                onChange={(e) => setSelectedYear(parseInt(e.target.value))}
                            >
                                {years.map(y => (
                                    <option key={y} value={y}>{y}</option>
                                ))}
                            </select>
                        )}
                    </div>

                    {/* View Toggle */}
                    <div className="view-toggle">
                        <button 
                            className={viewMode === 'summary' ? 'active' : ''} 
                            onClick={() => setViewMode('summary')}
                        >
                            📊 Summary
                        </button>
                        <button 
                            className={viewMode === 'detail' ? 'active' : ''} 
                            onClick={() => setViewMode('detail')}
                        >
                            📋 Detail
                        </button>
                    </div>

                    {/* Report Preview */}
                    <div className="report-preview" ref={printRef}>
                        {loading ? (
                            <div className="loading-report">Loading report...</div>
                        ) : reportData ? (
                            <>
                                <div className="report-header">
                                    <h1>{apiType === 'daily' ? 'DAILY ACTIVITY' : 'PROJECT'} INFRASTRUCTURE ENGINEER</h1>
                                    <h2>{isYearly ? `Year ${selectedYear}` : selectedQuarter}</h2>
                                    <p>Generated on {new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
                                </div>

                                {/* Summary Cards */}
                                <div className="summary-cards">
                                    <div className="summary-card total">
                                        <div className="value">{reportData.summary.total}</div>
                                        <div className="percent">100%</div>
                                        <div className="label">Total</div>
                                    </div>
                                    <div className="summary-card done">
                                        <div className="value">{reportData.summary.done}</div>
                                        <div className="percent">{reportData.summary.donePercent || 0}%</div>
                                        <div className="label">Done</div>
                                    </div>
                                    <div className="summary-card progress">
                                        <div className="value">{reportData.summary.progress}</div>
                                        <div className="percent">{reportData.summary.progressPercent || 0}%</div>
                                        <div className="label">Progress</div>
                                    </div>
                                    <div className="summary-card hold">
                                        <div className="value">{reportData.summary.hold}</div>
                                        <div className="percent">{reportData.summary.holdPercent || 0}%</div>
                                        <div className="label">Hold</div>
                                    </div>
                                </div>

                                {viewMode === 'summary' && (
                                    <>
                                        {/* Charts */}
                                        <div className="charts-grid">
                                            {/* Service Breakdown */}
                                            <div className="chart-container">
                                                <h4>🏷️ Service Breakdown</h4>
                                                {Object.keys(reportData.serviceStats || {}).length > 0 ? (
                                                    renderBarChart(reportData.serviceStats, getMaxValue(reportData.serviceStats), true)
                                                ) : (
                                                    <p style={{ color: '#94a3b8', textAlign: 'center' }}>No service data</p>
                                                )}
                                            </div>

                                            {/* PIC Team Performance */}
                                            <div className="chart-container">
                                                <h4>👥 PIC Team Workload</h4>
                                                {Object.keys(reportData.picStats || {}).length > 0 ? (
                                                    renderBarChart(reportData.picStats, getMaxValue(reportData.picStats), true)
                                                ) : (
                                                    <p style={{ color: '#94a3b8', textAlign: 'center' }}>No PIC data</p>
                                                )}
                                            </div>
                                        </div>

                                        {/* Quarterly Trend (for yearly reports) */}
                                        {isYearly && renderQuarterlyTrend()}

                                        {/* PIC Team Table */}
                                        {Object.keys(reportData.picStats || {}).length > 0 && (
                                            <div className="chart-container">
                                                <h4>📋 PIC Team Details</h4>
                                                <table className="pic-table">
                                                    <thead>
                                                        <tr>
                                                            <th>PIC Member</th>
                                                            <th>Total</th>
                                                            <th>Done</th>
                                                            <th>Progress</th>
                                                            <th>Hold</th>
                                                        </tr>
                                                    </thead>
                                                    <tbody>
                                                        {Object.entries(reportData.picStats)
                                                            .sort((a, b) => b[1].total - a[1].total)
                                                            .map(([pic, stats]) => (
                                                                <tr key={pic}>
                                                                    <td><strong>{pic}</strong></td>
                                                                    <td>{stats.total}</td>
                                                                    <td><span className="count-badge done">{stats.done}</span></td>
                                                                    <td><span className="count-badge progress">{stats.progress}</span></td>
                                                                    <td><span className="count-badge hold">{stats.hold}</span></td>
                                                                </tr>
                                                            ))}
                                                    </tbody>
                                                </table>
                                            </div>
                                        )}
                                    </>
                                )}

                                {viewMode === 'detail' && (
                                    <>
                                        {/* Grouped by Site/Client Name */}
                                        {(() => {
                                            const nameKey = apiType === 'daily' ? 'clientName' : 'projectName';
                                            const grouped = {};
                                            items.forEach(item => {
                                                const name = item[nameKey] || 'Unknown';
                                                if (!grouped[name]) grouped[name] = [];
                                                grouped[name].push(item);
                                            });

                                            return Object.entries(grouped).map(([siteName, siteItems], groupIdx) => (
                                                <div key={siteName} className="report-group">
                                                    <div className="report-group-header">
                                                        <span className="group-number">{groupIdx + 1}</span>
                                                        <span className="group-name">{siteName}</span>
                                                        <span className="group-count">{siteItems.length} entries</span>
                                                    </div>
                                                    <table className="report-group-table">
                                                        <thead>
                                                            <tr>
                                                                <th style={{ width: '40px' }}>No</th>
                                                                <th>Service</th>
                                                                <th>Date</th>
                                                                <th>PIC</th>
                                                                <th>{apiType === 'daily' ? 'Detail Action' : 'Progress'}</th>
                                                                <th style={{ width: '80px' }}>Status</th>
                                                            </tr>
                                                        </thead>
                                                        <tbody>
                                                            {siteItems.map((item, idx) => (
                                                                <tr key={item._id || idx}>
                                                                    <td>{idx + 1}</td>
                                                                    <td>{Array.isArray(item.services) ? item.services.join(', ') : item.services || '-'}</td>
                                                                    <td>{formatDate(item.date)}</td>
                                                                    <td>{Array.isArray(item.picTeam) ? item.picTeam.join(', ') : item.picTeam || '-'}</td>
                                                                    <td>{apiType === 'daily' ? item.detailAction : item.progress || '-'}</td>
                                                                    <td className={getStatusClass(item.status)}>{item.status || '-'}</td>
                                                                </tr>
                                                            ))}
                                                        </tbody>
                                                    </table>
                                                </div>
                                            ));
                                        })()}
                                    </>
                                )}

                                <div className="footer">
                                    <p>Daily Activity Infrastructure Engineer - Report generated by system</p>
                                </div>
                            </>
                        ) : (
                            <div className="no-data">Select a period to generate report</div>
                        )}
                    </div>
                </div>

                <div className="modal-footer">
                    <button className="btn btn-secondary" onClick={handleClose}>
                        Close
                    </button>
                    <button
                        className="btn btn-success"
                        onClick={handleExportExcel}
                        disabled={!reportData || loading}
                    >
                        📥 Download Excel
                    </button>
                    <button
                        className="btn btn-primary"
                        onClick={handlePrint}
                        disabled={!reportData || loading}
                    >
                        🖨️ Print / PDF
                    </button>
                </div>
            </div>
        </div>
    );
}
