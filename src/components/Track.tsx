import { useRef } from 'react';
import type { BlockKind, Clip } from '../types';
import type { KindMeta } from '../kinds';
import { checkText } from '../lib/guidelines';
import { fmtSeconds } from '../lib/format';

interface Props {
  meta: KindMeta;
  clips: Clip[];
  onAdd: (kind: BlockKind, files: File[]) => void;
  onRemove: (id: string) => void;
  onText: (id: string, text: string) => void;
}

export function Track({ meta, clips, onAdd, onRemove, onText }: Props) {
  const input = useRef<HTMLInputElement>(null);
  const headingId = `track-${meta.kind}`;

  return (
    <section className={`track track-${meta.kind}`} aria-labelledby={headingId}>
      <header className="track-head">
        <div>
          <h2 id={headingId}>
            {meta.plural} <span className="track-count">{clips.length}</span>
          </h2>
          <p className="hint">{meta.hint}</p>
        </div>
        <button type="button" className="btn btn-ghost" onClick={() => input.current?.click()}>
          Adicionar clipes
        </button>
        <input
          ref={input}
          type="file"
          accept="video/*"
          multiple
          hidden
          onChange={(e) => {
            onAdd(meta.kind, Array.from(e.target.files ?? []));
            e.target.value = '';
          }}
        />
      </header>

      {clips.length === 0 ? (
        <p className="empty">Nenhum clipe ainda. Adicione vídeos verticais de 3 a 20 segundos.</p>
      ) : (
        <ul className="clips">
          {clips.map((c) => {
            const issues = checkText(c.text, c.kind);
            return (
              <li key={c.id} className="clip">
                <div className="clip-top">
                  <span className="clip-name">{c.name}</span>
                  <span className="clip-dur">{fmtSeconds(c.duration)}</span>
                  <button type="button" className="icon-btn" onClick={() => onRemove(c.id)} aria-label={`Remover ${c.name}`}>
                    ×
                  </button>
                </div>
                <label className="clip-text">
                  <span>Fala do clipe</span>
                  <textarea
                    rows={2}
                    value={c.text}
                    placeholder="Cole o que é dito no clipe. O texto passa pela checagem de diretrizes."
                    onChange={(e) => onText(c.id, e.target.value)}
                  />
                </label>
                {issues.length > 0 && (
                  <ul className="chips">
                    {issues.map((i) => (
                      <li key={i.message} className="chip chip-error">
                        {i.message}
                      </li>
                    ))}
                  </ul>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
