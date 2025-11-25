// Salary calculation utilities - matching React exactly

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-BD', {
    style: 'currency',
    currency: 'BDT',
    minimumFractionDigits: 0,
  }).format(amount);
}

export function calculateBasicSalary(grade: number, grade6Basic: number): number {
  if (grade < 1 || grade > 6) return 0;
  return grade6Basic + (6 - grade) * 5000;
}

export function calculateTotalSalary(basic: number) {
  const houseRent = basic * 0.20; // 20%
  const medicalAllowance = basic * 0.15; // 15%
  const gross = basic + houseRent + medicalAllowance;
  return {
    basic: basic,
    houseRent: houseRent,
    medicalAllowance: medicalAllowance,
    gross: Math.round(gross),
    isPaid: false,
  };
}
