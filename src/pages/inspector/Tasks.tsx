import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ClipboardList, Search, Filter, MapPin, Calendar, Clock, AlertTriangle, CheckCircle, Play, Square, ChevronDown, ChevronRight, Plus, User } from 'lucide-react';
import { api } from '../../services/api';
import { useAuthStore } from '../../store/authStore';
import { useToast } from '../../components/ui/MessageToast';
import { Modal, ModalButton } from '../../components/ui/Modal';
import { StatusBadge } from '../../components/ui/StatusBadge';
import { formatDate, formatRelativeTime, formatDateTime } from '../../utils/format';
import { InspectionTask } from '../../types';

const priorityColors: Record<string, string> = {
  low: 'bg-gray-100 text-gray-800',
  medium: 'bg-blue-100 text-blue-800',
  high: 'bg-orange-100 text-orange-800',
  urgent: 'bg-red-100 text-red-800',
};

const taskStatusColors: Record<string, string> = {
  pending: 'bg-gray-100 text-gray-800',
  assigned: 'bg-blue-100 text-blue-800',
  inspecting: 'bg-yellow-100 text-yellow-800',
  completed: 'bg-green-100 text-green-800',
  cancelled: 'bg-gray-100 text-gray-500',
};

const priorityLabels: Record<string, string> = {
  low: '低',
  medium: '中',
  high: '高',
  urgent: '紧急',
};

const statusOptions = [
  { value: '', label: '全部状态' },
  { value: 'pending', label: '待分配' },
  { value: 'assigned', label: '已分配' },
  { value: 'inspecting', label: '检测中' },
  { value: 'completed', label: '已完成' },
];

const priorityOptions = [
  { value: '', label: '全部优先级' },
  { value: 'low', label: '低' },
  { value: 'medium', label: '中' },
  { value: 'high', label: '高' },
  { value: 'urgent', label: '紧急' },
];

