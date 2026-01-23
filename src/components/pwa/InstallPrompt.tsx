"use client";

import { useEffect, useState } from "react";
import { Download, X } from "lucide-react";

export default function InstallPrompt() {
    const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
    const [isVisible, setIsVisible] = useState(false);

    useEffect(() => {
        const handler = (e: any) => {
            e.preventDefault();
            setDeferredPrompt(e);
            setIsVisible(true);
        };

        window.addEventListener("beforeinstallprompt", handler);

        return () => {
            window.removeEventListener("beforeinstallprompt", handler);
        };
    }, []);

    const handleInstallClick = async () => {
        if (!deferredPrompt) return;

        deferredPrompt.prompt();

        const { outcome } = await deferredPrompt.userChoice;

        if (outcome === 'accepted') {
            console.log('User accepted the install prompt');
        } else {
            console.log('User dismissed the install prompt');
        }

        setDeferredPrompt(null);
        setIsVisible(false);
    };

    if (!isVisible) return null;

    return (
        <div className="fixed bottom-4 left-4 right-4 md:left-auto md:right-4 md:w-96 bg-white dark:bg-zinc-800 p-4 rounded-xl shadow-2xl border border-zinc-200 dark:border-zinc-700 z-50 animate-in slide-in-from-bottom-5">
            <button
                onClick={() => setIsVisible(false)}
                className="absolute top-2 right-2 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200"
            >
                <X size={20} />
            </button>

            <div className="flex items-start gap-4">
                <div className="p-3 bg-blue-100 dark:bg-blue-900/30 rounded-lg text-blue-600 dark:text-blue-400">
                    <Download size={24} />
                </div>
                <div className="flex-1">
                    <h3 className="font-semibold text-lg text-zinc-900 dark:text-zinc-100">
                        Instalar App
                    </h3>
                    <p className="text-sm text-zinc-600 dark:text-zinc-400 mt-1 mb-3">
                        Instale o KAMBA POS no seu dispositivo para acesso rápido e offline.
                    </p>
                    <button
                        onClick={handleInstallClick}
                        className="w-full py-2 px-4 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors text-sm"
                    >
                        Instalar Agora
                    </button>
                </div>
            </div>
        </div>
    );
}
