
import React from 'react';
import { Clock, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { vi } from 'date-fns/locale';

interface MiniScheduleWidgetProps {
    classes: any[];
}

export const MiniScheduleWidget = ({ classes }: MiniScheduleWidgetProps) => {
    const todayClasses = classes.slice(0, 2); // Show max 2 items to keep compact

    return (
        <div className="bg-white rounded-2xl border border-gray-200 p-3 shadow-md">
            <div className="mb-2 flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <div className="w-1 h-4 bg-blue-500 rounded-full" />
                    <h3 className="font-bold text-gray-800 text-xs tracking-tight">Lịch dạy hôm nay</h3>
                </div>
                <span className="text-[9px] font-bold text-gray-500 bg-gray-100 px-1.5 py-0.5 rounded-full">
                    {format(new Date(), 'dd/MM', { locale: vi })}
                </span>
            </div>

            <div className="space-y-1.5">
                {todayClasses.length > 0 ? (
                    <>
                        {todayClasses.map((cls) => (
                            <div
                                key={cls.id}
                                className="flex items-center gap-2 p-2 rounded-lg hover:bg-blue-50 cursor-pointer group transition-colors"
                            >
                                <div className="w-1.5 h-1.5 rounded-full bg-blue-500 flex-shrink-0" />
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center justify-between gap-2">
                                        <span className="text-[10px] font-medium text-gray-500">08:00</span>
                                        <span className="text-[9px] text-gray-400">P.302</span>
                                    </div>
                                    <p className="text-xs font-semibold text-gray-800 truncate group-hover:text-blue-600">
                                        {cls.name}
                                    </p>
                                </div>
                                <ChevronRight className="w-3 h-3 text-gray-300 group-hover:text-blue-500" />
                            </div>
                        ))}
                        {classes.length > 2 && (
                            <button className="w-full text-[10px] text-blue-600 hover:text-blue-700 font-medium py-1 flex items-center justify-center gap-0.5 hover:bg-blue-50 rounded-lg transition-colors">
                                +{classes.length - 2} lịch khác
                                <ChevronRight className="w-3 h-3" />
                            </button>
                        )}
                    </>
                ) : (
                    <div className="flex items-center justify-center py-3 text-center opacity-60">
                        <Clock className="w-4 h-4 text-gray-300 mr-2" />
                        <p className="text-[10px] text-gray-500">Không có lịch hôm nay</p>
                    </div>
                )}
            </div>
        </div>
    );
};
