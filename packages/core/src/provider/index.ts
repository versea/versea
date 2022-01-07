import { BEE_META_DATA_PROVIDE_KEY } from '../constants';
import { createProvider } from './creator';

const { provide, provideValue, buildProviderModule } = createProvider(BEE_META_DATA_PROVIDE_KEY);

export { provide, provideValue, buildProviderModule };
export * from './creator';
