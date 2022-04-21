import { Container } from 'inversify';

import '../application/app-service/service';
import { IRouterKey, IRouter } from '../navigation/router/service';
import { buildProviderModule } from '../provider';
import { IStarter, IStarterKey } from './service';

// @provide(IRouterKey)
// export class Router {
//   public static callRerouteCount = 0;

//   public reroute(): void {
//     Router.callRerouteCount++;
//   }
// }

/**
 * unit
 * @author shushan.cai
 */
describe('启动应用', () => {
  test('第一次启动应用，应该调用 reroute 方法。', async () => {
    const container = new Container({ defaultScope: 'Singleton' });
    container.load(buildProviderModule());
    const router = container.get<IRouter>(IRouterKey);
    const starter = container.get<IStarter>(IStarterKey);

    const spy = jest.spyOn(router, 'reroute');
    await starter.start();
    expect(spy).toHaveBeenCalled();
  });

  test('多次启动应用，应该仅仅调用一次 reroute 方法。', async () => {
    const container = new Container({ defaultScope: 'Singleton' });
    container.load(buildProviderModule());
    const router = container.get<IRouter>(IRouterKey);
    const starter = container.get<IStarter>(IStarterKey);

    const spy = jest.spyOn(router, 'reroute');
    await starter.start();
    await starter.start();
    expect(spy).toHaveBeenCalledTimes(1);
  });
});
