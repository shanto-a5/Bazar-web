/**
 * Money primitives shared by the mobile app and the API server. Every persisted
 * and transported amount is a 2-decimal number, rounded with the same helper so
 * totals computed in the browser can never disagree with the server by a cent.
 */

export function roundMoney(value: number): number {
  return Math.round(value * 100) / 100;
}

export function sumMoney(values: number[]): number {
  return values.reduce((total, value) => total + value, 0);
}
