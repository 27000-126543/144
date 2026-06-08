import type { MessageType, User, Message } from '../types';
import { fakerZH_CN as faker } from '@faker-js/faker';

interface NotificationData {
  batchNo?: string;
  certType?: string;
  complaintNo?: string;
  subsidyAmount?: number;
  inspectorName?: string;
  result?: string;
}

const messageTemplates: Record<MessageType, (data: NotificationData, user: User) => { title: string; content: string }> = {
  inspection_result: (data, user) => ({
    title: '检测结果通知',
    content: `您好${user.name}，批次${data.batchNo || '未知'}的检测结果已出：${data.result || '未知'}。检测员：${data.inspectorName || '未知'}。`,
  }),
  certification: (data, user) => ({
    title: '认证状态更新',
    content: `您好${user.name}，您申请的${data.certType || '认证'}已${data.result || '处理完成'}。请登录查看详情。`,
  }),
  complaint: (data, user) => ({
    title: '投诉处理进展',
    content: `您好${user.name}，投诉编号${data.complaintNo || '未知'}的处理状态已更新：${data.result || '处理中'}。`,
  }),
  subsidy: (data, user) => ({
    title: '补贴审批通知',
    content: `您好${user.name}，您的补贴申请已${data.result || '审批完成'}，审批金额：${data.subsidyAmount || 0}元。`,
  }),
  warning: (data, user) => ({
    title: '预警提醒',
    content: `您好${user.name}，批次${data.batchNo || '未知'}存在风险预警：${data.result || '请及时处理'}。`,
  }),
  system: (data, user) => ({
    title: '系统通知',
    content: `您好${user.name}，${data.result || '系统有新的更新'}，请留意。`,
  }),
  batch_status: (data, user) => ({
    title: '批次状态更新',
    content: `您好${user.name}，批次${data.batchNo || '未知'}的状态已更新为：${data.result || '未知'}。`,
  }),
};

export function generateMessage(
  type: MessageType,
  userId: string,
  userRole: User['role'],
  data: NotificationData,
  user: User,
  relatedId?: string,
  relatedType?: string
): Omit<Message, 'id' | 'createdAt' | 'readAt'> {
  const template = messageTemplates[type](data, user);
  return {
    userId,
    userRole,
    type,
    title: template.title,
    content: template.content,
    relatedId,
    relatedType,
    isRead: false,
  };
}

export function createMockMessage(
  type: MessageType,
  user: User,
  data: NotificationData = {}
): Message {
  const template = messageTemplates[type](data, user);
  return {
    id: faker.string.uuid(),
    userId: user.id,
    userRole: user.role,
    type,
    title: template.title,
    content: template.content,
    relatedId: faker.string.uuid(),
    relatedType: type,
    isRead: faker.datatype.boolean({ probability: 0.3 }),
    createdAt: faker.date.recent({ days: 7 }).toISOString(),
    readAt: undefined,
  };
}

export function getMessageTypeLabel(type: MessageType): string {
  const labels: Record<MessageType, string> = {
    inspection_result: '检测结果',
    certification: '认证通知',
    complaint: '投诉进展',
    subsidy: '补贴通知',
    warning: '预警提醒',
    system: '系统通知',
    batch_status: '批次更新',
  };
  return labels[type];
}

export function getMessageTypeIcon(type: MessageType): string {
  const icons: Record<MessageType, string> = {
    inspection_result: 'clipboard-check',
    certification: 'award',
    complaint: 'message-square-warning',
    subsidy: 'banknote',
    warning: 'alert-triangle',
    system: 'bell',
    batch_status: 'package',
  };
  return icons[type];
}
