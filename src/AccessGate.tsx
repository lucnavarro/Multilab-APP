import { useState, type FormEvent, type ReactNode } from 'react';
import { BRAND } from './kinds';
import { STORAGE_KEY, normalizeCode, parseHashes, sha256Hex } from './lib/access';

/**
 * Portão de acesso por código, sem servidor e sem banco de dados.
 * O código nunca fica no app: só o hash SHA-256 dele, vindo da variável
 * VITE_ACCESS_CODE_HASH (configurada na Vercel). Para trocar o código,
 * gere um hash novo (npm run hash-code), atualize a variável e faça um redeploy.
 */
const HASHES = parseHashes(import.meta.env.VITE_ACCESS_CODE_HASH as string | undefined);
const SALES_URL = 'https://appmultilab.vercel.app';

function alreadyUnlocked(): boolean {
  // Em desenvolvimento local, sem variável configurada, o app abre livre.
  if (import.meta.env.DEV && HASHES.length === 0) return true;
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    // Se o código foi trocado, o hash salvo deixa de existir na lista e o portão volta.
    return !!saved && HASHES.includes(saved);
  } catch {
    return false;
  }
}

export function AccessGate({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState<boolean>(alreadyUnlocked);
  const [code, setCode] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (open) return <>{children}</>;

  async function submit(e: FormEvent) {
    e.preventDefault();
    if (busy || !code.trim()) return;
    setBusy(true);
    setError(null);
    try {
      const hash = await sha256Hex(normalizeCode(code));
      if (HASHES.includes(hash)) {
        try {
          localStorage.setItem(STORAGE_KEY, hash);
        } catch {
          /* armazenamento bloqueado: entra mesmo assim, só não lembra */
        }
        setOpen(true);
      } else {
        setError('Código incorreto. Confira o código atual na área de membros.');
      }
    } catch {
      setError('Não foi possível validar o código neste navegador. Abra o app por um link https.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="gate">
      <div className="gate-card">
        <span className="brand">{BRAND}</span>
        <h1>Acesse o {BRAND}</h1>
        {HASHES.length === 0 ? (
          <p className="banner" role="alert">
            O acesso ainda não foi configurado. Defina VITE_ACCESS_CODE_HASH na hospedagem e faça um novo deploy.
          </p>
        ) : (
          <form onSubmit={submit} className="gate-form">
            <label htmlFor="access-code" className="gate-label">
              Digite o código de acesso da área de membros.
            </label>
            <input
              id="access-code"
              type="text"
              value={code}
              onChange={(e) => setCode(e.target.value)}
              placeholder="Código de acesso"
              autoComplete="off"
              autoCapitalize="off"
              autoCorrect="off"
              spellCheck={false}
              autoFocus
            />
            <button type="submit" className="btn btn-primary" disabled={busy || !code.trim()}>
              {busy ? 'Verificando…' : 'Entrar'}
            </button>
            {error && (
              <p className="banner" role="alert">
                {error}
              </p>
            )}
          </form>
        )}
        <a className="gate-link" href={SALES_URL}>
          Ainda não tem acesso? Ver planos
        </a>
      </div>
    </main>
  );
}
