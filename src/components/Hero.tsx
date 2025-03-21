import Image from "next/image";
import { useEffect, useState } from "react";

export default function Hero() {
    const [isVisible, setIsVisible] = useState<boolean | undefined>(undefined);

    useEffect(() => {
        const dismissed = localStorage.getItem('heroBoxDismissed');
        setIsVisible(dismissed !== 'true');
    }, []);

    const handleDismiss = () => {
        setIsVisible(false);
        localStorage.setItem('heroBoxDismissed', 'true');
    };

    if (isVisible === null || !isVisible) return null;

    return (
        <div className="flex flex-col justify-center p-4 bg-primary min-h-[9rem] rounded-md relative overflow-hidden">
            <button
                onClick={handleDismiss}
                className="absolute top-2 right-2 z-20 opacity-50 hover:opacity-100 transition-opacity"
                aria-label="Close welcome message"
            >
                <svg 
                    xmlns="http://www.w3.org/2000/svg" 
                    width="16" 
                    height="16" 
                    viewBox="0 0 24 24" 
                    fill="none" 
                    stroke="currentColor" 
                    strokeWidth="2"
                    strokeLinecap="round" 
                    strokeLinejoin="round"
                >
                    <line x1="18" y1="6" x2="6" y2="18"></line>
                    <line x1="6" y1="6" x2="18" y2="18"></line>
                </svg>
            </button>
            <div 
                className="absolute inset-0 opacity-50"
                style={{
                    backgroundImage: `radial-gradient(circle at center, rgba(255, 255, 255, 0.5) 0, rgba(255, 255, 255, 0.5) 1px, transparent 1px)`,
                    backgroundSize: '10px 10px',
                    WebkitMaskImage: 'linear-gradient(to right, transparent, black 20%, black 80%, transparent)',
                    maskImage: 'linear-gradient(to right, transparent, black 20%, black 80%, transparent)'
                }}
            />
            <div className="z-10 flex flex-col sm:flex-row items-center gap-4 justify-between">
                <div className="text-center sm:text-left">
                    <h1 className="text-xl sm:text-2xl font-bold text-white">Welcome to LOVE!</h1>
                    <p className="text-sm text-white/75 max-w-96">
                        Here you&apos;ll find the most reliable information for trading collectables on Polytoria
                    </p>
                </div>
                <div className="flex">
                    <Image
                        src="/icon-white.svg"
                        alt="LOVE Icon"
                        width={75}
                        height={75}
                        className="drop-shadow-lg filter hover:animate-heartbeat w-16 sm:w-[75px] h-auto mr-0 sm:mr-4"
                    />
                </div>
            </div>
        </div>
    );
}