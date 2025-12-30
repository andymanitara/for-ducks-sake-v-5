import React from 'react';
import { cn } from '@/lib/utils';
interface StatTileProps {
    icon: React.ElementType;
    label: string;
    value: string;
    color: 'yellow' | 'blue' | 'green' | 'purple' | 'orange' | 'red';
}
export function StatTile({ icon: Icon, label, value, color }: StatTileProps) {
    const styles = {
        yellow: {
            iconBg: "bg-yellow-50",
            iconBorder: "border-yellow-200",
            iconText: "text-yellow-600",
            cardBorder: "border-yellow-200"
        },
        blue: {
            iconBg: "bg-blue-50",
            iconBorder: "border-blue-200",
            iconText: "text-blue-600",
            cardBorder: "border-blue-200"
        },
        green: {
            iconBg: "bg-green-50",
            iconBorder: "border-green-200",
            iconText: "text-green-600",
            cardBorder: "border-green-200"
        },
        purple: {
            iconBg: "bg-purple-50",
            iconBorder: "border-purple-200",
            iconText: "text-purple-600",
            cardBorder: "border-purple-200"
        },
        orange: {
            iconBg: "bg-orange-50",
            iconBorder: "border-orange-200",
            iconText: "text-orange-600",
            cardBorder: "border-orange-200"
        },
        red: {
            iconBg: "bg-red-50",
            iconBorder: "border-red-200",
            iconText: "text-red-600",
            cardBorder: "border-red-200"
        },
    };
    const currentStyle = styles[color];
    return (
        <div className={cn("p-3 rounded-xl border-2 flex flex-col items-center justify-center text-center bg-white", currentStyle.cardBorder)}>
            <div className={cn("mb-1 p-1.5 rounded-lg border", currentStyle.iconBg, currentStyle.iconBorder, currentStyle.iconText)}>
                <Icon className="w-4 h-4" />
            </div>
            <div className="text-[10px] font-black uppercase tracking-wider text-gray-400 mb-0.5">{label}</div>
            <div className="text-lg font-black text-gray-800 leading-none">{value}</div>
        </div>
    );
}