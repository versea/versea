import { createServiceSymbol } from '../../utils';
import { AppOptions, IApp } from '../app/service';

export const IAppServiceKey = createServiceSymbol('IAppService');

export interface IAppService {
  apps: Map<string, IApp>;

  registerApplication: (options: AppOptions) => IApp;
}
