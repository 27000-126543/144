import axios, { AxiosInstance, AxiosResponse, InternalAxiosRequestConfig } from 'axios';
import type {
  ApiResponse,
  PaginatedResponse,
  LoginRequest,
  LoginResponse,
  User,
  Plot,
  PlantingInfo,
  PesticideRecord,
  TraceCode,
  Batch,
  BatchStatus,
  InspectionTask,
  InspectionReport,
  CertificationApplication,
  Certificate,
  Complaint,
  PesticideThreshold,
  Message,
  RegulatorStats,
  TraceInfo,
  SubsidyApplication,
  PaginationParams,
} from '../types';

const baseURL = '/api';

const axiosInstance: AxiosInstance = axios.create({
  baseURL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

axiosInstance.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const authData = localStorage.getItem('auth-storage');
    if (authData) {
      try {
        const parsed = JSON.parse(authData);
        if (parsed.state?.token) {
          config.headers.Authorization = parsed.state.token;
        }
      } catch {
        // ignore parse errors
      }
    }
    return config;
  },
  (error) => Promise.reject(error)
);

axiosInstance.interceptors.response.use(
  (response: AxiosResponse) => {
    const res = response.data as ApiResponse<unknown>;
    if (res.code === 200) {
      return res.data as never;
    }
    return Promise.reject(new Error(res.message || '请求失败'));
  },
  (error) => {
    const message = error.response?.data?.message || error.message || '网络错误';
    return Promise.reject(new Error(message));
  }
);

