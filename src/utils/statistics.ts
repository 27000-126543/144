import type { Batch, Certificate, Complaint, RegionStat, MonthlyData } from '../types';

export function calculatePassRate(batches: Batch[]): number {
  if (batches.length === 0) return 0;
  const passed = batches.filter(
    (b) => b.status === 'qualified' || b.status === 'certified'
  ).length;
  return parseFloat(((passed / batches.length) * 100).toFixed(2));
}

export function calculateCertCoverage(certificates: Certificate[], batches: Batch[]): number {
  if (batches.length === 0) return 0;
  const certifiedBatches = batches.filter((b) => b.certificateId).length;
  return parseFloat(((certifiedBatches / batches.length) * 100).toFixed(2));
}

export function calculateComplaintHandleRate(complaints: Complaint[]): number {
  if (complaints.length === 0) return 0;
  const handled = complaints.filter(
    (c) => c.status === 'resolved' || c.status === 'confirmed' || c.status === 'closed'
  ).length;
  return parseFloat(((handled / complaints.length) * 100).toFixed(2));
}

export function calculateRegionPassRate(batches: Batch[], regions: string[]): RegionStat[] {
  return regions.map((region) => {
    const regionBatches = batches.filter(
      (b) => b.farmerId.includes(region.slice(0, 2))
    );
    const passRate = calculatePassRate(regionBatches);
    return {
      region,
      rate: passRate,
      total: regionBatches.length,
      pass: regionBatches.filter(
        (b) => b.status === 'qualified' || b.status === 'certified'
      ).length,
    };
  });
}

export function calculateRegionCertCoverage(
  certificates: Certificate[],
  batches: Batch[],
  regions: string[]
): RegionStat[] {
  return regions.map((region) => {
    const regionBatches = batches.filter(
      (b) => b.farmerId.includes(region.slice(0, 2))
    );
    const coverage = calculateCertCoverage(certificates, regionBatches);
    return {
      region,
      rate: coverage,
      total: regionBatches.length,
      certified: regionBatches.filter((b) => b.certificateId).length,
    };
  });
}

export function calculateRegionComplaintRate(
  complaints: Complaint[],
  regions: string[]
): RegionStat[] {
  return regions.map((region) => {
    const regionComplaints = complaints.filter((c) => c.region === region);
    const handleRate = calculateComplaintHandleRate(regionComplaints);
    return {
      region,
      rate: handleRate,
      total: regionComplaints.length,
      handled: regionComplaints.filter(
        (c) => c.status === 'resolved' || c.status === 'confirmed' || c.status === 'closed'
      ).length,
    };
  });
}

export function generateMonthlyData(months: number = 12): MonthlyData[] {
  const data: MonthlyData[] = [];
  const now = new Date();
  for (let i = months - 1; i >= 0; i--) {
    const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const month = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
    data.push({
      month,
      traceEnableRate: parseFloat((70 + Math.random() * 25).toFixed(2)),
      certPassRate: parseFloat((80 + Math.random() * 18).toFixed(2)),
      subsidyTotal: parseFloat((50000 + Math.random() * 100000).toFixed(2)),
    });
  }
  return data;
}

export function calculateTrend(current: number, previous: number): {
  value: number;
  isPositive: boolean;
  percentage: string;
} {
  const diff = current - previous;
  const percentage = previous === 0 
    ? (current > 0 ? '100.00' : '0.00')
    : parseFloat(((diff / previous) * 100).toFixed(2)).toString();
  return {
    value: parseFloat(diff.toFixed(2)),
    isPositive: diff >= 0,
    percentage: `${diff >= 0 ? '+' : ''}${percentage}%`,
  };
}

export function calculateSubsidyAmount(area: number, yieldAmount: number, ratePerMu: number = 150, ratePerKg: number = 0.5): number {
  return parseFloat((area * ratePerMu + yieldAmount * ratePerKg).toFixed(2));
}
