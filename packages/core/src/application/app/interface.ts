import { createServiceSymbol } from '../../utils';

export const IAppKey = createServiceSymbol('IApp');

export interface IApp {
  name: string;
}

export interface AppProps {
  name: string;
}
