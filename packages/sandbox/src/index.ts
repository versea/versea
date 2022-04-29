import {
  buildProviderModule,
  IAppService,
  IAppServiceKey,
  App,
  AppConfig,
  IAppKey,
  provide,
  provideValue,
  AppDependencies,
  IRouter,
  IRouterKey,
  VerseaContainer,
} from '@versea/core';
import { inject } from 'inversify';

const parent = new VerseaContainer({ defaultScope: 'Singleton' });

@provide(IAppKey, 'Constructor')
export class NewApp extends App {
  public path: string;

  constructor(options: AppConfig & { path: string }, dependencies: AppDependencies) {
    super(options, dependencies);
    this.path = options.path;
  }
}

provideValue('test1', 'TestData');

@provide('Test')
export class Test {
  // eslint-disable-next-line @typescript-eslint/no-parameter-properties
  constructor(@inject('TestData') public data: string) {}
}

parent.load(buildProviderModule());

// provideValue('test2', 'TestData');

parent.rebind('TestData').toConstantValue('test2');

// parent.rebind(IAppKey).toConstructor(NewApp);

const app1 = parent.get<IAppService>(IAppServiceKey).registerApp({
  name: 'app1',
  path: 'app1_path',
} as AppConfig);
const app2 = parent.get<IAppService>(IAppServiceKey).registerApp({
  name: 'app2',
  path: 'app2_path',
  routes: [
    {
      path: 'a',
    },
  ],
} as AppConfig);
const matcher = parent.get<IRouter>(IRouterKey);
const test = parent.get<Test>('Test');
console.log(app1, app2, matcher);
console.log(test);
