import { useState, useEffect, useRef } from 'react';
import { projectsApi } from '../api/projects';

export default function EntryForm({ isOpen, onClose, onSave, editData }) {
    const [formData, setFormData] = useState({
        projectName: '',
        services: '',
        reportSurvey: '',
        wo: '',
        material: '',
        dueDate: '',
        date: '',
        picTeam: [],
        progress: '',
        status: ''
    });

    const [suggestions, setSuggestions] = useState({ exact: [], similar: [] });
    const [showSuggestions, setShowSuggestions] = useState(false);
    const [tagInput, setTagInput] = useState('');
    const [duplicateWarning, setDuplicateWarning] = useState('');
    const suggestionsRef = useRef(null);
    const projectNameRef = useRef(null);

    useEffect(() => {
        if (editData) {
            setFormData({
                ...editData,
                dueDate: editData.dueDate ? new Date(editData.dueDate).toISOString().split('T')[0] : '',
                date: editData.date ? new Date(editData.date).toISOString().split('T')[0] : '',
                picTeam: editData.picTeam || []
            });
        } else {
            setFormData({
                projectName: '',
                services: '',
                reportSurvey: '',
                wo: '',
                material: '',
                dueDate: '',
                date: '',
                picTeam: [],
                progress: '',
                status: ''
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

                            {/* Services */}
                            <div className="form-group full-width">
                                <label>Services</label>
                                <input
                                    type="text"
                                    name="services"
                                    value={formData.services}
                                    onChange={handleInputChange}
                                    placeholder="Enter services..."
                                />
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

                            {/* PIC Team */}
                            <div className="form-group full-width">
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
