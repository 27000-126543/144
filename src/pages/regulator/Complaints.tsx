import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Search,
  Filter,
  AlertTriangle,
  Bug,
  ShieldX,
  HelpCircle,
  Clock,
  User,
  Phone,
  MapPin,
  FileText,
  Send,
  CheckCircle,
  XCircle,
  RotateCcw,
  ChevronDown,
  ChevronUp,
  MessageSquare,
  Download,
} from 'lucide-react';
import { useRegulatorStore } from '../../store/regulatorStore';
import type { Complaint, ComplaintType, ProcessingLog } from '../../types';
import { complaintTypeLabels, statusColors } from '../../types';
import { formatDate, formatDateTime } from '../../utils/format';
import { Modal } from '../../components/ui/Modal';

const statusLabels: Record<string, string> = {
  pending: '待分派',
  assigned: '已分派',
  processing: '处理中',
  resolved: '已解决',
  confirmed: '已确认',
  closed: '已结案',
};

const typeIcons: Record<ComplaintType, any> = {
  quality: AlertTriangle,
  pesticide: Bug,
  fake: ShieldX,
  other: HelpCircle,
};

const typeColors: Record<ComplaintType, string> = {
  quality: 'bg-orange-100 text-orange-600',
  pesticide: 'bg-green-100 text-green-600',
  fake: 'bg-red-100 text-red-600',
  other: 'bg-gray-100 text-gray-600',
};

