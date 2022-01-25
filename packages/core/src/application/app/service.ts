/* eslint-disable @typescript-eslint/no-explicit-any */
import { ExtensibleEntity } from '@versea/shared';

import { provide } from '../../provider';
import { IApp, IAppKey, AppOptions, AppProps, FunctionalAppProps, AppHooks } from './interface';

export * from './interface';

@provide(IAppKey, 'Constructor')
export class App extends ExtensibleEntity implements IApp {
  public name: string;

  public loadApp: () => Promise<AppHooks>;

  protected props: AppProps;

  constructor(options: AppOptions) {
    super(options);
    this.name = options.name;
    this.props = options.props ?? {};
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    this.loadApp = options.loadApp!;
  }

  /** 获取最终传给子应用 loadApp 和 mount 方法的属性 */
  public getProps(): Record<string, any> {
    const props: Record<string, any> =
      typeof this.props === 'function' ? (this.props as FunctionalAppProps)(this.name) : this.props;
    return {
      ...props,
      name: this.name,
    };
  }
}
