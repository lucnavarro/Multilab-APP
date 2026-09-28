# Multilab

Combine gancho, corpo e CTA em variações de vídeo para TikTok Shop — tudo processado no navegador (React + ffmpeg.wasm), sem enviar clipes para nenhum servidor.

## Rodar localmente

```
npm install
npm run dev
```

Abra o endereço que o Vite mostrar (algo como http://localhost:5173).

## Testar

```
npm test
```

## Build de produção

```
npm run build
```

Gera a pasta `dist/`, pronta para qualquer hospedagem estática (Vercel, Netlify, Cloudflare Pages, etc).

## Como funciona

- `src/lib/combinator.ts` — produto cartesiano gancho × corpo × CTA
- `src/lib/guidelines.ts` — checagem heurística de termos proibidos e duração (ajuste as listas para o seu nicho)
- `src/lib/ffmpeg.ts` — normaliza cada clipe uma vez (9:16, 30fps, H.264/AAC) e depois concatena sem re-encode
- `src/App.tsx` + `src/components/` — interface

## Acesso por código (Kiwify área de membros)

O app abre com um portão de código (`src/AccessGate.tsx`) — sem servidor, sem banco de dados.
Só o hash SHA-256 do código fica no app; o código em si nunca aparece no bundle.

1. Gere um código forte e o hash dele: `npm run hash-code` (ou `npm run hash-code -- SEU-CODIGO`)
2. Na Vercel: Settings → Environment Variables → crie `VITE_ACCESS_CODE_HASH` com o hash
3. Faça um redeploy (a variável é embutida no build, então só vale a partir do próximo deploy)
4. Publique o código na área de membros do produto na Kiwify

Para trocar o código: gere um novo, atualize a variável e faça um redeploy. Para dar uns dias de
tolerância, coloque os dois hashes (antigo e novo) separados por vírgula — quem já tinha entrado
volta a ver o portão assim que o hash antigo sai da lista.

## Próximos passos sugeridos

1. ~~Login por código~~ — feito acima. Se um dia o compartilhamento de código virar problema, dá para
   voltar para auth por conta (Supabase + webhook da Kiwify), que já foi prototipado antes.
2. ~~Checkout (Kiwify, Hotmart, Stripe ou Asaas)~~ — feito
3. Biblioteca de roteiros por IA com limite diário
4. Catálogo de produtos em alta (exige fonte de dados do TikTok Shop)

Revise `src/lib/guidelines.ts` com um advogado ou especialista em compliance antes de vender assinaturas — a lista de termos é um ponto de partida, não substitui as políticas oficiais.
