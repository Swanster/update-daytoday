import { useState, useRef } from 'react';

const STATUS_OPTIONS = {
    status: ['Progress', 'Done', 'Hold'],
    reportSurvey: ['Progress', 'Done'],
    wo: ['Progress', 'Done'],
    material: ['Progress', 'Done'],
    requestBarang: ['Progress', 'Done'],
    requestJasa: ['No Need', 'Progress', 'Done'],
};

export default function StatusCell({ value, type = 'status', onUpdate }) {
    const [isOpen, setIsOpen] = useState(false);
    const [dropdownPos, setDropdownPos] = useState({ top: 0, left: 0 });
    const buttonRef = useRef(null);

    const options = STATUS_OPTIONS[type] || STATUS_OPTIONS.status;

    const handleOpen = (e) => {
        e.stopPropagation();
        if (isOpen) {
            setIsOpen(false);
            return;
        }

        if (buttonRef.current) {
            const rect = buttonRef.current.getBoundingClientRect();
            const viewportHeight = window.innerHeight;
            const spaceBelow = viewportHeight - rect.bottom;
            const showAbove = spaceBelow < 150;

            setDropdownPos({
                top: showAbove ? rect.top - 10 : rect.bottom + 5,
                left: rect.left,
                transform: showAbove ? 'translateY(-100%)' : 'none'
            });
        }
        setIsOpen(true);
    };

    const getBadgeClass = (val) => {
        const baseClasses = "inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border cursor-pointer hover:opacity-80 transition-opacity select-none";
        const valLower = (val || '').toLowerCase();

        if (valLower.includes('done') || valLower.includes('complete')) {
            return baseClasses + " bg-green-100 text-green-800 border-green-200";
        } else if (valLower.includes('progress')) {
            return baseClasses + " bg-blue-100 text-blue-800 border-blue-200";
        } else if (valLower.includes('hold')) {
            return baseClasses + " bg-orange-100 text-orange-800 border-orange-200";
        } else if (valLower.includes('no need')) {
            return baseClasses + " bg-gray-100 text-gray-800 border-gray-200";
        } else {
            return baseClasses + " bg-gray-100 text-gray-800 border-gray-200";
        }
    };

    return (
        <>
            <span
                ref={buttonRef}
                className={getBadgeClass(value)}
                onClick={handleOpen}
            >
                {value || '-'}
            </span>

            {isOpen && (
                <div
                    className="fixed inset-0 z-[9999] isolate"
                    onClick={(e) => {
                        e.stopPropagation();
                        setIsOpen(false);
                    }}
                >
                    <div
                        className="absolute bg-white rounded-xl shadow-xl border border-gray-100 overflow-hidden animate-scale-in w-32"
                        style={{
                            top: dropdownPos.top,
                            left: dropdownPos.left,
                            transform: dropdownPos.transform
                        }}
                    >
                        {options.map((opt) => {
                            const isSelected = value === opt;
                            let itemClass = "px-4 py-2 text-xs font-medium cursor-pointer hover:bg-gray-50 flex items-center justify-between";
                            if (isSelected) {
                                itemClass += " text-indigo-600 bg-indigo-50";
                            } else {
                                itemClass += " text-gray-700";
                            }
                            return (
                                <div
                                    key={opt}
                                    className={itemClass}
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        onUpdate(opt);
                                        setIsOpen(false);
                                    }}
                                >
                                    {opt}
                                    {isSelected && <span>✓</span>}
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}
        </>
    );
}
