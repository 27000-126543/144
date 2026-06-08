import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Package, Search, Filter, ChevronDown, Eye, Calendar, Hash, Leaf, MapPin, CheckCircle, AlertTriangle, XCircle, ChevronRight } from 'lucide-react';
import { api } from '../../services/api';
import { useAuthStore } from '../../store/authStore';
import { useToast } from '../../components/ui/MessageToast';
import { Modal } from '../../components/ui/Modal';
import { StatusBadge } from '../../components/ui/StatusBadge';
import { formatDate, formatWeight, formatCurrency, formatNumber } from '../../utils/format';
import { Batch, BatchStatus } from '../../types';

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

const statusOptions = [
  { value: '', label: '全部状态' },
  { value: 'purchased', label: '已收购' },
  { value: 'precheck_pass', label: '预检通过' },
  { value: 'precheck_warning', label: '预检预警' },
  { value: 'precheck_fail', label: '预检不合格' },
  { value: 'inspected', label: '已检测' },
  { value: 'certified', label: '已认证' },
];

export default function BuyerBatches() {
  const { user } = useAuthStore();
  const { showToast } = useToast();
  const [batches, setBatches] = useState<Batch[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<BatchStatus | ''>('');
  const [showFilterDropdown, setShowFilterDropdown] = useState(false);
  const [selectedBatch, setSelectedBatch] = useState<Batch | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [expandedBatchId, setExpandedBatchId] = useState<string | null>(null);

  useEffect(() => {
    loadBatches();
  }, [user, statusFilter]);

  async function loadBatches() {
    try {
      setLoading(true);
      const params: any = { buyerId: user?.id, page: 1, pageSize: 20 };
      if (statusFilter) params.status = statusFilter;
      const res = await api.getBatches(params);
      setBatches(res.items);
    } catch (error) {
      console.error('Failed to load batches:', error);
      showToast('error', '加载批次列表失败');
    } finally {
      setLoading(false);
    }
  }

  const filteredBatches = batches.filter(batch =>
    batch.batchNo.toLowerCase().includes(searchQuery.toLowerCase())
  );

  function getPrecheckIcon(status: string) {
    switch (status) {
      case 'pass': return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'warning': return <AlertTriangle className="w-4 h-4 text-yellow-500" />;
      case 'fail': return <XCircle className="w-4 h-4 text-red-500" />;
      default: return null;
    }
  }

  function getPrecheckLabel(status: string) {
    switch (status) {
      case 'pass': return '通过';
      case 'warning': return '预警';
      case 'fail': return '不合格';
      default: return '待检';
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">批次管理</h1>
          <p className="mt-1 text-sm text-gray-500">查看和管理所有收购批次</p>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="flex-1 relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="搜索批次号..."
              className="input-field pl-12"
            />
          </div>
          <div className="relative">
            <button
              onClick={() => setShowFilterDropdown(!showFilterDropdown)}
              className="btn-secondary flex items-center gap-2 w-full sm:w-auto justify-center"
            >
              <Filter className="w-4 h-4" />
              {statusOptions.find(o => o.value === statusFilter)?.label || '筛选状态'}
              <ChevronDown className="w-4 h-4" />
            </button>
            <AnimatePresence>
              {showFilterDropdown && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="absolute right-0 top-full mt-2 w-48 bg-white rounded-xl shadow-lg border border-gray-100 py-2 z-10"
                >
                  {statusOptions.map((option) => (
                    <button
                      key={option.value}
                      onClick={() => {
                        setStatusFilter(option.value as BatchStatus | '');
                        setShowFilterDropdown(false);
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
                <div key={i} className="h-20 bg-gray-100 rounded-xl animate-pulse" />
              ))}
            </div>
          </div>
        ) : filteredBatches.length === 0 ? (
          <div className="text-center py-16">
            <Package className="w-16 h-16 mx-auto mb-4 text-gray-300" />
            <p className="text-gray-500 mb-2">暂无批次数据</p>
            <p className="text-sm text-gray-400">请先进行扫码收购</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {filteredBatches.map((batch) => (
              <div key={batch.id}>
                <div
                  className="p-5 hover:bg-gray-50 cursor-pointer transition-colors"
                  onClick={() => setExpandedBatchId(expandedBatchId === batch.id ? null : batch.id)}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center">
                        <Package className="w-6 h-6 text-green-600" />
                      </div>
                      <div>
                        <div className="flex items-center gap-3">
                          <p className="font-semibold text-gray-900">{batch.batchNo}</p>
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
                        </div>
                        <p className="text-sm text-gray-500 mt-1">
                          {formatDate(batch.purchaseDate)} · {formatWeight(batch.quantity)} · {formatCurrency(batch.unitPrice)}/kg · {formatCurrency(batch.totalAmount)}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedBatch(batch);
                          setShowDetailModal(true);
                        }}
                        className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                      >
                        <Eye className="w-5 h-5 text-gray-400" />
                      </button>
                      <ChevronRight className={`w-5 h-5 text-gray-400 transition-transform ${expandedBatchId === batch.id ? 'rotate-90' : ''}`} />
                    </div>
                  </div>
                </div>

                <AnimatePresence>
                  {expandedBatchId === batch.id && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      className="overflow-hidden bg-gray-50"
                    >
                      <div className="p-5 border-t border-gray-100">
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
                          <div className="p-4 bg-white rounded-xl">
                            <div className="flex items-center gap-2 text-gray-500 mb-2">
                              <Hash className="w-4 h-4" />
                              <span className="text-sm">批次号</span>
                            </div>
                            <p className="font-mono font-medium">{batch.batchNo}</p>
                          </div>
                          <div className="p-4 bg-white rounded-xl">
                            <div className="flex items-center gap-2 text-gray-500 mb-2">
                              <Calendar className="w-4 h-4" />
                              <span className="text-sm">收购日期</span>
                            </div>
                            <p className="font-medium">{formatDate(batch.purchaseDate)}</p>
                          </div>
                          <div className="p-4 bg-white rounded-xl">
                            <div className="flex items-center gap-2 text-gray-500 mb-2">
                              <Leaf className="w-4 h-4" />
                              <span className="text-sm">作物品种</span>
                            </div>
                            <p className="font-medium">西红柿</p>
                          </div>
                          <div className="p-4 bg-white rounded-xl">
                            <div className="flex items-center gap-2 text-gray-500 mb-2">
                              <Package className="w-4 h-4" />
                              <span className="text-sm">收购重量</span>
                            </div>
                            <p className="font-medium">{formatWeight(batch.quantity)}</p>
                          </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                          <div className="p-4 bg-green-50 rounded-xl">
                            <div className="flex items-center gap-2 text-green-600 mb-2">
                              <span className="text-sm font-medium">单价</span>
                            </div>
                            <p className="text-2xl font-bold text-green-600">{formatCurrency(batch.unitPrice)}/kg</p>
                          </div>
                          <div className="p-4 bg-emerald-50 rounded-xl">
                            <div className="flex items-center gap-2 text-emerald-600 mb-2">
                              <span className="text-sm font-medium">总金额</span>
                            </div>
                            <p className="text-2xl font-bold text-emerald-600">{formatCurrency(batch.totalAmount)}</p>
                          </div>
                        </div>

                        <div className="p-4 bg-white rounded-xl">
                          <h4 className="font-medium text-gray-900 mb-3">预检详情</h4>
                          {batch.precheckDetails ? (
                            <div className="space-y-2">
                              {batch.precheckDetails.pesticideResidue.map((item, index) => (
                                <div
                                  key={index}
                                  className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                                >
                                  <div className="flex items-center gap-3">
                                    {getPrecheckIcon(item.result === 'normal' ? 'pass' : item.result === 'warning' ? 'warning' : 'fail')}
                                    <span className="font-medium">{item.item}</span>
                                  </div>
                                  <div className="flex items-center gap-4">
                                    <span className="text-sm text-gray-600">
                                      {formatNumber(item.value)} / {item.standard}
                                    </span>
                                    <span className={`text-sm font-medium ${
                                      item.result === 'normal' ? 'text-green-600' :
                                      item.result === 'warning' ? 'text-yellow-600' : 'text-red-600'
                                    }`}>
                                      {getPrecheckLabel(item.result === 'normal' ? 'pass' : item.result === 'warning' ? 'warning' : 'fail')}
                                    </span>
                                  </div>
                                </div>
                              ))}
                            </div>
                          ) : (
                            <p className="text-gray-500 text-sm">暂无预检详情</p>
                          )}
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            ))}
          </div>
        )}
      </div>

      <Modal
        open={showDetailModal}
        onClose={() => setShowDetailModal(false)}
        title="批次详情"
        size="lg"
      >
        {selectedBatch && (
          <div className="space-y-6">
            <div className="flex items-center gap-4 p-5 bg-green-50 rounded-2xl">
              <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center">
                <Package className="w-8 h-8 text-green-600" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-gray-900">{selectedBatch.batchNo}</h3>
                <div className="flex items-center gap-2 mt-2">
                  <StatusBadge
                    status={selectedBatch.precheckStatus}
                    customColors={{
                      pass: 'bg-green-100 text-green-800',
                      warning: 'bg-yellow-100 text-yellow-800',
                      fail: 'bg-red-100 text-red-800',
                      pending: 'bg-gray-100 text-gray-800',
                    }}
                  />
                  <StatusBadge
                    status={selectedBatch.status}
                    customColors={batchStatusColors}
                  />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="p-4 bg-gray-50 rounded-xl">
                <div className="flex items-center gap-2 text-gray-500 mb-1">
                  <Calendar className="w-4 h-4" />
                  <span className="text-xs">收购日期</span>
                </div>
                <p className="font-medium">{formatDate(selectedBatch.purchaseDate)}</p>
              </div>
              <div className="p-4 bg-gray-50 rounded-xl">
                <div className="flex items-center gap-2 text-gray-500 mb-1">
                  <Leaf className="w-4 h-4" />
                  <span className="text-xs">作物品种</span>
                </div>
                <p className="font-medium">西红柿</p>
              </div>
              <div className="p-4 bg-gray-50 rounded-xl">
                <div className="flex items-center gap-2 text-gray-500 mb-1">
                  <Package className="w-4 h-4" />
                  <span className="text-xs">收购重量</span>
                </div>
                <p className="font-medium">{formatWeight(selectedBatch.quantity)}</p>
              </div>
              <div className="p-4 bg-green-50 rounded-xl">
                <div className="flex items-center gap-2 text-green-600 mb-1">
                  <span className="text-xs font-medium">单价</span>
                </div>
                <p className="font-medium text-green-600">{formatCurrency(selectedBatch.unitPrice)}/kg</p>
              </div>
            </div>

            <div className="p-4 bg-emerald-50 rounded-xl">
              <div className="flex justify-between items-center">
                <span className="text-emerald-600 font-medium">总金额</span>
                <span className="text-3xl font-bold text-emerald-600">{formatCurrency(selectedBatch.totalAmount)}</span>
              </div>
            </div>

            <div className="p-5 bg-blue-50 rounded-xl">
              <div className="flex items-start gap-3">
                <MapPin className="w-5 h-5 text-blue-600 mt-0.5" />
                <div>
                  <p className="font-medium text-gray-900">产地信息</p>
                  <p className="text-sm text-gray-600 mt-1">山东省寿光市蔬菜高科技示范园</p>
                </div>
              </div>
            </div>

            <div>
              <h4 className="font-medium text-gray-900 mb-3">农药残留检测</h4>
              <div className="space-y-2">
                {selectedBatch.precheckDetails?.pesticideResidue ? (
                  selectedBatch.precheckDetails.pesticideResidue.map((item, index) => (
                    <div
                      key={index}
                      className={`p-4 rounded-xl border ${
                        item.result === 'normal'
                          ? 'bg-green-50 border-green-100'
                          : item.result === 'warning'
                          ? 'bg-yellow-50 border-yellow-100'
                          : 'bg-red-50 border-red-100'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          {getPrecheckIcon(item.result === 'normal' ? 'pass' : item.result === 'warning' ? 'warning' : 'fail')}
                          <span className="font-medium">{item.item}</span>
                        </div>
                        <div className="text-right">
                          <p className="font-medium">
                            {formatNumber(item.value)} / {item.standard} {item.unit}
                          </p>
                          <p className={`text-sm ${
                            item.result === 'normal' ? 'text-green-600' :
                            item.result === 'warning' ? 'text-yellow-600' : 'text-red-600'
                          }`}>
                            {getPrecheckLabel(item.result === 'normal' ? 'pass' : item.result === 'warning' ? 'warning' : 'fail')}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-gray-500 text-sm text-center py-8">暂无检测数据</p>
                )}
              </div>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
