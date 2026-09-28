import { describe, expect, it } from 'vitest';
import type { BlockKind, Clip } from '../types';
import { DEFAULT_OPTIONS, generateVariations } from './combinator';

const clip = (kind: BlockKind, n: number, duration = 10, text = ''): Clip => ({
  id: `${kind}${n}`,
  kind,
  name: `${kind}${n}.mp4`,
  file: null as unknown as File,
  url: '',
  duration,
  text,
});

const set = (kind: BlockKind, count: number, duration = 10) =>
  Array.from({ length: count }, (_, i) => clip(kind, i + 1, duration));

describe('generateVariations', () => {
  it('3 ganchos × 3 corpos × 3 CTAs = 27 variações únicas', () => {
    const r = generateVariations(set('hook', 3), set('body', 3), set('cta', 3));
    expect(r.total).toBe(27);
    expect(r.approved).toHaveLength(27);
    expect(new Set(r.approved.map((v) => v.id)).size).toBe(27);
  });

  it('devolve vazio quando falta um bloco', () => {
    const r = generateVariations(set('hook', 3), [], set('cta', 3));
    expect(r.total).toBe(0);
    expect(r.approved).toHaveLength(0);
  });

  it('descarta vídeos abaixo de 8s e acima de 60s', () => {
    const short = generateVariations(set('hook', 1, 2), set('body', 1, 2), set('cta', 1, 2));
    expect(short.approved).toHaveLength(0);
    expect(short.rejected[0].issues.some((i) => i.code === 'too-short')).toBe(true);

    const long = generateVariations(set('hook', 1, 25), set('body', 1, 25), set('cta', 1, 25));
    expect(long.rejected[0].issues.some((i) => i.code === 'too-long')).toBe(true);
  });

  it('mantém, com aviso, vídeos fora da faixa ideal de 15s a 45s', () => {
    const r = generateVariations(set('hook', 1, 3), set('body', 1, 3), set('cta', 1, 3));
    expect(r.approved).toHaveLength(1);
    expect(r.approved[0].issues.map((i) => i.code)).toEqual(['off-sweet-spot']);
  });

  it('descarta variações com termo proibido, ignorando acento e caixa', () => {
    const hooks = [clip('hook', 1), clip('hook', 2, 10, 'Esse creme é MILAGROSO')];
    const r = generateVariations(hooks, set('body', 1), set('cta', 1));
    expect(r.approved.map((v) => v.hook.id)).toEqual(['hook1']);
    expect(r.rejected[0].issues[0].code).toBe('blocked-claim');
  });

  it('sinaliza direcionamento para fora do app', () => {
    const ctas = [clip('cta', 1, 10, 'Chama no WhatsApp e vê o link na bio')];
    const r = generateVariations(set('hook', 1), set('body', 1), ctas);
    expect(r.approved).toHaveLength(0);
    const messages = r.rejected[0].issues.map((i) => i.message).join(' ');
    expect(messages).toContain('whatsapp');
    expect(messages).toContain('link na bio');
  });

  it('não confunde palavras parecidas com termos proibidos', () => {
    const bodies = [clip('body', 1, 10, 'Um curativo que cuida da pele, sem segredo')];
    const r = generateVariations(set('hook', 1), bodies, set('cta', 1));
    expect(r.approved).toHaveLength(1);
  });

  it('respeita o filtro de duração do usuário', () => {
    const r = generateVariations(set('hook', 1), set('body', 1), set('cta', 1), {
      ...DEFAULT_OPTIONS,
      minDuration: 40,
    });
    expect(r.approved).toHaveLength(0);
    expect(r.rejected[0].issues.some((i) => i.code === 'out-of-range')).toBe(true);
  });

  it('o limite de variações aproveita todos os ganchos primeiro', () => {
    const r = generateVariations(set('hook', 3), set('body', 3), set('cta', 3), {
      ...DEFAULT_OPTIONS,
      maxVariations: 3,
    });
    expect(r.approved.map((v) => v.hook.id)).toEqual(['hook1', 'hook2', 'hook3']);
  });
});
