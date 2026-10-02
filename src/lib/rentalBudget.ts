export interface RentalBudget { rent: string; bills: string; deposit: string; moving: string }
/** Arithmetic from the visitor's own figures; no market estimates or storage. */
export function calculateRentalBudget(input: RentalBudget): { monthly: number; initial: number } | null {
  const amounts = [input.rent, input.bills, input.deposit, input.moving];
  if (amounts.some(value => !value.trim() || !/^\d+(?:[.,]\d{1,2})?$/.test(value.trim()))) return null;
  const cents = amounts.map(value => Math.round(Number(value.replace(',', '.')) * 100));
  if (cents.some(value => !Number.isSafeInteger(value) || value < 0 || value > 100000000)) return null;
  const [rent, bills, deposit, moving] = cents;
  return { monthly: (rent + bills) / 100, initial: (rent + bills + deposit + moving) / 100 };
}
