import { useEffect, useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import {
  BarChart3,
  TrendingUp,
  Download,
  Calendar,
  FileText,
  CheckCircle,
  Award,
  Banknote,
} from 'lucide-react';
import {
  BarChart,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  AreaChart,
  Area,
  ComposedChart,
  Bar,
} from 'recharts';
import {
  QrCode,
  ShieldCheck,
  DollarSign,
  Filter,
  ChevronDown,
} from 'lucide-react';
import { api } from '../../services/api';
import { formatCurrency, formatPercentage, formatNumber } from '../../utils/format';

const COLORS = ['#10b981', '#f59e0b', '#6366f1', '#ef4444', '#8b5cf6', '#06b6d4'];

export default function Reports() {
  const [loading, setLoading] = useState(true);
  const [reportData, setReportData] = useState<any>(null);
  const [timeRange, setTimeRange] = useState<'month' | 'quarter' | 'year'>('month');

  useEffect(() => {
    fetchReportData();
  }, [timeRange]);

  const fetchReportData = async () => {
    setLoading(true);
    try {
      const data = await api.getRegulatorReports();
      setReportData(data);
    } catch (err) {
      console.error('获取报表数据失败', err);
    } finally {
      setLoading(false);
    }
  };

  const mockMonthlyData = useMemo(() => [
    { month: '1月', traceEnableRate: 85, certPassRate: 92, subsidyTotal: 1250000, batchCount: 450 },
    { month: '2月', traceEnableRate: 88, certPassRate: 89, subsidyTotal: 980000, batchCount: 380 },
    { month: '3月', traceEnableRate: 90, certPassRate: 94, subsidyTotal: 1560000, batchCount: 520 },
    { month: '4月', traceEnableRate: 87, certPassRate: 91, subsidyTotal: 1100000, batchCount: 410 },
    { month: '5月', traceEnableRate: 92, certPassRate: 95, subsidyTotal: 1890000, batchCount: 580 },
    { month: '6月', traceEnableRate: 94, certPassRate: 93, subsidyTotal: 2100000, batchCount: 620 },
  ], []);

  const mockCertTypeData = useMemo(() => [
    { name: '有机认证', value: 156, percentage: 32 },
    { name: '绿色认证', value: 203, percentage: 42 },
    { name: 'GAP认证', value: 125, percentage: 26 },
  ], []);

  const mockComplaintTypeData = useMemo(() => [
    { name: '质量问题', value: 45, percentage: 45 },
    { name: '农药残留', value: 28, percentage: 28 },
    { name: '假冒伪劣', value: 15, percentage: 15 },
    { name: '其他问题', value: 12, percentage: 12 },
  ], []);

  const mockRegionData = useMemo(() => [
    { region: '东城区', traceRate: 95, certRate: 88, passRate: 96, complaintCount: 12 },
    { region: '西城区', traceRate: 92, certRate: 90, passRate: 94, complaintCount: 8 },
    { region: '朝阳区', traceRate: 88, certRate: 85, passRate: 91, complaintCount: 15 },
    { region: '海淀区', traceRate: 94, certRate: 92, passRate: 97, complaintCount: 6 },
    { region: '丰台区', traceRate: 85, certRate: 80, passRate: 89, complaintCount: 18 },
    { region: '石景山区', traceRate: 90, certRate: 87, passRate: 93, complaintCount: 9 },
  ], []);

  const summaryCards = [
    {
      title: '追溯启用率',
      value: reportData ? formatPercentage(reportData.avgTraceEnableRate) : '91.2%',
      icon: QrCode,
      color: 'bg-green-500',
      bgColor: 'bg-green-50',
      trend: '+3.5%',
      trendUp: true,
      description: '较上周期',
    },
    {
      title: '认证通过率',
      value: reportData ? formatPercentage(reportData.avgCertPassRate) : '92.8%',
      icon: ShieldCheck,
      color: 'bg-gold-500',
      bgColor: 'bg-gold-50',
      trend: '+1.2%',
      trendUp: true,
      description: '较上周期',
    },
    {
      title: '补贴发放总额',
      value: reportData ? formatCurrency(reportData.totalSubsidy) : '¥888万',
      icon: DollarSign,
      color: 'bg-blue-500',
      bgColor: 'bg-blue-50',
      trend: '+12.5%',
      trendUp: true,
      description: '较上周期',
    },
    {
      title: '检测合格率',
      value: reportData ? formatPercentage(reportData.avgPassRate) : '94.3%',
      icon: CheckCircle,
      color: 'bg-purple-500',
      bgColor: 'bg-purple-50',
      trend: '+0.8%',
      trendUp: true,
      description: '较上周期',
    },
  ];

  const handleExport = () => {
    alert('报表导出功能（模拟）');
  };

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-4 rounded-xl shadow-lg border border-gray-100">
          <p className="font-medium text-gray-900 mb-2">{label}</p>
          {payload.map((entry: any, index: number) => (
            <p key={index} className="text-sm" style={{ color: entry.color }}>
              {entry.name}: {entry.name.includes('率') || entry.name.includes('Rate') 
                ? formatPercentage(entry.value) 
                : entry.name.includes('补贴') || entry.name.includes('subsidy')
                  ? formatCurrency(entry.value)
                  : formatNumber(entry.value)}
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">监管报表</h1>
          <p className="text-gray-500 mt-1">多维度数据分析，辅助监管决策</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex bg-gray-100 rounded-lg p-1">
            {[
              { key: 'month', label: '本月' },
              { key: 'quarter', label: '本季度' },
              { key: 'year', label: '本年度' },
            ].map((range) => (
              <button
                key={range.key}
                onClick={() => setTimeRange(range.key as any)}
                className={`px-4 py-2 text-sm font-medium rounded-md transition-all ${
                  timeRange === range.key
                    ? 'bg-white text-agri-600 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                {range.label}
              </button>
            ))}
          </div>
          <button
            onClick={handleExport}
            className="flex items-center gap-2 px-4 py-2 bg-agri-500 text-white rounded-xl hover:bg-agri-600 transition-colors font-medium shadow-lg shadow-agri-500/30"
          >
            <Download className="w-4 h-4" />
            <span>导出报表</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {summaryCards.map((card, index) => (
          <motion.div
            key={index}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            className={`${card.bgColor} rounded-2xl p-5 border border-white shadow-sm`}
          >
            <div className="flex items-start justify-between">
              <div>
                <p className="text-gray-600 text-sm">{card.title}</p>
                <p className="text-3xl font-bold text-gray-900 mt-2">{card.value}</p>
                <div className="flex items-center gap-2 mt-3">
                  <div className={`flex items-center gap-1 text-sm ${card.trendUp ? 'text-green-600' : 'text-danger-600'}`}>
                    <TrendingUp className={`w-4 h-4 ${!card.trendUp ? 'rotate-180' : ''}`} />
                    <span>{card.trend}</span>
                  </div>
                  <span className="text-sm text-gray-500">{card.description}</span>
                </div>
              </div>
              <div className={`${card.color} w-12 h-12 rounded-xl flex items-center justify-center shadow-lg`}>
                <card.icon className="w-6 h-6 text-white" />
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="animate-spin w-8 h-8 border-4 border-agri-500 border-t-transparent rounded-full" />
        </div>
      ) : (
        <>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100"
          >
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center">
                <BarChart3 className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900">月度趋势分析</h3>
                <p className="text-sm text-gray-500">追溯启用率、认证通过率、补贴发放趋势</p>
              </div>
            </div>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart data={mockMonthlyData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
                  <XAxis dataKey="month" stroke="#9ca3af" fontSize={12} />
                  <YAxis yAxisId="left" stroke="#9ca3af" fontSize={12} tickFormatter={(value) => `${value}%`} domain={[0, 100]} />
                  <YAxis yAxisId="right" orientation="right" stroke="#9ca3af" fontSize={12} tickFormatter={(value) => `¥${(value / 10000).toFixed(0)}万`} />
                  <Tooltip content={<CustomTooltip />} />
                  <Legend />
                  <Line
                    yAxisId="left"
                    type="monotone"
                    dataKey="traceEnableRate"
                    name="追溯启用率"
                    stroke="#10b981"
                    strokeWidth={3}
                    dot={{ fill: '#10b981', strokeWidth: 2 }}
                    activeDot={{ r: 6 }}
                  />
                  <Line
                    yAxisId="left"
                    type="monotone"
                    dataKey="certPassRate"
                    name="认证通过率"
                    stroke="#f59e0b"
                    strokeWidth={3}
                    dot={{ fill: '#f59e0b', strokeWidth: 2 }}
                    activeDot={{ r: 6 }}
                  />
                  <Bar
                    yAxisId="right"
                    dataKey="subsidyTotal"
                    name="补贴发放"
                    fill="#6366f1"
                    radius={[4, 4, 0, 0]}
                    opacity={0.8}
                  />
                </ComposedChart>
              </ResponsiveContainer>
            </div>
          </motion.div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.5 }}
              className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100"
            >
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 bg-gold-100 rounded-xl flex items-center justify-center">
                  <Award className="w-5 h-5 text-gold-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">认证类型分布</h3>
                  <p className="text-sm text-gray-500">各类型认证占比统计</p>
                </div>
              </div>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={mockCertTypeData}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={90}
                      paddingAngle={3}
                      dataKey="value"
                    >
                      {mockCertTypeData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip
                      formatter={(value: number, name: string, props: any) => [
                        `${value} 个 (${props.payload.percentage}%)`,
                        name,
                      ]}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="flex justify-center gap-6 mt-4">
                {mockCertTypeData.map((item, index) => (
                  <div key={index} className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full" style={{ backgroundColor: COLORS[index] }} />
                    <span className="text-sm text-gray-600">{item.name}</span>
                  </div>
                ))}
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.6 }}
              className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100"
            >
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 bg-red-100 rounded-xl flex items-center justify-center">
                  <FileText className="w-5 h-5 text-red-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">投诉类型分布</h3>
                  <p className="text-sm text-gray-500">各类投诉占比统计</p>
                </div>
              </div>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={mockComplaintTypeData}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={90}
                      paddingAngle={3}
                      dataKey="value"
                    >
                      {mockComplaintTypeData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index + 2 % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip
                      formatter={(value: number, name: string, props: any) => [
                        `${value} 起 (${props.payload.percentage}%)`,
                        name,
                      ]}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="flex justify-center gap-6 mt-4">
                {mockComplaintTypeData.map((item, index) => (
                  <div key={index} className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full" style={{ backgroundColor: COLORS[index + 2] }} />
                    <span className="text-sm text-gray-600">{item.name}</span>
                  </div>
                ))}
              </div>
            </motion.div>
          </div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.7 }}
            className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100"
          >
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 bg-purple-100 rounded-xl flex items-center justify-center">
                <BarChart3 className="w-5 h-5 text-purple-600" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900">各区域指标对比</h3>
                <p className="text-sm text-gray-500">各区县追溯、认证、合格情况对比</p>
              </div>
            </div>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={mockRegionData} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
                  <XAxis type="number" stroke="#9ca3af" fontSize={12} domain={[0, 100]} tickFormatter={(value) => `${value}%`} />
                  <YAxis dataKey="region" type="category" stroke="#9ca3af" fontSize={12} width={80} />
                  <Tooltip content={<CustomTooltip />} />
                  <Legend />
                  <Bar dataKey="traceRate" name="追溯启用率" fill="#10b981" radius={[0, 4, 4, 0]} />
                  <Bar dataKey="certRate" name="认证覆盖率" fill="#f59e0b" radius={[0, 4, 4, 0]} />
                  <Bar dataKey="passRate" name="检测合格率" fill="#6366f1" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.8 }}
            className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100"
          >
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-green-100 rounded-xl flex items-center justify-center">
                  <TrendingUp className="w-5 h-5 text-green-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">区域详情数据</h3>
                  <p className="text-sm text-gray-500">各区县详细指标数据</p>
                </div>
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-100">
                    <th className="text-left py-4 px-4 text-sm font-medium text-gray-500">区域</th>
                    <th className="text-right py-4 px-4 text-sm font-medium text-gray-500">追溯启用率</th>
                    <th className="text-right py-4 px-4 text-sm font-medium text-gray-500">认证覆盖率</th>
                    <th className="text-right py-4 px-4 text-sm font-medium text-gray-500">检测合格率</th>
                    <th className="text-right py-4 px-4 text-sm font-medium text-gray-500">投诉数量</th>
                    <th className="text-center py-4 px-4 text-sm font-medium text-gray-500">综合评级</th>
                  </tr>
                </thead>
                <tbody>
                  {mockRegionData.map((region, index) => {
                    const avgScore = (region.traceRate + region.certRate + region.passRate) / 3;
                    const grade = avgScore >= 95 ? 'A' : avgScore >= 90 ? 'B' : avgScore >= 85 ? 'C' : 'D';
                    const gradeColor = grade === 'A' ? 'bg-green-100 text-green-700' :
                                      grade === 'B' ? 'bg-blue-100 text-blue-700' :
                                      grade === 'C' ? 'bg-yellow-100 text-yellow-700' :
                                      'bg-red-100 text-red-700';
                    return (
                      <tr key={index} className="border-b border-gray-50 hover:bg-gray-50 transition-colors">
                        <td className="py-4 px-4">
                          <span className="font-medium text-gray-900">{region.region}</span>
                        </td>
                        <td className="py-4 px-4 text-right">
                          <span className="text-green-600 font-semibold">{formatPercentage(region.traceRate)}</span>
                        </td>
                        <td className="py-4 px-4 text-right">
                          <span className="text-gold-600 font-semibold">{formatPercentage(region.certRate)}</span>
                        </td>
                        <td className="py-4 px-4 text-right">
                          <span className="text-blue-600 font-semibold">{formatPercentage(region.passRate)}</span>
                        </td>
                        <td className="py-4 px-4 text-right">
                          <span className={`font-semibold ${region.complaintCount > 10 ? 'text-red-600' : 'text-gray-700'}`}>
                            {region.complaintCount} 起
                          </span>
                        </td>
                        <td className="py-4 px-4 text-center">
                          <span className={`px-3 py-1 rounded-full text-sm font-bold ${gradeColor}`}>
                            {grade}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </motion.div>
        </>
      )}
    </div>
  );
}
