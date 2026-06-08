import { create } from 'zustand';
import type {
  RegulatorStats,
  PesticideThreshold,
  Complaint,
  SubsidyApplication,
  PaginatedResponse,
  PaginationParams,
} from '../types';
import { api } from '../services/api';

interface RegulatorState {
  stats: RegulatorStats | null;
  thresholds: PesticideThreshold[];
  complaints: Complaint[];
  subsidyApprovals: SubsidyApplication[];
  totalThresholds: number;
  totalComplaints: number;
  totalSubsidyApprovals: number;
  page: number;
  pageSize: number;
  loading: boolean;
  error: string | null;
}

interface RegulatorActions {
  fetchStats: () => Promise<void>;
  fetchThresholds: (params?: { cropType?: string } & PaginationParams) => Promise<void>;
  updateThreshold: (id: string, data: Partial<PesticideThreshold>) => Promise<void>;
  fetchComplaints: (params?: { regulatorId?: string; status?: string } & PaginationParams) => Promise<void>;
  updateComplaint: (id: string, data: Partial<Complaint>) => Promise<void>;
  fetchSubsidyApprovals: (params?: { status?: string } & PaginationParams) => Promise<void>;
  approveSubsidy: (id: string, data: { actualAmount: number; remark?: string }) => Promise<void>;
  clearError: () => void;
}

export const useRegulatorStore = create<RegulatorState & RegulatorActions>((set, get) => ({
  stats: null,
  thresholds: [],
  complaints: [],
  subsidyApprovals: [],
  totalThresholds: 0,
  totalComplaints: 0,
  totalSubsidyApprovals: 0,
  page: 1,
  pageSize: 10,
  loading: false,
  error: null,

  fetchStats: async () => {
    set({ loading: true, error: null });
    try {
      const stats = await api.getRegulatorStats();
      set({ stats, loading: false });
    } catch (err) {
      set({
        error: err instanceof Error ? err.message : '获取统计数据失败',
        loading: false,
      });
      throw err;
    }
  },

  fetchThresholds: async (params) => {
    set({ loading: true, error: null });
    try {
      const response: PaginatedResponse<PesticideThreshold> = await api.getThresholds(params);
      set({
        thresholds: response.items,
        totalThresholds: response.total,
        page: response.page,
        pageSize: response.pageSize,
        loading: false,
      });
    } catch (err) {
      set({
        error: err instanceof Error ? err.message : '获取阈值设置失败',
        loading: false,
      });
      throw err;
    }
  },

  updateThreshold: async (id, data) => {
    set({ loading: true, error: null });
    try {
      const updated = await api.updateThreshold(id, data);
      const { thresholds } = get();
      set({
        thresholds: thresholds.map((t) => (t.id === id ? updated : t)),
        loading: false,
      });
    } catch (err) {
      set({
        error: err instanceof Error ? err.message : '更新阈值失败',
        loading: false,
      });
      throw err;
    }
  },

  fetchComplaints: async (params) => {
    set({ loading: true, error: null });
    try {
      const response: PaginatedResponse<Complaint> = await api.getComplaints(params);
      set({
        complaints: response.items,
        totalComplaints: response.total,
        page: response.page,
        pageSize: response.pageSize,
        loading: false,
      });
    } catch (err) {
      set({
        error: err instanceof Error ? err.message : '获取投诉列表失败',
        loading: false,
      });
      throw err;
    }
  },

  updateComplaint: async (id, data) => {
    set({ loading: true, error: null });
    try {
      const updated = await api.updateComplaint(id, data);
      const { complaints } = get();
      set({
        complaints: complaints.map((c) => (c.id === id ? updated : c)),
        loading: false,
      });
    } catch (err) {
      set({
        error: err instanceof Error ? err.message : '更新投诉失败',
        loading: false,
      });
      throw err;
    }
  },

  fetchSubsidyApprovals: async (params) => {
    set({ loading: true, error: null });
    try {
      const response: PaginatedResponse<SubsidyApplication> = await api.getSubsidyApprovals(params);
      set({
        subsidyApprovals: response.items,
        totalSubsidyApprovals: response.total,
        page: response.page,
        pageSize: response.pageSize,
        loading: false,
      });
    } catch (err) {
      set({
        error: err instanceof Error ? err.message : '获取补贴审批列表失败',
        loading: false,
      });
      throw err;
    }
  },

  approveSubsidy: async (id, data) => {
    set({ loading: true, error: null });
    try {
      const updated = await api.approveSubsidy(id, data);
      const { subsidyApprovals } = get();
      set({
        subsidyApprovals: subsidyApprovals.map((s) => (s.id === id ? updated : s)),
        loading: false,
      });
    } catch (err) {
      set({
        error: err instanceof Error ? err.message : '审批补贴失败',
        loading: false,
      });
      throw err;
    }
  },

  clearError: () => set({ error: null }),
}));
