"use client";

import { useState, useEffect } from "react";
import { Plus, X, Clock } from "lucide-react";

interface ScheduleBuilderProps {
    value: string;
    onChange: (value: string) => void;
}

interface ScheduleItem {
    day: string;
    startTime: string;
    endTime: string;
}

export default function ScheduleBuilder({ value, onChange }: ScheduleBuilderProps) {
    const [items, setItems] = useState<ScheduleItem[]>([]);

    // Parse initial value if it exists (simple parsing for now)
    // This is a one-way sync for simplicity in this prototype
    useEffect(() => {
        if (!value) return;
        // Try to parse if it matches our format, otherwise leave empty to avoid overwriting custom text
        // For now, we just start fresh or let user add to it.
    }, []);

    const DAYS = ["Thứ 2", "Thứ 3", "Thứ 4", "Thứ 5", "Thứ 6", "Thứ 7", "Chủ Nhật"];
    const [newDay, setNewDay] = useState(DAYS[0]);
    const [newStart, setNewStart] = useState("07:00");
    const [newEnd, setNewEnd] = useState("09:00");

    const addItem = () => {
        const newItem = { day: newDay, startTime: newStart, endTime: newEnd };
        const newItems = [...items, newItem];
        setItems(newItems);
        updateParent(newItems);
    };

    const removeItem = (index: number) => {
        const newItems = items.filter((_, i) => i !== index);
        setItems(newItems);
        updateParent(newItems);
    };

    const updateParent = (currentItems: ScheduleItem[]) => {
        // Format: "Thứ 2 (07:00 - 09:00), Thứ 4 (07:00 - 09:00)"
        const formatted = currentItems
            .map(item => `${item.day} (${item.startTime} - ${item.endTime})`)
            .join(", ");
        onChange(formatted);
    };

    return (
        <div className="space-y-3">
            <div className="flex flex-wrap gap-2 mb-2">
                {items.map((item, index) => (
                    <div key={index} className="flex items-center gap-2 bg-primary/10 text-primary px-3 py-1.5 rounded-full text-sm font-medium border border-primary/20">
                        <span>{item.day}: {item.startTime} - {item.endTime}</span>
                        <button
                            type="button"
                            onClick={() => removeItem(index)}
                            className="hover:bg-primary/20 rounded-full p-0.5 transition-colors"
                        >
                            <X className="w-3 h-3" />
                        </button>
                    </div>
                ))}
            </div>

            <div className="flex flex-col sm:flex-row gap-2 items-end">
                <div className="flex-1 w-full sm:w-auto">
                    <label className="text-xs font-medium text-muted-foreground mb-1 block">Thứ</label>
                    <select
                        value={newDay}
                        onChange={(e) => setNewDay(e.target.value)}
                        className="w-full px-3 py-2 rounded-md border border-input bg-background text-sm"
                    >
                        {DAYS.map(d => <option key={d} value={d}>{d}</option>)}
                    </select>
                </div>
                <div className="w-full sm:w-32">
                    <label className="text-xs font-medium text-muted-foreground mb-1 block">Bắt đầu</label>
                    <input
                        type="time"
                        value={newStart}
                        onChange={(e) => setNewStart(e.target.value)}
                        className="w-full px-3 py-2 rounded-md border border-input bg-background text-sm"
                    />
                </div>
                <div className="w-full sm:w-32">
                    <label className="text-xs font-medium text-muted-foreground mb-1 block">Kết thúc</label>
                    <input
                        type="time"
                        value={newEnd}
                        onChange={(e) => setNewEnd(e.target.value)}
                        className="w-full px-3 py-2 rounded-md border border-input bg-background text-sm"
                    />
                </div>
                <button
                    type="button"
                    onClick={addItem}
                    className="w-full sm:w-auto px-4 py-2 bg-muted hover:bg-muted/80 text-foreground rounded-md text-sm font-medium transition-colors flex items-center justify-center gap-1"
                >
                    <Plus className="w-4 h-4" />
                    Thêm
                </button>
            </div>
        </div>
    );
}
