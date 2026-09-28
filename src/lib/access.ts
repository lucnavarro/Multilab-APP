/** Chave do localStorage onde fica o hash do código já aceito neste navegador. */
export const STORAGE_KEY = 'multilab.access';

/** Ignora espaços e maiúsculas: "MLAB-7K3Q 92XD" e "mlab-7k3q92xd" são o mesmo código. */
export const normalizeCode = (s: string): string => s.trim().replace(/\s+/g, '').toLowerCase();

export async function sha256Hex(text: string): Promise<string> {
  const data = new TextEncoder().encode(text);
  const buf = await crypto.subtle.digest('SHA-256', data);
  return Array.from(new Uint8Array(buf), (b) => b.toString(16).padStart(2, '0')).join('');
}

/** Aceita vários hashes separados por vírgula (código atual + o do mês anterior, por exemplo). */
export const parseHashes = (raw: string | undefined): string[] =>
  (raw ?? '')
    .split(',')
    .map((s) => s.trim().toLowerCase())
    .filter(Boolean);
