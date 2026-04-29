import { useState } from 'react';
import { Copy, Check, X } from 'lucide-react';

interface PartnerInviteModalProps {
    isOpen: boolean;
    onClose: () => void;
    inviteCode: string;
    onGenerateCode: () => void;
    onAddPartner: (name: string, code: string) => void;
    isDarkMode: boolean;
    isLoading?: boolean;
    error?: string | null;
}

export const PartnerInviteModal: React.FC<PartnerInviteModalProps> = ({
    isOpen,
    onClose,
    inviteCode,
    isDarkMode,
    onAddPartner,
    isLoading,
    error
}) => {
    const [copied, setCopied] = useState(false);
    const [partnerCode, setPartnerCode] = useState('');
    const [partnerName, setPartnerName] = useState('');

    if (!isOpen) return null;

    const handleCopy = () => {
        navigator.clipboard.writeText(inviteCode);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const handleAddByCode = () => {
        if (partnerCode.trim() && partnerName.trim()) {
            onAddPartner(partnerName.trim(), partnerCode.trim());
            // Don't clear state immediately, let parent handle success/close
        }
    };

    const textPrimary = isDarkMode ? 'text-white' : 'text-sage-dark';
    const textSecondary = isDarkMode ? 'text-white/60' : 'text-sage-dark/60';

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-fade-in">
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-black/20 backdrop-blur-sm"
                onClick={!isLoading ? onClose : undefined}
            />

            {/* Modal */}
            <div className={`relative w-full max-w-md max-h-[90vh] overflow-y-auto p-6 rounded-2xl shadow-2xl ${isDarkMode ? 'bg-sage-mid border border-white/10' : 'bg-white border border-sage/20'
                }`}>
                {/* Close Button */}
                <button
                    onClick={onClose}
                    disabled={isLoading}
                    className={`absolute top-4 right-4 p-1.5 rounded-full transition-all ${isDarkMode ? 'text-white/60 hover:text-white hover:bg-white/10' : 'text-sage/60 hover:text-sage hover:bg-sage/10'
                        }`}
                >
                    <X size={18} />
                </button>

                {/* Header */}
                <h2 className={`text-2xl font-display font-medium mb-2 ${textPrimary}`}>
                    Invite Accountability Partner
                </h2>
                <p className={`text-sm mb-6 ${textSecondary}`}>
                    Share your invite code or enter a partner's code to connect
                </p>

                {/* Your Invite Code */}
                <div className="mb-6">
                    <label className={`text-sm font-medium mb-2 block ${textPrimary}`}>
                        Your Invite Code
                    </label>
                    <div className="flex gap-2">
                        <div className={`flex-1 px-4 py-3 rounded-xl font-mono text-lg font-bold text-center ${isDarkMode ? 'bg-white/10 text-pale-gold' : 'bg-sage/10 text-sage'
                            }`}>
                            {inviteCode || 'Generating...'}
                        </div>
                        <button
                            onClick={handleCopy}
                            className={`px-4 py-3 rounded-xl font-medium transition-all flex items-center gap-2 ${copied
                                ? isDarkMode ? 'bg-sage/20 text-sage' : 'bg-sage/20 text-sage'
                                : isDarkMode ? 'bg-pale-gold/20 text-pale-gold hover:bg-pale-gold/30' : 'bg-sage/20 text-sage hover:bg-sage/30'
                                }`}
                        >
                            {copied ? <Check size={18} /> : <Copy size={18} />}
                        </button>
                    </div>
                </div>

                {/* Divider */}
                <div className="relative mb-6">
                    <div className={`absolute inset-0 flex items-center`}>
                        <div className={`w-full border-t ${isDarkMode ? 'border-white/10' : 'border-sage/10'}`} />
                    </div>
                    <div className="relative flex justify-center">
                        <span className={`px-3 text-xs uppercase tracking-wider font-bold ${isDarkMode ? 'bg-sage-mid text-white/40' : 'bg-white text-sage/40'
                            }`}>
                            Or
                        </span>
                    </div>
                </div>

                {/* Add Partner by Code */}
                <div>
                    <label className={`text-sm font-medium mb-2 block ${textPrimary}`}>
                        Enter Partner's Details
                    </label>

                    {/* Partner Name Input */}
                    <input
                        type="text"
                        value={partnerName}
                        onChange={(e) => setPartnerName(e.target.value)}
                        placeholder="Partner's Name (e.g. Maria)"
                        disabled={isLoading}
                        className={`w-full px-4 py-3 mb-3 rounded-xl transition-all ${isDarkMode
                            ? 'bg-white/10 border-2 border-white/20 text-white placeholder-white/40 focus:border-pale-gold focus:bg-white/20'
                            : 'bg-white/60 border-2 border-sage/20 text-sage-dark placeholder-sage-dark/40 focus:border-sage focus:bg-white'
                            }`}
                    />

                    <div className="flex flex-col gap-2">
                        <div className="flex gap-2">
                            <input
                                type="text"
                                value={partnerCode}
                                onChange={(e) => setPartnerCode(e.target.value.toUpperCase())}
                                placeholder="XXXX-XXXX"
                                maxLength={9}
                                disabled={isLoading}
                                className={`flex-1 px-4 py-3 rounded-xl font-mono text-lg uppercase transition-all ${isDarkMode
                                    ? 'bg-white/10 border-2 border-white/20 text-white placeholder-white/40 focus:border-pale-gold focus:bg-white/20'
                                    : 'bg-white/60 border-2 border-sage/20 text-sage-dark placeholder-sage-dark/40 focus:border-sage focus:bg-white'
                                    }`}
                            />
                            <button
                                onClick={handleAddByCode}
                                disabled={!partnerCode.trim() || !partnerName.trim() || isLoading}
                                className={`px-6 py-3 rounded-xl font-medium transition-all ${partnerCode.trim() && partnerName.trim() && !isLoading
                                    ? isDarkMode
                                        ? 'bg-pale-gold text-sage-dark hover:bg-pale-gold/90'
                                        : 'bg-terracotta-500 text-white hover:bg-sage-600'
                                    : 'bg-white/10 text-white/20 cursor-not-allowed'
                                    }`}
                            >
                                {isLoading ? 'Adding...' : 'Add'}
                            </button>
                        </div>
                        {error && (
                            <p className="text-red-400 text-xs mt-1 animate-fade-in">
                                {error}
                            </p>
                        )}
                    </div>
                </div>

                {/* Privacy Note */}
                <div className={`mt-6 p-4 rounded-xl ${isDarkMode ? 'bg-white/5 border border-white/10' : 'bg-sage/5 border border-sage/10'
                    }`}>
                    <p className={`text-xs ${textSecondary}`}>
                        🔒 <strong>Privacy First:</strong> Partners can only see your streak count and last activity date. Your goals remain private.
                    </p>
                </div>
            </div>
        </div>
    );
};
