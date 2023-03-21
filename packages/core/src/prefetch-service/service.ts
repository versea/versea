import { logWarn } from '@versea/shared';
import { inject } from 'inversify';

import { IAppService } from '../application/app-service/service';
import { IApp } from '../application/app/service';
import { VERSEA_INTERNAL_TAP } from '../constants';
import { IStatus } from '../enum/status';
import { IHooks } from '../hooks/service';
import { provide } from '../provider';
import { IPrefetchService, PrefetchOptions } from './interface';

export * from './interface';

@provide(IPrefetchService)
export class PrefetchService implements IPrefetchService {
  protected readonly _hooks: IHooks;

  protected readonly _appService: IAppService;

  protected readonly _Status: IStatus;

  constructor(
    @inject(IHooks) hooks: IHooks,
    @inject(IAppService) appService: IAppService,
    // eslint-disable-next-line @typescript-eslint/naming-convention
    @inject(IStatus) Status: IStatus,
  ) {
    this._hooks = hooks;
    this._appService = appService;
    this._Status = Status;

    this._initHooks();
  }

  public fetch(apps: string[], options: PrefetchOptions = {} as PrefetchOptions): void {
    void this._hooks.prefetch.call({
      apps: apps
        .map((name) => {
          const app = this._appService.getApp(name);
          if (!app) {
            logWarn(`Can not find app "${name}" when prefetch.`);
          }

          return app;
        })
        .filter(Boolean) as IApp[],
      options,
    });
  }

  protected _initHooks(): void {
    this._hooks.prefetch.tap(VERSEA_INTERNAL_TAP, async ({ apps }) => {
      apps
        .filter((app) => app.status === this._Status.NotLoaded)
        .forEach((app) => {
          app.load();
        });

      return Promise.resolve();
    });
  }
}
