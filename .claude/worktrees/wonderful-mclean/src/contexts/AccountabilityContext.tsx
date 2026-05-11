import React, { createContext, useContext, useState, useCallback, useMemo } from 'react';
import type { AccountabilityPartner, PartnerActivity } from '../types';
import { useUser } from './UserContext';

interface AccountabilityContextType {
    partners: AccountabilityPartner[];
    activityFeed: PartnerActivity[];
    myInviteCode: string;
    addPartner: (name: string, code: string) => Promise<boolean>;
    removePartner: (id: string) => void;
    sendNudge: (partnerId: string, partnerName: string) => void;
    acceptInvite: (partnerId: string) => void;
}

const AccountabilityContext = createContext<AccountabilityContextType | undefined>(undefined);

export const useAccountability = () => {
    const context = useContext(AccountabilityContext);
    if (!context) {
        throw new Error('useAccountability must be used within AccountabilityProvider');
    }
    return context;
};

export const AccountabilityProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const { user, updateProfile } = useUser();
    const [activityFeed, setActivityFeed] = useState<PartnerActivity[]>([]);

    // Generate a simple invite code from user ID
    const myInviteCode = useMemo(() => {
        if (!user?.id) return 'GENERATING...';
        // Create a short, shareable code (first 4 chars of ID + last 4 chars)
        const idPart = user.id.replace(/-/g, '').toUpperCase();
        return `${idPart.substring(0, 4)}-${idPart.substring(idPart.length - 4)}`;
    }, [user]);

    const partners = useMemo(() => user?.accountabilityPartners || [], [user]);

    const addPartner = useCallback(async (name: string, code: string): Promise<boolean> => {
        if (!user) return false;

        // Simulate partner lookup (in a real app, this would be an API call)
        // For now, we accept any valid-looking code
        if (code.length < 4) return false;

        const newPartner: AccountabilityPartner = {
            id: `partner_${Date.now()}`,
            name: name.trim(),
            currentStreak: 0,
            lastActivityDate: new Date().toISOString().split('T')[0],
            inviteStatus: 'pending',
            addedDate: new Date().toISOString(),
        };

        const updatedPartners = [...(user.accountabilityPartners || []), newPartner];
        updateProfile({ ...user, accountabilityPartners: updatedPartners });

        // Add to activity feed
        setActivityFeed(prev => [
            {
                id: `activity_${Date.now()}`,
                partnerId: newPartner.id,
                partnerName: name,
                type: 'nudge_sent',
                message: `Invite sent to ${name}`,
                timestamp: new Date().toISOString(),
            },
            ...prev,
        ]);

        return true;
    }, [user, updateProfile]);

    const removePartner = useCallback((id: string) => {
        if (!user) return;
        const updatedPartners = (user.accountabilityPartners || []).filter(p => p.id !== id);
        updateProfile({ ...user, accountabilityPartners: updatedPartners });
    }, [user, updateProfile]);

    const sendNudge = useCallback((partnerId: string, partnerName: string) => {
        // Add nudge to activity feed (in a real app, would also send a notification)
        setActivityFeed(prev => [
            {
                id: `activity_${Date.now()}`,
                partnerId,
                partnerName,
                type: 'nudge_sent',
                message: `You sent Fire 🔥 to ${partnerName}!`,
                timestamp: new Date().toISOString(),
            },
            ...prev,
        ]);
    }, []);

    const acceptInvite = useCallback((partnerId: string) => {
        if (!user) return;
        const updatedPartners = (user.accountabilityPartners || []).map(p =>
            p.id === partnerId ? { ...p, inviteStatus: 'accepted' as const } : p
        );
        updateProfile({ ...user, accountabilityPartners: updatedPartners });
    }, [user, updateProfile]);

    const value = useMemo(() => ({
        partners,
        activityFeed,
        myInviteCode,
        addPartner,
        removePartner,
        sendNudge,
        acceptInvite,
    }), [partners, activityFeed, myInviteCode, addPartner, removePartner, sendNudge, acceptInvite]);

    return (
        <AccountabilityContext.Provider value={value}>
            {children}
        </AccountabilityContext.Provider>
    );
};
