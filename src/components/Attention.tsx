"use client"

import { ArrowRight, X } from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';

export default function Attention() {
    const [isVisible, setIsVisible] = useState<boolean | undefined>(undefined);
    const pathname = usePathname();
    
    useEffect(() => {
        const dismissed = localStorage.getItem('attentionDismissed');
        setIsVisible(dismissed !== 'true' && pathname !== '/blog/ceasing-operations');
    }, [pathname]);

    const handleDismiss = () => {
        setIsVisible(false);
        localStorage.setItem('attentionDismissed', 'true');
    };

    if (isVisible === null || !isVisible) return null;

    return (
        <div className="w-full h-8 bg-primary striped flex items-center relative">
            <button
                onClick={handleDismiss}
                className="absolute right-2 z-20 opacity-50 hover:opacity-100 transition-opacity"
                aria-label="Close announcement"
            >
                <X className="h-4 w-4 text-primary-foreground" />
            </button>
            <Link
                href="/blog/ceasing-operations" 
                className="text-primary-foreground group flex items-center gap-x-2 px-3 transition-all duration-300"
            >
                <p className="text-sm">
                    <span className="font-bold mr-1">Please read!</span>
                    We are ceasing operations as of February 27, 2025, read the blog post here
                </p>
                <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform duration-300" />
            </Link>
        </div>
    )
}