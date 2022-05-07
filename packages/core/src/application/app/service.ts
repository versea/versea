import { ExtensibleEntity, VerseaError, memoizePromise } from '@versea/shared';

import { IAppSwitcherContext } from '../../app-switcher/app-switcher-context/interface';
import { IStatus } from '../../enum/status';
import { MatchedRoute } from '../../navigation/route/interface';
import { provide } from '../../provider';
import {
  IApp,
  IAppKey,
  AppConfig,
  AppDependencies,
  AppProps,
  AppHooks,
  AppConfigProps,
  AppHookFunction,
} from './interface';

export * from './interface';

@provide(IAppKey, 'Constructor')
export class App extends ExtensibleEntity implements IApp {
  public readonly name: string;

  public status: IStatus[keyof IStatus];

  public isLoaded = false;

  public isBootstrapped = false;

  protected readonly _loadApp?: (props: AppProps) => Promise<AppHooks>;

  protected readonly _props: AppConfigProps;

  // eslint-disable-next-line @typescript-eslint/naming-convention
  protected readonly _Status: IStatus;

  /** 加载应用返回的 Hooks */
  protected _hooks: AppHooks = {};

  /** "等待应用内部容器渲染完成"的 Hooks */
  protected _waitForChildrenContainerHooks: Record<string, AppHookFunction> = {};

  /**
   * 生成一个 App 实例
   * @param config App 实例化的参数
   * @param dependencies 由于 App 继承 ExtensibleEntity，导致无法使用依赖注入，依赖必须自己管理。
   */
  constructor(config: AppConfig, dependencies: AppDependencies) {
    super(config);
    // 绑定依赖
    this._Status = dependencies.Status;

    this.name = config.name;
    this._props = config.props ?? {};
    this._loadApp = config.loadApp;
    this.status = this._Status.NotLoaded;
  }

  @memoizePromise()
  public async load(context: IAppSwitcherContext): Promise<void> {
    if (this.status !== this._Status.NotLoaded && this.status !== this._Status.LoadError) {
      throw new VerseaError(`Can not load app "${this.name}" with status "${this.status}".`);
    }

    if (!this._loadApp) {
      this.status = this._Status.Broken;
      throw new VerseaError(`Can not find loadApp prop on app "${this.name}".`);
    }

    this.status = this._Status.LoadingSourceCode;
    try {
      const hooks = await this._loadApp(this.getProps(context));
      this.status = this._Status.NotBootstrapped;
      this.isLoaded = true;
      this._setHooks(hooks);
    } catch (error) {
      this.status = this._Status.LoadError;
      throw error;
    }
  }

  @memoizePromise()
  public async bootstrap(context: IAppSwitcherContext, route: MatchedRoute): Promise<void> {
    if (this.status !== this._Status.NotBootstrapped) {
      throw new VerseaError(`Can not bootstrap app "${this.name}" with status "${this.status}".`);
    }

    if (!this._hooks.bootstrap) {
      this.status = this._Status.NotMounted;
      return;
    }

    this.status = this._Status.Bootstrapping;
    try {
      await this._hooks.bootstrap(this.getProps(context, route));
      this.status = this._Status.NotMounted;
      this.isBootstrapped = true;
    } catch (error) {
      this.status = this._Status.Broken;
      throw error;
    }
  }

  @memoizePromise()
  public async mount(context: IAppSwitcherContext, route: MatchedRoute): Promise<void> {
    if (this.status !== this._Status.NotMounted) {
      throw new VerseaError(`Can not mount app "${this.name}" with status "${this.status}".`);
    }

    if (!this._hooks.mount) {
      this.status = this._Status.Mounted;
      return;
    }

    this.status = this._Status.Mounting;
    try {
      const result = await this._hooks.mount(this.getProps(context, route));
      this._waitForChildrenContainerHooks = result ?? {};
      this.status = this._Status.Mounted;
    } catch (error) {
      this.status = this._Status.Broken;
      throw error;
    }
  }

  @memoizePromise()
  public async unmount(context: IAppSwitcherContext, route: MatchedRoute): Promise<void> {
    if (this.status !== this._Status.Mounted) {
      throw new VerseaError(`Can not unmount app "${this.name}" with status "${this.status}".`);
    }

    if (!this._hooks.unmount) {
      this.status = this._Status.NotMounted;
      return;
    }

    this.status = this._Status.Unmounting;
    try {
      // TODO: unmount parcel
      await this._hooks.unmount(this.getProps(context, route));
      this.status = this._Status.NotMounted;
    } catch (error) {
      this.status = this._Status.Broken;
      throw error;
    }
  }

  @memoizePromise()
  public async waitForChildContainer(containerName: string, context: IAppSwitcherContext): Promise<void> {
    if (this.status !== this._Status.Mounted) {
      throw new VerseaError(`Can not run waiting because app "${this.name}" status is "${this.status}".`);
    }

    if (!this._waitForChildrenContainerHooks[containerName]) {
      if (process.env.NODE_ENV !== 'production') {
        console.warn(`Can not found waiting for function, it may cause mounting child app error.`);
      }
      return;
    }

    await this._waitForChildrenContainerHooks[containerName](this.getProps(context));
    return;
  }

  public getProps(context: IAppSwitcherContext, route?: MatchedRoute): AppProps {
    const props: Record<string, unknown> = typeof this._props === 'function' ? this._props(this.name) : this._props;
    return {
      ...props,
      app: this,
      context,
      route,
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
