import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Award,
  ArrowLeft,
  QrCode,
  Calendar,
  User,
  MapPin,
  FileText,
  Download,
  Printer,
  ShieldCheck,
  CheckCircle,
  XCircle,
  Clock,
} from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import type { Certificate, CertType } from '../../types';
import { certTypeLabels } from '../../types';
import { formatDate } from '../../utils/format';

const mockCertificates: Record<string, Certificate> = {
  '1': {
    id: '1',
    certNo: 'CERTORG2024010001',
    certType: 'organic',
    applicationId: 'app-1',
    batchId: 'batch-1',
    holderName: '绿源农场',
    productName: '有机西红柿',
    issueDate: '2024-01-01T00:00:00Z',
    validUntil: '2025-01-01T00:00:00Z',
    qrCodeUrl: '',
    certUrl: '',
    status: 'valid',
    createdAt: '2024-01-01T00:00:00Z',
  },
  '2': {
    id: '2',
    certNo: 'CERTGRE2024010002',
    certType: 'green',
    applicationId: 'app-2',
    batchId: 'batch-2',
    holderName: '阳光合作社',
    productName: '绿色黄瓜',
    issueDate: '2024-02-01T00:00:00Z',
    validUntil: '2025-02-01T00:00:00Z',
    qrCodeUrl: '',
    certUrl: '',
    status: 'valid',
    createdAt: '2024-02-01T00:00:00Z',
  },
};

