import { Container, interfaces } from 'inversify';

import { IAppSwitcherKey } from './app-switcher/app-switcher/service';
import { IAppServiceKey } from './application/app-service/service';
import { IRouterKey } from './navigation/router/service';

export class VerseaContainer extends Container {
  public load(...modules: interfaces.ContainerModule[]): void {
    super.load(...modules);
    this.get(IAppServiceKey);
    this.get(IRouterKey);
    this.get(IAppSwitcherKey);
  }
}
