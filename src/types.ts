export type BlockKind = 'hook' | 'body' | 'cta';

export interface Clip {
  id: string;
  kind: BlockKind;
  name: string;
  file: File;
  /** Object URL usado no preview. */
  url: string;
  /** Duração em segundos, lida no navegador. */
  duration: number;
  /** Fala/legenda do clipe, usada só na checagem de diretrizes. */
  text: string;
}

export type Severity = 'error' | 'warning';
export type IssueCode =
  | 'blocked-claim'
  | 'off-app'
  | 'too-short'
  | 'too-long'
  | 'off-sweet-spot'
  | 'out-of-range';

export interface Issue {
  severity: Severity;
  code: IssueCode;
  message: string;
  kind?: BlockKind;
}

export interface Variation {
  id: string;
  hook: Clip;
  body: Clip;
  cta: Clip;
  duration: number;
  issues: Issue[];
}
