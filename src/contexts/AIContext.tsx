"use client";

import React, { createContext, useContext, useState, ReactNode } from "react";

interface AIContextType {
    isCanvasOpen: boolean;
    setCanvasOpen: (isOpen: boolean) => void;
    toggleCanvas: () => void;
    isAIPanelOpen: boolean;
    setAIPanelOpen: (isOpen: boolean) => void;
}

const AIContext = createContext<AIContextType | undefined>(undefined);

export function AIProvider({ children }: { children: ReactNode }) {
    const [isCanvasOpen, setCanvasOpen] = useState(false);
    const [isAIPanelOpen, setAIPanelOpen] = useState(false);

    const toggleCanvas = () => setCanvasOpen((prev) => !prev);

    return (
        <AIContext.Provider value={{ isCanvasOpen, setCanvasOpen, toggleCanvas, isAIPanelOpen, setAIPanelOpen }}>
            {children}
        </AIContext.Provider>
    );
}

export function useAIContext() {
    const context = useContext(AIContext);
    if (context === undefined) {
        throw new Error("useAIContext must be used within an AIProvider");
    }
    return context;
}
