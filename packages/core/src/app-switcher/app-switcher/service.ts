import { provide } from '../../provider';
import { IAppSwitcher, IAppSwitcherKey, AppSwitcherOptions } from './interface';

export * from './interface';

@provide(IAppSwitcherKey)
export class AppSwitcher implements IAppSwitcher {
  public async switch(options: AppSwitcherOptions): Promise<void> {
    console.log(options);
    return Promise.resolve();
  }
}
