import { Mission } from "@/types";
import { CheckCircle, Circle, Clock, Loader2 } from "lucide-react";
import { useState } from "react";

interface MissionStatusSelectorProps {
    mission: Mission;
    readOnly?: boolean;
    disabled?: boolean;
    onChange?: (status: Mission['status']) => void;
}

export function MissionStatusSelector({ mission, readOnly, disabled, onChange }: MissionStatusSelectorProps) {
    const [isOpen, setIsOpen] = useState(false);

    const statusConfig = {
        pending: { label: 'Chưa bắt đầu', icon: Circle, color: 'text-gray-500', bg: 'bg-gray-100' },
        in_progress: { label: 'Đang thực hiện', icon: Clock, color: 'text-blue-500', bg: 'bg-blue-100' },
        completed: { label: 'Hoàn thành', icon: CheckCircle, color: 'text-green-500', bg: 'bg-green-100' },
    };

    const currentConfig = statusConfig[mission.status] || statusConfig.pending;
    const Icon = currentConfig.icon;

    if (readOnly) {
        return (
            <div className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium ${currentConfig.bg} ${currentConfig.color}`}>
                <Icon className="w-4 h-4" />
                <span>{currentConfig.label}</span>
            </div>
        );
    }

    return (
        <div className="relative">
            <button
                onClick={() => !disabled && setIsOpen(!isOpen)}
                disabled={disabled}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${currentConfig.bg} ${currentConfig.color} ${disabled ? 'opacity-50 cursor-not-allowed' : 'hover:opacity-80'
                    }`}
            >
                {disabled ? <Loader2 className="w-4 h-4 animate-spin" /> : <Icon className="w-4 h-4" />}
                <span>{currentConfig.label}</span>
            </button>

            {isOpen && !disabled && (
                <>
                    <div
                        className="fixed inset-0 z-40"
                        onClick={() => setIsOpen(false)}
                    />
                    <div className="absolute right-0 mt-2 w-48 bg-white rounded-xl shadow-lg border border-gray-100 py-1 z-50 animate-in fade-in zoom-in-95 duration-200">
                        {(Object.keys(statusConfig) as Array<Mission['status']>).map((status) => {
                            const config = statusConfig[status];
                            const StatusIcon = config.icon;
                            const isSelected = mission.status === status;

                            return (
                                <button
                                    key={status}
                                    onClick={() => {
                                        onChange?.(status);
                                        setIsOpen(false);
                                    }}
                                    className={`w-full flex items-center gap-2 px-4 py-2 text-sm hover:bg-gray-50 transition-colors ${isSelected ? 'text-primary font-medium bg-primary/5' : 'text-gray-600'
                                        }`}
                                >
                                    <StatusIcon className={`w-4 h-4 ${config.color}`} />
                                    <span>{config.label}</span>
                                    {isSelected && <CheckCircle className="w-3 h-3 ml-auto text-primary" />}
                                </button>
                            );
                        })}
                    </div>
                </>
            )}
        </div>
    );
}
