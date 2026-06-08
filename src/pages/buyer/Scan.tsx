import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Html5Qrcode } from 'html5-qrcode';
import { Scan, Camera, Keyboard, CheckCircle, AlertTriangle, XCircle, Package, Leaf, MapPin, Calendar, Hash, ArrowRight, RefreshCw, User } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { api } from '../../services/api';
import { useAuthStore } from '../../store/authStore';
import { useToast } from '../../components/ui/MessageToast';
import { Modal, ModalButton } from '../../components/ui/Modal';
import { StatusBadge } from '../../components/ui/StatusBadge';
import { formatDate, formatWeight, formatCurrency, formatNumber, formatArea } from '../../utils/format';
import { Batch, PlantingInfo, PesticideRecord, TraceCode, User as UserType, Plot } from '../../types';

const scanFormSchema = z.object({
  traceCode: z.string().min(10, '追溯码长度至少10位'),
});

const purchaseFormSchema = z.object({
  quantity: z.number().min(0.1, '收购重量必须大于0'),
  unitPrice: z.number().min(0.01, '单价必须大于0'),
});

type ScanFormData = z.infer<typeof scanFormSchema>;
type PurchaseFormData = z.infer<typeof purchaseFormSchema>;

interface ScanResult {
  traceCode: TraceCode;
  planting: PlantingInfo;
  farmer: UserType;
  plot: Plot;
  pesticideRecords: PesticideRecord[];
  precheckResult: 'pass' | 'warning' | 'fail';
  precheckDetails: {
    pesticideResidue: Array<{ item: string; value: number; standard: number; unit: string; result: 'normal' | 'warning' | 'exceed' }>;
    overall: string;
  };
}

