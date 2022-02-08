import { VERSEA_METADATA_PROVIDE_KEY } from '../constants/container-module';
import { createProvider } from './creator';

const { provide, provideValue, buildProviderModule } = createProvider(VERSEA_METADATA_PROVIDE_KEY);

export { provide, provideValue, buildProviderModule };
export * from './creator';
