import { ExtensibleEntity, VerseaError, memoizePromise } from '@versea/shared';

import { IAppSwitcherContext } from '../../app-switcher/app-switcher-context/service';
import { IStatusEnum } from '../../constants/status';
import { provide } from '../../provider';
import { IApp, IAppKey, AppOptions, AppDependencies, AppProps, AppHooks, AppOptionsProps } from './interface';

export * from './interface';

@provide(IAppKey, 'Constructor')
export class App extends ExtensibleEntity implements IApp {
  public name: string;

  public status: IStatusEnum[keyof IStatusEnum];

  protected loadApp?: (props: AppProps) => Promise<AppHooks>;

  protected hooks: AppHooks = {};

  protected props: AppOptionsProps;

  // eslint-disable-next-line @typescript-eslint/naming-convention
  protected _StatusEnum: IStatusEnum;

  /**
   * 生成一个 App 实例
   * @param options App 实例化的参数
   * @param dependencies 由于 App 必须继承 ExtensibleEntity，这里无法使用依赖注入，依赖问题必须自己管理。
   */
  constructor(options: AppOptions, dependencies: AppDependencies) {
    super(options);
    this.name = options.name;
    this.props = options.props ?? {};
    this.loadApp = options.loadApp;

    // 绑定依赖
    this._StatusEnum = dependencies.StatusEnum;
    this.status = this._StatusEnum.NotLoaded;
  }

  @memoizePromise()
  public async load(context: IAppSwitcherContext): Promise<void> {
    if (this.status !== this._StatusEnum.NotLoaded && this.status !== this._StatusEnum.LoadError) {
      throw new VerseaError(`Can not load app "${this.name}" with status "${this.status}".`);
    }

    if (!this.loadApp) {
      this.status = this._StatusEnum.SkipBecauseBroken;
      throw new VerseaError(`Can not find loadApp prop on app "${this.name}".`);
    }

    this.status = this._StatusEnum.LoadingSourceCode;
    try {
      const hooks = await this.loadApp(this.getProps(context));
      this.status = this._StatusEnum.NotBootstrapped;
      this.setHooks(hooks);
    } catch (error) {
      this.status = this._StatusEnum.LoadError;
      throw error;
    }
  }

  @memoizePromise()
  public async bootstrap(context: IAppSwitcherContext): Promise<void> {
    if (this.status !== this._StatusEnum.NotBootstrapped) {
      throw new VerseaError(`Can not bootstrap app "${this.name}" with status "${this.status}".`);
    }

    if (!this.hooks.bootstrap) {
      this.status = this._StatusEnum.NotMounted;
      return;
    }

    this.status = this._StatusEnum.Bootstrapping;
    try {
      await this.hooks.bootstrap(this.getProps(context));
      this.status = this._StatusEnum.NotMounted;
    } catch (error) {
      this.status = this._StatusEnum.SkipBecauseBroken;
      throw error;
    }
  }

  @memoizePromise()
  public async mount(context: IAppSwitcherContext): Promise<void> {
    if (this.status !== this._StatusEnum.NotMounted) {
      throw new VerseaError(`Can not mount app "${this.name}" with status "${this.status}".`);
    }

    if (!this.hooks.mount) {
      this.status = this._StatusEnum.Mounted;
      return;
    }

    this.status = this._StatusEnum.Mounting;
    try {
      await this.hooks.mount(this.getProps(context));
      this.status = this._StatusEnum.Mounted;
    } catch (error) {
      this.status = this._StatusEnum.SkipBecauseBroken;
      throw error;
    }
  }

  // TODO: unmount parcel if needed.
  @memoizePromise()
  public async unmount(context: IAppSwitcherContext): Promise<void> {
    if (this.status !== this._StatusEnum.Mounted) {
      throw new VerseaError(`Can not unmount app "${this.name}" with status "${this.status}".`);
    }

    if (!this.hooks.unmount) {
      this.status = this._StatusEnum.NotMounted;
      return;
    }

    this.status = this._StatusEnum.Unmounting;
    try {
      await this.hooks.unmount(this.getProps(context));
      this.status = this._StatusEnum.NotMounted;
    } catch (error) {
      this.status = this._StatusEnum.SkipBecauseBroken;
      throw error;
    }
  }

  public getProps(context: IAppSwitcherContext): AppProps {
    const props: Record<string, unknown> = typeof this.props === 'function' ? this.props(this.name) : this.props;
    return {
      ...props,
      name: this.name,
      app: this,
      context,
    };
  }

  protected setHooks(hooks: AppHooks = {}): void {
    if (process.env.NODE_ENV !== 'production') {
      if (!hooks.bootstrap) {
        console.warn(`App "${this.name}" does not export a valid bootstrap function`);
      }
      if (!hooks.mount) {
        console.warn(`App "${this.name}" does not export a valid mount function`);
      }
      if (!hooks.unmount) {
        console.warn(`App "${this.name}" does not export a valid unmount function`);
      }
    }

    this.hooks = hooks;
  }
}
