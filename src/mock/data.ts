import { fakerZH_CN as faker } from '@faker-js/faker';
import type {
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
  MonthlyData,
  RegionStat,
  UserRole,
  BatchStatus,
  CertType,
  ComplaintType,
  InspectResult,
  MessageType,
  SubsidyApplication,
} from '../types';

faker.seed(12345);

const roles: UserRole[] = ['farmer', 'buyer', 'inspector', 'certifier', 'regulator', 'consumer'];

const provinces = ['山东省', '河南省', '江苏省', '安徽省', '河北省', '湖南省', '湖北省', '四川省', '广东省', '浙江省'];
const cities: Record<string, string[]> = {
  '山东省': ['济南市', '青岛市', '潍坊市', '烟台市', '临沂市'],
  '河南省': ['郑州市', '洛阳市', '新乡市', '许昌市', '南阳市'],
  '江苏省': ['南京市', '苏州市', '徐州市', '无锡市', '常州市'],
  '安徽省': ['合肥市', '芜湖市', '蚌埠市', '阜阳市', '安庆市'],
  '河北省': ['石家庄市', '唐山市', '保定市', '邯郸市', '廊坊市'],
  '湖南省': ['长沙市', '株洲市', '湘潭市', '衡阳市', '岳阳市'],
  '湖北省': ['武汉市', '宜昌市', '襄阳市', '荆州市', '黄冈市'],
  '四川省': ['成都市', '绵阳市', '德阳市', '宜宾市', '泸州市'],
  '广东省': ['广州市', '深圳市', '佛山市', '东莞市', '惠州市'],
  '浙江省': ['杭州市', '宁波市', '温州市', '绍兴市', '嘉兴市'],
};

const districts = ['历下区', '市中区', '槐荫区', '天桥区', '历城区', '长清区', '章丘区', '济阳区'];

const cropTypes = ['水稻', '小麦', '玉米', '大豆', '西红柿', '黄瓜', '白菜', '萝卜', '苹果', '橙子', '葡萄', '草莓'];
const cropVarieties: Record<string, string[]> = {
  '水稻': ['粳稻', '籼稻', '糯稻', '杂交稻', '香稻'],
  '小麦': ['冬小麦', '春小麦', '硬质小麦', '软质小麦'],
  '玉米': ['甜玉米', '糯玉米', '高油玉米', '普通玉米'],
  '大豆': ['黄豆', '黑豆', '青豆', '红豆'],
  '西红柿': ['粉果番茄', '红果番茄', '樱桃番茄', '圣女果'],
  '黄瓜': ['刺黄瓜', '水果黄瓜', '老黄瓜', '小黄瓜'],
  '白菜': ['大白菜', '小白菜', '娃娃菜', '奶白菜'],
  '萝卜': ['白萝卜', '红萝卜', '青萝卜', '胡萝卜'],
  '苹果': ['红富士', '嘎啦', '金帅', '红星'],
  '橙子': ['脐橙', '血橙', '冰糖橙', '脐橙'],
  '葡萄': ['巨峰', '夏黑', '阳光玫瑰', '红提'],
  '草莓': ['红颜', '章姬', '甜查理', '奶油草莓'],
};

const soilTypes = ['壤土', '砂壤土', '粘土', '砂土', '粉土'];
const pesticideNames = ['敌敌畏', '乐果', '氧化乐果', '毒死蜱', '辛硫磷', '吡虫啉', '噻虫嗪', '氯氰菊酯', '溴氰菊酯', '多菌灵', '甲基托布津', '百菌清'];
const pesticideTypes = ['杀虫剂', '杀菌剂', '除草剂', '杀螨剂', '植物生长调节剂'];

const generateId = () => faker.string.uuid();

const pastDate = (months: number): Date => {
  const date = new Date();
  date.setMonth(date.getMonth() - months);
  return faker.date.between({ from: date, to: new Date() });
};

