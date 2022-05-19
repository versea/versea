/* eslint-disable @typescript-eslint/unbound-method */
import { isBrowser } from '@versea/shared';

interface GlobalEnv {
  rawAppendChild: typeof Element.prototype.appendChild;
  rawRemoveChild: typeof Element.prototype.removeChild;
  rawSetAttribute: typeof Element.prototype.setAttribute;
  rawCreateElement: typeof Document.prototype.createElement;
  rawQuerySelector: typeof Document.prototype.querySelector;
  rawGetElementsByTagName: typeof Document.prototype.getElementsByTagName;
}

export const globalEnv: GlobalEnv = {} as GlobalEnv;

if (isBrowser) {
  Object.assign(globalEnv, {
    rawAppendChild: Element.prototype.appendChild,
    rawRemoveChild: Element.prototype.removeChild,
    rawSetAttribute: Element.prototype.setAttribute,
    rawCreateElement: Document.prototype.createElement,
    rawQuerySelector: Document.prototype.querySelector,
    rawGetElementsByTagName: Document.prototype.getElementsByTagName,
  });
}
