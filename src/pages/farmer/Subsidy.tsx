import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  Plus,
  Search,
  Filter,
  DollarSign,
  Eye,
  CheckCircle,
  Clock,
  XCircle,
  Loader2,
  Calendar,
  FileText,
  ChevronRight,
  AlertCircle,
} from 'lucide-react';
import { api } from '../../services/api';
import { useAuthStore } from '../../store/authStore';
import { useToast } from '../../components/ui/MessageToast';
import { Modal } from '../../components/ui/Modal';
import { StatusBadge } from '../../components/ui/StatusBadge';
import type { SubsidyApplication, PlantingInfo } from '../../types';
import { formatDate, formatCurrency } from '../../utils/format';
import { cn } from '../../lib/utils';

const subsidySchema = z.object({
  plantingId: z.string().min(1, '请选择种植批次'),
  area: z.number().min(0.1, '种植面积必须大于0'),
  yieldAmount: z.number().min(1, '产量必须大于0'),
});

type SubsidyFormData = z.infer<typeof subsidySchema>;

const SUBSIDY_RATE_PER_AREA = 150;
const SUBSIDY_RATE_PER_YIELD = 0.5;

export default function FarmerSubsidy() {
  const { user } = useAuthStore();
  const toast = useToast();
  const [loading, setLoading] = useState(true);
  const [subsidies, setSubsidies] = useState<SubsidyApplication[]>([]);
  const [plantings, setPlantings] = useState<PlantingInfo[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [previewApplication, setPreviewApplication] = useState<SubsidyApplication | null>(null);
  const [calculatedAmount, setCalculatedAmount] = useState(0);

  const {
    register,
    handleSubmit,
    reset,
    watch,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<SubsidyFormData>({
    resolver: zodResolver(subsidySchema),
  });

  const watchArea = watch('area');
  const watchYield = watch('yieldAmount');
  const watchPlantingId = watch('plantingId');

  useEffect(() => {
    if (watchArea && watchYield) {
      const amount = watchArea * SUBSIDY_RATE_PER_AREA + watchYield * SUBSIDY_RATE_PER_YIELD;
      setCalculatedAmount(parseFloat(amount.toFixed(2)));
    } else {
      setCalculatedAmount(0);
    }
  }, [watchArea, watchYield]);

  useEffect(() => {
    if (watchPlantingId) {
      const planting = plantings.find(p => p.id === watchPlantingId);
      if (planting) {
        setValue('area', planting.area);
        setValue('yieldAmount', planting.actualYield || planting.expectedYield);
      }
    }
  }, [watchPlantingId, plantings, setValue]);

  useEffect(() => {
    if (user) {
      loadData();
    }
  }, [user]);

  const loadData = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const [subsidiesRes, plantingsRes] = await Promise.all([
        api.getSubsidies({ farmerId: user.id, page: 1, pageSize: 50 }),
        api.getPlantings({ farmerId: user.id, page: 1, pageSize: 50 }),
      ]);
      setSubsidies(subsidiesRes.items);
      setPlantings(plantingsRes.items);
    } catch (error) {
      toast.error('加载失败', error instanceof Error ? error.message : '请稍后重试');
    } finally {
      setLoading(false);
    }
  };

  const filteredSubsidies = subsidies.filter(s => {
    const planting = plantings.find(p => p.id === s.plantingId);
    const matchesSearch = planting?.cropType.includes(searchTerm) ||
      planting?.cropVariety.includes(searchTerm);
    const matchesStatus = statusFilter === 'all' || s.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const onSubmit = async (data: SubsidyFormData) => {
    try {
      const calculatedAmount = data.area * SUBSIDY_RATE_PER_AREA + data.yieldAmount * SUBSIDY_RATE_PER_YIELD;
      await api.createSubsidy({
        ...data,
        farmerId: user?.id,
        calculatedAmount: parseFloat(calculatedAmount.toFixed(2)),
        status: 'submitted',
        applicationDate: new Date().toISOString(),
      });
      toast.success('申请成功', '补贴申请已提交，请等待审核');
      setIsModalOpen(false);
      reset();
      setCalculatedAmount(0);
      loadData();
    } catch (error) {
      toast.error('提交失败', error instanceof Error ? error.message : '请稍后重试');
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'approved':
      case 'paid':
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'rejected':
        return <XCircle className="w-4 h-4 text-red-500" />;
      case 'submitted':
      case 'reviewing':
        return <Clock className="w-4 h-4 text-amber-500" />;
      default:
        return <FileText className="w-4 h-4 text-gray-400" />;
    }
  };

  const getStatusSteps = (application: SubsidyApplication) => [
    { label: '提交申请', completed: true, date: application.applicationDate },
    { label: '审核中', completed: ['reviewing', 'approved', 'paid'].includes(application.status), date: application.approvalDate },
    { label: '审核通过', completed: ['approved', 'paid'].includes(application.status), date: application.approvalDate },
    { label: '已打款', completed: application.status === 'paid', date: application.paymentDate },
  ];

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
          <h1 className="text-2xl font-bold text-gray-900">补贴申请</h1>
          <p className="text-gray-500 mt-1">申请和管理您的农业补贴</p>
        </div>
        <button
          onClick={() => {
            reset();
            setCalculatedAmount(0);
            setIsModalOpen(true);
          }}
          className="btn-primary flex items-center justify-center gap-2"
        >
          <Plus className="w-5 h-5" />
          新建申请
        </button>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="grid grid-cols-4 gap-4"
      >
        <div className="bg-white rounded-2xl border border-gray-100 p-4">
          <p className="text-sm text-gray-500 mb-1">总申请数</p>
          <p className="text-2xl font-bold text-gray-900">{subsidies.length}</p>
        </div>
        <div className="bg-white rounded-2xl border border-gray-100 p-4">
          <p className="text-sm text-gray-500 mb-1">待审核</p>
          <p className="text-2xl font-bold text-amber-600">
            {subsidies.filter(s => ['submitted', 'reviewing'].includes(s.status)).length}
          </p>
        </div>
        <div className="bg-white rounded-2xl border border-gray-100 p-4">
          <p className="text-sm text-gray-500 mb-1">已通过</p>
          <p className="text-2xl font-bold text-green-600">
            {subsidies.filter(s => ['approved', 'paid'].includes(s.status)).length}
          </p>
        </div>
        <div className="bg-white rounded-2xl border border-gray-100 p-4">
          <p className="text-sm text-gray-500 mb-1">累计补贴</p>
          <p className="text-2xl font-bold text-blue-600">
            ¥{formatCurrency(subsidies.filter(s => s.status === 'paid').reduce((sum, s) => sum + (s.actualAmount || 0), 0))}
          </p>
        </div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-2xl p-4"
      >
        <div className="flex items-start gap-3">
          <AlertCircle className="w-6 h-6 text-green-600 flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            <h3 className="font-semibold text-green-800">补贴标准说明</h3>
            <p className="text-green-700 text-sm mt-1">
              补贴金额 = 种植面积 × {SUBSIDY_RATE_PER_AREA}元/亩 + 产量 × {SUBSIDY_RATE_PER_YIELD}元/kg
            </p>
          </div>
        </div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="bg-white rounded-2xl border border-gray-100 shadow-lg p-4"
      >
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="搜索作物品种..."
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
              <option value="draft">草稿</option>
              <option value="submitted">已提交</option>
              <option value="reviewing">审核中</option>
              <option value="approved">已通过</option>
              <option value="rejected">已驳回</option>
              <option value="paid">已打款</option>
            </select>
          </div>
        </div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="bg-white rounded-2xl border border-gray-100 shadow-lg overflow-hidden"
      >
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                <th className="text-left px-6 py-4 text-sm font-semibold text-gray-600">申请信息</th>
                <th className="text-left px-6 py-4 text-sm font-semibold text-gray-600">面积/产量</th>
                <th className="text-left px-6 py-4 text-sm font-semibold text-gray-600">申请金额</th>
                <th className="text-left px-6 py-4 text-sm font-semibold text-gray-600">实际金额</th>
                <th className="text-left px-6 py-4 text-sm font-semibold text-gray-600">申请日期</th>
                <th className="text-left px-6 py-4 text-sm font-semibold text-gray-600">状态</th>
                <th className="text-left px-6 py-4 text-sm font-semibold text-gray-600">操作</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredSubsidies.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-16 text-center">
                    <DollarSign className="w-16 h-16 mx-auto mb-4 text-gray-300" />
                    <p className="text-gray-500 mb-2">暂无补贴申请</p>
                    <button
                      onClick={() => setIsModalOpen(true)}
                      className="text-green-600 hover:text-green-700 font-medium"
                    >
                      + 提交第一笔补贴申请
                    </button>
                  </td>
                </tr>
              ) : (
                filteredSubsidies.map((subsidy, index) => {
                  const planting = plantings.find(p => p.id === subsidy.plantingId);
                  return (
                    <motion.tr
                      key={subsidy.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.5 + index * 0.05 }}
                      className="hover:bg-gray-50 transition-colors"
                    >
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-lg bg-amber-100 flex items-center justify-center">
                            <DollarSign className="w-5 h-5 text-amber-600" />
                          </div>
                          <div>
                            <p className="font-medium text-gray-900">
                              {planting?.cropType || '-'}
                            </p>
                            <p className="text-sm text-gray-500">
                              {planting?.cropVariety || '-'}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-gray-600">
                        {subsidy.area}亩 / {subsidy.yieldAmount}kg
                      </td>
                      <td className="px-6 py-4 text-gray-600">
                        ¥{formatCurrency(subsidy.calculatedAmount)}
                      </td>
                      <td className="px-6 py-4">
                        {subsidy.actualAmount ? (
                          <span className="font-semibold text-green-600">
                            ¥{formatCurrency(subsidy.actualAmount)}
                          </span>
                        ) : (
                          <span className="text-gray-400">-</span>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2 text-gray-600">
                          <Calendar className="w-4 h-4 text-gray-400" />
                          <span>{formatDate(subsidy.applicationDate)}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <StatusBadge status={subsidy.status} />
                      </td>
                      <td className="px-6 py-4">
                        <button
                          onClick={() => setPreviewApplication(subsidy)}
                          className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                          title="查看详情"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                      </td>
                    </motion.tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </motion.div>

      <Modal
        open={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="新建补贴申请"
      >
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">选择种植批次</label>
            <select
              className={cn('input-field', errors.plantingId && 'border-red-300')}
              {...register('plantingId')}
            >
              <option value="">请选择种植批次</option>
              {plantings.map(planting => (
                <option key={planting.id} value={planting.id}>
                  {planting.cropType} - {planting.cropVariety} ({planting.area}亩)
                </option>
              ))}
            </select>
            {errors.plantingId && (
              <p className="mt-1 text-sm text-red-500">{errors.plantingId.message}</p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">种植面积（亩）</label>
              <input
                type="number"
                step="0.01"
                min="0"
                className={cn('input-field', errors.area && 'border-red-300')}
                {...register('area', { valueAsNumber: true })}
              />
              {errors.area && (
                <p className="mt-1 text-sm text-red-500">{errors.area.message}</p>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">产量（kg）</label>
              <input
                type="number"
                step="0.01"
                min="0"
                className={cn('input-field', errors.yieldAmount && 'border-red-300')}
                {...register('yieldAmount', { valueAsNumber: true })}
              />
              {errors.yieldAmount && (
                <p className="mt-1 text-sm text-red-500">{errors.yieldAmount.message}</p>
              )}
            </div>
          </div>

          {calculatedAmount > 0 && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-xl p-4"
            >
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">面积补贴（{SUBSIDY_RATE_PER_AREA}元/亩）</span>
                  <span className="font-medium text-gray-900">
                    ¥{formatCurrency((watchArea || 0) * SUBSIDY_RATE_PER_AREA)}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">产量补贴（{SUBSIDY_RATE_PER_YIELD}元/kg）</span>
                  <span className="font-medium text-gray-900">
                    ¥{formatCurrency((watchYield || 0) * SUBSIDY_RATE_PER_YIELD)}
                  </span>
                </div>
                <div className="border-t border-green-200 pt-2 flex justify-between">
                  <span className="font-semibold text-gray-900">预计补贴金额</span>
                  <span className="text-2xl font-bold gradient-text">
                    ¥{formatCurrency(calculatedAmount)}
                  </span>
                </div>
              </div>
            </motion.div>
          )}

          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={() => setIsModalOpen(false)}
              className="flex-1 btn-secondary"
            >
              取消
            </button>
            <button
              type="submit"
              disabled={isSubmitting || calculatedAmount === 0}
              className="flex-1 btn-primary flex items-center justify-center gap-2"
            >
              {isSubmitting ? (
                <><Loader2 className="w-5 h-5 animate-spin" /> 提交中...</>
              ) : (
                '提交申请'
              )}
            </button>
          </div>
        </form>
      </Modal>

      <Modal
        open={!!previewApplication}
        onClose={() => setPreviewApplication(null)}
        title="补贴申请详情"
        size="lg"
      >
        {previewApplication && (
          <div className="space-y-6">
            <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-2xl p-6">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-lg font-bold text-gray-900">补贴申请单</h3>
                  <p className="text-sm text-gray-500">申请日期：{formatDate(previewApplication.applicationDate)}</p>
                </div>
                <StatusBadge status={previewApplication.status} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-500">种植面积</p>
                  <p className="text-xl font-bold text-gray-900">{previewApplication.area} 亩</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">产量</p>
                  <p className="text-xl font-bold text-gray-900">{previewApplication.yieldAmount} kg</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">申请金额</p>
                  <p className="text-xl font-bold text-gray-900">¥{formatCurrency(previewApplication.calculatedAmount)}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">实际金额</p>
                  <p className="text-xl font-bold text-green-600">
                    {previewApplication.actualAmount ? `¥${formatCurrency(previewApplication.actualAmount)}` : '-'}
                  </p>
                </div>
              </div>
            </div>

            <div>
              <h4 className="font-semibold text-gray-900 mb-4">审批进度</h4>
              <div className="relative">
                {getStatusSteps(previewApplication).map((step, index, arr) => (
                  <div key={index} className="flex gap-4">
                    <div className="relative flex flex-col items-center">
                      <div className={cn(
                        'w-10 h-10 rounded-full flex items-center justify-center z-10',
                        step.completed ? 'bg-green-500 text-white' : 'bg-gray-200 text-gray-400'
                      )}>
                        {step.completed ? <CheckCircle className="w-5 h-5" /> : (index + 1)}
                      </div>
                      {index < arr.length - 1 && (
                        <div className={cn(
                          'w-0.5 h-full min-h-12',
                          step.completed ? 'bg-green-500' : 'bg-gray-200'
                        )} />
                      )}
                    </div>
                    <div className="flex-1 pb-6">
                      <div className="flex items-center justify-between">
                        <p className={cn(
                          'font-medium',
                          step.completed ? 'text-gray-900' : 'text-gray-400'
                        )}>
                          {step.label}
                        </p>
                        {step.date && (
                          <p className="text-sm text-gray-500">{formatDate(step.date)}</p>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {previewApplication.remark && (
              <div className="bg-gray-50 rounded-xl p-4">
                <h4 className="font-semibold text-gray-900 mb-2">审批意见</h4>
                <p className="text-gray-600">{previewApplication.remark}</p>
              </div>
            )}

            <div className="flex gap-3">
              <button
                onClick={() => setPreviewApplication(null)}
                className="flex-1 btn-secondary"
              >
                关闭
              </button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
