import { provide } from '../../provider';
import { IPerformanceKey, IPerformance, PerformOptions } from './interface';

export * from './interface';

@provide(IPerformanceKey)
export class Performance implements IPerformance {
  public async perform(options: PerformOptions): Promise<void> {
    console.log(options);
    return Promise.resolve();
  }
}
