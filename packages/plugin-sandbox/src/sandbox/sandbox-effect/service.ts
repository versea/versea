import { provide } from '@versea/core';
import { inject } from 'inversify';

import { ICurrentApp, ICurrentAppKey } from '../../current-app/interface';
// import { globalEnv } from '../../global-env';
import { ISandboxEffect, ISandboxEffectKey } from './interface';

export * from './interface';

@provide(ISandboxEffectKey)
export class SandboxEffect implements ISandboxEffect {
  protected _currentApp: ICurrentApp;

  protected _hasRewriteDocumentOnClick = false;

  constructor(@inject(ICurrentAppKey) currentApp: ICurrentApp) {
    this._currentApp = currentApp;
  }

  public effectDocumentEvent(): void {
    throw new Error('implement');
  }

  // protected _overwriteDocumentOnClick(): void {
  //   if (this._hasRewriteDocumentOnClick) return;

  //   this._hasRewriteDocumentOnClick = true;
  //   if (Object.getOwnPropertyDescriptor(document, 'onclick')) {
  //     return ('Cannot redefine document property onclick');
  //   }
  //   const rawOnClick = document.onclick;
  //   document.onclick = null;
  //   let hasDocumentClickInited = false;

  //   function onClickHandler(e: MouseEvent) {
  //     documentClickListMap.forEach((f) => {
  //       isFunction(f) && (f as Function).call(document, e);
  //     });
  //   }

  //   rawDefineProperty(document, 'onclick', {
  //     configurable: true,
  //     enumerable: true,
  //     get() {
  //       const appName = getCurrentAppName();
  //       return appName ? documentClickListMap.get(appName) : documentClickListMap.get('base');
  //     },
  //     set(f: GlobalEventHandlers['onclick']) {
  //       const appName = getCurrentAppName();
  //       if (appName) {
  //         documentClickListMap.set(appName, f);
  //       } else {
  //         documentClickListMap.set('base', f);
  //       }

  //       if (!hasDocumentClickInited && isFunction(f)) {
  //         hasDocumentClickInited = true;
  //         globalEnv.rawDocumentAddEventListener.call(globalEnv.rawDocument, 'click', onClickHandler, false);
  //       }
  //     },
  //   });

  //   rawOnClick && (document.onclick = rawOnClick);
  // }
}
