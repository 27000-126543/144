import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Bell,
  User,
  LogOut,
  ChevronDown,
  Settings,
  Users,
  Menu,
  X,
} from 'lucide-react';
import { useAuthStore } from '../../store/authStore';
import { useMessageStore } from '../../store/messageStore';
import { roleLabels, type UserRole } from '../../types';
import { cn } from '../../lib/utils';

interface HeaderProps {
  onMenuToggle?: () => void;
}

export function Header({ onMenuToggle }: HeaderProps) {
  const navigate = useNavigate();
  const { user, logout } = useAuthStore();
  const { unreadCount, fetchMessages, markAsRead, messages, getUnreadCount, markAllAsRead } = useMessageStore();
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showRoleSwitcher, setShowRoleSwitcher] = useState(false);
  const userMenuRef = useRef<HTMLDivElement>(null);
  const notificationRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (user) {
      fetchMessages({ userId: user.id, isRead: false, page: 1, pageSize: 5 });
      getUnreadCount(user.id);
    }
  }, [user, fetchMessages, getUnreadCount]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (userMenuRef.current && !userMenuRef.current.contains(event.target as Node)) {
        setShowUserMenu(false);
      }
      if (notificationRef.current && !notificationRef.current.contains(event.target as Node)) {
        setShowNotifications(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const handleRoleSwitch = (role: UserRole) => {
    setShowRoleSwitcher(false);
    setShowUserMenu(false);
    logout();
    navigate('/login', { state: { defaultRole: role } });
  };

  const handleMessageClick = (messageId: string) => {
    markAsRead(messageId);
  };

  const availableRoles: UserRole[] = ['farmer', 'buyer', 'inspector', 'certifier', 'regulator', 'consumer'];

  return (
    <header className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-4 lg:px-6 sticky top-0 z-30">
      <div className="flex items-center gap-4">
        <button
          onClick={onMenuToggle}
          className="lg:hidden p-2 hover:bg-gray-100 rounded-lg transition-colors"
        >
          <Menu className="w-5 h-5 text-gray-600" />
        </button>
        <div>
          <h1 className="text-lg font-semibold text-gray-900">
            {user ? `${roleLabels[user.role]}工作台` : '欢迎使用'}
          </h1>
          <p className="text-xs text-gray-500">
            {new Date().toLocaleDateString('zh-CN', {
              year: 'numeric',
              month: 'long',
              day: 'numeric',
              weekday: 'long',
            })}
          </p>
        </div>
      </div>

      <div className="flex items-center gap-2 lg:gap-4">
        <div className="relative" ref={notificationRef}>
          <button
            onClick={() => setShowNotifications(!showNotifications)}
            className="relative p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <Bell className="w-5 h-5 text-gray-600" />
            {unreadCount > 0 && (
              <motion.span
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                className="absolute top-1 right-1 w-4 h-4 bg-red-500 text-white text-xs rounded-full flex items-center justify-center"
              >
                {unreadCount > 99 ? '99+' : unreadCount}
              </motion.span>
            )}
          </button>

          <AnimatePresence>
            {showNotifications && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="absolute right-0 mt-2 w-80 bg-white rounded-xl shadow-xl border border-gray-200 overflow-hidden"
              >
                <div className="p-4 border-b border-gray-100 flex items-center justify-between">
                  <h3 className="font-semibold text-gray-900">消息通知</h3>
                  <div className="flex items-center gap-3">
                    <span className="text-xs text-gray-500">{unreadCount} 条未读</span>
                    {unreadCount > 0 && (
                      <button
                        onClick={async () => {
                          if (user?.id) {
                            await markAllAsRead(user.id);
                            await getUnreadCount(user.id);
                          }
                        }}
                        className="text-xs text-green-600 hover:text-green-700 font-medium"
                      >
                        全部已读
                      </button>
                    )}
                  </div>
                </div>
                <div className="max-h-80 overflow-y-auto">
                  {messages.length === 0 ? (
                    <div className="p-8 text-center text-gray-500">
                      <Bell className="w-12 h-12 mx-auto mb-2 text-gray-300" />
                      <p>暂无消息</p>
                    </div>
                  ) : (
                    <ul>
                      {messages.map((message) => (
                        <li key={message.id}>
                          <button
                            onClick={() => handleMessageClick(message.id)}
                            className={cn(
                              'w-full p-4 text-left hover:bg-gray-50 transition-colors border-b border-gray-50',
                              !message.isRead && 'bg-blue-50/50'
                            )}
                          >
                            <div className="flex items-start gap-3">
                              <div
                                className={cn(
                                  'w-2 h-2 mt-2 rounded-full flex-shrink-0',
                                  message.isRead ? 'bg-gray-300' : 'bg-blue-500'
                                )}
                              />
                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium text-gray-900 truncate">
                                  {message.title}
                                </p>
                                <p className="text-xs text-gray-500 mt-1 line-clamp-2">
                                  {message.content}
                                </p>
                                <p className="text-xs text-gray-400 mt-1">
                                  {new Date(message.createdAt).toLocaleString('zh-CN')}
                                </p>
                              </div>
                            </div>
                          </button>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
                <div className="p-3 border-t border-gray-100">
                  <button
                    onClick={() => navigate('/messages')}
                    className="w-full py-2 text-sm text-green-600 hover:text-green-700 font-medium"
                  >
                    查看全部消息
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <div className="relative" ref={userMenuRef}>
          <button
            onClick={() => setShowUserMenu(!showUserMenu)}
            className="flex items-center gap-2 lg:gap-3 p-1.5 lg:p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <div className="w-8 h-8 lg:w-9 lg:h-9 rounded-full bg-gradient-to-br from-green-400 to-green-600 flex items-center justify-center">
              <User className="w-4 h-4 lg:w-5 lg:h-5 text-white" />
            </div>
            <div className="hidden lg:block text-left">
              <p className="text-sm font-medium text-gray-900">{user?.name || '用户'}</p>
              <p className="text-xs text-gray-500">{roleLabels[user?.role || 'consumer']}</p>
            </div>
            <ChevronDown
              className={cn(
                'w-4 h-4 text-gray-400 transition-transform hidden lg:block',
                showUserMenu && 'rotate-180'
              )}
            />
          </button>

          <AnimatePresence>
            {showUserMenu && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="absolute right-0 mt-2 w-56 bg-white rounded-xl shadow-xl border border-gray-200 overflow-hidden"
              >
                <div className="p-4 border-b border-gray-100">
                  <p className="font-medium text-gray-900">{user?.name}</p>
                  <p className="text-sm text-gray-500">{user?.phone}</p>
                  <p className="text-xs text-green-600 mt-1">
                    {roleLabels[user?.role || 'consumer']}
                  </p>
                </div>

                <div className="py-2">
                  <button
                    onClick={() => setShowRoleSwitcher(true)}
                    className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                  >
                    <Users className="w-4 h-4" />
                    切换角色
                  </button>
                  <button
                    onClick={() => navigate('/profile')}
                    className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                  >
                    <Settings className="w-4 h-4" />
                    个人设置
                  </button>
                </div>

                <div className="border-t border-gray-100 py-2">
                  <button
                    onClick={handleLogout}
                    className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 transition-colors"
                  >
                    <LogOut className="w-4 h-4" />
                    退出登录
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      <AnimatePresence>
        {showRoleSwitcher && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowRoleSwitcher(false)}
              className="fixed inset-0 bg-black/50 z-50"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="fixed inset-x-4 top-1/2 -translate-y-1/2 bg-white rounded-2xl shadow-2xl z-50 max-w-md mx-auto p-6"
            >
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-semibold text-gray-900">切换角色</h3>
                <button
                  onClick={() => setShowRoleSwitcher(false)}
                  className="p-1 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              <p className="text-sm text-gray-500 mb-4">
                切换角色将退出当前账号，并重新登录
              </p>
              <div className="grid grid-cols-2 gap-3">
                {availableRoles.map((role) => (
                  <button
                    key={role}
                    onClick={() => handleRoleSwitch(role)}
                    className={cn(
                      'p-4 rounded-xl border-2 text-left transition-all hover:border-green-400 hover:bg-green-50',
                      user?.role === role
                        ? 'border-green-500 bg-green-50'
                        : 'border-gray-200'
                    )}
                  >
                    <p className="font-medium text-gray-900">{roleLabels[role]}</p>
                    <p className="text-xs text-gray-500 mt-1">
                      {role === 'farmer' && '管理种植、追溯码'}
                      {role === 'buyer' && '收购批次、申请认证'}
                      {role === 'inspector' && '执行检测、提交报告'}
                      {role === 'certifier' && '审核认证、颁发证书'}
                      {role === 'regulator' && '监管数据、审批补贴'}
                      {role === 'consumer' && '溯源查询、投诉举报'}
                    </p>
                  </button>
                ))}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </header>
  );
}
