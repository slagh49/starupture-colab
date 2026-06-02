/// <reference types="vite/client" />

interface ImportMetaEnv {
  /** Version/build injecté au build (commit court en CI), sinon absent en dev. */
  readonly VITE_APP_VERSION?: string;
}

declare module '*.module.css' {
  const classes: { readonly [key: string]: string };
  export default classes;
}
