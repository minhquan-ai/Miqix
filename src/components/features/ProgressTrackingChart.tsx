"use client";

import React, { useState } from 'react';
import { motion } from 'framer-motion';

interface DataPoint {
    date: string;
    score: number;
    title: string;
}

interface ProgressTrackingChartProps {
    data: DataPoint[];
    height?: number;
    color?: string;
}

export function ProgressTrackingChart({ data, height = 200, color = "#6366f1" }: ProgressTrackingChartProps) {
    const [hoveredPoint, setHoveredPoint] = useState<number | null>(null);

    if (!data || data.length < 2) {
        return (
            <div className="flex items-center justify-center h-full text-muted-foreground text-sm">
                Cần ít nhất 2 bài tập để hiển thị biểu đồ tiến độ.
            </div>
        );
    }

    // Sort data by date just in case
    const sortedData = [...data].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    // Dimensions
    const padding = 20;
    const chartHeight = height - padding * 2;

    // Scales
    const maxScore = 10;
    const minScore = 0;

    const getX = (index: number) => {
        return (index / (sortedData.length - 1)) * 100;
    };

    const getY = (score: number) => {
        return 100 - ((score - minScore) / (maxScore - minScore)) * 100;
    };

    // Generate path
    const points = sortedData.map((point, index) => {
        const x = getX(index);
        const y = getY(point.score);
        return `${x},${y}`;
    }).join(' ');

    // Generate area path (for gradient fill)
    const areaPoints = `0,100 ${points} 100,100`;

    return (
        <div className="w-full relative" style={{ height }}>
            {/* Y-Axis Labels */}
            <div className="absolute left-0 top-0 bottom-0 flex flex-col justify-between text-xs text-muted-foreground pointer-events-none py-5 pr-2 h-full">
                <span>10</span>
                <span>5</span>
                <span>0</span>
            </div>

            <div className="ml-6 h-full relative">
                <svg
                    viewBox="0 0 100 100"
                    preserveAspectRatio="none"
                    className="w-full h-full overflow-visible"
                >
                    {/* Grid Lines */}
                    <line x1="0" y1="0" x2="100" y2="0" stroke="currentColor" strokeOpacity="0.1" strokeDasharray="2" vectorEffect="non-scaling-stroke" />
                    <line x1="0" y1="50" x2="100" y2="50" stroke="currentColor" strokeOpacity="0.1" strokeDasharray="2" vectorEffect="non-scaling-stroke" />
                    <line x1="0" y1="100" x2="100" y2="100" stroke="currentColor" strokeOpacity="0.1" strokeDasharray="2" vectorEffect="non-scaling-stroke" />

                    {/* Area Fill */}
                    <defs>
                        <linearGradient id="chartGradient" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor={color} stopOpacity="0.2" />
                            <stop offset="100%" stopColor={color} stopOpacity="0" />
                        </linearGradient>
                    </defs>
                    <path
                        d={`M ${areaPoints}`}
                        fill="url(#chartGradient)"
                        stroke="none"
                    />

                    {/* Line */}
                    <motion.path
                        d={`M ${points}`}
                        fill="none"
                        stroke={color}
                        strokeWidth="2"
                        vectorEffect="non-scaling-stroke"
                        initial={{ pathLength: 0 }}
                        animate={{ pathLength: 1 }}
                        transition={{ duration: 1.5, ease: "easeInOut" }}
                    />

                    {/* Data Points */}
                    {sortedData.map((point, index) => {
                        const x = getX(index);
                        const y = getY(point.score);
                        return (
                            <g key={index}>
                                <circle
                                    cx={x}
                                    cy={y}
                                    r="1.5" // logical radius, will be scaled
                                    fill="white"
                                    stroke={color}
                                    strokeWidth="0.5"
                                    className="cursor-pointer hover:r-2 transition-all duration-200"
                                    onMouseEnter={() => setHoveredPoint(index)}
                                    onMouseLeave={() => setHoveredPoint(null)}
                                    vectorEffect="non-scaling-stroke" // Keeps stroke width constant
                                />
                                {/* Invisible larger target for easier hovering */}
                                <circle
                                    cx={x}
                                    cy={y}
                                    r="5"
                                    fill="transparent"
                                    className="cursor-pointer"
                                    onMouseEnter={() => setHoveredPoint(index)}
                                    onMouseLeave={() => setHoveredPoint(null)}
                                    vectorEffect="non-scaling-stroke"
                                />
                            </g>
                        );
                    })}
                </svg>

                {/* Tooltip */}
                {hoveredPoint !== null && (
                    <div
                        className="absolute bg-popover text-popover-foreground text-xs rounded-lg shadow-lg p-2 border border-border pointer-events-none z-10 whitespace-nowrap"
                        style={{
                            left: `${getX(hoveredPoint)}%`,
                            top: `${getY(sortedData[hoveredPoint].score)}%`,
                            transform: 'translate(-50%, -120%)'
                        }}
                    >
                        <div className="font-bold">{sortedData[hoveredPoint].score}/10</div>
                        <div className="text-muted-foreground">{sortedData[hoveredPoint].title}</div>
                        <div className="text-[10px] opacity-70">{new Date(sortedData[hoveredPoint].date).toLocaleDateString('vi-VN')}</div>
                    </div>
                )}
            </div>
        </div>
    );
}
