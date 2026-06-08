import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  Plus,
  Search,
  Filter,
  Droplets,
  AlertTriangle,
  CheckCircle,
  Clock,
  Calendar,
  Leaf,
  Loader2,
} from 'lucide-react';
import { api } from '../../services/api';
import { useAuthStore } from '../../store/authStore';
import { useToast } from '../../components/ui/MessageToast';
import { Modal } from '../../components/ui/Modal';
import type { PesticideRecord, PlantingInfo } from '../../types';
import { formatDate } from '../../utils/format';
import { cn } from '../../lib/utils';

const pesticideSchema = z.object({
  plantingId: z.string().min(1, '请选择种植批次'),
  pesticideName: z.string().min(1, '请输入农药名称'),
  pesticideType: z.string().min(1, '请选择农药类型'),
  useDate: z.string().min(1, '请选择使用日期'),
  dosage: z.number().min(0.1, '用量必须大于0'),
  safeInterval: z.number().min(1, '安全间隔期必须大于0'),
  operator: z.string().min(1, '请输入操作人员'),
});

type PesticideFormData = z.infer<typeof pesticideSchema>;

const pesticideTypes = ['杀虫剂', '杀菌剂', '除草剂', '杀螨剂', '植物生长调节剂'];
const pesticideNames = ['敌敌畏', '乐果', '氧化乐果', '毒死蜱', '辛硫磷', '吡虫啉', '噻虫嗪', '氯氰菊酯', '溴氰菊酯', '多菌灵', '甲基托布津', '百菌清'];

