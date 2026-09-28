import type { BlockKind, Clip, Issue } from '../types';
import { fmtSeconds } from './format';

/**
 * Checagem HEURÍSTICA: lista própria de termos e faixa de duração.
 * Não substitui as políticas oficiais do TikTok Shop. Ajuste as listas
 * conforme o seu nicho. Termos sem acento e em minúsculas.
 */
export const DURATION = { hardMin: 8, hardMax: 60, sweetMin: 15, sweetMax: 45 } as const;

export const BLOCKED_CLAIMS: readonly string[] = [
  'cura',
  'curar',
  'emagrece',
  'emagrecer',
  'milagre',
  'milagroso',
  'milagrosa',
  'renda garantida',
  'dinheiro facil',
  'ganhe dinheiro rapido',
  'resultado garantido',
  'garantido 100%',
  'fique rico',
  'enriqueca',
  'trata doenca',
  'elimina gordura',
];

export const OFF_APP_TERMS: readonly string[] = [
  'whatsapp',
  'zap',
  'telegram',
  'instagram',
  'link na bio',
  'link da bio',
  'link no perfil',
  'chama no direct',
  'chama no privado',
];

export const normalize = (s: string): string =>
  s.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');

const escapeRe = (s: string): string => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

const buildRe = (terms: readonly string[]): RegExp =>
  new RegExp(`(?:^|[^a-z0-9])(${terms.map(escapeRe).join('|')})(?=[^a-z0-9]|$)`, 'g');

const blockedRe = buildRe(BLOCKED_CLAIMS);
const offAppRe = buildRe(OFF_APP_TERMS);

const found = (text: string, re: RegExp): string[] => [
  ...new Set(Array.from(text.matchAll(re), (m) => m[1])),
];

export function checkText(text: string, kind: BlockKind): Issue[] {
  if (!text.trim()) return [];
  const t = normalize(text);
  const issues: Issue[] = [];
  for (const term of found(t, blockedRe)) {
    issues.push({ severity: 'error', code: 'blocked-claim', kind, message: `Promessa proibida: "${term}"` });
  }
  for (const term of found(t, offAppRe)) {
    issues.push({ severity: 'error', code: 'off-app', kind, message: `Direciona para fora do app: "${term}"` });
  }
  return issues;
}

export function checkDuration(total: number): Issue[] {
  if (total < DURATION.hardMin) {
    return [{ severity: 'error', code: 'too-short', message: `Muito curto (${fmtSeconds(total)}). Mínimo de ${DURATION.hardMin}s.` }];
  }
  if (total > DURATION.hardMax) {
    return [{ severity: 'error', code: 'too-long', message: `Muito longo (${fmtSeconds(total)}). Máximo de ${DURATION.hardMax}s.` }];
  }
  if (total < DURATION.sweetMin || total > DURATION.sweetMax) {
    return [{ severity: 'warning', code: 'off-sweet-spot', message: `Fora da faixa ideal de ${DURATION.sweetMin}s a ${DURATION.sweetMax}s.` }];
  }
  return [];
}

export function checkVariation(clips: readonly [Clip, Clip, Clip], duration: number): Issue[] {
  return [...clips.flatMap((c) => checkText(c.text, c.kind)), ...checkDuration(duration)];
}
