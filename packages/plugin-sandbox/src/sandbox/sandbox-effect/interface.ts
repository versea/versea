import { createServiceSymbol } from '@versea/core';
import { interfaces } from 'inversify';

import { ICurrentApp } from '../../current-app/interface';
import { IDocumentEffect } from '../document-effect/interface';
import { VerseaAppWindow } from '../sandbox/types';
import { IWindowEffect } from '../window-effect/interface';

export const ISandboxEffect = createServiceSymbol('ISandboxEffect');

export interface ISandboxEffect {
  /** 生成副作用函数的记录 */
  recordEffect: () => void;

  /** 应用 remount 时重建副作用 */
  rebuildEffect: () => void;

  /** 应用 unmount 时撤销副作用 */
  releaseEffect: () => void;
}

export interface SandboxEffectOptions {
  proxyWindow: VerseaAppWindow;
}

export interface SandboxEffectDependencies {
  currentApp: ICurrentApp;
  documentEffect: IDocumentEffect;
  // eslint-disable-next-line @typescript-eslint/naming-convention
  WindowEffect: interfaces.Newable<IWindowEffect>;
}
