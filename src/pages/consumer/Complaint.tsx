import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  AlertTriangle,
  Bug,
  ShieldX,
  HelpCircle,
  Upload,
  X,
  Send,
  CheckCircle,
  FileText,
  ArrowLeft,
  Search,
  Clock,
  User,
  Phone,
  MapPin,
  QrCode,
} from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';
import { api } from '../../services/api';
import type { ComplaintType } from '../../types';
import { complaintTypeLabels } from '../../types';
import { formatDateTime } from '../../utils/format';
import { Modal } from '../../components/ui/Modal';

const typeIcons: Record<ComplaintType, any> = {
  quality: AlertTriangle,
  pesticide: Bug,
  fake: ShieldX,
  other: HelpCircle,
};

const typeColors: Record<ComplaintType, string> = {
  quality: 'bg-orange-100 text-orange-600 border-orange-200',
  pesticide: 'bg-green-100 text-green-600 border-green-200',
  fake: 'bg-red-100 text-red-600 border-red-200',
  other: 'bg-gray-100 text-gray-600 border-gray-200',
};

const typeSelectedColors: Record<ComplaintType, string> = {
  quality: 'bg-orange-500 text-white border-orange-500',
  pesticide: 'bg-green-500 text-white border-green-500',
  fake: 'bg-red-500 text-white border-red-500',
  other: 'bg-gray-500 text-white border-gray-500',
};

interface ComplaintReceipt {
  complaintNo: string;
  type: ComplaintType;
  description: string;
  consumerName: string;
  consumerPhone: string;
  traceCode: string;
  region: string;
  submittedAt: string;
  estimatedTime: string;
}

