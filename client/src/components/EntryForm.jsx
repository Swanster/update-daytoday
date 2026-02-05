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
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fade-in" onClick={(e) => e.target === e.currentTarget && onClose()}>
            <div className="bg-white w-full max-w-4xl rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh] animate-scale-in">
                <div className="px-6 py-4 border-b border-gray-100 bg-gray-50 flex items-center justify-between">
                    <h2 className="text-xl font-bold text-gray-800">{editData ? '✏️ Edit Entry' : '📝 Add New Entry'}</h2>
                    <button className="w-8 h-8 flex items-center justify-center rounded-full bg-white text-gray-400 hover:text-gray-600 hover:bg-gray-100 border border-gray-200 transition-all shadow-sm" onClick={onClose}>&times;</button>
                </div>

                <div className="flex-1 overflow-y-auto p-6 md:p-8 custom-scrollbar">
                    <form onSubmit={handleSubmit} className="space-y-6">
                        {/* Project Name with Autocomplete */}
                        <div className="relative z-20">
                            <label className="block text-sm font-semibold text-gray-700 mb-1.5">Project Name <span className="text-red-500">*</span></label>
                            <input
                                ref={projectNameRef}
                                type="text"
                                name="projectName"
                                value={formData.projectName}
                                onChange={handleProjectNameChange}
                                onFocus={() => formData.projectName.length >= 2 && setShowSuggestions(true)}
                                placeholder="Enter project name..."
                                required
                                className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all text-sm font-medium"
                                autoComplete="off"
                            />
                            {showSuggestions && (suggestions.exact.length > 0 || suggestions.similar.length > 0) && (
                                <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-xl shadow-lg max-h-60 overflow-auto z-30" ref={suggestionsRef}>
                                    {suggestions.exact.map((name, index) => (
                                        <div
                                            key={`exact-${index}`}
                                            className="px-4 py-3 hover:bg-indigo-50 cursor-pointer border-b border-gray-100 last:border-0"
                                            onClick={() => handleSuggestionClick(name)}
                                        >
                                            <span className="font-semibold text-gray-800">{name}</span>
                                            <span className="ml-2 text-xs bg-orange-100 text-orange-600 px-2 py-0.5 rounded-full font-bold">Existing</span>
                                        </div>
                                    ))}
                                    {suggestions.similar.map((name, index) => (
                                        <div
                                            key={`similar-${index}`}
                                            className="px-4 py-3 hover:bg-indigo-50 cursor-pointer border-b border-gray-100 last:border-0"
                                            onClick={() => handleSuggestionClick(name)}
                                        >
                                            <span className="text-gray-700">{name}</span>
                                            <span className="ml-2 text-xs bg-blue-100 text-blue-600 px-2 py-0.5 rounded-full font-bold">Similar</span>
                                        </div>
                                    ))}
                                </div>
                            )}
                            {duplicateWarning && (
                                <div className="mt-2 text-xs text-orange-600 flex items-center gap-1 font-medium bg-orange-50 p-2 rounded-lg border border-orange-100">
                                    ⚠️ {duplicateWarning}
                                </div>
                            )}
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {/* Category (Multi-select) */}
                             <div className="relative" ref={categoryDropdownRef}>
                                <label className="block text-sm font-semibold text-gray-700 mb-1.5">Services</label>
                                <div
                                    className="min-h-[46px] w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-xl focus-within:ring-2 focus-within:ring-indigo-500/20 focus-within:border-indigo-500 transition-all cursor-pointer flex flex-wrap items-center gap-2"
                                    onClick={() => setShowCategoryDropdown(!showCategoryDropdown)}
                                >
                                    {formData.services && formData.services.length > 0 ? (
                                        formData.services.map((cat, idx) => (
                                            <span key={idx} className="inline-flex items-center px-2.5 py-1 rounded-lg bg-indigo-50 text-indigo-700 border border-indigo-100 text-xs font-medium group">
                                                {cat}
                                                <button
                                                    type="button"
                                                    className="ml-1.5 text-indigo-400 hover:text-indigo-600 transition-colors"
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        removeCategory(cat);
                                                    }}
                                                >
                                                    &times;
                                                </button>
                                            </span>
                                        ))
                                    ) : (
                                        <span className="text-gray-400 text-sm">Select categories...</span>
                                    )}
                                    <span className="absolute right-4 top-10 text-gray-400 text-xs">▼</span>
                                </div>
                                {showCategoryDropdown && (
                                    <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-xl shadow-lg max-h-60 overflow-auto z-30 p-2 grid grid-cols-2 gap-1">
                                        {categories.map((cat) => (
                                            <label key={cat._id} className="flex items-center gap-2 px-3 py-2 hover:bg-gray-50 rounded-lg cursor-pointer transition-colors">
                                                <input
                                                    type="checkbox"
                                                    checked={(formData.services || []).includes(cat.name)}
                                                    onChange={() => toggleCategory(cat.name)}
                                                    className="w-4 h-4 text-indigo-600 rounded border-gray-300 focus:ring-indigo-500"
                                                />
                                                <span className="text-sm text-gray-700">{cat.name}</span>
                                            </label>
                                        ))}
                                        {categories.length === 0 && (
                                            <div className="col-span-2 text-center py-4 text-gray-400 text-sm">No categories available</div>
                                        )}
                                    </div>
                                )}
                            </div>

                            {/* Report Survey */}
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-1.5">Report Survey</label>
                                <select 
                                    name="reportSurvey" 
                                    value={formData.reportSurvey} 
                                    onChange={handleInputChange}
                                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all text-sm appearance-none"
                                >
                                    <option value="">Select...</option>
                                    <option value="Done">Done</option>
                                    <option value="Progress">Progress</option>
                                </select>
                            </div>

                            {/* WO */}
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-1.5">WO</label>
                                <select 
                                    name="wo" 
                                    value={formData.wo} 
                                    onChange={handleInputChange}
                                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all text-sm appearance-none"
                                >
                                    <option value="">Select...</option>
                                    <option value="Done">Done</option>
                                    <option value="Progress">Progress</option>
                                </select>
                            </div>

                            {/* Material */}
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-1.5">Material</label>
                                <select 
                                    name="material" 
                                    value={formData.material} 
                                    onChange={handleInputChange}
                                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all text-sm appearance-none"
                                >
                                    <option value="">Select...</option>
                                    <option value="Request">Request</option>
                                    <option value="Done Installation">Done Installation</option>
                                    <option value="Hold">Hold</option>
                                    <option value="Progress">Progress</option>
                                    <option value="Logistic">Logistic</option>
                                </select>
                            </div>

                            {/* Status */}
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-1.5">Status</label>
                                <select 
                                    name="status" 
                                    value={formData.status} 
                                    onChange={handleInputChange}
                                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all text-sm appearance-none"
                                >
                                    <option value="">Select...</option>
                                    <option value="Progress">Progress</option>
                                    <option value="Done">Done</option>
                                    <option value="Hold">Hold</option>
                                </select>
                            </div>

                            {/* Due Date */}
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-1.5">Due Date</label>
                                <input
                                    type="date"
                                    name="dueDate"
                                    value={formData.dueDate}
                                    onChange={handleInputChange}
                                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all text-sm font-mono"
                                />
                            </div>

                            {/* Date */}
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-1.5">Date</label>
                                <input
                                    type="date"
                                    name="date"
                                    value={formData.date}
                                    onChange={handleInputChange}
                                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all text-sm font-mono"
                                />
                            </div>
                        </div>

                        {/* PIC Team (Multi-select) */}
                        <div className="relative" ref={picDropdownRef}>
                            <label className="block text-sm font-semibold text-gray-700 mb-1.5">PIC Team</label>
                            <div
                                className="min-h-[46px] w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-xl focus-within:ring-2 focus-within:ring-indigo-500/20 focus-within:border-indigo-500 transition-all cursor-pointer flex flex-wrap items-center gap-2"
                                onClick={() => setShowPicDropdown(!showPicDropdown)}
                            >
                                {formData.picTeam && formData.picTeam.length > 0 ? (
                                    formData.picTeam.map((member, idx) => (
                                        <span key={idx} className="inline-flex items-center px-2.5 py-1 rounded-lg bg-emerald-50 text-emerald-700 border border-emerald-100 text-xs font-medium group">
                                            {member}
                                            <button
                                                type="button"
                                                className="ml-1.5 text-emerald-400 hover:text-emerald-600 transition-colors"
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
                                    <span className="text-gray-400 text-sm">Select PIC members...</span>
                                )}
                                <span className="absolute right-4 top-10 text-gray-400 text-xs">▼</span>
                            </div>
                            {showPicDropdown && (
                                <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-xl shadow-lg max-h-60 overflow-auto z-30 p-2 grid grid-cols-2 md:grid-cols-3 gap-1">
                                    {picMembers.map((member) => (
                                        <label key={member._id} className="flex items-center gap-2 px-3 py-2 hover:bg-gray-50 rounded-lg cursor-pointer transition-colors">
                                            <input
                                                type="checkbox"
                                                checked={(formData.picTeam || []).includes(member.name)}
                                                onChange={() => togglePicMember(member.name)}
                                                className="w-4 h-4 text-emerald-600 rounded border-gray-300 focus:ring-emerald-500"
                                            />
                                            <span className="text-sm text-gray-700">{member.name}</span>
                                        </label>
                                    ))}
                                    {picMembers.length === 0 && (
                                        <div className="col-span-3 text-center py-4 text-gray-400 text-sm">No PIC members available</div>
                                    )}
                                </div>
                            )}
                        </div>

                        {/* Progress */}
                        <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-1.5">Progress Notes</label>
                            <textarea
                                name="progress"
                                value={formData.progress}
                                onChange={handleInputChange}
                                placeholder="Enter progress notes..."
                                rows={4}
                                className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all text-sm leading-relaxed"
                            />
                        </div>

                        {/* File Attachments */}
                        <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-1.5">Attachments</label>
                            <FileUpload
                                existingFiles={editData?.attachments || []}
                                onFilesChange={handleFilesChange}
                                canDelete={user?.role === 'admin' || user?.role === 'superuser'}
                            />
                        </div>
                    </form>
                </div>

                <div className="px-6 py-4 bg-gray-50 border-t border-gray-100 flex justify-end gap-3 z-20">
                    <button 
                        type="button" 
                        className="px-6 py-2.5 text-gray-600 font-bold text-sm hover:bg-gray-200/50 rounded-xl transition-colors"
                        onClick={onClose}
                    >
                        Cancel
                    </button>
                    <button 
                        type="button"
                        className="px-8 py-2.5 bg-indigo-600 text-white font-bold text-sm rounded-xl hover:bg-indigo-700 focus:ring-4 focus:ring-indigo-500/30 transition-all shadow-md transform active:scale-95"
                        onClick={handleSubmit}
                    >
                        {editData ? 'Update Entry' : 'Add Entry'}
                    </button>
                </div>
            </div>
        </div>
    );
}
