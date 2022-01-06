import { createServiceSymbol } from '../../utils';

export const IAppKey = createServiceSymbol('IApp');

export interface IApp {
  name: string;
  setApp: (props: AppProps) => void;
}

export interface AppProps {
  name: string;
}
