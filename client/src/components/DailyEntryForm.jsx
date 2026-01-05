import { useState, useEffect, useRef } from 'react';
import { dailiesApi } from '../api/dailies';
import { categoriesApi } from '../api/categories';
import FileUpload from './FileUpload';

export default function DailyEntryForm({ isOpen, onClose, onSave, editData, user }) {
    const [formData, setFormData] = useState({
        clientName: '',
        services: [],
        caseIssue: '',
        action: '',
        date: '',
        picTeam: [],
        detailAction: '',
        status: '',
        attachments: []
    });

    const [suggestions, setSuggestions] = useState({ exact: [], similar: [] });
    const [showSuggestions, setShowSuggestions] = useState(false);
    const [tagInput, setTagInput] = useState('');
    const suggestionsRef = useRef(null);
    const clientNameRef = useRef(null);
    const categoryDropdownRef = useRef(null);

    const [categories, setCategories] = useState([]);
    const [showCategoryDropdown, setShowCategoryDropdown] = useState(false);

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
                date: editData.date ? new Date(editData.date).toISOString().split('T')[0] : '',
                picTeam: editData.picTeam || [],
                attachments: editData.attachments || []
            });
        } else {
            setFormData({
                clientName: '',
                services: [],
                caseIssue: '',
                action: '',
                date: '',
                picTeam: [],
                detailAction: '',
                status: '',
                attachments: []
            });
        }
        setTagInput('');
    }, [editData, isOpen]);

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (suggestionsRef.current && !suggestionsRef.current.contains(event.target) &&
                clientNameRef.current && !clientNameRef.current.contains(event.target)) {
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

    const handleClientNameChange = async (e) => {
        const value = e.target.value;
        setFormData(prev => ({ ...prev, clientName: value }));

        if (value.length >= 2) {
            try {
                const data = await dailiesApi.getSuggestions(value);
                setSuggestions(data);
                setShowSuggestions(true);
            } catch (error) {
                console.error('Error fetching suggestions:', error);
            }
        } else {
            setSuggestions({ exact: [], similar: [] });
            setShowSuggestions(false);
        }
    };

    const handleSuggestionClick = (name) => {
        setFormData(prev => ({ ...prev, clientName: name }));
        setShowSuggestions(false);
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

    const handleTagKeyDown = (e) => {
        if (e.key === 'Enter' || e.key === ',') {
            e.preventDefault();
            addTag();
        }
    };

    const addTag = () => {
        const tag = tagInput.trim();
        if (tag && !formData.picTeam.includes(tag)) {
            setFormData(prev => ({
                ...prev,
                picTeam: [...prev.picTeam, tag]
            }));
        }
        setTagInput('');
    };

    const removeTag = (tagToRemove) => {
        setFormData(prev => ({
            ...prev,
            picTeam: prev.picTeam.filter(tag => tag !== tagToRemove)
        }));
    };

    const handleFilesChange = (files) => {
        setFormData(prev => ({ ...prev, attachments: files }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!formData.clientName.trim()) {
            alert('Client Name is required');
            return;
        }

        try {
            await onSave(formData);
            onClose();
        } catch (error) {
            console.error('Error saving daily entry:', error);
            alert('Failed to save entry. Please try again.');
        }
    };

    if (!isOpen) return null;

    return (
        <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
            <div className="modal-content">
                <div className="modal-header daily-header">
                    <h2>{editData ? 'Edit Daily Entry' : 'Add Daily Entry'}</h2>
                    <button className="modal-close" onClick={onClose}>&times;</button>
                </div>

                <div className="modal-body">
                    <form onSubmit={handleSubmit}>
                        <div className="form-grid">
                            {/* Client Name with Autocomplete */}
                            <div className="form-group full-width">
                                <label>Client Name *</label>
                                <div className="autocomplete-wrapper">
                                    <input
                                        ref={clientNameRef}
                                        type="text"
                                        name="clientName"
                                        value={formData.clientName}
                                        onChange={handleClientNameChange}
                                        onFocus={() => formData.clientName.length >= 2 && setShowSuggestions(true)}
                                        placeholder="Enter client name..."
                                        required
                                    />
                                    {showSuggestions && suggestions.exact.length > 0 && (
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
                                        </div>
                                    )}
                                </div>
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

                            {/* Case & Issue */}
                            <div className="form-group full-width">
                                <label>Case & Issue</label>
                                <textarea
                                    name="caseIssue"
                                    value={formData.caseIssue}
                                    onChange={handleInputChange}
                                    placeholder="Describe the case and issue..."
                                    rows={3}
                                />
                            </div>

                            {/* Action */}
                            <div className="form-group">
                                <label>Action</label>
                                <select name="action" value={formData.action} onChange={handleInputChange}>
                                    <option value="">Select...</option>
                                    <option value="Onsite">Onsite</option>
                                    <option value="Remote">Remote</option>
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

                            {/* PIC Team */}
                            <div className="form-group">
                                <label>PIC Team (Press Enter to add)</label>
                                <div className="tag-input-wrapper">
                                    {formData.picTeam.map((tag, index) => (
                                        <div key={index} className="tag-item">
                                            {tag}
                                            <button type="button" className="tag-remove" onClick={() => removeTag(tag)}>
                                                &times;
                                            </button>
                                        </div>
                                    ))}
                                    <input
                                        type="text"
                                        className="tag-input"
                                        value={tagInput}
                                        onChange={(e) => setTagInput(e.target.value)}
                                        onKeyDown={handleTagKeyDown}
                                        onBlur={addTag}
                                        placeholder={formData.picTeam.length === 0 ? "Add team member..." : ""}
                                    />
                                </div>
                            </div>

                            {/* Detail Action */}
                            <div className="form-group full-width">
                                <label>Detail Action</label>
                                <textarea
                                    name="detailAction"
                                    value={formData.detailAction}
                                    onChange={handleInputChange}
                                    placeholder="Enter detailed action/progress notes..."
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