export default function ConsumerCertificate() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [certificate, setCertificate] = useState<Certificate | null>(null);
  const [loading, setLoading] = useState(true);
  const [isValid, setIsValid] = useState(true);

  useEffect(() => {
    if (id && mockCertificates[id]) {
      setCertificate(mockCertificates[id]);
      const now = new Date();
      const expiry = new Date(mockCertificates[id].validUntil);
      setIsValid(expiry > now);
    }
    setLoading(false);
  }, [id]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-gold-50 to-white flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-4 border-gold-500 border-t-transparent rounded-full" />
      </div>
    );
  }

  if (!certificate) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-gold-50 to-white">
        <div className="max-w-2xl mx-auto px-4 py-8">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center gap-2 text-gray-600 hover:text-gold-600 transition-colors mb-8"
          >
            <ArrowLeft className="w-5 h-5" />
            <span>返回</span>
          </button>
          <div className="text-center py-16">
            <XCircle className="w-16 h-16 mx-auto text-gray-300 mb-4" />
            <p className="text-gray-500 text-lg">证书不存在或已被吊销</p>
          </div>
        </div>
      </div>
    );
  }

  const verifyUrl = `${window.location.origin}/consumer/certificate/${certificate.id}`;
  const certTypeColor = certificate.certType === 'organic' ? 'bg-green-500' :
                      certificate.certType === 'green' ? 'bg-emerald-500' : 'bg-blue-500';
  const certTypeBg = certificate.certType === 'organic' ? 'from-green-500 to-green-600' :
                    certificate.certType === 'green' ? 'from-emerald-500 to-emerald-600' : 'from-blue-500 to-blue-600';

  return (
    <div className="min-h-screen bg-gradient-to-b from-gold-50 to-white pb-8">
      <div className="max-w-2xl mx-auto px-4 py-8">
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 text-gray-600 hover:text-gold-600 transition-colors mb-8"
        >
          <ArrowLeft className="w-5 h-5" />
          <span>返回</span>
        </button>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="relative"
        >
          <div className={`bg-gradient-to-r ${certTypeBg} rounded-t-3xl p-8 text-white relative overflow-hidden`}>
            <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2" />
            <div className="absolute bottom-0 left-0 w-48 h-48 bg-white/10 rounded-full translate-y-1/2 -translate-x-1/2" />
            
            <div className="relative z-10">
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-2 mb-4">
                    <Award className="w-8 h-8" />
                    <span className="text-2xl font-bold">{certTypeLabels[certificate.certType]}</span>
                  </div>
                  <p className="text-white/80 text-sm">证书编号</p>
                  <p className="font-mono text-xl font-bold">{certificate.certNo}</p>
                </div>
                <div className="text-right">
                  {isValid && certificate.status === 'valid' ? (
                    <div className="flex items-center gap-2 px-4 py-2 bg-white/20 rounded-full backdrop-blur-sm">
                      <ShieldCheck className="w-5 h-5" />
                      <span className="font-semibold">证书有效</span>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2 px-4 py-2 bg-red-500/80 rounded-full backdrop-blur-sm">
                      <XCircle className="w-5 h-5" />
                      <span className="font-semibold">已过期</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-b-3xl shadow-xl border border-gray-100 relative">
            <div className="absolute -left-3 top-0 bottom-0 w-6 flex flex-col justify-around">
              {[...Array(8)].map((_, i) => (
                <div key={i} className="w-6 h-6 bg-gold-50 rounded-full border-2 border-white -ml-3" />
              ))}
            </div>
            <div className="absolute -right-3 top-0 bottom-0 w-6 flex flex-col justify-around">
              {[...Array(8)].map((_, i) => (
                <div key={i} className="w-6 h-6 bg-gold-50 rounded-full border-2 border-white -mr-3" />
              ))}
            </div>

            <div className="p-8 pl-12 pr-12">
              <div className="absolute top-4 left-12 w-16 h-16">
                <div className={`w-full h-full ${certTypeColor} rounded-full opacity-10 flex items-center justify-center`}>
                  <Award className={`w-8 h-8 ${certTypeColor.replace('bg-', 'text-')}`} />
                </div>
              </div>

              <div className="absolute top-4 right-12">
                <div className="bg-white p-3 rounded-xl shadow-lg border-2 border-gold-200">
                  <QRCodeSVG value={verifyUrl} size={80} level="H" includeMargin />
                </div>
              </div>

              <div className="mt-24 mb-8">
                <h2 className="text-3xl font-bold text-gray-900 text-center mb-2">
                  {certTypeLabels[certificate.certType]}证书
                </h2>
                <div className="flex items-center justify-center gap-2">
                  <div className="h-px w-16 bg-gradient-to-r from-transparent to-gold-400" />
                  <div className="w-2 h-2 bg-gold-400 rounded-full" />
                  <div className="h-px w-16 bg-gradient-to-l from-transparent to-gold-400" />
                </div>
              </div>

              <div className="space-y-6">
                <div className="bg-gradient-to-r from-gold-50 to-transparent p-6 rounded-2xl border border-gold-100">
                  <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                    <User className="w-5 h-5 text-gold-600" />
                    获证主体信息
                  </h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-gray-500">主体名称</p>
                      <p className="font-medium text-gray-900 mt-1">{certificate.holderName}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">产品名称</p>
                      <p className="font-medium text-gray-900 mt-1">{certificate.productName}</p>
                    </div>
                  </div>
                </div>

                <div className="bg-gradient-to-r from-blue-50 to-transparent p-6 rounded-2xl border border-blue-100">
                  <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                    <FileText className="w-5 h-5 text-blue-600" />
                    认证信息
                  </h3>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between py-3 border-b border-gray-100">
                      <span className="text-gray-500">发证日期</span>
                      <span className="font-medium text-gray-900">{formatDate(certificate.issueDate)}</span>
                    </div>
                    <div className="flex items-center justify-between py-3 border-b border-gray-100">
                      <span className="text-gray-500">有效期至</span>
                      <div className="flex items-center gap-2">
                        <span className={`font-medium ${isValid ? 'text-gray-900' : 'text-red-600'}`}>
                          {formatDate(certificate.validUntil)}
                        </span>
                        {!isValid && (
                          <span className="px-2 py-0.5 bg-red-100 text-red-600 rounded-full text-xs font-medium">
                            已过期
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-center gap-8 py-6 border-t-2 border-dashed border-gold-200">
                  <div className="text-center">
                    <div className="w-24 h-24 bg-gray-100 rounded-lg flex items-center justify-center mb-2">
                      <div className="w-16 h-16 bg-gold-200/50 rounded flex items-center justify-center">
                        <span className="text-gold-600 text-xs font-bold">印章</span>
                      </div>
                    </div>
                    <p className="text-xs text-gray-400">认证机构公章</p>
                  </div>
                  <div className="text-center">
                    <QRCodeSVG value={verifyUrl} size={96} level="H" includeMargin />
                    <p className="text-xs text-gray-400 mt-2">扫码验证</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="mt-6 bg-white rounded-2xl p-6 shadow-sm border border-gray-100"
        >
          <h3 className="font-semibold text-gray-900 mb-4">验证信息</h3>
          <div className="space-y-3">
            <div className="flex items-center gap-3 p-3 bg-green-50 rounded-xl">
              <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0" />
              <div>
                <p className="font-medium text-green-800">证书状态验证通过</p>
                <p className="text-sm text-green-600">该证书信息真实有效，已通过区块链验证</p>
              </div>
            </div>
            <div className="flex items-center gap-3 p-3 bg-blue-50 rounded-xl">
              <Clock className="w-5 h-5 text-blue-500 flex-shrink-0" />
              <div>
                <p className="font-medium text-blue-800">验证时间</p>
                <p className="text-sm text-blue-600">{formatDate(new Date().toISOString())}</p>
              </div>
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="mt-6 flex gap-4"
        >
          <button
            onClick={() => window.print()}
            className="flex-1 py-4 bg-white border-2 border-gray-200 text-gray-700 font-semibold rounded-2xl hover:bg-gray-50 transition-colors flex items-center justify-center gap-2"
          >
            <Printer className="w-5 h-5" />
            <span>打印证书</span>
          </button>
          <button
            onClick={() => alert('证书下载功能（模拟）')}
            className="flex-1 py-4 bg-gradient-to-r from-gold-500 to-gold-600 text-white font-semibold rounded-2xl hover:from-gold-600 hover:to-gold-700 transition-colors flex items-center justify-center gap-2 shadow-lg shadow-gold-500/30"
          >
            <Download className="w-5 h-5" />
            <span>下载证书</span>
          </button>
        </motion.div>

        <div className="mt-8 text-center text-sm text-gray-400">
          <p>本证书由认证机构颁发，仅用于证明产品认证资格</p>
          <p className="mt-1">如有疑问，请联系认证机构或监管部门</p>
        </div>
      </div>
    </div>
  );
}
