import { IApp, IConfig, IStarter, provide } from '@versea/core';
import { inject } from 'inversify';
import { snakeCase } from 'snake-case';

import { globalEnv } from '../global-env';
import { IInternalApp, LoadAppHookContext, MountAppHookContext, UnmountAppHookContext } from '../plugin/interface';
import { IContainerRenderer } from './interface';

export * from './interface';

@provide(IContainerRenderer)
export class ContainerRender implements IContainerRenderer {
  protected _config: IConfig;

  protected _starter: IStarter;

  protected _hasInjectVerseaAppStyle = false;

  constructor(@inject(IConfig) config: IConfig, @inject(IStarter) starter: IStarter) {
    this._config = config;
    this._starter = starter;
  }

  public createContainerElement(app: IApp): HTMLElement {
    const wrapperElement = globalEnv.rawCreateElement.call(document, 'div');
    wrapperElement.innerHTML = this._getAppContent(app);
    return wrapperElement.firstChild as HTMLElement;
  }

  public getWrapperId(name: string): string {
    return `__versea_app_for_${snakeCase(name)}__`;
  }

  public renderContainer(
    context: LoadAppHookContext | MountAppHookContext | UnmountAppHookContext,
    container = context.app.container,
  ): boolean {
    if ((context.app as IInternalApp)._disableRenderContent) {
      if (!document.body.contains(container as Node | null)) {
        if (container) {
          globalEnv.rawAppendChild.call(document.body, container);
        } else if (context.app.container && document.body.contains(context.app.container)) {
          globalEnv.rawRemoveChild.call(document.body, context.app.container);
        }
      }
      return true;
    }

    // 未执行 start 时不触发渲染
    if (!this._starter.isStarted) {
      return false;
    }

    const parentContainerElement = this._getParentContainerElement(context);
    if (parentContainerElement && !parentContainerElement.contains(container as Node | null)) {
      // 清空元素
      while (parentContainerElement.firstChild) {
        globalEnv.rawRemoveChild.call(parentContainerElement, parentContainerElement.firstChild);
      }

      if (container) {
        globalEnv.rawAppendChild.call(parentContainerElement, container);
      }
    }

    return !!parentContainerElement;
  }

  protected _getAppContent(app: IApp): string {
    this._injectVerseaAppStyle();
    const {
      name,
      _documentFragment: documentFragment,
      documentFragmentWrapperClass,
      _disableRenderContent: disableRenderContent,
    } = app as IInternalApp;

    let content = '';
    if (!documentFragment || disableRenderContent) {
      content = `<versea-app-head></versea-app-head><versea-app-body${
        disableRenderContent ? ' style="display: none;"' : ''
      }><div id="${name}"></div></versea-app-body>`;
    } else {
      const headRegExpArray = /<head[^>]*>([\s\S]*?)<\/head>/i.exec(documentFragment);
      const headContent = `<versea-app-head>${headRegExpArray ? headRegExpArray[1] : ''}</versea-app-head>`;
      const bodyRegExpArray = /<body[^>]*>([\s\S]*?)<\/body>/i.exec(documentFragment);
      const bodyContent = `<versea-app-body>${bodyRegExpArray ? bodyRegExpArray[1] : ''}</versea-app-body>`;
      content = headContent + bodyContent;
    }

    return `<div id="${this.getWrapperId(name)}"${
      documentFragmentWrapperClass ? ` class="${documentFragmentWrapperClass}"` : ''
    } data-name="${name}">${content}</div>`;
  }

  protected _getParentContainerElement(
    context: LoadAppHookContext | MountAppHookContext | UnmountAppHookContext,
  ): HTMLElement | null {
    const { app, props } = context;

    // 从 route 获取容器
    if (props.route) {
      const meta = props.route.getMeta(app);
      if (meta.parentContainerName) {
        return this._queryParentContainerElement(`#${meta.parentContainerName}`);
      }
    }

    if ((app as IInternalApp)._parentContainer) {
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      return this._queryParentContainerElement((app as IInternalApp)._parentContainer!);
    }

    // 获取默认容器
    if (props.route?.apps[0] === app && this._config.defaultContainer) {
      return this._queryParentContainerElement(this._config.defaultContainer);
    }

    return null;
  }

  protected _queryParentContainerElement(selector: string): HTMLElement | null {
    return globalEnv.rawQuerySelector.call(document, selector) as HTMLElement | null;
  }

  /** 增加自定义元素样式 */
  protected _injectVerseaAppStyle(): void {
    if (!this._hasInjectVerseaAppStyle) {
      this._hasInjectVerseaAppStyle = true;
      const style = globalEnv.rawCreateElement.call(document, 'style');
      globalEnv.rawSetAttribute.call(style, 'type', 'text/css');
      style.textContent = `versea-app-body { display: block; } \nversea-app-head { display: none; }`;
      document.head.appendChild(style);
    }
  }
}
