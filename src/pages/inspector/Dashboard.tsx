import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { ClipboardList, CheckCircle, AlertTriangle, Clock, FileText, MapPin, ArrowRight, Bell } from 'lucide-react';
import { Link } from 'react-router-dom';
import { api } from '../../services/api';
import { useAuthStore } from '../../store/authStore';
import { useMessageStore } from '../../store/messageStore';
import { DataCard } from '../../components/ui/DataCard';
import { StatusBadge } from '../../components/ui/StatusBadge';
import { formatDate, formatRelativeTime } from '../../utils/format';
import { InspectionTask, InspectionReport } from '../../types';

const priorityColors: Record<string, string> = {
  low: 'bg-gray-100 text-gray-800',
  medium: 'bg-blue-100 text-blue-800',
  high: 'bg-orange-100 text-orange-800',
  urgent: 'bg-red-100 text-red-800',
};

const taskStatusColors: Record<string, string> = {
  pending: 'bg-gray-100 text-gray-800',
  assigned: 'bg-blue-100 text-blue-800',
  inspecting: 'bg-yellow-100 text-yellow-800',
  completed: 'bg-green-100 text-green-800',
  cancelled: 'bg-gray-100 text-gray-500',
};

export default function InspectorDashboard() {
  const { user } = useAuthStore();
  const { unreadCount, fetchMessages } = useMessageStore();
  const [stats, setStats] = useState({
    pendingTasks: 0,
    completedTasks: 0,
    passRate: 0,
    totalReports: 0,
  });
  const [urgentTasks, setUrgentTasks] = useState<InspectionTask[]>([]);
  const [recentReports, setRecentReports] = useState<InspectionReport[]>([]);
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
      const [tasksRes] = await Promise.all([
        api.getInspectionTasks({ inspectorId: user?.id, page: 1, pageSize: 20 }),
      ]);
      
      const tasks = tasksRes.items;
      const pending = tasks.filter(t => t.status !== 'completed' && t.status !== 'cancelled');
      const completed = tasks.filter(t => t.status === 'completed');
      const urgent = tasks.filter(t => t.priority === 'urgent' && t.status !== 'completed');
      
      const mockReports = generateMockReports(5);
      
      setStats({
        pendingTasks: pending.length,
        completedTasks: completed.length,
        passRate: completed.length > 0 ? Math.round((completed.filter(r => r).length / completed.length) * 100) : 0,
        totalReports: completed.length,
      });
      
      setUrgentTasks(urgent);
      setRecentReports(mockReports);
    } catch (error) {
      console.error('Failed to load dashboard data:', error);
    } finally {
      setLoading(false);
    }
  }

  function generateMockReports(count: number): InspectionReport[] {
    return Array.from({ length: count }, (_, i) => ({
      id: `report-${i}`,
      reportNo: `JC202401${String(20 - i).padStart(2, '0')}`,
      taskId: `task-${i}`,
      batchId: `batch-${i}`,
      inspectorId: user?.id || '',
      items: [],
      overallResult: i % 4 === 3 ? 'unqualified' : 'qualified',
      reportUrl: '',
      inspectorName: user?.name || '',
      reportDate: new Date(Date.now() - i * 86400000).toISOString(),
      createdAt: new Date(Date.now() - i * 86400000).toISOString(),
    }));
  }

  const quickActions = [
    { icon: ClipboardList, label: '抽检任务', path: '/inspector/tasks', color: 'from-blue-500 to-indigo-600', badge: stats.pendingTasks },
    { icon: FileText, label: '检测报告', path: '/inspector/reports', color: 'from-green-500 to-emerald-600' },
    { icon: MapPin, label: '采样地点', path: '/inspector/tasks?tab=locations', color: 'from-purple-500 to-pink-600' },
    { icon: Bell, label: '消息中心', path: '/messages', color: 'from-amber-500 to-orange-600', badge: unreadCount },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">检测机构工作台</h1>
          <p className="mt-1 text-sm text-gray-500">欢迎回来，{user?.name}</p>
        </div>
        <Link
          to="/inspector/tasks"
          className="btn-primary flex items-center gap-2"
        >
          <ClipboardList className="w-5 h-5" />
          查看任务
        </Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <DataCard
          title="待检任务"
          value={stats.pendingTasks}
          icon={Clock}
          theme="amber"
        />
        <DataCard
          title="已完成"
          value={stats.completedTasks}
          icon={CheckCircle}
          theme="green"
        />
        <DataCard
          title="合格率"
          value={stats.passRate}
          suffix="%"
          icon={CheckCircle}
          theme="blue"
          trend={2.5}
        />
        <DataCard
          title="总报告数"
          value={stats.totalReports}
          icon={FileText}
          theme="purple"
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
            <h2 className="text-lg font-semibold text-gray-900">紧急任务</h2>
            <Link to="/inspector/tasks?priority=urgent" className="text-sm text-red-600 hover:text-red-700 flex items-center gap-1">
              查看全部 <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
          
          {loading ? (
            <div className="space-y-3">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="h-20 bg-gray-100 rounded-xl animate-pulse" />
              ))}
            </div>
          ) : urgentTasks.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              <CheckCircle className="w-12 h-12 mx-auto mb-3 text-green-300" />
              <p>暂无紧急任务</p>
              <p className="text-sm text-gray-400 mt-1">所有任务都已安排妥当</p>
            </div>
          ) : (
            <div className="space-y-3">
              {urgentTasks.map((task) => (
                <motion.div
                  key={task.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="p-4 bg-red-50 rounded-xl border border-red-100"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-red-100 rounded-xl flex items-center justify-center">
                        <AlertTriangle className="w-6 h-6 text-red-600" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="font-semibold text-gray-900">{task.taskNo}</p>
                          <StatusBadge status="urgent" customColors={priorityColors} />
                        </div>
                        <p className="text-sm text-gray-500 mt-1">
                          派单时间：{formatRelativeTime(task.assignedAt)}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <StatusBadge status={task.status} customColors={taskStatusColors} />
                      <Link
                        to={`/inspector/tasks/${task.id}`}
                        className="p-2 bg-white rounded-lg hover:bg-red-50 transition-colors"
                      >
                        <ArrowRight className="w-5 h-5 text-red-500" />
                      </Link>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
          <div className="flex items-center justify-between mb-5">
            <h2 className="text-lg font-semibold text-gray-900">最近报告</h2>
            <Link to="/inspector/reports" className="text-sm text-green-600 hover:text-green-700">
              全部
            </Link>
          </div>
          
          <div className="space-y-3">
            {recentReports.map((report, index) => (
              <motion.div
                key={report.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className="p-4 bg-gray-50 rounded-xl hover:bg-green-50 transition-colors cursor-pointer"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                      report.overallResult === 'qualified' ? 'bg-green-100' : 'bg-red-100'
                    }`}>
                      <FileText className={`w-5 h-5 ${
                        report.overallResult === 'qualified' ? 'text-green-600' : 'text-red-600'
                      }`} />
                    </div>
                    <div>
                      <p className="font-medium text-gray-900 text-sm">{report.reportNo}</p>
                      <p className="text-xs text-gray-500">{formatDate(report.reportDate)}</p>
                    </div>
                  </div>
                  <StatusBadge
                    status={report.overallResult}
                    customColors={{
                      qualified: 'bg-green-100 text-green-800',
                      unqualified: 'bg-red-100 text-red-800',
                    }}
                  />
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
