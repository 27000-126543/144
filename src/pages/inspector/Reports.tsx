import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FileText, Search, Plus, X, CheckCircle, XCircle, Download, Eye, Calendar, User, Hash, Trash2 } from 'lucide-react';
import { useForm, useFieldArray, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { api } from '../../services/api';
import { useAuthStore } from '../../store/authStore';
import { useToast } from '../../components/ui/MessageToast';
import { Modal, ModalButton } from '../../components/ui/Modal';
import { StatusBadge } from '../../components/ui/StatusBadge';
import { formatDate, formatNumber, formatDateTime } from '../../utils/format';
import { InspectionReport, InspectionItem, InspectResult } from '../../types';

const inspectionItemSchema = z.object({
  name: z.string().min(1, '请输入检测项目名称'),
  value: z.number().min(0, '检测值不能为负数'),
  standard: z.number().min(0, '标准值不能为负数'),
  unit: z.string().min(1, '请输入单位'),
});

const reportFormSchema = z.object({
  taskNo: z.string().min(1, '请选择任务编号'),
  batchNo: z.string().min(1, '请输入批次号'),
  items: z.array(inspectionItemSchema).min(1, '请至少添加一个检测项目'),
  inspectorName: z.string().min(1, '请输入检测员姓名'),
  reportDate: z.string().min(1, '请选择报告日期'),
  remarks: z.string().optional(),
});

type ReportFormData = z.infer<typeof reportFormSchema>;

const defaultInspectionItems = [
  { name: '敌敌畏', standard: 0.5, unit: 'mg/kg' },
  { name: '乐果', standard: 0.02, unit: 'mg/kg' },
  { name: '毒死蜱', standard: 2, unit: 'mg/kg' },
  { name: '铅', standard: 0.1, unit: 'mg/kg' },
  { name: '镉', standard: 0.05, unit: 'mg/kg' },
];

export default function InspectorReports() {
  const { user } = useAuthStore();
  const { showToast } = useToast();
  const [reports, setReports] = useState<InspectionReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showPreviewModal, setShowPreviewModal] = useState(false);
  const [selectedReport, setSelectedReport] = useState<InspectionReport | null>(null);
  const [autoCalculate, setAutoCalculate] = useState(true);

  const form = useForm<ReportFormData>({
    resolver: zodResolver(reportFormSchema),
    defaultValues: {
      taskNo: '',
      batchNo: '',
      items: [{ name: '', value: 0, standard: 0.5, unit: 'mg/kg' }],
      inspectorName: user?.name || '',
      reportDate: new Date().toISOString().split('T')[0],
      remarks: '',
    },
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: 'items',
  });

  useEffect(() => {
    loadReports();
  }, [user]);

  async function loadReports() {
    try {
      setLoading(true);
      const mockReports = generateMockReports(10);
      setReports(mockReports);
    } catch (error) {
      console.error('Failed to load reports:', error);
      showToast('error', '加载报告列表失败');
    } finally {
      setLoading(false);
    }
  }

  function generateMockReports(count: number): InspectionReport[] {
    return Array.from({ length: count }, (_, i) => {
      const items: InspectionItem[] = defaultInspectionItems.slice(0, 3).map(item => {
        const value = Math.random() * item.standard * (i % 5 === 3 ? 1.5 : 0.8);
        return {
          ...item,
          value: Number(value.toFixed(4)),
          result: value > item.standard ? 'unqualified' : 'qualified' as 'qualified' | 'unqualified',
        };
      });
      
      const hasUnqualified = items.some(item => item.result === 'unqualified');
      
      return {
        id: `report-${i}`,
        reportNo: `JC202401${String(20 - i).padStart(2, '0')}`,
        taskId: `task-${i}`,
        batchId: `batch-${i}`,
        inspectorId: user?.id || '',
        items,
        overallResult: hasUnqualified ? 'unqualified' : 'qualified',
        reportUrl: '',
        inspectorName: user?.name || '',
        reportDate: new Date(Date.now() - i * 86400000).toISOString(),
        createdAt: new Date(Date.now() - i * 86400000).toISOString(),
      };
    });
  }

  const filteredReports = reports.filter(report =>
    report.reportNo.toLowerCase().includes(searchQuery.toLowerCase())
  );

  function calculateResult(value: number, standard: number): 'qualified' | 'unqualified' {
    return value > standard ? 'unqualified' : 'qualified';
  }

  function getOverallResult(items: InspectionItem[]): InspectResult {
    const hasUnqualified = items.some(item => item.result === 'unqualified');
    return hasUnqualified ? 'unqualified' : 'qualified';
  }

  function toInspectionItems(items: typeof formItems): InspectionItem[] {
    return items.map(item => ({
      ...item,
      result: calculateResult(item.value, item.standard),
    })) as InspectionItem[];
  }

  function addInspectionItem() {
    append({ name: '', value: 0, standard: 0.5, unit: 'mg/kg' });
  }

  function addPresetItem(preset: typeof defaultInspectionItems[0]) {
    const existing = fields.find(f => f.name === preset.name);
    if (existing) {
      showToast('warning', '该检测项目已存在');
      return;
    }
    append({ ...preset, value: 0 });
    showToast('success', '已添加检测项目');
  }

  async function onSubmit(data: ReportFormData) {
    try {
      const items: InspectionItem[] = data.items.map(item => ({
        ...item,
        result: calculateResult(item.value, item.standard),
      })) as InspectionItem[];

      const overallResult = getOverallResult(items);

      const newReport: InspectionReport = {
        id: `report-${Date.now()}`,
        reportNo: `JC${new Date().getFullYear()}${String(new Date().getMonth() + 1).padStart(2, '0')}${String(reports.length + 1).padStart(2, '0')}`,
        taskId: data.taskNo,
        batchId: data.batchNo,
        inspectorId: user!.id,
        items,
        overallResult,
        reportUrl: '',
        inspectorName: data.inspectorName,
        reportDate: data.reportDate,
        createdAt: new Date().toISOString(),
      };

      setReports([newReport, ...reports]);
      showToast('success', `检测报告已创建，结论：${overallResult === 'qualified' ? '合格' : '不合格'}`);
      setShowCreateModal(false);
      form.reset();
    } catch (error: any) {
      showToast('error', error.response?.data?.message || '创建报告失败');
    }
  }

  function handlePreview(report: InspectionReport) {
    setSelectedReport(report);
    setShowPreviewModal(true);
  }

  function handleDownload(report: InspectionReport) {
    showToast('success', `报告 ${report.reportNo} 已开始下载`);
  }

  const formItems = form.watch('items');

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">检测报告</h1>
          <p className="mt-1 text-sm text-gray-500">管理和出具农产品质量检测报告</p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="btn-primary flex items-center gap-2"
        >
          <Plus className="w-5 h-5" />
          新增报告
        </button>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="flex-1 relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="搜索报告编号..."
              className="input-field pl-12"
            />
          </div>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        {loading ? (
          <div className="p-8">
            <div className="space-y-4">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="h-20 bg-gray-100 rounded-xl animate-pulse" />
              ))}
            </div>
          </div>
        ) : filteredReports.length === 0 ? (
          <div className="text-center py-16">
            <FileText className="w-16 h-16 mx-auto mb-4 text-gray-300" />
            <p className="text-gray-500 mb-2">暂无检测报告</p>
            <button
              onClick={() => setShowCreateModal(true)}
              className="text-green-600 hover:text-green-700 text-sm"
            >
              + 创建第一份报告
            </button>
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {filteredReports.map((report, index) => (
              <motion.div
                key={report.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                className="p-5 hover:bg-gray-50 transition-colors"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                      report.overallResult === 'qualified' ? 'bg-green-100' : 'bg-red-100'
                    }`}>
                      {report.overallResult === 'qualified' ? (
                        <CheckCircle className="w-6 h-6 text-green-600" />
                      ) : (
                        <XCircle className="w-6 h-6 text-red-600" />
                      )}
                    </div>
                    <div>
                      <div className="flex items-center gap-3">
                        <p className="font-semibold text-gray-900">{report.reportNo}</p>
                        <StatusBadge
                          status={report.overallResult}
                          customColors={{
                            qualified: 'bg-green-100 text-green-800',
                            unqualified: 'bg-red-100 text-red-800',
                          }}
                        />
                      </div>
                      <p className="text-sm text-gray-500 mt-1">
                        检测员：{report.inspectorName} · {formatDate(report.reportDate)}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handlePreview(report)}
                      className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                      title="预览"
                    >
                      <Eye className="w-5 h-5 text-gray-400" />
                    </button>
                    <button
                      onClick={() => handleDownload(report)}
                      className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                      title="下载"
                    >
                      <Download className="w-5 h-5 text-gray-400" />
                    </button>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>

      <Modal
        open={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        title="新增检测报告"
        size="xl"
        footer={
          <>
            <ModalButton variant="secondary" onClick={() => setShowCreateModal(false)}>
              取消
            </ModalButton>
            <ModalButton onClick={form.handleSubmit(onSubmit)}>
              生成报告
            </ModalButton>
          </>
        }
      >
        <form className="space-y-6">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">任务编号</label>
              <select
                {...form.register('taskNo')}
                className="input-field"
              >
                <option value="">请选择任务</option>
                <option value="RJ202401001">RJ202401001</option>
                <option value="RJ202401002">RJ202401002</option>
                <option value="RJ202401003">RJ202401003</option>
              </select>
              {form.formState.errors.taskNo && (
                <p className="mt-1 text-sm text-red-500">{form.formState.errors.taskNo.message}</p>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">批次号</label>
              <input
                type="text"
                {...form.register('batchNo')}
                placeholder="请输入批次号"
                className="input-field"
              />
              {form.formState.errors.batchNo && (
                <p className="mt-1 text-sm text-red-500">{form.formState.errors.batchNo.message}</p>
              )}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">检测员</label>
              <input
                type="text"
                {...form.register('inspectorName')}
                placeholder="请输入检测员姓名"
                className="input-field"
              />
              {form.formState.errors.inspectorName && (
                <p className="mt-1 text-sm text-red-500">{form.formState.errors.inspectorName.message}</p>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">报告日期</label>
              <input
                type="date"
                {...form.register('reportDate')}
                className="input-field"
              />
              {form.formState.errors.reportDate && (
                <p className="mt-1 text-sm text-red-500">{form.formState.errors.reportDate.message}</p>
              )}
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-3">
              <label className="block text-sm font-medium text-gray-700">检测项目</label>
              <div className="flex items-center gap-3">
                <label className="flex items-center gap-2 text-sm text-gray-600">
                  <input
                    type="checkbox"
                    checked={autoCalculate}
                    onChange={(e) => setAutoCalculate(e.target.checked)}
                    className="rounded text-green-600"
                  />
                  自动判定
                </label>
              </div>
            </div>

            <div className="flex flex-wrap gap-2 mb-4">
              <span className="text-sm text-gray-500">快速添加：</span>
              {defaultInspectionItems.map((item) => (
                <button
                  key={item.name}
                  type="button"
                  onClick={() => addPresetItem(item)}
                  className="px-3 py-1 bg-gray-100 hover:bg-green-100 text-gray-700 hover:text-green-700 rounded-full text-sm transition-colors"
                >
                  + {item.name}
                </button>
              ))}
            </div>

            <div className="space-y-3">
              {fields.map((field, index) => (
                <motion.div
                  key={field.id}
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="grid grid-cols-12 gap-3 items-end"
                >
                  <div className="col-span-4">
                    <label className="block text-xs text-gray-500 mb-1">检测项目</label>
                    <input
                      type="text"
                      {...form.register(`items.${index}.name`)}
                      placeholder="项目名称"
                      className="input-field"
                    />
                  </div>
                  <div className="col-span-2">
                    <label className="block text-xs text-gray-500 mb-1">检测值</label>
                    <input
                      type="number"
                      step="0.0001"
                      {...form.register(`items.${index}.value`, { valueAsNumber: true })}
                      placeholder="0"
                      className="input-field"
                    />
                  </div>
                  <div className="col-span-2">
                    <label className="block text-xs text-gray-500 mb-1">标准值</label>
                    <input
                      type="number"
                      step="0.0001"
                      {...form.register(`items.${index}.standard`, { valueAsNumber: true })}
                      placeholder="0"
                      className="input-field"
                    />
                  </div>
                  <div className="col-span-2">
                    <label className="block text-xs text-gray-500 mb-1">单位</label>
                    <input
                      type="text"
                      {...form.register(`items.${index}.unit`)}
                      placeholder="mg/kg"
                      className="input-field"
                    />
                  </div>
                  <div className="col-span-1">
                    {autoCalculate && formItems[index]?.name && (
                      <div className={`h-11 flex items-center justify-center rounded-xl ${
                        calculateResult(formItems[index].value, formItems[index].standard) === 'qualified'
                          ? 'bg-green-100'
                          : 'bg-red-100'
                      }`}>
                        {calculateResult(formItems[index].value, formItems[index].standard) === 'qualified' ? (
                          <CheckCircle className="w-5 h-5 text-green-600" />
                        ) : (
                          <XCircle className="w-5 h-5 text-red-600" />
                        )}
                      </div>
                    )}
                  </div>
                  <div className="col-span-1">
                    {fields.length > 1 && (
                      <button
                        type="button"
                        onClick={() => remove(index)}
                        className="h-11 w-full flex items-center justify-center text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-xl transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </motion.div>
              ))}
            </div>

            {form.formState.errors.items && (
              <p className="mt-2 text-sm text-red-500">{form.formState.errors.items.message}</p>
            )}

            <button
              type="button"
              onClick={addInspectionItem}
              className="mt-3 w-full py-3 border-2 border-dashed border-gray-200 rounded-xl text-gray-500 hover:border-green-400 hover:text-green-600 transition-colors flex items-center justify-center gap-2"
            >
              <Plus className="w-5 h-5" />
              添加检测项目
            </button>
          </div>

          {autoCalculate && formItems.length > 0 && formItems[0]?.name && (
            <div className={`p-4 rounded-xl border-2 ${
              getOverallResult(toInspectionItems(formItems)) === 'qualified'
                ? 'bg-green-50 border-green-200'
                : 'bg-red-50 border-red-200'
            }`}>
              <div className="flex items-center gap-3">
                {getOverallResult(toInspectionItems(formItems)) === 'qualified' ? (
                  <CheckCircle className="w-8 h-8 text-green-600" />
                ) : (
                  <XCircle className="w-8 h-8 text-red-600" />
                )}
                <div>
                  <p className={`font-bold text-lg ${
                    getOverallResult(toInspectionItems(formItems)) === 'qualified'
                      ? 'text-green-700'
                      : 'text-red-700'
                  }`}>
                    {getOverallResult(toInspectionItems(formItems)) === 'qualified' ? '检测结论：合格' : '检测结论：不合格'}
                  </p>
                  <p className="text-sm text-gray-600">系统将根据检测项目结果自动判定</p>
                </div>
              </div>
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">备注</label>
            <textarea
              {...form.register('remarks')}
              rows={3}
              placeholder="请输入备注信息（可选）"
              className="input-field resize-none"
            />
          </div>
        </form>
      </Modal>

      <Modal
        open={showPreviewModal}
        onClose={() => setShowPreviewModal(false)}
        title="检测报告预览"
        size="lg"
        footer={
          selectedReport ? (
            <>
              <ModalButton variant="secondary" onClick={() => setShowPreviewModal(false)}>
                关闭
              </ModalButton>
              <ModalButton onClick={() => handleDownload(selectedReport)}>
                <Download className="w-4 h-4 mr-1" />
                下载报告
              </ModalButton>
            </>
          ) : null
        }
      >
        {selectedReport && (
          <div className="space-y-6">
            <div className="text-center pb-6 border-b border-gray-200">
              <h2 className="text-2xl font-bold text-gray-900">农产品质量检测报告</h2>
              <p className="text-gray-500 mt-2">报告编号：{selectedReport.reportNo}</p>
            </div>

            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-gray-500">任务编号：</span>
                <span className="text-gray-900 font-medium">{selectedReport.taskId}</span>
              </div>
              <div>
                <span className="text-gray-500">批次号：</span>
                <span className="text-gray-900 font-medium">{selectedReport.batchId}</span>
              </div>
              <div>
                <span className="text-gray-500">检测员：</span>
                <span className="text-gray-900 font-medium">{selectedReport.inspectorName}</span>
              </div>
              <div>
                <span className="text-gray-500">报告日期：</span>
                <span className="text-gray-900 font-medium">{formatDate(selectedReport.reportDate)}</span>
              </div>
            </div>

            <div>
              <h3 className="font-medium text-gray-900 mb-3">检测项目结果</h3>
              <div className="border border-gray-200 rounded-xl overflow-hidden">
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">检测项目</th>
                      <th className="px-4 py-3 text-right text-sm font-medium text-gray-700">检测值</th>
                      <th className="px-4 py-3 text-right text-sm font-medium text-gray-700">标准值</th>
                      <th className="px-4 py-3 text-center text-sm font-medium text-gray-700">单位</th>
                      <th className="px-4 py-3 text-center text-sm font-medium text-gray-700">结果</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {selectedReport.items.map((item, index) => (
                      <tr key={index} className={item.result === 'unqualified' ? 'bg-red-50' : ''}>
                        <td className="px-4 py-3 text-sm text-gray-900">{item.name}</td>
                        <td className="px-4 py-3 text-sm text-right font-mono">{formatNumber(item.value, 4)}</td>
                        <td className="px-4 py-3 text-sm text-right font-mono text-gray-500">{item.standard}</td>
                        <td className="px-4 py-3 text-sm text-center text-gray-500">{item.unit}</td>
                        <td className="px-4 py-3 text-center">
                          {item.result === 'qualified' ? (
                            <CheckCircle className="w-5 h-5 text-green-500 mx-auto" />
                          ) : (
                            <XCircle className="w-5 h-5 text-red-500 mx-auto" />
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <div className={`p-6 rounded-2xl border-2 ${
              selectedReport.overallResult === 'qualified'
                ? 'bg-green-50 border-green-200'
                : 'bg-red-50 border-red-200'
            }`}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  {selectedReport.overallResult === 'qualified' ? (
                    <CheckCircle className="w-10 h-10 text-green-600" />
                  ) : (
                    <XCircle className="w-10 h-10 text-red-600" />
                  )}
                  <div>
                    <p className={`text-xl font-bold ${
                      selectedReport.overallResult === 'qualified'
                        ? 'text-green-700'
                        : 'text-red-700'
                    }`}>
                      {selectedReport.overallResult === 'qualified' ? '综合判定：合格' : '综合判定：不合格'}
                    </p>
                    <p className="text-sm text-gray-600 mt-1">
                      {selectedReport.overallResult === 'qualified'
                        ? '该批次产品符合国家标准要求'
                        : '该批次产品存在不合格项，不符合国家标准要求'}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm text-gray-500">检测机构</p>
                  <p className="font-medium text-gray-900">寿光市农产品检测中心</p>
                </div>
              </div>
            </div>

            <div className="flex justify-between text-sm text-gray-500 pt-4 border-t border-gray-200">
              <p>创建时间：{formatDateTime(selectedReport.createdAt)}</p>
              <p>报告有效期至：{formatDate(new Date(Date.now() + 90 * 86400000))}</p>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
