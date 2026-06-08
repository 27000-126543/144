import { useEffect, useState, useRef } from 'react';
import { motion } from 'framer-motion';
import { TrendingUp, TrendingDown, type LucideIcon } from 'lucide-react';
import { cn } from '../../lib/utils';
import { formatNumber, formatPercentage } from '../../utils/format';

type ColorTheme = 'green' | 'blue' | 'amber' | 'red' | 'purple';

interface DataCardProps {
  title: string;
  value: number;
  icon: LucideIcon;
  trend?: number;
  prefix?: string;
  suffix?: string;
  decimals?: number;
  isPercentage?: boolean;
  theme?: ColorTheme;
  showAnimation?: boolean;
  onClick?: () => void;
  className?: string;
}

const themeStyles: Record<ColorTheme, {
  bg: string;
  iconBg: string;
  iconColor: string;
  border: string;
  text: string;
}> = {
  green: {
    bg: 'bg-white',
    iconBg: 'bg-green-100',
    iconColor: 'text-green-600',
    border: 'border-green-200',
    text: 'text-green-600',
  },
  blue: {
    bg: 'bg-white',
    iconBg: 'bg-blue-100',
    iconColor: 'text-blue-600',
    border: 'border-blue-200',
    text: 'text-blue-600',
  },
  amber: {
    bg: 'bg-white',
    iconBg: 'bg-amber-100',
    iconColor: 'text-amber-600',
    border: 'border-amber-200',
    text: 'text-amber-600',
  },
  red: {
    bg: 'bg-white',
    iconBg: 'bg-red-100',
    iconColor: 'text-red-600',
    border: 'border-red-200',
    text: 'text-red-600',
  },
  purple: {
    bg: 'bg-white',
    iconBg: 'bg-purple-100',
    iconColor: 'text-purple-600',
    border: 'border-purple-200',
    text: 'text-purple-600',
  },
};

export function DataCard({
  title,
  value,
  icon: Icon,
  trend,
  prefix = '',
  suffix = '',
  decimals = 2,
  isPercentage = false,
  theme = 'green',
  showAnimation = true,
  onClick,
  className,
}: DataCardProps) {
  const [displayValue, setDisplayValue] = useState(0);
  const previousValue = useRef(0);
  const styles = themeStyles[theme];

  useEffect(() => {
    if (!showAnimation) {
      setDisplayValue(value);
      previousValue.current = value;
      return;
    }

    const startValue = previousValue.current;
    const endValue = value;
    const duration = 1500;
    const startTime = performance.now();

    const animate = (currentTime: number) => {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const easeProgress = 1 - Math.pow(1 - progress, 3);
      const currentValue = startValue + (endValue - startValue) * easeProgress;
      setDisplayValue(currentValue);

      if (progress < 1) {
        requestAnimationFrame(animate);
      } else {
        setDisplayValue(endValue);
        previousValue.current = endValue;
      }
    };

    requestAnimationFrame(animate);
  }, [value, showAnimation]);

  const formattedValue = isPercentage
    ? formatPercentage(displayValue, decimals)
    : formatNumber(displayValue, decimals);

  const trendPositive = trend !== undefined && trend >= 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={onClick ? { scale: 1.02, y: -2 } : {}}
      onClick={onClick}
      className={cn(
        'p-6 rounded-2xl border shadow-sm transition-all duration-200',
        styles.bg,
        styles.border,
        onClick && 'cursor-pointer hover:shadow-lg',
        className
      )}
    >
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <p className="text-sm text-gray-500 font-medium">{title}</p>
          <p className="mt-2 text-3xl font-bold text-gray-900">
            {prefix}
            {formattedValue}
            {suffix}
          </p>
          {trend !== undefined && (
            <div className="mt-3 flex items-center gap-1">
              {trendPositive ? (
                <TrendingUp className="w-4 h-4 text-green-500" />
              ) : (
                <TrendingDown className="w-4 h-4 text-red-500" />
              )}
              <span
                className={cn(
                  'text-sm font-medium',
                  trendPositive ? 'text-green-600' : 'text-red-600'
                )}
              >
                {trendPositive ? '+' : ''}
                {formatNumber(trend, decimals)}
                {isPercentage ? '%' : ''}
              </span>
              <span className="text-xs text-gray-400 ml-1">较上期</span>
            </div>
          )}
        </div>
        <div
          className={cn(
            'w-14 h-14 rounded-xl flex items-center justify-center',
            styles.iconBg
          )}
        >
          <Icon className={cn('w-7 h-7', styles.iconColor)} />
        </div>
      </div>
    </motion.div>
  );
}