export default function BuyerScan() {
  const { user } = useAuthStore();
  const { showToast } = useToast();
  const [inputMode, setInputMode] = useState<'camera' | 'manual'>('camera');
  const [scanning, setScanning] = useState(false);
  const [scanResult, setScanResult] = useState<ScanResult | null>(null);
  const [showPurchaseModal, setShowPurchaseModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [purchaseSuccess, setPurchaseSuccess] = useState(false);
  const [lastCode, setLastCode] = useState('');
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const scannerContainerId = 'qr-reader';

  const scanForm = useForm<ScanFormData>({
    resolver: zodResolver(scanFormSchema),
    defaultValues: { traceCode: '' },
  });

  const purchaseForm = useForm<PurchaseFormData>({
    resolver: zodResolver(purchaseFormSchema),
    defaultValues: { quantity: 0, unitPrice: 0 },
  });

  useEffect(() => {
    return () => {
      scannerRef.current?.stop().catch(() => {});
    };
  }, []);

  async function startScanner() {
    try {
      setScanning(true);
      scannerRef.current = new Html5Qrcode(scannerContainerId);
      await scannerRef.current.start(
        { facingMode: 'environment' },
        {
          fps: 10,
          qrbox: { width: 250, height: 250 },
        },
        (decodedText) => {
          handleScanSuccess(decodedText);
        },
        () => {}
      );
    } catch (error) {
      console.error('Failed to start scanner:', error);
      showToast('error', '摄像头启动失败，请检查权限设置');
      setScanning(false);
    }
  }

  async function stopScanner() {
    if (scannerRef.current) {
      await scannerRef.current.stop().catch(() => {});
      scannerRef.current = null;
    }
    setScanning(false);
  }

  async function handleScanSuccess(code: string) {
    await stopScanner();
    setLastCode(code);
    await performScan(code);
  }

  async function performScan(code: string) {
    try {
      const result = await api.scanPrecheck({ traceCode: code, buyerId: user!.id });
      
      setScanResult(result);
      setShowDetailModal(true);
      
      if (result.precheckResult === 'pass') {
        showToast('success', '预检通过，可进行收购');
      } else if (result.precheckResult === 'warning') {
        showToast('warning', '存在风险，请谨慎收购');
      } else {
        showToast('error', '检测不合格，禁止收购');
      }
    } catch (error: any) {
      showToast('error', error.message || '追溯码无效或已被使用');
      resetScan();
    }
  }

  function resetScan() {
    setScanResult(null);
    setShowDetailModal(false);
    setShowPurchaseModal(false);
    setPurchaseSuccess(false);
    scanForm.reset();
    purchaseForm.reset();
    if (inputMode === 'camera') {
      setTimeout(() => startScanner().catch(() => {}), 100);
    }
  }

  async function onManualSubmit(data: ScanFormData) {
    await performScan(data.traceCode);
  }

  async function onPurchaseSubmit(data: PurchaseFormData) {
    if (!scanResult) return;
    
    try {
      const totalAmount = data.quantity * data.unitPrice;
      await api.confirmBatch({
        traceCode: lastCode,
        buyerId: user!.id,
        quantity: data.quantity,
        unitPrice: data.unitPrice,
        precheckStatus: scanResult.precheckResult,
        precheckDetails: scanResult.precheckDetails,
      });
      
      showToast('success', `收购成功！总金额：${formatCurrency(totalAmount)}`);
      setPurchaseSuccess(true);
      setTimeout(() => {
        resetScan();
      }, 2000);
    } catch (error: any) {
      showToast('error', error.message || '收购失败');
    }
  }

  function handlePurchase() {
    if (scanResult?.precheckResult === 'fail') {
      showToast('error', '该批次检测不合格，禁止收购');
      return;
    }
    setShowDetailModal(false);
    setShowPurchaseModal(true);
  }

  const getPrecheckColor = (status: string) => {
    switch (status) {
      case 'pass': return 'border-green-200 bg-green-50';
      case 'warning': return 'border-yellow-200 bg-yellow-50';
      case 'fail': return 'border-red-200 bg-red-50';
      default: return 'border-gray-200 bg-gray-50';
    }
  };

  const getPrecheckIcon = (status: string) => {
    switch (status) {
      case 'pass': return <CheckCircle className="w-12 h-12 text-green-500" />;
      case 'warning': return <AlertTriangle className="w-12 h-12 text-yellow-500" />;
      case 'fail': return <XCircle className="w-12 h-12 text-red-500" />;
      default: return null;
    }
  };

  const getPrecheckText = (status: string) => {
    switch (status) {
      case 'pass': return { title: '预检通过', desc: '该批次质量合格，可以收购', color: 'text-green-700' };
      case 'warning': return { title: '存在风险', desc: '部分指标接近阈值，请谨慎', color: 'text-yellow-700' };
      case 'fail': return { title: '检测不合格', desc: '农药残留超标，禁止收购', color: 'text-red-700' };
      default: return { title: '', desc: '', color: '' };
    }
  };

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">扫码收购</h1>
        <p className="mt-1 text-sm text-gray-500">扫描农产品追溯码，获取批次质量信息</p>
      </div>

      <div className="flex justify-center mb-6">
        <div className="inline-flex bg-white rounded-2xl p-1 shadow-sm border border-gray-200">
          <button
            onClick={() => { setInputMode('camera'); resetScan(); }}
            className={`px-6 py-2.5 rounded-xl font-medium text-sm flex items-center gap-2 transition-colors ${
              inputMode === 'camera'
                ? 'bg-green-600 text-white shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            <Camera className="w-4 h-4" />
            摄像头扫码
          </button>
          <button
            onClick={() => { setInputMode('manual'); stopScanner(); }}
            className={`px-6 py-2.5 rounded-xl font-medium text-sm flex items-center gap-2 transition-colors ${
              inputMode === 'manual'
                ? 'bg-green-600 text-white shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            <Keyboard className="w-4 h-4" />
            手动输入
          </button>
        </div>
      </div>

      <AnimatePresence mode="wait">
        {inputMode === 'camera' ? (
          <motion.div
            key="camera"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="bg-white rounded-3xl shadow-sm border border-gray-100 p-8"
          >
            <div className="flex flex-col items-center">
              <div
                id={scannerContainerId}
                className="relative w-full max-w-md aspect-square bg-gray-900 rounded-2xl overflow-hidden mb-6"
              >
                {!scanning && (
                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <Scan className="w-16 h-16 text-gray-500 mb-4" />
                    <p className="text-gray-400 mb-4">点击下方按钮启动摄像头</p>
                    <button
                      onClick={startScanner}
                      className="btn-primary flex items-center gap-2"
                    >
                      <Camera className="w-5 h-5" />
                      启动扫码
                    </button>
                  </div>
                )}
                {scanning && (
                  <>
                    <div className="absolute inset-0 pointer-events-none">
                      <motion.div
                        initial={{ top: 0 }}
                        animate={{ top: '100%' }}
                        transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
                        className="absolute left-0 right-0 h-1 bg-gradient-to-r from-transparent via-green-400 to-transparent shadow-[0_0_20px_rgba(74,222,128,0.5)]"
                      />
                    </div>
                    <div className="absolute top-4 left-4 w-8 h-8 border-l-4 border-t-4 border-green-400 rounded-tl-xl" />
                    <div className="absolute top-4 right-4 w-8 h-8 border-r-4 border-t-4 border-green-400 rounded-tr-xl" />
                    <div className="absolute bottom-4 left-4 w-8 h-8 border-l-4 border-b-4 border-green-400 rounded-bl-xl" />
                    <div className="absolute bottom-4 right-4 w-8 h-8 border-r-4 border-b-4 border-green-400 rounded-br-xl" />
                  </>
                )}
              </div>

              {scanning && (
                <button
                  onClick={stopScanner}
                  className="btn-secondary flex items-center gap-2"
                >
                  <RefreshCw className="w-5 h-5" />
                  重新扫描
                </button>
              )}

              <p className="mt-4 text-sm text-gray-500 text-center">
                将追溯码对准框内，保持光线充足</p>
            </div>
          </motion.div>
        ) : (
          <motion.div
            key="manual"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="bg-white rounded-3xl shadow-sm border border-gray-100 p-8"
          >
            <form onSubmit={scanForm.handleSubmit(onManualSubmit)} className="max-w-md mx-auto">
              <div className="text-center mb-6">
                <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Hash className="w-10 h-10 text-green-600" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900">输入追溯码</h3>
                <p className="text-sm text-gray-500 mt-1">请输入或粘贴农产品追溯码</p>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">追溯码</label>
                  <input
                    type="text"
                    {...scanForm.register('traceCode')}
                    placeholder="请输入追溯码"
                    className="input-field text-center text-lg tracking-widest"
                    autoFocus
                  />
                  {scanForm.formState.errors.traceCode && (
                    <p className="mt-1 text-sm text-red-500">
                      {scanForm.formState.errors.traceCode.message}
                    </p>
                  )}
                </div>

                <button
                  type="submit"
                  disabled={scanForm.formState.isSubmitting}
                  className="w-full btn-primary"
                >
                  查询
                </button>
              </div>
            </form>
          </motion.div>
        )}
      </AnimatePresence>

      <Modal
        open={showDetailModal}
        onClose={() => setShowDetailModal(false)}
        title="批次信息"
        size="lg"
        footer={
          scanResult && scanResult.precheckResult !== 'fail' ? (
          <>
            <ModalButton variant="secondary" onClick={() => setShowDetailModal(false)}>
              取消
            </ModalButton>
            <ModalButton onClick={handlePurchase}>
              确认收购
            </ModalButton>
          </>
        ) : (
          <ModalButton variant="secondary" onClick={() => setShowDetailModal(false)}>
            关闭
          </ModalButton>
        )
        }
      >
        {scanResult && (
          <div className="space-y-6">
            <motion.div
            className={`p-6 rounded-2xl border-2 ${getPrecheckColor(scanResult.precheckResult)}`}
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            >
              <div className="flex items-center gap-4">
                {getPrecheckIcon(scanResult.precheckResult)}
                <div>
                  <h3 className={`text-xl font-bold ${getPrecheckText(scanResult.precheckResult).color}`}>
                    {getPrecheckText(scanResult.precheckResult).title}
                  </h3>
                  <p className="text-sm text-gray-600">
                    {getPrecheckText(scanResult.precheckResult).desc}
                  </p>
                </div>
              </div>
            </motion.div>

            <div className="grid grid-cols-2 gap-4">
              <div className="p-4 bg-gray-50 rounded-xl">
                <div className="flex items-center gap-2 text-gray-500 mb-1">
                  <Hash className="w-4 h-4" />
                  <span className="text-xs">追溯码</span>
                </div>
                <p className="font-mono text-sm font-medium">{scanResult.traceCode.code}</p>
              </div>
              <div className="p-4 bg-gray-50 rounded-xl">
                <div className="flex items-center gap-2 text-gray-500 mb-1">
                  <User className="w-4 h-4" />
                  <span className="text-xs">农户</span>
                </div>
                <p className="font-medium">{scanResult.farmer.name}</p>
              </div>
            </div>

            <div className="p-5 bg-green-50 rounded-xl">
              <div className="flex items-start gap-3 mb-4">
                <Leaf className="w-5 h-5 text-green-600 mt-0.5" />
                <div className="flex-1">
                  <p className="font-medium text-gray-900">种植信息</p>
                  <div className="mt-2 grid grid-cols-2 gap-3 text-sm">
                    <div>
                      <span className="text-gray-500">作物品种：</span>
                      <span className="text-gray-900">{scanResult.planting.cropType}</span>
                    </div>
                    <div>
                      <span className="text-gray-500">种植面积：</span>
                      <span className="text-gray-900">{formatArea(scanResult.planting.area)}</span>
                    </div>
                    <div>
                      <span className="text-gray-500">播种日期：</span>
                      <span className="text-gray-900">{formatDate(scanResult.planting.plantDate)}</span>
                    </div>
                    <div>
                      <span className="text-gray-500">预计产量：</span>
                      <span className="text-gray-900">{formatNumber(scanResult.planting.expectedYield)} kg</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="p-5 bg-blue-50 rounded-xl">
              <div className="flex items-start gap-3 mb-4">
                <MapPin className="w-5 h-5 text-blue-600 mt-0.5" />
                <div>
                  <p className="font-medium text-gray-900">产地信息</p>
                  <p className="text-sm text-gray-600 mt-1">
                    {scanResult.plot.location.province} {scanResult.plot.location.city} {scanResult.plot.location.address}
                  </p>
                </div>
              </div>
            </div>

            <div>
              <h4 className="font-medium text-gray-900 mb-3">农药残留检测</h4>
              <div className="space-y-2">
                {scanResult.precheckDetails.pesticideResidue.map((item, index) => (
                  <div
                    key={index}
                    className={`p-3 rounded-xl border ${
                      item.result === 'normal'
                        ? 'bg-green-50 border-green-100'
                        : item.result === 'warning'
                        ? 'bg-yellow-50 border-yellow-100'
                        : 'bg-red-50 border-red-100'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-medium">{item.item}</span>
                      <StatusBadge
                        status={item.result}
                        customColors={{
                          normal: 'bg-green-100 text-green-800',
                          warning: 'bg-yellow-100 text-yellow-800',
                          exceed: 'bg-red-100 text-red-800',
                        }}
                      />
                    </div>
                    <div className="mt-1 text-sm text-gray-600">
                      {formatNumber(item.value)} / {item.standard} {item.unit}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </Modal>

      <Modal
        open={showPurchaseModal}
        onClose={() => setShowPurchaseModal(false)}
        title="确认收购"
        size="md"
      >
        {purchaseSuccess ? (
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="text-center py-8"
          >
            <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle className="w-10 h-10 text-green-600" />
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">收购成功</h3>
            <p className="text-gray-500">批次已成功录入系统</p>
          </motion.div>
        ) : (
          <form onSubmit={purchaseForm.handleSubmit(onPurchaseSubmit)} className="space-y-5">
            <div className="p-4 bg-gray-50 rounded-xl mb-4">
              <div className="flex items-center gap-3">
                <Package className="w-8 h-8 text-green-600" />
                <div>
                  <p className="font-medium">{scanResult?.traceCode.code}</p>
                  <p className="text-sm text-gray-500">{scanResult?.planting.cropType} · {formatArea(scanResult?.planting.area || 0)}</p>
                </div>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">收购重量 (kg)</label>
              <input
                type="number"
                step="0.1"
                {...purchaseForm.register('quantity', { valueAsNumber: true })}
                placeholder="请输入收购重量"
                className="input-field"
              />
              {purchaseForm.formState.errors.quantity && (
                <p className="mt-1 text-sm text-red-500">
                  {purchaseForm.formState.errors.quantity.message}
                </p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">单价 (元/kg)</label>
              <input
                type="number"
                step="0.01"
                {...purchaseForm.register('unitPrice', { valueAsNumber: true })}
                placeholder="请输入单价"
                className="input-field"
              />
              {purchaseForm.formState.errors.unitPrice && (
                <p className="mt-1 text-sm text-red-500">
                  {purchaseForm.formState.errors.unitPrice.message}
                </p>
              )}
            </div>

            <div className="p-4 bg-green-50 rounded-xl">
              <div className="flex justify-between items-center">
                <span className="text-gray-600">预估总金额</span>
                <span className="text-2xl font-bold text-green-600">
                  {formatCurrency(
                    (purchaseForm.watch('quantity') || 0) * (purchaseForm.watch('unitPrice') || 0)
                  )}
                </span>
              </div>
            </div>

            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={() => setShowPurchaseModal(false)}
                className="flex-1 btn-secondary"
              >
                取消
              </button>
              <button
                type="submit"
                disabled={purchaseForm.formState.isSubmitting}
                className="flex-1 btn-primary"
              >
                确认收购
              </button>
            </div>
          </form>
        )}
      </Modal>
    </div>
  );
}
