import { useState, useEffect } from 'react';
// import './PWAInstallPrompt.css'; // Removed custom CSS

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
        <div className="fixed inset-0 z-[100] flex items-end md:items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fade-in">
            <div className="w-full max-w-sm bg-white rounded-2xl shadow-xl border-t-4 border-indigo-500 overflow-hidden animate-slide-up md:animate-scale-in relative">
                <button 
                    className="absolute top-2 right-2 w-8 h-8 flex items-center justify-center rounded-full text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition-colors"
                    onClick={handleDismiss}
                >
                    ×
                </button>
                
                <div className="p-6 text-center">
                    <div className="w-16 h-16 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl mx-auto flex items-center justify-center text-white mb-4 shadow-lg shadow-indigo-500/30">
                        <svg width="32" height="32" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path d="M12 2L12 15M12 15L8 11M12 15L16 11" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                            <path d="M4 17V19C4 20.1046 4.89543 21 6 21H18C19.1046 21 20 20.1046 20 19V17" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                        </svg>
                    </div>

                    <h3 className="text-xl font-bold text-gray-800 mb-2">Install Daily Activity App</h3>
                    
                    {isIOS ? (
                        <div className="text-left bg-gray-50 rounded-xl p-4 my-4 border border-gray-100">
                            <p className="text-sm text-gray-600 mb-3 font-medium">
                                Install this app on your device for quick access and offline use:
                            </p>
                            <ol className="text-sm text-gray-600 space-y-2 pl-2">
                                <li className="flex items-center gap-2">
                                    <span className="w-5 h-5 rounded-full bg-white border border-gray-200 flex items-center justify-center text-[10px] font-bold">1</span>
                                    <span>Tap the <strong>Share</strong> button <span className="inline-flex items-center justify-center w-5 h-5 bg-gray-200 rounded mx-1 text-blue-600 text-xs shadow-sm">⬆</span></span>
                                </li>
                                <li className="flex items-center gap-2">
                                    <span className="w-5 h-5 rounded-full bg-white border border-gray-200 flex items-center justify-center text-[10px] font-bold">2</span>
                                    <span>Scroll down and tap <strong>"Add to Home Screen"</strong></span>
                                </li>
                                <li className="flex items-center gap-2">
                                    <span className="w-5 h-5 rounded-full bg-white border border-gray-200 flex items-center justify-center text-[10px] font-bold">3</span>
                                    <span>Tap <strong>Add</strong> to confirm</span>
                                </li>
                            </ol>
                        </div>
                    ) : (
                        <div className="text-center my-4">
                            <p className="text-sm text-gray-600 mb-4">
                                Install this app on your device for quick access and a better experience.
                            </p>
                            <div className="grid grid-cols-1 gap-2 text-left">
                                <div className="flex items-center gap-2 bg-indigo-50 px-3 py-2 rounded-lg text-indigo-700 text-xs font-medium">
                                    <span className="text-indigo-500">✓</span> Quick access from home screen
                                </div>
                                <div className="flex items-center gap-2 bg-indigo-50 px-3 py-2 rounded-lg text-indigo-700 text-xs font-medium">
                                    <span className="text-indigo-500">✓</span> Works offline
                                </div>
                                <div className="flex items-center gap-2 bg-indigo-50 px-3 py-2 rounded-lg text-indigo-700 text-xs font-medium">
                                    <span className="text-indigo-500">✓</span> Native app experience
                                </div>
                            </div>
                        </div>
                    )}

                    <div className="flex flex-col gap-3 mt-6">
                        {!isIOS && (
                            <button 
                                className="w-full py-3 bg-indigo-600 text-white font-bold rounded-xl shadow-lg shadow-indigo-500/20 hover:bg-indigo-700 active:transform active:scale-95 transition-all text-sm"
                                onClick={handleInstall}
                            >
                                Install Now
                            </button>
                        )}
                        <button 
                            className="w-full py-3 bg-transparent text-gray-500 font-medium text-sm hover:text-gray-800 transition-colors" 
                            onClick={handleDismiss}
                        >
                            {isIOS ? 'Got it' : 'Maybe Later'}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default PWAInstallPrompt;
