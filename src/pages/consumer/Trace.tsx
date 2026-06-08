import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Search,
  QrCode,
  Camera,
  AlertTriangle,
  FileText,
  Award,
  MessageSquare,
  ChevronDown,
  ChevronUp,
  User,
  MapPin,
  Calendar,
  Bug,
  CheckCircle,
  XCircle,
  ArrowLeft,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { api } from '../../services/api';
import type { TraceInfo, PesticideRecord } from '../../types';
import { TraceTimeline } from '../../components/ui/TraceTimeline';
import { formatDate, formatDateTime, formatNumber } from '../../utils/format';
import { StatusBadge } from '../../components/ui/StatusBadge';
import { Modal } from '../../components/ui/Modal';

export default function ConsumerTrace() {
  const navigate = useNavigate();
  const [traceCode, setTraceCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [traceInfo, setTraceInfo] = useState<TraceInfo | null>(null);
  const [error, setError] = useState('');
  const [showScanner, setShowScanner] = useState(false);
  const [expandedSection, setExpandedSection] = useState<string | null>(null);

  const handleSearch = async () => {
    if (!traceCode.trim()) {
      setError('请输入追溯码');
      return;
    }

    setLoading(true);
    setError('');
    try {
      const info = await api.traceByCode(traceCode.trim());
      setTraceInfo(info);
    } catch (err) {
      setError('未找到该追溯码对应的产品信息，请检查追溯码是否正确');
      setTraceInfo(null);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  const handleComplaint = () => {
    if (traceInfo) {
      navigate('/consumer/complaint', { state: { traceCode: traceInfo.traceCode } });
    }
  };

  const toggleSection = (section: string) => {
    setExpandedSection(expandedSection === section ? null : section);
  };

  const getPesticideWarning = (record: PesticideRecord) => {
    const now = new Date();
    const useDate = new Date(record.useDate);
    const safeInterval = record.safeInterval;
    const daysPassed = Math.floor((now.getTime() - useDate.getTime()) / (1000 * 60 * 60 * 24));
    const remaining = safeInterval - daysPassed;

    if (remaining > 0) {
      return {
        level: 'warning',
        message: `安全间隔期剩余 ${remaining} 天`,
      };
    }
    return { level: 'safe', message: '已过安全间隔期' };
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-agri-50 to-white">
      <div className="max-w-4xl mx-auto px-4 py-8">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-8"
        >
          <h1 className="text-3xl font-bold text-gray-900 mb-2">农产品质量追溯</h1>
          <p className="text-gray-500">扫码或输入追溯码，查询产品全链条信息</p>
        </motion.div>

        {!traceInfo ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <div className="bg-white rounded-3xl shadow-xl p-8 border border-gray-100">
              <div className="relative mb-6">
                <div className="absolute left-6 top-1/2 transform -translate-y-1/2">
                  <QrCode className="w-6 h-6 text-gray-400" />
                </div>
                <input
                  type="text"
                  value={traceCode}
                  onChange={(e) => setTraceCode(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder="请输入20位追溯码"
                  className="w-full pl-16 pr-16 py-4 text-lg border-2 border-gray-200 rounded-2xl focus:outline-none focus:ring-4 focus:ring-agri-100 focus:border-agri-500 transition-all"
                />
                <button
                  onClick={() => setShowScanner(true)}
                  className="absolute right-4 top-1/2 transform -translate-y-1/2 p-2 bg-agri-100 text-agri-600 rounded-xl hover:bg-agri-200 transition-colors"
                >
                  <Camera className="w-5 h-5" />
                </button>
              </div>

              {error && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  className="mb-6 p-4 bg-danger-50 border border-danger-200 rounded-xl flex items-start gap-3"
                >
                  <AlertTriangle className="w-5 h-5 text-danger-500 flex-shrink-0 mt-0.5" />
                  <p className="text-danger-700">{error}</p>
                </motion.div>
              )}

              <button
                onClick={handleSearch}
                disabled={loading}
                className="w-full py-4 bg-gradient-to-r from-agri-500 to-agri-600 text-white text-lg font-semibold rounded-2xl hover:from-agri-600 hover:to-agri-700 transition-all shadow-lg shadow-agri-500/30 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {loading ? (
                  <>
                    <div className="animate-spin w-5 h-5 border-2 border-white border-t-transparent rounded-full" />
                    <span>查询中...</span>
                  </>
                ) : (
                  <>
                    <Search className="w-5 h-5" />
                    <span>查询追溯信息</span>
                  </>
                )}
              </button>

              <div className="mt-8 grid grid-cols-3 gap-4">
                <div className="text-center p-4 bg-agri-50 rounded-2xl">
                  <div className="w-12 h-12 bg-agri-100 rounded-full flex items-center justify-center mx-auto mb-2">
                    <CheckCircle className="w-6 h-6 text-agri-600" />
                  </div>
                  <p className="text-sm font-medium text-gray-900">权威认证</p>
                  <p className="text-xs text-gray-500 mt-1">政府监管背书</p>
                </div>
                <div className="text-center p-4 bg-blue-50 rounded-2xl">
                  <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-2">
                    <FileText className="w-6 h-6 text-blue-600" />
                  </div>
                  <p className="text-sm font-medium text-gray-900">全程记录</p>
                  <p className="text-xs text-gray-500 mt-1">信息透明可查</p>
                </div>
                <div className="text-center p-4 bg-gold-50 rounded-2xl">
                  <div className="w-12 h-12 bg-gold-100 rounded-full flex items-center justify-center mx-auto mb-2">
                    <Award className="w-6 h-6 text-gold-600" />
                  </div>
                  <p className="text-sm font-medium text-gray-900">品质保障</p>
                  <p className="text-xs text-gray-500 mt-1">安全放心食用</p>
                </div>
              </div>
            </div>

            <div className="mt-8 text-center">
              <p className="text-gray-500 mb-2">热门追溯示例</p>
              <div className="flex flex-wrap justify-center gap-2">
                {['AGRI20240100001', 'AGRI20240100002', 'AGRI20240100003'].map((code) => (
                  <button
                    key={code}
                    onClick={() => setTraceCode(code)}
                    className="px-4 py-2 bg-white border border-gray-200 rounded-full text-sm text-gray-600 hover:border-agri-300 hover:text-agri-600 transition-colors"
                  >
                    {code}
                  </button>
                ))}
              </div>
            </div>
          </motion.div>
        ) : (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5 }}
            className="space-y-6"
          >
            <button
              onClick={() => {
                setTraceInfo(null);
                setTraceCode('');
                setError('');
              }}
              className="flex items-center gap-2 text-gray-600 hover:text-agri-600 transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
              <span>返回查询</span>
            </button>

            <div className="bg-gradient-to-r from-agri-500 to-agri-600 rounded-3xl p-8 text-white shadow-xl">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-agri-100 text-sm mb-2">追溯码</p>
                  <p className="font-mono text-2xl font-bold">{traceInfo.traceCode}</p>
                  <div className="flex items-center gap-2 mt-4">
                    <CheckCircle className="w-5 h-5" />
                    <span className="font-medium">产品信息真实有效</span>
                  </div>
                </div>
                <div className="w-24 h-24 bg-white rounded-2xl flex items-center justify-center">
                  <QrCode className="w-20 h-20 text-agri-600" />
                </div>
              </div>
            </div>

            <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
              <h3 className="font-semibold text-gray-900 mb-4">产品基本信息</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="p-4 bg-gray-50 rounded-xl">
                  <p className="text-xs text-gray-500">产品名称</p>
                  <p className="font-medium text-gray-900 mt-1">{traceInfo.planting.cropType}</p>
                </div>
                <div className="p-4 bg-gray-50 rounded-xl">
                  <p className="text-xs text-gray-500">批次号</p>
                  <p className="font-mono text-gray-900 mt-1 text-sm">{traceInfo.batch.batchNo}</p>
                </div>
                <div className="p-4 bg-gray-50 rounded-xl">
                  <p className="text-xs text-gray-500">种植面积</p>
                  <p className="font-medium text-gray-900 mt-1">{formatNumber(traceInfo.planting.area)} 亩</p>
                </div>
                <div className="p-4 bg-gray-50 rounded-xl">
                  <p className="text-xs text-gray-500">播种日期</p>
                  <p className="font-medium text-gray-900 mt-1">{formatDate(traceInfo.planting.plantDate)}</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
              <div
                className="flex items-center justify-between cursor-pointer"
                onClick={() => toggleSection('pesticide')}
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-amber-100 rounded-xl flex items-center justify-center">
                    <Bug className="w-5 h-5 text-amber-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900">用药记录</h3>
                    <p className="text-sm text-gray-500">共 {traceInfo.pesticideRecords.length} 条记录</p>
                  </div>
                </div>
                {expandedSection === 'pesticide' ? (
                  <ChevronUp className="w-5 h-5 text-gray-400" />
                ) : (
                  <ChevronDown className="w-5 h-5 text-gray-400" />
                )}
              </div>

              <AnimatePresence>
                {expandedSection === 'pesticide' && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.2 }}
                    className="overflow-hidden"
                  >
                    <div className="mt-4 space-y-3">
                      {traceInfo.pesticideRecords.length === 0 ? (
                        <p className="text-center text-gray-500 py-8">暂无用药记录</p>
                      ) : (
                        traceInfo.pesticideRecords.map((record, index) => {
                          const warning = getPesticideWarning(record);
                          return (
                            <div key={index} className="p-4 bg-gray-50 rounded-xl">
                              <div className="flex items-start justify-between">
                                <div>
                                  <div className="flex items-center gap-2">
                                    <p className="font-medium text-gray-900">{record.pesticideName}</p>
                                    {warning.level === 'warning' && (
                                      <StatusBadge status="warning" label={warning.message} />
                                    )}
                                    {warning.level === 'safe' && (
                                      <StatusBadge status="qualified" label={warning.message} />
                                    )}
                                  </div>
                                  <p className="text-sm text-gray-500 mt-1">
                                    使用日期: {formatDate(record.useDate)} · 用量: {record.dosage}
                                  </p>
                                </div>
                              </div>
                              <div className="mt-2 flex items-center gap-4 text-sm text-gray-500">
                                <span>安全间隔期: {record.safeInterval} 天</span>
                              </div>
                            </div>
                          );
                        })
                      )}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {traceInfo.inspectionReport && (
              <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
                <div
                  className="flex items-center justify-between cursor-pointer"
                  onClick={() => toggleSection('inspection')}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center">
                      <FileText className="w-5 h-5 text-blue-600" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900">检测报告</h3>
                      <p className="text-sm text-gray-500">
                        检测机构: {traceInfo.inspectionReport.inspectorName}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <StatusBadge
                      status={traceInfo.inspectionReport.overallResult === 'qualified' ? 'qualified' : 'unqualified'}
                      label={traceInfo.inspectionReport.overallResult === 'qualified' ? '合格' : '不合格'}
                    />
                    {expandedSection === 'inspection' ? (
                      <ChevronUp className="w-5 h-5 text-gray-400" />
                    ) : (
                      <ChevronDown className="w-5 h-5 text-gray-400" />
                    )}
                  </div>
                </div>

                <AnimatePresence>
                  {expandedSection === 'inspection' && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.2 }}
                      className="overflow-hidden"
                    >
                      <div className="mt-4 space-y-3">
                        <div className="grid grid-cols-2 gap-4">
                          <div className="p-3 bg-gray-50 rounded-xl">
                            <p className="text-xs text-gray-500">报告编号</p>
                            <p className="font-mono text-gray-900 mt-1 text-sm">{traceInfo.inspectionReport.reportNo}</p>
                          </div>
                          <div className="p-3 bg-gray-50 rounded-xl">
                            <p className="text-xs text-gray-500">检测日期</p>
                            <p className="font-medium text-gray-900 mt-1">{formatDate(traceInfo.inspectionReport.reportDate)}</p>
                          </div>
                        </div>
                        <div className="p-4 bg-gray-50 rounded-xl">
                          <p className="text-xs text-gray-500 mb-2">检测项目</p>
                          <div className="space-y-2">
                            {traceInfo.inspectionReport.items.map((item, index) => (
                              <div key={index} className="flex items-center justify-between py-2 border-b border-gray-100 last:border-0">
                                <span className="text-gray-700">{item.name}</span>
                                <div className="flex items-center gap-3">
                                  <span className="text-gray-500 text-sm">
                                    {item.value} / {item.standard} {item.unit}
                                  </span>
                                  {item.result === 'qualified' ? (
                                    <CheckCircle className="w-4 h-4 text-green-500" />
                                  ) : (
                                    <XCircle className="w-4 h-4 text-red-500" />
                                  )}
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            )}

            {traceInfo.certificate && (
              <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
                <div
                  className="flex items-center justify-between cursor-pointer"
                  onClick={() => toggleSection('certificate')}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-gold-100 rounded-xl flex items-center justify-center">
                      <Award className="w-5 h-5 text-gold-600" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900">
                        {traceInfo.certificate.certType === 'organic' ? '有机认证' :
                         traceInfo.certificate.certType === 'green' ? '绿色认证' : 'GAP认证'}
                      </h3>
                      <p className="text-sm text-gray-500">
                        证书编号: {traceInfo.certificate.certNo}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <StatusBadge
                      status={traceInfo.certificate.status === 'valid' ? 'certified' : 'expired'}
                      label={traceInfo.certificate.status === 'valid' ? '有效' : '已过期'}
                    />
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        navigate(`/consumer/certificate/${traceInfo.certificate.id}`);
                      }}
                      className="text-sm text-gold-600 hover:text-gold-700 font-medium"
                    >
                      查看详情
                    </button>
                    {expandedSection === 'certificate' ? (
                      <ChevronUp className="w-5 h-5 text-gray-400" />
                    ) : (
                      <ChevronDown className="w-5 h-5 text-gray-400" />
                    )}
                  </div>
                </div>

                <AnimatePresence>
                  {expandedSection === 'certificate' && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.2 }}
                      className="overflow-hidden"
                    >
                      <div className="mt-4 grid grid-cols-2 gap-4">
                        <div className="p-3 bg-gray-50 rounded-xl">
                          <p className="text-xs text-gray-500">持证人</p>
                          <p className="font-medium text-gray-900 mt-1">{traceInfo.certificate.holderName}</p>
                        </div>
                        <div className="p-3 bg-gray-50 rounded-xl">
                          <p className="text-xs text-gray-500">有效期至</p>
                          <p className="font-medium text-gray-900 mt-1">{formatDate(traceInfo.certificate.validUntil)}</p>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            )}

            <TraceTimeline items={traceInfo.timeline} />

            <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center">
                    <User className="w-5 h-5 text-blue-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900">生产主体</h3>
                    <p className="text-sm text-gray-500">{traceInfo.farmer.name}</p>
                  </div>
                </div>
                <div className="text-right">
                  <div className="flex items-center gap-1 text-gray-500 text-sm">
                    <MapPin className="w-4 h-4" />
                    <span>{traceInfo.plot.location.province} {traceInfo.plot.location.city}</span>
                  </div>
                  <div className="flex items-center gap-1 text-gray-500 text-sm mt-1">
                    <Calendar className="w-4 h-4" />
                    <span>地块面积: {formatNumber(traceInfo.plot.area)} 亩</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="sticky bottom-6 flex gap-4">
              <button
                onClick={handleComplaint}
                className="flex-1 py-4 bg-white border-2 border-danger-200 text-danger-600 font-semibold rounded-2xl hover:bg-danger-50 transition-colors flex items-center justify-center gap-2 shadow-lg"
              >
                <MessageSquare className="w-5 h-5" />
                <span>投诉举报</span>
              </button>
              <button
                onClick={() => window.print()}
                className="flex-1 py-4 bg-gradient-to-r from-agri-500 to-agri-600 text-white font-semibold rounded-2xl hover:from-agri-600 hover:to-agri-700 transition-colors flex items-center justify-center gap-2 shadow-lg shadow-agri-500/30"
              >
                <FileText className="w-5 h-5" />
                <span>导出凭证</span>
              </button>
            </div>
          </motion.div>
        )}
      </div>

      <Modal
        open={showScanner}
        onClose={() => setShowScanner(false)}
        title="扫码追溯"
        size="md"
      >
        <div className="text-center py-8">
          <div className="w-48 h-48 bg-gray-100 rounded-2xl mx-auto mb-6 flex items-center justify-center overflow-hidden">
            <div className="relative w-full h-full">
              <div className="absolute inset-0 flex items-center justify-center">
                <QrCode className="w-32 h-32 text-gray-300" />
              </div>
              <div className="absolute left-4 right-4 top-1/2 h-0.5 bg-agri-500 animate-[scan-line_2s_ease-in-out_infinite]" />
              <div className="absolute top-4 left-4 w-6 h-6 border-t-2 border-l-2 border-agri-500 rounded-tl-lg" />
              <div className="absolute top-4 right-4 w-6 h-6 border-t-2 border-r-2 border-agri-500 rounded-tr-lg" />
              <div className="absolute bottom-4 left-4 w-6 h-6 border-b-2 border-l-2 border-agri-500 rounded-bl-lg" />
              <div className="absolute bottom-4 right-4 w-6 h-6 border-b-2 border-r-2 border-agri-500 rounded-br-lg" />
            </div>
          </div>
          <p className="text-gray-500 mb-4">请将追溯码置于扫描框内</p>
          <p className="text-sm text-gray-400">或手动输入追溯码查询</p>
        </div>
      </Modal>
    </div>
  );
}
