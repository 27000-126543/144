import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Award, Search, Filter, ChevronDown, Printer, Download, Eye, Calendar, User, MapPin, QrCode, Shield, CheckCircle, XCircle, Clock, FileCheck } from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import { api } from '../../services/api';
import { useAuthStore } from '../../store/authStore';
import { useToast } from '../../components/ui/MessageToast';
import { Modal, ModalButton } from '../../components/ui/Modal';
import { StatusBadge } from '../../components/ui/StatusBadge';
import { formatDate, formatDateTime } from '../../utils/format';
import { Certificate, CertType, certTypeLabels } from '../../types';

const certTypeColors: Record<CertType, string> = {
  organic: 'bg-green-100 text-green-800',
  green: 'bg-emerald-100 text-emerald-800',
  gap: 'bg-purple-100 text-purple-800',
};

const certificateStatusColors: Record<string, string> = {
  valid: 'bg-green-100 text-green-800',
  expired: 'bg-yellow-100 text-yellow-800',
  revoked: 'bg-red-100 text-red-800',
};

const certificateStatusLabels: Record<string, string> = {
  valid: '有效',
  expired: '已过期',
  revoked: '已吊销',
};

const statusFilterOptions = [
  { value: '', label: '全部状态' },
  { value: 'valid', label: '有效' },
  { value: 'expired', label: '已过期' },
  { value: 'revoked', label: '已吊销' },
];

const typeFilterOptions = [
  { value: '', label: '全部类型' },
  { value: 'organic', label: '有机产品认证' },
  { value: 'green', label: '绿色食品认证' },
  { value: 'gap', label: '良好农业规范认证' },
];