export const generateUsers = (): User[] => {
  const users: User[] = [];
  roles.forEach((role) => {
    for (let i = 0; i < 5; i++) {
      const gender = faker.person.sexType();
      const firstName = faker.person.firstName(gender);
      const lastName = faker.person.lastName();
      users.push({
        id: generateId(),
        role,
        username: `${role}${i + 1}`,
        name: `${lastName}${firstName}`,
        phone: faker.phone.number(),
        idCard: faker.string.numeric(18),
        avatar: faker.image.avatar(),
        region: faker.helpers.arrayElement(provinces),
        status: faker.helpers.arrayElement(['active', 'inactive']),
        createdAt: faker.date.past({ years: 2 }).toISOString(),
        verified: faker.datatype.boolean({ probability: 0.9 }),
      });
    }
  });
  return users;
};

export const generatePlots = (farmers: User[]): Plot[] => {
  const plots: Plot[] = [];
  for (let i = 0; i < 20; i++) {
    const farmer = faker.helpers.arrayElement(farmers.filter((u) => u.role === 'farmer'));
    const province = faker.helpers.arrayElement(provinces);
    const city = faker.helpers.arrayElement(cities[province]);
    const district = faker.helpers.arrayElement(districts);
    const baseLat = 30 + Math.random() * 10;
    const baseLng = 110 + Math.random() * 10;
    plots.push({
      id: generateId(),
      farmerId: farmer.id,
      name: `${faker.helpers.arrayElement(['东', '西', '南', '北', '中'])}${faker.helpers.arrayElement(['坡地', '平地', '水田', '旱地', '果园'])}${i + 1}号`,
      area: parseFloat(faker.number.float({ min: 1, max: 50, fractionDigits: 2 }).toFixed(2)),
      location: {
        province,
        city,
        district,
        address: `${province}${city}${district}${faker.location.streetAddress()}`,
        gps: {
          lat: parseFloat((baseLat + Math.random() * 0.5).toFixed(6)),
          lng: parseFloat((baseLng + Math.random() * 0.5).toFixed(6)),
        },
      },
      soilType: faker.helpers.arrayElement(soilTypes),
      createdAt: faker.date.past({ years: 2 }).toISOString(),
    });
  }
  return plots;
};

export const generatePlantings = (farmers: User[], plots: Plot[]): PlantingInfo[] => {
  const plantings: PlantingInfo[] = [];
  const statuses: PlantingInfo['status'][] = ['planting', 'growing', 'ready', 'harvested'];
  for (let i = 0; i < 30; i++) {
    const farmer = faker.helpers.arrayElement(farmers.filter((u) => u.role === 'farmer'));
    const plot = faker.helpers.arrayElement(plots.filter((p) => p.farmerId === farmer.id));
    const cropType = faker.helpers.arrayElement(cropTypes);
    const cropVariety = faker.helpers.arrayElement(cropVarieties[cropType]);
    const plantDate = pastDate(8);
    const expectedHarvestDate = new Date(plantDate);
    expectedHarvestDate.setMonth(expectedHarvestDate.getMonth() + faker.number.int({ min: 2, max: 6 }));
    plantings.push({
      id: generateId(),
      farmerId: farmer.id,
      plotId: plot ? plot.id : faker.helpers.arrayElement(plots).id,
      cropType,
      cropVariety,
      area: parseFloat(faker.number.float({ min: 0.5, max: 30, fractionDigits: 2 }).toFixed(2)),
      plantDate: plantDate.toISOString(),
      expectedHarvestDate: expectedHarvestDate.toISOString(),
      expectedYield: parseFloat(faker.number.float({ min: 100, max: 10000, fractionDigits: 2 }).toFixed(2)),
      actualYield: faker.helpers.maybe(() => parseFloat(faker.number.float({ min: 100, max: 10000, fractionDigits: 2 }).toFixed(2)), { probability: 0.6 }),
      status: faker.helpers.arrayElement(statuses),
      createdAt: faker.date.past({ years: 1 }).toISOString(),
    });
  }
  return plantings;
};