export default function ConsumerComplaint() {
  const navigate = useNavigate();
  const location = useLocation();
  const [selectedType, setSelectedType] = useState<ComplaintType | null>(null);
  const [description, setDescription] = useState('');
  const [consumerName, setConsumerName] = useState('');
  const [consumerPhone, setConsumerPhone] = useState('');
  const [region, setRegion] = useState('');
  const [traceCode, setTraceCode] = useState('');
  const [images, setImages] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [showReceipt, setShowReceipt] = useState(false);
  const [receipt, setReceipt] = useState<ComplaintReceipt | null>(null);
  const [queryCode, setQueryCode] = useState('');
  const [showQuery, setShowQuery] = useState(false);
  const [queryResult, setQueryResult] = useState<any>(null);

  useEffect(() => {
    if (location.state?.traceCode) {
      setTraceCode(location.state.traceCode);
    }
  }, [location.state]);

  const handleImageUpload = () => {
    const newImages = [...images, `https://picsum.photos/200/200?random=${Date.now()}`];
    setImages(newImages);
  };

  const removeImage = (index: number) => {
    setImages(images.filter((_, i) => i !== index));
  };

  const handleSubmit = async () => {
    if (!selectedType || !description.trim() || !consumerName.trim() || !consumerPhone.trim() || !region.trim()) {
      return;
    }

    setLoading(true);
    try {
      const result = await api.createComplaint({
        type: selectedType,
        description: description.trim(),
        consumerName: consumerName.trim(),
        consumerPhone: consumerPhone.trim(),
        region: region.trim(),
        traceCode: traceCode.trim() || undefined,
        images,
      });

      setReceipt({
        complaintNo: result.complaintNo,
        type: selectedType,
        description: description.trim(),
        consumerName: consumerName.trim(),
        consumerPhone: consumerPhone.trim(),
        traceCode: traceCode.trim(),
        region: region.trim(),
        submittedAt: new Date().toISOString(),
        estimatedTime: '3个工作日内',
      });

      setShowReceipt(true);
    } catch (err) {
      console.error('提交投诉失败', err);
    } finally {
      setLoading(false);
    }
  };

  const handleQueryProgress = async () => {
    if (!queryCode.trim()) return;

    try {
      const result = await api.traceByCode(queryCode.trim());
      setQueryResult({
        complaintNo: queryCode.trim(),
        status: 'processing',
        type: 'quality',
        description: '发现农产品有质量问题',
        submittedAt: '2024-01-15T10:30:00Z',
        processingLogs: [
          { action: 'create', description: '投诉已提交', operator: '系统', timestamp: '2024-01-15T10:30:00Z' },
          { action: 'assign', description: '已分派至监管员处理', operator: '系统', timestamp: '2024-01-15T11:00:00Z' },
          { action: 'process', description: '正在调查核实相关情况', operator: '监管员A', timestamp: '2024-01-16T09:00:00Z' },
        ],
      });
    } catch (err) {
      setQueryResult(null);
      alert('未找到该投诉记录，请检查投诉编号是否正确');
    }
  };

  const resetForm = () => {
    setSelectedType(null);
    setDescription('');
    setConsumerName('');
    setConsumerPhone('');
    setRegion('');
    setTraceCode('');
    setImages([]);
    setShowReceipt(false);
    setReceipt(null);
  };

  const statusLabels: Record<string, string> = {
    pending: '待分派',
    assigned: '已分派',
    processing: '处理中',
    resolved: '已解决',
    confirmed: '已确认',
    closed: '已结案',
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
      <div className="max-w-2xl mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-8">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center gap-2 text-gray-600 hover:text-agri-600 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
            <span>返回</span>
          </button>
          <button
            onClick={() => setShowQuery(!showQuery)}
            className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors"
          >
            <Search className="w-4 h-4" />
            <span>查询进度</span>
          </button>
        </div>

        <AnimatePresence mode="wait">
          {showQuery ? (
            <motion.div
              key="query"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-6"
            >
              <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-center mb-8"
              >
                <h1 className="text-2xl font-bold text-gray-900 mb-2">投诉进度查询</h1>
                <p className="text-gray-500">输入投诉编号，查询处理进度</p>
              </motion.div>

              <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
                <div className="relative mb-4">
                  <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="text"
                    value={queryCode}
                    onChange={(e) => setQueryCode(e.target.value)}
                    placeholder="请输入投诉编号"
                    className="w-full pl-12 pr-4 py-4 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-agri-500 focus:border-transparent"
                  />
                </div>
                <button
                  onClick={handleQueryProgress}
                  disabled={!queryCode.trim()}
                  className="w-full py-4 bg-gradient-to-r from-agri-500 to-agri-600 text-white font-semibold rounded-xl hover:from-agri-600 hover:to-agri-700 transition-all shadow-lg shadow-agri-500/30 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  <Search className="w-5 h-5" />
                  <span>查询进度</span>
                </button>
              </div>

              {queryResult && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100"
                >
                  <div className="flex items-center justify-between mb-6">
                    <div>
                      <p className="text-sm text-gray-500">投诉编号</p>
                      <p className="font-mono text-lg font-bold text-gray-900">{queryResult.complaintNo}</p>
                    </div>
                    <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                      queryResult.status === 'resolved' ? 'bg-green-100 text-green-700' :
                      queryResult.status === 'processing' ? 'bg-blue-100 text-blue-700' :
                      'bg-yellow-100 text-yellow-700'
                    }`}>
                      {statusLabels[queryResult.status]}
                    </span>
                  </div>

                  <div className="mb-6">
                    <p className="text-sm text-gray-500 mb-2">投诉类型</p>
                    <p className="font-medium text-gray-900">{complaintTypeLabels[queryResult.type]}</p>
                  </div>

                  <div className="mb-6">
                    <p className="text-sm text-gray-500 mb-2">投诉描述</p>
                    <p className="text-gray-700">{queryResult.description}</p>
                  </div>

                  <div>
                    <p className="text-sm text-gray-500 mb-4">处理记录</p>
                    <div className="relative pl-8 space-y-0">
                      {queryResult.processingLogs.map((log: any, index: number) => (
                        <div key={index} className="relative pb-6 last:pb-0">
                          {index < queryResult.processingLogs.length - 1 && (
                            <div className="absolute left-[-1.5rem] top-4 w-0.5 h-full bg-gray-200" />
                          )}
                          <div className="absolute left-[-1.5rem] top-1 w-6 h-6 rounded-full bg-agri-500 border-2 border-white flex items-center justify-center">
                            <CheckCircle className="w-3 h-3 text-white" />
                          </div>
                          <div className="bg-gray-50 rounded-xl p-4">
                            <div className="flex items-center justify-between mb-1">
                              <span className="font-medium text-gray-900">
                                {log.action === 'create' ? '投诉提交' :
                                 log.action === 'assign' ? '分派处理' :
                                 log.action === 'process' ? '处理中' : '已完成'}
                              </span>
                              <span className="text-xs text-gray-500">{formatDateTime(log.timestamp)}</span>
                            </div>
                            <p className="text-sm text-gray-600">{log.description}</p>
                            <p className="text-xs text-gray-400 mt-1">操作人: {log.operator}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </motion.div>
              )}
            </motion.div>
          ) : showReceipt ? (
            <motion.div
              key="receipt"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="space-y-6"
            >
              <div className="bg-gradient-to-r from-agri-500 to-agri-600 rounded-3xl p-8 text-white text-center shadow-xl">
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: 'spring', delay: 0.2 }}
                  className="w-20 h-20 bg-white rounded-full flex items-center justify-center mx-auto mb-6"
                >
                  <CheckCircle className="w-12 h-12 text-agri-500" />
                </motion.div>
                <h1 className="text-2xl font-bold mb-2">投诉提交成功</h1>
                <p className="text-agri-100">我们将尽快处理您的投诉</p>
              </div>

              {receipt && (
                <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
                  <h3 className="font-semibold text-gray-900 mb-6 flex items-center gap-2">
                    <FileText className="w-5 h-5 text-agri-600" />
                    电子回执
                  </h3>

                  <div className="space-y-4">
                    <div className="flex items-center justify-between py-3 border-b border-gray-100">
                      <span className="text-gray-500">投诉编号</span>
                      <span className="font-mono font-semibold text-gray-900">{receipt.complaintNo}</span>
                    </div>
                    <div className="flex items-center justify-between py-3 border-b border-gray-100">
                      <span className="text-gray-500">投诉类型</span>
                      <span className="font-medium text-gray-900">{complaintTypeLabels[receipt.type]}</span>
                    </div>
                    <div className="flex items-center justify-between py-3 border-b border-gray-100">
                      <span className="text-gray-500">投诉人</span>
                      <span className="font-medium text-gray-900">{receipt.consumerName}</span>
                    </div>
                    <div className="flex items-center justify-between py-3 border-b border-gray-100">
                      <span className="text-gray-500">联系电话</span>
                      <span className="font-medium text-gray-900">{receipt.consumerPhone}</span>
                    </div>
                    <div className="flex items-center justify-between py-3 border-b border-gray-100">
                      <span className="text-gray-500">所在地区</span>
                      <span className="font-medium text-gray-900">{receipt.region}</span>
                    </div>
                    {receipt.traceCode && (
                      <div className="flex items-center justify-between py-3 border-b border-gray-100">
                        <span className="text-gray-500">追溯码</span>
                        <span className="font-mono font-medium text-gray-900">{receipt.traceCode}</span>
                      </div>
                    )}
                    <div className="flex items-center justify-between py-3 border-b border-gray-100">
                      <span className="text-gray-500">提交时间</span>
                      <span className="font-medium text-gray-900">{formatDateTime(receipt.submittedAt)}</span>
                    </div>
                    <div className="flex items-center justify-between py-3">
                      <span className="text-gray-500">预计处理时间</span>
                      <span className="font-medium text-agri-600">{receipt.estimatedTime}</span>
                    </div>
                  </div>

                  <div className="mt-6 p-4 bg-yellow-50 rounded-xl border border-yellow-200">
                    <div className="flex items-start gap-3">
                      <Clock className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
                      <div>
                        <p className="font-medium text-yellow-800">温馨提示</p>
                        <p className="text-sm text-yellow-700 mt-1">
                          请妥善保管投诉编号，可用于查询处理进度。我们将在预计时间内与您联系。
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              <div className="flex gap-4">
                <button
                  onClick={() => window.print()}
                  className="flex-1 py-4 bg-white border-2 border-gray-200 text-gray-700 font-semibold rounded-2xl hover:bg-gray-50 transition-colors flex items-center justify-center gap-2"
                >
                  <FileText className="w-5 h-5" />
                  <span>打印回执</span>
                </button>
                <button
                  onClick={resetForm}
                  className="flex-1 py-4 bg-gradient-to-r from-agri-500 to-agri-600 text-white font-semibold rounded-2xl hover:from-agri-600 hover:to-agri-700 transition-colors flex items-center justify-center gap-2 shadow-lg shadow-agri-500/30"
                >
                  <Send className="w-5 h-5" />
                  <span>继续投诉</span>
                </button>
              </div>
            </motion.div>
          ) : (
            <motion.div
              key="form"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              className="space-y-6"
            >
              <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-center mb-8"
              >
                <h1 className="text-2xl font-bold text-gray-900 mb-2">在线投诉</h1>
                <p className="text-gray-500">如发现农产品质量问题，请提交投诉</p>
              </motion.div>

              <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
                <h3 className="font-semibold text-gray-900 mb-4">选择问题类型</h3>
                <div className="grid grid-cols-2 gap-4">
                  {(Object.keys(complaintTypeLabels) as ComplaintType[]).map((type) => {
                    const Icon = typeIcons[type];
                    const isSelected = selectedType === type;
                    return (
                      <motion.button
                        key={type}
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => setSelectedType(type)}
                        className={`p-5 rounded-2xl border-2 transition-all ${
                          isSelected ? typeSelectedColors[type] : typeColors[type]
                        }`}
                      >
                        <Icon className="w-8 h-8 mx-auto mb-2" />
                        <p className="font-medium">{complaintTypeLabels[type]}</p>
                      </motion.button>
                    );
                  })}
                </div>
              </div>

              <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
                <h3 className="font-semibold text-gray-900 mb-4">问题描述</h3>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="请详细描述您遇到的问题..."
                  rows={4}
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-agri-500 focus:border-transparent resize-none"
                />
                <p className="text-sm text-gray-400 mt-2 text-right">{description.length}/500</p>
              </div>

              <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
                <h3 className="font-semibold text-gray-900 mb-4">上传凭证</h3>
                <div className="flex flex-wrap gap-3">
                  {images.map((img, index) => (
                    <motion.div
                      key={index}
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className="relative w-24 h-24 rounded-xl overflow-hidden"
                    >
                      <img src={img} alt={`凭证${index + 1}`} className="w-full h-full object-cover" />
                      <button
                        onClick={() => removeImage(index)}
                        className="absolute top-1 right-1 w-6 h-6 bg-black/50 rounded-full flex items-center justify-center hover:bg-black/70 transition-colors"
                      >
                        <X className="w-4 h-4 text-white" />
                      </button>
                    </motion.div>
                  ))}
                  {images.length < 9 && (
                    <button
                      onClick={handleImageUpload}
                      className="w-24 h-24 border-2 border-dashed border-gray-300 rounded-xl flex flex-col items-center justify-center text-gray-400 hover:border-agri-400 hover:text-agri-500 transition-colors"
                    >
                      <Upload className="w-6 h-6 mb-1" />
                      <span className="text-xs">上传照片</span>
                    </button>
                  )}
                </div>
                <p className="text-sm text-gray-400 mt-3">最多可上传9张照片（模拟）</p>
              </div>

              <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
                <h3 className="font-semibold text-gray-900 mb-4">追溯码（选填）</h3>
                <div className="relative">
                  <QrCode className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="text"
                    value={traceCode}
                    onChange={(e) => setTraceCode(e.target.value)}
                    placeholder="请输入20位追溯码"
                    className="w-full pl-12 pr-4 py-4 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-agri-500 focus:border-transparent font-mono"
                  />
                </div>
              </div>

              <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
                <h3 className="font-semibold text-gray-900 mb-4">联系信息</h3>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      <User className="w-4 h-4 inline mr-1" />
                      姓名 *
                    </label>
                    <input
                      type="text"
                      value={consumerName}
                      onChange={(e) => setConsumerName(e.target.value)}
                      placeholder="请输入您的姓名"
                      className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-agri-500 focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      <Phone className="w-4 h-4 inline mr-1" />
                      联系电话 *
                    </label>
                    <input
                      type="tel"
                      value={consumerPhone}
                      onChange={(e) => setConsumerPhone(e.target.value)}
                      placeholder="请输入您的联系电话"
                      className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-agri-500 focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      <MapPin className="w-4 h-4 inline mr-1" />
                      所在地区 *
                    </label>
                    <input
                      type="text"
                      value={region}
                      onChange={(e) => setRegion(e.target.value)}
                      placeholder="请输入您所在的地区"
                      className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-agri-500 focus:border-transparent"
                    />
                  </div>
                </div>
              </div>

              <div className="p-4 bg-blue-50 rounded-xl border border-blue-200">
                <div className="flex items-start gap-3">
                  <ShieldX className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="font-medium text-blue-800">隐私保护</p>
                    <p className="text-sm text-blue-700 mt-1">
                      您的个人信息将被严格保密，仅用于投诉处理。
                    </p>
                  </div>
                </div>
              </div>

              <button
                onClick={handleSubmit}
                disabled={loading || !selectedType || !description.trim() || !consumerName.trim() || !consumerPhone.trim() || !region.trim()}
                className="w-full py-4 bg-gradient-to-r from-danger-500 to-danger-600 text-white text-lg font-semibold rounded-2xl hover:from-danger-600 hover:to-danger-700 transition-all shadow-lg shadow-danger-500/30 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {loading ? (
                  <>
                    <div className="animate-spin w-5 h-5 border-2 border-white border-t-transparent rounded-full" />
                    <span>提交中...</span>
                  </>
                ) : (
                  <>
                    <Send className="w-5 h-5" />
                    <span>提交投诉</span>
                  </>
                )}
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
