import { http, HttpResponse } from 'msw';
import { fakerZH_CN as faker } from '@faker-js/faker';
import type {
  ApiResponse,
  PaginatedResponse,
  LoginRequest,
  LoginResponse,
  User,
  Plot,
  PlantingInfo,
  TraceCode,
  PesticideRecord,
  Batch,
  InspectionTask,
  InspectionReport,
  CertificationApplication,
  Certificate,
  Complaint,
  PesticideThreshold,
  Message,
  RegulatorStats,
  TraceInfo,
  TimelineItem,
  SubsidyApplication,
} from '../types';
import {
  users,
  plots,
  plantings,
  traceCodes,
  pesticideRecords,
  subsidies,
  batches,
  inspectionTasks,
  inspectionReports,
  certificationApplications,
  certificates,
  complaints,
  thresholds,
  messages,
  monthlyData,
  regionStats,
} from './data';

faker.seed(12345);

let currentUser: User | null = null;
let localPlots = [...plots];
let localPlantings = [...plantings];
let localPesticideRecords = [...pesticideRecords];
let localTraceCodes = [...traceCodes];
let localSubsidies = [...subsidies];
let localBatches = [...batches];
let localInspectionTasks = [...inspectionTasks];
let localInspectionReports = [...inspectionReports];
let localCertificationApplications = [...certificationApplications];
let localCertificates = [...certificates];
let localComplaints = [...complaints];
let localThresholds = [...thresholds];
let localMessages = [...messages];

const successResponse = <T>(data: T, message = 'success'): HttpResponse<ApiResponse<T>> => {
  return HttpResponse.json({
    code: 200,
    message,
    data,
  });
};

const errorResponse = (code: number, message: string): HttpResponse<ApiResponse<null>> => {
  return HttpResponse.json({
    code,
    message,
    data: null,
  });
};

const paginate = <T>(items: T[], page: number, pageSize: number): PaginatedResponse<T> => {
  const start = (page - 1) * pageSize;
  const end = start + pageSize;
  return {
    items: items.slice(start, end),
    total: items.length,
    page,
    pageSize,
  };
};

const generateId = () => faker.string.uuid();

