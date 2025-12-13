import { useState, useEffect } from 'react';
// unused import removed

// Interface removed

interface NotificationSettings {
    enabled: boolean;
    quietStart: string; // "22:00"
    quietEnd: string;   // "08:00"
}

export const useNotifications = () => {
    const [permission, setPermission] = useState<NotificationPermission>('default');
    const [settings, setSettings] = useState<NotificationSettings>(() => {
        const saved = localStorage.getItem('palante_notifications');
        return saved ? JSON.parse(saved) : {
            enabled: false,
            quietStart: '22:00',
            quietEnd: '08:00'
        };
    });

    useEffect(() => {
        if ('Notification' in window) {
            setPermission(Notification.permission);
        }
    }, []);

    useEffect(() => {
        localStorage.setItem('palante_notifications', JSON.stringify(settings));
    }, [settings]);

    const requestPermission = async () => {
        if (!('Notification' in window)) {
            alert('This browser does not support desktop notifications');
            return false;
        }

        const result = await Notification.requestPermission();
        setPermission(result);

        if (result === 'granted') {
            setSettings(prev => ({ ...prev, enabled: true }));
            return true;
        }
        return false;
    };

    const toggleEnabled = async () => {
        if (!settings.enabled) {
            // Trying to enable
            if (permission !== 'granted') {
                const granted = await requestPermission();
                if (!granted) return; // User denied
            }
            setSettings(prev => ({ ...prev, enabled: true }));
        } else {
            // Disabling
            setSettings(prev => ({ ...prev, enabled: false }));
        }
    };

    const updateQuietHours = (start: string, end: string) => {
        setSettings(prev => ({ ...prev, quietStart: start, quietEnd: end }));
    };

    const isInQuietHours = (): boolean => {
        if (!settings.enabled) return true; // Effectively quiet if disabled

        const now = new Date();
        const currentMinutes = now.getHours() * 60 + now.getMinutes();

        const [startH, startM] = settings.quietStart.split(':').map(Number);
        const [endH, endM] = settings.quietEnd.split(':').map(Number);

        const startTotal = startH * 60 + startM;
        const endTotal = endH * 60 + endM;

        if (startTotal > endTotal) {
            // Crosses midnight (e.g. 22:00 to 08:00)
            return currentMinutes >= startTotal || currentMinutes < endTotal;
        } else {
            // Same day (e.g. 09:00 to 17:00 - rare for quiet hours but possible)
            return currentMinutes >= startTotal && currentMinutes < endTotal;
        }
    };

    const sendNotification = (title: string, options?: NotificationOptions) => {
        if (!('Notification' in window)) return;

        if (permission === 'granted' && settings.enabled && !isInQuietHours()) {
            try {
                // Check if Service Worker is active for better mobile support
                if (navigator.serviceWorker && navigator.serviceWorker.controller) {
                    navigator.serviceWorker.ready.then(registration => {
                        registration.showNotification(title, {
                            icon: '/pwa-192x192.png',
                            badge: '/pwa-192x192.png', // Android small icon
                            ...options
                        });
                    });
                } else {
                    // Standard desktop notification
                    new Notification(title, {
                        icon: '/pwa-192x192.png',
                        ...options
                    });
                }
            } catch (error) {
                console.error("Notification failed", error);
            }
        } else {
            console.log("Notification suppressed (Quiet Hours or Permission denied)");
        }
    };

    // Force send function for "Test Notification" button (ignores Quiet Hours)
    const testNotification = async () => {
        console.log('🔔 Test notification button clicked');
        console.log('Current permission:', permission);

        try {
            if (!('Notification' in window)) {
                alert('❌ Notifications are not supported in this browser.');
                console.error('Notifications not supported');
                return;
            }

            if (permission === 'denied') {
                alert('❌ Notifications are blocked. Please enable them in your browser settings.');
                console.error('Permission denied');
                return;
            }

            if (permission === 'granted') {
                console.log('✅ Permission already granted, showing notification');
                new Notification("🔔 Palante Test", {
                    body: "Notifications are working! We'll keep quiet during your set hours.",
                    icon: '/pwa-192x192.png'
                });
                alert('✅ Test notification sent! Check your notifications.');
            } else {
                console.log('⚠️ Requesting permission...');
                alert('⚠️ Please allow notifications when prompted.');

                const result = await Notification.requestPermission();
                console.log('Permission result:', result);

                if (result === 'granted') {
                    console.log('✅ Permission granted, showing notification');
                    new Notification("🔔 Palante Test", {
                        body: "Notifications are working! We'll keep quiet during your set hours.",
                        icon: '/pwa-192x192.png'
                    });
                    alert('✅ Test notification sent! Check your notifications.');
                } else {
                    alert('❌ Permission denied. Please enable notifications in browser settings.');
                    console.error('Permission denied after request');
                }
            }
        } catch (error) {
            console.error('❌ Notification error:', error);
            alert(`❌ Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    };

    return {
        permission,
        settings,
        toggleEnabled,
        updateQuietHours,
        sendNotification,
        testNotification,
        isInQuietHours
    };
};
