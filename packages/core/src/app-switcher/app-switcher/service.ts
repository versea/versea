import { provide } from '../../provider';
import { IAppSwitcher, IAppSwitcherKey, SwitcherOptions } from './interface';

export * from './interface';

@provide(IAppSwitcherKey)
export class AppSwitcher implements IAppSwitcher {
  public async switch(options: SwitcherOptions): Promise<void> {
    console.log(options);
    return Promise.resolve();
  }
}
