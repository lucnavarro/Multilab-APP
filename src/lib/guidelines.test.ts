import { describe, expect, it } from 'vitest';
import { checkDuration, checkText, normalize } from './guidelines';

describe('normalize', () => {
  it('remove acentos e põe em minúsculas', () => {
    expect(normalize('DINHEIRO FÁCIL')).toBe('dinheiro facil');
  });
});

describe('checkText', () => {
  it('ignora texto vazio', () => {
    expect(checkText('   ', 'hook')).toEqual([]);
  });

  it('marca promessa de renda e dinheiro fácil', () => {
    const codes = checkText('Renda garantida e dinheiro fácil', 'cta').map((i) => i.code);
    expect(codes).toEqual(['blocked-claim', 'blocked-claim']);
  });

  it('não repete o mesmo termo', () => {
    expect(checkText('cura, cura, cura', 'hook')).toHaveLength(1);
  });

  it('marca "link na bio" mesmo com pontuação', () => {
    expect(checkText('Corre! Link na bio.', 'cta')[0].code).toBe('off-app');
  });
});

describe('checkDuration', () => {
  it('aceita a faixa ideal sem avisos', () => {
    expect(checkDuration(30)).toEqual([]);
  });
  it('avisa entre 8s-15s e 45s-60s', () => {
    expect(checkDuration(10)[0].severity).toBe('warning');
    expect(checkDuration(50)[0].severity).toBe('warning');
  });
  it('reprova abaixo de 8s e acima de 60s', () => {
    expect(checkDuration(7.9)[0].severity).toBe('error');
    expect(checkDuration(60.1)[0].severity).toBe('error');
  });
});
