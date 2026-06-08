import { create } from 'zustand';
import type { Batch, BatchStatus, PaginatedResponse, PaginationParams } from '../types';
import { api } from '../services/api';

interface BatchState {
  batches: Batch[];
  currentBatch: Batch | null;
  total: number;
  page: number;
  pageSize: number;
  loading: boolean;
  error: string | null;
}

interface BatchActions {
  fetchBatches: (params?: { buyerId?: string; farmerId?: string; status?: BatchStatus } & PaginationParams) => Promise<void>;
  getBatchById: (id: string) => Promise<Batch | null>;
  scanBatch: (data: { traceCode: string; buyerId: string }) => Promise<Batch>;
  updateBatchStatus: (id: string, status: BatchStatus) => Promise<void>;
  setCurrentBatch: (batch: Batch | null) => void;
  clearError: () => void;
}

export const useBatchStore = create<BatchState & BatchActions>((set, get) => ({
  batches: [],
  currentBatch: null,
  total: 0,
  page: 1,
  pageSize: 10,
  loading: false,
  error: null,

  fetchBatches: async (params) => {
    set({ loading: true, error: null });
    try {
      const response: PaginatedResponse<Batch> = await api.getBatches(params);
      set({
        batches: response.items,
        total: response.total,
        page: response.page,
        pageSize: response.pageSize,
        loading: false,
      });
    } catch (err) {
      set({
        error: err instanceof Error ? err.message : '获取批次列表失败',
        loading: false,
      });
      throw err;
    }
  },

  getBatchById: async (id) => {
    set({ loading: true, error: null });
    try {
      const batch = await api.getBatchById(id);
      set({ currentBatch: batch, loading: false });
      return batch;
    } catch (err) {
      set({
        error: err instanceof Error ? err.message : '获取批次详情失败',
        loading: false,
      });
      throw err;
    }
  },

  scanBatch: async (data) => {
    set({ loading: true, error: null });
    try {
      const batch = await api.scanBatch(data);
      const { batches } = get();
      set({
        batches: [batch, ...batches],
        currentBatch: batch,
        loading: false,
      });
      return batch;
    } catch (err) {
      set({
        error: err instanceof Error ? err.message : '批次扫描失败',
        loading: false,
      });
      throw err;
    }
  },

  updateBatchStatus: async (id, status) => {
    set({ loading: true, error: null });
    try {
      const updatedBatch = await api.updateBatchStatus(id, status);
      const { batches, currentBatch } = get();
      set({
        batches: batches.map((b) => (b.id === id ? updatedBatch : b)),
        currentBatch: currentBatch?.id === id ? updatedBatch : currentBatch,
        loading: false,
      });
    } catch (err) {
      set({
        error: err instanceof Error ? err.message : '更新批次状态失败',
        loading: false,
      });
      throw err;
    }
  },

  setCurrentBatch: (batch) => set({ currentBatch: batch }),

  clearError: () => set({ error: null }),
}));
