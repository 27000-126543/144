import { create } from 'zustand';
import type { Message, PaginatedResponse, PaginationParams } from '../types';
import { api } from '../services/api';

interface MessageState {
  messages: Message[];
  unreadCount: number;
  total: number;
  page: number;
  pageSize: number;
  loading: boolean;
  error: string | null;
}

interface MessageActions {
  fetchMessages: (params?: { userId?: string; isRead?: boolean } & PaginationParams) => Promise<void>;
  markAsRead: (id: string) => Promise<void>;
  markAllAsRead: (userId: string) => Promise<void>;
  getUnreadCount: (userId: string) => Promise<number>;
  addMessage: (message: Message) => void;
  clearError: () => void;
}

export const useMessageStore = create<MessageState & MessageActions>((set, get) => ({
  messages: [],
  unreadCount: 0,
  total: 0,
  page: 1,
  pageSize: 10,
  loading: false,
  error: null,

  fetchMessages: async (params) => {
    set({ loading: true, error: null });
    try {
      const response: PaginatedResponse<Message> = await api.getMessages(params);
      set({
        messages: response.items,
        total: response.total,
        page: response.page,
        pageSize: response.pageSize,
        loading: false,
      });
    } catch (err) {
      set({
        error: err instanceof Error ? err.message : '获取消息列表失败',
        loading: false,
      });
      throw err;
    }
  },

  markAsRead: async (id) => {
    set({ loading: true, error: null });
    try {
      const updatedMessage = await api.markMessageAsRead(id);
      const { messages, unreadCount } = get();
      set({
        messages: messages.map((m) => (m.id === id ? updatedMessage : m)),
        unreadCount: Math.max(0, unreadCount - 1),
        loading: false,
      });
    } catch (err) {
      set({
        error: err instanceof Error ? err.message : '标记已读失败',
        loading: false,
      });
      throw err;
    }
  },

  markAllAsRead: async (userId) => {
    set({ loading: true, error: null });
    try {
      await api.markAllMessagesAsRead(userId);
      const { fetchMessages, getUnreadCount } = get();
      await fetchMessages({ userId, page: 1, pageSize: get().pageSize });
      await getUnreadCount(userId);
      set({ loading: false });
    } catch (err) {
      set({
        error: err instanceof Error ? err.message : '全部标记已读失败',
        loading: false,
      });
      throw err;
    }
  },

  getUnreadCount: async (userId) => {
    try {
      const count = await api.getUnreadMessageCount(userId);
      set({ unreadCount: count });
      return count;
    } catch (err) {
      set({
        error: err instanceof Error ? err.message : '获取未读数量失败',
      });
      throw err;
    }
  },

  addMessage: (message) => {
    const { messages, unreadCount } = get();
    set({
      messages: [message, ...messages],
      unreadCount: unreadCount + 1,
    });
  },

  clearError: () => set({ error: null }),
}));
