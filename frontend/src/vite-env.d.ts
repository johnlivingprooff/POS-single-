/// <reference types="vite/client" />

interface ImportMetaEnv {
  VITE_API_URL?: string;
  MODE: string;
  DEV: boolean;
  PROD: boolean;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
