import { createServiceSymbol } from '../../utils';
import { AppOptions, IApp } from '../app/service';

export const IAppServiceKey = createServiceSymbol('IAppService');

export interface IAppService {
  registerApplication: (options: AppOptions) => IApp;
}
