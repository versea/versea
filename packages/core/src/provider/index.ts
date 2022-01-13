import { BEE_METADATA_PROVIDE_KEY } from '../constants';
import { createProvider } from './creator';

const { provide, provideValue, buildProviderModule } = createProvider(BEE_METADATA_PROVIDE_KEY);

export { provide, provideValue, buildProviderModule };
export * from './creator';
