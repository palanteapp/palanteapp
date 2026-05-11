import React, { useEffect, useState } from 'react';
import { WifiOff } from 'lucide-react';
import { useOnlineStatus } from '../utils/offline';

export const OfflineBanner: React.FC = () => {
    const isOnline = useOnlineStatus();
    const [show, setShow] = useState(!isOnline);

    useEffect(() => {
        if (!isOnline) {
            setTimeout(() => setShow(true), 0);
        } else {
            // Delay hiding to show "Back online" message briefly
            const timer = setTimeout(() => setShow(false), 2000);
            return () => clearTimeout(timer);
        }
    }, [isOnline]);

    if (!show) return null;

    return (
        <div
            className={`fixed top-0 left-0 right-0 z-[100] transition-all duration-300 ${isOnline ? 'bg-green-500' : 'bg-orange-500'
                }`}
            style={{ paddingTop: 'env(safe-area-inset-top)' }}
        >
            <div className="flex items-center justify-center gap-2 px-4 py-2 text-white text-sm font-medium">
                {!isOnline && <WifiOff size={16} />}
                <span>
                    {isOnline ? '✓ Back online' : 'You\'re offline - some features unavailable'}
                </span>
            </div>
        </div>
    );
};
