const PREFIX = 'TRACE';

function luhnCheck(digits: number[]): number {
  let sum = 0;
  let isEven = false;
  for (let i = digits.length - 1; i >= 0; i--) {
    let digit = digits[i];
    if (isEven) {
      digit *= 2;
      if (digit > 9) digit -= 9;
    }
    sum += digit;
    isEven = !isEven;
  }
  return (10 - (sum % 10)) % 10;
}

export function generateTraceCode(farmerId: string, plantingId: string): string {
  const timestamp = Date.now().toString().slice(-8);
  const farmerHash = farmerId.slice(0, 4).toUpperCase();
  const plantingHash = plantingId.slice(0, 4).toUpperCase();
  const random = Math.random().toString(36).toUpperCase().slice(2, 6);
  const baseCode = `${PREFIX}${farmerHash}${plantingHash}${timestamp}${random}`;
  const digits = baseCode
    .split('')
    .filter((c) => /\d/.test(c))
    .map((c) => parseInt(c, 10));
  while (digits.length < 16) {
    digits.push(Math.floor(Math.random() * 10));
  }
  const checkDigit = luhnCheck(digits);
  return `${baseCode}${checkDigit}`;
}

export function validateTraceCode(code: string): boolean {
  if (!code.startsWith(PREFIX)) return false;
  if (code.length < 20) return false;
  const digitsPart = code.slice(0, -1);
  const checkDigit = parseInt(code.slice(-1), 10);
  const digits = digitsPart
    .split('')
    .filter((c) => /\d/.test(c))
    .map((c) => parseInt(c, 10));
  if (digits.length < 16) return false;
  const calculatedCheck = luhnCheck(digits);
  return calculatedCheck === checkDigit;
}

export function parseTraceCode(code: string): {
  prefix: string;
  farmerHash: string;
  plantingHash: string;
  timestamp: string;
  random: string;
  checkDigit: number;
} | null {
  if (!validateTraceCode(code)) return null;
  return {
    prefix: code.slice(0, 5),
    farmerHash: code.slice(5, 9),
    plantingHash: code.slice(9, 13),
    timestamp: code.slice(13, 21),
    random: code.slice(21, 25),
    checkDigit: parseInt(code.slice(-1), 10),
  };
}

export function generateBatchCode(): string {
  const year = new Date().getFullYear();
  const random = Math.random().toString(36).toUpperCase().slice(2, 10);
  return `BATCH${year}${random}`;
}
