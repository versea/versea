import { provide } from '@versea/core';

import { ILoadEvent, ILoadEventKey } from './interface';

export * from './interface';

@provide(ILoadEventKey)
export class LoadEvent implements ILoadEvent {
  public dispatchOnLoadEvent(element: HTMLLinkElement | HTMLScriptElement): void {
    const event = new CustomEvent('load');
    this._setEventTarget(event, element);
    if (typeof element.onload === 'function') {
      element.onload(event);
    } else {
      element.dispatchEvent(event);
    }
  }

  public dispatchOnErrorEvent(element: HTMLLinkElement | HTMLScriptElement): void {
    const event = new CustomEvent('error');
    this._setEventTarget(event, element);
    if (typeof element.onerror === 'function') {
      element.onerror(event);
    } else {
      element.dispatchEvent(event);
    }
  }

  protected _setEventTarget(event: Event, element: HTMLLinkElement | HTMLScriptElement): void {
    Object.defineProperties(event, {
      currentTarget: {
        get() {
          return element;
        },
      },
      srcElement: {
        get() {
          return element;
        },
      },
      target: {
        get() {
          return element;
        },
      },
    });
  }
}
