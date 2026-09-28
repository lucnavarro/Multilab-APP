import type { Variation } from '../types';

/** Linha do tempo em miniatura: cada bloco tem a cor e a largura proporcional à duração. */
export function Rail({ v }: { v: Variation }) {
  return (
    <span className="rail" aria-hidden="true">
      {[v.hook, v.body, v.cta].map((c) => (
        <span key={c.kind} className={`seg seg-${c.kind}`} style={{ flex: `${c.duration} 1 0` }} />
      ))}
    </span>
  );
}
