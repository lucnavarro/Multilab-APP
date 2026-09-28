import { KINDS } from '../kinds';
import type { BlockKind } from '../types';

interface Props {
  counts: Record<BlockKind, number>;
  approved: number;
  rejected: number;
}

export function Count({ counts, approved, rejected }: Props) {
  const equation = KINDS.map((k) => counts[k.kind]).join(' vezes ');
  return (
    <section className="count" aria-live="polite">
      <div className="count-num">{approved}</div>
      <div className="count-side">
        <p className="count-label">{approved === 1 ? 'vídeo pronto para postar' : 'vídeos prontos para postar'}</p>
        <p className="count-eq" aria-label={equation}>
          {KINDS.map((k, i) => (
            <span key={k.kind} className="count-term">
              {i > 0 && <span className="op" aria-hidden="true">×</span>}
              <span className={`n n-${k.kind}`}>{counts[k.kind]}</span>
            </span>
          ))}
        </p>
        {rejected > 0 && (
          <p className="count-note">
            {rejected} {rejected === 1 ? 'combinação descartada' : 'combinações descartadas'} pelas diretrizes ou pelo filtro de duração.
          </p>
        )}
        {approved === 0 && rejected === 0 && (
          <p className="count-note">Adicione ao menos um clipe em cada bloco para gerar os vídeos.</p>
        )}
      </div>
    </section>
  );
}
