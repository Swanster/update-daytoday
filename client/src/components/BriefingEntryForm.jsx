import { useState, useEffect } from 'react';

export default function BriefingEntryForm({ isOpen, onClose, onSave, editData, user }) {
    const [formData, setFormData] = useState({
        tanggal: '',
        lokasi: '',
        pekerjaan: '',
        pic: '',
        status: 'Pending',
        checklist: '',
        catatan: ''
    });

    const [errors, setErrors] = useState({});

    useEffect(() => {
        if (editData) {
            setFormData({
                tanggal: editData.tanggal ? editData.tanggal.split('T')[0] : '',
                lokasi: editData.lokasi || '',
                pekerjaan: editData.pekerjaan || '',
                pic: editData.pic || '',
                status: editData.status || 'Pending',
                checklist: editData.checklist || '',
                catatan: editData.catatan || ''
            });
            setErrors({});
        } else {
            // New entry - set defaults
            const today = new Date().toISOString().split('T')[0];
            setFormData({
                tanggal: today,
                lokasi: '',
                pekerjaan: '',
                pic: user?.name || '',
                status: 'Pending',
                checklist: '',
                catatan: ''
            });
            setErrors({});
        }
    }, [editData, isOpen, user]);

    const validateForm = () => {
        const newErrors = {};

        if (!formData.tanggal) {
            newErrors.tanggal = 'Tanggal wajib diisi';
        }

        // Optional fields - no validation required
        // if (!formData.lokasi.trim()) {
        //     newErrors.lokasi = 'Lokasi wajib diisi';
        // }

        // if (!formData.pekerjaan.trim()) {
        //     newErrors.pekerjaan = 'Pekerjaan wajib diisi';
        // }

        // if (!formData.pic.trim()) {
        //     newErrors.pic = 'PIC wajib diisi';
        // }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!validateForm()) {
            return;
        }

        try {
            await onSave(formData);
            onClose();
        } catch (err) {
            console.error('Failed to save briefing:', err);
        }
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
        // Clear error on change
        if (errors[name]) {
            setErrors(prev => ({
                ...prev,
                [name]: ''
            }));
        }
    };

    if (!isOpen) return null;

    return (
        <div 
            className="fixed inset-0 bg-ch-dark/40 backdrop-blur-sm z-[100] flex items-center justify-center p-4 py-8 overflow-y-auto animate-fade-in" 
            onClick={(e) => { if(e.target === e.currentTarget) onClose(); }}
        >
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl my-auto relative transform transition-all animate-fade-in-up overflow-hidden flex flex-col border border-ch-soft">

                {/* Header */}
                <div className="bg-white px-8 py-6 border-b border-ch-soft flex justify-center items-center sticky top-0 z-10 shadow-sm">
                    <div className="w-full flex justify-between items-center">
                        <div>
                            <h2 className="text-2xl font-bold text-ch-dark flex items-center gap-3">
                                <span className="bg-ch-soft text-ch-primary p-2 rounded-xl">
                                    {editData ? '✏️' : '📝'}
                                </span>
                                {editData ? 'Edit Briefing' : 'New Briefing Entry'}
                            </h2>
                            <p className="text-ch-primary text-sm mt-1 ml-1">Fill in the details for the infrastructure briefing.</p>
                        </div>
                        <button
                            onClick={onClose}
                            className="text-ch-primary hover:text-ch-dark hover:bg-ch-soft p-2 rounded-xl transition-colors"
                            title="Close"
                        >
                            ✕
                        </button>
                    </div>
                </div>

                {/* Form Content */}
                <div className="p-8 overflow-y-auto max-h-[70vh]">
                    <form onSubmit={handleSubmit} className="space-y-6">
                        {/* Row 1: Tanggal & PIC */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                                <label className="block text-sm font-bold text-ch-dark mb-2">
                                    📅 Tanggal <span className="text-red-500">*</span>
                                </label>
                                <input
                                    type="date"
                                    name="tanggal"
                                    value={formData.tanggal}
                                    onChange={handleChange}
                                    className={`w-full px-4 py-3 border rounded-xl text-sm focus:outline-none focus:ring-4 transition-all ${
                                        errors.tanggal 
                                            ? 'border-red-300 bg-red-50 focus:ring-red-300/30' 
                                            : 'border-ch-soft bg-ch-light focus:bg-white focus:border-ch-primary focus:ring-ch-primary/30'
                                    }`}
                                />
                                {errors.tanggal && (
                                    <p className="text-red-500 text-xs mt-1 font-medium">{errors.tanggal}</p>
                                )}
                            </div>

                            <div>
                                <label className="block text-sm font-bold text-ch-dark mb-2">
                                    👤 PIC <span className="text-red-500">*</span>
                                </label>
                                <input
                                    type="text"
                                    name="pic"
                                    value={formData.pic}
                                    onChange={handleChange}
                                    placeholder="Person In Charge"
                                    className={`w-full px-4 py-3 border rounded-xl text-sm focus:outline-none focus:ring-4 transition-all ${
                                        errors.pic 
                                            ? 'border-red-300 bg-red-50 focus:ring-red-300/30' 
                                            : 'border-ch-soft bg-ch-light focus:bg-white focus:border-ch-primary focus:ring-ch-primary/30'
                                    }`}
                                />
                                {errors.pic && (
                                    <p className="text-red-500 text-xs mt-1 font-medium">{errors.pic}</p>
                                )}
                            </div>
                        </div>

                        {/* Row 2: Lokasi */}
                        <div>
                            <label className="block text-sm font-bold text-ch-dark mb-2">
                                📍 Lokasi / Site <span className="text-red-500">*</span>
                            </label>
                            <input
                                type="text"
                                name="lokasi"
                                value={formData.lokasi}
                                onChange={handleChange}
                                placeholder="Lokasi site atau property"
                                className={`w-full px-4 py-3 border rounded-xl text-sm focus:outline-none focus:ring-4 transition-all ${
                                    errors.lokasi 
                                        ? 'border-red-300 bg-red-50 focus:ring-red-300/30' 
                                        : 'border-ch-soft bg-ch-light focus:bg-white focus:border-ch-primary focus:ring-ch-primary/30'
                                }`}
                            />
                            {errors.lokasi && (
                                <p className="text-red-500 text-xs mt-1 font-medium">{errors.lokasi}</p>
                            )}
                        </div>

                        {/* Row 3: Pekerjaan */}
                        <div>
                            <label className="block text-sm font-bold text-ch-dark mb-2">
                                🔧 Pekerjaan <span className="text-red-500">*</span>
                            </label>
                            <textarea
                                name="pekerjaan"
                                value={formData.pekerjaan}
                                onChange={handleChange}
                                placeholder="Deskripsi pekerjaan yang dilakukan"
                                rows={3}
                                className={`w-full px-4 py-3 border rounded-xl text-sm focus:outline-none focus:ring-4 transition-all resize-none ${
                                    errors.pekerjaan 
                                        ? 'border-red-300 bg-red-50 focus:ring-red-300/30' 
                                        : 'border-ch-soft bg-ch-light focus:bg-white focus:border-ch-primary focus:ring-ch-primary/30'
                                }`}
                            />
                            {errors.pekerjaan && (
                                <p className="text-red-500 text-xs mt-1 font-medium">{errors.pekerjaan}</p>
                            )}
                        </div>

                        {/* Row 4: Status & Checklist */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                                <label className="block text-sm font-bold text-ch-dark mb-2">
                                    📊 Status
                                </label>
                                <select
                                    name="status"
                                    value={formData.status}
                                    onChange={handleChange}
                                    className="w-full px-4 py-3 border border-ch-soft bg-ch-light focus:bg-white focus:border-ch-primary rounded-xl text-sm focus:outline-none focus:ring-4 focus:ring-ch-primary/30 transition-all"
                                >
                                    <option value="Pending">Pending</option>
                                    <option value="Progress">Progress</option>
                                    <option value="Done">Done</option>
                                    <option value="Hold">Hold</option>
                                </select>
                            </div>

                            <div>
                                <label className="block text-sm font-bold text-ch-dark mb-2">
                                    ✓ Checklist
                                </label>
                                <input
                                    type="text"
                                    name="checklist"
                                    value={formData.checklist}
                                    onChange={handleChange}
                                    placeholder="Status checklist"
                                    className="w-full px-4 py-3 border border-ch-soft bg-ch-light focus:bg-white focus:border-ch-primary rounded-xl text-sm focus:outline-none focus:ring-4 focus:ring-ch-primary/30 transition-all"
                                />
                            </div>
                        </div>

                        {/* Row 5: Catatan */}
                        <div>
                            <label className="block text-sm font-bold text-ch-dark mb-2">
                                📝 Catatan
                            </label>
                            <textarea
                                name="catatan"
                                value={formData.catatan}
                                onChange={handleChange}
                                placeholder="Catatan tambahan, detail pekerjaan, atau informasi lainnya"
                                rows={4}
                                className="w-full px-4 py-3 border border-ch-soft bg-ch-light focus:bg-white focus:border-ch-primary rounded-xl text-sm focus:outline-none focus:ring-4 focus:ring-ch-primary/30 transition-all resize-none"
                            />
                        </div>
                    </form>
                </div>

                {/* Footer Actions */}
                <div className="bg-ch-light px-8 py-5 border-t border-ch-soft flex justify-end gap-3 sticky bottom-0 z-10 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.1)]">
                    <button
                        type="button"
                        onClick={onClose}
                        className="px-6 py-3 bg-white text-ch-primary border border-ch-soft rounded-xl font-bold text-sm hover:bg-ch-soft hover:border-ch-soft transition-all"
                    >
                        Batal
                    </button>
                    <button
                        type="button"
                        onClick={handleSubmit}
                        className="px-8 py-3 bg-ch-dark text-white rounded-xl font-bold text-sm hover:bg-ch-dark/90 transition-all shadow-md hover:shadow-lg"
                    >
                        {editData ? '💾 Simpan Perubahan' : '✨ Simpan Briefing'}
                    </button>
                </div>
            </div>
        </div>
    );
}