export const generateTraceCodes = (farmers: User[], plots: Plot[], plantings: PlantingInfo[]): TraceCode[] => {
  const codes: TraceCode[] = [];
  const statuses: TraceCode['status'][] = ['active', 'used', 'expired'];
  for (let i = 0; i < 100; i++) {
    const planting = faker.helpers.arrayElement(plantings);
    const createdAt = faker.date.past({ years: 1 });
    const activatedAt = faker.helpers.maybe(() => faker.date.between({ from: createdAt, to: new Date() }), { probability: 0.7 });
    codes.push({
      id: generateId(),
      code: `TRACE${faker.string.numeric(10)}`,
      plantingId: planting.id,
      farmerId: planting.farmerId,
      plotId: planting.plotId,
      qrCodeUrl: `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=TRACE${faker.string.numeric(10)}`,
      status: faker.helpers.arrayElement(statuses),
      createdAt: createdAt.toISOString(),
      activatedAt: activatedAt?.toISOString(),
    });
  }
  return codes;
};

export const generatePesticideRecords = (plantings: PlantingInfo[], farmers: User[]): PesticideRecord[] => {
  const records: PesticideRecord[] = [];
  for (let i = 0; i < 50; i++) {
    const planting = faker.helpers.arrayElement(plantings);
    const useDate = faker.date.between({ from: new Date(planting.plantDate), to: new Date(planting.expectedHarvestDate) });
    records.push({
      id: generateId(),
      plantingId: planting.id,
      farmerId: planting.farmerId,
      pesticideName: faker.helpers.arrayElement(pesticideNames),
      pesticideType: faker.helpers.arrayElement(pesticideTypes),
      useDate: useDate.toISOString(),
      dosage: parseFloat(faker.number.float({ min: 0.1, max: 5, fractionDigits: 2 }).toFixed(2)),
      safeInterval: faker.number.int({ min: 7, max: 30 }),
      operator: faker.person.fullName(),
      createdAt: faker.date.past({ years: 1 }).toISOString(),
    });
  }
  return records;
};

export const generateSubsidies = (farmers: User[], plantings: PlantingInfo[]): SubsidyApplication[] => {
  const subsidies: SubsidyApplication[] = [];
  const statuses: SubsidyApplication['status'][] = ['draft', 'submitted', 'reviewing', 'approved', 'rejected', 'paid'];
  for (let i = 0; i < 25; i++) {
    const farmer = faker.helpers.arrayElement(farmers.filter((u) => u.role === 'farmer'));
    const planting = faker.helpers.arrayElement(plantings.filter((p) => p.farmerId === farmer.id));
    const applicationDate = pastDate(6);
    const status = faker.helpers.arrayElement(statuses);
    const calculatedAmount = parseFloat((planting.area * 150 + (planting.actualYield || planting.expectedYield) * 0.5).toFixed(2));
    subsidies.push({
      id: generateId(),
      farmerId: farmer.id,
      plantingId: planting ? planting.id : faker.helpers.arrayElement(plantings).id,
      area: planting.area,
      yieldAmount: planting.actualYield || planting.expectedYield,
      calculatedAmount,
      actualAmount: ['approved', 'paid'].includes(status) ? calculatedAmount : undefined,
      status,
      applicationDate: applicationDate.toISOString(),
      approvalDate: ['approved', 'paid'].includes(status) ? faker.date.between({ from: applicationDate, to: new Date() }).toISOString() : undefined,
      paymentDate: status === 'paid' ? faker.date.between({ from: applicationDate, to: new Date() }).toISOString() : undefined,
      remark: faker.helpers.maybe(() => faker.lorem.sentence(), { probability: 0.3 }),
      createdAt: applicationDate.toISOString(),
    });
  }
  return subsidies;
};

