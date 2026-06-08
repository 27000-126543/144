import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FileCheck, Search, Filter, ChevronDown, CheckCircle, XCircle, Clock, FileText, User, MapPin, Calendar, AlertCircle, MessageSquare, Send, ChevronRight } from 'lucide-react';
import { api } from '../../services/api';
import { useAuthStore } from '../../store/authStore';
import { useToast } from '../../components/ui/MessageToast';
import { Modal, ModalButton } from '../../components/ui/Modal';
import { StatusBadge } from '../../components/ui/StatusBadge';
import { formatDate, formatRelativeTime, formatDateTime } from '../../utils/format';
import { CertificationApplication, CertType, certTypeLabels } from '../../types';

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

const applicationStatusLabels: Record<string, string> = {
  draft: '草稿',
  submitted: '已提交',
  reviewing: '审核中',
  site_check: '现场核查',
  approved: '已通过',
  rejected: '已驳回',
};

const statusFilterOptions = [
  { value: '', label: '全部状态' },
  { value: 'submitted', label: '待审核' },
  { value: 'reviewing', label: '审核中' },
  { value: 'site_check', label: '现场核查' },
  { value: 'approved', label: '已通过' },
  { value: 'rejected', label: '已驳回' },
];

const reviewSteps = [
  { key: 'submitted', label: '提交申请' },
  { key: 'reviewing', label: '资料审核' },
  { key: 'site_check', label: '现场核查' },
  { key: 'approved', label: '认证通过' },
];

