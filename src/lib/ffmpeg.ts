import { FFmpeg } from '@ffmpeg/ffmpeg';
import { fetchFile, toBlobURL } from '@ffmpeg/util';
import type { Clip, Variation } from '../types';
import { KINDS } from '../kinds';

/**
 * Núcleo single-thread: não exige headers COOP/COEP, então roda em qualquer
 * hospedagem estática. Para produção, copie estes dois arquivos para /public
 * e aponte CORE_BASE para eles, em vez de depender do CDN.
 */
const CORE_BASE = 'https://cdn.jsdelivr.net/npm/@ffmpeg/core@0.12.10/dist/esm';

export type Quality = '1080' | '720';
const SIZE: Record<Quality, [number, number]> = { '1080': [1080, 1920], '720': [720, 1280] };

const ff = new FFmpeg();
let loading: Promise<void> | null = null;
let logs: string[] = [];
/** clip.id@qualidade -> nome do arquivo já normalizado no sistema de arquivos do wasm. */
const normalized = new Map<string, string>();

export function loadFFmpeg(): Promise<void> {
  if (!loading) {
    loading = (async () => {
      ff.on('log', ({ message }) => {
        logs.push(message);
      });
      await ff.load({
        coreURL: await toBlobURL(`${CORE_BASE}/ffmpeg-core.js`, 'text/javascript'),
        wasmURL: await toBlobURL(`${CORE_BASE}/ffmpeg-core.wasm`, 'application/wasm'),
      });
    })().catch((e) => {
      loading = null;
      throw e;
    });
  }
  return loading;
}

/** `ffmpeg -i arquivo` falha (sem saída), mas o log lista as streams. */
async function hasAudio(name: string): Promise<boolean> {
  logs = [];
  await ff.exec(['-i', name]);
  return logs.some((l) => /Stream #\d+:\d+.*Audio:/.test(l));
}

/**
 * Converte o clipe UMA vez para 9:16, 30 fps, H.264 + AAC estéreo.
 * Com todos os clipes no mesmo formato, cada combinação vira uma
 * concatenação sem re-encode (segundos, não minutos).
 */
async function normalizeClip(clip: Clip, quality: Quality, onStatus: (s: string) => void): Promise<string> {
  const key = `${clip.id}@${quality}`;
  const cached = normalized.get(key);
  if (cached) return cached;

  const label = KINDS.find((k) => k.kind === clip.kind)?.label ?? 'clipe';
  onStatus(`preparando ${label.toLowerCase()} (só na primeira vez)`);

  const [w, h] = SIZE[quality];
  const ext = clip.file.name.match(/\.[a-z0-9]+$/i)?.[0] ?? '.mp4';
  const input = `in_${clip.id}${ext}`;
  const output = `norm_${clip.id}_${quality}.mp4`;
  await ff.writeFile(input, await fetchFile(clip.file));

  const vf =
    `scale=${w}:${h}:force_original_aspect_ratio=decrease,` +
    `pad=${w}:${h}:(ow-iw)/2:(oh-ih)/2:color=black,setsar=1,fps=30,format=yuv420p`;
  const video = ['-vf', vf, '-c:v', 'libx264', '-preset', 'veryfast', '-crf', '21'];
  const audio = ['-c:a', 'aac', '-ar', '44100', '-ac', '2', '-b:a', '128k'];

  const withAudio = await hasAudio(input);
  const args = withAudio
    ? ['-i', input, ...video, ...audio, '-movflags', '+faststart', output]
    : [
        '-i', input,
        '-f', 'lavfi', '-i', 'anullsrc=r=44100:cl=stereo',
        '-map', '0:v:0', '-map', '1:a:0',
        ...video, ...audio, '-shortest', '-movflags', '+faststart', output,
      ];

  const code = await ff.exec(args);
  await ff.deleteFile(input);
  if (code !== 0) throw new Error(`O ffmpeg não conseguiu converter "${clip.name}".`);

  normalized.set(key, output);
  return output;
}

export async function renderVariation(
  v: Variation,
  quality: Quality,
  onStatus: (s: string) => void,
): Promise<Blob> {
  await loadFFmpeg();

  const names: string[] = [];
  for (const clip of [v.hook, v.body, v.cta]) {
    names.push(await normalizeClip(clip, quality, onStatus));
  }

  onStatus('juntando os clipes');
  const list = 'list.txt';
  const out = `out_${Date.now()}.mp4`;
  await ff.writeFile(list, names.map((n) => `file '${n}'`).join('\n'));
  const code = await ff.exec(['-f', 'concat', '-safe', '0', '-i', list, '-c', 'copy', '-movflags', '+faststart', out]);
  await ff.deleteFile(list);
  if (code !== 0) throw new Error('O ffmpeg não conseguiu juntar os clipes.');

  const data = (await ff.readFile(out)) as Uint8Array;
  await ff.deleteFile(out);
  return new Blob([data as BlobPart], { type: 'video/mp4' });
}

/** Libera a memória do wasm (clipes já normalizados). */
export async function resetRenderCache(): Promise<void> {
  for (const name of normalized.values()) {
    try {
      await ff.deleteFile(name);
    } catch {
      /* já removido */
    }
  }
  normalized.clear();
}