export const api = {
  login: (credentials: LoginRequest): Promise<LoginResponse> =>
    axiosInstance.post('/auth/login', credentials),

  getProfile: (): Promise<User> =>
    axiosInstance.get('/auth/profile'),

  updateProfile: (data: Partial<User>): Promise<User> =>
    axiosInstance.put('/auth/profile', data),

  getPlots: (params?: { farmerId?: string } & PaginationParams): Promise<PaginatedResponse<Plot>> =>
    axiosInstance.get('/plots', { params }),

  createPlot: (data: Partial<Plot>): Promise<Plot> =>
    axiosInstance.post('/plots', data),

  updatePlot: (id: string, data: Partial<Plot>): Promise<Plot> =>
    axiosInstance.put(`/plots/${id}`, data),

  getPlantings: (params?: { farmerId?: string; plotId?: string } & PaginationParams): Promise<PaginatedResponse<PlantingInfo>> =>
    axiosInstance.get('/plantings', { params }),

  createPlanting: (data: Partial<PlantingInfo>): Promise<PlantingInfo> =>
    axiosInstance.post('/plantings', data),

  updatePlanting: (id: string, data: Partial<PlantingInfo>): Promise<PlantingInfo> =>
    axiosInstance.put(`/plantings/${id}`, data),

  getPesticideRecords: (params?: { plantingId?: string } & PaginationParams): Promise<PaginatedResponse<PesticideRecord>> =>
    axiosInstance.get('/pesticides', { params }),

  createPesticideRecord: (data: Partial<PesticideRecord>): Promise<PesticideRecord> =>
    axiosInstance.post('/pesticides', data),

  updatePesticideRecord: (id: string, data: Partial<PesticideRecord>): Promise<PesticideRecord> =>
    axiosInstance.put(`/pesticides/${id}`, data),

  getTraceCodes: (params?: { farmerId?: string; plantingId?: string; status?: string } & PaginationParams): Promise<PaginatedResponse<TraceCode>> =>
    axiosInstance.get('/trace-codes', { params }),

  createTraceCode: (data: Partial<TraceCode>): Promise<TraceCode> =>
    axiosInstance.post('/trace-codes', data),

  updateTraceCode: (id: string, data: Partial<TraceCode>): Promise<TraceCode> =>
    axiosInstance.put(`/trace-codes/${id}`, data),

  getSubsidies: (params?: { farmerId?: string; status?: string } & PaginationParams): Promise<PaginatedResponse<SubsidyApplication>> =>
    axiosInstance.get('/subsidies', { params }),

  createSubsidy: (data: Partial<SubsidyApplication>): Promise<SubsidyApplication> =>
    axiosInstance.post('/subsidies', data),

  updateSubsidy: (id: string, data: Partial<SubsidyApplication>): Promise<SubsidyApplication> =>
    axiosInstance.put(`/subsidies/${id}`, data),

  scanPrecheck: (params: { traceCode: string; buyerId: string }): Promise<{
    traceCode: TraceCode;
    planting: PlantingInfo;
    farmer: User;
    plot: Plot;
    pesticideRecords: PesticideRecord[];
    precheckResult: 'pass' | 'warning' | 'fail';
    precheckDetails: {
      pesticideResidue: Array<{ item: string; value: number; standard: number; unit: string; result: string }>;
      overall: string;
    };
  }> =>
    axiosInstance.get('/batches/scan-precheck', { params }),

  confirmBatch: (data: { 
    traceCode: string; 
    buyerId: string;
    quantity: number;
    unitPrice: number;
    precheckStatus: 'pass' | 'warning' | 'fail';
    precheckDetails: any;
  }): Promise<Batch> =>
    axiosInstance.post('/batches/confirm', data),

  getBatches: (params?: { buyerId?: string; farmerId?: string; status?: BatchStatus } & PaginationParams): Promise<PaginatedResponse<Batch>> =>
    axiosInstance.get('/batches', { params }),

  getBatchById: (id: string): Promise<Batch> =>
    axiosInstance.get(`/batches/${id}`),

  updateBatchStatus: (id: string, status: BatchStatus): Promise<Batch> =>
    axiosInstance.put(`/batches/${id}/status`, { status }),

  getInspectionTasks: (params?: { inspectorId?: string; regulatorId?: string; status?: string } & PaginationParams): Promise<PaginatedResponse<InspectionTask>> =>
    axiosInstance.get('/inspection/tasks', { params }),

  createInspectionReport: (data: Partial<InspectionReport>): Promise<InspectionReport> =>
    axiosInstance.post('/inspection/reports', data),

  getCertificationApplications: (params?: { applicantId?: string; certifierId?: string; status?: string } & PaginationParams): Promise<PaginatedResponse<CertificationApplication>> =>
    axiosInstance.get('/certification/applications', { params }),

  updateCertificationApplication: (id: string, data: Partial<CertificationApplication>): Promise<CertificationApplication> =>
    axiosInstance.put(`/certification/applications/${id}`, data),

  getCertificates: (params?: { status?: string; certType?: string; certifierId?: string } & PaginationParams): Promise<PaginatedResponse<Certificate>> =>
    axiosInstance.get('/certificates', { params }),

  generateCertificate: (applicationId: string): Promise<Certificate> =>
    axiosInstance.post('/certificates/generate', { applicationId }),

  getRegulatorStats: (): Promise<RegulatorStats> =>
    axiosInstance.get('/regulator/stats/heatmap'),

  getThresholds: (params?: { cropType?: string } & PaginationParams): Promise<PaginatedResponse<PesticideThreshold>> =>
    axiosInstance.get('/regulator/thresholds', { params }),

  updateThreshold: (id: string, data: Partial<PesticideThreshold>): Promise<PesticideThreshold> =>
    axiosInstance.put(`/regulator/thresholds/${id}`, data),

  getComplaints: (params?: { regulatorId?: string; status?: string } & PaginationParams): Promise<PaginatedResponse<Complaint>> =>
    axiosInstance.get('/complaints', { params }),

  updateComplaint: (id: string, data: Partial<Complaint>): Promise<Complaint> =>
    axiosInstance.put(`/complaints/${id}`, data),

  createComplaint: (data: Partial<Complaint>): Promise<Complaint> =>
    axiosInstance.post('/consumer/complaints', data),

  getSubsidyApprovals: (params?: { status?: string } & PaginationParams): Promise<PaginatedResponse<SubsidyApplication>> =>
    axiosInstance.get('/regulator/subsidy-approvals', { params }),

  approveSubsidy: (id: string, data: { actualAmount: number; remark?: string }): Promise<SubsidyApplication> =>
    axiosInstance.put(`/subsidies/${id}/approve`, data),

  traceByCode: (code: string): Promise<TraceInfo> =>
    axiosInstance.get(`/consumer/trace/${code}`),

  getMessages: (params?: { userId?: string; isRead?: boolean } & PaginationParams): Promise<PaginatedResponse<Message>> =>
    axiosInstance.get('/messages', { params }),

  markMessageAsRead: (id: string): Promise<Message> =>
    axiosInstance.put(`/messages/${id}/read`),

  markAllMessagesAsRead: (userId: string): Promise<void> =>
    axiosInstance.put('/messages/read-all', { userId }),

  getUnreadMessageCount: (userId: string): Promise<number> =>
    axiosInstance.get('/messages/unread-count', { params: { userId } }),

  getRegulatorReports: (): Promise<{
    totalBatches: number;
    qualifiedBatches: number;
    unqualifiedBatches: number;
    totalComplaints: number;
    resolvedComplaints: number;
    totalCertificates: number;
    validCertificates: number;
    totalSubsidies: number;
  }> => axiosInstance.get('/regulator/reports'),
};
