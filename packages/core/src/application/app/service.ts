import { ExtensibleEntity } from '@versea/shared';

import { provide } from '../../provider';
import { IApp, IAppKey, AppOptions, AppProps, AppHooks } from './interface';

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

  public getProps(): Record<string, unknown> {
    const props: Record<string, unknown> = typeof this.props === 'function' ? this.props(this.name) : this.props;
    return {
      ...props,
      name: this.name,
    };
  }
}
