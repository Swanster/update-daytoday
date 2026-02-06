import { useState, useEffect } from 'react';

const SERVICES = [
    'KEPONET', 'MEGALOS', 'VLEPO', 'TAAS', 'FIBERZONE APPS', 'MANAGE SERVICES WAAS', 'FTTR', 'INTERNET BANDWITH', 'OTHER'
];

export default function WOEntryForm({ isOpen, onClose, onSave, editData, user }) {
    const [formData, setFormData] = useState({
        clientStatus: 'New Client',
        clientName: '',
        sales: '',
        services: 'OTHER',
        detailRequest: '',
        dueDate: '',
        requestBarang: 'Progress',
        requestJasa: 'No Need',
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
                clientStatus: 'New Client',
                clientName: '',
                sales: '',
                services: 'OTHER',
                detailRequest: '',
                dueDate: '',
                requestBarang: 'Progress',
                requestJasa: 'No Need',
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
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fade-in" onClick={onClose}>
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl max-h-[90vh] overflow-hidden flex flex-col animate-scale-in border border-gray-100" onClick={e => e.stopPropagation()}>
                
                {/* Header */}
                <div className="bg-white px-8 py-6 border-b border-gray-100 flex justify-between items-center sticky top-0 z-10 shadow-sm">
                    <div>
                        <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-3">
                            <span className="bg-accent-coral/10 text-accent-coral p-2 rounded-xl">
                                {editData ? '✏️' : '🚀'}
                            </span>
                            {editData ? 'Edit Work Order' : 'New Work Order'}
                        </h2>
                        <p className="text-gray-500 text-sm mt-1 ml-1">Fill in the details below to create a new work order.</p>
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
                        
                        {/* Section 1: Client Information */}
                        <section>
                            <div className="flex items-center gap-3 mb-6">
                                <div className="h-px bg-gray-200 flex-1"></div>
                                <span className="text-xs font-bold text-gray-400 uppercase tracking-wider bg-white px-2">Client Information</span>
                                <div className="h-px bg-gray-200 flex-1"></div>
                            </div>
                            
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="md:col-span-1">
                                    <label className="block text-sm font-bold text-gray-700 mb-2">
                                        Status Client <span className="text-accent-coral">*</span>
                                    </label>
                                    <div className="relative">
                                        <select
                                            value={formData.clientStatus}
                                            onChange={e => setFormData({...formData, clientStatus: e.target.value})}
                                            className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-accent-coral/20 focus:border-accent-coral transition-all cursor-pointer appearance-none font-medium text-gray-700"
                                            required
                                        >
                                            <option value="New Client">✨ New Client</option>
                                            <option value="Existing">🏢 Existing Client</option>
                                        </select>
                                        <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400">▼</div>
                                    </div>
                                </div>
                                <div className="md:col-span-1">
                                    <label className="block text-sm font-bold text-gray-700 mb-2">
                                        Sales PIC
                                    </label>
                                    <input
                                        type="text"
                                        placeholder="Enter sales name"
                                        value={formData.sales}
                                        onChange={e => setFormData({...formData, sales: e.target.value})}
                                        className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-accent-coral/20 focus:border-accent-coral transition-all font-medium text-gray-700"
                                    />
                                </div>
                                <div className="md:col-span-2">
                                    <label className="block text-sm font-bold text-gray-700 mb-2">
                                        Client Name <span className="text-accent-coral">*</span>
                                    </label>
                                    <input
                                        type="text"
                                        placeholder="Enter client company or personal name"
                                        value={formData.clientName}
                                        onChange={e => setFormData({...formData, clientName: e.target.value})}
                                        className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-accent-coral/20 focus:border-accent-coral transition-all font-medium text-gray-700 text-lg"
                                        required
                                    />
                                </div>
                            </div>
                        </section>

                        {/* Section 2: Service & Schedule */}
                        <section>
                            <div className="flex items-center gap-3 mb-6">
                                <div className="h-px bg-gray-200 flex-1"></div>
                                <span className="text-xs font-bold text-gray-400 uppercase tracking-wider bg-white px-2">Service & Schedule</span>
                                <div className="h-px bg-gray-200 flex-1"></div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div>
                                    <label className="block text-sm font-bold text-gray-700 mb-2">Service Type</label>
                                    <div className="relative">
                                        <select
                                            value={formData.services}
                                            onChange={e => setFormData({...formData, services: e.target.value})}
                                            className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-accent-coral/20 focus:border-accent-coral transition-all cursor-pointer appearance-none font-medium text-gray-700"
                                        >
                                            {SERVICES.map(s => (
                                                <option key={s} value={s}>{s}</option>
                                            ))}
                                        </select>
                                        <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400">▼</div>
                                    </div>
                                    {formData.services === 'OTHER' && (
                                        <input
                                            type="text"
                                            placeholder="Specify other service..."
                                            value={otherService}
                                            onChange={e => setOtherService(e.target.value)}
                                            className="w-full mt-3 px-4 py-3 bg-yellow-50 border border-yellow-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-yellow-500/20 focus:border-yellow-500 transition-all font-medium text-gray-700 animate-slide-down"
                                        />
                                    )}
                                </div>
                                <div>
                                    <label className="block text-sm font-bold text-gray-700 mb-2">Request Date / Due Date</label>
                                    <input
                                        type="date"
                                        value={formData.dueDate}
                                        onChange={e => setFormData({...formData, dueDate: e.target.value})}
                                        className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-accent-coral/20 focus:border-accent-coral transition-all font-mono text-gray-700"
                                    />
                                </div>
                            </div>
                        </section>

                        {/* Section 3: Request Specifications */}
                        <section>
                            <div className="flex items-center gap-3 mb-6">
                                <div className="h-px bg-gray-200 flex-1"></div>
                                <span className="text-xs font-bold text-gray-400 uppercase tracking-wider bg-white px-2">Requirements</span>
                                <div className="h-px bg-gray-200 flex-1"></div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-6 bg-gray-50/50 rounded-2xl border border-gray-100">
                                <div>
                                    <label className="block text-sm font-bold text-gray-700 mb-2 flex items-center gap-2">
                                        📦 Request Barang
                                    </label>
                                    <div className="flex gap-2">
                                        {['Progress', 'Done'].map(status => (
                                            <button
                                                type="button"
                                                key={status}
                                                onClick={() => setFormData({...formData, requestBarang: status})}
                                                className={`flex-1 py-2 px-3 rounded-lg text-sm font-bold transition-all ${
                                                    formData.requestBarang === status 
                                                    ? (status === 'Done' ? 'bg-green-100 text-green-700 border-green-200 ring-2 ring-green-500/20' : 'bg-blue-100 text-blue-700 border-blue-200 ring-2 ring-blue-500/20')
                                                    : 'bg-white text-gray-500 border border-gray-200 hover:bg-gray-50'
                                                }`}
                                            >
                                                {status}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-sm font-bold text-gray-700 mb-2 flex items-center gap-2">
                                        🛠️ Request Jasa
                                    </label>
                                    <div className="flex gap-2">
                                        {['No Need', 'Progress', 'Done'].map(status => (
                                            <button
                                                type="button"
                                                key={status}
                                                onClick={() => setFormData({...formData, requestJasa: status})}
                                                className={`flex-1 py-2 px-3 rounded-lg text-sm font-bold transition-all ${
                                                    formData.requestJasa === status 
                                                    ? (status === 'Done' ? 'bg-green-100 text-green-700 border-green-200 ring-2 ring-green-500/20' : (status === 'No Need' ? 'bg-gray-200 text-gray-700 border-gray-300' : 'bg-blue-100 text-blue-700 border-blue-200 ring-2 ring-blue-500/20'))
                                                    : 'bg-white text-gray-500 border border-gray-200 hover:bg-gray-50'
                                                }`}
                                            >
                                                {status}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </section>
                        
                        {/* Section 4: Details */}
                        <section>
                            <div className="flex items-center gap-3 mb-6">
                                <div className="h-px bg-gray-200 flex-1"></div>
                                <span className="text-xs font-bold text-gray-400 uppercase tracking-wider bg-white px-2">Additional Details</span>
                                <div className="h-px bg-gray-200 flex-1"></div>
                            </div>

                            <div className="space-y-6">
                                <div>
                                    <label className="block text-sm font-bold text-gray-700 mb-2">Detail Request</label>
                                    <textarea
                                        value={formData.detailRequest}
                                        onChange={e => setFormData({...formData, detailRequest: e.target.value})}
                                        rows={3}
                                        placeholder="Enter detailed request description..."
                                        className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-accent-coral/20 focus:border-accent-coral transition-all text-gray-700 leading-relaxed"
                                    />
                                </div>
                                
                                <div>
                                    <label className="block text-sm font-bold text-gray-700 mb-2">Keterangan / Notes</label>
                                    <textarea
                                        value={formData.keterangan}
                                        onChange={e => setFormData({...formData, keterangan: e.target.value})}
                                        rows={2}
                                        placeholder="Any additional notes..."
                                        className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-accent-coral/20 focus:border-accent-coral transition-all text-gray-700 italic"
                                    />
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
                            className="px-8 py-3 bg-gradient-to-r from-accent-coral to-[#ff8f75] text-white font-bold rounded-xl shadow-lg hover:shadow-xl hover:-translate-y-0.5 transition-all transform active:scale-95"
                        >
                            {editData ? 'Update Work Order' : 'Create Work Order'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
