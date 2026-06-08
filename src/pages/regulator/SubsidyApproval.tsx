import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import {
  Search,
  Filter,
  FileText,
  User,
  MapPin,
  Calendar,
  CheckCircle,
  XCircle,
  ChevronDown,
  ChevronUp,
  DollarSign,
  Eye,
  Send,
  AlertCircle,
  Banknote,
  Clock,
} from 'lucide-react';
import { useRegulatorStore } from '../../store/regulatorStore';
import type { SubsidyApplication, User as UserType, Plot, PlantingInfo } from '../../types';
import { statusColors, subsidyStatusLabels } from '../../types';
import { formatDate, formatCurrency, formatNumber } from '../../utils/format';
import { Modal } from '../../components/ui/Modal';
import { api } from '../../services/api';
import { users as mockUsers } from '../../mock/data';

export default function SubsidyApproval() {
  const { subsidyApprovals, loading, fetchSubsidyApprovals, approveSubsidy } = useRegulatorStore();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [selectedApplication, setSelectedApplication] = useState<SubsidyApplication | null>(null);
  const [showApproveModal, setShowApproveModal] = useState(false);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [showPayModal, setShowPayModal] = useState(false);
  const [actualAmount, setActualAmount] = useState(0);
  const [remark, setRemark] = useState('');
  const [rejectReason, setRejectReason] = useState('');
  const [plots, setPlots] = useState<Plot[]>([]);
  const [plantings, setPlantings] = useState<PlantingInfo[]>([]);
  const [loadingRefData, setLoadingRefData] = useState(true);

  useEffect(() => {
    fetchSubsidyApprovals();
    loadReferenceData();
  }, [fetchSubsidyApprovals]);

  async function loadReferenceData() {
    try {
      setLoadingRefData(true);
      const [plotsRes, plantingsRes] = await Promise.all([
        api.getPlots({ page: 1, pageSize: 100 }),
        api.getPlantings({ page: 1, pageSize: 100 }),
      ]);
      setPlots(plotsRes.items);
      setPlantings(plantingsRes.items);
    } catch (error) {
      console.error('Failed to load reference data:', error);
    } finally {
      setLoadingRefData(false);
    }
  }

  function getFarmerName(farmerId: string): string {
    return mockUsers.find(u => u.id === farmerId)?.name || '未知农户';
  }

  function getPlotName(plantingId: string): string {
    const planting = plantings.find(p => p.id === plantingId);
    if (!planting) return '未知地块';
    const plot = plots.find(p => p.id === planting.plotId);
    return plot?.name || '未知地块';
  }

  const filteredApplications = subsidyApprovals.filter((a) => {
    const matchStatus = statusFilter === 'all' || a.status === statusFilter;
    const matchSearch = a.id.includes(searchTerm) || getFarmerName(a.farmerId).includes(searchTerm);
    return matchStatus && matchSearch;
  });

  const pendingCount = subsidyApprovals.filter((a) => a.status === 'submitted' || a.status === 'reviewing').length;

  const handleViewDetail = (application: SubsidyApplication) => {
    setSelectedApplication(application);
    setActualAmount(application.calculatedAmount);
    setShowApproveModal(true);
  };

  const handleApprove = async () => {
    if (!selectedApplication) return;

    try {
      await approveSubsidy(selectedApplication.id, {
        actualAmount,
        remark: remark || undefined,
      });

      setShowApproveModal(false);
      setShowPayModal(true);
      setRemark('');
    } catch (err) {
      console.error('审批失败', err);
    }
  };

  const handleReject = async () => {
    if (!selectedApplication || !rejectReason.trim()) return;

    try {
      await approveSubsidy(selectedApplication.id, {
        actualAmount: 0,
        remark: rejectReason,
      });

      setShowRejectModal(false);
      setRejectReason('');
      setSelectedApplication(null);
    } catch (err) {
      console.error('驳回失败', err);
    }
  };

  const handleConfirmPay = () => {
    setShowPayModal(false);
    setSelectedApplication(null);
  };

  const toggleExpand = (id: string) => {
    setExpandedId(expandedId === id ? null : id);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">补贴审批</h1>
          <p className="text-gray-500 mt-1">审核农户补贴申请，确保补贴资金合理发放</p>
        </div>
        {pendingCount > 0 && (
          <div className="flex items-center gap-2 px-4 py-2 bg-yellow-100 text-yellow-800 rounded-xl">
            <AlertCircle className="w-5 h-5" />
            <span className="font-medium">{pendingCount} 项待审批</span>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center">
              <FileText className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">申请总数</p>
              <p className="text-2xl font-bold text-gray-900">{subsidyApprovals.length}</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-yellow-100 rounded-xl flex items-center justify-center">
              <Clock className="w-5 h-5 text-yellow-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">待审批</p>
              <p className="text-2xl font-bold text-yellow-600">{pendingCount}</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-green-100 rounded-xl flex items-center justify-center">
              <CheckCircle className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">已通过</p>
              <p className="text-2xl font-bold text-green-600">
                {subsidyApprovals.filter((a) => a.status === 'approved' || a.status === 'paid').length}
              </p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-danger-100 rounded-xl flex items-center justify-center">
              <Banknote className="w-5 h-5 text-danger-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">已发放金额</p>
              <p className="text-2xl font-bold text-gray-900">
                {formatCurrency(
                  subsidyApprovals
                    .filter((a) => a.status === 'paid')
                    .reduce((acc, a) => acc + (a.actualAmount || 0), 0)
                )}
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-6">
          <div className="flex flex-col sm:flex-row gap-4 mb-6">
            <div className="flex-1 relative">
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="搜索申请编号或申请人..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-12 pr-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-agri-500 focus:border-transparent"
              />
            </div>
            <div className="sm:w-48">
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-agri-500 focus:border-transparent appearance-none bg-white"
              >
                <option value="all">全部状态</option>
                {Object.entries(subsidyStatusLabels).map(([value, label]) => (
                  <option key={value} value={value}>{label}</option>
                ))}
              </select>
            </div>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-20">
              <div className="animate-spin w-8 h-8 border-4 border-agri-500 border-t-transparent rounded-full" />
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-100">
                    <th className="text-left py-4 px-4 text-sm font-medium text-gray-500">申请编号</th>
                    <th className="text-left py-4 px-4 text-sm font-medium text-gray-500">申请人</th>
                    <th className="text-left py-4 px-4 text-sm font-medium text-gray-500">地块</th>
                    <th className="text-left py-4 px-4 text-sm font-medium text-gray-500">申请金额</th>
                    <th className="text-left py-4 px-4 text-sm font-medium text-gray-500">申请日期</th>
                    <th className="text-left py-4 px-4 text-sm font-medium text-gray-500">状态</th>
                    <th className="text-left py-4 px-4 text-sm font-medium text-gray-500">操作</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredApplications.map((app, index) => (
                    <motion.tr
                      key={app.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.05 }}
                      className="border-b border-gray-50 hover:bg-gray-50 transition-colors"
                    >
                      <td className="py-4 px-4">
                        <span className="font-mono text-sm text-gray-900">{app.id}</span>
                      </td>
                      <td className="py-4 px-4">
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 bg-agri-100 rounded-full flex items-center justify-center">
                            <User className="w-4 h-4 text-agri-600" />
                          </div>
                          <span className="text-gray-900">{getFarmerName(app.farmerId)}</span>
                        </div>
                      </td>
                      <td className="py-4 px-4">
                        <div className="flex items-center gap-1 text-gray-600">
                          <MapPin className="w-4 h-4" />
                          <span>{getPlotName(app.plantingId)}</span>
                        </div>
                      </td>
                      <td className="py-4 px-4">
                        <span className="font-semibold text-gray-900">{formatCurrency(app.calculatedAmount)}</span>
                      </td>
                      <td className="py-4 px-4">
                        <div className="flex items-center gap-1 text-gray-600">
                          <Calendar className="w-4 h-4" />
                          <span>{formatDate(app.applicationDate)}</span>
                        </div>
                      </td>
                      <td className="py-4 px-4">
                        <span className={`px-3 py-1 rounded-full text-xs font-medium ${statusColors[app.status]}`}>
                          {subsidyStatusLabels[app.status]}
                        </span>
                      </td>
                      <td className="py-4 px-4">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => toggleExpand(app.id)}
                            className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                          >
                            {expandedId === app.id ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                          </button>
                          {(app.status === 'submitted' || app.status === 'reviewing') && (
                            <>
                              <button
                                onClick={() => handleViewDetail(app)}
                                className="flex items-center gap-1 px-3 py-1.5 bg-agri-500 text-white rounded-lg hover:bg-agri-600 transition-colors text-sm font-medium"
                              >
                                <CheckCircle className="w-4 h-4" />
                                <span>审批</span>
                              </button>
                              <button
                                onClick={() => {
                                  setSelectedApplication(app);
                                  setShowRejectModal(true);
                                }}
                                className="flex items-center gap-1 px-3 py-1.5 bg-danger-500 text-white rounded-lg hover:bg-danger-600 transition-colors text-sm font-medium"
                              >
                                <XCircle className="w-4 h-4" />
                                <span>驳回</span>
                              </button>
                            </>
                          )}
                          {app.status === 'approved' && (
                            <button
                              onClick={() => {
                                setSelectedApplication(app);
                                setActualAmount(app.actualAmount || app.calculatedAmount);
                                setShowPayModal(true);
                              }}
                              className="flex items-center gap-1 px-3 py-1.5 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors text-sm font-medium"
                            >
                              <Banknote className="w-4 h-4" />
                              <span>打款</span>
                            </button>
                          )}
                        </div>
                      </td>
                    </motion.tr>
                  ))}
                </tbody>
              </table>

              {filteredApplications.length === 0 && (
                <div className="text-center py-16">
                  <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <FileText className="w-8 h-8 text-gray-400" />
                  </div>
                  <p className="text-gray-500">暂无补贴申请</p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      <Modal
        open={showApproveModal}
        onClose={() => setShowApproveModal(false)}
        title="审批补贴申请"
        size="lg"
      >
        {selectedApplication && (
          <div className="space-y-6">
            <div className="p-5 bg-gray-50 rounded-2xl">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-gray-900">申请信息</h3>
                <span className="font-mono text-sm text-gray-500">{selectedApplication.id}</span>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-500">申请人</p>
                  <p className="font-medium text-gray-900 mt-1">{getFarmerName(selectedApplication.farmerId)}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">地块</p>
                  <p className="font-medium text-gray-900 mt-1">{getPlotName(selectedApplication.plantingId)}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">种植面积</p>
                  <p className="font-medium text-gray-900 mt-1">{formatNumber(selectedApplication.area)} 亩</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">实际产量</p>
                  <p className="font-medium text-gray-900 mt-1">{formatNumber(selectedApplication.yieldAmount)} 公斤</p>
                </div>
              </div>
            </div>

            <div className="p-5 bg-agri-50 rounded-2xl border border-agri-100">
              <h3 className="font-semibold text-gray-900 mb-4">补贴计算明细</h3>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">面积补贴 ({formatNumber(selectedApplication.area)} 亩 × 150元/亩)</span>
                  <span className="font-medium text-gray-900">{formatCurrency(selectedApplication.area * 150)}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">产量补贴 ({formatNumber(selectedApplication.yieldAmount)} 公斤 × 0.5元/公斤)</span>
                  <span className="font-medium text-gray-900">{formatCurrency(selectedApplication.yieldAmount * 0.5)}</span>
                </div>
                <div className="border-t border-agri-200 pt-3 flex items-center justify-between">
                  <span className="font-semibold text-gray-900">计算金额</span>
                  <span className="text-xl font-bold text-agri-600">{formatCurrency(selectedApplication.calculatedAmount)}</span>
                </div>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <DollarSign className="w-4 h-4 inline mr-1" />
                实际发放金额
              </label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-500">¥</span>
                <input
                  type="number"
                  value={actualAmount}
                  onChange={(e) => setActualAmount(parseFloat(e.target.value) || 0)}
                  className="w-full pl-8 pr-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-agri-500 focus:border-transparent text-lg font-semibold"
                />
              </div>
              {actualAmount !== selectedApplication.calculatedAmount && (
                <p className="text-sm text-yellow-600 mt-2 flex items-center gap-1">
                  <AlertCircle className="w-4 h-4" />
                  实际金额与计算金额不一致，请在备注中说明原因
                </p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">审批备注</label>
              <textarea
                value={remark}
                onChange={(e) => setRemark(e.target.value)}
                placeholder="请输入审批备注（选填）..."
                rows={3}
                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-agri-500 focus:border-transparent resize-none"
              />
            </div>

            <div className="flex gap-3 pt-2">
              <button
                onClick={() => setShowApproveModal(false)}
                className="flex-1 px-4 py-3 border border-gray-200 rounded-xl font-medium text-gray-700 hover:bg-gray-50 transition-colors"
              >
                取消
              </button>
              <button
                onClick={handleApprove}
                className="flex-1 px-4 py-3 bg-agri-500 text-white rounded-xl font-medium hover:bg-agri-600 transition-colors shadow-lg shadow-agri-500/30 flex items-center justify-center gap-2"
              >
                <CheckCircle className="w-5 h-5" />
                <span>通过审批</span>
              </button>
            </div>
          </div>
        )}
      </Modal>

      <Modal
        open={showRejectModal}
        onClose={() => setShowRejectModal(false)}
        title="驳回补贴申请"
        size="md"
      >
        {selectedApplication && (
          <div className="space-y-4">
            <div className="p-4 bg-yellow-50 rounded-xl flex items-start gap-3">
              <AlertCircle className="w-6 h-6 text-yellow-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-medium text-yellow-800">驳回申请</p>
                <p className="text-sm text-yellow-700 mt-1">请填写驳回原因，申请人将收到通知</p>
              </div>
            </div>

            <div className="p-4 bg-gray-50 rounded-xl">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-500">申请编号</span>
                <span className="font-mono text-sm text-gray-900">{selectedApplication.id}</span>
              </div>
              <div className="flex items-center justify-between mt-2">
                <span className="text-sm text-gray-500">申请人</span>
                <span className="font-medium text-gray-900">{getFarmerName(selectedApplication.farmerId)}</span>
              </div>
              <div className="flex items-center justify-between mt-2">
                <span className="text-sm text-gray-500">申请金额</span>
                <span className="font-semibold text-gray-900">{formatCurrency(selectedApplication.calculatedAmount)}</span>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">驳回原因 *</label>
              <textarea
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                placeholder="请输入驳回原因..."
                rows={4}
                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-danger-500 focus:border-transparent resize-none"
              />
            </div>

            <div className="flex gap-3 pt-2">
              <button
                onClick={() => {
                  setShowRejectModal(false);
                  setRejectReason('');
                }}
                className="flex-1 px-4 py-3 border border-gray-200 rounded-xl font-medium text-gray-700 hover:bg-gray-50 transition-colors"
              >
                取消
              </button>
              <button
                onClick={handleReject}
                disabled={!rejectReason.trim()}
                className={`flex-1 px-4 py-3 rounded-xl font-medium transition-colors flex items-center justify-center gap-2 ${
                  rejectReason.trim()
                    ? 'bg-danger-500 text-white hover:bg-danger-600 shadow-lg shadow-danger-500/30'
                    : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                }`}
              >
                <XCircle className="w-5 h-5" />
                <span>确认驳回</span>
              </button>
            </div>
          </div>
        )}
      </Modal>

      <Modal
        open={showPayModal}
        onClose={() => setShowPayModal(false)}
        title="确认打款"
        size="md"
      >
        {selectedApplication && (
          <div className="space-y-4">
            <div className="p-6 bg-green-50 rounded-2xl text-center">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Banknote className="w-8 h-8 text-green-600" />
              </div>
              <p className="text-sm text-gray-500">发放金额</p>
              <p className="text-4xl font-bold text-green-600 mt-2">
                {formatCurrency(selectedApplication.actualAmount || selectedApplication.calculatedAmount)}
              </p>
              <p className="text-sm text-gray-500 mt-2">
                收款人: {getFarmerName(selectedApplication.farmerId)}
              </p>
            </div>

            <div className="p-4 bg-gray-50 rounded-xl">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-500">申请编号</span>
                <span className="font-mono text-sm text-gray-900">{selectedApplication.id}</span>
              </div>
              <div className="flex items-center justify-between mt-2">
                <span className="text-sm text-gray-500">补贴类型</span>
                <span className="font-medium text-gray-900">种植补贴</span>
              </div>
              <div className="flex items-center justify-between mt-2">
                <span className="text-sm text-gray-500">支付方式</span>
                <span className="font-medium text-gray-900">银行转账</span>
              </div>
            </div>

            <div className="flex gap-3 pt-2">
              <button
                onClick={() => setShowPayModal(false)}
                className="flex-1 px-4 py-3 border border-gray-200 rounded-xl font-medium text-gray-700 hover:bg-gray-50 transition-colors"
              >
                稍后处理
              </button>
              <button
                onClick={handleConfirmPay}
                className="flex-1 px-4 py-3 bg-blue-500 text-white rounded-xl font-medium hover:bg-blue-600 transition-colors shadow-lg shadow-blue-500/30 flex items-center justify-center gap-2"
              >
                <Send className="w-5 h-5" />
                <span>确认打款</span>
              </button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
