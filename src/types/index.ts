export type UserRole = 'farmer' | 'buyer' | 'inspector' | 'certifier' | 'regulator' | 'consumer';

export type Status = 'pending' | 'approved' | 'rejected' | 'processing';

export type BatchStatus = 'planted' | 'harvested' | 'purchased' | 'precheck_pass' | 'precheck_warning' | 
                   'precheck_fail' | 'inspecting' | 'qualified' | 'unqualified' | 'locked' | 'certified';

export type CertType = 'organic' | 'green' | 'gap';

export type ComplaintType = 'quality' | 'pesticide' | 'fake' | 'other';

export type InspectResult = 'qualified' | 'unqualified' | 'pending';

export type MessageType = 'inspection_result' | 'certification' | 'complaint' | 'subsidy' | 
                   'warning' | 'system' | 'batch_status';

export interface PaginationParams {
  page: number;
  pageSize: number;
}

export interface ApiResponse<T> {
  code: number;
  message: string;
  data: T;
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
}

export interface User {
  id: string;
  role: UserRole;
  username: string;
  name: string;
  phone: string;
  idCard?: string;
  avatar?: string;
  region?: string;
  status: 'active' | 'inactive';
  createdAt: string;
  verified: boolean;
}

export interface LoginRequest {
  username: string;
  password: string;
  role: UserRole;
}

export interface LoginResponse {
  token: string;
  user: User;
}

export interface Plot {
  id: string;
  farmerId: string;
  name: string;
  area: number;
  location: {
    province: string;
    city: string;
    district: string;
    address: string;
    gps: { lat: number; lng: number };
  };
  soilType: string;
  createdAt: string;
}

export interface PlantingInfo {
  id: string;
  farmerId: string;
  plotId: string;
  cropType: string;
  cropVariety: string;
  area: number;
  plantDate: string;
  expectedHarvestDate: string;
  expectedYield: number;
  actualYield?: number;
  status: 'planting' | 'growing' | 'ready' | 'harvested';
  traceCodeId?: string;
  createdAt: string;
}

export interface PesticideRecord {
  id: string;
  plantingId: string;
  farmerId: string;
  pesticideName: string;
  pesticideType: string;
  useDate: string;
  dosage: number;
  safeInterval: number;
  operator: string;
  createdAt: string;
}

export interface TraceCode {
  id: string;
  code: string;
  plantingId: string;
  farmerId: string;
  plotId: string;
  qrCodeUrl: string;
  status: 'active' | 'used' | 'expired';
  createdAt: string;
  activatedAt?: string;
}

export interface SubsidyApplication {
  id: string;
  farmerId: string;
  plantingId: string;
  area: number;
  yieldAmount: number;
  calculatedAmount: number;
  actualAmount?: number;
  status: 'draft' | 'submitted' | 'reviewing' | 'approved' | 'rejected' | 'paid';
  applicationDate: string;
  approvalDate?: string;
  paymentDate?: string;
  remark?: string;
  createdAt: string;
}

export interface PrecheckDetail {
  item: string;
  value: number;
  standard: number;
  unit: string;
  result: string;
}

export interface Batch {
  id: string;
  batchNo: string;
  traceCodeId: string;
  buyerId: string;
  farmerId: string;
  plantingId: string;
  quantity: number;
  unitPrice: number;
  totalAmount: number;
  purchaseDate: string;
  precheckStatus: 'pass' | 'warning' | 'fail' | 'pending';
  precheckDetails?: {
    pesticideResidue: PrecheckDetail[];
    overall: string;
  };
  status: BatchStatus;
  inspectionId?: string;
  certificateId?: string;
  createdAt: string;
}

export interface InspectionTask {
  id: string;
  taskNo: string;
  batchId: string;
  inspectorId: string;
  regulatorId: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  status: 'pending' | 'assigned' | 'inspecting' | 'completed' | 'cancelled';
  sampleDate?: string;
  reportDate?: string;
  assignedAt: string;
  createdAt: string;
}

export interface InspectionItem {
  name: string;
  value: number;
  standard: number;
  unit: string;
  result: 'qualified' | 'unqualified';
}

export interface InspectionReport {
  id: string;
  reportNo: string;
  taskId: string;
  batchId: string;
  inspectorId: string;
  items: InspectionItem[];
  overallResult: InspectResult;
  reportUrl: string;
  inspectorName: string;
  reportDate: string;
  createdAt: string;
}

export interface CertificationMaterial {
  name: string;
  url: string;
}

export interface CertificationApplication {
  id: string;
  applicationNo: string;
  certType: CertType;
  batchId: string;
  applicantId: string;
  certifierId?: string;
  materials: CertificationMaterial[];
  status: 'draft' | 'submitted' | 'reviewing' | 'site_check' | 'approved' | 'rejected';
  reviewNotes?: string;
  certificateId?: string;
  submittedAt: string;
  reviewedAt?: string;
  createdAt: string;
}

