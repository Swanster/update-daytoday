import { useState, useEffect, useRef } from 'react';
import { projectsApi } from '../api/projects';
import { dailiesApi } from '../api/dailies';
import * as XLSX from 'xlsx';

export default function ReportModal({ isOpen, onClose, apiType = 'project', quarters = [] }) {
    const [reportData, setReportData] = useState(null);
    const [loading, setLoading] = useState(false);
    const [selectedQuarter, setSelectedQuarter] = useState('');
    const [isYearly, setIsYearly] = useState(false);
    const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
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
                    'Service': item.services,
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
                    'Service': item.services,
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
            { 'Metric': 'Done', 'Value': reportData.summary.done },
            { 'Metric': 'Progress', 'Value': reportData.summary.progress },
            { 'Metric': 'Hold', 'Value': reportData.summary.hold },
            { 'Metric': 'No Status', 'Value': reportData.summary.noStatus }
        ];

        const wb = XLSX.utils.book_new();

        // Add summary sheet
        const wsSummary = XLSX.utils.json_to_sheet(summaryData);
        XLSX.utils.book_append_sheet(wb, wsSummary, 'Summary');

        // Add data sheet
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
                    .summary-box {
                        display: flex;
                        justify-content: space-around;
                        background: #f8f9fa;
                        padding: 20px;
                        border-radius: 8px;
                        margin-bottom: 30px;
                    }
                    .summary-item {
                        text-align: center;
                    }
                    .summary-item .number {
                        font-size: 28px;
                        font-weight: bold;
                        color: #FF6347;
                    }
                    .summary-item .label {
                        font-size: 12px;
                        color: #666;
                        text-transform: uppercase;
                    }
                    table {
                        width: 100%;
                        border-collapse: collapse;
                        font-size: 11px;
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
                    .status-done { color: #28a745; font-weight: 600; }
                    .status-progress { color: #ffc107; font-weight: 600; }
                    .status-hold { color: #dc3545; font-weight: 600; }
                    .report-group {
                        margin-bottom: 20px;
                        border: 1px solid #e0e0e0;
                        border-radius: 8px;
                        overflow: hidden;
                        page-break-inside: avoid;
                    }
                    .report-group-header {
                        display: flex;
                        align-items: center;
                        gap: 10px;
                        padding: 10px 15px;
                        background: #1a1a2e;
                        color: white;
                    }
                    .group-number {
                        width: 24px;
                        height: 24px;
                        background: #FF6347;
                        color: white;
                        border-radius: 50%;
                        display: flex;
                        align-items: center;
                        justify-content: center;
                        font-weight: bold;
                        font-size: 12px;
                    }
                    .group-name {
                        flex: 1;
                        font-weight: 600;
                        font-size: 14px;
                    }
                    .group-count {
                        font-size: 11px;
                        opacity: 0.8;
                    }
                    .report-group-table {
                        width: 100%;
                        border-collapse: collapse;
                        font-size: 10px;
                    }
                    .report-group-table th {
                        background: #f1f5f9;
                        color: #475569;
                        padding: 8px 6px;
                        text-align: left;
                        font-weight: 600;
                        border-bottom: 2px solid #e2e8f0;
                    }
                    .report-group-table td {
                        padding: 6px;
                        border-bottom: 1px solid #e5e7eb;
                        vertical-align: top;
                    }
                    .report-group-table tr:nth-child(even) {
                        background: #fafafa;
                    }
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
                        .summary-box { page-break-inside: avoid; }
                        .report-group { page-break-inside: avoid; }
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

    return (
        <div className="modal-overlay" onClick={handleClose}>
            <div className="modal-content report-modal" onClick={(e) => e.stopPropagation()}>
                <div className="modal-header">
                    <h2>📊 Generate Report</h2>
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

                                <div className="summary-box">
                                    <div className="summary-item">
                                        <div className="number">{reportData.summary.total}</div>
                                        <div className="label">Total</div>
                                    </div>
                                    <div className="summary-item">
                                        <div className="number" style={{ color: '#28a745' }}>{reportData.summary.done}</div>
                                        <div className="label">Done</div>
                                    </div>
                                    <div className="summary-item">
                                        <div className="number" style={{ color: '#ffc107' }}>{reportData.summary.progress}</div>
                                        <div className="label">Progress</div>
                                    </div>
                                    <div className="summary-item">
                                        <div className="number" style={{ color: '#dc3545' }}>{reportData.summary.hold}</div>
                                        <div className="label">Hold</div>
                                    </div>
                                </div>

                                {/* Grouped by Site/Client Name */}
                                {(() => {
                                    // Group items by name
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
                                                            <td>{item.services || '-'}</td>
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