export const generateBatches = (
  buyers: User[],
  farmers: User[],
  plantings: PlantingInfo[],
  traceCodes: TraceCode[],
): Batch[] => {
  const batches: Batch[] = [];
  const batchStatuses: BatchStatus[] = [
    'planted', 'harvested', 'purchased', 'precheck_pass', 'precheck_warning',
    'precheck_fail', 'inspecting', 'qualified', 'unqualified', 'locked', 'certified',
  ];
  const precheckStatuses: Batch['precheckStatus'][] = ['pass', 'warning', 'fail', 'pending'];

  for (let i = 0; i < 40; i++) {
    const buyer = faker.helpers.arrayElement(buyers.filter((u) => u.role === 'buyer'));
    const traceCode = faker.helpers.arrayElement(traceCodes.filter((tc) => tc.status === 'used' || tc.status === 'active'));
    const planting = plantings.find((p) => p.id === traceCode.plantingId) || faker.helpers.arrayElement(plantings);
    const farmer = farmers.find((f) => f.id === planting.farmerId) || faker.helpers.arrayElement(farmers.filter((u) => u.role === 'farmer'));
    const status = faker.helpers.arrayElement(batchStatuses);
    const precheckStatus = faker.helpers.arrayElement(precheckStatuses);
    const unitPrice = parseFloat(faker.number.float({ min: 1, max: 50, fractionDigits: 2 }).toFixed(2));
    const quantity = parseFloat(faker.number.float({ min: 100, max: 10000, fractionDigits: 2 }).toFixed(2));

    const precheckDetails = precheckStatus !== 'pending' ? {
      pesticideResidue: Array.from({ length: faker.number.int({ min: 3, max: 6 }) }, () => {
        const pesticide = faker.helpers.arrayElement(pesticideNames);
        const standard = parseFloat(faker.number.float({ min: 0.01, max: 0.5, fractionDigits: 3 }).toFixed(3));
        const value = parseFloat(faker.number.float({ min: 0, max: precheckStatus === 'fail' ? standard * 2 : standard * 0.8, fractionDigits: 3 }).toFixed(3));
        const ratio = value / standard;
        let result: 'normal' | 'warning' | 'exceed';
        if (ratio <= 0.8) result = 'normal';
        else if (ratio <= 1.0) result = 'warning';
        else result = 'exceed';
        return {
          item: pesticide,
          value,
          standard,
          unit: 'mg/kg',
          result,
        };
      }),
      overall: precheckStatus === 'pass' ? '合格' : precheckStatus === 'warning' ? '警告' : '不合格',
    } : undefined;

    batches.push({
      id: generateId(),
      batchNo: `BATCH${faker.date.recent().getFullYear()}${faker.string.numeric(8)}`,
      traceCodeId: traceCode.id,
      buyerId: buyer.id,
      farmerId: farmer.id,
      plantingId: planting.id,
      quantity,
      unitPrice,
      totalAmount: parseFloat((quantity * unitPrice).toFixed(2)),
      purchaseDate: pastDate(6).toISOString(),
      precheckStatus,
      precheckDetails,
      status,
      createdAt: pastDate(6).toISOString(),
    });
  }
  return batches;
};

export const generateInspectionTasks = (
  batches: Batch[],
  inspectors: User[],
  regulators: User[],
): InspectionTask[] => {
  const tasks: InspectionTask[] = [];
  const taskStatuses: InspectionTask['status'][] = ['pending', 'assigned', 'inspecting', 'completed', 'cancelled'];
  const priorities: InspectionTask['priority'][] = ['low', 'medium', 'high', 'urgent'];

  for (let i = 0; i < 30; i++) {
    const batch = faker.helpers.arrayElement(batches);
    const inspector = faker.helpers.arrayElement(inspectors.filter((u) => u.role === 'inspector'));
    const regulator = faker.helpers.arrayElement(regulators.filter((u) => u.role === 'regulator'));
    const status = faker.helpers.arrayElement(taskStatuses);
    const assignedAt = pastDate(3);
    const sampleDate = ['inspecting', 'completed'].includes(status) ? faker.date.between({ from: assignedAt, to: new Date() }) : undefined;
    const reportDate = status === 'completed' ? faker.date.between({ from: sampleDate || assignedAt, to: new Date() }) : undefined;

    tasks.push({
      id: generateId(),
      taskNo: `INSPECT${faker.date.recent().getFullYear()}${faker.string.numeric(8)}`,
      batchId: batch.id,
      inspectorId: inspector.id,
      regulatorId: regulator.id,
      priority: faker.helpers.arrayElement(priorities),
      status,
      sampleDate: sampleDate?.toISOString(),
      reportDate: reportDate?.toISOString(),
      assignedAt: assignedAt.toISOString(),
      createdAt: pastDate(4).toISOString(),
    });
  }
  return tasks;
};

