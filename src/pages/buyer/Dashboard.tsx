import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Package, CheckCircle, AlertTriangle, XCircle, Scan, History, Bell, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { api } from '../../services/api';
import { useAuthStore } from '../../store/authStore';
import { useMessageStore } from '../../store/messageStore';
import { DataCard } from '../../components/ui/DataCard';
import { StatusBadge } from '../../components/ui/StatusBadge';
import { formatDate, formatWeight, formatCurrency } from '../../utils/format';
import { Batch } from '../../types';

const batchStatusColors: Record<string, string> = {
  planted: 'bg-green-100 text-green-800',
  harvested: 'bg-blue-100 text-blue-800',
  purchased: 'bg-purple-100 text-purple-800',
  precheck_pass: 'bg-green-100 text-green-800',
  precheck_warning: 'bg-yellow-100 text-yellow-800',
  precheck_fail: 'bg-red-100 text-red-800',
  inspected: 'bg-indigo-100 text-indigo-800',
  certified: 'bg-amber-100 text-amber-800',
  sold: 'bg-gray-100 text-gray-800',
};

export default function BuyerDashboard() {
  const { user } = useAuthStore();
  const { unreadCount, fetchMessages } = useMessageStore();
  const [stats, setStats] = useState({
    totalBatches: 0,
    precheckPass: 0,
    precheckWarning: 0,
    precheckFail: 0,
  });
  const [recentBatches, setRecentBatches] = useState<Batch[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
    if (user) {
      fetchMessages();
    }
  }, [user]);

  async function loadData() {
    try {
      setLoading(true);
      const [batchesRes] = await Promise.all([
        api.getBatches({ buyerId: user?.id, page: 1, pageSize: 5 }),
      ]);
      
      const batches = batchesRes.items;
      setRecentBatches(batches);
      
      const pass = batches.filter(b => b.precheckStatus === 'pass').length;
      const warning = batches.filter(b => b.precheckStatus === 'warning').length;
      const fail = batches.filter(b => b.precheckStatus === 'fail').length;
      
      setStats({
        totalBatches: batchesRes.total || 0,
        precheckPass: pass,
        precheckWarning: warning,
        precheckFail: fail,
      });
    } catch (error) {
      console.error('Failed to load dashboard data:', error);
    } finally {
      setLoading(false);
    }
  }

  const quickActions = [
    { icon: Scan, label: '扫码收购', path: '/buyer/scan', color: 'from-green-500 to-emerald-600' },
    { icon: Package, label: '批次管理', path: '/buyer/batches', color: 'from-blue-500 to-indigo-600' },
    { icon: History, label: '收购记录', path: '/buyer/batches?status=purchased', color: 'from-purple-500 to-pink-600' },
    { icon: Bell, label: '消息中心', path: '/messages', color: 'from-amber-500 to-orange-600', badge: unreadCount },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">收购商工作台</h1>
          <p className="mt-1 text-sm text-gray-500">欢迎回来，{user?.name}</p>
        </div>
        <Link
          to="/buyer/scan"
          className="btn-primary flex items-center gap-2"
        >
          <Scan className="w-5 h-5" />
          快速扫码
        </Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <DataCard
          title="收购批次"
          value={stats.totalBatches}
          icon={Package}
          theme="blue"
          trend={12}
        />
        <DataCard
          title="预检通过"
          value={stats.precheckPass}
          icon={CheckCircle}
          theme="green"
        />
        <DataCard
          title="预警批次"
          value={stats.precheckWarning}
          icon={AlertTriangle}
          theme="amber"
        />
        <DataCard
          title="不合格"
          value={stats.precheckFail}
          icon={XCircle}
          theme="red"
        />
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {quickActions.map((action, index) => (
          <motion.div
            key={action.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
          >
            <Link
              to={action.path}
              className="relative block p-5 bg-white rounded-2xl shadow-sm border border-gray-100 hover:shadow-lg hover:border-green-200 transition-all group card-hover"
            >
              {action.badge && action.badge > 0 && (
                <span className="absolute top-3 right-3 w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
                  {action.badge > 99 ? '99+' : action.badge}
                </span>
              )}
              <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${action.color} flex items-center justify-center text-white mb-3 group-hover:scale-110 transition-transform`}>
                <action.icon className="w-6 h-6" />
              </div>
              <div className="flex items-center justify-between">
                <span className="font-medium text-gray-800">{action.label}</span>
                <ArrowRight className="w-4 h-4 text-gray-400 group-hover:text-green-600 group-hover:translate-x-1 transition-all" />
              </div>
            </Link>
          </motion.div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
          <div className="flex items-center justify-between mb-5">
            <h2 className="text-lg font-semibold text-gray-900">最近收购批次</h2>
            <Link to="/buyer/batches" className="text-sm text-green-600 hover:text-green-700 flex items-center gap-1">
              查看全部 <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
          
          {loading ? (
            <div className="space-y-3">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="h-16 bg-gray-100 rounded-xl animate-pulse" />
              ))}
            </div>
          ) : recentBatches.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              <Package className="w-12 h-12 mx-auto mb-3 text-gray-300" />
              <p>暂无收购批次</p>
              <Link to="/buyer/scan" className="mt-2 inline-block text-green-600 hover:text-green-700">
                去扫码收购 →
              </Link>
            </div>
          ) : (
            <div className="space-y-3">
              {recentBatches.map((batch) => (
                <motion.div
                  key={batch.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="flex items-center justify-between p-4 bg-gray-50 rounded-xl hover:bg-green-50 transition-colors"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 bg-green-100 rounded-xl flex items-center justify-center">
                      <Package className="w-5 h-5 text-green-600" />
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">{batch.batchNo}</p>
                      <p className="text-sm text-gray-500">
                        {formatWeight(batch.quantity)} · {formatCurrency(batch.totalAmount)}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <StatusBadge
                      status={batch.precheckStatus}
                      customColors={{
                        pass: 'bg-green-100 text-green-800',
                        warning: 'bg-yellow-100 text-yellow-800',
                        fail: 'bg-red-100 text-red-800',
                        pending: 'bg-gray-100 text-gray-800',
                      }}
                    />
                    <StatusBadge
                      status={batch.status}
                      customColors={batchStatusColors}
                    />
                    <span className="text-sm text-gray-400">{formatDate(batch.purchaseDate)}</span>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
          <div className="flex items-center justify-between mb-5">
            <h2 className="text-lg font-semibold text-gray-900">消息提醒</h2>
            <Link to="/messages" className="text-sm text-green-600 hover:text-green-700">
              全部
            </Link>
          </div>
          
          <div className="space-y-3">
            <div className="p-4 bg-red-50 rounded-xl border border-red-100">
              <div className="flex items-start gap-3">
                <AlertTriangle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-red-800">预警提醒</p>
                  <p className="text-xs text-red-600 mt-1">批次 BH20240115001 预检发现农药残留超标，请关注</p>
                </div>
              </div>
            </div>
            
            <div className="p-4 bg-green-50 rounded-xl border border-green-100">
              <div className="flex items-start gap-3">
                <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-green-800">检测完成</p>
                  <p className="text-xs text-green-600 mt-1">批次 BH20240110003 检测合格，已出具报告</p>
                </div>
              </div>
            </div>
            
            <div className="p-4 bg-amber-50 rounded-xl border border-amber-100">
              <div className="flex items-start gap-3">
                <Bell className="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-amber-800">系统通知</p>
                  <p className="text-xs text-amber-600 mt-1">您有3个批次即将完成认证流程</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
