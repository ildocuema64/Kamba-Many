import React from 'react';
import Card from '@/components/ui/Card';

interface StatsCardProps {
    title: string;
    value: string | number;
    change?: string;
    icon: React.ReactNode;
    colorClass: string;
    bgClass: string;
}

const StatsCard: React.FC<StatsCardProps> = ({ title, value, change, icon, colorClass, bgClass }) => (
    <Card className="hover:shadow-lg transition-shadow">
        <div className="flex items-center justify-between">
            <div>
                <p className="text-sm text-gray-600 mb-1">{title}</p>
                <p className="text-2xl font-bold text-gray-900">{value}</p>
                {change && <p className="text-xs text-gray-500 mt-1">{change}</p>}
            </div>
            <div className={`${bgClass} ${colorClass} p-3 rounded-lg`}>
                {icon}
            </div>
        </div>
    </Card>
);

export default StatsCard;
