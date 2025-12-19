"use client";

import { motion, AnimatePresence, useDragControls, DragControls } from "framer-motion";
import { ReactNode, useRef } from "react";

interface DraggableModalProps {
    isOpen: boolean;
    onClose: () => void;
    children: (dragControls: DragControls) => ReactNode;
    className?: string;
}

export function DraggableModal({ isOpen, onClose, children, className = "" }: DraggableModalProps) {
    const dragControls = useDragControls();
    const constraintsRef = useRef(null);

    return (
        <AnimatePresence>
            {isOpen && (
                <motion.div
                    ref={constraintsRef}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="fixed inset-0 z-[100] flex items-center justify-center pointer-events-none p-4"
                >
                    <motion.div
                        initial={{ y: 20, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        exit={{ y: 20, opacity: 0 }}
                        transition={{ type: "spring", damping: 25, stiffness: 300 }}
                        className={`w-full pointer-events-auto shadow-2xl rounded-2xl bg-white overflow-hidden ${className}`}
                        drag
                        dragListener={false}
                        dragControls={dragControls}
                        dragMomentum={false}
                        dragElastic={0.1}
                        dragConstraints={constraintsRef}
                    >
                        {children(dragControls)}
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );
}
