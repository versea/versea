import { ExtensibleEntity, logWarn, memoizePromise, VerseaError } from '@versea/shared';
import { omit } from 'ramda';

import { IAppSwitcherContext } from '../../app-switcher/app-switcher-context/interface';
import { IStatus } from '../../enum/status';
import { MatchedRoute } from '../../navigation/route/interface';
import { provide } from '../../provider';
import {
  IApp,
  AppConfig,
  AppDependencies,
  AppProps,
  AppConfigProps,
  AppLifeCycles,
  AppLifeCycleFunction,
} from './interface';

export * from './interface';

@provide(IApp, 'Constructor')
export class App extends ExtensibleEntity implements IApp {
  public readonly name: string;

  public status: IStatus[keyof IStatus];

  public isLoaded = false;

  public isBootstrapped = false;

  protected readonly _loadApp?: (props: AppProps) => Promise<AppLifeCycles>;

  protected readonly _props: AppConfigProps;

  // eslint-disable-next-line @typescript-eslint/naming-convention
  protected readonly _Status: IStatus;

  /** 加载应用返回的声明周期 */
  protected _lifeCycles: AppLifeCycles = {};

  /** "等待应用内部容器渲染完成"的 Hooks */
  protected _waitForChildrenContainerHooks: Record<string, AppLifeCycleFunction> = {};

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
  public async load(context: IAppSwitcherContext, route?: MatchedRoute): Promise<void> {
    if (this.status !== this._Status.NotLoaded && this.status !== this._Status.LoadError) {
      throw new VerseaError(`Can not load app "${this.name}" with status "${this.status}".`);
    }

    if (!this._loadApp) {
      this.status = this._Status.Broken;
      throw new VerseaError(`Can not find loadApp prop on app "${this.name}".`);
    }

    this.status = this._Status.LoadingSourceCode;
    try {
      const lifeCycles = await this._loadApp(this.getProps(context, route));
      this.isLoaded = true;
      this.status = this._Status.NotBootstrapped;
      this._setLifeCycles(lifeCycles);
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

    if (!this._lifeCycles.bootstrap) {
      this.status = this._Status.NotMounted;
      return;
    }

    this.status = this._Status.Bootstrapping;
    try {
      await this._lifeCycles.bootstrap(this.getProps(context, route));
      this.isBootstrapped = true;
      this.status = this._Status.NotMounted;
    } catch (error) {
      this.status = this._Status.Broken;
      throw error;
    }
  }

  @memoizePromise()
  public async bootstrapOnMounting(context: IAppSwitcherContext, route: MatchedRoute): Promise<void> {
    if (this.status !== this._Status.Mounting) {
      throw new VerseaError(`Can not bootstrapOnMounting app "${this.name}" with status "${this.status}".`);
    }

    if (!this._lifeCycles.bootstrap) {
      return;
    }

    try {
      await this._lifeCycles.bootstrap(this.getProps(context, route));
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

    if (!this._lifeCycles.mount) {
      this.status = this._Status.Mounted;
      return;
    }

    this.status = this._Status.Mounting;
    try {
      const result = await this._lifeCycles.mount(this.getProps(context, route));
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

    if (!this._lifeCycles.unmount) {
      this.status = this._Status.NotMounted;
      return;
    }

    this.status = this._Status.Unmounting;
    try {
      // TODO: unmount parcel
      await this._lifeCycles.unmount(this.getProps(context, route));
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
      logWarn(`Can not found waiting for function, it may cause mounting child app error.`, this.name);
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

  protected _setLifeCycles(lifeCycles: AppLifeCycles = {}): void {
    if (!lifeCycles.mount) {
      logWarn(`App does not export a valid mount function`, this.name);
    }
    if (!lifeCycles.unmount) {
      logWarn(`App does not export a valid unmount function`, this.name);
    }

    this._lifeCycles = lifeCycles;
  }

  // eslint-disable-next-line @typescript-eslint/naming-convention
  protected toJSON(): Record<string, unknown> {
    return omit(['_Status'], this);
  }
}
