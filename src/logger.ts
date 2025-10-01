/* eslint-disable @typescript-eslint/no-explicit-any */

export function logInfo(...args: any[]): void {
  console.info('📘', ...args);
}

export function logError(...args: any[]): void {
  console.error('❌', ...args);
}
