import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Sprout,
  ShoppingCart,
  ClipboardCheck,
  Award,
  AlertTriangle,
  Package,
  FlaskConical,
  ChevronDown,
  ChevronUp,
  type LucideIcon,
} from 'lucide-react';
import type { TimelineItem } from '../../types';
import { cn } from '../../lib/utils';
import { formatDateTime, formatRelativeTime } from '../../utils/format';

interface TraceTimelineProps {
  items: TimelineItem[];
  defaultExpandAll?: boolean;
  className?: string;
}

const stageIcons: Record<string, LucideIcon> = {
  种植: Sprout,
  农药使用: FlaskConical,
  收购: ShoppingCart,
  预检: ClipboardCheck,
  检测: ClipboardCheck,
  认证: Award,
  包装: Package,
  运输: Package,
  销售: ShoppingCart,
};

const statusColors: Record<string, { dot: string; line: string; bg: string }> = {
  completed: { dot: 'bg-green-500', line: 'bg-green-300', bg: 'bg-green-100' },
  active: { dot: 'bg-blue-500', line: 'bg-blue-300', bg: 'bg-blue-100' },
  pending: { dot: 'bg-yellow-500', line: 'bg-yellow-300', bg: 'bg-yellow-100' },
  failed: { dot: 'bg-red-500', line: 'bg-red-300', bg: 'bg-red-100' },
  expired: { dot: 'bg-gray-500', line: 'bg-gray-300', bg: 'bg-gray-100' },
  warning: { dot: 'bg-amber-500', line: 'bg-amber-300', bg: 'bg-amber-100' },
};

interface TimelineItemComponentProps {
  item: TimelineItem;
  isLast: boolean;
  isExpanded: boolean;
  onToggle: () => void;
}

function TimelineItemComponent({ item, isLast, isExpanded, onToggle }: TimelineItemComponentProps) {
  const Icon = stageIcons[item.stage] || Package;
  const statusColor = statusColors[item.status] || statusColors.pending;

  return (
    <div className="relative flex gap-4">
      <div className="flex flex-col items-center">
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          className={cn(
            'w-10 h-10 rounded-full flex items-center justify-center z-10 ring-4 ring-white',
            statusColor.bg
          )}
        >
          <Icon className={cn('w-5 h-5', statusColor.dot.replace('bg-', 'text-'))} />
        </motion.div>
        {!isLast && (
          <div className={cn('w-0.5 flex-1 mt-2', statusColor.line)} />
        )}
      </div>

      <div className="flex-1 pb-8">
        <div
          onClick={onToggle}
          className="cursor-pointer group"
        >
          <div className="flex items-start justify-between">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-gray-100 text-gray-600">
                  {item.stage}
                </span>
                <h4 className="font-semibold text-gray-900 group-hover:text-green-600 transition-colors">
                  {item.title}
                </h4>
              </div>
              <div className="flex items-center gap-2 mt-1">
                <span className="text-xs text-gray-500">
                  {formatDateTime(item.timestamp)}
                </span>
                <span className="text-xs text-gray-400">·</span>
                <span className="text-xs text-gray-400">
                  {formatRelativeTime(item.timestamp)}
                </span>
              </div>
            </div>
            <motion.div
              animate={{ rotate: isExpanded ? 180 : 0 }}
              className="p-1 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <ChevronDown className="w-4 h-4 text-gray-400" />
            </motion.div>
          </div>
        </div>

        <AnimatePresence>
          {isExpanded && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.2 }}
              className="overflow-hidden"
            >
              <div className="mt-3 p-4 bg-gray-50 rounded-xl">
                <p className="text-sm text-gray-600">{item.description}</p>
                <div className="mt-3 flex items-center gap-2">
                  <div className={cn('w-2 h-2 rounded-full', statusColor.dot)} />
                  <span className="text-xs text-gray-500">
                    状态：{item.status === 'completed' ? '已完成' : 
                           item.status === 'active' ? '进行中' :
                           item.status === 'pending' ? '待处理' :
                           item.status === 'failed' ? '失败' :
                           item.status === 'expired' ? '已过期' :
                           item.status === 'warning' ? '警告' : item.status}
                  </span>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

export function TraceTimeline({ items, defaultExpandAll = false, className }: TraceTimelineProps) {
  const [expandedItems, setExpandedItems] = useState<Set<string>>(
    defaultExpandAll ? new Set(items.map((_, i) => i.toString())) : new Set()
  );

  const toggleExpand = (index: number) => {
    setExpandedItems((prev) => {
      const next = new Set(prev);
      if (next.has(index.toString())) {
        next.delete(index.toString());
      } else {
        next.add(index.toString());
      }
      return next;
    });
  };

  const toggleAll = () => {
    if (expandedItems.size === items.length) {
      setExpandedItems(new Set());
    } else {
      setExpandedItems(new Set(items.map((_, i) => i.toString())));
    }
  };

  if (items.length === 0) {
    return (
      <div className="text-center py-12">
        <AlertTriangle className="w-12 h-12 mx-auto text-gray-300 mb-3" />
        <p className="text-gray-500">暂无追溯记录</p>
      </div>
    );
  }

  return (
    <div className={cn('bg-white rounded-2xl border border-gray-200 p-6', className)}>
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-gray-900">追溯流程</h3>
        <button
          onClick={toggleAll}
          className="text-sm text-green-600 hover:text-green-700 font-medium flex items-center gap-1"
        >
          {expandedItems.size === items.length ? (
            <>
              <ChevronUp className="w-4 h-4" />
              收起全部
            </>
          ) : (
            <>
              <ChevronDown className="w-4 h-4" />
              展开全部
            </>
          )}
        </button>
      </div>
      <div className="space-y-0">
        {items.map((item, index) => (
          <TimelineItemComponent
            key={`${item.stage}-${item.timestamp}-${index}`}
            item={item}
            isLast={index === items.length - 1}
            isExpanded={expandedItems.has(index.toString())}
            onToggle={() => toggleExpand(index)}
          />
        ))}
      </div>
    </div>
  );
}
