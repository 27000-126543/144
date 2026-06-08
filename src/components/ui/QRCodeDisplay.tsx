import { useState, useRef } from 'react';
import { QRCodeCanvas } from 'qrcode.react';
import { motion, AnimatePresence } from 'framer-motion';
import { Download, Printer, Maximize2, X, Copy, Check } from 'lucide-react';
import { cn } from '../../lib/utils';
import { formatTraceCode } from '../../utils/format';

interface QRCodeDisplayProps {
  value: string;
  size?: number;
  showLabel?: boolean;
  showActions?: boolean;
  level?: 'L' | 'M' | 'Q' | 'H';
  includeMargin?: boolean;
  bgColor?: string;
  fgColor?: string;
  className?: string;
}

export function QRCodeDisplay({
  value,
  size = 160,
  showLabel = true,
  showActions = true,
  level = 'M',
  includeMargin = true,
  bgColor = '#ffffff',
  fgColor = '#000000',
  className,
}: QRCodeDisplayProps) {
  const [showEnlarged, setShowEnlarged] = useState(false);
  const [copied, setCopied] = useState(false);
  const qrRef = useRef<HTMLDivElement>(null);

  const handleDownload = () => {
    const canvas = document.querySelector('#qr-canvas canvas') as HTMLCanvasElement;
    if (canvas) {
      const link = document.createElement('a');
      link.download = `qrcode-${value.slice(0, 10)}.png`;
      link.href = canvas.toDataURL('image/png');
      link.click();
    }
  };

  const handlePrint = () => {
    const canvas = document.querySelector('#qr-canvas canvas') as HTMLCanvasElement;
    if (canvas) {
      const printWindow = window.open('', '_blank');
      if (printWindow) {
        printWindow.document.write(`
          <!DOCTYPE html>
          <html>
            <head>
              <title>打印二维码 - ${value}</title>
              <style>
                body { margin: 0; display: flex; flex-direction: column; align-items: center; justify-content: center; height: 100vh; font-family: sans-serif; }
                h2 { margin-bottom: 20px; color: #333; }
                img { max-width: 400px; max-height: 400px; }
                p { margin-top: 20px; color: #666; font-size: 14px; }
              </style>
            </head>
            <body>
              <h2>追溯码二维码</h2>
              <img src="${canvas.toDataURL('image/png')}" alt="QR Code" />
              <p>${formatTraceCode(value)}</p>
            </body>
          </html>
        `);
        printWindow.document.close();
        printWindow.onload = () => {
          printWindow.print();
          printWindow.close();
        };
      }
    }
  };

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Copy failed:', err);
    }
  };

  return (
    <div className={cn('bg-white rounded-2xl border border-gray-200 p-6', className)}>
      <div className="flex flex-col items-center">
        <div
          ref={qrRef}
          id="qr-canvas"
          className="relative bg-white p-4 rounded-xl border-2 border-dashed border-gray-200"
        >
          <QRCodeCanvas
            value={value}
            size={size}
            level={level}
            includeMargin={includeMargin}
            bgColor={bgColor}
            fgColor={fgColor}
          />
        </div>

        {showLabel && (
          <div className="mt-4 text-center">
            <p className="text-xs text-gray-500 mb-1">追溯码</p>
            <p className="font-mono text-sm font-semibold text-gray-900">
              {formatTraceCode(value)}
            </p>
          </div>
        )}

        {showActions && (
          <div className="mt-4 flex items-center gap-2">
            <button
              onClick={() => setShowEnlarged(true)}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors group"
              title="放大查看"
            >
              <Maximize2 className="w-4 h-4 text-gray-500 group-hover:text-gray-700" />
            </button>
            <button
              onClick={handleDownload}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors group"
              title="下载二维码"
            >
              <Download className="w-4 h-4 text-gray-500 group-hover:text-gray-700" />
            </button>
            <button
              onClick={handlePrint}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors group"
              title="打印二维码"
            >
              <Printer className="w-4 h-4 text-gray-500 group-hover:text-gray-700" />
            </button>
            <button
              onClick={handleCopy}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors group"
              title="复制追溯码"
            >
              {copied ? (
                <Check className="w-4 h-4 text-green-500" />
              ) : (
                <Copy className="w-4 h-4 text-gray-500 group-hover:text-gray-700" />
              )}
            </button>
          </div>
        )}
      </div>

      <AnimatePresence>
        {showEnlarged && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowEnlarged(false)}
              className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="fixed inset-x-4 top-1/2 -translate-y-1/2 z-50 max-w-md mx-auto"
            >
              <div className="bg-white rounded-3xl p-8 shadow-2xl">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-xl font-semibold text-gray-900">二维码详情</h3>
                  <button
                    onClick={() => setShowEnlarged(false)}
                    className="p-2 hover:bg-gray-100 rounded-xl transition-colors"
                  >
                    <X className="w-5 h-5 text-gray-500" />
                  </button>
                </div>
                <div className="flex justify-center mb-6">
                  <div className="bg-white p-6 rounded-2xl border-2 border-dashed border-gray-200">
                    <QRCodeCanvas
                      value={value}
                      size={280}
                      level={level}
                      includeMargin={true}
                      bgColor={bgColor}
                      fgColor={fgColor}
                    />
                  </div>
                </div>
                <div className="text-center mb-6">
                  <p className="text-sm text-gray-500 mb-2">追溯码</p>
                  <p className="font-mono text-lg font-semibold text-gray-900">
                    {formatTraceCode(value)}
                  </p>
                </div>
                <div className="grid grid-cols-3 gap-3">
                  <button
                    onClick={handleDownload}
                    className="flex flex-col items-center gap-2 p-4 rounded-xl border border-gray-200 hover:border-green-400 hover:bg-green-50 transition-all"
                  >
                    <Download className="w-5 h-5 text-gray-600" />
                    <span className="text-xs font-medium text-gray-600">下载</span>
                  </button>
                  <button
                    onClick={handlePrint}
                    className="flex flex-col items-center gap-2 p-4 rounded-xl border border-gray-200 hover:border-green-400 hover:bg-green-50 transition-all"
                  >
                    <Printer className="w-5 h-5 text-gray-600" />
                    <span className="text-xs font-medium text-gray-600">打印</span>
                  </button>
                  <button
                    onClick={handleCopy}
                    className="flex flex-col items-center gap-2 p-4 rounded-xl border border-gray-200 hover:border-green-400 hover:bg-green-50 transition-all"
                  >
                    {copied ? (
                      <Check className="w-5 h-5 text-green-500" />
                    ) : (
                      <Copy className="w-5 h-5 text-gray-600" />
                    )}
                    <span className="text-xs font-medium text-gray-600">
                      {copied ? '已复制' : '复制'}
                    </span>
                  </button>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
