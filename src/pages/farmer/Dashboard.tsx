import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import {
  Leaf,
  QrCode,
  Droplets,
  DollarSign,
  Plus,
  Bell,
  Calendar,
  ChevronRight,
  AlertCircle,
  CheckCircle,
  Clock,
  Sprout,
  FileText,
} from 'lucide-react';
import { DataCard } from '../../components/ui/DataCard';
import { StatusBadge } from '../../components/ui/StatusBadge';
import { useAuthStore } from '../../store/authStore';
import { useMessageStore } from '../../store/messageStore';
import { api } from '../../services/api';
import type { PlantingInfo, TraceCode, SubsidyApplication, PesticideRecord, Message } from '../../types';
import { formatDate } from '../../utils/format';

export default function FarmerDashboard() {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const { unreadCount, getUnreadCount } = useMessageStore();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalArea: 0,
    pendingHarvest: 0,
    traceCodeCount: 0,
    subsidyAmount: 0,
  });
  const [recentPlantings, setRecentPlantings] = useState<PlantingInfo[]>([]);
  const [recentMessages, setRecentMessages] = useState<Message[]>([]);
  const [pesticideWarnings, setPesticideWarnings] = useState<PesticideRecord[]>([]);

  useEffect(() => {
    if (user) {
      getUnreadCount(user.id);
      loadData();
    }
  }, [user, getUnreadCount]);

  const loadData = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const [plantingsRes, traceCodesRes, subsidiesRes, pesticidesRes, messagesRes] = await Promise.all([
        api.getPlantings({ farmerId: user.id, page: 1, pageSize: 5 }),
        api.getTraceCodes({ farmerId: user.id, page: 1, pageSize: 100 }),
        api.getSubsidies({ farmerId: user.id, page: 1, pageSize: 100 }),
        api.getPesticideRecords({ page: 1, pageSize: 10 }),
        api.getMessages({ userId: user.id, page: 1, pageSize: 3 }),
      ]);

      const totalArea = plantingsRes.items.reduce((sum, p) => sum + p.area, 0);
      const pendingHarvest = plantingsRes.items.filter(p => p.status === 'ready' || p.status === 'growing').length;
      const traceCodeCount = traceCodesRes.items.length;
      const subsidyAmount = subsidiesRes.items
        .filter(s => s.status === 'approved' || s.status === 'paid')
        .reduce((sum, s) => sum + (s.actualAmount || s.calculatedAmount), 0);

      setStats({ totalArea, pendingHarvest, traceCodeCount, subsidyAmount });
      setRecentPlantings(plantingsRes.items);
      setRecentMessages(messagesRes.items);

      const now = new Date();
      const warnings = pesticidesRes.items.filter(record => {
        const useDate = new Date(record.useDate);
        const safeDate = new Date(useDate);
        safeDate.setDate(safeDate.getDate() + record.safeInterval);
        return now < safeDate;
      });
      setPesticideWarnings(warnings);
    } catch (error) {
      console.error('加载数据失败:', error);
    } finally {
      setLoading(false);
    }
  };

  const quickActions = [
    { icon: Sprout, title: '新增种植', color: 'from-green-400 to-green-600', path: '/farmer/planting' },
    { icon: QrCode, title: '生成追溯码', color: 'from-blue-400 to-blue-600', path: '/farmer/trace-codes' },
    { icon: Droplets, title: '记录用药', color: 'from-purple-400 to-purple-600', path: '/farmer/pesticide' },
    { icon: DollarSign, title: '申请补贴', color: 'from-amber-400 to-amber-600', path: '/farmer/subsidy' },
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <div className="text-center">
          <div className="w-12 h-12 mx-auto mb-4 rounded-full bg-green-100 flex items-center justify-center">
            <div className="w-6 h-6 border-2 border-green-500 border-t-transparent rounded-full animate-spin" />
          </div>
          <p className="text-gray-500">加载中...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4"
      >
        <div>
          <h1 className="text-2xl font-bold text-gray-900">农户工作台</h1>
          <p className="text-gray-500 mt-1">欢迎回来，{user?.name}</p>
        </div>
        <button
          onClick={() => navigate('/messages')}
          className="relative flex items-center gap-2 px-4 py-2 bg-white rounded-xl border border-gray-200 hover:border-green-300 transition-colors"
        >
          <Bell className="w-5 h-5 text-gray-600" />
          <span className="text-gray-700">消息中心</span>
          {unreadCount > 0 && (
            <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
              {unreadCount}
            </span>
          )}
        </button>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4"
      >
        <DataCard
          title="在种面积"
          value={stats.totalArea}
          icon={Leaf}
          suffix="亩"
          theme="green"
          trend={2.5}
        />
        <DataCard
          title="待采收"
          value={stats.pendingHarvest}
          icon={Calendar}
          suffix="批次"
          theme="blue"
        />
        <DataCard
          title="追溯码数量"
          value={stats.traceCodeCount}
          icon={QrCode}
          suffix="个"
          theme="purple"
        />
        <DataCard
          title="补贴金额"
          value={stats.subsidyAmount}
          icon={DollarSign}
          prefix="¥"
          theme="amber"
        />
      </motion.div>

      {pesticideWarnings.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-amber-50 border border-amber-200 rounded-2xl p-4"
        >
          <div className="flex items-start gap-3">
            <AlertCircle className="w-6 h-6 text-amber-500 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <h3 className="font-semibold text-amber-800">安全间隔期提醒</h3>
              <p className="text-amber-700 text-sm mt-1">
                有 {pesticideWarnings.length} 条用药记录尚在安全间隔期内，采收前请注意查看。
              </p>
            </div>
            <button
              onClick={() => navigate('/farmer/pesticide')}
              className="text-amber-600 hover:text-amber-700 text-sm font-medium"
            >
              查看详情 →
            </button>
          </div>
        </motion.div>
      )}

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
      >
        <h2 className="text-lg font-semibold text-gray-900 mb-4">快捷操作</h2>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {quickActions.map((action, index) => {
            const Icon = action.icon;
            return (
              <motion.button
                key={action.title}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 + index * 0.1 }}
                whileHover={{ scale: 1.02, y: -2 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => navigate(action.path)}
                className="group relative overflow-hidden p-6 bg-white rounded-2xl border border-gray-100 shadow-lg card-hover"
              >
                <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${action.color} flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}>
                  <Icon className="w-6 h-6 text-white" />
                </div>
                <h3 className="font-semibold text-gray-900">{action.title}</h3>
                <Plus className="absolute right-4 top-4 w-5 h-5 text-gray-400 group-hover:text-green-500 transition-colors" />
              </motion.button>
            );
          })}
        </div>
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="bg-white rounded-2xl border border-gray-100 shadow-lg overflow-hidden"
        >
          <div className="flex items-center justify-between p-6 border-b border-gray-100">
            <h2 className="text-lg font-semibold text-gray-900">最近批次</h2>
            <button
              onClick={() => navigate('/farmer/planting')}
              className="text-green-600 hover:text-green-700 text-sm font-medium flex items-center gap-1"
            >
              查看全部
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
          <div className="divide-y divide-gray-100">
            {recentPlantings.length === 0 ? (
              <div className="p-8 text-center text-gray-500">
                <Sprout className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                <p>暂无种植记录</p>
                <button
                  onClick={() => navigate('/farmer/planting')}
                  className="mt-3 text-green-600 hover:text-green-700 text-sm font-medium"
                >
                  + 新增种植信息
                </button>
              </div>
            ) : (
              recentPlantings.map((planting, index) => (
                <motion.div
                  key={planting.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.5 + index * 0.1 }}
                  className="p-4 hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-green-100 flex items-center justify-center">
                        <Leaf className="w-5 h-5 text-green-600" />
                      </div>
                      <div>
                        <h4 className="font-medium text-gray-900">
                          {planting.cropType} - {planting.cropVariety}
                        </h4>
                        <p className="text-sm text-gray-500">
                          {planting.area}亩 · {formatDate(planting.plantDate)}
                        </p>
                      </div>
                    </div>
                    <StatusBadge status={planting.status} />
                  </div>
                </motion.div>
              ))
            )}
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="bg-white rounded-2xl border border-gray-100 shadow-lg overflow-hidden"
        >
          <div className="flex items-center justify-between p-6 border-b border-gray-100">
            <h2 className="text-lg font-semibold text-gray-900">消息提醒</h2>
            <button
              onClick={() => navigate('/messages')}
              className="text-green-600 hover:text-green-700 text-sm font-medium flex items-center gap-1"
            >
              全部消息
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
          <div className="divide-y divide-gray-100">
            {recentMessages.length === 0 ? (
              <div className="p-8 text-center text-gray-500">
                <Bell className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                <p>暂无消息</p>
              </div>
            ) : (
              recentMessages.map((message, index) => (
                <motion.div
                  key={message.id}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.6 + index * 0.1 }}
                  className="p-4 hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-start gap-3">
                    <div className={cn(
                      'w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0',
                      message.type === 'inspection_result' ? 'bg-blue-100' :
                      message.type === 'certification' ? 'bg-amber-100' :
                      message.type === 'subsidy' ? 'bg-green-100' :
                      message.type === 'warning' ? 'bg-red-100' : 'bg-gray-100'
                    )}>
                      {message.type === 'inspection_result' ? <FileText className="w-5 h-5 text-blue-600" /> :
                       message.type === 'certification' ? <CheckCircle className="w-5 h-5 text-amber-600" /> :
                       message.type === 'subsidy' ? <DollarSign className="w-5 h-5 text-green-600" /> :
                       message.type === 'warning' ? <AlertCircle className="w-5 h-5 text-red-600" /> :
                       <Bell className="w-5 h-5 text-gray-600" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <h4 className="font-medium text-gray-900 truncate">{message.title}</h4>
                        {!message.isRead && (
                          <span className="w-2 h-2 bg-red-500 rounded-full flex-shrink-0" />
                        )}
                      </div>
                      <p className="text-sm text-gray-500 mt-1 line-clamp-2">{message.content}</p>
                      <div className="flex items-center gap-1 mt-2 text-xs text-gray-400">
                        <Clock className="w-3 h-3" />
                        <span>{formatDate(message.createdAt)}</span>
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))
            )}
          </div>
        </motion.div>
      </div>
    </div>
  );
}

function cn(...classes: (string | boolean | undefined)[]) {
  return classes.filter(Boolean).join(' ');
}
