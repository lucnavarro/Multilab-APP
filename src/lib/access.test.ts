import { describe, expect, it } from 'vitest';
import { normalizeCode, parseHashes, sha256Hex } from './access';

describe('normalizeCode', () => {
  it('ignora espaços, maiúsculas e espaços nas pontas', () => {
    expect(normalizeCode('  MLAB-7K3Q 92XD ')).toBe('mlab-7k3q92xd');
  });
});

describe('sha256Hex', () => {
  it('bate com o vetor de teste conhecido do SHA-256', async () => {
    expect(await sha256Hex('abc')).toBe('ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad');
  });
});

describe('parseHashes', () => {
  it('separa por vírgula, limpa e ignora vazios', () => {
    expect(parseHashes(' AA, bb ,,')).toEqual(['aa', 'bb']);
  });
  it('devolve lista vazia quando não há variável', () => {
    expect(parseHashes(undefined)).toEqual([]);
    expect(parseHashes('')).toEqual([]);
  });
});
