import { useState, useEffect, useRef } from 'react';
import { projectsApi } from '../api/projects';
import { dailiesApi } from '../api/dailies';
import { workOrdersApi } from '../api/workOrders';
import * as XLSX from 'xlsx';
// import './ReportModal.css'; // Removed custom CSS

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
            const api = apiType === 'daily' ? dailiesApi : (apiType === 'wo' ? workOrdersApi : projectsApi);
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

        const items = apiType === 'daily' ? reportData.dailies : (apiType === 'wo' ? reportData.workOrders : reportData.projects);

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
            } else if (apiType === 'wo') {
                return {
                    'No': idx + 1,
                    'Client': item.clientName,
                    'Client Status': item.clientStatus,
                    'Service': item.services,
                    'Detail Request': item.detailRequest,
                    'Due Date': item.dueDate ? new Date(item.dueDate).toLocaleDateString('id-ID') : '',
                    'Req Barang': item.requestBarang,
                    'Req Jasa': item.requestJasa,
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

        // Client Status breakdown sheet (for WO)
        const clientStatusData = apiType === 'wo' ? Object.entries(reportData.clientStatusStats || {}).map(([status, stats]) => ({
            'Status': status,
            'Total': stats.total,
            'Done': stats.done,
            'Progress': stats.progress,
            'Hold': stats.hold
        })) : [];

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

        if (clientStatusData.length > 0) {
            const wsClientStatus = XLSX.utils.json_to_sheet(clientStatusData);
            XLSX.utils.book_append_sheet(wb, wsClientStatus, 'Client Status');
        }



        const wsData = XLSX.utils.json_to_sheet(excelData);
        XLSX.utils.book_append_sheet(wb, wsData, apiType === 'daily' ? 'Daily Activity' : (apiType === 'wo' ? 'Work Orders' : 'Projects'));

        // Generate filename
        const period = isYearly ? `Year-${selectedYear}` : selectedQuarter;
        const filename = `${apiType === 'daily' ? 'Daily_Activity' : (apiType === 'wo' ? 'Work_Order' : 'Project')}_Report_${period}.xlsx`;

        XLSX.writeFile(wb, filename);
    };

    const handlePrint = () => {
        const printContent = printRef.current;
        const printWindow = window.open('', '_blank');

        printWindow.document.write(`
            <!DOCTYPE html>
            <html>
            <head>
                <title>Report - ${apiType === 'daily' ? 'Daily Activity' : (apiType === 'wo' ? 'Work Order' : 'Project')}</title>
                <link rel="preconnect" href="https://fonts.googleapis.com">
                <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
                <link href="https://fonts.googleapis.com/css2?family=Lexend:wght@300;400;500;600;700;800&display=swap" rel="stylesheet">
                <style>
                    * { margin: 0; padding: 0; box-sizing: border-box; }
                    body { 
                        font-family: 'Lexend', sans-serif; 
                        padding: 40px;
                        color: #112d4e;
                        background-color: white;
                        -webkit-print-color-adjust: exact !important;
                        print-color-adjust: exact !important;
                    }
                    .report-header {
                        text-align: center;
                        border-bottom: 4px solid #3f72af;
                        padding-bottom: 25px;
                        margin-bottom: 35px;
                    }
                    .report-header h1 {
                        font-size: 26px;
                        color: #112d4e;
                        margin-bottom: 8px;
                        text-transform: uppercase;
                        letter-spacing: -0.02em;
                    }
                    .report-header h2 {
                        font-size: 18px;
                        color: #3f72af;
                        font-weight: 700;
                    }
                    .report-header p {
                        color: #3f72af;
                        margin-top: 12px;
                        font-weight: 500;
                    }
                    .summary-cards {
                        display: flex;
                        justify-content: space-around;
                        background: #f9f7f7 !important;
                        padding: 25px;
                        border-radius: 24px;
                        margin-bottom: 30px;
                        border: 1px solid #dbe2ef !important;
                    }
                    .summary-card {
                        text-align: center;
                        padding: 15px 20px;
                    }
                    .summary-card .value {
                        font-size: 36px;
                        font-weight: 800;
                        color: #112d4e;
                    }
                    .summary-card .percent {
                        font-size: 14px;
                        color: #3f72af;
                        font-weight: 600;
                    }
                    .summary-card .label {
                        font-size: 11px;
                        color: #3f72af;
                        text-transform: uppercase;
                        font-weight: 700;
                        letter-spacing: 0.1em;
                        margin-top: 4px;
                    }
                    .summary-card.done .value { color: #22c55e; }
                    .summary-card.progress .value { color: #f59e0b; }
                    .summary-card.hold .value { color: #ef4444; }
                    .chart-container {
                        background: #fff;
                        border: 1px solid #dbe2ef;
                        border-radius: 24px;
                        padding: 24px;
                        margin-bottom: 24px;
                    }
                    .chart-container h4 {
                        margin-bottom: 20px;
                        color: #112d4e;
                        font-weight: 700;
                        display: flex;
                        align-items: center;
                        gap: 10px;
                    }
                    .bar-chart { margin-bottom: 20px; }
                    .bar-item {
                        display: flex;
                        align-items: center;
                        margin-bottom: 12px;
                    }
                    .bar-label {
                        width: 130px;
                        font-size: 12px;
                        font-weight: 600;
                        color: #112d4e;
                    }
                    .bar-track {
                        flex: 1;
                        height: 24px;
                        background: #f9f7f7 !important;
                        border-radius: 12px;
                        overflow: hidden;
                        border: 1px solid #dbe2ef !important;
                    }
                    .bar-fill {
                        border-radius: 12px;
                    }
                    .bar-chart .bar-fill { height: 100%; }
                    .chart-container .bar-fill { width: 100%; }
                    .bar-fill.done { background: #22c55e !important; }
                    .bar-fill.progress { background: #f59e0b !important; }
                    .bar-fill.hold { background: #ef4444 !important; }
                    .bar-fill.total { background: #3f72af !important; }
                    .bar-value {
                        width: 45px;
                        text-align: right;
                        font-size: 12px;
                        font-weight: 700;
                        margin-left: 10px;
                        color: #112d4e;
                    }
                    table {
                        width: 100%;
                        border-collapse: separate;
                        border-spacing: 0;
                        font-size: 11px;
                        margin-top: 15px;
                        border-radius: 16px;
                        overflow: hidden;
                        border: 1px solid #dbe2ef;
                    }
                    th {
                        background: #112d4e;
                        color: white;
                        padding: 14px 12px;
                        text-align: left;
                        font-weight: 700;
                        text-transform: uppercase;
                        letter-spacing: 0.05em;
                    }
                    td {
                        padding: 12px;
                        border-bottom: 1px solid #dbe2ef;
                        vertical-align: top;
                        color: #112d4e;
                    }
                    tr:last-child td { border-bottom: none; }
                    tr:nth-child(even) { background: #f9f7f7; }
                    .status-done { color: #22c55e; font-weight: 700; }
                    .status-progress { color: #f59e0b; font-weight: 700; }
                    .status-hold { color: #ef4444; font-weight: 700; }
                    .footer {
                        margin-top: 40px;
                        text-align: center;
                        color: #3f72af;
                        font-size: 11px;
                        border-top: 1px solid #dbe2ef;
                        padding-top: 20px;
                        font-weight: 500;
                    }
                    @media print {
                        body { padding: 0.5cm; }
                        .summary-cards { page-break-inside: avoid; border: 1px solid #dbe2ef !important; }
                        .chart-container { page-break-inside: avoid; border: 1px solid #dbe2ef !important; }
                        table { page-break-inside: auto; }
                        tr { page-break-inside: avoid; page-break-after: auto; }
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

    const items = reportData ? (apiType === 'daily' ? reportData.dailies : (apiType === 'wo' ? reportData.workOrders : reportData.projects)) : [];

    const formatDate = (date) => {
        if (!date) return '-';
        return new Date(date).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' });
    };

    const getStatusClass = (status) => {
        if (status === 'Done') return 'text-green-600 font-semibold';
        if (status === 'Progress') return 'text-amber-500 font-semibold';
        if (status === 'Hold') return 'text-red-500 font-semibold';
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
            <div className="bar-chart space-y-3">
                {entries.map(([label, stats]) => (
                    <div key={label} className="bar-item flex items-center gap-3">
                        <span className="bar-label w-24 text-xs font-medium text-ch-dark truncate" title={label}>{label}</span>
                        <div className="bar-track flex-1 h-3 bg-ch-soft rounded-full overflow-hidden flex">
                            {showStatus ? (
                                <>
                                    {stats.done > 0 && (
                                        <div className="bar-fill done bg-green-500 h-full" style={{ width: `${(stats.done / maxValue) * 100}%` }} />
                                    )}
                                    {stats.progress > 0 && (
                                        <div className="bar-fill progress bg-amber-400 h-full" style={{ width: `${(stats.progress / maxValue) * 100}%` }} />
                                    )}
                                    {stats.hold > 0 && (
                                        <div className="bar-fill hold bg-red-500 h-full" style={{ width: `${(stats.hold / maxValue) * 100}%` }} />
                                    )}
                                </>
                            ) : (
                                <div className="bar-fill total bg-ch-primary h-full" style={{ width: `${(stats.total / maxValue) * 100}%` }} />
                            )}
                        </div>
                        <span className="bar-value w-8 text-right text-xs font-bold text-ch-dark">{stats.total}</span>
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
            <div className="chart-container bg-white rounded-xl border border-ch-soft p-6 col-span-full shadow-sm">
                <h4 className="text-ch-dark font-bold mb-4 flex items-center gap-2">
                    <span>📈</span> Quarterly Trend - {selectedYear}
                </h4>
                <div className="flex items-end justify-between h-48 pt-4 pb-2 px-2 gap-4">
                    {reportData.quarterlyTrend.map(q => (
                        <div key={q.quarter} className="flex flex-col items-center flex-1 gap-2 group cursor-default">
                           <div className="bar-track w-full max-w-[60px] flex flex-col-reverse h-full bg-ch-light rounded-lg overflow-hidden relative">
                                <div 
                                    className="bar-fill done bg-green-500 w-full transition-all duration-500" 
                                    style={{ height: `${maxTotal > 0 ? (q.done / maxTotal) * 100 : 0}%` }}
                                    title={`Done: ${q.done}`}
                                />
                                <div 
                                    className="bar-fill progress bg-amber-400 w-full transition-all duration-500" 
                                    style={{ height: `${maxTotal > 0 ? (q.progress / maxTotal) * 100 : 0}%` }}
                                    title={`Progress: ${q.progress}`}
                                />
                                <div 
                                    className="bar-fill hold bg-red-500 w-full transition-all duration-500" 
                                    style={{ height: `${maxTotal > 0 ? (q.hold / maxTotal) * 100 : 0}%` }}
                                    title={`Hold: ${q.hold}`}
                                />
                            </div>
                            <div className="text-xs font-bold text-ch-dark">{q.quarter}</div>
                            <div className="text-[10px] text-ch-primary font-mono">{q.total} total</div>
                        </div>
                    ))}
                </div>
                <div className="flex items-center justify-center gap-6 mt-4 pt-4 border-t border-ch-soft">
                    <div className="flex items-center gap-2 text-xs text-ch-dark"><span className="w-3 h-3 rounded-full bg-green-500"></span> Done</div>
                    <div className="flex items-center gap-2 text-xs text-ch-dark"><span className="w-3 h-3 rounded-full bg-amber-400"></span> Progress</div>
                    <div className="flex items-center gap-2 text-xs text-ch-dark"><span className="w-3 h-3 rounded-full bg-red-500"></span> Hold</div>
                </div>
            </div>
        );
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fade-in" onClick={handleClose}>
            <div className="bg-white w-full max-w-6xl max-h-[90vh] rounded-2xl shadow-2xl flex flex-col glass overflow-hidden animate-fade-in-up" onClick={(e) => e.stopPropagation()}>
                <div className="px-6 py-4 border-b border-ch-soft bg-white/50 backdrop-blur-md flex items-center justify-between flex-shrink-0">
                    <h2 className="text-xl font-bold text-ch-dark flex items-center gap-2">
                        <span className="text-ch-primary">📊</span>
                        Professional Report
                    </h2>
                    <button className="w-8 h-8 flex items-center justify-center rounded-full bg-white text-ch-primary hover:text-ch-dark hover:bg-ch-soft border border-ch-soft transition-all shadow-sm" onClick={handleClose}>
                        &times;
                    </button>
                </div>

                <div className="flex-1 overflow-y-auto p-6 scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-transparent">
                    {/* Report Options */}
                    <div className="flex flex-wrap items-center justify-between gap-4 mb-8 bg-ch-light p-4 rounded-xl border border-ch-soft">
                        <div className="flex items-center gap-4">
                            <label className="flex items-center gap-2 cursor-pointer">
                                <input
                                    type="radio"
                                    className="w-4 h-4 text-ch-primary focus:ring-ch-primary border-gray-300"
                                    checked={!isYearly}
                                    onChange={() => setIsYearly(false)}
                                />
                                <span className="text-sm font-medium text-ch-dark">Quarterly Report</span>
                            </label>
                            <label className="flex items-center gap-2 cursor-pointer">
                                <input
                                    type="radio"
                                    className="w-4 h-4 text-ch-primary focus:ring-ch-primary border-gray-300"
                                    checked={isYearly}
                                    onChange={() => setIsYearly(true)}
                                />
                                <span className="text-sm font-medium text-ch-dark">Yearly Report</span>
                            </label>
                        </div>

                        <div className="flex items-center gap-4">
                            {!isYearly ? (
                                <select
                                    className="px-4 py-2 bg-white border border-gray-300 rounded-lg text-sm font-medium text-ch-dark focus:outline-none focus:ring-2 focus:ring-ch-primary/20 focus:border-ch-primary"
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
                                    className="px-4 py-2 bg-white border border-gray-300 rounded-lg text-sm font-medium text-ch-dark focus:outline-none focus:ring-2 focus:ring-ch-primary/20 focus:border-ch-primary"
                                    value={selectedYear}
                                    onChange={(e) => setSelectedYear(parseInt(e.target.value))}
                                >
                                    {years.map(y => (
                                        <option key={y} value={y}>{y}</option>
                                    ))}
                                </select>
                            )}
                        </div>
                    </div>

                    {/* View Toggle */}
                    <div className="flex justify-center mb-8">
                        <div className="bg-ch-soft p-1 rounded-xl inline-flex">
                            <button 
                                className={`px-6 py-2 rounded-lg text-sm font-medium transition-all ${viewMode === 'summary' ? 'bg-white text-ch-primary shadow-sm' : 'text-ch-primary hover:text-ch-dark'}`}
                                onClick={() => setViewMode('summary')}
                            >
                                📊 Summary
                            </button>
                            <button 
                                className={`px-6 py-2 rounded-lg text-sm font-medium transition-all ${viewMode === 'detail' ? 'bg-white text-ch-primary shadow-sm' : 'text-ch-primary hover:text-ch-dark'}`}
                                onClick={() => setViewMode('detail')}
                            >
                                📋 Detail
                            </button>
                        </div>
                    </div>

                    {/* Report Preview */}
                    <div className="bg-white rounded-xl border border-ch-soft shadow-sm min-h-[400px]" ref={printRef}>
                        {loading ? (
                            <div className="flex flex-col items-center justify-center h-[400px] text-ch-primary">
                                <div className="w-10 h-10 border-4 border-ch-soft border-t-ch-primary rounded-full animate-spin mb-4"></div>
                                <p>Loading report...</p>
                            </div>
                        ) : reportData ? (
                            <div className="p-8">
                                <div className="report-header text-center border-b-[3px] border-[#ff5757] pb-6 mb-8">
                                    <h1 className="text-2xl font-bold text-[#1a1a2e] mb-1 tracking-wide">{apiType === 'daily' ? 'DAILY ACTIVITY' : (apiType === 'wo' ? 'WORK ORDER' : 'PROJECT')} INFRASTRUCTURE ENGINEER</h1>
                                    <h2 className="text-lg text-[#ff5757] font-medium">{isYearly ? `Year ${selectedYear}` : selectedQuarter}</h2>
                                    <p className="text-ch-primary text-sm mt-2">Generated on {new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
                                </div>

                                {/* Summary Cards */}
                                <div className="summary-cards grid grid-cols-2 md:grid-cols-4 gap-4 mb-8 bg-ch-light p-6 rounded-xl">
                                    <div className="summary-card text-center p-4 bg-white rounded-xl shadow-sm border border-ch-soft">
                                        <div className="value text-3xl font-bold text-ch-primary mb-1">{reportData.summary.total}</div>
                                        <div className="percent text-xs font-medium text-ch-dark mb-1">100%</div>
                                        <div className="label text-[10px] uppercase tracking-wider text-ch-primary font-bold">Total</div>
                                    </div>
                                    <div className="summary-card done text-center p-4 bg-white rounded-xl shadow-sm border border-ch-soft">
                                        <div className="value text-3xl font-bold text-green-500 mb-1">{reportData.summary.done}</div>
                                        <div className="percent text-xs font-medium text-ch-dark mb-1">{reportData.summary.donePercent || 0}%</div>
                                        <div className="label text-[10px] uppercase tracking-wider text-ch-primary font-bold">Done</div>
                                    </div>
                                    <div className="summary-card progress text-center p-4 bg-white rounded-xl shadow-sm border border-ch-soft">
                                        <div className="value text-3xl font-bold text-amber-500 mb-1">{reportData.summary.progress}</div>
                                        <div className="percent text-xs font-medium text-ch-dark mb-1">{reportData.summary.progressPercent || 0}%</div>
                                        <div className="label text-[10px] uppercase tracking-wider text-ch-primary font-bold">Progress</div>
                                    </div>
                                    <div className="summary-card hold text-center p-4 bg-white rounded-xl shadow-sm border border-ch-soft">
                                        <div className="value text-3xl font-bold text-red-500 mb-1">{reportData.summary.hold}</div>
                                        <div className="percent text-xs font-medium text-ch-dark mb-1">{reportData.summary.holdPercent || 0}%</div>
                                        <div className="label text-[10px] uppercase tracking-wider text-ch-primary font-bold">Hold</div>
                                    </div>
                                </div>

                                {viewMode === 'summary' && (
                                    <>
                                        {/* Charts */}
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                                            {/* Service Breakdown */}
                                            <div className="chart-container bg-white rounded-xl border border-ch-soft p-6 shadow-sm">
                                                <h4 className="text-ch-dark font-bold mb-4 flex items-center gap-2">
                                                    <span>🏷️</span> Service Breakdown
                                                </h4>
                                                {Object.keys(reportData.serviceStats || {}).length > 0 ? (
                                                    renderBarChart(reportData.serviceStats, getMaxValue(reportData.serviceStats), true)
                                                ) : (
                                                    <p className="text-ch-primary text-center py-4 text-sm">No service data</p>
                                                )}
                                            </div>

                                            {/* PIC Team Performance (Hide for WO if not needed, or replace with Client Status) */}
                                            {apiType === 'wo' ? (
                                                <div className="chart-container bg-white rounded-xl border border-ch-soft p-6 shadow-sm">
                                                    <h4 className="text-ch-dark font-bold mb-4 flex items-center gap-2">
                                                        <span>🏢</span> Client Status
                                                    </h4>
                                                    {Object.keys(reportData.clientStatusStats || {}).length > 0 ? (
                                                        renderBarChart(reportData.clientStatusStats, getMaxValue(reportData.clientStatusStats), true)
                                                    ) : (
                                                        <p className="text-ch-primary text-center py-4 text-sm">No client status data</p>
                                                    )}
                                                </div>
                                            ) : (
                                                <div className="chart-container bg-white rounded-xl border border-ch-soft p-6 shadow-sm">
                                                    <h4 className="text-ch-dark font-bold mb-4 flex items-center gap-2">
                                                        <span>👥</span> PIC Team Workload
                                                    </h4>
                                                    {Object.keys(reportData.picStats || {}).length > 0 ? (
                                                        renderBarChart(reportData.picStats, getMaxValue(reportData.picStats), true)
                                                    ) : (
                                                        <p className="text-ch-primary text-center py-4 text-sm">No PIC data</p>
                                                    )}
                                                </div>
                                            )}
                                        </div>

                                        {/* Quarterly Trend (for yearly reports) */}
                                        {isYearly && (
                                            <div className="mb-8">
                                                {renderQuarterlyTrend()}
                                            </div>
                                        )}

                                        {/* PIC Team Table (Hide for WO) */}
                                        {apiType !== 'wo' && Object.keys(reportData.picStats || {}).length > 0 && (
                                            <div className="bg-white rounded-xl border border-ch-soft p-6 shadow-sm">
                                                <h4 className="text-ch-dark font-bold mb-4 flex items-center gap-2">
                                                    <span>📋</span> PIC Team Details
                                                </h4>
                                                <div className="overflow-x-auto">
                                                    <table className="w-full text-sm">
                                                        <thead>
                                                            <tr className="bg-ch-light border-b border-ch-soft text-left">
                                                                <th className="py-3 px-4 font-semibold text-ch-dark">PIC Member</th>
                                                                <th className="py-3 px-4 font-semibold text-ch-dark">Total</th>
                                                                <th className="py-3 px-4 font-semibold text-ch-dark">Done</th>
                                                                <th className="py-3 px-4 font-semibold text-ch-dark">Progress</th>
                                                                <th className="py-3 px-4 font-semibold text-ch-dark">Hold</th>
                                                            </tr>
                                                        </thead>
                                                        <tbody className="divide-y divide-ch-soft">
                                                            {Object.entries(reportData.picStats)
                                                                .sort((a, b) => b[1].total - a[1].total)
                                                                .map(([pic, stats]) => (
                                                                    <tr key={pic} className="hover:bg-ch-light/50">
                                                                        <td className="py-3 px-4 font-medium text-ch-dark">{pic}</td>
                                                                        <td className="py-3 px-4 text-ch-dark">{stats.total}</td>
                                                                        <td className="py-3 px-4 text-green-600 font-medium">{stats.done}</td>
                                                                        <td className="py-3 px-4 text-amber-500 font-medium">{stats.progress}</td>
                                                                        <td className="py-3 px-4 text-red-500 font-medium">{stats.hold}</td>
                                                                    </tr>
                                                                ))}
                                                        </tbody>
                                                    </table>
                                                </div>
                                            </div>
                                        )}
                                    </>
                                )}

                                {viewMode === 'detail' && (
                                    <div className="space-y-8">
                                        {/* Grouped by Site/Client Name */}
                                        {(() => {
                                            const nameKey = apiType === 'daily' ? 'clientName' : (apiType === 'wo' ? 'clientName' : 'projectName');
                                            const grouped = {};
                                            items.forEach(item => {
                                                const name = item[nameKey] || 'Unknown';
                                                if (!grouped[name]) grouped[name] = [];
                                                grouped[name].push(item);
                                            });

                                            return Object.entries(grouped).map(([siteName, siteItems], groupIdx) => (
                                                <div key={siteName} className="border border-ch-soft rounded-xl overflow-hidden">
                                                    <div className="bg-ch-light px-6 py-4 border-b border-ch-soft flex items-center justify-between">
                                                        <div className="flex items-center gap-3">
                                                            <span className="w-6 h-6 rounded-full bg-ch-primary text-white flex items-center justify-center text-xs font-bold">{groupIdx + 1}</span>
                                                            <span className="font-bold text-ch-dark">{siteName}</span>
                                                        </div>
                                                        <span className="text-xs font-semibold bg-white border border-ch-soft px-3 py-1 rounded-full text-ch-dark">{siteItems.length} entries</span>
                                                    </div>
                                                    <div className="overflow-x-auto">
                                                        <table className="w-full text-sm">
                                                            <thead>
                                                                <tr className="bg-white border-b border-ch-soft text-left text-xs uppercase text-ch-primary tracking-wider">
                                                                    <th className="py-3 px-4 w-12 font-semibold">No</th>
                                                                    <th className="py-3 px-4 font-semibold">Service</th>
                                                                    <th className="py-3 px-4 w-32 font-semibold">Date</th>
                                                                    <th className="py-3 px-4 font-semibold">{apiType === 'wo' ? 'Client Status' : 'PIC'}</th>
                                                                    <th className="py-3 px-4 font-semibold">{apiType === 'daily' ? 'Detail Action' : (apiType === 'wo' ? 'Detail Request' : 'Progress')}</th>
                                                                    <th className="py-3 px-4 w-24 font-semibold">Status</th>
                                                                </tr>
                                                            </thead>
                                                            <tbody className="divide-y divide-ch-light">
                                                                {siteItems.map((item, idx) => (
                                                                    <tr key={item._id || idx} className="hover:bg-ch-light/50">
                                                                        <td className="py-3 px-4 text-ch-primary">{idx + 1}</td>
                                                                        <td className="py-3 px-4 text-ch-dark font-medium">{Array.isArray(item.services) ? item.services.join(', ') : item.services || '-'}</td>
                                                                        <td className="py-3 px-4 text-ch-dark font-mono text-xs">{formatDate(item.date || item.dueDate)}</td>
                                                                        <td className="py-3 px-4 text-ch-dark break-words">{apiType === 'wo' ? item.clientStatus : (Array.isArray(item.picTeam) ? item.picTeam.join(', ') : item.picTeam || '-')}</td>
                                                                        <td className="py-3 px-4 text-ch-dark text-xs min-w-[200px] whitespace-normal break-words">{apiType === 'daily' ? item.detailAction : (apiType === 'wo' ? item.detailRequest : item.progress || '-')}</td>
                                                                        <td className={`py-3 px-4 text-xs ${getStatusClass(item.status)}`}>{item.status || '-'}</td>
                                                                    </tr>
                                                                ))}
                                                            </tbody>
                                                        </table>
                                                    </div>
                                                </div>
                                            ));
                                        })()}
                                    </div>
                                )}

                                <div className="mt-12 pt-6 border-t border-ch-soft text-center">
                                    <p className="text-xs text-ch-primary">Daily Activity Infrastructure Engineer - Report generated by system</p>
                                </div>
                            </div>
                        ) : (
                            <div className="flex flex-col items-center justify-center h-[400px] text-ch-primary">
                                <span className="text-4xl mb-2">📊</span>
                                <p>Select a period to generate report</p>
                            </div>
                        )}
                    </div>
                </div>

                <div className="px-6 py-4 bg-ch-light border-t border-ch-soft flex justify-end gap-3 flex-shrink-0">
                    <button 
                        className="px-6 py-2.5 text-ch-dark font-bold text-sm hover:bg-ch-soft/50 rounded-xl transition-colors" 
                        onClick={handleClose}
                    >
                        Close
                    </button>
                    <button
                        className="px-8 py-2.5 bg-green-600 text-white font-bold text-sm rounded-xl hover:bg-green-700 focus:ring-4 focus:ring-green-500/30 transition-all shadow-md transform active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                        onClick={handleExportExcel}
                        disabled={!reportData || loading}
                    >
                        <span>📥</span> Download Excel
                    </button>
                    <button
                        className="px-8 py-2.5 bg-ch-primary text-white font-bold text-sm rounded-xl hover:bg-ch-dark focus:ring-4 focus:ring-ch-primary/30 transition-all shadow-md transform active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                        onClick={handlePrint}
                        disabled={!reportData || loading}
                    >
                        <span>🖨️</span> Print / PDF
                    </button>
                </div>
            </div>
        </div>
    );
}
