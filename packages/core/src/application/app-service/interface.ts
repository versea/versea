import { createServiceSymbol } from '../../utils';
import { AppProps, IApp } from '../app/service';

export const IAppServiceKey = createServiceSymbol('IAppService');

export interface IAppService {
  registerApplication: (props: AppProps) => IApp;
}
