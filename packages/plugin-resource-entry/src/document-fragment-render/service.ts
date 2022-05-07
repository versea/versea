import { AppConfig, IApp, provide } from '@versea/core';
import { snakeCase } from 'snake-case';

import { IContainerRender, IContainerRenderKey } from './interface';

export * from './interface';

@provide(IContainerRenderKey)
export class ContainerRender implements IContainerRender {
  public createElement(app: IApp, config: AppConfig): HTMLElement {
    const wrapperElement = document.createElement('div');
    wrapperElement.innerHTML = this._getAppContent(app.name, config.documentFragment);
    return wrapperElement.firstChild as HTMLElement;
  }

  public getWrapperId(name: string): string {
    return `__versea_app_for_${snakeCase(name)}__`;
  }

  protected _getAppContent(name: string, documentFragment?: string): string {
    const content = documentFragment ?? `<div id="${name}"></div>`;
    return `<div id="${this.getWrapperId(name)}" data-name="${name}">${content}</div>`;
  }
}