export const generateInspectionReports = (
  tasks: InspectionTask[],
  batches: Batch[],
  inspectors: User[],
): InspectionReport[] => {
  const reports: InspectionReport[] = [];
  const completedTasks = tasks.filter((t) => t.status === 'completed');

  for (let i = 0; i < 25; i++) {
    const task = completedTasks[i % completedTasks.length];
    const batch = batches.find((b) => b.id === task.batchId) || faker.helpers.arrayElement(batches);
    const inspector = inspectors.find((u) => u.id === task.inspectorId) || faker.helpers.arrayElement(inspectors.filter((u) => u.role === 'inspector'));
    const overallResult: InspectResult = i < 3 ? 'unqualified' : 'qualified';

    const items = Array.from({ length: faker.number.int({ min: 5, max: 10 }) }, (_, idx) => {
      const pesticide = faker.helpers.arrayElement(pesticideNames);
      const standard = parseFloat(faker.number.float({ min: 0.01, max: 0.5, fractionDigits: 3 }).toFixed(3));
      const isUnqualified = overallResult === 'unqualified' && idx === 0;
      const value = parseFloat(
        faker.number.float({
          min: 0,
          max: isUnqualified ? standard * 2 : standard * 0.8,
          fractionDigits: 3,
        }).toFixed(3)
      );
      return {
        name: pesticide,
        value,
        standard,
        unit: 'mg/kg',
        result: (value <= standard ? 'qualified' : 'unqualified') as 'qualified' | 'unqualified',
      };
    });

    reports.push({
      id: generateId(),
      reportNo: `REPORT${faker.date.recent().getFullYear()}${faker.string.numeric(8)}`,
      taskId: task.id,
      batchId: batch.id,
      inspectorId: inspector.id,
      items,
      overallResult,
      reportUrl: `https://example.com/reports/${faker.string.uuid()}.pdf`,
      inspectorName: inspector.name,
      reportDate: task.reportDate || pastDate(2).toISOString(),
      createdAt: pastDate(2).toISOString(),
    });
  }
  return reports;
};

export const generateCertificationApplications = (
  batches: Batch[],
  applicants: User[],
  certifiers: User[],
): CertificationApplication[] => {
  const applications: CertificationApplication[] = [];
  const certTypes: CertType[] = ['organic', 'green', 'gap'];
  const statuses: CertificationApplication['status'][] = ['draft', 'submitted', 'reviewing', 'site_check', 'approved', 'rejected'];

  for (let i = 0; i < 20; i++) {
    const batch = faker.helpers.arrayElement(batches);
    const applicant = faker.helpers.arrayElement(applicants.filter((u) => u.role === 'farmer' || u.role === 'buyer'));
    const certifier = faker.helpers.arrayElement(certifiers.filter((u) => u.role === 'certifier'));
    const status = faker.helpers.arrayElement(statuses);
    const submittedAt = pastDate(4);
    const reviewedAt = ['reviewing', 'site_check', 'approved', 'rejected'].includes(status)
      ? faker.date.between({ from: submittedAt, to: new Date() }).toISOString()
      : undefined;

    applications.push({
      id: generateId(),
      applicationNo: `CERTAPP${faker.date.recent().getFullYear()}${faker.string.numeric(8)}`,
      certType: faker.helpers.arrayElement(certTypes),
      batchId: batch.id,
      applicantId: applicant.id,
      certifierId: ['reviewing', 'site_check', 'approved', 'rejected'].includes(status) ? certifier.id : undefined,
      materials: Array.from({ length: faker.number.int({ min: 2, max: 5 }) }, () => ({
        name: faker.helpers.arrayElement(['土地证明', '生产记录', '检测报告', '资质证书', '申请表']),
        url: `https://example.com/materials/${faker.string.uuid()}.pdf`,
      })),
      status,
      reviewNotes: faker.helpers.maybe(() => faker.lorem.sentences(2), { probability: 0.5 }),
      submittedAt: submittedAt.toISOString(),
      reviewedAt,
      createdAt: pastDate(5).toISOString(),
    });
  }
  return applications;
};

