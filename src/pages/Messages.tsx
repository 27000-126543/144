import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Bell,
  Search,
  CheckCheck,
  ChevronDown,
  ChevronUp,
  Download,
  FileText,
  AlertTriangle,
  Award,
  MessageSquare,
  Wallet,
  Settings,
  Package,
  Inbox,
} from 'lucide-react';
import { useMessageStore } from '../store/messageStore';
import { useAuthStore } from '../store/authStore';
import type { Message, MessageType } from '../types';
import { formatDateTime } from '../utils/format';
import { Modal } from '../components/ui/Modal';

const messageTypeLabels: Record<MessageType | 'all', string> = {
  all: '全部',
  inspection_result: '检测通知',
  certification: '认证通知',
  complaint: '投诉通知',
  subsidy: '补贴通知',
  warning: '预警通知',
  system: '系统通知',
  batch_status: '批次通知',
};

const typeIcons: Record<MessageType, any> = {
  inspection_result: FileText,
  certification: Award,
  complaint: MessageSquare,
  subsidy: Wallet,
  warning: AlertTriangle,
  system: Settings,
  batch_status: Package,
};

const typeColors: Record<MessageType, string> = {
  inspection_result: 'bg-blue-100 text-blue-600',
  certification: 'bg-amber-100 text-amber-600',
  complaint: 'bg-orange-100 text-orange-600',
  subsidy: 'bg-green-100 text-green-600',
  warning: 'bg-red-100 text-red-600',
  system: 'bg-gray-100 text-gray-600',
  batch_status: 'bg-purple-100 text-purple-600',
};

