import { createServiceSymbol, IApp } from '@versea/core';
import { interfaces } from 'inversify';

import { ICurrentApp } from '../../current-app/interface';
import { IElementPatch } from '../../patch/element-patch/interface';
import { IDocumentEffect } from '../document-effect/interface';
import { ISandboxEffect } from '../sandbox-effect/interface';
import { IWindowEffect } from '../window-effect/interface';
import { VerseaAppWindow } from './types';

export const ISandbox = createServiceSymbol('ISandbox');

export interface ISandbox {
  /** 被代理成 window 的对象 */
  appWindow: VerseaAppWindow;

  /** 代理 window */
  proxyWindow: VerseaAppWindow;

  /** 无论如何都只能从当前 window 取值的属性 */
  scopeProperties: PropertyKey[];

  /** 需要 escape 到 rawWindow 的属性 */
  escapeProperties: PropertyKey[];

  /** 启动沙箱 */
  start: () => void;

  /** 停止沙箱 */
  stop: () => void;

  /** 记录当前沙箱的快照 */
  recordSnapshot: () => void;

  /** 重置之前沙箱的快照 */
  rebuildSnapshot: () => void;
}

export interface SandboxOptions {
  app: IApp;
}

export interface SandboxDependencies {
  currentApp: ICurrentApp;
  documentEffect: IDocumentEffect;
  /* eslint-disable @typescript-eslint/naming-convention */
  WindowEffect: interfaces.Newable<IWindowEffect>;
  SandboxEffect: interfaces.Newable<ISandboxEffect>;
  /* eslint-enable @typescript-eslint/naming-convention */
  elementPatch: IElementPatch;
}
