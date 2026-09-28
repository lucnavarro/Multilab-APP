import { useEffect, useMemo, useState } from 'react';
import JSZip from 'jszip';
import type { BlockKind, Clip, Variation } from './types';
import { BRAND, KINDS } from './kinds';
import { DEFAULT_OPTIONS, generateVariations, type GenerateOptions } from './lib/combinator';
import { probeClip } from './lib/probe';
import { renderVariation, type Quality } from './lib/ffmpeg';
import { downloadBlob } from './lib/download';
import { pad2 } from './lib/format';
import { Count } from './components/Count';
import { Track } from './components/Track';
import { Preview } from './components/Preview';
import { Variations, type ExportState } from './components/Variations';

const uid = () => (crypto.randomUUID ? crypto.randomUUID().slice(0, 8) : Math.random().toString(36).slice(2, 10));
const IDLE: ExportState = { running: false, status: '', done: 0, total: 0 };

export function App() {
  const [clips, setClips] = useState<Clip[]>([]);
  const [options, setOptions] = useState<GenerateOptions>(DEFAULT_OPTIONS);
  // 720p por padrão: 1080p recodifica cada clipe em Full HD, o que é bem mais
  // lento (sobretudo no celular). O usuário pode subir para 1080p manualmente.
  const [quality, setQuality] = useState<Quality>('720');
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [playing, setPlaying] = useState<Variation | null>(null);
  const [exp, setExp] = useState<ExportState>(IDLE);
  const [error, setError] = useState<string | null>(null);

  const byKind = (kind: BlockKind) => clips.filter((c) => c.kind === kind);
  const counts = { hook: byKind('hook').length, body: byKind('body').length, cta: byKind('cta').length };

  const result = useMemo(
    () => generateVariations(byKind('hook'), byKind('body'), byKind('cta'), options),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [clips, options],
  );

  // Mantém seleção e preview coerentes quando as variações mudam.
  useEffect(() => {
    const ids = new Set(result.approved.map((v) => v.id));
    setSelected((s) => new Set([...s].filter((id) => ids.has(id))));
    setPlaying((p) => (p && ids.has(p.id) ? result.approved.find((v) => v.id === p.id) ?? null : null));
  }, [result]);

  async function addFiles(kind: BlockKind, files: File[]) {
    if (!files.length) return;
    setError(null);
    const settled = await Promise.allSettled(files.map(probeClip));
    const added: Clip[] = [];
    const errors: string[] = [];
    settled.forEach((r, i) => {
      if (r.status === 'fulfilled') {
        added.push({ id: uid(), kind, name: files[i].name, file: files[i], url: r.value.url, duration: r.value.duration, text: '' });
      } else {
        errors.push((r.reason as Error).message);
      }
    });
    setClips((prev) => [...prev, ...added]);
    if (errors.length) setError(errors.join(' '));
  }

  function removeClip(id: string) {
    setClips((prev) => {
      const clip = prev.find((c) => c.id === id);
      if (clip) URL.revokeObjectURL(clip.url);
      return prev.filter((c) => c.id !== id);
    });
  }

  const setText = (id: string, text: string) =>
    setClips((prev) => prev.map((c) => (c.id === id ? { ...c, text } : c)));

  const toggle = (id: string) =>
    setSelected((s) => {
      const next = new Set(s);
      if (!next.delete(id)) next.add(id);
      return next;
    });

  async function runExport(list: Variation[]) {
    if (!list.length || exp.running) return;
    setExp({
      running: true,
      status: 'Baixando o motor de vídeo (~30 MB, só na primeira vez nesta aba)…',
      done: 0,
      total: list.length,
    });
    try {
      const zip = list.length > 1 ? new JSZip() : null;
      for (const [i, v] of list.entries()) {
        const blob = await renderVariation(v, quality, (s) =>
          setExp((e) => ({ ...e, status: `Vídeo ${i + 1} de ${list.length}: ${s}` })),
        );
        const name = `video-${pad2(result.approved.findIndex((a) => a.id === v.id) + 1)}.mp4`;
        if (zip) zip.file(name, blob);
        else downloadBlob(blob, name);
        setExp((e) => ({ ...e, done: i + 1 }));
      }
      if (zip) downloadBlob(await zip.generateAsync({ type: 'blob', compression: 'STORE' }), 'videos.zip');
      setExp({ running: false, status: 'Pronto. Confira a pasta de downloads.', done: list.length, total: list.length });
    } catch (e) {
      setExp({ running: false, status: '', done: 0, total: 0, error: `Falha ao gerar o vídeo. ${(e as Error).message}` });
    }
  }

  return (
    <div className="app">
      <header className="top">
        <span className="brand">{BRAND}</span>
        <span className="tag">Combine gancho, corpo e CTA</span>
      </header>

      <Count counts={counts} approved={result.approved.length} rejected={result.rejected.length} />

      {error && <p className="banner" role="alert">{error}</p>}

      <div className="tracks">
        {KINDS.map((k) => (
          <Track key={k.kind} meta={k} clips={byKind(k.kind)} onAdd={addFiles} onRemove={removeClip} onText={setText} />
        ))}
      </div>

      <div className="output">
        <Preview variation={playing} />
        <Variations
          approved={result.approved}
          rejected={result.rejected}
          selected={selected}
          playingId={playing?.id ?? null}
          options={options}
          quality={quality}
          exp={exp}
          onOptions={setOptions}
          onQuality={setQuality}
          onToggle={toggle}
          onSelectAll={() => setSelected(new Set(result.approved.map((v) => v.id)))}
          onClear={() => setSelected(new Set())}
          onPlay={setPlaying}
          onExport={runExport}
        />
      </div>

      <footer className="foot">
        Seus vídeos ficam no seu aparelho: nada é enviado para servidor. A checagem usa uma lista própria de termos
        e não substitui as políticas oficiais do TikTok Shop.
      </footer>
    </div>
  );
}
