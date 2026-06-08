import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Award, Clock, CheckCircle, XCircle, FileCheck, ArrowRight, Bell, Printer, Download } from 'lucide-react';
import { Link } from 'react-router-dom';
import { api } from '../../services/api';
import { useAuthStore } from '../../store/authStore';
import { useMessageStore } from '../../store/messageStore';
import { DataCard } from '../../components/ui/DataCard';
import { StatusBadge } from '../../components/ui/StatusBadge';
import { formatDate } from '../../utils/format';
import { CertificationApplication, Certificate, CertType, certTypeLabels } from '../../types';

const certTypeColors: Record<CertType, string> = {
  organic: 'bg-green-100 text-green-800',
  green: 'bg-emerald-100 text-emerald-800',
  gap: 'bg-purple-100 text-purple-800',
};

const applicationStatusColors: Record<string, string> = {
  draft: 'bg-gray-100 text-gray-800',
  submitted: 'bg-blue-100 text-blue-800',
  reviewing: 'bg-yellow-100 text-yellow-800',
  site_check: 'bg-purple-100 text-purple-800',
  approved: 'bg-green-100 text-green-800',
  rejected: 'bg-red-100 text-red-800',
};

const certificateStatusColors: Record<string, string> = {
  valid: 'bg-green-100 text-green-800',
  expired: 'bg-yellow-100 text-yellow-800',
  revoked: 'bg-red-100 text-red-800',
};

