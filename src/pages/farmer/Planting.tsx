import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  Plus,
  Edit,
  Trash2,
  Search,
  Filter,
  X,
  Leaf,
  MapPin,
  Calendar,
  Sprout,
  Loader2,
} from 'lucide-react';
import { api } from '../../services/api';
import { useAuthStore } from '../../store/authStore';
import { useToast } from '../../components/ui/MessageToast';
import { Modal } from '../../components/ui/Modal';
import { StatusBadge } from '../../components/ui/StatusBadge';
import type { PlantingInfo, Plot } from '../../types';
import { formatDate } from '../../utils/format';
import { cn } from '../../lib/utils';

const plantingSchema = z.object({
  plotId: z.string().min(1, '请选择地块'),
  cropType: z.string().min(1, '请输入作物品种'),
  cropVariety: z.string().min(1, '请输入作物细分品种'),
  area: z.number().min(0.1, '种植面积必须大于0'),
  plantDate: z.string().min(1, '请选择播种日期'),
  expectedHarvestDate: z.string().min(1, '请选择预估采收日期'),
  expectedYield: z.number().min(1, '预估产量必须大于0'),
});

type PlantingFormData = z.infer<typeof plantingSchema>;

const cropTypes = ['水稻', '小麦', '玉米', '大豆', '西红柿', '黄瓜', '白菜', '萝卜', '苹果', '橙子', '葡萄', '草莓'];

