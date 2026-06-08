import { useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import {
  TrendingUp,
  AlertTriangle,
  FileCheck,
  Users,
  MapPin,
  Bell,
  BarChart3,
  ShieldCheck,
  AlertCircle,
  CheckCircle,
} from 'lucide-react';
import ReactECharts from 'echarts-for-react';
import { useRegulatorStore } from '../../store/regulatorStore';
import { useMessageStore } from '../../store/messageStore';
import { formatNumber, formatPercentage, formatDate } from '../../utils/format';
import { StatusBadge } from '../../components/ui/StatusBadge';

export default function RegulatorDashboard() {
  const { stats, loading, fetchStats } = useRegulatorStore();
  const { messages, unreadCount, fetchMessages } = useMessageStore();
  const [activeTab, setActiveTab] = useState<'passRate' | 'certCoverage' | 'complaintHandle'>('passRate');

  useEffect(() => {
    fetchStats();
    fetchMessages({ page: 1, pageSize: 5 });
  }, [fetchStats, fetchMessages]);

  const heatmapOption = useMemo(() => {
    if (!stats) return {};
    const data = activeTab === 'passRate' 
      ? stats.passRateByRegion 
      : activeTab === 'certCoverage' 
        ? stats.certCoverageByRegion 
        : stats.complaintHandleRate;

    const regions = data.map((d) => d.region);
    const values = data.map((d) => [d.region, 0, d.rate]);
    const maxRate = Math.max(...data.map((d) => d.rate));

    return {
      tooltip: {
        position: 'top',
        formatter: (params: any) => {
          const item = data.find((d) => d.region === params.name);
          return `${params.name}<br/>${
            activeTab === 'passRate' ? '合格率' : 
            activeTab === 'certCoverage' ? '认证覆盖率' : '投诉处理率'
          }: ${formatPercentage(params.value[2])}<br/>总数: ${item?.total || 0}`;
        },
      },
      grid: {
        left: '10%',
        right: '10%',
        top: '10%',
        bottom: '15%',
      },
      xAxis: {
        type: 'category',
        data: regions,
        axisLabel: {
          rotate: 45,
          fontSize: 12,
          color: '#6b7280',
        },
        axisLine: { lineStyle: { color: '#e5e7eb' } },
      },
      yAxis: {
        type: 'category',
        data: [''],
        axisLabel: { show: false },
        axisLine: { show: false },
        splitLine: { show: false },
      },
      visualMap: {
        min: 0,
        max: maxRate,
        calculable: true,
        orient: 'horizontal',
        left: 'center',
        bottom: '0%',
        inRange: {
          color: ['#fee2e2', '#fef3c7', '#dcfce7', '#bbf7d0', '#86efac'],
        },
        textStyle: { color: '#6b7280' },
      },
      series: [
        {
          name: activeTab === 'passRate' ? '合格率' : 
                activeTab === 'certCoverage' ? '认证覆盖率' : '投诉处理率',
          type: 'heatmap',
          data: values,
          label: {
            show: true,
            formatter: (params: any) => formatPercentage(params.value[2]),
            fontSize: 12,
            fontWeight: 'bold',
            color: '#1f2937',
          },
          itemStyle: {
            borderRadius: 8,
            borderWidth: 2,
            borderColor: '#fff',
          },
          emphasis: {
            itemStyle: {
              shadowBlur: 10,
              shadowColor: 'rgba(0, 0, 0, 0.2)',
            },
          },
        },
      ],
    };
  }, [stats, activeTab]);

  const lineChartOption = useMemo(() => {
    if (!stats) return {};
    return {
      tooltip: {
        trigger: 'axis',
        backgroundColor: 'rgba(255, 255, 255, 0.95)',
        borderColor: '#e5e7eb',
        borderWidth: 1,
        textStyle: { color: '#374151' },
      },
      legend: {
        data: ['追溯启用率', '认证通过率', '补贴发放(万元)'],
        top: 0,
        textStyle: { color: '#6b7280' },
      },
      grid: {
        left: '3%',
        right: '4%',
        bottom: '3%',
        top: '15%',
        containLabel: true,
      },
      xAxis: {
        type: 'category',
        boundaryGap: false,
        data: stats.monthlyData.map((d) => d.month),
        axisLabel: { color: '#6b7280' },
        axisLine: { lineStyle: { color: '#e5e7eb' } },
      },
      yAxis: [
        {
          type: 'value',
          name: '比率(%)',
          min: 0,
          max: 100,
          axisLabel: {
            formatter: '{value}%',
            color: '#6b7280',
          },
          splitLine: { lineStyle: { color: '#f3f4f6' } },
        },
        {
          type: 'value',
          name: '金额(万元)',
          min: 0,
          axisLabel: {
            formatter: '{value}',
            color: '#6b7280',
          },
          splitLine: { show: false },
        },
      ],
      series: [
        {
          name: '追溯启用率',
          type: 'line',
          smooth: true,
          data: stats.monthlyData.map((d) => d.traceEnableRate),
          itemStyle: { color: '#10b981' },
          areaStyle: {
            color: {
              type: 'linear',
              x: 0,
              y: 0,
              x2: 0,
              y2: 1,
              colorStops: [
                { offset: 0, color: 'rgba(16, 185, 129, 0.3)' },
                { offset: 1, color: 'rgba(16, 185, 129, 0.05)' },
              ],
            },
          },
        },
        {
          name: '认证通过率',
          type: 'line',
          smooth: true,
          data: stats.monthlyData.map((d) => d.certPassRate),
          itemStyle: { color: '#f59e0b' },
          areaStyle: {
            color: {
              type: 'linear',
              x: 0,
              y: 0,
              x2: 0,
              y2: 1,
              colorStops: [
                { offset: 0, color: 'rgba(245, 158, 11, 0.3)' },
                { offset: 1, color: 'rgba(245, 158, 11, 0.05)' },
              ],
            },
          },
        },
        {
          name: '补贴发放(万元)',
          type: 'line',
          smooth: true,
          yAxisIndex: 1,
          data: stats.monthlyData.map((d) => d.subsidyTotal / 10000),
          itemStyle: { color: '#6366f1' },
          areaStyle: {
            color: {
              type: 'linear',
              x: 0,
              y: 0,
              x2: 0,
              y2: 1,
              colorStops: [
                { offset: 0, color: 'rgba(99, 102, 241, 0.3)' },
                { offset: 1, color: 'rgba(99, 102, 241, 0.05)' },
              ],
            },
          },
        },
      ],
    };
  }, [stats]);

  const statCards = [
    {
      title: '平均合格率',
      value: stats ? formatPercentage(stats.passRateByRegion.reduce((acc, d) => acc + d.rate, 0) / stats.passRateByRegion.length) : '--',
      icon: CheckCircle,
      color: 'bg-green-500',
      bgColor: 'bg-green-50',
      trend: '+2.3%',
      trendUp: true,
    },
    {
      title: '认证覆盖率',
      value: stats ? formatPercentage(stats.certCoverageByRegion.reduce((acc, d) => acc + d.rate, 0) / stats.certCoverageByRegion.length) : '--',
      icon: ShieldCheck,
      color: 'bg-gold-500',
      bgColor: 'bg-gold-50',
      trend: '+5.1%',
      trendUp: true,
    },
    {
      title: '投诉处理率',
      value: stats ? formatPercentage(stats.complaintHandleRate.reduce((acc, d) => acc + d.rate, 0) / stats.complaintHandleRate.length) : '--',
      icon: Users,
      color: 'bg-blue-500',
      bgColor: 'bg-blue-50',
      trend: '-1.2%',
      trendUp: false,
    },
    {
      title: '预警数量',
      value: '12',
      icon: AlertTriangle,
      color: 'bg-danger-500',
      bgColor: 'bg-danger-50',
      trend: '+3',
      trendUp: false,
    },
  ];

  const warnings = [
    { id: 1, region: '东城区', type: '农药残留超标', level: 'high', time: '10分钟前' },
    { id: 2, region: '西城区', type: '认证即将过期', level: 'medium', time: '30分钟前' },
    { id: 3, region: '朝阳区', type: '投诉未及时处理', level: 'high', time: '1小时前' },
    { id: 4, region: '海淀区', type: '补贴异常', level: 'low', time: '2小时前' },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">监管工作台</h1>
          <p className="text-gray-500 mt-1">实时监控全市农产品质量安全状况</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="text-right">
            <p className="text-sm text-gray-500">待处理预警</p>
            <p className="text-2xl font-bold text-danger-600">{warnings.length}</p>
          </div>
          <div className="w-12 h-12 bg-danger-100 rounded-full flex items-center justify-center">
            <Bell className="w-6 h-6 text-danger-600" />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((card, index) => (
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
                <div className={`flex items-center gap-1 mt-2 text-sm ${card.trendUp ? 'text-green-600' : 'text-danger-600'}`}>
                  <TrendingUp className={`w-4 h-4 ${!card.trendUp ? 'rotate-180' : ''}`} />
                  <span>{card.trend}</span>
                  <span className="text-gray-500">较上月</span>
                </div>
              </div>
              <div className={`${card.color} w-12 h-12 rounded-xl flex items-center justify-center shadow-lg`}>
                <card.icon className="w-6 h-6 text-white" />
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.4 }}
          className="lg:col-span-2 bg-white rounded-2xl p-6 shadow-sm border border-gray-100"
        >
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-agri-100 rounded-xl flex items-center justify-center">
                <MapPin className="w-5 h-5 text-agri-600" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900">区域数据热力图</h3>
                <p className="text-sm text-gray-500">各区县指标分布情况</p>
              </div>
            </div>
            <div className="flex bg-gray-100 rounded-lg p-1">
              {[
                { key: 'passRate', label: '合格率' },
                { key: 'certCoverage', label: '认证覆盖率' },
                { key: 'complaintHandle', label: '投诉处理率' },
              ].map((tab) => (
                <button
                  key={tab.key}
                  onClick={() => setActiveTab(tab.key as any)}
                  className={`px-4 py-2 text-sm font-medium rounded-md transition-all ${
                    activeTab === tab.key
                      ? 'bg-white text-agri-600 shadow-sm'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>
          <div className="h-80">
            {loading ? (
              <div className="h-full flex items-center justify-center">
                <div className="animate-spin w-8 h-8 border-4 border-agri-500 border-t-transparent rounded-full" />
              </div>
            ) : (
              <ReactECharts option={heatmapOption} style={{ height: '100%' }} />
            )}
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.5 }}
          className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100"
        >
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 bg-danger-100 rounded-xl flex items-center justify-center">
              <AlertCircle className="w-5 h-5 text-danger-600" />
            </div>
            <div>
              <h3 className="font-semibold text-gray-900">预警提醒</h3>
              <p className="text-sm text-gray-500">需要及时处理的事项</p>
            </div>
          </div>
          <div className="space-y-3">
            {warnings.map((warning, index) => (
              <motion.div
                key={warning.id}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.6 + index * 0.1 }}
                className="flex items-start gap-3 p-3 rounded-xl bg-gray-50 hover:bg-gray-100 transition-colors cursor-pointer"
              >
                <div className={`w-2 h-2 rounded-full mt-2 flex-shrink-0 ${
                  warning.level === 'high' ? 'bg-danger-500' :
                  warning.level === 'medium' ? 'bg-yellow-500' : 'bg-blue-500'
                }`} />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <p className="font-medium text-gray-900 truncate">{warning.region}</p>
                    <span className="text-xs text-gray-500 flex-shrink-0">{warning.time}</span>
                  </div>
                  <p className="text-sm text-gray-600 truncate">{warning.type}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6 }}
        className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100"
      >
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center">
            <BarChart3 className="w-5 h-5 text-blue-600" />
          </div>
          <div>
            <h3 className="font-semibold text-gray-900">月度趋势分析</h3>
            <p className="text-sm text-gray-500">追溯、认证、补贴数据走势</p>
          </div>
        </div>
        <div className="h-80">
          {loading ? (
            <div className="h-full flex items-center justify-center">
              <div className="animate-spin w-8 h-8 border-4 border-agri-500 border-t-transparent rounded-full" />
            </div>
          ) : (
            <ReactECharts option={lineChartOption} style={{ height: '100%' }} />
          )}
        </div>
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7 }}
          className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100"
        >
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gold-100 rounded-xl flex items-center justify-center">
                <FileCheck className="w-5 h-5 text-gold-600" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900">待审核认证</h3>
                <p className="text-sm text-gray-500">需要您审批的认证申请</p>
              </div>
            </div>
            <span className="px-3 py-1 bg-gold-100 text-gold-700 rounded-full text-sm font-medium">
              8 项
            </span>
          </div>
          <div className="space-y-3">
            {[
              { farm: '绿源农场', type: '有机认证', applicant: '张三', days: 2 },
              { farm: '阳光合作社', type: '绿色认证', applicant: '李四', days: 1 },
              { farm: '田园种植基地', type: 'GAP认证', applicant: '王五', days: 3 },
            ].map((item, index) => (
              <div key={index} className="flex items-center justify-between p-4 rounded-xl bg-gray-50 hover:bg-gray-100 transition-colors">
                <div>
                  <p className="font-medium text-gray-900">{item.farm}</p>
                  <p className="text-sm text-gray-500 mt-1">
                    {item.type} · 申请人: {item.applicant}
                  </p>
                </div>
                <StatusBadge
                  status={item.days <= 1 ? 'warning' : 'pending'}
                  label={item.days <= 1 ? `仅剩${item.days}天` : `${item.days}天后到期`}
                />
              </div>
            ))}
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
              <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center">
                <Bell className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900">最新消息</h3>
                <p className="text-sm text-gray-500">系统通知和消息提醒</p>
              </div>
            </div>
            {unreadCount > 0 && (
              <span className="px-2 py-1 bg-danger-500 text-white rounded-full text-xs font-medium">
                {unreadCount} 条未读
              </span>
            )}
          </div>
          <div className="space-y-3">
            {messages.slice(0, 4).map((msg, index) => (
              <div key={msg.id} className="flex items-start gap-3 p-3 rounded-xl hover:bg-gray-50 transition-colors">
                <div className={`w-2 h-2 rounded-full mt-2 flex-shrink-0 ${msg.isRead ? 'bg-gray-300' : 'bg-agri-500'}`} />
                <div className="flex-1 min-w-0">
                  <p className={`font-medium truncate ${msg.isRead ? 'text-gray-600' : 'text-gray-900'}`}>
                    {msg.title}
                  </p>
                  <p className="text-sm text-gray-500 truncate">{msg.content}</p>
                  <p className="text-xs text-gray-400 mt-1">{formatDate(msg.createdAt)}</p>
                </div>
              </div>
            ))}
          </div>
        </motion.div>
      </div>
    </div>
  );
}
