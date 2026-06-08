import type { CertType } from '../types';

const certTypePrefix: Record<CertType, string> = {
  organic: 'ORG',
  green: 'GRE',
  gap: 'GAP',
};

export function generateCertificateNumber(certType: CertType): string {
  const prefix = certTypePrefix[certType];
  const year = new Date().getFullYear();
  const timestamp = Date.now().toString().slice(-8);
  const random = Math.random().toString(36).toUpperCase().slice(2, 6);
  return `CERT${prefix}${year}${timestamp}${random}`;
}

export function calculateCertificateValidity(issueDate: Date | string, years: number = 1): {
  issueDate: string;
  validUntil: string;
  daysRemaining: number;
  isExpired: boolean;
} {
  const issue = new Date(issueDate);
  const validUntil = new Date(issue);
  validUntil.setFullYear(validUntil.getFullYear() + years);
  const now = new Date();
  const daysRemaining = Math.ceil((validUntil.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
  return {
    issueDate: issue.toISOString(),
    validUntil: validUntil.toISOString(),
    daysRemaining,
    isExpired: daysRemaining <= 0,
  };
}

export function checkCertificateStatus(validUntil: string): 'valid' | 'expiring' | 'expired' {
  const expiryDate = new Date(validUntil);
  const now = new Date();
  const daysRemaining = Math.ceil((expiryDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
  if (daysRemaining <= 0) return 'expired';
  if (daysRemaining <= 30) return 'expiring';
  return 'valid';
}

export function formatCertificateType(certType: CertType): string {
  const labels: Record<CertType, string> = {
    organic: '有机产品认证',
    green: '绿色食品认证',
    gap: 'GAP良好农业规范认证',
  };
  return labels[certType];
}

export function generateComplaintNumber(): string {
  const year = new Date().getFullYear();
  const random = Math.random().toString(36).toUpperCase().slice(2, 10);
  return `COMP${year}${random}`;
}

export function generateReportNumber(): string {
  const year = new Date().getFullYear();
  const random = Math.random().toString(36).toUpperCase().slice(2, 10);
  return `REPORT${year}${random}`;
}