export default function CertifierCertificates() {
  const { user } = useAuthStore();
  const { showToast } = useToast();
  const [certificates, setCertificates] = useState<Certificate[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [showStatusDropdown, setShowStatusDropdown] = useState(false);
  const [showTypeDropdown, setShowTypeDropdown] = useState(false);
  const [selectedCertificate, setSelectedCertificate] = useState<Certificate | null>(null);
  const [showPreviewModal, setShowPreviewModal] = useState(false);

  useEffect(() => {
    loadCertificates();
  }, [user, statusFilter, typeFilter]);

  async function loadCertificates() {
    try {
      setLoading(true);
      const params: any = { page: 1, pageSize: 50, certifierId: user?.id };
      if (statusFilter) params.status = statusFilter;
      if (typeFilter) params.certType = typeFilter;
      const res = await api.getCertificates(params);
      setCertificates(res.items);
    } catch (error) {
      console.error('Failed to load certificates:', error);
      showToast('error', '加载证书列表失败');
    } finally {
      setLoading(false);
    }
  }

  const filteredCertificates = certificates.filter(cert =>
    cert.certNo.toLowerCase().includes(searchQuery.toLowerCase()) ||
    cert.holderName.includes(searchQuery)
  );

  function handlePrint(certificate: Certificate) {
    showToast('success', `证书 ${certificate.certNo} 已发送打印`);
  }

  function handleDownload(certificate: Certificate) {
    showToast('success', `证书 ${certificate.certNo} 已开始下载`);
  }

  function handleRevoke(certificate: Certificate) {
    setCertificates(certs =>
      certs.map(c =>
        c.id === certificate.id ? { ...c, status: 'revoked' as const } : c
      )
    );
    showToast('success', `证书 ${certificate.certNo} 已吊销`);
    setShowPreviewModal(false);
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">证书管理</h1>
          <p className="mt-1 text-sm text-gray-500">查看和管理所有认证证书</p>
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
              placeholder="搜索证书编号或持证人..."
              className="input-field pl-12"
            />
          </div>
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative">
              <button
                onClick={() => { setShowStatusDropdown(!showStatusDropdown); setShowTypeDropdown(false); }}
                className="btn-secondary flex items-center gap-2 w-full sm:w-auto justify-center"
              >
                <Filter className="w-4 h-4" />
                {statusFilterOptions.find(o => o.value === statusFilter)?.label || '状态'}
                <ChevronDown className="w-4 h-4" />
              </button>
              <AnimatePresence>
                {showStatusDropdown && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="absolute right-0 top-full mt-2 w-36 bg-white rounded-xl shadow-lg border border-gray-100 py-2 z-10"
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
            <div className="relative">
              <button
                onClick={() => { setShowTypeDropdown(!showTypeDropdown); setShowStatusDropdown(false); }}
                className="btn-secondary flex items-center gap-2 w-full sm:w-auto justify-center"
              >
                <Award className="w-4 h-4" />
                {typeFilterOptions.find(o => o.value === typeFilter)?.label || '类型'}
                <ChevronDown className="w-4 h-4" />
              </button>
              <AnimatePresence>
                {showTypeDropdown && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="absolute right-0 top-full mt-2 w-44 bg-white rounded-xl shadow-lg border border-gray-100 py-2 z-10"
                  >
                    {typeFilterOptions.map((option) => (
                      <button
                        key={option.value}
                        onClick={() => {
                          setTypeFilter(option.value);
                          setShowTypeDropdown(false);
                        }}
                        className={`w-full px-4 py-2 text-left text-sm hover:bg-gray-50 transition-colors ${
                          typeFilter === option.value ? 'text-green-600 bg-green-50' : 'text-gray-700'
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
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {loading ? (
          [...Array(6)].map((_, i) => (
            <div key={i} className="h-64 bg-gray-100 rounded-2xl animate-pulse" />
          ))
        ) : filteredCertificates.length === 0 ? (
          <div className="col-span-full text-center py-16">
            <Award className="w-16 h-16 mx-auto mb-4 text-gray-300" />
            <p className="text-gray-500 mb-2">暂无证书</p>
            <p className="text-sm text-gray-400">通过认证审核后将生成证书</p>
          </div>
        ) : (
          filteredCertificates.map((certificate, index) => (
            <motion.div
              key={certificate.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
              className="group"
            >
              <div className={`relative h-full p-5 rounded-2xl border-2 transition-all duration-300 ${
                certificate.status === 'valid'
                  ? 'border-amber-200 bg-gradient-to-br from-amber-50 via-yellow-50 to-amber-100 hover:border-amber-400 hover:shadow-lg'
                  : certificate.status === 'expired'
                  ? 'border-gray-200 bg-gray-50 hover:border-gray-300'
                  : 'border-red-200 bg-red-50 hover:border-red-300'
              }`}>
                {certificate.status === 'valid' && (
                  <div className="absolute top-0 right-0 w-16 h-16 overflow-hidden">
                    <div className="absolute top-3 right-[-28px] transform rotate-45 bg-gradient-to-r from-amber-500 to-yellow-500 text-white text-xs py-1 w-28 text-center font-medium shadow-md">
                      有效
                    </div>
                  </div>
                )}

                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className={`w-14 h-14 rounded-xl flex items-center justify-center ${
                      certificate.status === 'valid'
                        ? 'bg-gradient-to-br from-amber-400 to-yellow-500 shadow-lg'
                        : 'bg-gray-200'
                    }`}>
                      <Award className={`w-7 h-7 ${
                        certificate.status === 'valid' ? 'text-white' : 'text-gray-400'
                      }`} />
                    </div>
                    <div>
                      <StatusBadge
                        status={certificate.certType}
                        customColors={certTypeColors}
                        size="sm"
                        label={certTypeLabels[certificate.certType]}
                      />
                      <p className="font-mono text-sm font-semibold text-gray-700 mt-1">
                        {certificate.certNo}
                      </p>
                    </div>
                  </div>
                  <StatusBadge
                    status={certificate.status}
                    customColors={certificateStatusColors}
                    size="sm"
                    label={certificateStatusLabels[certificate.status]}
                  />
                </div>

                <div className="space-y-2 mb-4">
                  <div className="flex items-center gap-2 text-sm">
                    <User className="w-4 h-4 text-gray-400 flex-shrink-0" />
                    <span className="text-gray-600 truncate">{certificate.holderName}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <MapPin className="w-4 h-4 text-gray-400 flex-shrink-0" />
                    <span className="text-gray-600">{certificate.productName}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <Calendar className="w-4 h-4 text-gray-400 flex-shrink-0" />
                    <span className="text-gray-600">
                      {formatDate(certificate.issueDate)} ~ {formatDate(certificate.validUntil)}
                    </span>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-3 border-t border-amber-100">
                  <div className="flex items-center gap-2">
                    <QrCode className="w-4 h-4 text-amber-500" />
                    <Shield className="w-4 h-4 text-green-500" />
                    <span className="text-xs text-gray-500">防伪验证</span>
                  </div>
                  <div className="flex gap-1">
                    <button
                      onClick={() => {
                        setSelectedCertificate(certificate);
                        setShowPreviewModal(true);
                      }}
                      className="p-2 hover:bg-amber-100 rounded-lg transition-colors"
                      title="预览"
                    >
                      <Eye className="w-4 h-4 text-amber-600" />
                    </button>
                    <button
                      onClick={() => handlePrint(certificate)}
                      className="p-2 hover:bg-amber-100 rounded-lg transition-colors"
                      title="打印"
                    >
                      <Printer className="w-4 h-4 text-amber-600" />
                    </button>
                    <button
                      onClick={() => handleDownload(certificate)}
                      className="p-2 hover:bg-amber-100 rounded-lg transition-colors"
                      title="下载"
                    >
                      <Download className="w-4 h-4 text-amber-600" />
                    </button>
                  </div>
                </div>
              </div>
            </motion.div>
          ))
        )}
      </div>

      <Modal
        open={showPreviewModal}
        onClose={() => setShowPreviewModal(false)}
        title="证书预览"
        size="lg"
        footer={
          selectedCertificate ? (
            <>
              <ModalButton
                variant="secondary"
                onClick={() => setShowPreviewModal(false)}
              >
                关闭
              </ModalButton>
              {selectedCertificate.status === 'valid' && (
                <ModalButton
                  variant="danger"
                  onClick={() => handleRevoke(selectedCertificate)}
                >
                  <XCircle className="w-4 h-4 mr-1" />
                  吊销证书
                </ModalButton>
              )}
              <ModalButton
                onClick={() => handlePrint(selectedCertificate)}
              >
                <Printer className="w-4 h-4 mr-1" />
                打印
              </ModalButton>
              <ModalButton
                variant="secondary"
                onClick={() => handleDownload(selectedCertificate)}
              >
                <Download className="w-4 h-4 mr-1" />
                下载
              </ModalButton>
            </>
          ) : null
        }
      >
        {selectedCertificate && (
          <div className="space-y-6">
            <div className={`relative p-8 rounded-2xl border-4 overflow-hidden ${
              selectedCertificate.status === 'valid'
                ? 'border-amber-400 bg-gradient-to-br from-amber-50 via-yellow-50 to-amber-100'
                : selectedCertificate.status === 'expired'
                ? 'border-gray-300 bg-gray-50'
                : 'border-red-300 bg-red-50'
            }`}>
              {selectedCertificate.status === 'valid' && (
                <>
                  <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-amber-600 via-yellow-500 to-amber-600" />
                  <div className="absolute bottom-0 left-0 w-full h-2 bg-gradient-to-r from-amber-600 via-yellow-500 to-amber-600" />
                  <div className="absolute top-4 left-4 w-12 h-12 border-2 border-amber-300 rounded-full opacity-30" />
                  <div className="absolute bottom-4 right-4 w-16 h-16 border-2 border-amber-300 rounded-full opacity-30" />
                </>
              )}

              {selectedCertificate.status === 'expired' && (
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                  <div className="transform rotate-[-30deg] text-6xl font-bold text-gray-300 opacity-50">
                    已过期
                  </div>
                </div>
              )}

              {selectedCertificate.status === 'revoked' && (
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                  <div className="transform rotate-[-30deg] text-6xl font-bold text-red-300 opacity-50">
                    已吊销
                  </div>
                </div>
              )}

              <div className="text-center mb-8">
                <div className={`w-20 h-20 mx-auto mb-4 rounded-full flex items-center justify-center ${
                  selectedCertificate.status === 'valid'
                    ? 'bg-gradient-to-br from-amber-400 to-yellow-500 shadow-lg'
                    : 'bg-gray-200'
                }`}>
                  <Award className={`w-10 h-10 ${
                    selectedCertificate.status === 'valid' ? 'text-white' : 'text-gray-400'
                  }`} />
                </div>
                <h2 className="text-2xl font-bold text-gray-900 mb-2">
                  {certTypeLabels[selectedCertificate.certType]}证书
                </h2>
                <p className="text-gray-500">CERTIFICATE</p>
              </div>

              <div className="text-center mb-6">
                <p className="text-sm text-gray-500 mb-1">证书编号</p>
                <p className="font-mono text-xl font-bold text-amber-700 tracking-wider">
                  {selectedCertificate.certNo}
                </p>
              </div>

              <div className="max-w-md mx-auto space-y-4 mb-8">
                <div className="flex justify-between py-2 border-b border-amber-200">
                  <span className="text-gray-500">持证人</span>
                  <span className="font-medium text-gray-900">{selectedCertificate.holderName}</span>
                </div>
                <div className="flex justify-between py-2 border-b border-amber-200">
                  <span className="text-gray-500">产品名称</span>
                  <span className="font-medium text-gray-900">{selectedCertificate.productName}</span>
                </div>
                <div className="flex justify-between py-2 border-b border-amber-200">
                  <span className="text-gray-500">发证日期</span>
                  <span className="font-medium text-gray-900">{formatDate(selectedCertificate.issueDate)}</span>
                </div>
                <div className="flex justify-between py-2 border-b border-amber-200">
                  <span className="text-gray-500">有效期至</span>
                  <span className={`font-medium ${
                    selectedCertificate.status === 'valid' ? 'text-green-600' : 'text-red-600'
                  }`}>
                    {formatDate(selectedCertificate.validUntil)}
                  </span>
                </div>
                <div className="flex justify-between py-2">
                  <span className="text-gray-500">认证机构</span>
                  <span className="font-medium text-gray-900">寿光市农产品认证中心</span>
                </div>
              </div>

              <div className="flex items-center justify-center gap-8">
                <div className="text-center">
                  <div className="w-24 h-24 bg-white rounded-lg shadow-sm flex items-center justify-center mb-2">
                    <QRCodeSVG
                      value={`https://trace.example.com/verify/${selectedCertificate.certNo}`}
                      size={80}
                      level="H"
                    />
                  </div>
                  <p className="text-xs text-gray-500">扫码验证</p>
                </div>
                <div className="text-center">
                  <div className="w-24 h-24 bg-gradient-to-br from-amber-100 to-yellow-100 rounded-lg flex items-center justify-center mb-2 border-2 border-amber-300">
                    <div className="text-center">
                      <Shield className="w-8 h-8 text-amber-600 mx-auto" />
                      <p className="text-xs font-bold text-amber-700 mt-1">防伪</p>
                    </div>
                  </div>
                  <p className="text-xs text-gray-500">认证标识</p>
                </div>
              </div>

              <div className="mt-8 pt-6 border-t border-amber-200 text-center">
                <p className="text-sm text-gray-500">
                  本证书由认证机构颁发，可通过扫描二维码查询真伪
                </p>
                <p className="text-xs text-gray-400 mt-2">
                  发证日期：{formatDateTime(selectedCertificate.createdAt)}
                </p>
              </div>
            </div>

            <div className="flex gap-3">
              <div className="flex-1 p-4 bg-blue-50 rounded-xl">
                <div className="flex items-center gap-2 mb-2">
                  <FileCheck className="w-5 h-5 text-blue-600" />
                  <span className="font-medium text-gray-900">认证说明</span>
                </div>
                <p className="text-sm text-gray-600">
                  该产品已通过{certTypeLabels[selectedCertificate.certType]}认证，生产过程符合相关标准要求。
                </p>
              </div>
              <div className="flex-1 p-4 bg-green-50 rounded-xl">
                <div className="flex items-center gap-2 mb-2">
                  <CheckCircle className="w-5 h-5 text-green-600" />
                  <span className="font-medium text-gray-900">证书状态</span>
                </div>
                <p className="text-sm text-gray-600">
                  当前证书状态：
                  <span className={`font-medium ${
                    selectedCertificate.status === 'valid' ? 'text-green-600' :
                    selectedCertificate.status === 'expired' ? 'text-yellow-600' : 'text-red-600'
                  }`}>
                    {certificateStatusLabels[selectedCertificate.status]}
                  </span>
                </p>
              </div>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
