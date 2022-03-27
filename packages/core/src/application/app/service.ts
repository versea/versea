import { ExtensibleEntity, VerseaError, memoizePromise } from '@versea/shared';

import { IAppSwitcherContext } from '../../app-switcher/app-switcher-context/service';
import { IStatusEnum } from '../../constants/status';
import { provide } from '../../provider';
import {
  IApp,
  IAppKey,
  AppOptions,
  AppDependencies,
  AppProps,
  AppHooks,
  AppOptionsProps,
  HookFunction,
} from './interface';

export * from './interface';

@provide(IAppKey, 'Constructor')
export class App extends ExtensibleEntity implements IApp {
  public name: string;

  public status: IStatusEnum[keyof IStatusEnum];

  protected _loadApp?: (props: AppProps) => Promise<AppHooks>;

  protected _hooks: AppHooks = {};

  protected _props: AppOptionsProps;

  // eslint-disable-next-line @typescript-eslint/naming-convention
  protected _StatusEnum: IStatusEnum;

  /** mount 嵌套的子应用的等待函数 */
  protected _waitForChildrenContainerHooks: Record<string, HookFunction> = {};

  /**
   * 生成一个 App 实例
   * @param options App 实例化的参数
   * @param dependencies 由于 App 必须继承 ExtensibleEntity，这里无法使用依赖注入，依赖问题必须自己管理。
   */
  constructor(options: AppOptions, dependencies: AppDependencies) {
    super(options);
    this.name = options.name;
    this._props = options.props ?? {};
    this._loadApp = options.loadApp;

    // 绑定依赖
    this._StatusEnum = dependencies.StatusEnum;
    this.status = this._StatusEnum.NotLoaded;
  }

  @memoizePromise()
  public async load(context: IAppSwitcherContext): Promise<void> {
    if (this.status !== this._StatusEnum.NotLoaded && this.status !== this._StatusEnum.LoadError) {
      throw new VerseaError(`Can not load app "${this.name}" with status "${this.status}".`);
    }

    if (!this._loadApp) {
      this.status = this._StatusEnum.SkipBecauseBroken;
      throw new VerseaError(`Can not find loadApp prop on app "${this.name}".`);
    }

    this.status = this._StatusEnum.LoadingSourceCode;
    try {
      const hooks = await this._loadApp(this.getProps(context));
      this.status = this._StatusEnum.NotBootstrapped;
      this._setHooks(hooks);
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

    if (!this._hooks.bootstrap) {
      this.status = this._StatusEnum.NotMounted;
      return;
    }

    this.status = this._StatusEnum.Bootstrapping;
    try {
      await this._hooks.bootstrap(this.getProps(context));
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

    if (!this._hooks.mount) {
      this.status = this._StatusEnum.Mounted;
      return;
    }

    this.status = this._StatusEnum.Mounting;
    try {
      const result = await this._hooks.mount(this.getProps(context));
      this._waitForChildrenContainerHooks = result ?? {};
      this.status = this._StatusEnum.Mounted;
    } catch (error) {
      this.status = this._StatusEnum.SkipBecauseBroken;
      throw error;
    }
  }

  @memoizePromise()
  public async waitForChildContainer(name: string, context: IAppSwitcherContext): Promise<void> {
    if (this.status !== this._StatusEnum.Mounted) {
      throw new VerseaError(`Can not wait for app "${this.name}" with status "${this.status}".`);
    }

    if (!this._waitForChildrenContainerHooks[name]) {
      return;
    }

    await this._waitForChildrenContainerHooks[name](this.getProps(context));
    return;
  }

  // TODO: unmount parcel if needed.
  @memoizePromise()
  public async unmount(context: IAppSwitcherContext): Promise<void> {
    if (this.status !== this._StatusEnum.Mounted) {
      throw new VerseaError(`Can not unmount app "${this.name}" with status "${this.status}".`);
    }

    if (!this._hooks.unmount) {
      this.status = this._StatusEnum.NotMounted;
      return;
    }

    this.status = this._StatusEnum.Unmounting;
    try {
      await this._hooks.unmount(this.getProps(context));
      this.status = this._StatusEnum.NotMounted;
    } catch (error) {
      this.status = this._StatusEnum.SkipBecauseBroken;
      throw error;
    }
  }

  public getProps(context: IAppSwitcherContext): AppProps {
    const props: Record<string, unknown> = typeof this._props === 'function' ? this._props(this.name) : this._props;
    return {
      ...props,
      name: this.name,
      app: this,
      context,
    };
  }

  protected _setHooks(hooks: AppHooks = {}): void {
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

    this._hooks = hooks;
  }
}
