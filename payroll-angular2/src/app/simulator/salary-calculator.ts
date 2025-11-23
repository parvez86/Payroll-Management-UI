// Angular copy of React salaryCalculator logic
export function calculateSalary(grade: number, baseSalaryGrade6: number = 30000) {
  const basic = baseSalaryGrade6 + (6 - grade) * 5000;
  const hra = basic * 0.20;
  const medical = basic * 0.15;
  const gross = basic + hra + medical;
  return { basic, hra, medical, gross };
}
