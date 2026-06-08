import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  QrCode,
  Plus,
  Search,
  Filter,
  Download,
  Printer,
  Eye,
  Loader2,
  CheckCircle,
  XCircle,
  Clock,
  Sparkles,
} from 'lucide-react';
import { api } from '../../services/api';
import { useAuthStore } from '../../store/authStore';
import { useToast } from '../../components/ui/MessageToast';
import { Modal } from '../../components/ui/Modal';
import { QRCodeDisplay } from '../../components/ui/QRCodeDisplay';
import type { TraceCode, PlantingInfo } from '../../types';
import { formatDate } from '../../utils/format';
import { cn } from '../../lib/utils';

export default function FarmerTraceCodes() {
  const { user } = useAuthStore();
  const toast = useToast();
  const [loading, setLoading] = useState(true);
  const [traceCodes, setTraceCodes] = useState<TraceCode[]>([]);
  const [plantings, setPlantings] = useState<PlantingInfo[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [isGenerateModalOpen, setIsGenerateModalOpen] = useState(false);
  const [selectedPlantingId, setSelectedPlantingId] = useState('');
  const [generateCount, setGenerateCount] = useState(10);
  const [isGenerating, setIsGenerating] = useState(false);
  const [previewCode, setPreviewCode] = useState<TraceCode | null>(null);

  useEffect(() => {
    if (user) {
      loadData();
    }
  }, [user]);

  const loadData = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const [codesRes, plantingsRes] = await Promise.all([
        api.getTraceCodes({ farmerId: user.id, page: 1, pageSize: 100 }),
        api.getPlantings({ farmerId: user.id, page: 1, pageSize: 50 }),
      ]);
      setTraceCodes(codesRes.items);
      setPlantings(plantingsRes.items);
    } catch (error) {
      toast.error('加载失败', error instanceof Error ? error.message : '请稍后重试');
    } finally {
      setLoading(false);
    }
  };

  const filteredCodes = traceCodes.filter(code => {
    const matchesSearch = code.code.includes(searchTerm);
    const matchesStatus = statusFilter === 'all' || code.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const handleGenerate = async () => {
    if (!selectedPlantingId) {
      toast.error('请选择种植批次');
      return;
    }
    setIsGenerating(true);
    try {
      const planting = plantings.find(p => p.id === selectedPlantingId);
      for (let i = 0; i < generateCount; i++) {
        await api.createTraceCode({
          plantingId: selectedPlantingId,
          farmerId: user?.id,
          plotId: planting?.plotId,
          code: `TRACE${Date.now()}${String(i).padStart(4, '0')}`,
          status: 'active',
        });
      }
      toast.success('生成成功', `成功生成 ${generateCount} 个追溯码`);
      setIsGenerateModalOpen(false);
      setSelectedPlantingId('');
      setGenerateCount(10);
      loadData();
    } catch (error) {
      toast.error('生成失败', error instanceof Error ? error.message : '请稍后重试');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleDownload = (code: TraceCode) => {
    toast.success('下载成功', `追溯码 ${code.code} 二维码已下载`);
  };

  const handlePrint = (code: TraceCode) => {
    toast.success('打印任务已发送', `追溯码 ${code.code} 正在打印`);
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'active':
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'used':
        return <CheckCircle className="w-4 h-4 text-blue-500" />;
      case 'expired':
        return <XCircle className="w-4 h-4 text-gray-400" />;
      default:
        return <Clock className="w-4 h-4 text-gray-400" />;
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'active': return '未使用';
      case 'used': return '已使用';
      case 'expired': return '已过期';
      default: return status;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-700 border-green-200';
      case 'used': return 'bg-blue-100 text-blue-700 border-blue-200';
      case 'expired': return 'bg-gray-100 text-gray-600 border-gray-200';
      default: return 'bg-gray-100 text-gray-600 border-gray-200';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <div className="text-center">
          <Loader2 className="w-12 h-12 mx-auto mb-4 text-green-500 animate-spin" />
          <p className="text-gray-500">加载中...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4"
      >
        <div>
          <h1 className="text-2xl font-bold text-gray-900">追溯码管理</h1>
          <p className="text-gray-500 mt-1">生成和管理您的农产品追溯码</p>
        </div>
        <button
          onClick={() => setIsGenerateModalOpen(true)}
          className="btn-primary flex items-center justify-center gap-2"
        >
          <Sparkles className="w-5 h-5" />
          生成追溯码
        </button>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="grid grid-cols-3 gap-4"
      >
        <div className="bg-white rounded-2xl border border-gray-100 p-4">
          <p className="text-sm text-gray-500 mb-1">总追溯码</p>
          <p className="text-2xl font-bold text-gray-900">{traceCodes.length}</p>
        </div>
        <div className="bg-white rounded-2xl border border-gray-100 p-4">
          <p className="text-sm text-gray-500 mb-1">未使用</p>
          <p className="text-2xl font-bold text-green-600">
            {traceCodes.filter(c => c.status === 'active').length}
          </p>
        </div>
        <div className="bg-white rounded-2xl border border-gray-100 p-4">
          <p className="text-sm text-gray-500 mb-1">已使用</p>
          <p className="text-2xl font-bold text-blue-600">
            {traceCodes.filter(c => c.status === 'used').length}
          </p>
        </div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="bg-white rounded-2xl border border-gray-100 shadow-lg p-4"
      >
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="搜索追溯码..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
            />
          </div>
          <div className="flex items-center gap-2">
            <Filter className="w-5 h-5 text-gray-400" />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
            >
              <option value="all">全部状态</option>
              <option value="active">未使用</option>
              <option value="used">已使用</option>
              <option value="expired">已过期</option>
            </select>
          </div>
        </div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="bg-white rounded-2xl border border-gray-100 shadow-lg p-6"
      >
        {filteredCodes.length === 0 ? (
          <div className="text-center py-16">
            <QrCode className="w-16 h-16 mx-auto mb-4 text-gray-300" />
            <p className="text-gray-500 mb-2">暂无追溯码</p>
            <button
              onClick={() => setIsGenerateModalOpen(true)}
              className="text-green-600 hover:text-green-700 font-medium"
            >
              + 生成第一批追溯码
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
            <AnimatePresence>
              {filteredCodes.map((code, index) => {
                const planting = plantings.find(p => p.id === code.plantingId);
                return (
                  <motion.div
                    key={code.id}
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: index * 0.03 }}
                    whileHover={{ scale: 1.02, y: -4 }}
                    className="relative bg-white border border-gray-100 rounded-2xl p-4 shadow-sm hover:shadow-lg transition-all"
                  >
                    <div className="flex justify-between items-start mb-3">
                      <span className={cn(
                        'flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-medium border',
                        getStatusColor(code.status)
                      )}>
                        {getStatusIcon(code.status)}
                        {getStatusLabel(code.status)}
                      </span>
                    </div>
                    
                    <div className="flex justify-center mb-3">
                      <div className="w-24 h-24 bg-white border-2 border-dashed border-gray-200 rounded-xl flex items-center justify-center">
                        <QrCode className="w-16 h-16 text-gray-400" />
                      </div>
                    </div>
                    
                    <div className="text-center mb-3">
                      <p className="font-mono text-xs text-gray-600 truncate">{code.code}</p>
                      {planting && (
                        <p className="text-xs text-gray-400 mt-1 truncate">
                          {planting.cropType}
                        </p>
                      )}
                    </div>
                    
                    <p className="text-xs text-gray-400 text-center mb-3">
                      {formatDate(code.createdAt)}
                    </p>
                    
                    <div className="flex items-center justify-center gap-1">
                      <button
                        onClick={() => setPreviewCode(code)}
                        className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                        title="预览"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDownload(code)}
                        className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                        title="下载"
                      >
                        <Download className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handlePrint(code)}
                        className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                        title="打印"
                      >
                        <Printer className="w-4 h-4" />
                      </button>
                    </div>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>
        )}
      </motion.div>

      <Modal
        open={isGenerateModalOpen}
        onClose={() => setIsGenerateModalOpen(false)}
        title="生成追溯码"
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">选择种植批次</label>
            <select
              value={selectedPlantingId}
              onChange={(e) => setSelectedPlantingId(e.target.value)}
              className="input-field"
            >
              <option value="">请选择种植批次</option>
              {plantings.map(planting => (
                <option key={planting.id} value={planting.id}>
                  {planting.cropType} - {planting.cropVariety} ({planting.area}亩)
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">生成数量</label>
            <div className="flex items-center gap-3">
              <button
                onClick={() => setGenerateCount(Math.max(1, generateCount - 10))}
                className="w-10 h-10 flex items-center justify-center bg-gray-100 hover:bg-gray-200 rounded-xl transition-colors"
              >
                -
              </button>
              <input
                type="number"
                min="1"
                max="1000"
                value={generateCount}
                onChange={(e) => setGenerateCount(Math.min(1000, Math.max(1, parseInt(e.target.value) || 1)))}
                className="flex-1 input-field text-center"
              />
              <button
                onClick={() => setGenerateCount(Math.min(1000, generateCount + 10))}
                className="w-10 h-10 flex items-center justify-center bg-gray-100 hover:bg-gray-200 rounded-xl transition-colors"
              >
                +
              </button>
            </div>
            <div className="flex gap-2 mt-2">
              {[10, 50, 100, 500].map(num => (
                <button
                  key={num}
                  onClick={() => setGenerateCount(num)}
                  className={cn(
                    'flex-1 py-1.5 text-sm rounded-lg transition-colors',
                    generateCount === num
                      ? 'bg-green-500 text-white'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  )}
                >
                  {num}
                </button>
              ))}
            </div>
          </div>

          {selectedPlantingId && (
            <div className="bg-green-50 border border-green-200 rounded-xl p-4">
              <p className="text-sm text-green-700">
                将为选中的种植批次生成 <strong>{generateCount}</strong> 个追溯码
              </p>
            </div>
          )}

          <div className="flex gap-3 pt-4">
            <button
              onClick={() => setIsGenerateModalOpen(false)}
              className="flex-1 btn-secondary"
            >
              取消
            </button>
            <button
              onClick={handleGenerate}
              disabled={isGenerating || !selectedPlantingId}
              className="flex-1 btn-primary flex items-center justify-center gap-2"
            >
              {isGenerating ? (
                <><Loader2 className="w-5 h-5 animate-spin" /> 生成中...</>
              ) : (
                <><Sparkles className="w-5 h-5" /> 生成追溯码</>
              )}
            </button>
          </div>
        </div>
      </Modal>

      <Modal
        open={!!previewCode}
        onClose={() => setPreviewCode(null)}
        title="追溯码预览"
      >
        {previewCode && (
          <div className="text-center">
            <div className="inline-block p-6 bg-white border-4 border-green-500 rounded-3xl mb-4">
              <QRCodeDisplay
                value={previewCode.code}
                size={200}
              />
            </div>
            <p className="font-mono text-lg text-gray-900 mb-2">{previewCode.code}</p>
            <p className="text-sm text-gray-500 mb-6">
              生成时间：{formatDate(previewCode.createdAt)}
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => handleDownload(previewCode)}
                className="flex-1 btn-secondary flex items-center justify-center gap-2"
              >
                <Download className="w-5 h-5" />
                下载
              </button>
              <button
                onClick={() => handlePrint(previewCode)}
                className="flex-1 btn-primary flex items-center justify-center gap-2"
              >
                <Printer className="w-5 h-5" />
                打印
              </button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
