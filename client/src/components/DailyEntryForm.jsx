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
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fade-in" onClick={(e) => e.target === e.currentTarget && onClose()}>
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col animate-scale-in border border-gray-100">
                
                {/* Header */}
                <div className="bg-white px-8 py-6 border-b border-gray-100 flex justify-between items-center sticky top-0 z-10 shadow-sm">
                    <div>
                        <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-3">
                            <span className="bg-indigo-50 text-indigo-600 p-2 rounded-xl">
                                {editData ? '✏️' : '📝'}
                            </span>
                            {editData ? 'Edit Daily Entry' : 'New Daily Entry'}
                        </h2>
                        <p className="text-gray-500 text-sm mt-1 ml-1">Log your daily activity details below.</p>
                    </div>
                    <button 
                        onClick={onClose} 
                        className="w-10 h-10 flex items-center justify-center rounded-full bg-gray-50 text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-all"
                    >
                        ✕
                    </button>
                </div>

                {/* Form Content */}
                <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-8 custom-scrollbar">
                    <div className="space-y-10">
                        
                        {/* Section 1: Client & Service */}
                        <section>
                            <div className="flex items-center gap-3 mb-6">
                                <div className="h-px bg-gray-200 flex-1"></div>
                                <span className="text-xs font-bold text-gray-400 uppercase tracking-wider bg-white px-2">Client & Context</span>
                                <div className="h-px bg-gray-200 flex-1"></div>
                            </div>

                            <div className="space-y-6">
                                {/* Client Name with Autocomplete */}
                                <div className="relative z-20">
                                    <label className="block text-sm font-bold text-gray-700 mb-2">
                                        Client Name <span className="text-indigo-500">*</span>
                                    </label>
                                    <input
                                        ref={clientNameRef}
                                        type="text"
                                        name="clientName"
                                        value={formData.clientName}
                                        onChange={handleClientNameChange}
                                        onFocus={() => formData.clientName.length >= 2 && setShowSuggestions(true)}
                                        placeholder="Enter client name..."
                                        required
                                        className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all font-medium text-lg text-gray-700"
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
                                        <label className="block text-sm font-bold text-gray-700 mb-2">Services</label>
                                        <div
                                            className="min-h-[52px] w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-xl focus-within:ring-2 focus-within:ring-indigo-500/20 focus-within:border-indigo-500 transition-all cursor-pointer flex flex-wrap items-center gap-2"
                                            onClick={() => setShowCategoryDropdown(!showCategoryDropdown)}
                                        >
                                            {formData.services && formData.services.length > 0 ? (
                                                formData.services.map((cat, idx) => (
                                                    <span key={idx} className="inline-flex items-center px-3 py-1 rounded-lg bg-indigo-100 text-indigo-700 border border-indigo-200 text-sm font-semibold group transition-all hover:bg-indigo-200">
                                                        {cat}
                                                        <button
                                                            type="button"
                                                            className="ml-2 text-indigo-400 hover:text-indigo-800 transition-colors"
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
                                                <span className="text-gray-400 font-medium">Select services...</span>
                                            )}
                                            <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400">▼</div>
                                        </div>
                                        {showCategoryDropdown && (
                                            <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-xl shadow-lg max-h-60 overflow-auto z-30 p-2 grid grid-cols-2 gap-1 animate-scale-in">
                                                {categories.map((cat) => (
                                                    <label key={cat._id} className="flex items-center gap-3 px-3 py-2 hover:bg-gray-50 rounded-lg cursor-pointer transition-colors">
                                                        <input
                                                            type="checkbox"
                                                            checked={(formData.services || []).includes(cat.name)}
                                                            onChange={() => toggleCategory(cat.name)}
                                                            className="w-5 h-5 text-indigo-600 rounded border-gray-300 focus:ring-indigo-500"
                                                        />
                                                        <span className="text-sm font-medium text-gray-700">{cat.name}</span>
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
                                        <label className="block text-sm font-bold text-gray-700 mb-2">Case & Issue</label>
                                        <div
                                            className="min-h-[52px] w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-xl focus-within:ring-2 focus-within:ring-indigo-500/20 focus-within:border-indigo-500 transition-all cursor-pointer flex flex-wrap items-center gap-2"
                                            onClick={() => setShowCaseTypeDropdown(!showCaseTypeDropdown)}
                                        >
                                            {formData.caseIssue && formData.caseIssue.length > 0 ? (
                                                formData.caseIssue.map((ct, idx) => (
                                                    <span key={idx} className="inline-flex items-center px-3 py-1 rounded-lg bg-orange-100 text-orange-700 border border-orange-200 text-sm font-semibold group transition-all hover:bg-orange-200">
                                                        {ct}
                                                        <button
                                                            type="button"
                                                            className="ml-2 text-orange-400 hover:text-orange-800 transition-colors"
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
                                                <span className="text-gray-400 font-medium">Select case types...</span>
                                            )}
                                            <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400">▼</div>
                                        </div>
                                        {showCaseTypeDropdown && (
                                            <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-xl shadow-lg max-h-60 overflow-auto z-30 p-2 grid grid-cols-1 gap-1 animate-scale-in">
                                                {caseTypes.map((ct) => (
                                                    <label key={ct._id} className="flex items-center gap-3 px-3 py-2 hover:bg-gray-50 rounded-lg cursor-pointer transition-colors">
                                                        <input
                                                            type="checkbox"
                                                            checked={(formData.caseIssue || []).includes(ct.name)}
                                                            onChange={() => toggleCaseType(ct.name)}
                                                            className="w-5 h-5 text-orange-600 rounded border-gray-300 focus:ring-orange-500"
                                                        />
                                                        <span className="text-sm font-medium text-gray-700">{ct.name}</span>
                                                    </label>
                                                ))}
                                                {caseTypes.length === 0 && (
                                                    <div className="col-span-1 text-center py-4 text-gray-400 text-sm">No cases available</div>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </section>

                        {/* Section 2: Status & Schedule */}
                        <section>
                            <div className="flex items-center gap-3 mb-6">
                                <div className="h-px bg-gray-200 flex-1"></div>
                                <span className="text-xs font-bold text-gray-400 uppercase tracking-wider bg-white px-2">Action & Status</span>
                                <div className="h-px bg-gray-200 flex-1"></div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                {/* Action */}
                                <div>
                                    <label className="block text-sm font-bold text-gray-700 mb-2">Action</label>
                                    <div className="relative">
                                        <select 
                                            name="action" 
                                            value={formData.action} 
                                            onChange={handleInputChange}
                                            className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all appearance-none cursor-pointer font-medium text-gray-700"
                                        >
                                            <option value="">Select...</option>
                                            <option value="Onsite">Onsite</option>
                                            <option value="Remote">Remote</option>
                                        </select>
                                        <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400">▼</div>
                                    </div>
                                </div>

                                {/* Status */}
                                <div>
                                    <label className="block text-sm font-bold text-gray-700 mb-2">Status</label>
                                    <div className="relative">
                                        <select 
                                            name="status" 
                                            value={formData.status} 
                                            onChange={handleInputChange}
                                            className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all appearance-none cursor-pointer font-medium text-gray-700"
                                        >
                                            <option value="">Select...</option>
                                            <option value="Progress">Progress</option>
                                            <option value="Done">Done</option>
                                            <option value="Hold">Hold</option>
                                        </select>
                                        <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400">▼</div>
                                    </div>
                                </div>

                                {/* Date */}
                                <div>
                                    <label className="block text-sm font-bold text-gray-700 mb-2">Date</label>
                                    <input
                                        type="date"
                                        name="date"
                                        value={formData.date}
                                        onChange={handleInputChange}
                                        className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all font-mono text-gray-700"
                                    />
                                </div>
                            </div>
                        </section>

                        {/* Section 3: Team & Details */}
                        <section>
                            <div className="flex items-center gap-3 mb-6">
                                <div className="h-px bg-gray-200 flex-1"></div>
                                <span className="text-xs font-bold text-gray-400 uppercase tracking-wider bg-white px-2">Team & Details</span>
                                <div className="h-px bg-gray-200 flex-1"></div>
                            </div>

                            <div className="space-y-6">
                                {/* PIC Team (Multi-select) */}
                                <div className="relative" ref={picDropdownRef}>
                                    <label className="block text-sm font-bold text-gray-700 mb-2">PIC Team</label>
                                    <div
                                        className="min-h-[52px] w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-xl focus-within:ring-2 focus-within:ring-indigo-500/20 focus-within:border-indigo-500 transition-all cursor-pointer flex flex-wrap items-center gap-2"
                                        onClick={() => setShowPicDropdown(!showPicDropdown)}
                                    >
                                        {formData.picTeam && formData.picTeam.length > 0 ? (
                                            formData.picTeam.map((member, idx) => (
                                                <span key={idx} className="inline-flex items-center px-3 py-1 rounded-lg bg-emerald-100 text-emerald-700 border border-emerald-200 text-sm font-semibold group transition-all hover:bg-emerald-200">
                                                    {member}
                                                    <button
                                                        type="button"
                                                        className="ml-2 text-emerald-400 hover:text-emerald-800 transition-colors"
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
                                            <span className="text-gray-400 font-medium">Select PIC members...</span>
                                        )}
                                        <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400">▼</div>
                                    </div>
                                    {showPicDropdown && (
                                        <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-xl shadow-lg max-h-60 overflow-auto z-30 p-2 grid grid-cols-2 md:grid-cols-3 gap-1 animate-scale-in">
                                            {picMembers.map((member) => (
                                                <label key={member._id} className="flex items-center gap-2 px-3 py-2 hover:bg-gray-50 rounded-lg cursor-pointer transition-colors">
                                                    <input
                                                        type="checkbox"
                                                        checked={(formData.picTeam || []).includes(member.name)}
                                                        onChange={() => togglePicMember(member.name)}
                                                        className="w-5 h-5 text-emerald-600 rounded border-gray-300 focus:ring-emerald-500"
                                                    />
                                                    <span className="text-sm font-medium text-gray-700">{member.name}</span>
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
                                    <label className="block text-sm font-bold text-gray-700 mb-2">Detail Action</label>
                                    <textarea
                                        name="detailAction"
                                        value={formData.detailAction}
                                        onChange={handleInputChange}
                                        placeholder="Enter detailed action/progress notes..."
                                        rows={4}
                                        className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all text-gray-700 leading-relaxed"
                                    />
                                </div>

                                {/* File Attachments */}
                                <div>
                                    <label className="block text-sm font-bold text-gray-700 mb-2">Attachments</label>
                                    <div className="bg-gray-50 border border-gray-200 rounded-xl p-4">
                                        <FileUpload
                                            existingFiles={editData?.attachments || []}
                                            onFilesChange={handleFilesChange}
                                            canDelete={user?.role === 'admin' || user?.role === 'superuser'}
                                        />
                                    </div>
                                </div>
                            </div>
                        </section>

                    </div>
                    
                    {/* Footer Actions */}
                    <div className="mt-10 pt-6 border-t border-gray-100 flex justify-end gap-4">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-6 py-3 text-gray-600 font-bold hover:bg-gray-100 rounded-xl transition-colors"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            className="px-8 py-3 bg-gradient-to-r from-indigo-600 to-indigo-500 text-white font-bold rounded-xl shadow-lg hover:shadow-xl hover:-translate-y-0.5 transition-all transform active:scale-95"
                        >
                            {editData ? 'Update Entry' : 'Create Entry'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
