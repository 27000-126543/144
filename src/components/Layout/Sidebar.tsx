import { useState } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  LayoutDashboard,
  Sprout,
  ShoppingCart,
  ClipboardCheck,
  Award,
  FileText,
  Bell,
  Package,
  MapPin,
  FlaskConical,
  Building2,
  ShieldAlert,
  Search,
  ChevronsLeft,
  ChevronsRight,
} from 'lucide-react';
import type { UserRole } from '../../types';
import { cn } from '../../lib/utils';

interface MenuItem {
  path: string;
  label: string;
  icon: React.ElementType;
  roles: UserRole[];
}

const menuItems: MenuItem[] = [
  {
    path: 'dashboard',
    label: '工作台',
    icon: LayoutDashboard,
    roles: ['farmer', 'buyer', 'inspector', 'certifier', 'regulator'],
  },
  {
    path: 'planting',
    label: '种植管理',
    icon: Sprout,
    roles: ['farmer'],
  },
  {
    path: 'pesticide',
    label: '用药记录',
    icon: FlaskConical,
    roles: ['farmer'],
  },
  {
    path: 'trace-codes',
    label: '追溯码管理',
    icon: Search,
    roles: ['farmer'],
  },
  {
    path: 'subsidy',
    label: '补贴申请',
    icon: FileText,
    roles: ['farmer'],
  },
  {
    path: 'scan',
    label: '扫码收购',
    icon: Search,
    roles: ['buyer'],
  },
  {
    path: 'batches',
    label: '批次管理',
    icon: Package,
    roles: ['buyer'],
  },
  {
    path: 'tasks',
    label: '检测任务',
    icon: ClipboardCheck,
    roles: ['inspector'],
  },
  {
    path: 'reports',
    label: '检测报告',
    icon: FileText,
    roles: ['inspector'],
  },
  {
    path: 'reviews',
    label: '认证审核',
    icon: Building2,
    roles: ['certifier'],
  },
  {
    path: 'certificates',
    label: '证书管理',
    icon: Award,
    roles: ['certifier'],
  },
  {
    path: 'dashboard',
    label: '统计分析',
    icon: LayoutDashboard,
    roles: ['regulator'],
  },
  {
    path: 'threshold',
    label: '阈值设置',
    icon: ShieldAlert,
    roles: ['regulator'],
  },
  {
    path: 'complaints',
    label: '投诉处理',
    icon: Bell,
    roles: ['regulator'],
  },
  {
    path: 'subsidy-approval',
    label: '补贴审批',
    icon: ShoppingCart,
    roles: ['regulator'],
  },
  {
    path: 'reports',
    label: '监管报表',
    icon: FileText,
    roles: ['regulator'],
  },
];

interface SidebarProps {
  role: UserRole;
  collapsed: boolean;
  onToggle: () => void;
}

export function Sidebar({ role, collapsed, onToggle }: SidebarProps) {
  const location = useLocation();
  const [expandedItems, setExpandedItems] = useState<string[]>([]);

  const filteredMenuItems = menuItems.filter((item) => item.roles.includes(role));

  const toggleExpand = (path: string) => {
    setExpandedItems((prev) =>
      prev.includes(path) ? prev.filter((p) => p !== path) : [...prev, path]
    );
  };

  return (
    <motion.aside
      initial={false}
      animate={{ width: collapsed ? 64 : 256 }}
      className="bg-slate-900 text-white flex flex-col h-screen sticky top-0 z-40"
    >
      <div className="flex items-center justify-between h-16 px-4 border-b border-slate-700">
        <AnimatePresence mode="wait">
          {!collapsed && (
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="flex items-center gap-2"
            >
              <Sprout className="w-8 h-8 text-green-400" />
              <span className="font-bold text-lg">农溯平台</span>
            </motion.div>
          )}
        </AnimatePresence>
        <button
          onClick={onToggle}
          className="p-2 hover:bg-slate-700 rounded-lg transition-colors"
        >
          {collapsed ? (
            <ChevronsRight className="w-5 h-5" />
          ) : (
            <ChevronsLeft className="w-5 h-5" />
          )}
        </button>
      </div>

      <nav className="flex-1 py-4 overflow-y-auto">
        <ul className="space-y-1 px-3">
          {filteredMenuItems.map((item) => {
            const Icon = item.icon;
            const fullPath = `/${role}/${item.path}`;
            const isActive = location.pathname === fullPath;
            const isExpanded = expandedItems.includes(item.path);

            return (
              <li key={item.path}>
                <NavLink
                  to={fullPath}
                  onClick={() => toggleExpand(item.path)}
                  className={cn(
                    'flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200 group',
                    isActive
                      ? 'bg-green-600 text-white shadow-lg shadow-green-600/30'
                      : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                  )}
                >
                  <Icon
                    className={cn(
                      'w-5 h-5 flex-shrink-0',
                      isActive ? 'text-white' : 'text-slate-400 group-hover:text-white'
                    )}
                  />
                  <AnimatePresence mode="wait">
                    {!collapsed && (
                      <motion.span
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -10 }}
                        className="whitespace-nowrap text-sm font-medium"
                      >
                        {item.label}
                      </motion.span>
                    )}
                  </AnimatePresence>
                  {isActive && !collapsed && (
                    <motion.div
                      layoutId="activeIndicator"
                      className="ml-auto w-2 h-2 bg-white rounded-full"
                    />
                  )}
                </NavLink>
              </li>
            );
          })}
        </ul>
      </nav>

      <div className="p-4 border-t border-slate-700">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-green-400 to-green-600 flex items-center justify-center flex-shrink-0">
            <Building2 className="w-5 h-5" />
          </div>
          <AnimatePresence mode="wait">
            {!collapsed && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
              >
                <p className="text-sm font-medium">农产品追溯</p>
                <p className="text-xs text-slate-400">v1.0.0</p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </motion.aside>
  );
}
