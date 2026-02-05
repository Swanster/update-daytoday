import { useState, useEffect } from 'react';
import { activityLogsApi } from '../api/auth';

export default function ActivityLog({ token, isOpen, onClose }) {
    const [logs, setLogs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState('ALL');

    useEffect(() => {
        if (isOpen && token) {
            fetchLogs();
        }
    }, [isOpen, token, filter]);

    const fetchLogs = async () => {
        setLoading(true);
        try {
            const entityType = filter === 'ALL' ? null : filter;
            const data = await activityLogsApi.getAll(token, 1, 100, entityType);
            setLogs(data.logs);
        } catch (error) {
            console.error('Error fetching logs:', error);
        } finally {
            setLoading(false);
        }
    };

    const formatDate = (dateString) => {
        const date = new Date(dateString);
        return date.toLocaleString('en-GB', {
            day: 'numeric',
            month: 'short',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    const getActionBadge = (action) => {
        const colors = {
            CREATE: 'bg-green-100 text-green-700 border-green-200',
            UPDATE: 'bg-amber-100 text-amber-700 border-amber-200',
            DELETE: 'bg-red-100 text-red-700 border-red-200',
            LOGIN: 'bg-blue-100 text-blue-700 border-blue-200',
            LOGOUT: 'bg-gray-100 text-gray-700 border-gray-200',
            REGISTER: 'bg-indigo-100 text-indigo-700 border-indigo-200'
        };
        const badgeClass = colors[action] || 'bg-gray-100 text-gray-700 border-gray-200';
        return `px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider border ${badgeClass}`;
    };

    const getActionIcon = (action) => {
        const icons = {
            CREATE: '➕',
            UPDATE: '✏️',
            DELETE: '🗑️',
            LOGIN: '🔓',
            LOGOUT: '🔒',
            REGISTER: '👤'
        };
        return icons[action] || '📝';
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fade-in" onClick={(e) => e.target === e.currentTarget && onClose()}>
            <div className="bg-white w-full max-w-4xl max-h-[85vh] rounded-2xl shadow-2xl glass overflow-hidden flex flex-col animate-scale-in">
                <div className="px-6 py-4 border-b border-gray-100 bg-white/50 backdrop-blur-md flex items-center justify-between flex-shrink-0">
                    <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                        <span className="text-violet-500">📋</span>
                        Activity Log
                    </h2>
                    <button 
                        className="w-8 h-8 flex items-center justify-center rounded-full bg-white text-gray-400 hover:text-gray-600 hover:bg-gray-100 border border-gray-200 transition-all shadow-sm"
                        onClick={onClose}
                    >
                        &times;
                    </button>
                </div>

                <div className="flex-1 flex flex-col overflow-hidden">
                    <div className="px-6 pt-6 pb-2">
                        <div className="flex flex-wrap gap-2 mb-4 bg-gray-50/80 p-1.5 rounded-xl w-fit border border-gray-100">
                            {['ALL', 'PROJECT', 'DAILY', 'USER'].map((f) => (
                                <button
                                    key={f}
                                    className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${
                                        filter === f 
                                        ? 'bg-white text-violet-600 shadow-sm border border-gray-100' 
                                        : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100'
                                    }`}
                                    onClick={() => setFilter(f)}
                                >
                                    {f === 'ALL' ? 'All Activities' : f.charAt(0) + f.slice(1).toLowerCase() + 's'}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="flex-1 overflow-y-auto px-6 pb-6 scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-transparent">
                        {loading ? (
                            <div className="flex items-center justify-center h-40">
                                <div className="w-8 h-8 border-4 border-violet-100 border-t-violet-500 rounded-full animate-spin"></div>
                            </div>
                        ) : logs.length === 0 ? (
                            <div className="flex flex-col items-center justify-center h-full text-center py-10 opacity-70">
                                <span className="text-4xl mb-4">📜</span>
                                <h3 className="text-lg font-semibold text-gray-800">No Activity Yet</h3>
                                <p className="text-gray-500">Activity logs will appear here when actions are performed.</p>
                            </div>
                        ) : (
                            <div className="space-y-3">
                                {logs.map((log) => (
                                    <div key={log._id} className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm flex items-start gap-4 hover:border-violet-100 hover:shadow-md transition-all group">
                                        <div className="w-10 h-10 rounded-xl bg-gray-50 flex items-center justify-center text-xl flex-shrink-0 border border-gray-100 group-hover:bg-violet-50 group-hover:border-violet-100 transition-colors">
                                            {getActionIcon(log.action)}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-2 mb-1 flex-wrap">
                                                <span className={getActionBadge(log.action)}>{log.action}</span>
                                                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider bg-gray-50 px-2 py-0.5 rounded-full border border-gray-100">
                                                    {log.entityType}
                                                </span>
                                                <span className="ml-auto text-xs text-gray-400 font-mono">
                                                    {formatDate(log.createdAt)}
                                                </span>
                                            </div>
                                            <div className="text-sm text-gray-600 leading-relaxed">
                                                <span className="font-bold text-gray-900">{log.username}</span> {log.details}
                                                {log.entityName && <span className="font-medium text-violet-600 bg-violet-50 px-1.5 py-0.5 rounded mx-1">{log.entityName}</span>}
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
                
                <div className="px-6 py-4 bg-gray-50 border-t border-gray-100 flex justify-end">
                    <button className="px-6 py-2 bg-gray-200 text-gray-700 font-bold text-sm rounded-xl hover:bg-gray-300 transition-colors" onClick={onClose}>
                        Close
                    </button>
                </div>
            </div>
        </div>
    );
}
