import { useState, useEffect, useRef } from 'react';
import { projectsApi } from '../api/projects';
import { categoriesApi } from '../api/categories';
import { picMembersApi } from '../api/picMembers';
import FileUpload from './FileUpload';

export default function EntryForm({ isOpen, onClose, onSave, editData, user }) {
    const [formData, setFormData] = useState({
        projectName: '',
        services: [],
        reportSurvey: '',
        wo: '',
        material: '',
        dueDate: '',
        date: '',
        picTeam: [],
        progress: '',
        status: '',
        attachments: []
    });

    const [suggestions, setSuggestions] = useState({ exact: [], similar: [] });
    const [showSuggestions, setShowSuggestions] = useState(false);
    const [tagInput, setTagInput] = useState('');
    const [duplicateWarning, setDuplicateWarning] = useState('');
    const suggestionsRef = useRef(null);
    const projectNameRef = useRef(null);
    const categoryDropdownRef = useRef(null);
    const picDropdownRef = useRef(null);

    const [categories, setCategories] = useState([]);
    const [showCategoryDropdown, setShowCategoryDropdown] = useState(false);
    const [picMembers, setPicMembers] = useState([]);
    const [showPicDropdown, setShowPicDropdown] = useState(false);

    useEffect(() => {
        if (editData) {
            // Handle legacy string services data
            let services = editData.services || [];
            if (typeof services === 'string') {
                services = services ? [services] : [];
            }
            setFormData({
                ...editData,
                services: services,
                dueDate: editData.dueDate ? new Date(editData.dueDate).toISOString().split('T')[0] : '',
                date: editData.date ? new Date(editData.date).toISOString().split('T')[0] : '',
                picTeam: editData.picTeam || [],
                attachments: editData.attachments || []
            });
        } else {
            setFormData({
                projectName: '',
                services: [],
                reportSurvey: '',
                wo: '',
                material: '',
                dueDate: '',
                date: '',
                picTeam: [],
                progress: '',
                status: '',
                attachments: []
            });
        }
        setTagInput('');
        setDuplicateWarning('');
    }, [editData, isOpen]);

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (suggestionsRef.current && !suggestionsRef.current.contains(event.target) &&
                projectNameRef.current && !projectNameRef.current.contains(event.target)) {
                setShowSuggestions(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    // Fetch categories on mount
    useEffect(() => {
        const fetchCategories = async () => {
            try {
                const data = await categoriesApi.getAll();
                setCategories(data);
            } catch (error) {
                console.error('Error fetching categories:', error);
            }
        };
        if (isOpen) {
            fetchCategories();
        }
    }, [isOpen]);

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

    // Handle clicks outside category dropdown
    useEffect(() => {
        const handleClickOutsideCategory = (event) => {
            if (categoryDropdownRef.current && !categoryDropdownRef.current.contains(event.target)) {
                setShowCategoryDropdown(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutsideCategory);
        return () => document.removeEventListener('mousedown', handleClickOutsideCategory);
    }, []);

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

    const handleProjectNameChange = async (e) => {
        const value = e.target.value;
        setFormData(prev => ({ ...prev, projectName: value }));
        setDuplicateWarning('');

        if (value.length >= 2) {
            try {
                const data = await projectsApi.getSuggestions(value);
                setSuggestions(data);
                setShowSuggestions(true);

                // Check for exact match (duplicate warning)
                if (data.exact.some(name => name.toLowerCase() === value.toLowerCase())) {
                    setDuplicateWarning('This project name already exists. A new row will be added to the existing project.');
                } else if (data.similar.length > 0) {
                    setDuplicateWarning(`Similar project names found. Did you mean: ${data.similar.slice(0, 2).join(', ')}?`);
                }
            } catch (error) {
                console.error('Error fetching suggestions:', error);
            }
        } else {
            setSuggestions({ exact: [], similar: [] });
            setShowSuggestions(false);
        }
    };

    const handleSuggestionClick = (name) => {
        setFormData(prev => ({ ...prev, projectName: name }));
        setShowSuggestions(false);
        setDuplicateWarning('This project name already exists. A new row will be added to the existing project.');
    };

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const toggleCategory = (categoryName) => {
        setFormData(prev => {
            const services = prev.services || [];
            if (services.includes(categoryName)) {
                return { ...prev, services: services.filter(s => s !== categoryName) };
            } else {
                return { ...prev, services: [...services, categoryName] };
            }
        });
    };

    const removeCategory = (categoryName) => {
        setFormData(prev => ({
            ...prev,
            services: (prev.services || []).filter(s => s !== categoryName)
        }));
    };

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

    const handleFilesChange = (files) => {
        setFormData(prev => ({ ...prev, attachments: files }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!formData.projectName.trim()) {
            alert('Project Name is required');
            return;
        }

        try {
            await onSave(formData);
            onClose();
        } catch (error) {
            console.error('Error saving project:', error);
            alert('Failed to save project. Please try again.');
        }
    };

    if (!isOpen) return null;

    return (
        <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
            <div className="modal-content">
                <div className="modal-header">
                    <h2>{editData ? 'Edit Entry' : 'Add New Entry'}</h2>
                    <button className="modal-close" onClick={onClose}>&times;</button>
                </div>

                <div className="modal-body">
                    <form onSubmit={handleSubmit}>
                        <div className="form-grid">
                            {/* Project Name with Autocomplete */}
                            <div className="form-group full-width">
                                <label>Project Name *</label>
                                <div className="autocomplete-wrapper">
                                    <input
                                        ref={projectNameRef}
                                        type="text"
                                        name="projectName"
                                        value={formData.projectName}
                                        onChange={handleProjectNameChange}
                                        onFocus={() => formData.projectName.length >= 2 && setShowSuggestions(true)}
                                        placeholder="Enter project name..."
                                        required
                                    />
                                    {showSuggestions && (suggestions.exact.length > 0 || suggestions.similar.length > 0) && (
                                        <div className="autocomplete-suggestions" ref={suggestionsRef}>
                                            {suggestions.exact.map((name, index) => (
                                                <div
                                                    key={`exact-${index}`}
                                                    className="suggestion-item exact"
                                                    onClick={() => handleSuggestionClick(name)}
                                                >
                                                    {name}
                                                    <span className="suggestion-label">(existing)</span>
                                                </div>
                                            ))}
                                            {suggestions.similar.map((name, index) => (
                                                <div
                                                    key={`similar-${index}`}
                                                    className="suggestion-item similar"
                                                    onClick={() => handleSuggestionClick(name)}
                                                >
                                                    {name}
                                                    <span className="suggestion-label">(similar)</span>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                                {duplicateWarning && (
                                    <div className="duplicate-warning">
                                        ⚠️ {duplicateWarning}
                                    </div>
                                )}
                            </div>

                            {/* Category (Multi-select) */}
                            <div className="form-group full-width" ref={categoryDropdownRef}>
                                <label>Services</label>
                                <div className="multi-select-wrapper">
                                    <div
                                        className="multi-select-trigger"
                                        onClick={() => setShowCategoryDropdown(!showCategoryDropdown)}
                                    >
                                        {formData.services && formData.services.length > 0 ? (
                                            <div className="selected-categories">
                                                {formData.services.map((cat, idx) => (
                                                    <span key={idx} className="category-tag">
                                                        {cat}
                                                        <button
                                                            type="button"
                                                            className="category-tag-remove"
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                removeCategory(cat);
                                                            }}
                                                        >
                                                            &times;
                                                        </button>
                                                    </span>
                                                ))}
                                            </div>
                                        ) : (
                                            <span className="placeholder">Select categories...</span>
                                        )}
                                        <span className="dropdown-arrow">▼</span>
                                    </div>
                                    {showCategoryDropdown && (
                                        <div className="multi-select-dropdown">
                                            {categories.map((cat) => (
                                                <label key={cat._id} className="category-option">
                                                    <input
                                                        type="checkbox"
                                                        checked={(formData.services || []).includes(cat.name)}
                                                        onChange={() => toggleCategory(cat.name)}
                                                    />
                                                    <span>{cat.name}</span>
                                                </label>
                                            ))}
                                            {categories.length === 0 && (
                                                <div className="no-categories">No categories available</div>
                                            )}
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Report Survey */}
                            <div className="form-group">
                                <label>Report Survey</label>
                                <select name="reportSurvey" value={formData.reportSurvey} onChange={handleInputChange}>
                                    <option value="">Select...</option>
                                    <option value="Done">Done</option>
                                    <option value="Progress">Progress</option>
                                </select>
                            </div>

                            {/* WO */}
                            <div className="form-group">
                                <label>WO</label>
                                <select name="wo" value={formData.wo} onChange={handleInputChange}>
                                    <option value="">Select...</option>
                                    <option value="Done">Done</option>
                                    <option value="Progress">Progress</option>
                                </select>
                            </div>

                            {/* Material */}
                            <div className="form-group">
                                <label>Material</label>
                                <select name="material" value={formData.material} onChange={handleInputChange}>
                                    <option value="">Select...</option>
                                    <option value="Request">Request</option>
                                    <option value="Done Installation">Done Installation</option>
                                    <option value="Hold">Hold</option>
                                    <option value="Progress">Progress</option>
                                    <option value="Logistic">Logistic</option>
                                </select>
                            </div>

                            {/* Status */}
                            <div className="form-group">
                                <label>Status</label>
                                <select name="status" value={formData.status} onChange={handleInputChange}>
                                    <option value="">Select...</option>
                                    <option value="Progress">Progress</option>
                                    <option value="Done">Done</option>
                                    <option value="Hold">Hold</option>
                                </select>
                            </div>

                            {/* Due Date */}
                            <div className="form-group">
                                <label>Due Date</label>
                                <input
                                    type="date"
                                    name="dueDate"
                                    value={formData.dueDate}
                                    onChange={handleInputChange}
                                />
                            </div>

                            {/* Date */}
                            <div className="form-group">
                                <label>Date</label>
                                <input
                                    type="date"
                                    name="date"
                                    value={formData.date}
                                    onChange={handleInputChange}
                                />
                            </div>

                            {/* PIC Team (Multi-select) */}
                            <div className="form-group full-width" ref={picDropdownRef}>
                                <label>PIC Team</label>
                                <div className="multi-select-wrapper">
                                    <div
                                        className="multi-select-trigger"
                                        onClick={() => setShowPicDropdown(!showPicDropdown)}
                                    >
                                        {formData.picTeam && formData.picTeam.length > 0 ? (
                                            <div className="selected-categories">
                                                {formData.picTeam.map((member, idx) => (
                                                    <span key={idx} className="category-tag">
                                                        {member}
                                                        <button
                                                            type="button"
                                                            className="category-tag-remove"
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                removePicMember(member);
                                                            }}
                                                        >
                                                            &times;
                                                        </button>
                                                    </span>
                                                ))}
                                            </div>
                                        ) : (
                                            <span className="placeholder">Select PIC members...</span>
                                        )}
                                        <span className="dropdown-arrow">▼</span>
                                    </div>
                                    {showPicDropdown && (
                                        <div className="multi-select-dropdown">
                                            {picMembers.map((member) => (
                                                <label key={member._id} className="category-option">
                                                    <input
                                                        type="checkbox"
                                                        checked={(formData.picTeam || []).includes(member.name)}
                                                        onChange={() => togglePicMember(member.name)}
                                                    />
                                                    <span>{member.name}</span>
                                                </label>
                                            ))}
                                            {picMembers.length === 0 && (
                                                <div className="no-categories">No PIC members available</div>
                                            )}
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Progress */}
                            <div className="form-group full-width">
                                <label>Progress</label>
                                <textarea
                                    name="progress"
                                    value={formData.progress}
                                    onChange={handleInputChange}
                                    placeholder="Enter progress notes..."
                                    rows={4}
                                />
                            </div>

                            {/* File Attachments */}
                            <div className="form-group full-width">
                                <FileUpload
                                    existingFiles={editData?.attachments || []}
                                    onFilesChange={handleFilesChange}
                                    canDelete={user?.role === 'admin' || user?.role === 'superuser'}
                                />
                            </div>
                        </div>

                        <div className="form-actions">
                            <button type="button" className="btn btn-secondary" onClick={onClose}>
                                Cancel
                            </button>
                            <button type="submit" className="btn btn-primary">
                                {editData ? 'Update Entry' : 'Add Entry'}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
}
