declare module 'react/jsx-runtime' {
  export const Fragment: unique symbol
  export function jsx(type: any, props: any, key?: string): any
  export function jsxs(type: any, props: any, key?: string): any
  export function jsxDEV(
    type: any,
    props: any,
    key?: string,
    isStaticChildren?: boolean,
    source?: { fileName?: string; lineNumber?: number; columnNumber?: number },
    self?: any
  ): any
}
