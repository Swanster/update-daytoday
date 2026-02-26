import { useState, useEffect, useRef } from 'react';
import { dailiesApi } from '../api/dailies';
import { categoriesApi } from '../api/categories';
import { caseTypesApi } from '../api/caseTypes';
import { picMembersApi } from '../api/picMembers';
import FileUpload from './FileUpload';
import { toast } from 'react-toastify';

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
            toast.warning('Client Name is required');
            return;
        }

        try {
            await onSave(formData);
            toast.success(editData ? 'Entry updated successfully!' : 'Entry created successfully!');
            onClose();
        } catch (error) {
            console.error('Error saving daily entry:', error);
            toast.error('Failed to save entry. Please try again.');
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-ch-dark/40 backdrop-blur-sm z-50 flex items-center justify-center p-4 sm:p-6 animate-fade-in" onClick={(e) => e.target === e.currentTarget && onClose()}>
            <div className="bg-white/95 backdrop-blur-xl rounded-3xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col animate-fade-in-up border border-white/20 relative">
                
                {/* Header */}
                <div className="bg-white/80 px-6 sm:px-8 py-6 border-b border-ch-soft flex justify-center items-center sticky top-0 z-10 backdrop-blur-md">
                    <div className="w-full max-w-2xl flex justify-between items-center">
                        <div>
                            <h2 className="text-2xl font-extrabold text-ch-dark flex items-center gap-3 tracking-tight">
                                <span className="bg-gradient-to-br from-ch-soft to-purple-100 text-ch-primary p-2.5 rounded-2xl shadow-inner border border-white">
                                    {editData ? '✏️' : '📝'}
                                </span>
                                {editData ? 'Edit Daily Entry' : 'New Daily Entry'}
                            </h2>
                            <p className="text-ch-primary text-sm mt-1.5 ml-1 font-medium">Log your daily activity details below.</p>
                        </div>
                        <button 
                            onClick={onClose} 
                            className="w-10 h-10 flex items-center justify-center rounded-2xl bg-ch-light text-ch-primary hover:text-ch-dark hover:bg-ch-soft transition-all border border-ch-soft/50 hover:shadow-sm"
                        >
                            ✕
                        </button>
                    </div>
                </div>

                {/* Form Content */}
                <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 sm:p-8 custom-scrollbar relative">
                    <div className="space-y-10 max-w-2xl mx-auto">
                        
                        {/* Section 1: Client & Service */}
                        <section>
                            <div className="flex items-center gap-3 mb-6">
                                <span className="text-xs font-extrabold text-ch-primary uppercase tracking-widest bg-ch-soft px-3 py-1 rounded-lg border border-ch-soft">CLIENT & CONTEXT</span>
                                <div className="h-px bg-ch-soft flex-1"></div>
                            </div>

                            <div className="space-y-6">
                                {/* Client Name with Autocomplete */}
                                <div className="relative z-20 group input-group">
                                    <label className="block text-xs font-bold text-ch-primary uppercase tracking-widest mb-2 ml-1">
                                        Client Name <span className="text-ch-primary">*</span>
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
                                        className="w-full px-5 py-3.5 bg-ch-light border border-ch-soft/60 rounded-xl focus:outline-none focus:ring-4 focus:ring-ch-primary/10 focus:border-ch-primary focus:bg-white transition-all font-bold text-ch-dark shadow-sm placeholder-ch-primary"
                                        autoComplete="off"
                                    />
                                    {showSuggestions && suggestions.exact.length > 0 && (
                                        <div className="absolute top-full left-0 right-0 mt-2 bg-white/95 backdrop-blur-xl border border-ch-soft rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.12)] max-h-60 overflow-auto z-30 animate-fade-in-up" ref={suggestionsRef}>
                                            {suggestions.exact.map((name, index) => (
                                                <div
                                                    key={`exact-${index}`}
                                                    className="px-5 py-3 hover:bg-ch-soft/80 cursor-pointer border-b border-ch-light last:border-0 transition-colors"
                                                    onClick={() => handleSuggestionClick(name)}
                                                >
                                                    <span className="font-extrabold text-ch-dark">{name}</span>
                                                    <span className="ml-3 text-[10px] bg-amber-50 text-amber-600 border border-amber-200 px-2 py-0.5 rounded-lg font-bold tracking-widest uppercase">Existing</span>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    {/* Category (Multi-select) */}
                                    <div className="relative input-group" ref={categoryDropdownRef}>
                                        <label className="block text-xs font-bold text-ch-primary uppercase tracking-widest mb-2 ml-1">Services</label>
                                        <div
                                            className="min-h-[56px] w-full px-4 py-2 bg-ch-light border border-ch-soft/60 rounded-xl focus-within:ring-4 focus-within:ring-ch-primary/10 focus-within:border-ch-primary focus-within:bg-white transition-all cursor-pointer flex flex-wrap items-center gap-2 shadow-sm"
                                            onClick={() => setShowCategoryDropdown(!showCategoryDropdown)}
                                        >
                                            {formData.services && formData.services.length > 0 ? (
                                                formData.services.map((cat, idx) => (
                                                    <span key={idx} className="inline-flex items-center px-2.5 py-1.5 rounded-lg bg-ch-soft text-ch-dark border border-ch-soft text-[11px] font-extrabold tracking-wide transition-all shadow-sm">
                                                        {cat}
                                                        <button
                                                            type="button"
                                                            className="ml-2 text-ch-primary hover:text-ch-dark transition-colors bg-white rounded-md w-4 h-4 flex items-center justify-center opacity-80 hover:opacity-100 border border-ch-soft"
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
                                                <span className="text-ch-primary font-medium text-sm ml-1">Select services...</span>
                                            )}
                                            <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-ch-primary transition-transform duration-200" style={{ transform: showCategoryDropdown ? 'translateY(-50%) rotate(180deg)' : 'translateY(-50%)' }}>▼</div>
                                        </div>
                                        {showCategoryDropdown && (
                                            <div className="absolute top-full left-0 right-0 mt-2 bg-white/95 backdrop-blur-xl border border-ch-soft rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.12)] max-h-60 overflow-auto z-30 p-3 grid grid-cols-2 gap-2 animate-scale-in">
                                                {categories.map((cat) => (
                                                    <label key={cat._id} className="flex items-center gap-3 px-3 py-2.5 hover:bg-ch-light rounded-xl cursor-pointer transition-colors border border-transparent hover:border-ch-soft">
                                                        <input
                                                            type="checkbox"
                                                            checked={(formData.services || []).includes(cat.name)}
                                                            onChange={() => toggleCategory(cat.name)}
                                                            className="w-4 h-4 text-ch-primary rounded border-ch-soft focus:ring-ch-primary/50"
                                                        />
                                                        <span className="text-sm font-bold text-ch-dark">{cat.name}</span>
                                                    </label>
                                                ))}
                                                {categories.length === 0 && (
                                                    <div className="col-span-2 text-center py-6 text-ch-primary text-sm font-medium">No services available</div>
                                                )}
                                            </div>
                                        )}
                                    </div>

                                    {/* Case Issue (Multi-select) */}
                                    <div className="relative input-group" ref={caseTypeDropdownRef}>
                                        <label className="block text-xs font-bold text-ch-primary uppercase tracking-widest mb-2 ml-1">Case & Issue</label>
                                        <div
                                            className="min-h-[56px] w-full px-4 py-2 bg-ch-light border border-ch-soft/60 rounded-xl focus-within:ring-4 focus-within:ring-ch-primary/10 focus-within:border-ch-primary focus-within:bg-white transition-all cursor-pointer flex flex-wrap items-center gap-2 shadow-sm"
                                            onClick={() => setShowCaseTypeDropdown(!showCaseTypeDropdown)}
                                        >
                                            {formData.caseIssue && formData.caseIssue.length > 0 ? (
                                                formData.caseIssue.map((ct, idx) => (
                                                    <span key={idx} className="inline-flex items-center px-2.5 py-1.5 rounded-lg bg-orange-50 text-orange-700 border border-orange-200 text-[11px] font-extrabold tracking-wide transition-all shadow-sm">
                                                        {ct}
                                                        <button
                                                            type="button"
                                                            className="ml-2 text-orange-400 hover:text-orange-800 transition-colors bg-white rounded-md w-4 h-4 flex items-center justify-center opacity-80 hover:opacity-100 border border-orange-100"
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
                                                <span className="text-ch-primary font-medium text-sm ml-1">Select case types...</span>
                                            )}
                                            <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-ch-primary transition-transform duration-200" style={{ transform: showCaseTypeDropdown ? 'translateY(-50%) rotate(180deg)' : 'translateY(-50%)' }}>▼</div>
                                        </div>
                                        {showCaseTypeDropdown && (
                                            <div className="absolute top-full left-0 right-0 mt-2 bg-white/95 backdrop-blur-xl border border-ch-soft rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.12)] max-h-60 overflow-auto z-30 p-3 grid grid-cols-1 gap-2 animate-scale-in">
                                                {caseTypes.map((ct) => (
                                                    <label key={ct._id} className="flex items-center gap-3 px-3 py-2.5 hover:bg-ch-light rounded-xl cursor-pointer transition-colors border border-transparent hover:border-ch-soft">
                                                        <input
                                                            type="checkbox"
                                                            checked={(formData.caseIssue || []).includes(ct.name)}
                                                            onChange={() => toggleCaseType(ct.name)}
                                                            className="w-4 h-4 text-orange-600 rounded border-ch-soft focus:ring-orange-500/50"
                                                        />
                                                        <span className="text-sm font-bold text-ch-dark">{ct.name}</span>
                                                    </label>
                                                ))}
                                                {caseTypes.length === 0 && (
                                                    <div className="col-span-1 text-center py-6 text-ch-primary text-sm font-medium">No cases available</div>
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
                                <span className="text-xs font-extrabold text-amber-600 uppercase tracking-widest bg-amber-50 px-3 py-1 rounded-lg border border-amber-100">ACTION & STATUS</span>
                                <div className="h-px bg-ch-soft flex-1"></div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                {/* Action */}
                                <div className="input-group">
                                    <label className="block text-xs font-bold text-ch-primary uppercase tracking-widest mb-2 ml-1">Action</label>
                                    <div className="relative">
                                        <select 
                                            name="action" 
                                            value={formData.action} 
                                            onChange={handleInputChange}
                                            className="w-full px-5 py-3.5 bg-ch-light border border-ch-soft/60 rounded-xl focus:outline-none focus:ring-4 focus:ring-ch-primary/10 focus:border-ch-primary focus:bg-white transition-all appearance-none cursor-pointer font-bold text-ch-dark shadow-sm"
                                        >
                                            <option value="">Select...</option>
                                            <option value="Onsite">Onsite</option>
                                            <option value="Remote">Remote</option>
                                        </select>
                                        <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-ch-primary">▼</div>
                                    </div>
                                </div>

                                {/* Status */}
                                <div className="input-group">
                                    <label className="block text-xs font-bold text-ch-primary uppercase tracking-widest mb-2 ml-1">Status</label>
                                    <div className="relative">
                                        <select 
                                            name="status" 
                                            value={formData.status} 
                                            onChange={handleInputChange}
                                            className="w-full px-5 py-3.5 bg-ch-light border border-ch-soft/60 rounded-xl focus:outline-none focus:ring-4 focus:ring-ch-primary/10 focus:border-ch-primary focus:bg-white transition-all appearance-none cursor-pointer font-bold text-ch-dark shadow-sm"
                                        >
                                            <option value="">Select...</option>
                                            <option value="Progress">Progress</option>
                                            <option value="Done">Done</option>
                                            <option value="Hold">Hold</option>
                                        </select>
                                        <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-ch-primary">▼</div>
                                    </div>
                                </div>

                                {/* Date */}
                                <div className="input-group">
                                    <label className="block text-xs font-bold text-ch-primary uppercase tracking-widest mb-2 ml-1">Date</label>
                                    <input
                                        type="date"
                                        name="date"
                                        value={formData.date}
                                        onChange={handleInputChange}
                                        className="w-full px-5 py-3.5 bg-ch-light border border-ch-soft/60 rounded-xl focus:outline-none focus:ring-4 focus:ring-ch-primary/10 focus:border-ch-primary focus:bg-white transition-all font-mono font-bold text-ch-dark shadow-sm uppercase tracking-wider"
                                    />
                                </div>
                            </div>
                        </section>

                        {/* Section 3: Team & Details */}
                        <section>
                            <div className="flex items-center gap-3 mb-6">
                                <span className="text-xs font-extrabold text-emerald-600 uppercase tracking-widest bg-emerald-50 px-3 py-1 rounded-lg border border-emerald-100">TEAM & DETAILS</span>
                                <div className="h-px bg-ch-soft flex-1"></div>
                            </div>

                            <div className="space-y-6">
                                {/* PIC Team (Multi-select) */}
                                <div className="relative input-group" ref={picDropdownRef}>
                                    <label className="block text-xs font-bold text-ch-primary uppercase tracking-widest mb-2 ml-1">PIC Team</label>
                                    <div
                                        className="min-h-[56px] w-full px-4 py-2 bg-ch-light border border-ch-soft/60 rounded-xl focus-within:ring-4 focus-within:ring-emerald-500/10 focus-within:border-emerald-400 focus-within:bg-white transition-all cursor-pointer flex flex-wrap items-center gap-2 shadow-sm"
                                        onClick={() => setShowPicDropdown(!showPicDropdown)}
                                    >
                                        {formData.picTeam && formData.picTeam.length > 0 ? (
                                            formData.picTeam.map((member, idx) => (
                                                <span key={idx} className="inline-flex items-center px-2.5 py-1.5 rounded-lg bg-emerald-50 text-emerald-700 border border-emerald-200 text-[11px] font-extrabold tracking-wide transition-all shadow-sm">
                                                    {member}
                                                    <button
                                                        type="button"
                                                        className="ml-2 text-emerald-400 hover:text-emerald-800 transition-colors bg-white rounded-md w-4 h-4 flex items-center justify-center opacity-80 hover:opacity-100 border border-emerald-100"
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
                                            <span className="text-ch-primary font-medium text-sm ml-1">Select PIC members...</span>
                                        )}
                                        <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-ch-primary transition-transform duration-200" style={{ transform: showPicDropdown ? 'translateY(-50%) rotate(180deg)' : 'translateY(-50%)' }}>▼</div>
                                    </div>
                                    {showPicDropdown && (
                                        <div className="absolute top-full left-0 right-0 mt-2 bg-white/95 backdrop-blur-xl border border-ch-soft rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.12)] max-h-60 overflow-auto z-30 p-3 grid grid-cols-2 md:grid-cols-3 gap-2 animate-scale-in">
                                            {picMembers.map((member) => (
                                                <label key={member._id} className="flex items-center gap-3 px-3 py-2.5 hover:bg-ch-light rounded-xl cursor-pointer transition-colors border border-transparent hover:border-ch-soft">
                                                    <input
                                                        type="checkbox"
                                                        checked={(formData.picTeam || []).includes(member.name)}
                                                        onChange={() => togglePicMember(member.name)}
                                                        className="w-4 h-4 text-emerald-600 rounded border-ch-soft focus:ring-emerald-500/50"
                                                    />
                                                    <span className="text-sm font-bold text-ch-dark">{member.name}</span>
                                                </label>
                                            ))}
                                            {picMembers.length === 0 && (
                                                <div className="col-span-3 text-center py-6 text-ch-primary text-sm font-medium">No PIC members available</div>
                                            )}
                                        </div>
                                    )}
                                </div>

                                {/* Detail Action */}
                                <div className="input-group">
                                    <label className="block text-xs font-bold text-ch-primary uppercase tracking-widest mb-2 ml-1">Detail Action</label>
                                    <textarea
                                        name="detailAction"
                                        value={formData.detailAction}
                                        onChange={handleInputChange}
                                        placeholder="Enter detailed action/progress notes..."
                                        rows={4}
                                        className="w-full px-5 py-4 bg-ch-light border border-ch-soft/60 rounded-xl focus:outline-none focus:ring-4 focus:ring-ch-primary/10 focus:border-ch-primary focus:bg-white transition-all font-medium text-ch-dark shadow-sm leading-relaxed resize-y"
                                    />
                                </div>

                                {/* File Attachments */}
                                <div>
                                    <label className="block text-xs font-bold text-ch-primary uppercase tracking-widest mb-2 ml-1">Attachments</label>
                                    <div className="bg-ch-light/50 border border-ch-soft/60 rounded-xl p-5 shadow-sm">
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
                    <div className="mt-8 pt-6 border-t border-ch-soft flex justify-center gap-3 sticky bottom-0 bg-white/95 backdrop-blur-xl p-4 sm:p-6 -mx-6 sm:-mx-8 -mb-6 sm:-mb-8 z-20">
                        <div className="w-full max-w-2xl flex justify-end gap-3">
                            <button
                                type="button"
                                onClick={onClose}
                                className="px-6 py-2.5 text-ch-primary font-bold bg-white border border-ch-soft hover:bg-ch-light hover:text-ch-dark rounded-xl transition-all shadow-sm focus:ring-4 focus:ring-ch-soft"
                            >
                                Cancel
                            </button>
                            <button
                                type="submit"
                                className="px-8 py-2.5 bg-ch-primary text-white font-bold rounded-xl shadow-sm hover:bg-ch-dark hover:shadow-md transition-all active:scale-95 focus:ring-4 focus:ring-ch-primary/20"
                            >
                                {editData ? 'Update Daily Entry' : 'Create Daily Entry'}
                            </button>
                        </div>
                    </div>
                </form>
            </div>
        </div>
    );
}
