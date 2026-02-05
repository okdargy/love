"use client"

import { ArrowRight, X } from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';

export default function Attention() {
    const [isVisible, setIsVisible] = useState<boolean | undefined>(undefined);
    const pathname = usePathname();
    
    useEffect(() => {
        const dismissed = localStorage.getItem('attentionValueDismissed');
        setIsVisible(dismissed !== 'true');
    }, [pathname]);

    const handleDismiss = () => {
        setIsVisible(false);
        localStorage.setItem('attentionValueDismissed', 'true');
    };

    if (isVisible === null || !isVisible) return null;

    return (
        <div className="attention-alert bg-primary w-full h-8 flex items-center relative">
            <button
                onClick={handleDismiss}
                className="absolute right-4 z-20 opacity-50 hover:opacity-100 transition-opacity"
                aria-label="Close announcement"
            >
                <X className="h-4 w-4 text-primary-foreground" />
            </button>
            <div
                className="text-primary-foreground group flex items-center gap-x-2 px-4 transition-all duration-300"
            >
                <p className="text-sm">
                    <span className="font-bold mr-1">Please read!</span>
                    Value changes are paused due to the influx, thank you for your patience.
                </p>
            </div>
        </div>
    )
}