export interface Certificate {
  id: string;
  certNo: string;
  certType: CertType;
  applicationId: string;
  batchId: string;
  holderName: string;
  productName: string;
  issueDate: string;
  validUntil: string;
  qrCodeUrl: string;
  certUrl: string;
  status: 'valid' | 'expired' | 'revoked';
  createdAt: string;
}

export interface ProcessingLog {
  operator: string;
  action: string;
  remark: string;
  timestamp: string;
}

export interface Complaint {
  id: string;
  complaintNo: string;
  traceCode: string;
  consumerId?: string;
  consumerName: string;
  consumerPhone: string;
  type: ComplaintType;
  description: string;
  images: string[];
  region: string;
  regulatorId?: string;
  status: 'pending' | 'assigned' | 'processing' | 'resolved' | 'confirmed' | 'closed';
  processingLogs: ProcessingLog[];
  resolution?: string;
  createdAt: string;
  assignedAt?: string;
  resolvedAt?: string;
  confirmedAt?: string;
}

export interface PesticideThreshold {
  id: string;
  pesticideName: string;
  cropType: string;
  maxLimit: number;
  unit: string;
  standard: string;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

export interface RegionStat {
  region: string;
  rate: number;
  total: number;
  pass?: number;
  certified?: number;
  handled?: number;
}

export interface MonthlyData {
  month: string;
  traceEnableRate: number;
  certPassRate: number;
  subsidyTotal: number;
}

export interface RegulatorStats {
  passRateByRegion: RegionStat[];
  certCoverageByRegion: RegionStat[];
  complaintHandleRate: RegionStat[];
  monthlyData: MonthlyData[];
}

export interface TimelineItem {
  stage: string;
  title: string;
  description: string;
  timestamp: string;
  status: string;
}

export interface TraceInfo {
  traceCode: string;
  batch: Batch;
  planting: PlantingInfo;
  plot: Plot;
  farmer: User;
  pesticideRecords: PesticideRecord[];
  inspectionReport?: InspectionReport;
  certificate?: Certificate;
  timeline: TimelineItem[];
}

export interface Message {
  id: string;
  userId: string;
  userRole: UserRole;
  type: MessageType;
  title: string;
  content: string;
  relatedId?: string;
  relatedType?: string;
  attachmentUrl?: string;
  attachmentName?: string;
  isRead: boolean;
  createdAt: string;
  readAt?: string;
}

export const roleLabels: Record<UserRole, string> = {
  farmer: '农户',
  buyer: '收购商',
  inspector: '检测机构',
  certifier: '认证机构',
  regulator: '政府监管员',
  consumer: '消费者',
};

export const statusColors: Record<string, string> = {
  pending: 'bg-yellow-100 text-yellow-800',
  approved: 'bg-green-100 text-green-800',
  rejected: 'bg-red-100 text-red-800',
  processing: 'bg-blue-100 text-blue-800',
  qualified: 'bg-green-100 text-green-800',
  unqualified: 'bg-red-100 text-red-800',
  pass: 'bg-green-100 text-green-800',
  warning: 'bg-yellow-100 text-yellow-800',
  fail: 'bg-red-100 text-red-800',
  locked: 'bg-gray-100 text-gray-800',
  certified: 'bg-amber-100 text-amber-800',
};

export const certTypeLabels: Record<CertType, string> = {
  organic: '有机认证',
  green: '绿色认证',
  gap: 'GAP认证',
};

export const complaintTypeLabels: Record<ComplaintType, string> = {
  quality: '质量问题',
  pesticide: '农药残留',
  fake: '假冒伪劣',
  other: '其他问题',
};

export const batchStatusLabels: Record<BatchStatus, string> = {
  planted: '已种植',
  harvested: '已采收',
  purchased: '已收购',
  precheck_pass: '预检通过',
  precheck_warning: '预检预警',
  precheck_fail: '预检不合格',
  inspecting: '检测中',
  qualified: '检测合格',
  unqualified: '检测不合格',
  locked: '已锁定',
  certified: '已认证',
};

export const priorityLabels: Record<string, string> = {
  low: '低',
  medium: '中',
  high: '高',
  urgent: '紧急',
};

export const priorityColors: Record<string, string> = {
  low: 'bg-gray-100 text-gray-800',
  medium: 'bg-blue-100 text-blue-800',
  high: 'bg-orange-100 text-orange-800',
  urgent: 'bg-red-100 text-red-800',
};

export const complaintStatusLabels: Record<string, string> = {
  pending: '待分派',
  assigned: '已分派',
  processing: '处理中',
  resolved: '已处理',
  confirmed: '已确认',
  closed: '已关闭',
};

export const subsidyStatusLabels: Record<string, string> = {
  draft: '草稿',
  submitted: '已提交',
  reviewing: '审核中',
  approved: '已通过',
  rejected: '已驳回',
  paid: '已打款',
};
