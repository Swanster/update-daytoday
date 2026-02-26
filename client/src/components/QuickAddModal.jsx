import { useState, useEffect, useRef } from 'react';
import { picMembersApi } from '../api/picMembers';
import { uploadsApi } from '../api/uploads';
import { toast } from 'react-toastify';
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

            // Process attachment if exists
            if (formData.attachment) {
                try {
                    const uploadResult = await uploadsApi.uploadFile(formData.attachment);
                    data.attachments = [uploadResult];
                } catch (uploadErr) {
                    console.error('Attachment upload failed:', uploadErr);
                    toast.error('Failed to upload attachment. Entry will be saved without it.');
                }
            }

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
            toast.error('Failed to save: ' + (err.response?.data?.message || err.message));
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
            <div className="bg-white w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden flex flex-col animate-fade-in-up" onClick={(e) => e.stopPropagation()}>
                <div className="px-6 py-4 border-b border-ch-soft bg-ch-light flex items-center justify-between">
                    <h3 className="text-xl font-bold text-ch-dark flex items-center gap-2">
                        <span className="text-ch-primary">✦</span>
                        Quick Add - {entryName}
                    </h3>
                    <button className="w-8 h-8 flex items-center justify-center rounded-full bg-white text-ch-primary hover:text-ch-dark hover:bg-ch-soft border border-ch-soft transition-all shadow-sm" onClick={handleClose}>
                        ✕
                    </button>
                </div>
                <form onSubmit={handleSubmit} className="flex flex-col flex-1">
                    <div className="p-6 space-y-5">
                        {/* Date */}
                        <div>
                            <label className="block text-sm font-semibold text-ch-dark mb-1.5 flex items-center gap-2">
                                <span>📅</span> Date
                            </label>
                            <input
                                type="date"
                                value={formData.date}
                                onChange={(e) => setFormData(prev => ({ ...prev, date: e.target.value }))}
                                required
                                className="w-full px-4 py-3 bg-ch-light border border-ch-soft rounded-xl focus:outline-none focus:ring-2 focus:ring-ch-primary/20 focus:border-ch-primary transition-all text-sm font-mono"
                            />
                        </div>
                        
                        {/* PIC Team Multi-select Dropdown */}
                        <div className="relative" ref={picDropdownRef}>
                            <label className="block text-sm font-semibold text-ch-dark mb-1.5 flex items-center gap-2">
                                <span>👤</span> PIC Team
                            </label>
                            <div
                                className="min-h-[46px] w-full px-4 py-2 bg-ch-light border border-ch-soft rounded-xl focus-within:ring-2 focus-within:ring-ch-primary/20 focus-within:border-ch-primary transition-all cursor-pointer flex flex-wrap items-center gap-2"
                                onClick={() => setShowPicDropdown(!showPicDropdown)}
                            >
                                {formData.picTeam.length > 0 ? (
                                    formData.picTeam.map((member, idx) => (
                                        <span key={idx} className="inline-flex items-center px-2.5 py-1 rounded-lg bg-ch-soft text-ch-dark border border-ch-soft text-xs font-medium group">
                                            {member}
                                            <button
                                                type="button"
                                                className="ml-1.5 text-ch-primary hover:text-ch-primary transition-colors"
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
                                    <span className="text-ch-primary text-sm">Select team members...</span>
                                )}
                                <span className="absolute right-4 top-10 text-ch-primary text-xs">▼</span>
                            </div>
                            {showPicDropdown && (
                                <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-ch-soft rounded-xl shadow-lg max-h-60 overflow-auto z-30 p-2 grid grid-cols-2 gap-1">
                                    {picMembers.map((member) => (
                                        <label key={member._id} className="flex items-center gap-2 px-3 py-2 hover:bg-ch-light rounded-lg cursor-pointer transition-colors">
                                            <input
                                                type="checkbox"
                                                checked={formData.picTeam.includes(member.name)}
                                                onChange={() => togglePicMember(member.name)}
                                                className="w-4 h-4 text-ch-primary rounded border-gray-300 focus:ring-ch-primary"
                                            />
                                            <span className="text-sm text-ch-dark">{member.name}</span>
                                        </label>
                                    ))}
                                    {picMembers.length === 0 && (
                                        <div className="col-span-2 text-center py-4 text-ch-primary text-sm">No team members available</div>
                                    )}
                                </div>
                            )}
                        </div>
                        
                        {/* Description */}
                        <div>
                            <label className="block text-sm font-semibold text-ch-dark mb-1.5 flex items-center gap-2">
                                <span>📝</span> Description
                            </label>
                            <textarea
                                placeholder="Enter activity details..."
                                value={formData.description}
                                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                                rows={3}
                                className="w-full px-4 py-3 bg-ch-light border border-ch-soft rounded-xl focus:outline-none focus:ring-2 focus:ring-ch-primary/20 focus:border-ch-primary transition-all text-sm leading-relaxed"
                            />
                        </div>
                        
                        {/* Attachment */}
                        <div>
                             <label className="block text-sm font-semibold text-ch-dark mb-1.5 flex items-center gap-2">
                                <span>📎</span> Attachment
                            </label>
                            <div className="flex items-center gap-3">
                                <label className="flex-1 cursor-pointer">
                                    <span className="flex items-center justify-center w-full px-4 py-3 bg-ch-light border border-dashed border-gray-300 rounded-xl hover:bg-ch-soft hover:border-ch-primary transition-colors text-sm text-ch-primary font-medium">
                                        {formData.attachment ? 'Change File' : 'Choose File'}
                                        <input
                                            type="file"
                                            onChange={(e) => setFormData(prev => ({ ...prev, attachment: e.target.files[0] }))}
                                            className="hidden"
                                        />
                                    </span>
                                </label>
                                {formData.attachment && (
                                    <div className="flex-1 px-4 py-3 bg-ch-soft border border-ch-soft rounded-xl text-sm text-ch-dark font-medium truncate flex items-center gap-2">
                                        <span>📄</span> {formData.attachment.name}
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                    
                    <div className="px-6 py-4 bg-ch-light border-t border-ch-soft flex justify-end gap-3 rounded-b-2xl">
                        <button 
                            type="button" 
                            className="px-6 py-2.5 text-ch-dark font-bold text-sm hover:bg-ch-soft/50 rounded-xl transition-colors"
                            onClick={handleClose}
                        >
                            Cancel
                        </button>
                        <button 
                            type="submit" 
                            className="px-8 py-2.5 bg-ch-primary text-white font-bold text-sm rounded-xl hover:bg-ch-dark focus:ring-4 focus:ring-ch-primary/30 transition-all shadow-md transform active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
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
