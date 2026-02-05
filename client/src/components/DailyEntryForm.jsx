import { useState, useEffect, useRef } from 'react';
import { dailiesApi } from '../api/dailies';
import { categoriesApi } from '../api/categories';
import { caseTypesApi } from '../api/caseTypes';
import { picMembersApi } from '../api/picMembers';
import FileUpload from './FileUpload';

export default function DailyEntryForm({ isOpen, onClose, onSave, editData, user }) {
    const [formData, setFormData] = useState({
        clientName: '',
        services: [],
        caseIssue: [],
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
    const caseTypeDropdownRef = useRef(null);
    const picDropdownRef = useRef(null);

    const [categories, setCategories] = useState([]);
    const [showCategoryDropdown, setShowCategoryDropdown] = useState(false);
    const [caseTypes, setCaseTypes] = useState([]);
    const [showCaseTypeDropdown, setShowCaseTypeDropdown] = useState(false);
    const [picMembers, setPicMembers] = useState([]);
    const [showPicDropdown, setShowPicDropdown] = useState(false);

    useEffect(() => {
        if (editData) {
            // Handle legacy string services data
            let services = editData.services || [];
            if (typeof services === 'string') {
                services = services ? [services] : [];
            }
            // Handle legacy string caseIssue data
            let caseIssue = editData.caseIssue || [];
            if (typeof caseIssue === 'string') {
                caseIssue = caseIssue ? [caseIssue] : [];
            }
            setFormData({
                ...editData,
                services: services,
                caseIssue: caseIssue,
                date: editData.date ? new Date(editData.date).toISOString().split('T')[0] : '',
                picTeam: editData.picTeam || [],
                attachments: editData.attachments || []
            });
        } else {
            setFormData({
                clientName: '',
                services: [],
                caseIssue: [],
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

    // Fetch case types on mount
    useEffect(() => {
        const fetchCaseTypes = async () => {
            try {
                const data = await caseTypesApi.getAll();
                setCaseTypes(data);
            } catch (error) {
                console.error('Error fetching case types:', error);
            }
        };
        if (isOpen) {
            fetchCaseTypes();
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

    // Handle clicks outside case type dropdown
    useEffect(() => {
        const handleClickOutsideCaseType = (event) => {
            if (caseTypeDropdownRef.current && !caseTypeDropdownRef.current.contains(event.target)) {
                setShowCaseTypeDropdown(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutsideCaseType);
        return () => document.removeEventListener('mousedown', handleClickOutsideCaseType);
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

    const toggleCaseType = (caseTypeName) => {
        setFormData(prev => {
            const caseIssue = prev.caseIssue || [];
            if (caseIssue.includes(caseTypeName)) {
                return { ...prev, caseIssue: caseIssue.filter(c => c !== caseTypeName) };
            } else {
                return { ...prev, caseIssue: [...caseIssue, caseTypeName] };
            }
        });
    };

    const removeCaseType = (caseTypeName) => {
        setFormData(prev => ({
            ...prev,
            caseIssue: (prev.caseIssue || []).filter(c => c !== caseTypeName)
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
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fade-in" onClick={(e) => e.target === e.currentTarget && onClose()}>
            <div className="bg-white w-full max-w-4xl rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh] animate-scale-in">
                <div className="px-6 py-4 border-b border-gray-100 bg-gray-50 flex items-center justify-between">
                    <h2 className="text-xl font-bold text-gray-800">{editData ? '✏️ Edit Daily Entry' : '📝 Add Daily Entry'}</h2>
                    <button className="w-8 h-8 flex items-center justify-center rounded-full bg-white text-gray-400 hover:text-gray-600 hover:bg-gray-100 border border-gray-200 transition-all shadow-sm" onClick={onClose}>&times;</button>
                </div>

                <div className="flex-1 overflow-y-auto p-6 md:p-8 custom-scrollbar">
                    <form onSubmit={handleSubmit} className="space-y-6">
                        {/* Client Name with Autocomplete */}
                        <div className="relative z-20">
                            <label className="block text-sm font-semibold text-gray-700 mb-1.5">Client Name <span className="text-red-500">*</span></label>
                            <input
                                ref={clientNameRef}
                                type="text"
                                name="clientName"
                                value={formData.clientName}
                                onChange={handleClientNameChange}
                                onFocus={() => formData.clientName.length >= 2 && setShowSuggestions(true)}
                                placeholder="Enter client name..."
                                required
                                className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all text-sm font-medium"
                                autoComplete="off"
                            />
                            {showSuggestions && suggestions.exact.length > 0 && (
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
                                        <span className="text-gray-400 text-sm">Select services...</span>
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
                                            <div className="col-span-2 text-center py-4 text-gray-400 text-sm">No services available</div>
                                        )}
                                    </div>
                                )}
                            </div>

                             {/* Case Issue (Multi-select) */}
                             <div className="relative" ref={caseTypeDropdownRef}>
                                <label className="block text-sm font-semibold text-gray-700 mb-1.5">Case & Issue</label>
                                <div
                                    className="min-h-[46px] w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-xl focus-within:ring-2 focus-within:ring-indigo-500/20 focus-within:border-indigo-500 transition-all cursor-pointer flex flex-wrap items-center gap-2"
                                    onClick={() => setShowCaseTypeDropdown(!showCaseTypeDropdown)}
                                >
                                    {formData.caseIssue && formData.caseIssue.length > 0 ? (
                                        formData.caseIssue.map((ct, idx) => (
                                            <span key={idx} className="inline-flex items-center px-2.5 py-1 rounded-lg bg-orange-50 text-orange-700 border border-orange-100 text-xs font-medium group">
                                                {ct}
                                                <button
                                                    type="button"
                                                    className="ml-1.5 text-orange-400 hover:text-orange-600 transition-colors"
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        removeCaseType(ct);
                                                    }}
                                                >
                                                    &times;
                                                </button>
                                            </span>
                                        ))
                                    ) : (
                                        <span className="text-gray-400 text-sm">Select case types...</span>
                                    )}
                                    <span className="absolute right-4 top-10 text-gray-400 text-xs">▼</span>
                                </div>
                                {showCaseTypeDropdown && (
                                    <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-xl shadow-lg max-h-60 overflow-auto z-30 p-2 grid grid-cols-1 gap-1">
                                        {caseTypes.map((ct) => (
                                            <label key={ct._id} className="flex items-center gap-2 px-3 py-2 hover:bg-gray-50 rounded-lg cursor-pointer transition-colors">
                                                <input
                                                    type="checkbox"
                                                    checked={(formData.caseIssue || []).includes(ct.name)}
                                                    onChange={() => toggleCaseType(ct.name)}
                                                    className="w-4 h-4 text-orange-600 rounded border-gray-300 focus:ring-orange-500"
                                                />
                                                <span className="text-sm text-gray-700">{ct.name}</span>
                                            </label>
                                        ))}
                                        {caseTypes.length === 0 && (
                                            <div className="col-span-1 text-center py-4 text-gray-400 text-sm">No cases available</div>
                                        )}
                                    </div>
                                )}
                            </div>

                            {/* Action */}
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-1.5">Action</label>
                                <select 
                                    name="action" 
                                    value={formData.action} 
                                    onChange={handleInputChange}
                                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all text-sm appearance-none"
                                >
                                    <option value="">Select...</option>
                                    <option value="Onsite">Onsite</option>
                                    <option value="Remote">Remote</option>
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

                         {/* Detail Action */}
                         <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-1.5">Detail Action</label>
                            <textarea
                                name="detailAction"
                                value={formData.detailAction}
                                onChange={handleInputChange}
                                placeholder="Enter detailed action/progress notes..."
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