export default function CertifierDashboard() {
  const { user } = useAuthStore();
  const { unreadCount, fetchMessages } = useMessageStore();
  const [stats, setStats] = useState({
    pendingReviews: 0,
    approved: 0,
    passRate: 0,
    totalCertificates: 0,
  });
  const [pendingApplications, setPendingApplications] = useState<CertificationApplication[]>([]);
  const [recentCertificates, setRecentCertificates] = useState<Certificate[]>([]);
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
      const [applicationsRes] = await Promise.all([
        api.getCertificationApplications({ certifierId: user?.id, page: 1, pageSize: 50 }),
      ]);
      
      const applications = applicationsRes.items;
      const pending = applications.filter(a => a.status === 'submitted' || a.status === 'reviewing' || a.status === 'site_check');
      const approved = applications.filter(a => a.status === 'approved');
      
      const mockCertificates = generateMockCertificates(5);
      
      setStats({
        pendingReviews: pending.length,
        approved: approved.length,
        passRate: applications.length > 0 ? Math.round((approved.length / applications.length) * 100) : 0,
        totalCertificates: approved.length,
      });
      
      setPendingApplications(pending);
      setRecentCertificates(mockCertificates);
    } catch (error) {
      console.error('Failed to load dashboard data:', error);
    } finally {
      setLoading(false);
    }
  }

  function generateMockCertificates(count: number): Certificate[] {
    const certTypes: CertType[] = ['organic', 'green', 'gap'];
    return Array.from({ length: count }, (_, i) => ({
      id: `cert-${i}`,
      certNo: `RZ${new Date().getFullYear()}${String(certTypes[i % certTypes.length].charCodeAt(0)).padStart(4, '0')}${String(100 - i).padStart(4, '0')}`,
      certType: certTypes[i % certTypes.length],
      applicationId: `app-${i}`,
      batchId: `batch-${i}`,
      holderName: '寿光市绿源蔬菜种植专业合作社',
      productName: '西红柿',
      issueDate: new Date(Date.now() - i * 30 * 86400000).toISOString(),
      validUntil: new Date(Date.now() + (365 - i * 30) * 86400000).toISOString(),
      qrCodeUrl: '',
      certUrl: '',
      status: i === 4 ? 'expired' : 'valid',
      createdAt: new Date(Date.now() - i * 30 * 86400000).toISOString(),
    }));
  }

  const quickActions = [
    { icon: FileCheck, label: '认证审核', path: '/certifier/reviews', color: 'from-amber-500 to-orange-600', badge: stats.pendingReviews },
    { icon: Award, label: '证书管理', path: '/certifier/certificates', color: 'from-yellow-500 to-amber-600' },
    { icon: Printer, label: '证书打印', path: '/certifier/certificates?action=print', color: 'from-blue-500 to-indigo-600' },
    { icon: Bell, label: '消息中心', path: '/messages', color: 'from-purple-500 to-pink-600', badge: unreadCount },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">认证机构工作台</h1>
          <p className="mt-1 text-sm text-gray-500">欢迎回来，{user?.name}</p>
        </div>
        <Link
          to="/certifier/reviews"
          className="btn-primary flex items-center gap-2"
        >
          <FileCheck className="w-5 h-5" />
          待审核
          {stats.pendingReviews > 0 && (
            <span className="px-2 py-0.5 bg-white/20 rounded-full text-xs">
              {stats.pendingReviews}
            </span>
          )}
        </Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <DataCard
          title="待审核"
          value={stats.pendingReviews}
          icon={Clock}
          theme="amber"
        />
        <DataCard
          title="已通过"
          value={stats.approved}
          icon={CheckCircle}
          theme="green"
        />
        <DataCard
          title="认证通过率"
          value={stats.passRate}
          suffix="%"
          icon={Award}
          theme="amber"
        />
        <DataCard
          title="有效证书"
          value={stats.totalCertificates}
          icon={Award}
          theme="blue"
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
              className="relative block p-5 bg-white rounded-2xl shadow-sm border border-gray-100 hover:shadow-lg hover:border-amber-200 transition-all group card-hover"
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
                <ArrowRight className="w-4 h-4 text-gray-400 group-hover:text-amber-600 group-hover:translate-x-1 transition-all" />
              </div>
            </Link>
          </motion.div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
          <div className="flex items-center justify-between mb-5">
            <h2 className="text-lg font-semibold text-gray-900">待审核申请</h2>
            <Link to="/certifier/reviews" className="text-sm text-amber-600 hover:text-amber-700 flex items-center gap-1">
              查看全部 <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
          
          {loading ? (
            <div className="space-y-3">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="h-20 bg-gray-100 rounded-xl animate-pulse" />
              ))}
            </div>
          ) : pendingApplications.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              <CheckCircle className="w-12 h-12 mx-auto mb-3 text-green-300" />
              <p>暂无待审核申请</p>
              <p className="text-sm text-gray-400 mt-1">所有申请都已处理完毕</p>
            </div>
          ) : (
            <div className="space-y-3">
              {pendingApplications.slice(0, 5).map((application, index) => (
                <motion.div
                  key={application.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="p-4 bg-amber-50 rounded-xl border border-amber-100 hover:bg-amber-100 transition-colors cursor-pointer"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-amber-100 rounded-xl flex items-center justify-center">
                        <FileCheck className="w-6 h-6 text-amber-600" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="font-semibold text-gray-900">{application.applicationNo}</p>
                          <StatusBadge
                            status={application.certType}
                            customColors={certTypeColors}
                            label={certTypeLabels[application.certType]}
                          />
                        </div>
                        <p className="text-sm text-gray-500 mt-1">
                          提交时间：{formatDate(application.submittedAt)}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <StatusBadge
                        status={application.status}
                        customColors={applicationStatusColors}
                      />
                      <Link
                        to={`/certifier/reviews/${application.id}`}
                        className="p-2 bg-white rounded-lg hover:bg-amber-50 transition-colors"
                      >
                        <ArrowRight className="w-5 h-5 text-amber-500" />
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
            <h2 className="text-lg font-semibold text-gray-900">最近证书</h2>
            <Link to="/certifier/certificates" className="text-sm text-amber-600 hover:text-amber-700">
              全部
            </Link>
          </div>
          
          <div className="space-y-3">
            {recentCertificates.map((cert, index) => (
              <motion.div
                key={cert.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className="p-4 border-2 border-amber-100 bg-gradient-to-br from-amber-50 to-yellow-50 rounded-xl hover:border-amber-300 transition-colors cursor-pointer"
              >
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <div className="flex items-center gap-2">
                      <Award className="w-5 h-5 text-amber-500" />
                      <p className="font-semibold text-gray-900 text-sm">{cert.certNo}</p>
                    </div>
                    <StatusBadge
                      status={cert.certType}
                      customColors={certTypeColors}
                      size="sm"
                      className="mt-1"
                      label={certTypeLabels[cert.certType]}
                    />
                  </div>
                  <StatusBadge
                    status={cert.status}
                    customColors={certificateStatusColors}
                    size="sm"
                  />
                </div>
                <p className="text-sm text-gray-600">{cert.holderName}</p>
                <p className="text-xs text-gray-500 mt-1">
                  有效期至：{formatDate(cert.validUntil)}
                </p>
                <div className="flex gap-2 mt-3">
                  <button className="flex-1 py-1.5 bg-white rounded-lg text-xs text-gray-600 hover:bg-amber-100 transition-colors flex items-center justify-center gap-1">
                    <Printer className="w-3 h-3" />
                    打印
                  </button>
                  <button className="flex-1 py-1.5 bg-white rounded-lg text-xs text-gray-600 hover:bg-amber-100 transition-colors flex items-center justify-center gap-1">
                    <Download className="w-3 h-3" />
                    下载
                  </button>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
