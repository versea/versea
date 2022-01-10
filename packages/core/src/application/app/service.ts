/* eslint-disable @typescript-eslint/no-explicit-any */
import { provide } from '../../provider';
import { AppProps, IApp, IAppKey } from './interface';

export * from './interface';

@provide(IAppKey, 'Constructor')
export class App implements IApp {
  public name: string;

  public path: string;

  public props: Record<string, any>;

  public loadApp: () => any;

  constructor(props: AppProps) {
    this.name = props.name;
    this.path = props.path;
    this.props = props.props;
    this.loadApp = props.loadApp;
  }
}
