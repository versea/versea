import { isSupportModuleScript } from '@versea/plugin-source-entry';

export function isImageElement(target: unknown): target is HTMLImageElement {
  return (target as HTMLImageElement)?.tagName?.toUpperCase() === 'IMG';
}

export function isLinkElement(target: unknown): target is HTMLLinkElement {
  return (target as HTMLLinkElement)?.tagName?.toUpperCase() === 'LINK';
}

export function isStyleElement(target: unknown): target is HTMLStyleElement {
  return (target as HTMLStyleElement)?.tagName?.toUpperCase() === 'STYLE';
}

export function isScriptElement(target: unknown): target is HTMLScriptElement {
  return (target as HTMLScriptElement)?.tagName?.toUpperCase() === 'SCRIPT';
}

export const supportModuleScript = isSupportModuleScript();
