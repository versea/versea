import { inject, interfaces } from 'inversify';

import { provide } from '../../provider';
import { IAppSwitcherContext, IAppSwitcherContextKey } from '../app-switcher-context/service';
import { IAppSwitcher, IAppSwitcherKey, SwitcherOptions } from './interface';

export * from './interface';

@provide(IAppSwitcherKey)
export class AppSwitcher implements IAppSwitcher {
  protected _AppSwitcherContext: interfaces.Newable<IAppSwitcherContext>;

  protected _currentContext: IAppSwitcherContext | null = null;

  // eslint-disable-next-line @typescript-eslint/naming-convention
  constructor(@inject(IAppSwitcherContextKey) AppSwitcherContext: interfaces.Newable<IAppSwitcherContext>) {
    this._AppSwitcherContext = AppSwitcherContext;
  }

  public async switch(options: SwitcherOptions): Promise<void> {
    const context = this._currentContext;
    this._createContext(options);
    if (context) {
      await context.cancel();
    }
    return this._currentContext?.run();
  }

  protected _createContext(options: SwitcherOptions): void {
    // @ts-expect-error 需要传入参数，但 inversify 这里的参数类型是 never
    this._currentContext = new this._AppSwitcherContext(options);
  }
}
