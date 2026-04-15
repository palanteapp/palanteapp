import React, { useState, useEffect } from 'react';
import { X, ArrowUp, ArrowDown, Check } from 'lucide-react';
import { haptics } from '../utils/haptics';

interface ReorderModalProps {
    isOpen: boolean;
    onClose: () => void;
    isDarkMode: boolean;
    title: string;
    items: { id: string; label: string }[];
    currentOrder: string[];
    onSave: (newOrder: string[]) => void;
}

export const ReorderModal: React.FC<ReorderModalProps> = ({
    isOpen,
    onClose,
    isDarkMode,
    title,
    items,
    currentOrder,
    onSave
}) => {
    const [order, setOrder] = useState<string[]>([]);

    useEffect(() => {
        if (isOpen) {
            // Get all valid IDs from items definition
            const availableIds = items.map(i => i.id);

            // Filter currentOrder to only include valid IDs
            const validOrder = currentOrder.filter(id => availableIds.includes(id));

            // Append any missing items to the end
            availableIds.forEach(id => {
                if (!validOrder.includes(id)) {
                    validOrder.push(id);
                }
            });

            setTimeout(() => setOrder(validOrder), 0);
        }
    }, [isOpen, currentOrder, items]);

    const moveItem = (index: number, direction: 'up' | 'down') => {
        if (direction === 'up' && index === 0) return;
        if (direction === 'down' && index === order.length - 1) return;

        haptics.selection();

        const newOrder = [...order];
        const swapIndex = direction === 'up' ? index - 1 : index + 1;

        [newOrder[index], newOrder[swapIndex]] = [newOrder[swapIndex], newOrder[index]];
        setOrder(newOrder);
    };

    const handleSave = () => {
        haptics.medium();
        onSave(order);
        onClose();
    };

    const getLabel = (id: string) => items.find(i => i.id === id)?.label || id;

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[100] flex items-start justify-center animate-fade-in p-4 pt-20 overflow-hidden">
            <div
                className="absolute inset-0 bg-[#3A1700]/60 backdrop-blur-md transition-opacity"
                onClick={onClose}
            />

            <div className={`relative w-full max-w-sm rounded-[32px] shadow-2xl overflow-hidden flex flex-col animate-in fade-in zoom-in duration-300 ${isDarkMode ? 'bg-sage-mid border border-white/10' : 'bg-[#fcf8f2] border border-sage/10'
                }`}>

                <div className="px-6 pt-5 pb-2 flex justify-between items-center">
                    <div>
                        <h2 className={`font-display font-medium text-xl tracking-tight ${isDarkMode ? 'text-white' : 'text-sage'}`}>
                            {title}
                        </h2>
                    </div>
                    <button
                        onClick={onClose}
                        className={`w-8 h-8 rounded-full flex items-center justify-center transition-all ${isDarkMode ? 'bg-white/5 hover:bg-white/10 text-white/40' : 'bg-sage/5 hover:bg-sage/10 text-sage/40'
                            }`}
                    >
                        <X size={18} />
                    </button>
                </div>

                <div className="px-4 pb-4 space-y-1.5 max-h-[60vh] overflow-y-auto overscroll-contain scrollbar-hide">
                    {order.map((sectionId, index) => (
                        <div
                            key={sectionId}
                            className={`flex items-center justify-between p-3 rounded-2xl border transition-all duration-300 ${isDarkMode
                                ? 'bg-white/5 border-white/5 hover:bg-white/10'
                                : 'bg-white border-sage/5 shadow-sm'
                                }`}
                        >
                            <div className="flex items-center gap-3">
                                <div className={`w-6 h-6 rounded-full flex items-center justify-center text-[9px] font-bold ${isDarkMode ? 'bg-white/10 text-white/40' : 'bg-sage/10 text-sage/40'
                                    }`}>
                                    {index + 1}
                                </div>
                                <span className={`text-sm font-bold tracking-tight ${isDarkMode ? 'text-white' : 'text-sage'}`}>
                                    {getLabel(sectionId)}
                                </span>
                            </div>

                            <div className="flex items-center gap-1 bg-[#3A1700]/5 p-0.5 rounded-lg">
                                <button
                                    onClick={() => moveItem(index, 'up')}
                                    disabled={index === 0}
                                    className={`w-7 h-7 rounded-md flex items-center justify-center transition-all ${index === 0
                                        ? 'opacity-10 cursor-not-allowed'
                                        : isDarkMode ? 'hover:bg-white/20 text-white' : 'hover:bg-sage/10 text-sage'
                                        }`}
                                >
                                    <ArrowUp size={14} strokeWidth={2.5} />
                                </button>
                                <button
                                    onClick={() => moveItem(index, 'down')}
                                    disabled={index === order.length - 1}
                                    className={`w-7 h-7 rounded-md flex items-center justify-center transition-all ${index === order.length - 1
                                        ? 'opacity-10 cursor-not-allowed'
                                        : isDarkMode ? 'hover:bg-white/20 text-white' : 'hover:bg-sage/10 text-sage'
                                        }`}
                                >
                                    <ArrowDown size={14} strokeWidth={2.5} />
                                </button>
                            </div>
                        </div>
                    ))}
                </div>

                <div className="p-4 bg-[#3A1700]/5">
                    <button
                        onClick={handleSave}
                        className={`w-full py-3.5 rounded-2xl font-bold uppercase tracking-[0.2em] text-[10px] flex items-center justify-center gap-2 transition-all active:scale-[0.98] shadow-xl ${isDarkMode ? 'bg-pale-gold text-sage-dark shadow-pale-gold/10' : 'bg-terracotta-500 text-white shadow-terracotta-500/20'
                            }`}
                    >
                        <Check size={14} strokeWidth={3} />
                        Apply Layout
                    </button>
                </div>
            </div>
        </div>
    );
};