export const handlers = [
  http.post('/api/auth/login', async ({ request }) => {
    const body = (await request.json()) as LoginRequest;
    const { username, password, role } = body;

    const user = users.find(
      (u) => u.username === username && u.role === role && u.status === 'active'
    );

    if (!user || password !== '123456') {
      return errorResponse(401, '用户名或密码错误');
    }

    currentUser = user;
    const token = `Bearer ${faker.string.alphanumeric(100)}`;

    return successResponse<LoginResponse>(
      {
        token,
        user,
      },
      '登录成功'
    );
  }),

  http.get('/api/auth/profile', () => {
    if (!currentUser) {
      return errorResponse(401, '未登录');
    }
    return successResponse<User>(currentUser);
  }),

  http.get('/api/plots', ({ request }) => {
    const url = new URL(request.url);
    const page = parseInt(url.searchParams.get('page') || '1');
    const pageSize = parseInt(url.searchParams.get('pageSize') || '10');
    const farmerId = url.searchParams.get('farmerId');

    let filteredPlots = localPlots;
    if (farmerId) {
      filteredPlots = localPlots.filter((p) => p.farmerId === farmerId);
    }

    return successResponse<PaginatedResponse<Plot>>(paginate(filteredPlots, page, pageSize));
  }),

  http.post('/api/plots', async ({ request }) => {
    const body = (await request.json()) as Partial<Plot>;
    const newPlot: Plot = {
      id: generateId(),
      farmerId: body.farmerId || currentUser?.id || users.find((u) => u.role === 'farmer')!.id,
      name: body.name || '',
      area: body.area || 0,
      location: body.location || {
        province: '',
        city: '',
        district: '',
        address: '',
        gps: { lat: 0, lng: 0 },
      },
      soilType: body.soilType || '',
      createdAt: new Date().toISOString(),
    };
    localPlots.unshift(newPlot);
    return successResponse<Plot>(newPlot, '地块创建成功');
  }),

  http.put('/api/plots/:id', async ({ request, params }) => {
    const { id } = params;
    const body = (await request.json()) as Partial<Plot>;
    const index = localPlots.findIndex((p) => p.id === id);
    if (index === -1) {
      return errorResponse(404, '地块不存在');
    }
    localPlots[index] = { ...localPlots[index], ...body };
    return successResponse<Plot>(localPlots[index], '地块更新成功');
  }),

  http.get('/api/plantings', ({ request }) => {
    const url = new URL(request.url);
    const page = parseInt(url.searchParams.get('page') || '1');
    const pageSize = parseInt(url.searchParams.get('pageSize') || '10');
    const farmerId = url.searchParams.get('farmerId');
    const plotId = url.searchParams.get('plotId');

    let filtered = localPlantings;
    if (farmerId) {
      filtered = filtered.filter((p) => p.farmerId === farmerId);
    }
    if (plotId) {
      filtered = filtered.filter((p) => p.plotId === plotId);
    }

    return successResponse<PaginatedResponse<PlantingInfo>>(paginate(filtered, page, pageSize));
  }),

  http.post('/api/plantings', async ({ request }) => {
    const body = (await request.json()) as Partial<PlantingInfo>;
    const newPlanting: PlantingInfo = {
      id: generateId(),
      farmerId: body.farmerId || currentUser?.id || users.find((u) => u.role === 'farmer')!.id,
      plotId: body.plotId || localPlots[0].id,
      cropType: body.cropType || '',
      cropVariety: body.cropVariety || '',
      area: body.area || 0,
      plantDate: body.plantDate || new Date().toISOString(),
      expectedHarvestDate: body.expectedHarvestDate || new Date().toISOString(),
      expectedYield: body.expectedYield || 0,
      actualYield: body.actualYield,
      status: body.status || 'planting',
      createdAt: new Date().toISOString(),
    };
    localPlantings.unshift(newPlanting);
    return successResponse<PlantingInfo>(newPlanting, '种植信息创建成功');
  }),

  http.put('/api/plantings/:id', async ({ request, params }) => {
    const { id } = params;
    const body = (await request.json()) as Partial<PlantingInfo>;
    const index = localPlantings.findIndex((p) => p.id === id);
    if (index === -1) {
      return errorResponse(404, '种植信息不存在');
    }
    localPlantings[index] = { ...localPlantings[index], ...body };
    return successResponse<PlantingInfo>(localPlantings[index], '种植信息更新成功');
  }),

  http.get('/api/pesticides', ({ request }) => {
    const url = new URL(request.url);
    const page = parseInt(url.searchParams.get('page') || '1');
    const pageSize = parseInt(url.searchParams.get('pageSize') || '10');
    const plantingId = url.searchParams.get('plantingId');

    let filtered = localPesticideRecords;
    if (plantingId) {
      filtered = filtered.filter((p) => p.plantingId === plantingId);
    }

    return successResponse<PaginatedResponse<PesticideRecord>>(
      paginate(filtered, page, pageSize)
    );
  }),

  http.post('/api/pesticides', async ({ request }) => {
    const body = (await request.json()) as Partial<PesticideRecord>;
    const newRecord: PesticideRecord = {
      id: generateId(),
      plantingId: body.plantingId || localPlantings[0].id,
      farmerId: body.farmerId || currentUser?.id || users.find((u) => u.role === 'farmer')!.id,
      pesticideName: body.pesticideName || '',
      pesticideType: body.pesticideType || '',
      useDate: body.useDate || new Date().toISOString(),
      dosage: body.dosage || 0,
      safeInterval: body.safeInterval || 0,
      operator: body.operator || '',
      createdAt: new Date().toISOString(),
    };
    localPesticideRecords.unshift(newRecord);
    return successResponse<PesticideRecord>(newRecord, '用药记录创建成功');
  }),

  http.put('/api/pesticides/:id', async ({ request, params }) => {
    const { id } = params;
    const body = (await request.json()) as Partial<PesticideRecord>;
    const index = localPesticideRecords.findIndex((p) => p.id === id);
    if (index === -1) {
      return errorResponse(404, '用药记录不存在');
    }
    localPesticideRecords[index] = { ...localPesticideRecords[index], ...body };
    return successResponse<PesticideRecord>(localPesticideRecords[index], '用药记录更新成功');
  }),

  http.get('/api/trace-codes', ({ request }) => {
    const url = new URL(request.url);
    const page = parseInt(url.searchParams.get('page') || '1');
    const pageSize = parseInt(url.searchParams.get('pageSize') || '10');
    const farmerId = url.searchParams.get('farmerId');
    const plantingId = url.searchParams.get('plantingId');
    const status = url.searchParams.get('status');

    let filtered = localTraceCodes;
    if (farmerId) {
      filtered = filtered.filter((t) => t.farmerId === farmerId);
    }
    if (plantingId) {
      filtered = filtered.filter((t) => t.plantingId === plantingId);
    }
    if (status) {
      filtered = filtered.filter((t) => t.status === status);
    }

    return successResponse<PaginatedResponse<TraceCode>>(paginate(filtered, page, pageSize));
  }),

  http.post('/api/trace-codes', async ({ request }) => {
    const body = (await request.json()) as Partial<TraceCode>;
    const planting = localPlantings.find((p) => p.id === body.plantingId) || localPlantings[0];
    const newCode: TraceCode = {
      id: generateId(),
      code: `TRACE${faker.string.numeric(10)}`,
      plantingId: planting.id,
      farmerId: planting.farmerId,
      plotId: planting.plotId,
      qrCodeUrl: `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=TRACE${faker.string.numeric(10)}`,
      status: body.status || 'active',
      createdAt: new Date().toISOString(),
    };
    localTraceCodes.unshift(newCode);
    return successResponse<TraceCode>(newCode, '追溯码创建成功');
  }),

  http.put('/api/trace-codes/:id', async ({ request, params }) => {
    const { id } = params;
    const body = (await request.json()) as Partial<TraceCode>;
    const index = localTraceCodes.findIndex((t) => t.id === id);
    if (index === -1) {
      return errorResponse(404, '追溯码不存在');
    }
    localTraceCodes[index] = { ...localTraceCodes[index], ...body };
    return successResponse<TraceCode>(localTraceCodes[index], '追溯码更新成功');
  }),

  http.get('/api/subsidies', ({ request }) => {
    const url = new URL(request.url);
    const page = parseInt(url.searchParams.get('page') || '1');
    const pageSize = parseInt(url.searchParams.get('pageSize') || '10');
    const farmerId = url.searchParams.get('farmerId');
    const status = url.searchParams.get('status');

    let filtered = localSubsidies;
    if (farmerId) {
      filtered = filtered.filter((s) => s.farmerId === farmerId);
    }
    if (status) {
      filtered = filtered.filter((s) => s.status === status);
    }

    return successResponse<PaginatedResponse<SubsidyApplication>>(
      paginate(filtered, page, pageSize)
    );
  }),

  http.post('/api/subsidies', async ({ request }) => {
    const body = (await request.json()) as Partial<SubsidyApplication>;
    const planting = localPlantings.find((p) => p.id === body.plantingId) || localPlantings[0];
    const newSubsidy: SubsidyApplication = {
      id: generateId(),
      farmerId: body.farmerId || currentUser?.id || planting.farmerId,
      plantingId: planting.id,
      area: planting.area,
      yieldAmount: planting.actualYield || planting.expectedYield,
      calculatedAmount: parseFloat((planting.area * 150 + (planting.actualYield || planting.expectedYield) * 0.5).toFixed(2)),
      status: body.status || 'submitted',
      applicationDate: new Date().toISOString(),
      createdAt: new Date().toISOString(),
    };
    localSubsidies.unshift(newSubsidy);
    return successResponse<SubsidyApplication>(newSubsidy, '补贴申请提交成功');
  }),

  http.put('/api/subsidies/:id', async ({ request, params }) => {
    const { id } = params;
    const body = (await request.json()) as Partial<SubsidyApplication>;
    const index = localSubsidies.findIndex((s) => s.id === id);
    if (index === -1) {
      return errorResponse(404, '补贴申请不存在');
    }
    localSubsidies[index] = { ...localSubsidies[index], ...body };
    return successResponse<SubsidyApplication>(localSubsidies[index], '补贴申请更新成功');
  }),

  http.get('/api/batches/scan-precheck', ({ request }) => {
    const url = new URL(request.url);
    const traceCode = url.searchParams.get('traceCode');
    const buyerId = url.searchParams.get('buyerId');

    if (!traceCode || !buyerId) {
      return errorResponse(400, '参数不完整');
    }

    const traceCodeRecord = localTraceCodes.find((t) => t.code === traceCode);
    if (!traceCodeRecord) {
      return errorResponse(404, '追溯码不存在');
    }

    if (traceCodeRecord.status === 'used') {
      return errorResponse(400, '该追溯码已被使用');
    }

    const planting = localPlantings.find((p) => p.id === traceCodeRecord.plantingId)!;
    const farmer = users.find((u) => u.id === traceCodeRecord.farmerId)!;
    const plot = localPlots.find((p) => p.id === traceCodeRecord.plotId)!;

    const pesticides = [
      { item: '敌敌畏', value: parseFloat((Math.random() * 0.5).toFixed(3)), standard: 0.5, unit: 'mg/kg' },
      { item: '乐果', value: parseFloat((Math.random() * 0.02).toFixed(3)), standard: 0.02, unit: 'mg/kg' },
      { item: '毒死蜱', value: parseFloat((Math.random() * 2).toFixed(3)), standard: 2, unit: 'mg/kg' },
    ];

    let precheckStatus: 'pass' | 'warning' | 'fail' = 'pass';
    
    const pesticideResidue = pesticides.map(p => {
      const ratio = p.value / p.standard;
      let result: string = 'normal';
      if (ratio >= 1) {
        result = 'exceed';
        precheckStatus = 'fail';
      } else if (ratio >= 0.7) {
        result = 'warning';
        if (precheckStatus !== 'fail') precheckStatus = 'warning';
      }
      return { ...p, result };
    });

    return successResponse({
      traceCode: traceCodeRecord,
      planting,
      farmer,
      plot,
      pesticideRecords: localPesticideRecords.filter(p => p.plantingId === planting.id),
      precheckResult: precheckStatus,
      precheckDetails: {
        pesticideResidue,
        overall: precheckStatus === 'pass' ? '合格' : precheckStatus === 'warning' ? '存在风险' : '不合格',
      },
    }, '预检完成');
  }),

  http.post('/api/batches/confirm', async ({ request }) => {
    const body = (await request.json()) as { 
      traceCode: string; 
      buyerId: string;
      quantity: number;
      unitPrice: number;
      precheckStatus: 'pass' | 'warning' | 'fail';
      precheckDetails: any;
    };
    const { traceCode, buyerId, quantity, unitPrice, precheckStatus, precheckDetails } = body;

    const traceCodeRecord = localTraceCodes.find((t) => t.code === traceCode);
    if (!traceCodeRecord) {
      return errorResponse(404, '追溯码不存在');
    }

    if (traceCodeRecord.status === 'used') {
      return errorResponse(400, '该追溯码已被使用');
    }

    const newBatch: Batch = {
      id: generateId(),
      batchNo: `BATCH${new Date().getFullYear()}${faker.string.numeric(8)}`,
      traceCodeId: traceCodeRecord.id,
      buyerId,
      farmerId: traceCodeRecord.farmerId,
      plantingId: traceCodeRecord.plantingId,
      quantity,
      unitPrice,
      totalAmount: parseFloat((quantity * unitPrice).toFixed(2)),
      purchaseDate: new Date().toISOString(),
      precheckStatus,
      precheckDetails,
      status: precheckStatus === 'fail' ? 'precheck_fail' : precheckStatus === 'warning' ? 'precheck_warning' : 'precheck_pass',
      createdAt: new Date().toISOString(),
    };

    traceCodeRecord.status = 'used';
    localBatches.unshift(newBatch);

    return successResponse<Batch>(newBatch, '收购确认成功');
  }),

  http.get('/api/batches', ({ request }) => {
    const url = new URL(request.url);
    const page = parseInt(url.searchParams.get('page') || '1');
    const pageSize = parseInt(url.searchParams.get('pageSize') || '10');
    const buyerId = url.searchParams.get('buyerId');
    const farmerId = url.searchParams.get('farmerId');
    const status = url.searchParams.get('status');

    let filtered = localBatches;
    if (buyerId) {
      filtered = filtered.filter((b) => b.buyerId === buyerId);
    }
    if (farmerId) {
      filtered = filtered.filter((b) => b.farmerId === farmerId);
    }
    if (status) {
      filtered = filtered.filter((b) => b.status === status);
    }

    return successResponse<PaginatedResponse<Batch>>(paginate(filtered, page, pageSize));
  }),

  http.get('/api/inspection/tasks', ({ request }) => {
    const url = new URL(request.url);
    const page = parseInt(url.searchParams.get('page') || '1');
    const pageSize = parseInt(url.searchParams.get('pageSize') || '10');
    const inspectorId = url.searchParams.get('inspectorId');
    const regulatorId = url.searchParams.get('regulatorId');
    const status = url.searchParams.get('status');

    let filtered = localInspectionTasks;
    if (inspectorId) {
      filtered = filtered.filter((t) => t.inspectorId === inspectorId);
    }
    if (regulatorId) {
      filtered = filtered.filter((t) => t.regulatorId === regulatorId);
    }
    if (status) {
      filtered = filtered.filter((t) => t.status === status);
    }

    return successResponse<PaginatedResponse<InspectionTask>>(paginate(filtered, page, pageSize));
  }),

  http.post('/api/inspection/reports', async ({ request }) => {
    const body = (await request.json()) as Partial<InspectionReport>;
    const task = localInspectionTasks.find((t) => t.id === body.taskId) || localInspectionTasks[0];
    const inspector = users.find((u) => u.id === body.inspectorId) || users.find((u) => u.role === 'inspector')!;

    const newReport: InspectionReport = {
      id: generateId(),
      reportNo: `REPORT${new Date().getFullYear()}${faker.string.numeric(8)}`,
      taskId: task.id,
      batchId: task.batchId,
      inspectorId: inspector.id,
      items: body.items || [],
      overallResult: body.overallResult || 'pending',
      reportUrl: `https://example.com/reports/${generateId()}.pdf`,
      inspectorName: inspector.name,
      reportDate: new Date().toISOString(),
      createdAt: new Date().toISOString(),
    };

    localInspectionReports.unshift(newReport);

    const taskIndex = localInspectionTasks.findIndex((t) => t.id === task.id);
    if (taskIndex !== -1) {
      localInspectionTasks[taskIndex].status = 'completed';
      localInspectionTasks[taskIndex].reportDate = new Date().toISOString();
    }

    const batchIndex = localBatches.findIndex((b) => b.id === task.batchId);
    if (batchIndex !== -1) {
      localBatches[batchIndex].status = newReport.overallResult === 'qualified' ? 'qualified' : 'unqualified';
    }

    return successResponse<InspectionReport>(newReport, '检测报告提交成功');
  }),

  http.get('/api/certification/applications', ({ request }) => {
    const url = new URL(request.url);
    const page = parseInt(url.searchParams.get('page') || '1');
    const pageSize = parseInt(url.searchParams.get('pageSize') || '10');
    const applicantId = url.searchParams.get('applicantId');
    const certifierId = url.searchParams.get('certifierId');
    const status = url.searchParams.get('status');

    let filtered = localCertificationApplications;
    if (applicantId) {
      filtered = filtered.filter((a) => a.applicantId === applicantId);
    }
    if (certifierId) {
      filtered = filtered.filter((a) => a.certifierId === certifierId);
    }
    if (status) {
      filtered = filtered.filter((a) => a.status === status);
    }

    return successResponse<PaginatedResponse<CertificationApplication>>(
      paginate(filtered, page, pageSize)
    );
  }),

  http.put('/api/certification/applications/:id', async ({ request, params }) => {
    const { id } = params;
    const body = (await request.json()) as Partial<CertificationApplication>;
    const index = localCertificationApplications.findIndex((a) => a.id === id);
    if (index === -1) {
      return errorResponse(404, '认证申请不存在');
    }
    
    localCertificationApplications[index] = {
      ...localCertificationApplications[index],
      ...body,
      reviewedAt: body.status ? new Date().toISOString() : localCertificationApplications[index].reviewedAt,
    };
    
    return successResponse<CertificationApplication>(
      localCertificationApplications[index], 
      '认证申请更新成功'
    );
  }),

  http.get('/api/certificates', ({ request }) => {
    const url = new URL(request.url);
    const page = parseInt(url.searchParams.get('page') || '1');
    const pageSize = parseInt(url.searchParams.get('pageSize') || '10');
    const status = url.searchParams.get('status');
    const certType = url.searchParams.get('certType');
    const certifierId = url.searchParams.get('certifierId');

    let filtered = localCertificates;
    if (status) {
      filtered = filtered.filter((c) => c.status === status);
    }
    if (certType) {
      filtered = filtered.filter((c) => c.certType === certType);
    }
    if (certifierId) {
      filtered = filtered.filter((c) => {
        const app = localCertificationApplications.find(a => a.id === c.applicationId);
        return app?.certifierId === certifierId;
      });
    }

    return successResponse<PaginatedResponse<Certificate>>(
      paginate(filtered, page, pageSize)
    );
  }),

  http.post('/api/certificates/generate', async ({ request }) => {
    const body = (await request.json()) as { applicationId: string };
    const { applicationId } = body;

    const application = localCertificationApplications.find((a) => a.id === applicationId);
    if (!application) {
      return errorResponse(404, '认证申请不存在');
    }

    const batch = localBatches.find((b) => b.id === application.batchId) || localBatches[0];
    const farmer = users.find((u) => u.id === batch.farmerId) || users.find((u) => u.role === 'farmer')!;

    const issueDate = new Date();
    const validUntil = new Date(issueDate);
    validUntil.setFullYear(validUntil.getFullYear() + 1);

    const newCertificate: Certificate = {
      id: generateId(),
      certNo: `CERT${application.certType.toUpperCase().slice(0, 3)}${new Date().getFullYear()}${faker.string.numeric(8)}`,
      certType: application.certType,
      applicationId: application.id,
      batchId: batch.id,
      holderName: farmer.name,
      productName: localPlantings.find((p) => p.id === batch.plantingId)?.cropType || '',
      issueDate: issueDate.toISOString(),
      validUntil: validUntil.toISOString(),
      qrCodeUrl: `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=CERT${faker.string.numeric(10)}`,
      certUrl: `https://example.com/certificates/${generateId()}.pdf`,
      status: 'valid',
      createdAt: issueDate.toISOString(),
    };

    localCertificates.unshift(newCertificate);

    const appIndex = localCertificationApplications.findIndex((a) => a.id === applicationId);
    if (appIndex !== -1) {
      localCertificationApplications[appIndex].certificateId = newCertificate.id;
    }

    const batchIndex = localBatches.findIndex((b) => b.id === batch.id);
    if (batchIndex !== -1) {
      localBatches[batchIndex].certificateId = newCertificate.id;
      localBatches[batchIndex].status = 'certified';
    }

    return successResponse<Certificate>(newCertificate, '证书生成成功');
  }),

  http.get('/api/regulator/stats/heatmap', () => {
    return successResponse<RegulatorStats>(
      {
        passRateByRegion: regionStats.passRateByRegion,
        certCoverageByRegion: regionStats.certCoverageByRegion,
        complaintHandleRate: regionStats.complaintHandleRate,
        monthlyData,
      },
      '获取统计数据成功'
    );
  }),

  http.get('/api/regulator/thresholds', ({ request }) => {
    const url = new URL(request.url);
    const page = parseInt(url.searchParams.get('page') || '1');
    const pageSize = parseInt(url.searchParams.get('pageSize') || '10');
    const cropType = url.searchParams.get('cropType');

    let filtered = localThresholds;
    if (cropType) {
      filtered = filtered.filter((t) => t.cropType === cropType);
    }

    return successResponse<PaginatedResponse<PesticideThreshold>>(
      paginate(filtered, page, pageSize)
    );
  }),

  http.put('/api/regulator/thresholds/:id', async ({ request, params }) => {
    const { id } = params;
    const body = (await request.json()) as Partial<PesticideThreshold>;
    const index = localThresholds.findIndex((t) => t.id === id);
    if (index === -1) {
      return errorResponse(404, '阈值设置不存在');
    }
    localThresholds[index] = {
      ...localThresholds[index],
      ...body,
      updatedAt: new Date().toISOString(),
    };
    return successResponse<PesticideThreshold>(localThresholds[index], '阈值更新成功');
  }),

  http.get('/api/complaints', ({ request }) => {
    const url = new URL(request.url);
    const page = parseInt(url.searchParams.get('page') || '1');
    const pageSize = parseInt(url.searchParams.get('pageSize') || '10');
    const regulatorId = url.searchParams.get('regulatorId');
    const status = url.searchParams.get('status');

    let filtered = localComplaints;
    if (regulatorId) {
      filtered = filtered.filter((c) => c.regulatorId === regulatorId);
    }
    if (status) {
      filtered = filtered.filter((c) => c.status === status);
    }

    return successResponse<PaginatedResponse<Complaint>>(paginate(filtered, page, pageSize));
  }),

  http.put('/api/complaints/:id', async ({ request, params }) => {
    const { id } = params;
    const body = (await request.json()) as Partial<Complaint>;
    const index = localComplaints.findIndex((c) => c.id === id);
    if (index === -1) {
      return errorResponse(404, '投诉不存在');
    }
    localComplaints[index] = { ...localComplaints[index], ...body };
    return successResponse<Complaint>(localComplaints[index], '投诉更新成功');
  }),

  http.get('/api/regulator/subsidy-approvals', ({ request }) => {
    const url = new URL(request.url);
    const page = parseInt(url.searchParams.get('page') || '1');
    const pageSize = parseInt(url.searchParams.get('pageSize') || '10');
    const status = url.searchParams.get('status');

    let filtered = localSubsidies.filter((s) => ['submitted', 'reviewing'].includes(s.status));
    if (status) {
      filtered = localSubsidies.filter((s) => s.status === status);
    }

    return successResponse<PaginatedResponse<SubsidyApplication>>(
      paginate(filtered, page, pageSize)
    );
  }),

  http.get('/api/regulator/reports', () => {
    return successResponse({
      totalBatches: localBatches.length,
      qualifiedBatches: localBatches.filter((b) => b.status === 'qualified' || b.status === 'certified').length,
      unqualifiedBatches: localBatches.filter((b) => b.status === 'unqualified').length,
      totalComplaints: localComplaints.length,
      resolvedComplaints: localComplaints.filter((c) => c.status === 'resolved' || c.status === 'confirmed' || c.status === 'closed').length,
      totalCertificates: localCertificates.length,
      validCertificates: localCertificates.filter((c) => c.status === 'valid').length,
      totalSubsidies: localSubsidies.reduce((sum, s) => sum + (s.actualAmount || 0), 0),
    });
  }),

  http.get('/api/consumer/trace/:code', ({ params }) => {
    const { code } = params;
    const traceCode = localTraceCodes.find((t) => t.code === code);
    if (!traceCode) {
      return errorResponse(404, '追溯码不存在');
    }

    const batch = localBatches.find((b) => b.traceCodeId === traceCode.id) || localBatches.find((b) => b.plantingId === traceCode.plantingId);
    if (!batch) {
      return errorResponse(404, '未找到相关批次信息');
    }

    const planting = localPlantings.find((p) => p.id === traceCode.plantingId)!;
    const plot = localPlots.find((p) => p.id === traceCode.plotId)!;
    const farmer = users.find((u) => u.id === traceCode.farmerId)!;
    const pesticides = localPesticideRecords.filter((p) => p.plantingId === planting.id);
    const inspectionReport = localInspectionReports.find((r) => r.batchId === batch.id);
    const certificate = localCertificates.find((c) => c.batchId === batch.id);

    const timeline: TimelineItem[] = [];
    timeline.push({
      stage: '种植',
      title: `${planting.cropType}种植`,
      description: `${farmer.name}在${plot.name}种植${planting.cropType} ${planting.cropVariety}，面积${planting.area}亩`,
      timestamp: planting.plantDate,
      status: 'completed',
    });

    pesticides.forEach((p) => {
      timeline.push({
        stage: '农药使用',
        title: `使用${p.pesticideName}`,
        description: `使用${p.pesticideType} ${p.pesticideName}，用量${p.dosage}kg，安全间隔期${p.safeInterval}天`,
        timestamp: p.useDate,
        status: 'completed',
      });
    });

    timeline.push({
      stage: '收购',
      title: '批次收购',
      description: `收购数量${batch.quantity}kg，单价${batch.unitPrice}元/kg，总价${batch.totalAmount}元`,
      timestamp: batch.purchaseDate,
      status: 'completed',
    });

    if (batch.precheckStatus !== 'pending') {
      timeline.push({
        stage: '预检',
        title: '批次预检',
        description: `预检结果：${batch.precheckStatus === 'pass' ? '合格' : batch.precheckStatus === 'warning' ? '警告' : '不合格'}`,
        timestamp: batch.createdAt,
        status: 'completed',
      });
    }

    if (inspectionReport) {
      timeline.push({
        stage: '检测',
        title: '质量检测',
        description: `检测结果：${inspectionReport.overallResult === 'qualified' ? '合格' : '不合格'}，检测${inspectionReport.items.length}项指标`,
        timestamp: inspectionReport.reportDate,
        status: 'completed',
      });
    }

    if (certificate) {
      timeline.push({
        stage: '认证',
        title: `${certificate.certType === 'organic' ? '有机' : certificate.certType === 'green' ? '绿色' : 'GAP'}认证`,
        description: `证书编号：${certificate.certNo}，有效期至${new Date(certificate.validUntil).toLocaleDateString()}`,
        timestamp: certificate.issueDate,
        status: certificate.status === 'valid' ? 'active' : 'expired',
      });
    }

    const traceInfo: TraceInfo = {
      traceCode: traceCode.code,
      batch,
      planting,
      plot,
      farmer,
      pesticideRecords: pesticides,
      inspectionReport,
      certificate,
      timeline,
    };

    return successResponse<TraceInfo>(traceInfo, '追溯信息获取成功');
  }),

  http.post('/api/consumer/complaints', async ({ request }) => {
    const body = (await request.json()) as Partial<Complaint>;
    const consumer = users.find((u) => u.role === 'consumer')!;

    const newComplaint: Complaint = {
      id: generateId(),
      complaintNo: `COMP${new Date().getFullYear()}${faker.string.numeric(8)}`,
      traceCode: body.traceCode || '',
      consumerId: body.consumerId || consumer.id,
      consumerName: body.consumerName || consumer.name,
      consumerPhone: body.consumerPhone || consumer.phone,
      type: body.type || 'other',
      description: body.description || '',
      images: body.images || [],
      region: body.region || consumer.region || '',
      status: 'pending',
      processingLogs: [
        {
          operator: consumer.name,
          action: '提交投诉',
          remark: '用户提交投诉',
          timestamp: new Date().toISOString(),
        },
      ],
      createdAt: new Date().toISOString(),
    };

    localComplaints.unshift(newComplaint);
    return successResponse<Complaint>(newComplaint, '投诉提交成功');
  }),

  http.get('/api/messages', ({ request }) => {
    const url = new URL(request.url);
    const page = parseInt(url.searchParams.get('page') || '1');
    const pageSize = parseInt(url.searchParams.get('pageSize') || '10');
    const userId = url.searchParams.get('userId');
    const isRead = url.searchParams.get('isRead');

    let filtered = localMessages;
    if (userId) {
      filtered = filtered.filter((m) => m.userId === userId);
    }
    if (isRead !== null && isRead !== undefined) {
      filtered = filtered.filter((m) => m.isRead === (isRead === 'true'));
    }

    filtered.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    return successResponse<PaginatedResponse<Message>>(paginate(filtered, page, pageSize));
  }),

  http.put('/api/messages/:id/read', async ({ params }) => {
    const { id } = params;
    const index = localMessages.findIndex((m) => m.id === id);
    if (index === -1) {
      return errorResponse(404, '消息不存在');
    }
    localMessages[index].isRead = true;
    localMessages[index].readAt = new Date().toISOString();
    return successResponse<Message>(localMessages[index], '消息已标记为已读');
  }),

  http.put('/api/messages/read-all', async ({ request }) => {
    const body = await request.json();
    const { userId } = body;
    const now = new Date().toISOString();
    localMessages.forEach((m) => {
      if (m.userId === userId && !m.isRead) {
        m.isRead = true;
        m.readAt = now;
      }
    });
    return successResponse<void>(undefined, '所有消息已标记为已读');
  }),

  http.get('/api/messages/unread-count', ({ request }) => {
    const url = new URL(request.url);
    const userId = url.searchParams.get('userId');
    let count = 0;
    if (userId) {
      count = localMessages.filter((m) => m.userId === userId && !m.isRead).length;
    }
    return successResponse<number>(count);
  }),
];

export default handlers;
