import type { Clip, Issue, Variation } from '../types';
import { checkVariation } from './guidelines';
import { fmtSeconds } from './format';

export interface GenerateOptions {
  /** Filtro do usuário, em segundos. */
  minDuration: number;
  maxDuration: number;
  /** Máximo de vídeos aprovados devolvidos. */
  maxVariations: number;
}

export interface GenerateResult {
  approved: Variation[];
  rejected: Variation[];
  /** Tamanho do produto cartesiano (h × b × c). */
  total: number;
}

export const DEFAULT_OPTIONS: GenerateOptions = { minDuration: 8, maxDuration: 60, maxVariations: 100 };

/**
 * Produto cartesiano gancho × corpo × CTA.
 * Ordem: o gancho varia mais rápido, então um limite de variações
 * ainda aproveita todos os ganchos antes de repetir corpo/CTA.
 */
export function generateVariations(
  hooks: readonly Clip[],
  bodies: readonly Clip[],
  ctas: readonly Clip[],
  opts: GenerateOptions = DEFAULT_OPTIONS,
): GenerateResult {
  const total = hooks.length * bodies.length * ctas.length;
  const approved: Variation[] = [];
  const rejected: Variation[] = [];

  for (const cta of ctas) {
    for (const body of bodies) {
      for (const hook of hooks) {
        const duration = hook.duration + body.duration + cta.duration;
        const issues: Issue[] = checkVariation([hook, body, cta], duration);
        const hasDurationError = issues.some((i) => i.code === 'too-short' || i.code === 'too-long');
        if (!hasDurationError && (duration < opts.minDuration || duration > opts.maxDuration)) {
          issues.push({
            severity: 'error',
            code: 'out-of-range',
            message: `Fora do filtro de duração (${fmtSeconds(duration)}).`,
          });
        }
        const variation: Variation = { id: `${hook.id}.${body.id}.${cta.id}`, hook, body, cta, duration, issues };
        if (issues.some((i) => i.severity === 'error')) rejected.push(variation);
        else approved.push(variation);
      }
    }
  }

  return { approved: approved.slice(0, Math.max(0, opts.maxVariations)), rejected, total };
}