export default function Messages() {
  const { user } = useAuthStore();
  const { messages, unreadCount, loading, fetchMessages, markAsRead, markAllAsRead, getUnreadCount } = useMessageStore();
  const [activeTab, setActiveTab] = useState<MessageType | 'all'>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [showDownloadModal, setShowDownloadModal] = useState(false);
  const [selectedMessage, setSelectedMessage] = useState<Message | null>(null);

  useEffect(() => {
    if (user?.id) {
      fetchMessages({ userId: user.id, page: 1, pageSize: 50 });
    }
  }, [fetchMessages, user?.id, activeTab]);

  useEffect(() => {
    if (user?.id) {
      getUnreadCount(user.id);
    }
  }, [getUnreadCount, user?.id]);

  const filteredMessages = messages.filter((m) => {
    const matchTab = activeTab === 'all' || m.type === activeTab;
    const matchSearch = m.title.includes(searchTerm) || m.content.includes(searchTerm);
    return matchTab && matchSearch;
  });

  const tabs = [
    { key: 'all' as const, label: '全部', icon: Inbox },
    { key: 'inspection_result' as const, label: messageTypeLabels.inspection_result, icon: FileText },
    { key: 'certification' as const, label: messageTypeLabels.certification, icon: Award },
    { key: 'complaint' as const, label: messageTypeLabels.complaint, icon: MessageSquare },
    { key: 'subsidy' as const, label: messageTypeLabels.subsidy, icon: Wallet },
    { key: 'warning' as const, label: messageTypeLabels.warning, icon: AlertTriangle },
    { key: 'system' as const, label: messageTypeLabels.system, icon: Settings },
  ];

  const handleExpand = async (message: Message) => {
    if (expandedId === message.id) {
      setExpandedId(null);
    } else {
      setExpandedId(message.id);
      if (!message.isRead) {
        await markAsRead(message.id);
        if (user?.id) {
          await getUnreadCount(user.id);
        }
      }
    }
  };

  const handleMarkAllAsRead = async () => {
    if (user?.id && unreadCount > 0) {
      await markAllAsRead(user.id);
      await getUnreadCount(user.id);
    }
  };

  const handleDownload = (message: Message) => {
    setSelectedMessage(message);
    setShowDownloadModal(true);
  };

  const getUnreadCountByType = (type: MessageType | 'all') => {
    if (type === 'all') return unreadCount;
    return messages.filter((m) => m.type === type && !m.isRead).length;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-emerald-50 to-teal-50">
      <div className="max-w-5xl mx-auto px-4 py-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center shadow-lg">
                <Bell className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">消息中心</h1>
                <p className="text-sm text-gray-500">您有 {unreadCount} 条未读消息</p>
              </div>
            </div>
            <button
              onClick={handleMarkAllAsRead}
              disabled={unreadCount === 0 || loading}
              className="btn-secondary flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <CheckCheck className="w-4 h-4" />
              一键已读
            </button>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="glass-card rounded-2xl p-4 mb-6"
        >
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="搜索消息标题或内容..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="input-field pl-12"
            />
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="glass-card rounded-2xl p-2 mb-6 overflow-x-auto"
        >
          <div className="flex gap-2 min-w-max">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              const count = getUnreadCountByType(tab.key);
              return (
                <button
                  key={tab.key}
                  onClick={() => setActiveTab(tab.key)}
                  className={`relative px-4 py-2 rounded-xl flex items-center gap-2 transition-all whitespace-nowrap ${
                    activeTab === tab.key
                      ? 'bg-gradient-to-r from-green-500 to-emerald-600 text-white shadow-md'
                      : 'hover:bg-white/50 text-gray-600'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span className="font-medium">{tab.label}</span>
                  {count > 0 && (
                    <span
                      className={`min-w-[20px] h-5 px-1.5 rounded-full text-xs font-bold flex items-center justify-center ${
                        activeTab === tab.key
                          ? 'bg-white text-green-600'
                          : 'bg-red-500 text-white'
                      }`}
                    >
                      {count > 99 ? '99+' : count}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="space-y-3"
        >
          <AnimatePresence mode="popLayout">
            {loading ? (
              <div className="glass-card rounded-2xl p-12 text-center">
                <div className="w-12 h-12 border-4 border-green-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
                <p className="text-gray-500">加载消息中...</p>
              </div>
            ) : filteredMessages.length === 0 ? (
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="glass-card rounded-2xl p-12 text-center"
              >
                <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-green-100 flex items-center justify-center">
                  <Inbox className="w-10 h-10 text-green-500" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">暂无消息</h3>
                <p className="text-gray-500">当前没有符合条件的消息</p>
              </motion.div>
            ) : (
              filteredMessages.map((message, index) => {
                const Icon = typeIcons[message.type];
                const isExpanded = expandedId === message.id;

                return (
                  <motion.div
                    key={message.id}
                    layout
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    transition={{ delay: index * 0.05 }}
                    className={`glass-card rounded-2xl overflow-hidden transition-all ${
                      !message.isRead ? 'ring-2 ring-green-500/30' : ''
                    }`}
                  >
                    <div
                      onClick={() => handleExpand(message)}
                      className="p-5 cursor-pointer hover:bg-white/50 transition-colors"
                    >
                      <div className="flex items-start gap-4">
                        <div
                          className={`w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 ${typeColors[message.type]}`}
                        >
                          <Icon className="w-6 h-6" />
                        </div>

                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-3 mb-1">
                            <div className="flex items-center gap-2">
                              {!message.isRead && (
                                <span className="w-2 h-2 rounded-full bg-red-500 flex-shrink-0" />
                              )}
                              <h3 className={`font-semibold truncate ${!message.isRead ? 'text-gray-900' : 'text-gray-700'}`}>
                                {message.title}
                              </h3>
                            </div>
                            <span className="text-sm text-gray-400 flex-shrink-0">
                              {formatDateTime(message.createdAt)}
                            </span>
                          </div>

                          <p className="text-sm text-gray-500 line-clamp-1 mb-2">
                            {message.content}
                          </p>

                          <div className="flex items-center justify-between">
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${typeColors[message.type]}`}>
                              {messageTypeLabels[message.type]}
                            </span>
                            {isExpanded ? (
                              <ChevronUp className="w-5 h-5 text-gray-400" />
                            ) : (
                              <ChevronDown className="w-5 h-5 text-gray-400" />
                            )}
                          </div>
                        </div>
                      </div>
                    </div>

                    <AnimatePresence>
                      {isExpanded && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: 'auto', opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          transition={{ duration: 0.3 }}
                          className="border-t border-gray-100"
                        >
                          <div className="p-5 bg-white/30">
                            <div className="mb-4">
                              <h4 className="text-sm font-semibold text-gray-700 mb-2">消息详情</h4>
                              <p className="text-gray-600 leading-relaxed">{message.content}</p>
                            </div>

                            {message.attachmentUrl && (
                              <div className="flex items-center justify-between p-4 rounded-xl bg-white/60 border border-gray-100">
                                <div className="flex items-center gap-3">
                                  <div className="w-10 h-10 rounded-lg bg-green-100 flex items-center justify-center">
                                    <FileText className="w-5 h-5 text-green-600" />
                                  </div>
                                  <div>
                                    <p className="font-medium text-gray-900">{message.attachmentName || '附件凭证'}</p>
                                    <p className="text-xs text-gray-500">点击下载查看详情</p>
                                  </div>
                                </div>
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleDownload(message);
                                  }}
                                  className="btn-primary flex items-center gap-2 text-sm"
                                >
                                  <Download className="w-4 h-4" />
                                  下载
                                </button>
                              </div>
                            )}

                            {message.readAt && (
                              <p className="text-xs text-gray-400 mt-4">
                                已于 {formatDateTime(message.readAt)} 阅读
                              </p>
                            )}
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </motion.div>
                );
              })
            )}
          </AnimatePresence>
        </motion.div>
      </div>

      <Modal
        open={showDownloadModal}
        onClose={() => setShowDownloadModal(false)}
        title="下载凭证"
      >
        <div className="space-y-4">
          <div className="p-4 rounded-xl bg-green-50 border border-green-200">
            <div className="flex items-start gap-3">
              <FileText className="w-8 h-8 text-green-600 flex-shrink-0 mt-0.5" />
              <div>
                <h4 className="font-semibold text-gray-900">{selectedMessage?.title}</h4>
                <p className="text-sm text-gray-600 mt-1">{selectedMessage?.attachmentName || '凭证文件'}</p>
              </div>
            </div>
          </div>

          <div className="p-4 rounded-xl bg-gray-50">
            <h5 className="font-medium text-gray-700 mb-2">凭证内容</h5>
            <p className="text-sm text-gray-600">{selectedMessage?.content}</p>
          </div>

          <div className="flex gap-3">
            <button
              onClick={() => setShowDownloadModal(false)}
              className="btn-secondary flex-1"
            >
              取消
            </button>
            <button
              onClick={() => {
                alert('凭证下载功能（模拟）');
                setShowDownloadModal(false);
              }}
              className="btn-primary flex-1 flex items-center justify-center gap-2"
            >
              <Download className="w-4 h-4" />
              确认下载
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
