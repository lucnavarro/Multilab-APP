import type { BlockKind } from './types';

/** Nome de trabalho do produto. Troque aqui e no index.html. */
export const BRAND = 'Multilab';

export interface KindMeta {
  kind: BlockKind;
  label: string;
  plural: string;
  hint: string;
}

export const KINDS: KindMeta[] = [
  { kind: 'hook', label: 'Gancho', plural: 'Ganchos', hint: 'Os primeiros segundos. Precisa prender a atenção.' },
  { kind: 'body', label: 'Corpo', plural: 'Corpos', hint: 'Mostra o produto em uso e a prova de que funciona.' },
  { kind: 'cta', label: 'CTA', plural: 'CTAs', hint: 'Diz o que fazer agora, como tocar no carrinho.' },
];
