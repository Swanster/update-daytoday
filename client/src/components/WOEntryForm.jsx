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
        <div className="fixed inset-0 bg-ch-dark/40 backdrop-blur-sm z-[100] flex items-center justify-center p-4 py-8 overflow-y-auto animate-fade-in" onClick={(e) => { if(e.target === e.currentTarget) onClose(); }}>
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl my-auto relative transform transition-all animate-fade-in-up overflow-hidden flex flex-col animate-scale-in border border-ch-soft">
                
                {/* Header */}
                <div className="bg-white px-8 py-6 border-b border-ch-soft flex justify-center items-center sticky top-0 z-10 shadow-sm">
                    <div className="w-full max-w-2xl flex justify-between items-center">
                        <div>
                            <h2 className="text-2xl font-bold text-ch-dark flex items-center gap-3">
                                <span className="bg-ch-soft text-ch-primary p-2 rounded-xl">
                                    {editData ? '✏️' : '📝'}
                                </span>
                                {editData ? 'Edit Work Order' : 'New Work Order'}
                            </h2>
                            <p className="text-ch-primary text-sm mt-1 ml-1">Fill in the details below to create a new work order.</p>
                        </div>
                        <button 
                            onClick={onClose} 
                            className="w-10 h-10 flex items-center justify-center rounded-full bg-ch-light text-ch-primary hover:text-ch-dark hover:bg-ch-soft transition-all"
                        >
                            ✕
                        </button>
                    </div>
                </div>

                {/* Form Content */}
                <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-8 custom-scrollbar">
                    <div className="space-y-10 max-w-2xl mx-auto">
                        
                        {/* Section 1: Client Information */}
                        <section>
                            <div className="flex items-center gap-3 mb-6">
                                <div className="h-px bg-ch-soft flex-1"></div>
                                <span className="text-xs font-bold text-ch-primary uppercase tracking-wider bg-white px-2">Client Information</span>
                                <div className="h-px bg-ch-soft flex-1"></div>
                            </div>
                            
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="relative">
                                    <label className="block text-sm font-bold text-ch-dark mb-2">
                                        Status Client <span className="text-ch-primary">*</span>
                                    </label>
                                    <div className="relative">
                                        <select
                                            value={formData.clientStatus}
                                            onChange={e => setFormData({...formData, clientStatus: e.target.value})}
                                            className="w-full px-4 py-3 bg-ch-light border border-ch-soft rounded-xl focus:outline-none focus:ring-2 focus:ring-ch-primary/20 focus:border-ch-primary transition-all appearance-none cursor-pointer font-medium text-ch-dark"
                                            required
                                        >
                                            <option value="New Client">✨ New Client</option>
                                            <option value="Existing">🏢 Existing Client</option>
                                        </select>
                                        <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-ch-primary">▼</div>
                                    </div>
                                </div>
                                <div className="relative">
                                    <label className="block text-sm font-bold text-ch-dark mb-2">
                                        Sales PIC
                                    </label>
                                    <input
                                        type="text"
                                        placeholder="Enter sales name"
                                        value={formData.sales}
                                        onChange={e => setFormData({...formData, sales: e.target.value})}
                                        className="w-full px-4 py-3 bg-ch-light border border-ch-soft rounded-xl focus:outline-none focus:ring-2 focus:ring-ch-primary/20 focus:border-ch-primary transition-all font-medium text-ch-dark"
                                    />
                                </div>
                                <div className="md:col-span-2 relative">
                                    <label className="block text-sm font-bold text-ch-dark mb-2">
                                        Client Name <span className="text-ch-primary">*</span>
                                    </label>
                                    <input
                                        type="text"
                                        placeholder="Enter client company or personal name"
                                        value={formData.clientName}
                                        onChange={e => setFormData({...formData, clientName: e.target.value})}
                                        className="w-full px-4 py-3 bg-ch-light border border-ch-soft rounded-xl focus:outline-none focus:ring-2 focus:ring-ch-primary/20 focus:border-ch-primary transition-all font-medium text-lg text-ch-dark"
                                        required
                                    />
                                </div>
                            </div>
                        </section>

                        <section>
                            <div className="flex items-center gap-3 mb-6">
                                <div className="h-px bg-ch-soft flex-1"></div>
                                <span className="text-xs font-bold text-ch-primary uppercase tracking-wider bg-white px-2">Service & Schedule</span>
                                <div className="h-px bg-ch-soft flex-1"></div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="relative">
                                    <label className="block text-sm font-bold text-ch-dark mb-2">Service Type</label>
                                    <div className="relative">
                                        <select
                                            value={formData.services}
                                            onChange={e => setFormData({...formData, services: e.target.value})}
                                            className="w-full px-4 py-3 bg-ch-light border border-ch-soft rounded-xl focus:outline-none focus:ring-2 focus:ring-ch-primary/20 focus:border-ch-primary transition-all appearance-none cursor-pointer font-medium text-ch-dark"
                                        >
                                            {SERVICES.map(s => (
                                                <option key={s} value={s}>{s}</option>
                                            ))}
                                        </select>
                                        <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-ch-primary">▼</div>
                                    </div>
                                    {formData.services === 'OTHER' && (
                                        <input
                                            type="text"
                                            placeholder="Specify other service..."
                                            value={otherService}
                                            onChange={e => setOtherService(e.target.value)}
                                            className="w-full mt-3 px-4 py-3 bg-ch-light border border-ch-soft rounded-xl focus:outline-none focus:ring-2 focus:ring-ch-primary/20 focus:border-ch-primary transition-all font-medium text-ch-dark"
                                        />
                                    )}
                                </div>
                                <div className="relative">
                                    <label className="block text-sm font-bold text-ch-dark mb-2">Due Date</label>
                                    <input
                                        type="date"
                                        value={formData.dueDate}
                                        onChange={e => setFormData({...formData, dueDate: e.target.value})}
                                        className="w-full px-4 py-3 bg-ch-light border border-ch-soft rounded-xl focus:outline-none focus:ring-2 focus:ring-ch-primary/20 focus:border-ch-primary transition-all font-medium text-ch-dark uppercase tracking-wider"
                                    />
                                </div>
                            </div>
                        </section>

                        {/* Section 3: Request Specifications */}
                        <section>
                            <div className="flex items-center gap-3 mb-6">
                                <div className="h-px bg-ch-soft flex-1"></div>
                                <span className="text-xs font-bold text-ch-primary uppercase tracking-wider bg-white px-2">Requirements</span>
                                <div className="h-px bg-ch-soft flex-1"></div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-6 bg-ch-light rounded-2xl border border-ch-soft">
                                <div>
                                    <label className="block text-sm font-bold text-ch-dark mb-3 flex items-center gap-2">
                                        📦 Request Barang
                                    </label>
                                    <div className="flex gap-2">
                                        {['Progress', 'Done'].map(status => (
                                            <button
                                                type="button"
                                                key={status}
                                                onClick={() => setFormData({...formData, requestBarang: status})}
                                                className={`flex-1 py-2.5 px-3 rounded-xl text-sm font-bold transition-all shadow-sm ${
                                                    formData.requestBarang === status 
                                                    ? 'bg-ch-primary text-white border border-ch-primary'
                                                    : 'bg-white text-ch-primary border border-ch-soft hover:bg-ch-light hover:text-ch-dark'
                                                }`}
                                            >
                                                {status}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-sm font-bold text-ch-dark mb-3 flex items-center gap-2">
                                        🛠️ Request Jasa
                                    </label>
                                    <div className="flex gap-2">
                                        {['No Need', 'Progress', 'Done'].map(status => (
                                            <button
                                                type="button"
                                                key={status}
                                                onClick={() => setFormData({...formData, requestJasa: status})}
                                                className={`flex-1 py-2.5 px-3 rounded-xl text-sm font-bold transition-all shadow-sm ${
                                                    formData.requestJasa === status 
                                                    ? 'bg-ch-primary text-white border border-ch-primary'
                                                    : 'bg-white text-ch-primary border border-ch-soft hover:bg-ch-light hover:text-ch-dark'
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
                                <div className="h-px bg-ch-soft flex-1"></div>
                                <span className="text-xs font-bold text-ch-primary uppercase tracking-wider bg-white px-2">Additional Details</span>
                                <div className="h-px bg-ch-soft flex-1"></div>
                            </div>

                            <div className="space-y-6">
                                <div className="relative">
                                    <label className="block text-sm font-bold text-ch-dark mb-2">Detail Request</label>
                                    <textarea
                                        value={formData.detailRequest}
                                        onChange={e => setFormData({...formData, detailRequest: e.target.value})}
                                        rows={3}
                                        placeholder="Enter detailed request description..."
                                        className="w-full px-4 py-3 bg-ch-light border border-ch-soft rounded-xl focus:outline-none focus:ring-2 focus:ring-ch-primary/20 focus:border-ch-primary transition-all font-medium text-ch-dark leading-relaxed resize-y"
                                    />
                                </div>
                                
                                <div className="relative">
                                    <label className="block text-sm font-bold text-ch-dark mb-2">Keterangan / Notes</label>
                                    <textarea
                                        value={formData.keterangan}
                                        onChange={e => setFormData({...formData, keterangan: e.target.value})}
                                        rows={2}
                                        placeholder="Any additional notes..."
                                        className="w-full px-4 py-3 bg-ch-light border border-ch-soft rounded-xl focus:outline-none focus:ring-2 focus:ring-ch-primary/20 focus:border-ch-primary transition-all font-medium text-ch-dark leading-relaxed resize-y italic"
                                    />
                                </div>
                            </div>
                        </section>

                    </div>
                    
                    {/* Footer Actions */}
                    <div className="mt-10 pt-6 border-t border-ch-soft flex justify-center gap-3 sticky bottom-0 bg-white p-4 -mx-8 -mb-8 z-20 shadow-[0_-10px_15px_-3px_rgba(0,0,0,0.05)]">
                        <div className="w-full max-w-2xl flex justify-end gap-3">
                            <button
                                type="button"
                                onClick={onClose}
                                className="px-6 py-2.5 text-ch-dark font-bold bg-ch-soft hover:bg-ch-soft rounded-xl transition-all"
                            >
                                Cancel
                            </button>
                            <button
                                type="submit"
                                className="px-8 py-2.5 bg-ch-primary text-white font-bold rounded-xl shadow-md shadow-ch-soft hover:bg-ch-dark hover:shadow-lg hover:-translate-y-0.5 transition-all active:scale-[0.98]"
                            >
                                {editData ? 'Update Work Order' : 'Create Work Order'}
                            </button>
                        </div>
                    </div>
                </form>
            </div>
        </div>
    );
}
