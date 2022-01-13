/* eslint-disable @typescript-eslint/no-explicit-any */
import { provide } from '../../provider';
import { IApp, IAppKey, AppOptions, AppProps, FunctionalAppProps } from './interface';

export * from './interface';

@provide(IAppKey, 'Constructor')
export class App implements IApp {
  public name: string;

  public path: string;

  public loadApp: () => any;

  protected props: AppProps;

  constructor(options: AppOptions) {
    this.name = options.name;
    this.path = options.path;
    this.props = options.props ?? {};
    this.loadApp = options.loadApp;
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
