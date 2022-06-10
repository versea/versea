import { IAppService, provide } from '@versea/core';
import { completionPath } from '@versea/plugin-source-entry';
import { inject } from 'inversify';

import { globalEnv } from '../../global-env';
import { IAttributePatch } from './interface';

export * from './interface';

@provide(IAttributePatch)
export class AttributePatch implements IAttributePatch {
  protected _hasPatch = false;

  protected _appService: IAppService;

  constructor(@inject(IAppService) appService: IAppService) {
    this._appService = appService;
  }

  public patch(): void {
    if (this._hasPatch) {
      return;
    }

    const { _appService: appService } = this;

    this._hasPatch = true;
    Element.prototype.setAttribute = function setAttribute(key: string, value: string): void {
      const isSrcProperty = (key === 'src' || key === 'srcset') && /^(img|script)$/i.test(this.tagName);
      const isHrefProperty = key === 'href' && /^link$/i.test(this.tagName);
      const appName = this.__VERSEA_APP_NAME__;
      if (isSrcProperty || isHrefProperty) {
        if (appName) {
          const app = appService.getApp(appName);
          if (app) {
            globalEnv.rawSetAttribute.call(this, key, completionPath(value, app.assetsPublicPath));
            return;
          }
        }
      }

      globalEnv.rawSetAttribute.call(this, key, value);
    };
  }

  public restore(): void {
    this._hasPatch = false;
    Element.prototype.setAttribute = globalEnv.rawSetAttribute;
  }
}