export const generateCertificates = (
  applications: CertificationApplication[],
  batches: Batch[],
  farmers: User[],
): Certificate[] => {
  const certificates: Certificate[] = [];
  const approvedApplications = applications.filter((a) => a.status === 'approved');
  const certTypes: CertType[] = ['organic', 'green', 'gap'];

  for (let i = 0; i < 15; i++) {
    const application = approvedApplications[i % approvedApplications.length] || faker.helpers.arrayElement(applications);
    const batch = batches.find((b) => b.id === application.batchId) || faker.helpers.arrayElement(batches);
    const farmer = farmers.find((f) => f.id === batch.farmerId) || faker.helpers.arrayElement(farmers.filter((u) => u.role === 'farmer'));
    const issueDate = faker.date.past({ years: 1 });
    const validUntil = new Date(issueDate);
    validUntil.setFullYear(validUntil.getFullYear() + 1);

    certificates.push({
      id: generateId(),
      certNo: `CERT${faker.helpers.arrayElement(['ORG', 'GRE', 'GAP'])}${faker.date.recent().getFullYear()}${faker.string.numeric(8)}`,
      certType: application.certType || faker.helpers.arrayElement(certTypes),
      applicationId: application.id,
      batchId: batch.id,
      holderName: farmer.name,
      productName: faker.helpers.arrayElement(cropTypes),
      issueDate: issueDate.toISOString(),
      validUntil: validUntil.toISOString(),
      qrCodeUrl: `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=CERT${faker.string.numeric(10)}`,
      certUrl: `https://example.com/certificates/${faker.string.uuid()}.pdf`,
      status: faker.helpers.arrayElement(['valid', 'valid', 'valid', 'expired']),
      createdAt: issueDate.toISOString(),
    });
  }
  return certificates;
};

export const generateComplaints = (
  traceCodes: TraceCode[],
  consumers: User[],
  regulators: User[],
): Complaint[] => {
  const complaints: Complaint[] = [];
  const complaintTypes: ComplaintType[] = ['quality', 'pesticide', 'fake', 'other'];
  const statuses: Complaint['status'][] = ['pending', 'assigned', 'processing', 'resolved', 'confirmed', 'closed'];

  for (let i = 0; i < 25; i++) {
    const traceCode = faker.helpers.arrayElement(traceCodes);
    const consumer = faker.helpers.arrayElement(consumers.filter((u) => u.role === 'consumer'));
    const regulator = faker.helpers.arrayElement(regulators.filter((u) => u.role === 'regulator'));
    const status = faker.helpers.arrayElement(statuses);
    const createdAt = pastDate(3);
    const assignedAt = ['assigned', 'processing', 'resolved', 'confirmed', 'closed'].includes(status)
      ? faker.date.between({ from: createdAt, to: new Date() }).toISOString()
      : undefined;
    const resolvedAt = ['resolved', 'confirmed', 'closed'].includes(status)
      ? faker.date.between({ from: assignedAt ? new Date(assignedAt) : createdAt, to: new Date() }).toISOString()
      : undefined;
    const confirmedAt = ['confirmed', 'closed'].includes(status)
      ? faker.date.between({ from: resolvedAt ? new Date(resolvedAt) : createdAt, to: new Date() }).toISOString()
      : undefined;

    const processingLogs = [];
    processingLogs.push({
      operator: consumer.name,
      action: '提交投诉',
      remark: '用户提交投诉',
      timestamp: createdAt.toISOString(),
    });
    if (assignedAt) {
      processingLogs.push({
        operator: regulator.name,
        action: '分配投诉',
        remark: '已分配给监管员处理',
        timestamp: assignedAt,
      });
    }
    if (resolvedAt) {
      processingLogs.push({
        operator: regulator.name,
        action: '处理完成',
        remark: faker.lorem.sentence(),
        timestamp: resolvedAt,
      });
    }

    complaints.push({
      id: generateId(),
      complaintNo: `COMP${faker.date.recent().getFullYear()}${faker.string.numeric(8)}`,
      traceCode: traceCode.code,
      consumerId: consumer.id,
      consumerName: consumer.name,
      consumerPhone: consumer.phone,
      type: faker.helpers.arrayElement(complaintTypes),
      description: faker.lorem.paragraph(),
      images: Array.from({ length: faker.number.int({ min: 0, max: 3 }) }, () =>
        faker.image.url()
      ),
      region: consumer.region || faker.helpers.arrayElement(provinces),
      regulatorId: assignedAt ? regulator.id : undefined,
      status,
      processingLogs,
      resolution: resolvedAt ? faker.lorem.paragraph() : undefined,
      createdAt: createdAt.toISOString(),
      assignedAt,
      resolvedAt,
      confirmedAt,
    });
  }
  return complaints;
};

