"use client";

import React from 'react';
import { motion } from 'framer-motion';
import { Clock, Tag, ChevronRight, CheckCircle2 } from 'lucide-react';

interface MissionCardProps {
    title: string;
    subject: string;
    dueDate: string;
    status: 'pending' | 'completed' | 'urgent';
}

export const MissionCard: React.FC<MissionCardProps> = ({
    title,
    subject,
    dueDate,
    status
}) => {
    const statusStyles = {
        pending: 'bg-blue-50 text-blue-600 border-blue-100',
        completed: 'bg-green-50 text-green-600 border-green-100',
        urgent: 'bg-red-50 text-red-600 border-red-100',
    };

    const statusLabels = {
        pending: 'Đang chờ',
        completed: 'Hoàn thành',
        urgent: 'Gấp',
    };

    return (
        <motion.div
            whileHover={{ y: -5 }}
            className="bg-white border border-gray-100 rounded-2xl p-6 shadow-sm hover:shadow-md hover:border-blue-200 transition-all h-full flex flex-col group relative overflow-hidden cursor-pointer"
        >
            {/* Hover Accent */}
            <div className="absolute top-0 left-0 w-1 h-full bg-blue-600 transform -translate-x-full group-hover:translate-x-0 transition-transform duration-300" />

            <div className="flex justify-between items-start mb-4">
                <div className="w-12 h-12 rounded-xl flex items-center justify-center font-bold bg-blue-50 text-blue-600 group-hover:scale-105 transition-transform">
                    <Tag size={24} />
                </div>

                <div className="flex gap-1">
                    <span className={`text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full border ${statusStyles[status]}`}>
                        {statusLabels[status]}
                    </span>
                </div>
            </div>

            <h3 className="font-bold text-lg mb-2 text-gray-900 group-hover:text-blue-600 transition-colors line-clamp-1">{title}</h3>
            <p className="text-sm text-gray-500 mb-6 line-clamp-2 flex-1">{subject} - Nhiệm vụ quan trọng cần thực hiện để nắm vững kiến thức.</p>

            <div className="pt-4 border-t border-gray-50 flex items-center justify-between text-xs text-gray-500 font-medium">
                <span className="flex items-center gap-1.5 bg-gray-50 px-2 py-1 rounded-md">
                    <Clock size={14} />
                    {dueDate}
                </span>
                {status === 'completed' ? (
                    <span className="text-green-600 font-bold flex items-center gap-1">
                        <CheckCircle2 size={14} /> Hoàn thành
                    </span>
                ) : (
                    <span className="flex items-center gap-1 group-hover:translate-x-1 transition-transform text-blue-600 font-bold">
                        Bắt đầu ngay <ChevronRight size={14} />
                    </span>
                )}
            </div>
        </motion.div>
    );
};
