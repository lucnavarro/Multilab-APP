import { useEffect, useRef, useState } from 'react';
import type { Variation } from '../types';
import { KINDS } from '../kinds';

/** Toca os três clipes em sequência num único <video>, no formato 9:16. */
export function Preview({ variation }: { variation: Variation | null }) {
  const ref = useRef<HTMLVideoElement>(null);
  const [idx, setIdx] = useState(0);
  const [progress, setProgress] = useState(0);
  // Começa como "pausado": até o navegador confirmar que o play() realmente
  // rodou (evento onPlay), assumimos que pode ter sido bloqueado. Sem isso,
  // um autoplay bloqueado deixava a tela preta sem nenhum botão para tocar.
  const [paused, setPaused] = useState(true);
  const [ended, setEnded] = useState(false);

  const clips = variation ? [variation.hook, variation.body, variation.cta] : [];

  function playBlock(i: number) {
    const video = ref.current;
    if (!video || !variation) return;
    setIdx(i);
    setProgress(0);
    setEnded(false);
    setPaused(true);
    video.src = clips[i].url;
    video.play().catch(() => setPaused(true));
  }

  useEffect(() => {
    if (variation) playBlock(0);
    else ref.current?.removeAttribute('src');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [variation?.id]);

  function toggle() {
    const video = ref.current;
    if (!video || !variation) return;
    if (ended) return playBlock(0);
    if (video.paused) video.play().catch(() => undefined);
    else video.pause();
  }

  return (
    <div className="preview">
      <div className="preview-bars" aria-hidden="true">
        {KINDS.map((k, i) => (
          <span key={k.kind} className={`pbar pbar-${k.kind}`}>
            <span className="pfill" style={{ transform: `scaleX(${idx > i ? 1 : idx === i ? progress : 0})` }} />
          </span>
        ))}
      </div>
      <video
        ref={ref}
        playsInline
        onClick={toggle}
        onPlay={() => setPaused(false)}
        onPause={() => setPaused(true)}
        onTimeUpdate={(e) => setProgress(e.currentTarget.currentTime / (e.currentTarget.duration || 1))}
        onEnded={() => (idx < 2 ? playBlock(idx + 1) : setEnded(true))}
      />
      {!variation && <p className="preview-empty">Escolha um vídeo da lista para assistir.</p>}
      {variation && (paused || ended) && (
        <button type="button" className="preview-play" onClick={toggle}>
          {ended ? 'Assistir de novo' : progress > 0 ? 'Continuar' : 'Tocar vídeo'}
        </button>
      )}
    </div>
  );
}
