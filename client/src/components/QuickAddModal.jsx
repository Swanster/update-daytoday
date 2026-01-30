import { useState, useEffect, useRef } from 'react';
import { picMembersApi } from '../api/picMembers';
import './QuickAddModal.css';

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
        <div className="quick-add-overlay" onClick={handleClose}>
            <div className="quick-add-modal" onClick={(e) => e.stopPropagation()}>
                <div className="quick-add-header">
                    <h3>
                        <span>✦</span>
                        Quick Add - {entryName}
                    </h3>
                    <button className="quick-add-close" onClick={handleClose}>✕</button>
                </div>
                <form onSubmit={handleSubmit}>
                    <div className="quick-add-body">
                        <div className="quick-form-group">
                            <label>
                                <span>📅</span> Date
                            </label>
                            <input
                                type="date"
                                value={formData.date}
                                onChange={(e) => setFormData(prev => ({ ...prev, date: e.target.value }))}
                                required
                            />
                        </div>
                        
                        {/* PIC Team Multi-select Dropdown */}
                        <div className="quick-form-group" ref={picDropdownRef}>
                            <label>
                                <span>👤</span> PIC Team
                            </label>
                            <div className="quick-multi-select">
                                <div
                                    className={`quick-multi-trigger ${showPicDropdown ? 'active' : ''}`}
                                    onClick={() => setShowPicDropdown(!showPicDropdown)}
                                >
                                    {formData.picTeam.length > 0 ? (
                                        <div className="quick-selected-items">
                                            {formData.picTeam.map((member, idx) => (
                                                <span key={idx} className="quick-selected-tag">
                                                    {member}
                                                    <button
                                                        type="button"
                                                        className="quick-tag-remove"
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            removePicMember(member);
                                                        }}
                                                    >
                                                        ×
                                                    </button>
                                                </span>
                                            ))}
                                        </div>
                                    ) : (
                                        <span className="quick-placeholder">Select team members...</span>
                                    )}
                                    <span className="quick-dropdown-arrow">▼</span>
                                </div>
                                {showPicDropdown && (
                                    <div className="quick-dropdown-list">
                                        {picMembers.map((member) => (
                                            <label key={member._id} className="quick-dropdown-option">
                                                <input
                                                    type="checkbox"
                                                    checked={formData.picTeam.includes(member.name)}
                                                    onChange={() => togglePicMember(member.name)}
                                                />
                                                <span>{member.name}</span>
                                            </label>
                                        ))}
                                        {picMembers.length === 0 && (
                                            <div className="quick-no-items">No team members available</div>
                                        )}
                                    </div>
                                )}
                            </div>
                        </div>
                        
                        <div className="quick-form-group">
                            <label>
                                <span>📝</span> Description
                            </label>
                            <textarea
                                placeholder="Enter activity details..."
                                value={formData.description}
                                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                                rows={3}
                            />
                        </div>
                        
                        <div className="quick-form-group">
                            <label>
                                <span>📎</span> Attachment
                            </label>
                            <input
                                type="file"
                                onChange={(e) => setFormData(prev => ({ ...prev, attachment: e.target.files[0] }))}
                            />
                            {formData.attachment && (
                                <div className="quick-file-preview">
                                    <span>📄</span> {formData.attachment.name}
                                </div>
                            )}
                        </div>
                    </div>
                    
                    <div className="quick-add-footer">
                        <button type="button" className="quick-btn-cancel" onClick={handleClose}>
                            Cancel
                        </button>
                        <button type="submit" className="quick-btn-submit" disabled={submitting}>
                            {submitting ? 'Saving...' : 'Save Entry'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
