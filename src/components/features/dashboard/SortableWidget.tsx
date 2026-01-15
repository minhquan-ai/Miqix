import React from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { X, GripVertical } from 'lucide-react';
import { cn } from '@/lib/utils';

interface SortableWidgetProps {
    id: string;
    children: React.ReactNode;
    onRemove: () => void;
    isEditing: boolean;
}

export const SortableWidget = ({ id, children, onRemove, isEditing }: SortableWidgetProps) => {
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging
    } = useSortable({ id });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
        zIndex: isDragging ? 10 : 1,
        opacity: isDragging ? 0.5 : 1,
    };

    return (
        <div
            ref={setNodeRef}
            style={style}
            className={cn(
                "relative group/widget transition-all",
                isEditing && "hover:bg-gray-50/50 rounded-xl"
            )}
        >
            <div className={cn(isEditing && "pointer-events-none")}>
                {children}
            </div>

            {/* Edit Controls */}
            {isEditing && (
                <>
                    {/* Drag Handle */}
                    <div
                        {...attributes}
                        {...listeners}
                        className="absolute -left-3 top-1/2 -translate-y-1/2 z-20 p-1.5 cursor-grab active:cursor-grabbing text-gray-400 hover:text-gray-600 bg-white shadow-sm border border-gray-100 rounded-lg opacity-100 transition-opacity"
                        title="Kéo để sắp xếp"
                    >
                        <GripVertical className="w-4 h-4" />
                    </div>

                    {/* Remove Button */}
                    <button
                        onClick={(e) => {
                            e.stopPropagation();
                            onRemove();
                        }}
                        className="absolute -top-2 -right-2 z-20 w-6 h-6 bg-red-500 hover:bg-red-600 text-white rounded-full flex items-center justify-center opacity-100 shadow-md transform hover:scale-110 transition-all border-2 border-white"
                        title="Xóa tiện ích"
                        aria-label="Xóa tiện ích"
                    >
                        <X className="w-3.5 h-3.5" />
                    </button>

                    {/* Edit Overlay (to prevent interaction with widget content while editing) */}
                    <div className="absolute inset-0 z-10 bg-transparent" />
                </>
            )}
        </div>
    );
};
