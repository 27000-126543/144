import { cn } from '../../lib/utils';
import { statusColors as defaultStatusColors } from '../../types';
import { formatStatus } from '../../utils/format';

interface StatusBadgeProps {
  status: string;
  customColors?: Record<string, string>;
  size?: 'sm' | 'md' | 'lg';
  withDot?: boolean;
  label?: string;
  className?: string;
}

const sizeStyles: Record<string, string> = {
  sm: 'px-2 py-0.5 text-xs',
  md: 'px-2.5 py-1 text-xs',
  lg: 'px-3 py-1.5 text-sm',
};

export function StatusBadge({
  status,
  customColors,
  size = 'md',
  withDot = true,
  label,
  className,
}: StatusBadgeProps) {
  const colors = customColors || defaultStatusColors;
  const colorClass = colors[status] || 'bg-gray-100 text-gray-800';
  const displayLabel = label || formatStatus(status);

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 font-medium rounded-full',
        sizeStyles[size],
        colorClass,
        className
      )}
    >
      {withDot && <span className={cn('w-1.5 h-1.5 rounded-full', getDotColor(colorClass))} />}
      {displayLabel}
    </span>
  );
}

function getDotColor(bgClass: string): string {
  if (bgClass.includes('green')) return 'bg-green-500';
  if (bgClass.includes('red')) return 'bg-red-500';
  if (bgClass.includes('yellow')) return 'bg-yellow-500';
  if (bgClass.includes('blue')) return 'bg-blue-500';
  if (bgClass.includes('amber')) return 'bg-amber-500';
  if (bgClass.includes('gray')) return 'bg-gray-500';
  return 'bg-gray-400';
}
