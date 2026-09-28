export const fmtSeconds = (s: number): string => `${s.toFixed(1).replace('.', ',')}s`;

export const pad2 = (n: number): string => String(n).padStart(2, '0');
