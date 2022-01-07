/* eslint-disable @typescript-eslint/no-unsafe-return */
/* eslint-disable @typescript-eslint/no-unsafe-argument */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-explicit-any */
import {
  decorate,
  injectable,
  ContainerModule,
  METADATA_KEY as inversify_METADATA_KEY,
  interfaces,
  BindingTypeEnum,
} from 'inversify';

interface ProvideSyntax {
  implementationType: any;
  bindingType: interfaces.BindingType;
  serviceIdentifier: interfaces.ServiceIdentifier<any>;
}

interface CreateProviderReturnType {
  provide: (
    serviceIdentifier: interfaces.ServiceIdentifier<any>,
    bindingType?: 'Constructor' | 'Instance',
  ) => (target: any) => any;
  provideValue: (
    target: any,
    serviceIdentifier: interfaces.ServiceIdentifier<any>,
    bindingType?: 'ConstantValue' | 'DynamicValue' | 'Function' | 'Provider',
  ) => any;
  buildProviderModule: () => interfaces.ContainerModule;
}

function addProvideSyntaxItem(metadata: ProvideSyntax[], provide: ProvideSyntax): ProvideSyntax[] {
  const index = metadata.findIndex((item) => item.serviceIdentifier === provide.serviceIdentifier);
  // eslint-disable-next-line @typescript-eslint/no-magic-numbers
  if (index < 0) {
    return [provide, ...metadata];
  }
  console.warn('Provide Warning: duplicated serviceIdentifier, use new value to replace old value.');
  const newMetaData = [...metadata];
  newMetaData[index] = provide;
  return newMetaData;
}

// eslint-disable-next-line @typescript-eslint/naming-convention
export function createProvider(MetaDataKey: string): CreateProviderReturnType {
  function provide(
    serviceIdentifier: interfaces.ServiceIdentifier<any>,
    bindingType: 'Constructor' | 'Instance' = 'Instance',
  ) {
    return function (target: any): any {
      const isAlreadyDecorated = Reflect.hasOwnMetadata(inversify_METADATA_KEY.PARAM_TYPES, target);

      if (!isAlreadyDecorated) {
        decorate(injectable(), target);
      }

      const currentMetadata: ProvideSyntax = {
        serviceIdentifier,
        bindingType,
        implementationType: target,
      };
      const previousMetadata: ProvideSyntax[] = Reflect.getMetadata(MetaDataKey, Reflect) || [];
      const newMetadata = addProvideSyntaxItem(previousMetadata, currentMetadata);
      Reflect.defineMetadata(MetaDataKey, newMetadata, Reflect);

      return target;
    };
  }

  function provideValue(
    target: any,
    serviceIdentifier: interfaces.ServiceIdentifier<any>,
    bindingType: 'ConstantValue' | 'DynamicValue' | 'Function' | 'Provider' = 'ConstantValue',
  ): any {
    const currentMetadata: ProvideSyntax = {
      serviceIdentifier,
      bindingType,
      implementationType: target,
    };
    const previousMetadata: ProvideSyntax[] = Reflect.getMetadata(MetaDataKey, Reflect) || [];
    const newMetadata = addProvideSyntaxItem(previousMetadata, currentMetadata);
    Reflect.defineMetadata(MetaDataKey, newMetadata, Reflect);
    return target;
  }

  function buildProviderModule(): interfaces.ContainerModule {
    return new ContainerModule((bind) => {
      const provideMetadata: ProvideSyntax[] = Reflect.getMetadata(MetaDataKey, Reflect) || [];
      provideMetadata.map(({ serviceIdentifier, implementationType, bindingType }) => {
        if (bindingType === BindingTypeEnum.Factory) {
          throw new Error('Auto Binding Module Error: can not auto bind factory.');
        }

        if (bindingType === BindingTypeEnum.ConstantValue) {
          return bind(serviceIdentifier).toConstantValue(implementationType);
        }
        if (bindingType === BindingTypeEnum.Constructor) {
          return bind(serviceIdentifier).toConstructor(implementationType);
        }
        if (bindingType === BindingTypeEnum.DynamicValue) {
          return bind(serviceIdentifier).toDynamicValue(implementationType);
        }
        if (bindingType === BindingTypeEnum.Function) {
          return bind(serviceIdentifier).toFunction(implementationType);
        }
        if (bindingType === BindingTypeEnum.Provider) {
          return bind(serviceIdentifier).toProvider(implementationType);
        }
        return bind(serviceIdentifier).to(implementationType);
      });
    });
  }

  return {
    provide,
    provideValue,
    buildProviderModule,
  };
}
