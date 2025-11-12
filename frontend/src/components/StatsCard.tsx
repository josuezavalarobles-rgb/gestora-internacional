import { LucideIcon } from 'lucide-react';

interface StatsCardProps {
  title: string;
  value: string | number;
  icon: LucideIcon;
  iconColor: string;
  iconBgColor: string;
  gradient?: string;
  glowClass?: string;
  trend?: {
    value: string;
    isPositive: boolean;
  };
}

export default function StatsCard({
  title,
  value,
  icon: Icon,
  iconColor,
  iconBgColor,
  gradient,
  glowClass,
  trend,
}: StatsCardProps) {
  return (
    <div className={`${gradient || 'bg-gradient-to-br from-gray-800 to-gray-900'} rounded-xl shadow-2xl p-6 hover:scale-105 transition-all ${glowClass || ''}`}>
      <div className="flex items-center justify-between mb-4">
        <div className={`${iconBgColor || 'bg-white bg-opacity-20'} p-3 rounded-lg backdrop-blur-sm`}>
          <Icon className={iconColor || 'text-white'} size={28} />
        </div>
      </div>
      <div>
        <p className="text-sm font-medium text-gray-200 mb-2 uppercase tracking-wide">{title}</p>
        <p className="text-6xl font-bold text-white mb-1">{value}</p>
        {trend && (
          <p
            className={`text-sm mt-2 ${
              trend.isPositive ? 'text-green-300' : 'text-red-300'
            }`}
          >
            {trend.isPositive ? '+' : '-'}{trend.value}
          </p>
        )}
      </div>
    </div>
  );
}
