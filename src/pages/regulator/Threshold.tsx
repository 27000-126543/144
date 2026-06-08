import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Search,
  SlidersHorizontal,
  Save,
  History,
  AlertTriangle,
  CheckCircle,
  X,
  ChevronDown,
  ChevronUp,
  Clock,
  User,
} from 'lucide-react';
import { useRegulatorStore } from '../../store/regulatorStore';
import type { PesticideThreshold } from '../../types';
import { formatDateTime } from '../../utils/format';
import { Modal } from '../../components/ui/Modal';

interface EditState {
  id: string;
  maxLimit: number;
  originalValue: number;
}

interface HistoryRecord {
  id: string;
  pesticideName: string;
  oldValue: number;
  newValue: number;
  unit: string;
  operator: string;
  time: string;
}

export default function Threshold() {
  const { thresholds, loading, fetchThresholds, updateThreshold } = useRegulatorStore();
  const [searchTerm, setSearchTerm] = useState('');
  const [cropType, setCropType] = useState<string>('all');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editState, setEditState] = useState<EditState | null>(null);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [selectedPesticide, setSelectedPesticide] = useState<PesticideThreshold | null>(null);
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());

  const historyRecords: HistoryRecord[] = [
    { id: '1', pesticideName: '敌敌畏', oldValue: 0.5, newValue: 0.2, unit: 'mg/kg', operator: '监管员A', time: '2024-01-15 14:30' },
    { id: '2', pesticideName: '乐果', oldValue: 1.0, newValue: 0.8, unit: 'mg/kg', operator: '监管员B', time: '2024-01-14 10:20' },
    { id: '3', pesticideName: '乙酰甲胺磷', oldValue: 0.3, newValue: 0.25, unit: 'mg/kg', operator: '监管员A', time: '2024-01-13 16:45' },
  ];

  useEffect(() => {
    fetchThresholds();
  }, [fetchThresholds]);

  const filteredThresholds = thresholds.filter((t) => {
    const matchSearch = t.pesticideName.includes(searchTerm) || t.cropType.includes(searchTerm);
    const matchCrop = cropType === 'all' || t.cropType === cropType;
    return matchSearch && matchCrop;
  });

  const cropTypes = ['all', ...new Set(thresholds.map((t) => t.cropType))];

  const handleStartEdit = (threshold: PesticideThreshold) => {
    setEditingId(threshold.id);
    setEditState({
      id: threshold.id,
      maxLimit: threshold.maxLimit,
      originalValue: threshold.maxLimit,
    });
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setEditState(null);
  };

  const handleSliderChange = (value: number) => {
    if (editState) {
      setEditState({ ...editState, maxLimit: value });
    }
  };

  const handleInputChange = (value: string) => {
    if (editState) {
      const num = parseFloat(value);
      if (!isNaN(num) && num >= 0) {
        setEditState({ ...editState, maxLimit: Math.min(num, 10) });
      }
    }
  };

  const handleSaveClick = () => {
    if (editState && editState.maxLimit !== editState.originalValue) {
      const threshold = thresholds.find((t) => t.id === editState.id);
      setSelectedPesticide(threshold || null);
      setShowConfirmModal(true);
    }
  };

  const handleConfirmSave = async () => {
    if (editState) {
      try {
        await updateThreshold(editState.id, { maxLimit: editState.maxLimit });
        setShowConfirmModal(false);
        setEditingId(null);
        setEditState(null);
      } catch (err) {
        console.error('保存失败', err);
      }
    }
  };

  const toggleExpand = (id: string) => {
    const newExpanded = new Set(expandedIds);
    if (newExpanded.has(id)) {
      newExpanded.delete(id);
    } else {
      newExpanded.add(id);
    }
    setExpandedIds(newExpanded);
  };

  const getWarningLevel = (value: number) => {
    if (value <= 0.1) return { color: 'text-green-600', bg: 'bg-green-100', label: '严格' };
    if (value <= 0.5) return { color: 'text-yellow-600', bg: 'bg-yellow-100', label: '标准' };
    return { color: 'text-danger-600', bg: 'bg-danger-100', label: '宽松' };
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">农药残留阈值设置</h1>
          <p className="text-gray-500 mt-1">设置各类农作物的农药残留最大限值</p>
        </div>
        <button
          onClick={() => setShowHistoryModal(true)}
          className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors"
        >
          <History className="w-4 h-4" />
          <span>修改历史</span>
        </button>
      </div>

      <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
        <div className="flex flex-col sm:flex-row gap-4 mb-6">
          <div className="flex-1 relative">
            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="搜索农药名称或作物类型..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-12 pr-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-agri-500 focus:border-transparent"
            />
          </div>
          <div className="sm:w-48">
            <select
              value={cropType}
              onChange={(e) => setCropType(e.target.value)}
              className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-agri-500 focus:border-transparent appearance-none bg-white"
            >
              {cropTypes.map((type) => (
                <option key={type} value={type}>
                  {type === 'all' ? '全部作物' : type}
                </option>
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
            {filteredThresholds.map((threshold, index) => {
              const isEditing = editingId === threshold.id;
              const isExpanded = expandedIds.has(threshold.id);
              const warning = getWarningLevel(threshold.maxLimit);
              const currentValue = isEditing && editState ? editState.maxLimit : threshold.maxLimit;
              const hasChanges = isEditing && editState && editState.maxLimit !== editState.originalValue;

              return (
                <motion.div
                  key={threshold.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className="border border-gray-100 rounded-2xl overflow-hidden hover:border-agri-200 transition-colors"
                >
                  <div className="p-5">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-gray-100 rounded-xl flex items-center justify-center">
                          <SlidersHorizontal className="w-6 h-6 text-gray-600" />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <h3 className="font-semibold text-gray-900">{threshold.pesticideName}</h3>
                            <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${warning.bg} ${warning.color}`}>
                              {warning.label}
                            </span>
                          </div>
                          <p className="text-sm text-gray-500 mt-1">
                            适用作物: {threshold.cropType} · 标准: {threshold.standard}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-4">
                        {isEditing ? (
                          <div className="flex items-center gap-3">
                            <button
                              onClick={handleCancelEdit}
                              className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                            >
                              <X className="w-5 h-5" />
                            </button>
                            <button
                              onClick={handleSaveClick}
                              disabled={!hasChanges}
                              className={`flex items-center gap-2 px-4 py-2 rounded-xl font-medium transition-all ${
                                hasChanges
                                  ? 'bg-agri-500 text-white hover:bg-agri-600 shadow-lg shadow-agri-500/30'
                                  : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                              }`}
                            >
                              <Save className="w-4 h-4" />
                              <span>保存</span>
                            </button>
                          </div>
                        ) : (
                          <button
                            onClick={() => handleStartEdit(threshold)}
                            className="px-4 py-2 bg-gray-100 text-gray-700 rounded-xl hover:bg-gray-200 transition-colors font-medium"
                          >
                            编辑
                          </button>
                        )}
                        <button
                          onClick={() => toggleExpand(threshold.id)}
                          className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                        >
                          {isExpanded ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
                        </button>
                      </div>
                    </div>

                    <div className="mt-6">
                      <div className="flex items-center justify-between mb-3">
                        <span className="text-sm text-gray-600">最大限值 ({threshold.unit})</span>
                        <div className="flex items-center gap-2">
                          {isEditing ? (
                            <input
                              type="number"
                              value={currentValue}
                              onChange={(e) => handleInputChange(e.target.value)}
                              step="0.01"
                              min="0"
                              max="10"
                              className="w-24 px-3 py-1.5 border border-gray-200 rounded-lg text-right font-bold text-lg focus:outline-none focus:ring-2 focus:ring-agri-500"
                            />
                          ) : (
                            <span className="text-2xl font-bold text-gray-900">{threshold.maxLimit}</span>
                          )}
                          <span className="text-gray-500">{threshold.unit}</span>
                        </div>
                      </div>

                      {isEditing ? (
                        <div className="space-y-2">
                          <input
                            type="range"
                            min="0"
                            max="2"
                            step="0.01"
                            value={currentValue}
                            onChange={(e) => handleSliderChange(parseFloat(e.target.value))}
                            className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-agri-500"
                          />
                          <div className="flex justify-between text-xs text-gray-400">
                            <span>0</span>
                            <span>0.5</span>
                            <span>1.0</span>
                            <span>1.5</span>
                            <span>2.0</span>
                          </div>
                          {hasChanges && (
                            <div className="flex items-center gap-2 mt-3 p-3 bg-yellow-50 rounded-xl">
                              <AlertTriangle className="w-5 h-5 text-yellow-600 flex-shrink-0" />
                              <p className="text-sm text-yellow-800">
                                阈值将从 <span className="font-bold">{editState!.originalValue}</span> 修改为 <span className="font-bold">{editState!.maxLimit}</span> {threshold.unit}
                              </p>
                            </div>
                          )}
                        </div>
                      ) : (
                        <div className="relative h-2 bg-gray-100 rounded-full overflow-hidden">
                          <div
                            className="absolute left-0 top-0 h-full bg-gradient-to-r from-green-400 to-green-600 rounded-full transition-all duration-500"
                            style={{ width: `${Math.min((threshold.maxLimit / 2) * 100, 100)}%` }}
                          />
                          <div
                            className="absolute top-1/2 -translate-y-1/2 w-4 h-4 bg-white border-3 border-green-500 rounded-full shadow-md transition-all duration-500"
                            style={{ left: `calc(${Math.min((threshold.maxLimit / 2) * 100, 100)}% - 8px)` }}
                          />
                        </div>
                      )}
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
                        <div className="px-5 pb-5 border-t border-gray-100 pt-4">
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                            <div className="p-3 bg-gray-50 rounded-xl">
                              <p className="text-xs text-gray-500">农药名称</p>
                              <p className="font-medium text-gray-900 mt-1">{threshold.pesticideName}</p>
                            </div>
                            <div className="p-3 bg-gray-50 rounded-xl">
                              <p className="text-xs text-gray-500">适用作物</p>
                              <p className="font-medium text-gray-900 mt-1">{threshold.cropType}</p>
                            </div>
                            <div className="p-3 bg-gray-50 rounded-xl">
                              <p className="text-xs text-gray-500">执行标准</p>
                              <p className="font-medium text-gray-900 mt-1">{threshold.standard}</p>
                            </div>
                            <div className="p-3 bg-gray-50 rounded-xl">
                              <p className="text-xs text-gray-500">最后更新</p>
                              <p className="font-medium text-gray-900 mt-1">{formatDateTime(threshold.updatedAt)}</p>
                            </div>
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>
              );
            })}

            {filteredThresholds.length === 0 && (
              <div className="text-center py-16">
                <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Search className="w-8 h-8 text-gray-400" />
                </div>
                <p className="text-gray-500">未找到匹配的农药阈值</p>
              </div>
            )}
          </div>
        )}
      </div>

      <Modal
        open={showConfirmModal}
        onClose={() => setShowConfirmModal(false)}
        title="确认修改阈值"
        size="md"
      >
        <div className="space-y-4">
          <div className="p-4 bg-yellow-50 rounded-xl flex items-start gap-3">
            <AlertTriangle className="w-6 h-6 text-yellow-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-medium text-yellow-800">修改阈值将影响后续检测判定</p>
              <p className="text-sm text-yellow-700 mt-1">请谨慎操作，修改后所有相关检测将使用新的阈值标准。</p>
            </div>
          </div>

          {selectedPesticide && editState && (
            <div className="p-4 bg-gray-50 rounded-xl space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-gray-600">农药名称</span>
                <span className="font-medium text-gray-900">{selectedPesticide.pesticideName}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-600">适用作物</span>
                <span className="font-medium text-gray-900">{selectedPesticide.cropType}</span>
              </div>
              <div className="border-t border-gray-200 pt-3">
                <div className="flex items-center justify-center gap-6">
                  <div className="text-center">
                    <p className="text-sm text-gray-500">原阈值</p>
                    <p className="text-2xl font-bold text-gray-900 mt-1">{editState.originalValue}</p>
                    <p className="text-xs text-gray-500">{selectedPesticide.unit}</p>
                  </div>
                  <div className="text-3xl text-gray-300">→</div>
                  <div className="text-center">
                    <p className="text-sm text-gray-500">新阈值</p>
                    <p className="text-2xl font-bold text-agri-600 mt-1">{editState.maxLimit}</p>
                    <p className="text-xs text-gray-500">{selectedPesticide.unit}</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          <div className="flex gap-3 pt-4">
            <button
              onClick={() => setShowConfirmModal(false)}
              className="flex-1 px-4 py-3 border border-gray-200 rounded-xl font-medium text-gray-700 hover:bg-gray-50 transition-colors"
            >
              取消
            </button>
            <button
              onClick={handleConfirmSave}
              className="flex-1 px-4 py-3 bg-agri-500 text-white rounded-xl font-medium hover:bg-agri-600 transition-colors shadow-lg shadow-agri-500/30"
            >
              确认修改
            </button>
          </div>
        </div>
      </Modal>

      <Modal
        open={showHistoryModal}
        onClose={() => setShowHistoryModal(false)}
        title="修改历史记录"
        size="lg"
      >
        <div className="space-y-3">
          {historyRecords.map((record) => (
            <div key={record.id} className="p-4 bg-gray-50 rounded-xl">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-agri-100 rounded-full flex items-center justify-center">
                    <SlidersHorizontal className="w-5 h-5 text-agri-600" />
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">{record.pesticideName}</p>
                    <div className="flex items-center gap-4 mt-1">
                      <div className="flex items-center gap-1 text-sm text-gray-500">
                        <User className="w-3.5 h-3.5" />
                        <span>{record.operator}</span>
                      </div>
                      <div className="flex items-center gap-1 text-sm text-gray-500">
                        <Clock className="w-3.5 h-3.5" />
                        <span>{record.time}</span>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-gray-500 font-medium">{record.oldValue}</span>
                  <span className="text-gray-300">→</span>
                  <span className="text-agri-600 font-bold">{record.newValue}</span>
                  <span className="text-gray-500 text-sm">{record.unit}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </Modal>
    </div>
  );
}
