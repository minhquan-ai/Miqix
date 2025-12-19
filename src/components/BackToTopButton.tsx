"use client";

import { useState, useEffect } from "react";
import { ChevronUp } from "lucide-react";

export default function BackToTopButton() {
    const [isVisible, setIsVisible] = useState(false);

    useEffect(() => {
        const toggleVisibility = () => {
            // Show button when page is scrolled down 300px
            setIsVisible(window.pageYOffset > 300);
        };

        window.addEventListener('scroll', toggleVisibility);
        return () => window.removeEventListener('scroll', toggleVisibility);
    }, []);

    const scrollToTop = () => {
        window.scrollTo({
            top: 0,
            behavior: 'smooth'
        });
    };

    if (!isVisible) return null;

    return (
        <button
            onClick={scrollToTop}
            className="fixed bottom-6 right-6 p-4 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-full shadow-2xl hover:shadow-blue-500/50 hover:scale-110 active:scale-95 transition-all duration-300 z-50 group"
            aria-label="Về đầu trang"
        >
            <ChevronUp className="w-6 h-6 group-hover:animate-bounce" />
        </button>
    );
}
