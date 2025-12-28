import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Search } from 'lucide-react';
import { WIDGET_REGISTRY, WidgetDefinition, getWidgetsByRole } from '@/config/widget-registry';
import { cn } from '@/lib/utils';

interface WidgetStoreProps {
    isOpen: boolean;
    onClose: () => void;
    onAddWidget: (widgetId: string) => void;
    userRole: 'student' | 'teacher';
    currentWidgets: string[]; // To disable already added widgets
}

export const WidgetStore = ({ isOpen, onClose, onAddWidget, userRole, currentWidgets }: WidgetStoreProps) => {
    const availableWidgets = getWidgetsByRole(userRole);

    return (
        <AnimatePresence>
            {isOpen && (
                <>
                    {/* Backdrop */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[60]"
                    />

                    {/* Modal */}
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: 20 }}
                        className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-2xl bg-white rounded-3xl shadow-2xl z-[70] overflow-hidden flex flex-col max-h-[85vh]"
                    >
                        {/* Header */}
                        <div className="p-6 border-b border-gray-100 flex items-center justify-between">
                            <div>
                                <h2 className="text-xl font-bold text-gray-800">Cửa hàng Tiện ích</h2>
                                <p className="text-sm text-gray-500">Tùy chỉnh không gian làm việc của bạn</p>
                            </div>
                            <button
                                onClick={onClose}
                                className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center hover:bg-gray-200 transition-colors"
                            >
                                <X className="w-5 h-5 text-gray-600" />
                            </button>
                        </div>

                        {/* Content */}
                        <div className="p-6 overflow-y-auto flex-1">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {availableWidgets.map((widget) => {
                                    const isAdded = currentWidgets.includes(widget.id);

                                    return (
                                        <div
                                            key={widget.id}
                                            className={cn(
                                                "flex items-start gap-4 p-4 rounded-2xl border transition-all duration-200 relative group",
                                                isAdded
                                                    ? "bg-gray-50 border-gray-200 opacity-60 cursor-not-allowed"
                                                    : "bg-white border-gray-200 hover:border-blue-300 hover:shadow-lg hover:-translate-y-0.5 cursor-pointer"
                                            )}
                                            onClick={() => !isAdded && onAddWidget(widget.id)}
                                        >
                                            <div className={cn(
                                                "w-10 h-10 rounded-xl flex items-center justify-center text-white shadow-sm flex-shrink-0",
                                                widget.color
                                            )}>
                                                <widget.icon className="w-5 h-5" />
                                            </div>
                                            <div className="flex-1">
                                                <h3 className="font-bold text-gray-800 text-sm">{widget.title}</h3>
                                                <p className="text-xs text-gray-500 mt-1 line-clamp-2">
                                                    {widget.description}
                                                </p>
                                            </div>

                                            {isAdded ? (
                                                <div className="absolute top-4 right-4 text-xs font-bold text-green-600 bg-green-100 px-2 py-0.5 rounded-full">
                                                    Đã thêm
                                                </div>
                                            ) : (
                                                <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity">
                                                    <div className="bg-blue-600 text-white text-xs font-bold px-3 py-1.5 rounded-full shadow-md">
                                                        Thêm
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
};