export default function FarmerPlanting() {
  const { user } = useAuthStore();
  const toast = useToast();
  const [loading, setLoading] = useState(true);
  const [plantings, setPlantings] = useState<PlantingInfo[]>([]);
  const [plots, setPlots] = useState<Plot[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingPlanting, setEditingPlanting] = useState<PlantingInfo | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<PlantingFormData>({
    resolver: zodResolver(plantingSchema),
  });

  const selectedCropType = watch('cropType');

  useEffect(() => {
    if (user) {
      loadData();
    }
  }, [user]);

  const loadData = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const [plantingsRes, plotsRes] = await Promise.all([
        api.getPlantings({ farmerId: user.id, page: 1, pageSize: 50 }),
        api.getPlots({ farmerId: user.id, page: 1, pageSize: 50 }),
      ]);
      setPlantings(plantingsRes.items);
      setPlots(plotsRes.items);
    } catch (error) {
      toast.error('加载失败', error instanceof Error ? error.message : '请稍后重试');
    } finally {
      setLoading(false);
    }
  };

  const filteredPlantings = plantings.filter(p => {
    const matchesSearch = p.cropType.includes(searchTerm) ||
      p.cropVariety.includes(searchTerm);
    const matchesStatus = statusFilter === 'all' || p.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const openAddModal = () => {
    setEditingPlanting(null);
    reset({
      plotId: '',
      cropType: '',
      cropVariety: '',
      area: 0,
      plantDate: '',
      expectedHarvestDate: '',
      expectedYield: 0,
    });
    setIsModalOpen(true);
  };

  const openEditModal = (planting: PlantingInfo) => {
    setEditingPlanting(planting);
    reset({
      plotId: planting.plotId,
      cropType: planting.cropType,
      cropVariety: planting.cropVariety,
      area: planting.area,
      plantDate: planting.plantDate.split('T')[0],
      expectedHarvestDate: planting.expectedHarvestDate.split('T')[0],
      expectedYield: planting.expectedYield,
    });
    setIsModalOpen(true);
  };

  const onSubmit = async (data: PlantingFormData) => {
    try {
      if (editingPlanting) {
        await api.updatePlanting(editingPlanting.id, data);
        toast.success('更新成功', '种植信息已更新');
      } else {
        await api.createPlanting({ ...data, farmerId: user?.id });
        toast.success('创建成功', '种植信息已创建');
      }
      setIsModalOpen(false);
      loadData();
    } catch (error) {
      toast.error('操作失败', error instanceof Error ? error.message : '请稍后重试');
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await api.updatePlanting(id, { status: 'harvested' });
      toast.success('操作成功', '种植信息已归档');
      setDeleteConfirm(null);
      loadData();
    } catch (error) {
      toast.error('操作失败', error instanceof Error ? error.message : '请稍后重试');
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
          <h1 className="text-2xl font-bold text-gray-900">种植信息管理</h1>
          <p className="text-gray-500 mt-1">管理您的种植地块和作物信息</p>
        </div>
        <button
          onClick={openAddModal}
          className="btn-primary flex items-center justify-center gap-2"
        >
          <Plus className="w-5 h-5" />
          新增种植
        </button>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
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
              <option value="planting">种植中</option>
              <option value="growing">生长中</option>
              <option value="ready">待采收</option>
              <option value="harvested">已采收</option>
            </select>
          </div>
        </div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="bg-white rounded-2xl border border-gray-100 shadow-lg overflow-hidden"
      >
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                <th className="text-left px-6 py-4 text-sm font-semibold text-gray-600">作物信息</th>
                <th className="text-left px-6 py-4 text-sm font-semibold text-gray-600">地块</th>
                <th className="text-left px-6 py-4 text-sm font-semibold text-gray-600">面积</th>
                <th className="text-left px-6 py-4 text-sm font-semibold text-gray-600">播种日期</th>
                <th className="text-left px-6 py-4 text-sm font-semibold text-gray-600">预估产量</th>
                <th className="text-left px-6 py-4 text-sm font-semibold text-gray-600">状态</th>
                <th className="text-left px-6 py-4 text-sm font-semibold text-gray-600">操作</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              <AnimatePresence>
                {filteredPlantings.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-6 py-16 text-center">
                      <Sprout className="w-16 h-16 mx-auto mb-4 text-gray-300" />
                      <p className="text-gray-500 mb-2">暂无种植记录</p>
                      <button
                        onClick={openAddModal}
                        className="text-green-600 hover:text-green-700 font-medium"
                      >
                        + 新增第一条种植信息
                      </button>
                    </td>
                  </tr>
                ) : (
                  filteredPlantings.map((planting, index) => {
                    const plot = plots.find(p => p.id === planting.plotId);
                    return (
                      <motion.tr
                        key={planting.id}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.3 + index * 0.05 }}
                        className="hover:bg-gray-50 transition-colors"
                      >
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-lg bg-green-100 flex items-center justify-center">
                              <Leaf className="w-5 h-5 text-green-600" />
                            </div>
                            <div>
                              <p className="font-medium text-gray-900">{planting.cropType}</p>
                              <p className="text-sm text-gray-500">{planting.cropVariety}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2 text-gray-600">
                            <MapPin className="w-4 h-4 text-gray-400" />
                            <span>{plot?.name || '未知地块'}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-gray-600">{planting.area} 亩</td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2 text-gray-600">
                            <Calendar className="w-4 h-4 text-gray-400" />
                            <span>{formatDate(planting.plantDate)}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-gray-600">{planting.expectedYield} kg</td>
                        <td className="px-6 py-4">
                          <StatusBadge status={planting.status} />
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => openEditModal(planting)}
                              className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                            >
                              <Edit className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => setDeleteConfirm(planting.id)}
                              className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </motion.tr>
                    );
                  })
                )}
              </AnimatePresence>
            </tbody>
          </table>
        </div>
      </motion.div>

      <Modal
        open={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingPlanting ? '编辑种植信息' : '新增种植信息'}
      >
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">选择地块</label>
            <select
              className={cn('input-field', errors.plotId && 'border-red-300')}
              {...register('plotId')}
            >
              <option value="">请选择地块</option>
              {plots.map(plot => (
                <option key={plot.id} value={plot.id}>
                  {plot.name} ({plot.area}亩)
                </option>
              ))}
            </select>
            {errors.plotId && (
              <p className="mt-1 text-sm text-red-500">{errors.plotId.message}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">作物品种</label>
            <select
              className={cn('input-field', errors.cropType && 'border-red-300')}
              {...register('cropType')}
              onChange={(e) => {
                register('cropType').onChange(e);
                setValue('cropVariety', '');
              }}
            >
              <option value="">请选择作物品种</option>
              {cropTypes.map(type => (
                <option key={type} value={type}>{type}</option>
              ))}
            </select>
            {errors.cropType && (
              <p className="mt-1 text-sm text-red-500">{errors.cropType.message}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">细分品种</label>
            <input
              type="text"
              placeholder="请输入细分品种"
              className={cn('input-field', errors.cropVariety && 'border-red-300')}
              {...register('cropVariety')}
            />
            {errors.cropVariety && (
              <p className="mt-1 text-sm text-red-500">{errors.cropVariety.message}</p>
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
              <label className="block text-sm font-medium text-gray-700 mb-2">预估产量（kg）</label>
              <input
                type="number"
                step="0.01"
                min="0"
                className={cn('input-field', errors.expectedYield && 'border-red-300')}
                {...register('expectedYield', { valueAsNumber: true })}
              />
              {errors.expectedYield && (
                <p className="mt-1 text-sm text-red-500">{errors.expectedYield.message}</p>
              )}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">播种日期</label>
              <input
                type="date"
                className={cn('input-field', errors.plantDate && 'border-red-300')}
                {...register('plantDate')}
              />
              {errors.plantDate && (
                <p className="mt-1 text-sm text-red-500">{errors.plantDate.message}</p>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">预估采收日期</label>
              <input
                type="date"
                className={cn('input-field', errors.expectedHarvestDate && 'border-red-300')}
                {...register('expectedHarvestDate')}
              />
              {errors.expectedHarvestDate && (
                <p className="mt-1 text-sm text-red-500">{errors.expectedHarvestDate.message}</p>
              )}
            </div>
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
                <>{editingPlanting ? '保存修改' : '创建'}</>
              )}
            </button>
          </div>
        </form>
      </Modal>

      <Modal
        open={!!deleteConfirm}
        onClose={() => setDeleteConfirm(null)}
        title="确认归档"
      >
        <div className="text-center py-4">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-amber-100 flex items-center justify-center">
            <Trash2 className="w-8 h-8 text-amber-600" />
          </div>
          <p className="text-gray-600 mb-6">确定要将该种植信息标记为已采收吗？此操作不可撤销。</p>
          <div className="flex gap-3">
            <button
              onClick={() => setDeleteConfirm(null)}
              className="flex-1 btn-secondary"
            >
              取消
            </button>
            <button
              onClick={() => deleteConfirm && handleDelete(deleteConfirm)}
              className="flex-1 btn-danger"
            >
              确认归档
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
