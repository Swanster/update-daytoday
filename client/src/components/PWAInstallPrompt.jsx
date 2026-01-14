import { useState, useEffect } from 'react';
import './PWAInstallPrompt.css';

function PWAInstallPrompt() {
    const [deferredPrompt, setDeferredPrompt] = useState(null);
    const [showPrompt, setShowPrompt] = useState(false);
    const [isIOS, setIsIOS] = useState(false);

    useEffect(() => {
        // Check if already installed
        if (window.matchMedia('(display-mode: standalone)').matches) {
            return;
        }

        // Check if dismissed recently (within 7 days)
        const dismissedAt = localStorage.getItem('pwa-prompt-dismissed');
        if (dismissedAt) {
            const daysSinceDismissed = (Date.now() - parseInt(dismissedAt)) / (1000 * 60 * 60 * 24);
            if (daysSinceDismissed < 7) {
                return;
            }
        }

        // Detect iOS
        const isIOSDevice = /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;
        setIsIOS(isIOSDevice);

        // For iOS, show prompt after a delay since they don't support beforeinstallprompt
        if (isIOSDevice) {
            const timer = setTimeout(() => {
                setShowPrompt(true);
            }, 3000);
            return () => clearTimeout(timer);
        }

        // For other browsers, listen for the beforeinstallprompt event
        const handleBeforeInstallPrompt = (e) => {
            e.preventDefault();
            setDeferredPrompt(e);
            // Show prompt after a short delay
            setTimeout(() => {
                setShowPrompt(true);
            }, 2000);
        };

        window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

        return () => {
            window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
        };
    }, []);

    const handleInstall = async () => {
        if (!deferredPrompt) return;

        deferredPrompt.prompt();
        const { outcome } = await deferredPrompt.userChoice;
        
        if (outcome === 'accepted') {
            console.log('User accepted the install prompt');
        }
        
        setDeferredPrompt(null);
        setShowPrompt(false);
    };

    const handleDismiss = () => {
        localStorage.setItem('pwa-prompt-dismissed', Date.now().toString());
        setShowPrompt(false);
    };

    if (!showPrompt) return null;

    return (
        <div className="pwa-prompt-overlay">
            <div className="pwa-prompt-modal">
                <button className="pwa-prompt-close" onClick={handleDismiss}>×</button>
                
                <div className="pwa-prompt-icon">
                    <svg width="48" height="48" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M12 2L12 15M12 15L8 11M12 15L16 11" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                        <path d="M4 17V19C4 20.1046 4.89543 21 6 21H18C19.1046 21 20 20.1046 20 19V17" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                    </svg>
                </div>

                <h3 className="pwa-prompt-title">Install Daily Activity App</h3>
                
                {isIOS ? (
                    <div className="pwa-prompt-ios">
                        <p className="pwa-prompt-description">
                            Install this app on your device for quick access and offline use:
                        </p>
                        <ol className="pwa-prompt-steps">
                            <li>Tap the <strong>Share</strong> button <span className="ios-share-icon">⬆</span></li>
                            <li>Scroll down and tap <strong>"Add to Home Screen"</strong></li>
                            <li>Tap <strong>Add</strong> to confirm</li>
                        </ol>
                    </div>
                ) : (
                    <div className="pwa-prompt-android">
                        <p className="pwa-prompt-description">
                            Install this app on your device for quick access and a better experience.
                        </p>
                        <div className="pwa-prompt-features">
                            <span>✓ Quick access from home screen</span>
                            <span>✓ Works offline</span>
                            <span>✓ Native app experience</span>
                        </div>
                    </div>
                )}

                <div className="pwa-prompt-actions">
                    {!isIOS && (
                        <button className="pwa-prompt-install" onClick={handleInstall}>
                            Install Now
                        </button>
                    )}
                    <button className="pwa-prompt-later" onClick={handleDismiss}>
                        {isIOS ? 'Got it' : 'Maybe Later'}
                    </button>
                </div>
            </div>
        </div>
    );
}

export default PWAInstallPrompt;
