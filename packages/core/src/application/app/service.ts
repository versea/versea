import { provide } from '../../provider';
import { AppProps, IApp, IAppKey } from './interface';

export * from './interface';

@provide(IAppKey, 'Constructor')
export class App implements IApp {
  public name: string;

  constructor(props: AppProps) {
    this.name = props.name;
  }
}