export default function FarmerPesticide() {
  const { user } = useAuthStore();
  const toast = useToast();
  const [loading, setLoading] = useState(true);
  const [records, setRecords] = useState<PesticideRecord[]>([]);
  const [plantings, setPlantings] = useState<PlantingInfo[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [warnings, setWarnings] = useState<{ record: PesticideRecord; daysLeft: number }[]>([]);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<PesticideFormData>({
    resolver: zodResolver(pesticideSchema),
  });

  useEffect(() => {
    if (user) {
      loadData();
    }
  }, [user]);

  const loadData = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const [recordsRes, plantingsRes] = await Promise.all([
        api.getPesticideRecords({ page: 1, pageSize: 50 }),
        api.getPlantings({ farmerId: user.id, page: 1, pageSize: 50 }),
      ]);
      setRecords(recordsRes.items);
      setPlantings(plantingsRes.items);

      const now = new Date();
      const warningList = recordsRes.items
        .map(record => {
          const useDate = new Date(record.useDate);
          const safeDate = new Date(useDate);
          safeDate.setDate(safeDate.getDate() + record.safeInterval);
          const daysLeft = Math.ceil((safeDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
          return { record, daysLeft };
        })
        .filter(item => item.daysLeft > 0 && item.daysLeft <= 30)
        .sort((a, b) => a.daysLeft - b.daysLeft);
      setWarnings(warningList);
    } catch (error) {
      toast.error('加载失败', error instanceof Error ? error.message : '请稍后重试');
    } finally {
      setLoading(false);
    }
  };

  const filteredRecords = records.filter(r =>
    r.pesticideName.includes(searchTerm) ||
    r.pesticideType.includes(searchTerm)
  );

  const onSubmit = async (data: PesticideFormData) => {
    try {
      await api.createPesticideRecord({ ...data, farmerId: user?.id });
      toast.success('记录成功', '用药记录已保存');
      setIsModalOpen(false);
      reset();
      loadData();
    } catch (error) {
      toast.error('保存失败', error instanceof Error ? error.message : '请稍后重试');
    }
  };

  const checkCompliance = (record: PesticideRecord) => {
    const now = new Date();
    const useDate = new Date(record.useDate);
    const safeDate = new Date(useDate);
    safeDate.setDate(safeDate.getDate() + record.safeInterval);
    return now >= safeDate;
  };

  const getDaysUntilSafe = (record: PesticideRecord) => {
    const now = new Date();
    const useDate = new Date(record.useDate);
    const safeDate = new Date(useDate);
    safeDate.setDate(safeDate.getDate() + record.safeInterval);
    const diffTime = safeDate.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
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
          <h1 className="text-2xl font-bold text-gray-900">用药记录</h1>
          <p className="text-gray-500 mt-1">记录和管理农药使用情况</p>
        </div>
        <button
          onClick={() => setIsModalOpen(true)}
          className="btn-primary flex items-center justify-center gap-2"
        >
          <Plus className="w-5 h-5" />
          新增记录
        </button>
      </motion.div>

      {warnings.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="space-y-3"
        >
          {warnings.map(({ record, daysLeft }, index) => (
            <motion.div
              key={record.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.15 + index * 0.1 }}
              className={cn(
                'p-4 rounded-2xl border flex items-center gap-4',
                daysLeft <= 7
                  ? 'bg-red-50 border-red-200'
                  : 'bg-amber-50 border-amber-200'
              )}
            >
              <div className={cn(
                'w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0',
                daysLeft <= 7 ? 'bg-red-100' : 'bg-amber-100'
              )}>
                <AlertTriangle className={cn(
                  'w-6 h-6',
                  daysLeft <= 7 ? 'text-red-600' : 'text-amber-600'
                )} />
              </div>
              <div className="flex-1 min-w-0">
                <h4 className={cn(
                  'font-semibold',
                  daysLeft <= 7 ? 'text-red-800' : 'text-amber-800'
                )}>
                  安全间隔期提醒
                </h4>
                <p className={cn(
                  'text-sm',
                  daysLeft <= 7 ? 'text-red-700' : 'text-amber-700'
                )}>
                  {record.pesticideName} 还需 <strong>{daysLeft}</strong> 天到达安全间隔期
                  （{formatDate(record.useDate)} 使用，安全间隔期 {record.safeInterval} 天）
                </p>
              </div>
              <div className={cn(
                'px-4 py-2 rounded-xl font-bold text-lg',
                daysLeft <= 7
                  ? 'bg-red-100 text-red-700'
                  : 'bg-amber-100 text-amber-700'
              )}>
                {daysLeft}天
              </div>
            </motion.div>
          ))}
        </motion.div>
      )}

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="grid grid-cols-4 gap-4"
      >
        <div className="bg-white rounded-2xl border border-gray-100 p-4">
          <p className="text-sm text-gray-500 mb-1">总用药记录</p>
          <p className="text-2xl font-bold text-gray-900">{records.length}</p>
        </div>
        <div className="bg-white rounded-2xl border border-gray-100 p-4">
          <p className="text-sm text-gray-500 mb-1">待安全间隔</p>
          <p className="text-2xl font-bold text-amber-600">{warnings.length}</p>
        </div>
        <div className="bg-white rounded-2xl border border-gray-100 p-4">
          <p className="text-sm text-gray-500 mb-1">已合规</p>
          <p className="text-2xl font-bold text-green-600">
            {records.filter(r => checkCompliance(r)).length}
          </p>
        </div>
        <div className="bg-white rounded-2xl border border-gray-100 p-4">
          <p className="text-sm text-gray-500 mb-1">本月使用</p>
          <p className="text-2xl font-bold text-blue-600">
            {records.filter(r => {
              const date = new Date(r.useDate);
              const now = new Date();
              return date.getMonth() === now.getMonth() && date.getFullYear() === now.getFullYear();
            }).length}
          </p>
        </div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="bg-white rounded-2xl border border-gray-100 shadow-lg p-4"
      >
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            placeholder="搜索农药名称或类型..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
          />
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
                <th className="text-left px-6 py-4 text-sm font-semibold text-gray-600">农药信息</th>
                <th className="text-left px-6 py-4 text-sm font-semibold text-gray-600">对应作物</th>
                <th className="text-left px-6 py-4 text-sm font-semibold text-gray-600">使用日期</th>
                <th className="text-left px-6 py-4 text-sm font-semibold text-gray-600">用量</th>
                <th className="text-left px-6 py-4 text-sm font-semibold text-gray-600">安全间隔期</th>
                <th className="text-left px-6 py-4 text-sm font-semibold text-gray-600">合规性</th>
                <th className="text-left px-6 py-4 text-sm font-semibold text-gray-600">操作人员</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredRecords.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-16 text-center">
                    <Droplets className="w-16 h-16 mx-auto mb-4 text-gray-300" />
                    <p className="text-gray-500 mb-2">暂无用药记录</p>
                    <button
                      onClick={() => setIsModalOpen(true)}
                      className="text-green-600 hover:text-green-700 font-medium"
                    >
                      + 新增第一条用药记录
                    </button>
                  </td>
                </tr>
              ) : (
                filteredRecords.map((record, index) => {
                  const planting = plantings.find(p => p.id === record.plantingId);
                  const isCompliant = checkCompliance(record);
                  const daysLeft = getDaysUntilSafe(record);
                  return (
                    <motion.tr
                      key={record.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.5 + index * 0.05 }}
                      className="hover:bg-gray-50 transition-colors"
                    >
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-lg bg-purple-100 flex items-center justify-center">
                            <Droplets className="w-5 h-5 text-purple-600" />
                          </div>
                          <div>
                            <p className="font-medium text-gray-900">{record.pesticideName}</p>
                            <p className="text-sm text-gray-500">{record.pesticideType}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2 text-gray-600">
                          <Leaf className="w-4 h-4 text-gray-400" />
                          <span>{planting?.cropType || '-'}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2 text-gray-600">
                          <Calendar className="w-4 h-4 text-gray-400" />
                          <span>{formatDate(record.useDate)}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-gray-600">{record.dosage} kg/亩</td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <Clock className="w-4 h-4 text-gray-400" />
                          <span className="text-gray-600">{record.safeInterval} 天</span>
                          {!isCompliant && daysLeft > 0 && (
                            <span className={cn(
                              'px-2 py-0.5 rounded-full text-xs font-medium',
                              daysLeft <= 7
                                ? 'bg-red-100 text-red-700'
                                : 'bg-amber-100 text-amber-700'
                            )}>
                              还剩 {daysLeft} 天
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        {isCompliant ? (
                          <span className="flex items-center gap-1.5 px-3 py-1.5 bg-green-100 text-green-700 rounded-xl text-sm font-medium">
                            <CheckCircle className="w-4 h-4" />
                            合规
                          </span>
                        ) : (
                          <span className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-100 text-amber-700 rounded-xl text-sm font-medium">
                            <Clock className="w-4 h-4" />
                            间隔期内
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-gray-600">{record.operator}</td>
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
        title="新增用药记录"
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
              <label className="block text-sm font-medium text-gray-700 mb-2">农药名称</label>
              <select
                className={cn('input-field', errors.pesticideName && 'border-red-300')}
                {...register('pesticideName')}
              >
                <option value="">请选择农药</option>
                {pesticideNames.map(name => (
                  <option key={name} value={name}>{name}</option>
                ))}
              </select>
              {errors.pesticideName && (
                <p className="mt-1 text-sm text-red-500">{errors.pesticideName.message}</p>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">农药类型</label>
              <select
                className={cn('input-field', errors.pesticideType && 'border-red-300')}
                {...register('pesticideType')}
              >
                <option value="">请选择类型</option>
                {pesticideTypes.map(type => (
                  <option key={type} value={type}>{type}</option>
                ))}
              </select>
              {errors.pesticideType && (
                <p className="mt-1 text-sm text-red-500">{errors.pesticideType.message}</p>
              )}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">使用日期</label>
              <input
                type="date"
                className={cn('input-field', errors.useDate && 'border-red-300')}
                {...register('useDate')}
              />
              {errors.useDate && (
                <p className="mt-1 text-sm text-red-500">{errors.useDate.message}</p>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">用量（kg/亩）</label>
              <input
                type="number"
                step="0.01"
                min="0"
                className={cn('input-field', errors.dosage && 'border-red-300')}
                {...register('dosage', { valueAsNumber: true })}
              />
              {errors.dosage && (
                <p className="mt-1 text-sm text-red-500">{errors.dosage.message}</p>
              )}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">安全间隔期（天）</label>
              <input
                type="number"
                min="1"
                className={cn('input-field', errors.safeInterval && 'border-red-300')}
                {...register('safeInterval', { valueAsNumber: true })}
              />
              {errors.safeInterval && (
                <p className="mt-1 text-sm text-red-500">{errors.safeInterval.message}</p>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">操作人员</label>
              <input
                type="text"
                placeholder="请输入操作人员姓名"
                className={cn('input-field', errors.operator && 'border-red-300')}
                {...register('operator')}
              />
              {errors.operator && (
                <p className="mt-1 text-sm text-red-500">{errors.operator.message}</p>
              )}
            </div>
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
            <p className="text-sm text-blue-700 flex items-start gap-2">
              <AlertTriangle className="w-5 h-5 flex-shrink-0 mt-0.5" />
              <span>
                请严格按照农药使用说明操作，遵守安全间隔期规定，确保农产品质量安全。
                违规使用农药将承担相应法律责任。
              </span>
            </p>
          </div>

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
              disabled={isSubmitting}
              className="flex-1 btn-primary flex items-center justify-center gap-2"
            >
              {isSubmitting ? (
                <><Loader2 className="w-5 h-5 animate-spin" /> 保存中...</>
              ) : (
                '保存记录'
              )}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