export const generateThresholds = (regulators: User[]): PesticideThreshold[] => {
  const thresholds: PesticideThreshold[] = [];
  const standards = ['GB 2763-2021', 'GB 2763-2022', 'NY/T 393-2013', 'NY/T 393-2020'];
  const regulator = regulators.find((u) => u.role === 'regulator') || regulators[0];

  const thresholdData = [
    { pesticide: '敌敌畏', crop: '水稻', limit: 0.1 },
    { pesticide: '乐果', crop: '水稻', limit: 0.05 },
    { pesticide: '毒死蜱', crop: '水稻', limit: 0.1 },
    { pesticide: '敌敌畏', crop: '小麦', limit: 0.2 },
    { pesticide: '乐果', crop: '小麦', limit: 0.1 },
    { pesticide: '毒死蜱', crop: '小麦', limit: 0.5 },
    { pesticide: '吡虫啉', crop: '蔬菜', limit: 0.5 },
    { pesticide: '氯氰菊酯', crop: '蔬菜', limit: 0.5 },
    { pesticide: '溴氰菊酯', crop: '蔬菜', limit: 0.2 },
    { pesticide: '多菌灵', crop: '蔬菜', limit: 0.5 },
    { pesticide: '多菌灵', crop: '水果', limit: 2 },
    { pesticide: '甲基托布津', crop: '水果', limit: 5 },
    { pesticide: '百菌清', crop: '水果', limit: 1 },
    { pesticide: '吡虫啉', crop: '水果', limit: 0.2 },
    { pesticide: '氯氰菊酯', crop: '水果', limit: 0.5 },
  ];

  thresholdData.forEach((item, index) => {
    thresholds.push({
      id: generateId(),
      pesticideName: item.pesticide,
      cropType: item.crop,
      maxLimit: item.limit,
      unit: 'mg/kg',
      standard: faker.helpers.arrayElement(standards),
      createdBy: regulator.id,
      createdAt: faker.date.past({ years: 2 }).toISOString(),
      updatedAt: pastDate(index % 6).toISOString(),
    });
  });

  return thresholds;
};

