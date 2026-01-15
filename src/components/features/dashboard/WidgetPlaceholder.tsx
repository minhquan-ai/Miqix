import React from 'react';
import { Plus } from 'lucide-react';

interface WidgetPlaceholderProps {
    onClick: () => void;
}

export const WidgetPlaceholder = ({ onClick }: WidgetPlaceholderProps) => {
    return (
        <button
            onClick={onClick}
            className="w-full h-24 border-2 border-dashed border-gray-200 rounded-2xl flex flex-col items-center justify-center gap-2 text-gray-400 hover:border-blue-400 hover:text-blue-500 hover:bg-blue-50/50 transition-all duration-300 group"
        >
            <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center group-hover:bg-blue-100 transition-colors">
                <Plus className="w-5 h-5" />
            </div>
            <span className="text-xs font-medium">Thêm tiện ích</span>
        </button>
    );
};