export default function CertifierReviews() {
  const { user } = useAuthStore();
  const { showToast } = useToast();
  const [applications, setApplications] = useState<CertificationApplication[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [showStatusDropdown, setShowStatusDropdown] = useState(false);
  const [selectedApplication, setSelectedApplication] = useState<CertificationApplication | null>(null);
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [reviewAction, setReviewAction] = useState<'approve' | 'reject' | 'supplement' | null>(null);
  const [reviewNotes, setReviewNotes] = useState('');

  useEffect(() => {
    loadApplications();
  }, [user, statusFilter]);

  async function loadApplications() {
    try {
      setLoading(true);
      const params: any = { certifierId: user?.id, page: 1, pageSize: 50 };
      if (statusFilter) params.status = statusFilter;
      const res = await api.getCertificationApplications(params);
      setApplications(res.items);
    } catch (error) {
      console.error('Failed to load applications:', error);
      showToast('error', '加载申请列表失败');
    } finally {
      setLoading(false);
    }
  }

  const filteredApplications = applications.filter(app =>
    app.applicationNo.toLowerCase().includes(searchQuery.toLowerCase())
  );

  function getCurrentStepIndex(status: string): number {
    return reviewSteps.findIndex(s => s.key === status);
  }

  async function handleReview(action: 'approve' | 'reject' | 'supplement') {
    if (!selectedApplication) return;
    
    if (action !== 'approve' && !reviewNotes.trim()) {
      showToast('warning', '请填写审核意见');
      return;
    }

    try {
      if (action === 'approve') {
        await api.updateCertificationApplication(selectedApplication.id, {
          status: 'approved',
          reviewNotes: reviewNotes || '审核通过',
        });
        await api.generateCertificate(selectedApplication.id);
        showToast('success', '认证已通过，证书已生成');
      } else if (action === 'reject') {
        await api.updateCertificationApplication(selectedApplication.id, {
          status: 'rejected',
          reviewNotes: reviewNotes,
        });
        showToast('success', '认证已驳回');
      } else {
        await api.updateCertificationApplication(selectedApplication.id, {
          status: 'reviewing',
          reviewNotes: reviewNotes,
        });
        showToast('success', '已通知申请人补充材料');
      }
      
      setShowReviewModal(false);
      setReviewAction(null);
      setReviewNotes('');
      loadApplications();
    } catch (error: any) {
      showToast('error', error.response?.data?.message || '操作失败');
    }
  }

  function openReviewModal(application: CertificationApplication, action: 'approve' | 'reject' | 'supplement') {
    setSelectedApplication(application);
    setReviewAction(action);
    setReviewNotes('');
    setShowReviewModal(true);
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">认证审核</h1>
          <p className="mt-1 text-sm text-gray-500">审核认证申请，处理认证流程</p>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4">
        <div className="flex flex-col lg:flex-row gap-3">
          <div className="flex-1 relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="搜索申请编号..."
              className="input-field pl-12"
            />
          </div>
          <div className="relative">
            <button
              onClick={() => setShowStatusDropdown(!showStatusDropdown)}
              className="btn-secondary flex items-center gap-2 w-full lg:w-auto justify-center"
            >
              <Filter className="w-4 h-4" />
              {statusFilterOptions.find(o => o.value === statusFilter)?.label || '筛选状态'}
              <ChevronDown className="w-4 h-4" />
            </button>
            <AnimatePresence>
              {showStatusDropdown && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="absolute right-0 top-full mt-2 w-40 bg-white rounded-xl shadow-lg border border-gray-100 py-2 z-10"
                >
                  {statusFilterOptions.map((option) => (
                    <button
                      key={option.value}
                      onClick={() => {
                        setStatusFilter(option.value);
                        setShowStatusDropdown(false);
                      }}
                      className={`w-full px-4 py-2 text-left text-sm hover:bg-gray-50 transition-colors ${
                        statusFilter === option.value ? 'text-green-600 bg-green-50' : 'text-gray-700'
                      }`}
                    >
                      {option.label}
                    </button>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        {loading ? (
          <div className="p-8">
            <div className="space-y-4">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="h-32 bg-gray-100 rounded-xl animate-pulse" />
              ))}
            </div>
          </div>
        ) : filteredApplications.length === 0 ? (
          <div className="text-center py-16">
            <FileCheck className="w-16 h-16 mx-auto mb-4 text-gray-300" />
            <p className="text-gray-500 mb-2">暂无认证申请</p>
            <p className="text-sm text-gray-400">等待农户提交认证申请</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {filteredApplications.map((application, index) => (
              <motion.div
                key={application.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                className="p-6 hover:bg-gray-50 transition-colors"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-start gap-4">
                    <div className="w-14 h-14 bg-gradient-to-br from-amber-100 to-yellow-100 rounded-2xl flex items-center justify-center">
                      <FileCheck className="w-7 h-7 text-amber-600" />
                    </div>
                    <div>
                      <div className="flex items-center gap-3 mb-1">
                        <p className="font-bold text-gray-900 text-lg">{application.applicationNo}</p>
                        <StatusBadge
                          status={application.certType}
                          customColors={certTypeColors}
                          label={certTypeLabels[application.certType]}
                        />
                        <StatusBadge
                          status={application.status}
                          customColors={applicationStatusColors}
                          label={applicationStatusLabels[application.status]}
                        />
                      </div>
                      <div className="flex flex-wrap items-center gap-4 text-sm text-gray-500">
                        <span className="flex items-center gap-1">
                          <User className="w-4 h-4" />
                          寿光市绿源蔬菜种植专业合作社
                        </span>
                        <span className="flex items-center gap-1">
                          <MapPin className="w-4 h-4" />
                          山东省寿光市
                        </span>
                        <span className="flex items-center gap-1">
                          <Calendar className="w-4 h-4" />
                          提交：{formatDate(application.submittedAt)}
                        </span>
                        <span className="flex items-center gap-1">
                          <Clock className="w-4 h-4" />
                          {formatRelativeTime(application.submittedAt)}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {(application.status === 'submitted' || application.status === 'reviewing') && (
                      <>
                        <button
                          onClick={() => openReviewModal(application, 'supplement')}
                          className="px-4 py-2 bg-yellow-100 text-yellow-700 rounded-xl text-sm font-medium hover:bg-yellow-200 transition-colors flex items-center gap-2"
                        >
                          <AlertCircle className="w-4 h-4" />
                          补充材料
                        </button>
                        <button
                          onClick={() => openReviewModal(application, 'reject')}
                          className="px-4 py-2 bg-red-100 text-red-700 rounded-xl text-sm font-medium hover:bg-red-200 transition-colors flex items-center gap-2"
                        >
                          <XCircle className="w-4 h-4" />
                          驳回
                        </button>
                        <button
                          onClick={() => openReviewModal(application, 'approve')}
                          className="px-4 py-2 bg-green-600 text-white rounded-xl text-sm font-medium hover:bg-green-700 transition-colors flex items-center gap-2"
                        >
                          <CheckCircle className="w-4 h-4" />
                          通过
                        </button>
                      </>
                    )}
                    <button
                      onClick={() => {
                        setSelectedApplication(application);
                        setShowReviewModal(true);
                      }}
                      className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                    >
                      <ChevronRight className="w-5 h-5 text-gray-400" />
                    </button>
                  </div>
                </div>

                <div className="ml-18">
                  <div className="flex items-center gap-2">
                    {reviewSteps.map((step, stepIndex) => {
                      const currentIndex = getCurrentStepIndex(application.status);
                      const isCompleted = stepIndex <= currentIndex;
                      const isCurrent = stepIndex === currentIndex;
                      
                      return (
                        <div key={step.key} className="flex items-center">
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                            isCompleted
                              ? 'bg-green-600 text-white'
                              : isCurrent
                              ? 'bg-amber-500 text-white animate-pulse'
                              : 'bg-gray-200 text-gray-500'
                          }`}>
                            {isCompleted ? <CheckCircle className="w-4 h-4" /> : stepIndex + 1}
                          </div>
                          <span className={`ml-2 text-sm ${
                            isCompleted ? 'text-green-700 font-medium' :
                            isCurrent ? 'text-amber-700 font-medium' : 'text-gray-400'
                          }`}>
                            {step.label}
                          </span>
                          {stepIndex < reviewSteps.length - 1 && (
                            <div className={`w-12 h-1 mx-2 rounded-full ${
                              stepIndex < currentIndex ? 'bg-green-500' : 'bg-gray-200'
                            }`} />
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>

                {application.materials.length > 0 && (
                  <div className="mt-4 ml-18">
                    <p className="text-sm font-medium text-gray-700 mb-2">申请材料：</p>
                    <div className="flex flex-wrap gap-2">
                      {application.materials.map((material, idx) => (
                        <div
                          key={idx}
                          className="flex items-center gap-2 px-3 py-1.5 bg-gray-100 rounded-lg text-sm text-gray-700 hover:bg-gray-200 cursor-pointer transition-colors"
                        >
                          <FileText className="w-4 h-4 text-gray-500" />
                          {material.name}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </motion.div>
            ))}
          </div>
        )}
      </div>

      <Modal
        open={showReviewModal}
        onClose={() => {
          setShowReviewModal(false);
          setReviewAction(null);
          setReviewNotes('');
        }}
        title={
          reviewAction === 'approve' ? '通过认证' :
          reviewAction === 'reject' ? '驳回申请' :
          reviewAction === 'supplement' ? '要求补充材料' :
          '申请详情'
        }
        size="lg"
        footer={
          reviewAction ? (
            <>
              <ModalButton
                variant="secondary"
                onClick={() => {
                  setShowReviewModal(false);
                  setReviewAction(null);
                  setReviewNotes('');
                }}
              >
                取消
              </ModalButton>
              <ModalButton
                variant={reviewAction === 'approve' ? 'primary' : reviewAction === 'reject' ? 'danger' : 'secondary'}
                onClick={() => handleReview(reviewAction)}
              >
                {reviewAction === 'approve' ? '确认通过' :
                 reviewAction === 'reject' ? '确认驳回' : '发送通知'}
              </ModalButton>
            </>
          ) : null
        }
      >
        {selectedApplication && (
          <div className="space-y-6">
            <div className="flex items-center gap-4 p-5 bg-amber-50 rounded-2xl">
              <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center">
                <FileCheck className="w-8 h-8 text-amber-600" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-gray-900">{selectedApplication.applicationNo}</h3>
                <div className="flex items-center gap-2 mt-2">
                  <StatusBadge
                    status={selectedApplication.certType}
                    customColors={certTypeColors}
                    label={certTypeLabels[selectedApplication.certType]}
                  />
                  <StatusBadge
                    status={selectedApplication.status}
                    customColors={applicationStatusColors}
                    label={applicationStatusLabels[selectedApplication.status]}
                  />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="p-4 bg-gray-50 rounded-xl">
                <div className="flex items-center gap-2 text-gray-500 mb-1">
                  <User className="w-4 h-4" />
                  <span className="text-xs">申请人</span>
                </div>
                <p className="font-medium">寿光市绿源蔬菜种植专业合作社</p>
              </div>
              <div className="p-4 bg-gray-50 rounded-xl">
                <div className="flex items-center gap-2 text-gray-500 mb-1">
                  <MapPin className="w-4 h-4" />
                  <span className="text-xs">产地</span>
                </div>
                <p className="font-medium">山东省寿光市</p>
              </div>
              <div className="p-4 bg-gray-50 rounded-xl">
                <div className="flex items-center gap-2 text-gray-500 mb-1">
                  <Calendar className="w-4 h-4" />
                  <span className="text-xs">提交时间</span>
                </div>
                <p className="font-medium">{formatDateTime(selectedApplication.submittedAt)}</p>
              </div>
              <div className="p-4 bg-gray-50 rounded-xl">
                <div className="flex items-center gap-2 text-gray-500 mb-1">
                  <FileText className="w-4 h-4" />
                  <span className="text-xs">材料数量</span>
                </div>
                <p className="font-medium">{selectedApplication.materials.length} 份</p>
              </div>
            </div>

            <div>
              <h4 className="font-medium text-gray-900 mb-3">申请材料</h4>
              <div className="space-y-2">
                {selectedApplication.materials.map((material, idx) => (
                  <div
                    key={idx}
                    className="flex items-center justify-between p-4 bg-gray-50 rounded-xl hover:bg-gray-100 cursor-pointer transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center">
                        <FileText className="w-5 h-5 text-amber-500" />
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">{material.name}</p>
                        <p className="text-xs text-gray-500">点击查看详情</p>
                      </div>
                    </div>
                    <ChevronRight className="w-5 h-5 text-gray-400" />
                  </div>
                ))}
              </div>
            </div>

            {reviewAction && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <MessageSquare className="w-4 h-4 inline mr-1" />
                  审核意见
                  {reviewAction !== 'approve' && <span className="text-red-500">*</span>}
                </label>
                <textarea
                  value={reviewNotes}
                  onChange={(e) => setReviewNotes(e.target.value)}
                  rows={4}
                  placeholder={
                    reviewAction === 'approve'
                      ? '请输入审核意见（可选）...'
                      : reviewAction === 'reject'
                      ? '请输入驳回原因...'
                      : '请说明需要补充的材料...'
                  }
                  className="input-field resize-none"
                />
              </div>
            )}

            {!reviewAction && (selectedApplication.status === 'submitted' || selectedApplication.status === 'reviewing') && (
              <div className="flex gap-3 pt-4 border-t border-gray-100">
                <button
                  onClick={() => setReviewAction('supplement')}
                  className="flex-1 py-3 bg-yellow-100 text-yellow-700 rounded-xl font-medium hover:bg-yellow-200 transition-colors flex items-center justify-center gap-2"
                >
                  <AlertCircle className="w-5 h-5" />
                  要求补充材料
                </button>
                <button
                  onClick={() => setReviewAction('reject')}
                  className="flex-1 py-3 bg-red-100 text-red-700 rounded-xl font-medium hover:bg-red-200 transition-colors flex items-center justify-center gap-2"
                >
                  <XCircle className="w-5 h-5" />
                  驳回申请
                </button>
                <button
                  onClick={() => setReviewAction('approve')}
                  className="flex-1 py-3 bg-green-600 text-white rounded-xl font-medium hover:bg-green-700 transition-colors flex items-center justify-center gap-2"
                >
                  <CheckCircle className="w-5 h-5" />
                  通过认证
                </button>
              </div>
            )}
          </div>
        )}
      </Modal>
    </div>
  );
}