export const generateMessages = (users: User[]): Message[] => {
  const messages: Message[] = [];
  const messageTypes: MessageType[] = [
    'inspection_result', 'certification', 'complaint', 'subsidy',
    'warning', 'system', 'batch_status',
  ];

  users.forEach((user) => {
    for (let i = 0; i < 10; i++) {
      const type = faker.helpers.arrayElement(messageTypes);
      const createdAt = pastDate(2);
      const isRead = faker.datatype.boolean({ probability: 0.6 });
      messages.push({
        id: generateId(),
        userId: user.id,
        userRole: user.role,
        type,
        title: faker.helpers.arrayElement([
          '检测结果通知',
          '认证申请审核通过',
          '收到新的投诉',
          '补贴申请已发放',
          '农残超标预警',
          '系统维护通知',
          '批次状态更新',
          '新任务分配',
          '证书即将到期',
          '投诉处理完成',
        ]),
        content: faker.lorem.paragraph(),
        relatedId: faker.string.uuid(),
        relatedType: faker.helpers.arrayElement(['batch', 'inspection', 'certificate', 'complaint', 'subsidy']),
        attachmentUrl: faker.helpers.maybe(() => `https://example.com/attachments/${faker.string.uuid()}.pdf`, { probability: 0.3 }),
        attachmentName: faker.helpers.maybe(() => faker.system.commonFileName('pdf'), { probability: 0.3 }),
        isRead,
        createdAt: createdAt.toISOString(),
        readAt: isRead ? faker.date.between({ from: createdAt, to: new Date() }).toISOString() : undefined,
      });
    }
  });

  return messages;
};

export const generateMonthlyData = (): MonthlyData[] => {
  const monthlyData: MonthlyData[] = [];
  const now = new Date();

  for (let i = 11; i >= 0; i--) {
    const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const month = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
    monthlyData.push({
      month,
      traceEnableRate: parseFloat(faker.number.float({ min: 60, max: 98, fractionDigits: 2 }).toFixed(2)),
      certPassRate: parseFloat(faker.number.float({ min: 70, max: 99, fractionDigits: 2 }).toFixed(2)),
      subsidyTotal: parseFloat(faker.number.float({ min: 100000, max: 500000, fractionDigits: 2 }).toFixed(2)),
    });
  }

  return monthlyData;
};

export const generateRegionStats = (): {
  passRateByRegion: RegionStat[];
  certCoverageByRegion: RegionStat[];
  complaintHandleRate: RegionStat[];
} => {
  const passRateByRegion: RegionStat[] = provinces.map((region) => ({
    region,
    rate: parseFloat(faker.number.float({ min: 70, max: 99, fractionDigits: 2 }).toFixed(2)),
    total: faker.number.int({ min: 100, max: 1000 }),
    pass: faker.number.int({ min: 80, max: 950 }),
  }));

  const certCoverageByRegion: RegionStat[] = provinces.map((region) => ({
    region,
    rate: parseFloat(faker.number.float({ min: 30, max: 80, fractionDigits: 2 }).toFixed(2)),
    total: faker.number.int({ min: 50, max: 500 }),
    certified: faker.number.int({ min: 20, max: 400 }),
  }));

  const complaintHandleRate: RegionStat[] = provinces.map((region) => ({
    region,
    rate: parseFloat(faker.number.float({ min: 60, max: 95, fractionDigits: 2 }).toFixed(2)),
    total: faker.number.int({ min: 10, max: 100 }),
    handled: faker.number.int({ min: 5, max: 95 }),
  }));

  return {
    passRateByRegion,
    certCoverageByRegion,
    complaintHandleRate,
  };
};

export const users = generateUsers();
export const plots = generatePlots(users);
export const plantings = generatePlantings(users, plots);
export const traceCodes = generateTraceCodes(users, plots, plantings);
export const pesticideRecords = generatePesticideRecords(plantings, users);
export const subsidies = generateSubsidies(users, plantings);
export const batches = generateBatches(users, users, plantings, traceCodes);
export const inspectionTasks = generateInspectionTasks(batches, users, users);
export const inspectionReports = generateInspectionReports(inspectionTasks, batches, users);
export const certificationApplications = generateCertificationApplications(batches, users, users);
export const certificates = generateCertificates(certificationApplications, batches, users);
export const complaints = generateComplaints(traceCodes, users, users);
export const thresholds = generateThresholds(users);
export const messages = generateMessages(users);
export const monthlyData = generateMonthlyData();
export const regionStats = generateRegionStats();

export const mockDatabase = {
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
};

export default mockDatabase;
