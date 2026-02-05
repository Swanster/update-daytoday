import { useState, useEffect } from 'react';

const SERVICES = [
    'KEPONET', 'MEGALOS', 'VLEPO', 'TAAS', 'FIBERZONE APPS', 'WAS', 'FTTR', 'INTERNET BANDWITH', 'OTHER'
];

export default function WOEntryForm({ isOpen, onClose, onSave, editData, user }) {
    const [formData, setFormData] = useState({
        clientName: '',
        sales: '',
        services: 'OTHER',
        detailRequest: '',
        dueDate: '',
        request: '',
        barang: '',
        jasa: '',
        keterangan: '',
        quarter: '',
        year: new Date().getFullYear(),
        quarterSequence: '',
        status: 'Progress'
    });
    
    // Derived state for other service input
    const [otherService, setOtherService] = useState('');

    useEffect(() => {
        if (editData) {
            setFormData({
                ...editData,
                dueDate: editData.dueDate ? editData.dueDate.split('T')[0] : ''
            });
            // If service is not in list, set to OTHER and fill otherService
            if (editData.services && !SERVICES.includes(editData.services)) {
                setFormData(prev => ({ ...prev, services: 'OTHER' }));
                setOtherService(editData.services);
            } else {
                 setOtherService('');
            }
        } else {
            // New entry - set defaults
            const now = new Date();
            const q = Math.floor(now.getMonth() / 3) + 1;
            const currentQuarter = `Q${q}-${now.getFullYear()}`;
            
            setFormData({
                clientName: '',
                sales: '',
                services: 'OTHER',
                detailRequest: '',
                dueDate: '',
                request: '',
                barang: '',
                jasa: '',
                keterangan: '',
                quarter: currentQuarter,
                year: now.getFullYear(),
                status: 'Progress'
            });
            setOtherService('');
        }
    }, [editData, isOpen]);

    if (!isOpen) return null;

    const handleSubmit = async (e) => {
        e.preventDefault();
        
        // Prepare data for submission
        const dataToSubmit = { ...formData };
        if (dataToSubmit.services === 'OTHER' && otherService) {
             dataToSubmit.services = otherService;
        }

        try {
            await onSave(dataToSubmit);
            onClose();
        } catch (err) {
            console.error('Failed to save WO:', err);
            // Error handling usually done in parent
        }
    };

    return (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fade-in" onClick={onClose}>
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto animate-scale-in" onClick={e => e.stopPropagation()}>
                <div className="bg-primary-dark px-6 py-4 flex justify-between items-center sticky top-0 z-10">
                    <h2 className="text-xl font-bold text-white flex items-center gap-2">
                        {editData ? '✏️ Edit Work Order' : '➕ New Work Order'}
                    </h2>
                    <button onClick={onClose} className="text-white/70 hover:text-white text-2xl transition-colors">×</button>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-1">Client Name *</label>
                            <input
                                type="text"
                                value={formData.clientName}
                                onChange={e => setFormData({...formData, clientName: e.target.value})}
                                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-accent-coral/20 focus:border-accent-coral outline-none transition-all"
                                required
                                autoFocus
                            />
                        </div>
                         <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-1">Sales</label>
                             <input
                                type="text"
                                value={formData.sales}
                                onChange={e => setFormData({...formData, sales: e.target.value})}
                                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-accent-coral/20 focus:border-accent-coral outline-none transition-all"
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-1">Service</label>
                            <select
                                value={formData.services}
                                onChange={e => setFormData({...formData, services: e.target.value})}
                                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-accent-coral/20 focus:border-accent-coral outline-none transition-all cursor-pointer"
                            >
                                {SERVICES.map(s => (
                                    <option key={s} value={s}>{s}</option>
                                ))}
                            </select>
                            {formData.services === 'OTHER' && (
                                <input
                                    type="text"
                                    placeholder="Specify other service"
                                    value={otherService}
                                    onChange={e => setOtherService(e.target.value)}
                                    className="w-full mt-2 px-4 py-2 border rounded-lg focus:ring-2 focus:ring-accent-coral/20 focus:border-accent-coral outline-none transition-all bg-gray-50"
                                />
                            )}
                        </div>
                        <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-1">Request Penjadwalan / Due Date</label>
                            <input
                                type="date"
                                value={formData.dueDate}
                                onChange={e => setFormData({...formData, dueDate: e.target.value})}
                                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-accent-coral/20 focus:border-accent-coral outline-none transition-all"
                            />
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-1">Detail Request</label>
                        <textarea
                            value={formData.detailRequest}
                            onChange={e => setFormData({...formData, detailRequest: e.target.value})}
                            rows={2}
                            className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-accent-coral/20 focus:border-accent-coral outline-none transition-all"
                        />
                    </div>
                    
                    <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-1">Request (General)</label>
                         <textarea
                            value={formData.request}
                            onChange={e => setFormData({...formData, request: e.target.value})}
                            rows={2}
                            className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-accent-coral/20 focus:border-accent-coral outline-none transition-all"
                        />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-1">Barang</label>
                            <input
                                type="text"
                                value={formData.barang}
                                onChange={e => setFormData({...formData, barang: e.target.value})}
                                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-accent-coral/20 focus:border-accent-coral outline-none transition-all"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-1">Jasa</label>
                            <input
                                type="text"
                                value={formData.jasa}
                                onChange={e => setFormData({...formData, jasa: e.target.value})}
                                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-accent-coral/20 focus:border-accent-coral outline-none transition-all"
                            />
                        </div>
                    </div>

                     <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-1">Keterangan</label>
                        <textarea
                            value={formData.keterangan}
                            onChange={e => setFormData({...formData, keterangan: e.target.value})}
                            rows={2}
                            className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-accent-coral/20 focus:border-accent-coral outline-none transition-all"
                        />
                    </div>

                    <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-4 py-2 text-gray-600 font-medium hover:bg-gray-100 rounded-lg transition-colors"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            className="px-6 py-2 bg-accent-coral text-white font-bold rounded-lg shadow-md hover:bg-[#ff6b47] transition-colors"
                        >
                            Save Work Order
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
