/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_CONNECT_API?: string;
}

declare module "*.md?raw" {
  const content: string;
  export default content;
}
