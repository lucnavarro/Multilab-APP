import type { Variation } from '../types';
import type { GenerateOptions } from '../lib/combinator';
import type { Quality } from '../lib/ffmpeg';
import { fmtSeconds, pad2 } from '../lib/format';
import { Rail } from './Rail';

export interface ExportState {
  running: boolean;
  status: string;
  done: number;
  total: number;
  error?: string;
}

interface Props {
  approved: Variation[];
  rejected: Variation[];
  selected: Set<string>;
  playingId: string | null;
  options: GenerateOptions;
  quality: Quality;
  exp: ExportState;
  onOptions: (o: GenerateOptions) => void;
  onQuality: (q: Quality) => void;
  onToggle: (id: string) => void;
  onSelectAll: () => void;
  onClear: () => void;
  onPlay: (v: Variation) => void;
  onExport: (list: Variation[]) => void;
}

const num = (s: string, fallback: number) => (Number.isFinite(Number(s)) && s !== '' ? Number(s) : fallback);

export function Variations(p: Props) {
  const chosen = p.approved.filter((v) => p.selected.has(v.id));
  const shownRejected = p.rejected.slice(0, 40);

  return (
    <section className="variations" aria-labelledby="vars-title">
      <h2 id="vars-title">Variações</h2>

      <div className="options">
        <label>
          <span>Duração mínima (s)</span>
          <input type="number" min={0} value={p.options.minDuration} onChange={(e) => p.onOptions({ ...p.options, minDuration: num(e.target.value, 8) })} />
        </label>
        <label>
          <span>Duração máxima (s)</span>
          <input type="number" min={0} value={p.options.maxDuration} onChange={(e) => p.onOptions({ ...p.options, maxDuration: num(e.target.value, 60) })} />
        </label>
        <label>
          <span>Limite de vídeos</span>
          <input type="number" min={1} value={p.options.maxVariations} onChange={(e) => p.onOptions({ ...p.options, maxVariations: num(e.target.value, 100) })} />
        </label>
        <label>
          <span>Qualidade</span>
          <select value={p.quality} onChange={(e) => p.onQuality(e.target.value as Quality)}>
            <option value="1080">1080p Full HD</option>
            <option value="720">720p, mais rápido</option>
          </select>
        </label>
      </div>

      {p.approved.length > 0 && (
        <div className="bulk">
          <button type="button" className="btn btn-ghost" onClick={p.onSelectAll}>Selecionar todas</button>
          <button type="button" className="btn btn-ghost" onClick={p.onClear} disabled={chosen.length === 0}>Limpar</button>
          <button type="button" className="btn btn-primary" onClick={() => p.onExport(chosen)} disabled={chosen.length === 0 || p.exp.running}>
            Baixar {chosen.length > 0 ? chosen.length : ''} {chosen.length > 1 ? 'em ZIP' : ''}
          </button>
        </div>
      )}

      {(p.exp.running || p.exp.status || p.exp.error) && (
        <div className="export-status" role="status">
          {p.exp.error ? (
            <p className="error-text">{p.exp.error}</p>
          ) : (
            <>
              <p>{p.exp.status}</p>
              {p.exp.total > 1 && (
                <progress max={p.exp.total} value={p.exp.done} aria-label="Progresso da exportação" />
              )}
            </>
          )}
        </div>
      )}
      {p.approved.length > 0 && (
        <p className="hint">A primeira exportação prepara cada clipe e demora mais. As seguintes usam os clipes já preparados e são rápidas.</p>
      )}

      <ul className="var-list">
        {p.approved.map((v, i) => (
          <li key={v.id} className={`var${p.playingId === v.id ? ' is-playing' : ''}`}>
            <input
              type="checkbox"
              checked={p.selected.has(v.id)}
              onChange={() => p.onToggle(v.id)}
              aria-label={`Selecionar vídeo ${pad2(i + 1)}`}
            />
            <button type="button" className="var-main" onClick={() => p.onPlay(v)}>
              <span className="var-title">Vídeo {pad2(i + 1)}</span>
              <Rail v={v} />
              <span className="var-meta">
                <span>{fmtSeconds(v.duration)}</span>
                {v.issues.map((iss) => (
                  <span key={iss.code} className="chip chip-warn">{iss.message}</span>
                ))}
              </span>
            </button>
            <button type="button" className="btn btn-small" onClick={() => p.onExport([v])} disabled={p.exp.running}>
              Baixar
            </button>
          </li>
        ))}
      </ul>

      {p.rejected.length > 0 && (
        <details className="rejected">
          <summary>Descartadas ({p.rejected.length})</summary>
          <ul className="var-list">
            {shownRejected.map((v) => (
              <li key={v.id} className="var var-rejected">
                <span className="var-main">
                  <Rail v={v} />
                  <span className="var-meta">
                    <span>{fmtSeconds(v.duration)}</span>
                    {[...new Set(v.issues.filter((i) => i.severity === 'error').map((i) => i.message))].slice(0, 2).map((m) => (
                      <span key={m} className="chip chip-error">{m}</span>
                    ))}
                  </span>
                </span>
              </li>
            ))}
          </ul>
          {p.rejected.length > shownRejected.length && (
            <p className="hint">e mais {p.rejected.length - shownRejected.length} descartadas.</p>
          )}
        </details>
      )}
    </section>
  );
}
