import { injectable } from 'inversify';
import { AppProps, IApp } from './interface';

export * from './interface';

@injectable()
export class App implements IApp {
  public name = '';

  public static create(): App {
    return new App();
  }

  // eslint-disable-next-line @typescript-eslint/naming-convention
  public setApp(props: AppProps): void {
    this.name = props.name;
  }
}
