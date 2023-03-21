import { HookContext } from '@versea/tapable';

import { IApp } from '../application/app/interface';
import { createServiceSymbol } from '../utils';

export const IPrefetchService = createServiceSymbol('IPrefetchService');

export interface IPrefetchService {
  /** prefetch 应用 */
  fetch: (apps: string[], options?: PrefetchOptions) => void;
}

// eslint-disable-next-line @typescript-eslint/no-empty-interface
export interface PrefetchOptions {}

export interface PrefetchHookContext extends HookContext {
  apps: IApp[];
  options?: PrefetchOptions;
}
