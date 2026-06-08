import { format, parseISO, formatDistanceToNow, formatRelative } from 'date-fns';
import { zhCN } from 'date-fns/locale';

export function formatDate(date: string | Date, fmt: string = 'yyyy-MM-dd'): string {
  if (!date) return '-';
  const d = typeof date === 'string' ? parseISO(date) : date;
  return format(d, fmt, { locale: zhCN });
}

export function formatDateTime(date: string | Date): string {
  return formatDate(date, 'yyyy-MM-dd HH:mm:ss');
}

export function formatRelativeTime(date: string | Date): string {
  if (!date) return '-';
  const d = typeof date === 'string' ? parseISO(date) : date;
  return formatDistanceToNow(d, { addSuffix: true, locale: zhCN });
}

export function formatRelativeDate(date: string | Date): string {
  if (!date) return '-';
  const d = typeof date === 'string' ? parseISO(date) : date;
  return formatRelative(d, new Date(), { locale: zhCN });
}

export function formatNumber(num: number, decimals: number = 2): string {
  if (num === null || num === undefined) return '-';
  return num.toLocaleString('zh-CN', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });
}

export function formatInteger(num: number): string {
  if (num === null || num === undefined) return '-';
  return num.toLocaleString('zh-CN');
}

export function formatCurrency(amount: number, currency: string = 'CNY'): string {
  if (amount === null || amount === undefined) return '-';
  return amount.toLocaleString('zh-CN', {
    style: 'currency',
    currency,
    minimumFractionDigits: 2,
  });
}

export function formatPercentage(value: number, decimals: number = 2): string {
  if (value === null || value === undefined) return '-';
  return `${value.toFixed(decimals)}%`;
}

export function formatArea(area: number): string {
  if (area === null || area === undefined) return '-';
  return `${formatNumber(area)} 亩`;
}

export function formatWeight(weight: number, unit: string = 'kg'): string {
  if (weight === null || weight === undefined) return '-';
  if (weight >= 1000) {
    return `${formatNumber(weight / 1000)} 吨`;
  }
  return `${formatNumber(weight)} ${unit}`;
}

export function formatPhone(phone: string): string {
  if (!phone) return '-';
  return phone.replace(/(\d{3})(\d{4})(\d{4})/, '$1****$3');
}

export function formatIdCard(idCard: string): string {
  if (!idCard) return '-';
  if (idCard.length !== 18) return idCard;
  return `${idCard.slice(0, 6)}********${idCard.slice(-4)}`;
}

export function formatTraceCode(code: string, chunkSize: number = 4): string {
  if (!code) return '-';
  return code.match(new RegExp(`.{1,${chunkSize}}`, 'g'))?.join(' ') || code;
}

export function truncateText(text: string, maxLength: number = 50): string {
  if (!text) return '';
  if (text.length <= maxLength) return text;
  return `${text.slice(0, maxLength)}...`;
}

export function capitalizeFirstLetter(str: string): string {
  if (!str) return '';
  return str.charAt(0).toUpperCase() + str.slice(1);
}

export function formatStatus(status: string): string {
  const statusMap: Record<string, string> = {
    pending: '待处理',
    approved: '已通过',
    rejected: '已拒绝',
    processing: '处理中',
    qualified: '合格',
    unqualified: '不合格',
    pass: '通过',
    warning: '警告',
    fail: '不通过',
    locked: '已锁定',
    certified: '已认证',
    active: '有效',
    inactive: '无效',
    valid: '有效',
    expired: '已过期',
    revoked: '已撤销',
    low: '低优先级',
    medium: '中优先级',
    high: '高优先级',
    urgent: '紧急',
    assigned: '已分派',
    inspecting: '检测中',
    completed: '已完成',
    cancelled: '已取消',
    submitted: '已提交',
    reviewing: '审核中',
    site_check: '现场检查',
    draft: '草稿',
    paid: '已打款',
    normal: '正常',
    exceed: '超标',
  };
  return statusMap[status] || status;
}
