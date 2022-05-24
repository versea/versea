import { App, IConfigKey, provideValue } from '@versea/core';

export * from './interface';

provideValue({ sandbox: true }, IConfigKey);

App.defineProp('_useSandbox', { optionKey: 'sandbox' });