export default function Complaints() {
  const { complaints, loading, fetchComplaints, updateComplaint } = useRegulatorStore();
  const [activeTab, setActiveTab] = useState<'all' | ComplaintType>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [selectedComplaint, setSelectedComplaint] = useState<Complaint | null>(null);
  const [showProcessModal, setShowProcessModal] = useState(false);
  const [processResult, setProcessResult] = useState('');
  const [processAction, setProcessAction] = useState<'process' | 'resolve' | 'close'>('process');

  useEffect(() => {
    fetchComplaints();
  }, [fetchComplaints]);

  const filteredComplaints = complaints.filter((c) => {
    const matchTab = activeTab === 'all' || c.type === activeTab;
    const matchStatus = statusFilter === 'all' || c.status === statusFilter;
    const matchSearch = c.complaintNo.includes(searchTerm) || c.consumerName.includes(searchTerm) || c.description.includes(searchTerm);
    return matchTab && matchStatus && matchSearch;
  });

  const tabs = [
    { key: 'all', label: '全部' },
    { key: 'quality', label: complaintTypeLabels.quality },
    { key: 'pesticide', label: complaintTypeLabels.pesticide },
    { key: 'fake', label: complaintTypeLabels.fake },
    { key: 'other', label: complaintTypeLabels.other },
  ];

  const handleAutoAssign = (complaint: Complaint) => {
    setSelectedComplaint(complaint);
    setProcessAction('process');
    setShowProcessModal(true);
  };

  const handleProcess = async () => {
    if (!selectedComplaint || !processResult.trim()) return;

    try {
      await updateComplaint(selectedComplaint.id, {
        status: processAction === 'close' ? 'closed' : processAction === 'resolve' ? 'resolved' : 'processing',
        processingLogs: [
          ...selectedComplaint.processingLogs,
          {
            action: processAction === 'close' ? 'close' : processAction === 'resolve' ? 'resolve' : 'process',
            remark: processResult,
            operator: '监管员',
            timestamp: new Date().toISOString(),
          },
        ],
        resolution: processAction === 'resolve' || processAction === 'close' ? processResult : selectedComplaint.resolution,
      });

      setShowProcessModal(false);
      setProcessResult('');
      setSelectedComplaint(null);
    } catch (err) {
      console.error('处理失败', err);
    }
  };

  const toggleExpand = (id: string) => {
    setExpandedId(expandedId === id ? null : id);
  };

  const getNextAction = (status: string) => {
    switch (status) {
      case 'pending':
        return { action: 'process', label: '受理并分派', icon: RotateCcw };
      case 'assigned':
        return { action: 'process', label: '开始处理', icon: RotateCcw };
      case 'processing':
        return { action: 'resolve', label: '标记解决', icon: CheckCircle };
      case 'resolved':
        return { action: 'close', label: '结案', icon: XCircle };
      default:
        return null;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">投诉处理</h1>
          <p className="text-gray-500 mt-1">处理消费者投诉，保障农产品质量安全</p>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="border-b border-gray-100">
          <div className="flex overflow-x-auto">
            {tabs.map((tab) => {
              const count = tab.key === 'all'
                ? complaints.length
                : complaints.filter((c) => c.type === tab.key).length;
              return (
                <button
                  key={tab.key}
                  onClick={() => setActiveTab(tab.key as any)}
                  className={`flex items-center gap-2 px-6 py-4 font-medium whitespace-nowrap border-b-2 transition-all ${
                    activeTab === tab.key
                      ? 'text-agri-600 border-agri-500 bg-agri-50/50'
                      : 'text-gray-500 border-transparent hover:text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  {tab.label}
                  <span className={`px-2 py-0.5 rounded-full text-xs ${
                    activeTab === tab.key ? 'bg-agri-100 text-agri-600' : 'bg-gray-100 text-gray-600'
                  }`}>
                    {count}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        <div className="p-6">
          <div className="flex flex-col sm:flex-row gap-4 mb-6">
            <div className="flex-1 relative">
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="搜索投诉编号、投诉人或描述..."
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
                {Object.entries(statusLabels).map(([value, label]) => (
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
            <div className="space-y-4">
              {filteredComplaints.map((complaint, index) => {
                const isExpanded = expandedId === complaint.id;
                const TypeIcon = typeIcons[complaint.type];
                const nextAction = getNextAction(complaint.status);

                return (
                  <motion.div
                    key={complaint.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className="border border-gray-100 rounded-2xl overflow-hidden hover:border-agri-200 transition-colors"
                  >
                    <div className="p-5">
                      <div className="flex items-start justify-between">
                        <div className="flex items-start gap-4">
                          <div className={`w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 ${typeColors[complaint.type]}`}>
                            <TypeIcon className="w-6 h-6" />
                          </div>
                          <div className="min-w-0">
                            <div className="flex items-center gap-3 flex-wrap">
                              <h3 className="font-semibold text-gray-900">{complaintTypeLabels[complaint.type]}</h3>
                              <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${statusColors[complaint.status]}`}>
                                {statusLabels[complaint.status]}
                              </span>
                              <span className="text-sm text-gray-500">{complaint.complaintNo}</span>
                            </div>
                            <p className="text-gray-600 mt-2 line-clamp-2">{complaint.description}</p>
                            <div className="flex items-center gap-4 mt-3 text-sm text-gray-500">
                              <div className="flex items-center gap-1">
                                <User className="w-4 h-4" />
                                <span>{complaint.consumerName}</span>
                              </div>
                              <div className="flex items-center gap-1">
                                <Phone className="w-4 h-4" />
                                <span>{complaint.consumerPhone}</span>
                              </div>
                              <div className="flex items-center gap-1">
                                <MapPin className="w-4 h-4" />
                                <span>{complaint.region}</span>
                              </div>
                              <div className="flex items-center gap-1">
                                <Clock className="w-4 h-4" />
                                <span>{formatDate(complaint.createdAt)}</span>
                              </div>
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 flex-shrink-0 ml-4">
                          {nextAction && complaint.status !== 'confirmed' && complaint.status !== 'closed' && (
                            <button
                              onClick={() => handleAutoAssign(complaint)}
                              className="flex items-center gap-2 px-4 py-2 bg-agri-500 text-white rounded-xl hover:bg-agri-600 transition-colors font-medium shadow-lg shadow-agri-500/30"
                            >
                              <nextAction.icon className="w-4 h-4" />
                              <span>{nextAction.label}</span>
                            </button>
                          )}
                          <button
                            onClick={() => toggleExpand(complaint.id)}
                            className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                          >
                            {isExpanded ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
                          </button>
                        </div>
                      </div>
                    </div>

                    <AnimatePresence>
                      {isExpanded && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: 'auto', opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          transition={{ duration: 0.2 }}
                          className="overflow-hidden"
                        >
                          <div className="px-5 pb-5 border-t border-gray-100">
                            <div className="pt-4">
                              <div className="flex items-center gap-2 mb-4">
                                <MessageSquare className="w-5 h-5 text-gray-400" />
                                <h4 className="font-semibold text-gray-900">处理记录</h4>
                              </div>
                              <div className="relative pl-8 space-y-0">
                                {complaint.processingLogs.map((log, logIndex) => (
                                  <div key={logIndex} className="relative pb-6 last:pb-0">
                                    {logIndex < complaint.processingLogs.length - 1 && (
                                      <div className="absolute left-[-1.5rem] top-4 w-0.5 h-full bg-gray-200" />
                                    )}
                                    <div className={`absolute left-[-1.5rem] top-1 w-6 h-6 rounded-full border-2 border-white ${
                                      log.action === 'create' ? 'bg-blue-500' :
                                      log.action === 'assign' ? 'bg-yellow-500' :
                                      log.action === 'process' ? 'bg-purple-500' :
                                      log.action === 'resolve' ? 'bg-green-500' :
                                      'bg-gray-500'
                                    }`}>
                                      <div className="w-full h-full rounded-full flex items-center justify-center">
                                        {log.action === 'create' && <FileText className="w-3 h-3 text-white" />}
                                        {log.action === 'assign' && <User className="w-3 h-3 text-white" />}
                                        {log.action === 'process' && <RotateCcw className="w-3 h-3 text-white" />}
                                        {log.action === 'resolve' && <CheckCircle className="w-3 h-3 text-white" />}
                                        {log.action === 'close' && <XCircle className="w-3 h-3 text-white" />}
                                      </div>
                                    </div>
                                    <div className="bg-gray-50 rounded-xl p-4">
                                      <div className="flex items-center justify-between mb-2">
                                        <span className="font-medium text-gray-900">
                                          {log.action === 'create' ? '投诉提交' :
                                           log.action === 'assign' ? '分派处理' :
                                           log.action === 'process' ? '处理中' :
                                           log.action === 'resolve' ? '已解决' : '已结案'}
                                        </span>
                                        <span className="text-sm text-gray-500">{formatDateTime(log.timestamp)}</span>
                                      </div>
                                      <p className="text-gray-600">{log.remark}</p>
                                      <p className="text-sm text-gray-500 mt-2">操作人: {log.operator}</p>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>

                            {complaint.images.length > 0 && (
                              <div className="mt-6 pt-4 border-t border-gray-100">
                                <h4 className="font-semibold text-gray-900 mb-3">投诉凭证</h4>
                                <div className="flex gap-3 flex-wrap">
                                  {complaint.images.map((img, idx) => (
                                    <div key={idx} className="w-24 h-24 bg-gray-100 rounded-xl overflow-hidden">
                                      <img src={img} alt={`投诉凭证${idx + 1}`} className="w-full h-full object-cover" />
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}

                            {complaint.resolution && (
                              <div className="mt-6 pt-4 border-t border-gray-100">
                                <div className="flex items-center gap-2 mb-3">
                                  <CheckCircle className="w-5 h-5 text-green-500" />
                                  <h4 className="font-semibold text-gray-900">处理结果</h4>
                                </div>
                                <div className="p-4 bg-green-50 rounded-xl border border-green-100">
                                  <p className="text-green-800">{complaint.resolution}</p>
                                </div>
                              </div>
                            )}
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </motion.div>
                );
              })}

              {filteredComplaints.length === 0 && (
                <div className="text-center py-16">
                  <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <MessageSquare className="w-8 h-8 text-gray-400" />
                  </div>
                  <p className="text-gray-500">暂无投诉记录</p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      <Modal
        open={showProcessModal}
        onClose={() => setShowProcessModal(false)}
        title={
          processAction === 'close' ? '结案处理' :
          processAction === 'resolve' ? '标记解决' : '受理投诉'
        }
        size="md"
      >
        <div className="space-y-4">
          {selectedComplaint && (
            <div className="p-4 bg-gray-50 rounded-xl">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-sm text-gray-500">投诉编号:</span>
                <span className="font-medium text-gray-900">{selectedComplaint.complaintNo}</span>
              </div>
              <p className="text-gray-600 text-sm">{selectedComplaint.description}</p>
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {processAction === 'close' ? '结案说明' :
               processAction === 'resolve' ? '解决方案' : '处理意见'}
            </label>
            <textarea
              value={processResult}
              onChange={(e) => setProcessResult(e.target.value)}
              placeholder={
                processAction === 'close' ? '请输入结案说明...' :
                processAction === 'resolve' ? '请输入解决方案...' : '请输入处理意见...'
              }
              rows={4}
              className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-agri-500 focus:border-transparent resize-none"
            />
          </div>

          <div className="flex gap-3 pt-2">
            <button
              onClick={() => setShowProcessModal(false)}
              className="flex-1 px-4 py-3 border border-gray-200 rounded-xl font-medium text-gray-700 hover:bg-gray-50 transition-colors"
            >
              取消
            </button>
            <button
              onClick={handleProcess}
              disabled={!processResult.trim()}
              className={`flex-1 px-4 py-3 rounded-xl font-medium transition-colors flex items-center justify-center gap-2 ${
                processResult.trim()
                  ? 'bg-agri-500 text-white hover:bg-agri-600 shadow-lg shadow-agri-500/30'
                  : 'bg-gray-100 text-gray-400 cursor-not-allowed'
              }`}
            >
              <Send className="w-4 h-4" />
              <span>
                {processAction === 'close' ? '确认结案' :
                 processAction === 'resolve' ? '确认解决' : '确认受理'}
              </span>
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
