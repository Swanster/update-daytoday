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
        const baseClasses = "inline-flex items-center px-3 py-1 rounded-full text-[11px] font-extrabold uppercase tracking-wider border cursor-pointer hover:shadow-md transition-all select-none shadow-sm";
        const valLower = (val || '').toLowerCase();

        if (valLower.includes('done') || valLower.includes('complete')) {
            return baseClasses + " bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100";
        } else if (valLower.includes('progress')) {
            return baseClasses + " bg-ch-soft text-ch-dark border-ch-soft hover:bg-ch-soft";
        } else if (valLower.includes('hold')) {
            return baseClasses + " bg-amber-50 text-amber-700 border-amber-200 hover:bg-amber-100";
        } else if (valLower.includes('no need')) {
            return baseClasses + " bg-ch-soft text-ch-dark border-ch-soft hover:bg-ch-soft";
        } else {
            return baseClasses + " bg-ch-light text-ch-dark border-ch-soft hover:bg-ch-soft";
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
                        className="absolute bg-white/95 backdrop-blur-xl rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.12)] border border-ch-soft overflow-hidden animate-scale-in w-36 z-[100]"
                        style={{
                            top: dropdownPos.top,
                            left: dropdownPos.left,
                            transform: dropdownPos.transform
                        }}
                    >
                        <div className="py-1">
                            {options.map((opt) => {
                                const isSelected = value === opt;
                                let itemClass = "px-4 py-2.5 text-xs font-bold cursor-pointer transition-colors flex items-center justify-between mx-1 rounded-xl";
                                if (isSelected) {
                                    itemClass += " text-ch-dark bg-ch-soft/80";
                                } else {
                                    itemClass += " text-ch-dark hover:bg-ch-light hover:text-ch-dark";
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
                                        <span className="tracking-wide">{opt}</span>
                                        {isSelected && <span className="text-ch-primary font-extrabold flex items-center justify-center w-4 h-4 bg-ch-soft rounded-full text-[10px]">✓</span>}
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}