export default function InspectorTasks() {
  const { user } = useAuthStore();
  const { showToast } = useToast();
  const [tasks, setTasks] = useState<InspectionTask[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [priorityFilter, setPriorityFilter] = useState('');
  const [showStatusDropdown, setShowStatusDropdown] = useState(false);
  const [showPriorityDropdown, setShowPriorityDropdown] = useState(false);
  const [selectedTask, setSelectedTask] = useState<InspectionTask | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showSampleModal, setShowSampleModal] = useState(false);
  const [sampleRecords, setSampleRecords] = useState<Array<{ id: string; sampleNo: string; collectTime: string; collector: string; location: string; quantity: string }>>([]);

  useEffect(() => {
    loadTasks();
  }, [user, statusFilter, priorityFilter]);

  async function loadTasks() {
    try {
      setLoading(true);
      const params: any = { inspectorId: user?.id, page: 1, pageSize: 50 };
      if (statusFilter) params.status = statusFilter;
      if (priorityFilter) params.priority = priorityFilter;
      const res = await api.getInspectionTasks(params);
      setTasks(res.items);
    } catch (error) {
      console.error('Failed to load tasks:', error);
      showToast('error', '加载任务列表失败');
    } finally {
      setLoading(false);
    }
  }

  const filteredTasks = tasks.filter(task =>
    task.taskNo.toLowerCase().includes(searchQuery.toLowerCase())
  );

  async function handleStartInspection(task: InspectionTask) {
    showToast('success', '已开始检测，请按流程完成采样和检测');
    setShowDetailModal(false);
    setShowSampleModal(true);
  }

  async function handleCompleteInspection(task: InspectionTask) {
    showToast('success', '检测已完成，请出具检测报告');
    setShowDetailModal(false);
  }

  function addSampleRecord() {
    const newRecord = {
      id: `sample-${Date.now()}`,
      sampleNo: `CY${new Date().getFullYear()}${String(new Date().getMonth() + 1).padStart(2, '0')}${String(Math.floor(Math.random() * 10000)).padStart(4, '0')}`,
      collectTime: new Date().toISOString(),
      collector: user?.name || '',
      location: '山东省寿光市蔬菜高科技示范园',
      quantity: '2kg',
    };
    setSampleRecords([...sampleRecords, newRecord]);
    showToast('success', '采样记录已添加');
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">抽检任务</h1>
          <p className="mt-1 text-sm text-gray-500">查看和管理抽检任务，进行采样和检测</p>
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
              placeholder="搜索任务编号..."
              className="input-field pl-12"
            />
          </div>
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative">
              <button
                onClick={() => { setShowStatusDropdown(!showStatusDropdown); setShowPriorityDropdown(false); }}
                className="btn-secondary flex items-center gap-2 w-full sm:w-auto justify-center"
              >
                <Filter className="w-4 h-4" />
                {statusOptions.find(o => o.value === statusFilter)?.label || '状态'}
                <ChevronDown className="w-4 h-4" />
              </button>
              <AnimatePresence>
                {showStatusDropdown && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="absolute right-0 top-full mt-2 w-40 bg-white rounded-xl shadow-lg border border-gray-100 py-2 z-10"
                  >
                    {statusOptions.map((option) => (
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
                onClick={() => { setShowPriorityDropdown(!showPriorityDropdown); setShowStatusDropdown(false); }}
                className="btn-secondary flex items-center gap-2 w-full sm:w-auto justify-center"
              >
                <AlertTriangle className="w-4 h-4" />
                {priorityOptions.find(o => o.value === priorityFilter)?.label || '优先级'}
                <ChevronDown className="w-4 h-4" />
              </button>
              <AnimatePresence>
                {showPriorityDropdown && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="absolute right-0 top-full mt-2 w-40 bg-white rounded-xl shadow-lg border border-gray-100 py-2 z-10"
                  >
                    {priorityOptions.map((option) => (
                      <button
                        key={option.value}
                        onClick={() => {
                          setPriorityFilter(option.value);
                          setShowPriorityDropdown(false);
                        }}
                        className={`w-full px-4 py-2 text-left text-sm hover:bg-gray-50 transition-colors ${
                          priorityFilter === option.value ? 'text-green-600 bg-green-50' : 'text-gray-700'
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

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        {loading ? (
          <div className="p-8">
            <div className="space-y-4">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="h-24 bg-gray-100 rounded-xl animate-pulse" />
              ))}
            </div>
          </div>
        ) : filteredTasks.length === 0 ? (
          <div className="text-center py-16">
            <ClipboardList className="w-16 h-16 mx-auto mb-4 text-gray-300" />
            <p className="text-gray-500 mb-2">暂无任务数据</p>
            <p className="text-sm text-gray-400">等待监管部门分配抽检任务</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {filteredTasks.map((task, index) => (
              <motion.div
                key={task.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                className="p-5 hover:bg-gray-50 transition-colors cursor-pointer"
                onClick={() => {
                  setSelectedTask(task);
                  setShowDetailModal(true);
                }}
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-4">
                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                      task.priority === 'urgent' ? 'bg-red-100' :
                      task.priority === 'high' ? 'bg-orange-100' :
                      task.priority === 'medium' ? 'bg-blue-100' : 'bg-gray-100'
                    }`}>
                      {task.priority === 'urgent' ? (
                        <AlertTriangle className="w-6 h-6 text-red-600" />
                      ) : (
                        <ClipboardList className={`w-6 h-6 ${
                          task.priority === 'high' ? 'text-orange-600' :
                          task.priority === 'medium' ? 'text-blue-600' : 'text-gray-600'
                        }`} />
                      )}
                    </div>
                    <div>
                      <div className="flex items-center gap-3 mb-1">
                        <p className="font-semibold text-gray-900">{task.taskNo}</p>
                        <StatusBadge status={task.priority} customColors={priorityColors} />
                        <StatusBadge status={task.status} customColors={taskStatusColors} />
                      </div>
                      <div className="flex flex-wrap items-center gap-4 text-sm text-gray-500">
                        <span className="flex items-center gap-1">
                          <MapPin className="w-4 h-4" />
                          山东省寿光市
                        </span>
                        <span className="flex items-center gap-1">
                          <Calendar className="w-4 h-4" />
                          派单：{formatDate(task.assignedAt)}
                        </span>
                        <span className="flex items-center gap-1">
                          <Clock className="w-4 h-4" />
                          {formatRelativeTime(task.assignedAt)}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {task.status === 'assigned' && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleStartInspection(task);
                        }}
                        className="px-4 py-2 bg-green-600 text-white rounded-xl text-sm font-medium hover:bg-green-700 transition-colors flex items-center gap-2"
                      >
                        <Play className="w-4 h-4" />
                        开始检测
                      </button>
                    )}
                    {task.status === 'inspecting' && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleCompleteInspection(task);
                        }}
                        className="px-4 py-2 bg-blue-600 text-white rounded-xl text-sm font-medium hover:bg-blue-700 transition-colors flex items-center gap-2"
                      >
                        <CheckCircle className="w-4 h-4" />
                        完成检测
                      </button>
                    )}
                    <ChevronRight className="w-5 h-5 text-gray-400" />
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>

      <Modal
        open={showDetailModal}
        onClose={() => setShowDetailModal(false)}
        title="任务详情"
        size="lg"
        footer={
          selectedTask && selectedTask.status === 'assigned' ? (
            <>
              <ModalButton variant="secondary" onClick={() => setShowDetailModal(false)}>
                取消
              </ModalButton>
              <ModalButton onClick={() => handleStartInspection(selectedTask)}>
                开始检测
              </ModalButton>
            </>
          ) : selectedTask && selectedTask.status === 'inspecting' ? (
            <>
              <ModalButton variant="secondary" onClick={() => setShowDetailModal(false)}>
                取消
              </ModalButton>
              <ModalButton onClick={() => handleCompleteInspection(selectedTask)}>
                完成检测
              </ModalButton>
            </>
          ) : null
        }
      >
        {selectedTask && (
          <div className="space-y-6">
            <div className="flex items-center gap-4 p-5 bg-gray-50 rounded-2xl">
              <div className={`w-16 h-16 rounded-2xl flex items-center justify-center ${
                selectedTask.priority === 'urgent' ? 'bg-red-100' :
                selectedTask.priority === 'high' ? 'bg-orange-100' :
                selectedTask.priority === 'medium' ? 'bg-blue-100' : 'bg-gray-100'
              }`}>
                <ClipboardList className={`w-8 h-8 ${
                  selectedTask.priority === 'urgent' ? 'text-red-600' :
                  selectedTask.priority === 'high' ? 'text-orange-600' :
                  selectedTask.priority === 'medium' ? 'text-blue-600' : 'text-gray-600'
                }`} />
              </div>
              <div>
                <h3 className="text-xl font-bold text-gray-900">{selectedTask.taskNo}</h3>
                <div className="flex items-center gap-2 mt-2">
                  <StatusBadge status={selectedTask.priority} customColors={priorityColors} />
                  <StatusBadge status={selectedTask.status} customColors={taskStatusColors} />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="p-4 bg-gray-50 rounded-xl">
                <div className="flex items-center gap-2 text-gray-500 mb-1">
                  <Calendar className="w-4 h-4" />
                  <span className="text-xs">派单时间</span>
                </div>
                <p className="font-medium">{formatDateTime(selectedTask.assignedAt)}</p>
              </div>
              <div className="p-4 bg-gray-50 rounded-xl">
                <div className="flex items-center gap-2 text-gray-500 mb-1">
                  <User className="w-4 h-4" />
                  <span className="text-xs">检测员</span>
                </div>
                <p className="font-medium">{user?.name}</p>
              </div>
            </div>

            <div className="p-5 bg-blue-50 rounded-xl">
              <div className="flex items-start gap-3">
                <MapPin className="w-5 h-5 text-blue-600 mt-0.5" />
                <div>
                  <p className="font-medium text-gray-900">采样地点</p>
                  <p className="text-sm text-gray-600 mt-1">山东省寿光市蔬菜高科技示范园</p>
                  <p className="text-sm text-gray-500 mt-1">北纬36.88°，东经118.74°</p>
                </div>
              </div>
            </div>

            <div className="p-5 bg-amber-50 rounded-xl">
              <div className="flex items-start gap-3">
                <AlertTriangle className="w-5 h-5 text-amber-600 mt-0.5" />
                <div>
                  <p className="font-medium text-gray-900">检测要求</p>
                  <ul className="text-sm text-gray-600 mt-2 space-y-1">
                    <li>• 农药残留检测：敌敌畏、乐果、毒死蜱等10项</li>
                    <li>• 重金属检测：铅、镉、砷等5项</li>
                    <li>• 微生物检测：菌落总数、大肠杆菌等</li>
                    <li>• 需在3个工作日内完成检测并出具报告</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        )}
      </Modal>

      <Modal
        open={showSampleModal}
        onClose={() => setShowSampleModal(false)}
        title="样品采集记录"
        size="lg"
        footer={
          <>
            <ModalButton variant="secondary" onClick={() => setShowSampleModal(false)}>
              关闭
            </ModalButton>
            <ModalButton onClick={addSampleRecord}>
              <Plus className="w-4 h-4 mr-1" />
              添加采样记录
            </ModalButton>
          </>
        }
      >
        <div className="space-y-4">
          <div className="p-4 bg-green-50 rounded-xl border border-green-100">
            <div className="flex items-center gap-3">
              <CheckCircle className="w-5 h-5 text-green-600" />
              <div>
                <p className="font-medium text-green-800">正在进行采样</p>
                <p className="text-sm text-green-600">请按照规范采集样品并记录信息</p>
              </div>
            </div>
          </div>

          {sampleRecords.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              <ClipboardList className="w-12 h-12 mx-auto mb-3 text-gray-300" />
              <p>暂无采样记录</p>
              <p className="text-sm text-gray-400 mt-1">点击上方按钮添加采样记录</p>
            </div>
          ) : (
            <div className="space-y-3">
              {sampleRecords.map((record) => (
                <motion.div
                  key={record.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="p-4 bg-gray-50 rounded-xl"
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-medium text-gray-900">{record.sampleNo}</span>
                    <span className="text-sm text-gray-500">{formatDateTime(record.collectTime)}</span>
                  </div>
                  <div className="grid grid-cols-3 gap-4 text-sm">
                    <div>
                      <span className="text-gray-500">采样人员：</span>
                      <span className="text-gray-900">{record.collector}</span>
                    </div>
                    <div>
                      <span className="text-gray-500">采样地点：</span>
                      <span className="text-gray-900">{record.location}</span>
                    </div>
                    <div>
                      <span className="text-gray-500">样品数量：</span>
                      <span className="text-gray-900">{record.quantity}</span>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </Modal>
    </div>
  );
}
