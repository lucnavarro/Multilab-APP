/** Lê a duração do vídeo no navegador, sem enviar nada para servidor. */
export function probeClip(file: File): Promise<{ url: string; duration: number }> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const video = document.createElement('video');
    video.preload = 'metadata';
    video.muted = true;
    video.playsInline = true;

    const fail = () => {
      URL.revokeObjectURL(url);
      reject(new Error(`Não foi possível ler "${file.name}". Use um vídeo MP4 ou MOV.`));
    };

    video.onloadedmetadata = () => {
      if (!Number.isFinite(video.duration) || video.duration <= 0) return fail();
      resolve({ url, duration: video.duration });
    };
    video.onerror = fail;
    video.src = url;
  });
}
