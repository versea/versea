import { ExtensibleEntity, VerseaError, memoizePromise } from '@versea/shared';

import { provide } from '../../provider';
import { IStatusEnum } from './constants';
import { IApp, IAppKey, AppOptions, AppDependencies, AppProps, AppHooks } from './interface';

export * from './interface';
export * from './constants';

@provide(IAppKey, 'Constructor')
export class App extends ExtensibleEntity implements IApp {
  public name: string;

  protected loadApp?: (props: Record<string, unknown>) => Promise<AppHooks>;

  protected bootstrapApp?: (props: Record<string, unknown>) => Promise<unknown>;

  protected mountApp?: (props: Record<string, unknown>) => Promise<unknown>;

  protected unmountApp?: (props: Record<string, unknown>) => Promise<unknown>;

  protected unloadApp?: (props: Record<string, unknown>) => Promise<unknown>;

  protected props: AppProps;

  // eslint-disable-next-line @typescript-eslint/naming-convention
  protected _StatusEnum: IStatusEnum;

  protected status: IStatusEnum[keyof IStatusEnum];

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
  public async load(): Promise<void> {
    if (this.status !== this._StatusEnum.NotLoaded && this.status !== this._StatusEnum.LoadError) {
      return;
    }

    if (!this.loadApp) {
      this.status = this._StatusEnum.SkipBecauseBroken;
      throw new VerseaError(`Can not find loadApp prop on app "${this.name}".`);
    }

    this.status = this._StatusEnum.LoadingSourceCode;
    try {
      const hooks = await this.loadApp(this.getProps());
      this.status = this._StatusEnum.NotBootstrapped;
      this.setHooks(hooks);
    } catch (error) {
      this.status = this._StatusEnum.LoadError;
      throw error;
    }
  }

  @memoizePromise()
  public async bootstrap(): Promise<void> {
    if (!this.bootstrapApp || this.status !== this._StatusEnum.NotBootstrapped) {
      return;
    }

    this.status = this._StatusEnum.Bootstrapping;
    try {
      await this.bootstrapApp(this.getProps());
      this.status = this._StatusEnum.NotMounted;
    } catch (error) {
      this.status = this._StatusEnum.SkipBecauseBroken;
      throw error;
    }
  }

  @memoizePromise()
  public async mount(): Promise<void> {
    if (!this.mountApp || this.status !== this._StatusEnum.NotMounted) {
      return;
    }

    this.status = this._StatusEnum.Mounting;
    try {
      await this.mountApp(this.getProps());
      this.status = this._StatusEnum.Mounted;
    } catch (error) {
      this.status = this._StatusEnum.SkipBecauseBroken;
      throw error;
    }
  }

  // TODO: unmount parcel if needed.
  @memoizePromise()
  public async unmount(): Promise<void> {
    if (!this.mountApp || this.status !== this._StatusEnum.NotMounted) {
      return;
    }

    this.status = this._StatusEnum.Mounting;
    try {
      await this.mountApp(this.getProps());
      this.status = this._StatusEnum.Mounted;
    } catch (error) {
      this.status = this._StatusEnum.SkipBecauseBroken;
      throw error;
    }
  }

  public getProps(): Record<string, unknown> {
    const props: Record<string, unknown> = typeof this.props === 'function' ? this.props(this.name) : this.props;
    return {
      ...props,
      name: this.name,
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

    this.bootstrapApp = hooks.bootstrap;
    this.mountApp = hooks.mount;
    this.unmountApp = hooks.unmount;
    this.unloadApp = hooks.unload;
  }
}
