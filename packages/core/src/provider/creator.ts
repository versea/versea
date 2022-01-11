/* eslint-disable @typescript-eslint/no-unsafe-return */
/* eslint-disable @typescript-eslint/no-unsafe-argument */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-explicit-any */
import 'reflect-metadata';
import { BeeError } from '@bee/shared';
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

function toString(serviceIdentifier: interfaces.ServiceIdentifier<any>): string {
  if (typeof serviceIdentifier === 'function') {
    return serviceIdentifier.name;
  }
  if (typeof serviceIdentifier === 'object') {
    return 'unknown';
  }
  return serviceIdentifier.toString();
}

// eslint-disable-next-line @typescript-eslint/naming-convention
function appendMetadata(metadata: ProvideSyntax, MetaDataKey: string): void {
  let newMetadata: ProvideSyntax[] = [];
  const previousMetadata: ProvideSyntax[] = Reflect.getMetadata(MetaDataKey, Reflect) || [];

  const index = previousMetadata.findIndex((item) => item.serviceIdentifier === metadata.serviceIdentifier);
  if (index < 0) {
    newMetadata = [...previousMetadata, metadata];
  } else {
    console.warn(
      `Provide Warning: duplicated serviceIdentifier ${toString(
        metadata.serviceIdentifier,
      )}, use new value to replace old value.`,
    );
    newMetadata = [...previousMetadata];
    newMetadata[index] = metadata;
  }

  Reflect.defineMetadata(MetaDataKey, newMetadata, Reflect);
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

      appendMetadata(
        {
          serviceIdentifier,
          bindingType,
          implementationType: target,
        },
        MetaDataKey,
      );
      return target;
    };
  }

  function provideValue(
    target: any,
    serviceIdentifier: interfaces.ServiceIdentifier<any>,
    bindingType: 'ConstantValue' | 'DynamicValue' | 'Function' | 'Provider' = 'ConstantValue',
  ): any {
    appendMetadata(
      {
        serviceIdentifier,
        bindingType,
        implementationType: target,
      },
      MetaDataKey,
    );
    return target;
  }

  function buildProviderModule(): interfaces.ContainerModule {
    return new ContainerModule((bind) => {
      const provideMetadata: ProvideSyntax[] = Reflect.getMetadata(MetaDataKey, Reflect) || [];
      provideMetadata.map(({ serviceIdentifier, implementationType, bindingType }) => {
        if (bindingType === BindingTypeEnum.Factory) {
          throw new BeeError('Auto Binding Module Error: can not auto bind factory.');
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
