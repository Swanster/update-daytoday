import { useState, useEffect, useRef } from 'react';
import { picMembersApi } from '../api/picMembers';
// import './QuickAddModal.css'; // Removed custom CSS

export default function QuickAddModal({ isOpen, onClose, onSave, entryName, entryType = 'daily' }) {
    const [formData, setFormData] = useState({
        date: new Date().toISOString().split('T')[0],
        picTeam: [],
        description: '',
        attachment: null
    });
    const [submitting, setSubmitting] = useState(false);
    const [picMembers, setPicMembers] = useState([]);
    const [showPicDropdown, setShowPicDropdown] = useState(false);
    const picDropdownRef = useRef(null);

    // Fetch PIC members on mount
    useEffect(() => {
        const fetchPicMembers = async () => {
            try {
                const data = await picMembersApi.getAll();
                setPicMembers(data);
            } catch (error) {
                console.error('Error fetching PIC members:', error);
            }
        };
        if (isOpen) {
            fetchPicMembers();
        }
    }, [isOpen]);

    // Handle clicks outside PIC dropdown
    useEffect(() => {
        const handleClickOutsidePic = (event) => {
            if (picDropdownRef.current && !picDropdownRef.current.contains(event.target)) {
                setShowPicDropdown(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutsidePic);
        return () => document.removeEventListener('mousedown', handleClickOutsidePic);
    }, []);

    if (!isOpen) return null;

    const togglePicMember = (memberName) => {
        setFormData(prev => {
            const picTeam = prev.picTeam || [];
            if (picTeam.includes(memberName)) {
                return { ...prev, picTeam: picTeam.filter(m => m !== memberName) };
            } else {
                return { ...prev, picTeam: [...picTeam, memberName] };
            }
        });
    };

    const removePicMember = (memberName) => {
        setFormData(prev => ({
            ...prev,
            picTeam: (prev.picTeam || []).filter(m => m !== memberName)
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSubmitting(true);
        
        try {
            const data = {
                date: formData.date,
                picTeam: formData.picTeam,
                status: 'Progress'
            };

            if (entryType === 'daily') {
                data.clientName = entryName;
                data.detailAction = formData.description;
                data.services = [];
                data.caseIssue = [];
                data.action = '';
            } else {
                data.projectName = entryName;
                data.progress = formData.description;
                data.services = [];
            }

            await onSave(data);
            
            // Reset form
            setFormData({
                date: new Date().toISOString().split('T')[0],
                picTeam: [],
                description: '',
                attachment: null
            });
            onClose();
        } catch (err) {
            console.error('Save error:', err);
            alert('Failed to save: ' + (err.response?.data?.message || err.message));
        } finally {
            setSubmitting(false);
        }
    };

    const handleClose = () => {
        setFormData({
            date: new Date().toISOString().split('T')[0],
            picTeam: [],
            description: '',
            attachment: null
        });
        setShowPicDropdown(false);
        onClose();
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fade-in" onClick={handleClose}>
            <div className="bg-white w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden flex flex-col animate-scale-in" onClick={(e) => e.stopPropagation()}>
                <div className="px-6 py-4 border-b border-gray-100 bg-gray-50 flex items-center justify-between">
                    <h3 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                        <span className="text-indigo-500">✦</span>
                        Quick Add - {entryName}
                    </h3>
                    <button className="w-8 h-8 flex items-center justify-center rounded-full bg-white text-gray-400 hover:text-gray-600 hover:bg-gray-100 border border-gray-200 transition-all shadow-sm" onClick={handleClose}>
                        ✕
                    </button>
                </div>
                <form onSubmit={handleSubmit} className="flex flex-col flex-1">
                    <div className="p-6 space-y-5">
                        {/* Date */}
                        <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-1.5 flex items-center gap-2">
                                <span>📅</span> Date
                            </label>
                            <input
                                type="date"
                                value={formData.date}
                                onChange={(e) => setFormData(prev => ({ ...prev, date: e.target.value }))}
                                required
                                className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all text-sm font-mono"
                            />
                        </div>
                        
                        {/* PIC Team Multi-select Dropdown */}
                        <div className="relative" ref={picDropdownRef}>
                            <label className="block text-sm font-semibold text-gray-700 mb-1.5 flex items-center gap-2">
                                <span>👤</span> PIC Team
                            </label>
                            <div
                                className="min-h-[46px] w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-xl focus-within:ring-2 focus-within:ring-indigo-500/20 focus-within:border-indigo-500 transition-all cursor-pointer flex flex-wrap items-center gap-2"
                                onClick={() => setShowPicDropdown(!showPicDropdown)}
                            >
                                {formData.picTeam.length > 0 ? (
                                    formData.picTeam.map((member, idx) => (
                                        <span key={idx} className="inline-flex items-center px-2.5 py-1 rounded-lg bg-indigo-50 text-indigo-700 border border-indigo-100 text-xs font-medium group">
                                            {member}
                                            <button
                                                type="button"
                                                className="ml-1.5 text-indigo-400 hover:text-indigo-600 transition-colors"
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    removePicMember(member);
                                                }}
                                            >
                                                &times;
                                            </button>
                                        </span>
                                    ))
                                ) : (
                                    <span className="text-gray-400 text-sm">Select team members...</span>
                                )}
                                <span className="absolute right-4 top-10 text-gray-400 text-xs">▼</span>
                            </div>
                            {showPicDropdown && (
                                <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-xl shadow-lg max-h-60 overflow-auto z-30 p-2 grid grid-cols-2 gap-1">
                                    {picMembers.map((member) => (
                                        <label key={member._id} className="flex items-center gap-2 px-3 py-2 hover:bg-gray-50 rounded-lg cursor-pointer transition-colors">
                                            <input
                                                type="checkbox"
                                                checked={formData.picTeam.includes(member.name)}
                                                onChange={() => togglePicMember(member.name)}
                                                className="w-4 h-4 text-indigo-600 rounded border-gray-300 focus:ring-indigo-500"
                                            />
                                            <span className="text-sm text-gray-700">{member.name}</span>
                                        </label>
                                    ))}
                                    {picMembers.length === 0 && (
                                        <div className="col-span-2 text-center py-4 text-gray-400 text-sm">No team members available</div>
                                    )}
                                </div>
                            )}
                        </div>
                        
                        {/* Description */}
                        <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-1.5 flex items-center gap-2">
                                <span>📝</span> Description
                            </label>
                            <textarea
                                placeholder="Enter activity details..."
                                value={formData.description}
                                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                                rows={3}
                                className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all text-sm leading-relaxed"
                            />
                        </div>
                        
                        {/* Attachment */}
                        <div>
                             <label className="block text-sm font-semibold text-gray-700 mb-1.5 flex items-center gap-2">
                                <span>📎</span> Attachment
                            </label>
                            <div className="flex items-center gap-3">
                                <label className="flex-1 cursor-pointer">
                                    <span className="flex items-center justify-center w-full px-4 py-3 bg-gray-50 border border-dashed border-gray-300 rounded-xl hover:bg-indigo-50 hover:border-indigo-300 transition-colors text-sm text-gray-500 font-medium">
                                        {formData.attachment ? 'Change File' : 'Choose File'}
                                        <input
                                            type="file"
                                            onChange={(e) => setFormData(prev => ({ ...prev, attachment: e.target.files[0] }))}
                                            className="hidden"
                                        />
                                    </span>
                                </label>
                                {formData.attachment && (
                                    <div className="flex-1 px-4 py-3 bg-indigo-50 border border-indigo-100 rounded-xl text-sm text-indigo-700 font-medium truncate flex items-center gap-2">
                                        <span>📄</span> {formData.attachment.name}
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                    
                    <div className="px-6 py-4 bg-gray-50 border-t border-gray-100 flex justify-end gap-3 rounded-b-2xl">
                        <button 
                            type="button" 
                            className="px-6 py-2.5 text-gray-600 font-bold text-sm hover:bg-gray-200/50 rounded-xl transition-colors"
                            onClick={handleClose}
                        >
                            Cancel
                        </button>
                        <button 
                            type="submit" 
                            className="px-8 py-2.5 bg-indigo-600 text-white font-bold text-sm rounded-xl hover:bg-indigo-700 focus:ring-4 focus:ring-indigo-500/30 transition-all shadow-md transform active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
                            disabled={submitting}
                        >
                            {submitting ? 'Saving...' : 'Save Entry'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
