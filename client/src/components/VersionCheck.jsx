import { useEffect } from 'react';

const VersionCheck = () => {
    useEffect(() => {
        const checkVersion = async () => {
            try {
                // Add timestamp to prevent caching of the version file itself
                const response = await fetch('/version.json?t=' + new Date().getTime());
                if (!response.ok) return;
                
                const data = await response.json();
                const latestVersion = data.version;
                const currentVersion = localStorage.getItem('app_version');

                if (currentVersion && latestVersion !== currentVersion) {
                    // Version changed
                    console.log(`Version update detected: ${currentVersion} -> ${latestVersion}`);
                    
                    // Update local storage
                    localStorage.setItem('app_version', latestVersion);
                    
                    // Clear service worker caches
                    if ('caches' in window) {
                        const cacheNames = await caches.keys();
                        await Promise.all(
                            cacheNames.map(name => caches.delete(name))
                        );
                    }

                    // Unregister service workers
                    if ('serviceWorker' in navigator) {
                        const registrations = await navigator.serviceWorker.getRegistrations();
                        for (const registration of registrations) {
                            await registration.unregister();
                        }
                    }

                    // Force reload
                    window.location.reload(true);
                } else if (!currentVersion) {
                    // First load, just set the version
                    localStorage.setItem('app_version', latestVersion);
                }
            } catch (error) {
                console.error('Failed to check version:', error);
            }
        };

        // Check immediately on mount
        checkVersion();

        // Check periodically (every 5 minutes)
        const interval = setInterval(checkVersion, 5 * 60 * 1000);

        // Check on visibility change (when user comes back to tab)
        const handleVisibilityChange = () => {
            if (document.visibilityState === 'visible') {
                checkVersion();
            }
        };

        document.addEventListener('visibilitychange', handleVisibilityChange);

        return () => {
            clearInterval(interval);
            document.removeEventListener('visibilitychange', handleVisibilityChange);
        };
    }, []);

    return null; // This component doesn't render anything
};

export default VersionCheck;
