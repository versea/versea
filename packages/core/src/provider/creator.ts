/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import 'reflect-metadata';
import { VerseaError } from '@versea/shared';
import {
  decorate,
  injectable,
  ContainerModule,
  METADATA_KEY as inversify_METADATA_KEY,
  interfaces,
  BindingTypeEnum,
} from 'inversify';

interface ProvideSyntax {
  implementationType: unknown;
  bindingType: interfaces.BindingType;
  serviceIdentifier: interfaces.ServiceIdentifier;
}
interface CreateProviderReturnType {
  provide: (
    serviceIdentifier: interfaces.ServiceIdentifier,
    bindingType?: 'Constructor' | 'Instance',
  ) => (target: any) => any;
  provideValue: (
    target: any,
    serviceIdentifier: interfaces.ServiceIdentifier,
    bindingType?: 'ConstantValue' | 'DynamicValue' | 'Function' | 'Provider',
  ) => any;
  buildProviderModule: () => interfaces.ContainerModule;
}

function toString(serviceIdentifier: interfaces.ServiceIdentifier): string {
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
    const previousBindingType = previousMetadata[index].bindingType;
    const currentBindingType = metadata.bindingType;

    if (previousBindingType !== currentBindingType) {
      throw new VerseaError(
        `Provide Error: replace serviceIdentifier ${toString(metadata.serviceIdentifier)} with different bindingType.`,
      );
    }

    if (currentBindingType === 'Constructor' || currentBindingType === 'Instance') {
      // eslint-disable-next-line @typescript-eslint/ban-types
      const previousTarget = previousMetadata[index].implementationType as Function;
      // eslint-disable-next-line @typescript-eslint/ban-types
      const currentTarget = metadata.implementationType as Function;
      if (!(currentTarget.prototype instanceof previousTarget)) {
        throw new VerseaError(
          `Provide Error: replace serviceIdentifier ${toString(metadata.serviceIdentifier)} with different instance.`,
        );
      }
    }

    if (process.env.NODE_ENV !== 'production') {
      console.warn(
        `Provide Warning: duplicated serviceIdentifier ${toString(
          metadata.serviceIdentifier,
        )}, use new value to replace old value.`,
      );
    }

    newMetadata = [...previousMetadata];
    newMetadata[index] = metadata;
  }

  Reflect.defineMetadata(MetaDataKey, newMetadata, Reflect);
}

// eslint-disable-next-line @typescript-eslint/naming-convention
export function createProvider(MetaDataKey: string): CreateProviderReturnType {
  function provide(
    serviceIdentifier: interfaces.ServiceIdentifier,
    bindingType: 'Constructor' | 'Instance' = 'Instance',
  ) {
    return function (target: any): any {
      // eslint-disable-next-line @typescript-eslint/ban-types
      const isAlreadyDecorated = Reflect.hasOwnMetadata(inversify_METADATA_KEY.PARAM_TYPES, target as Object);
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
    serviceIdentifier: interfaces.ServiceIdentifier,
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
      provideMetadata.forEach(({ serviceIdentifier, implementationType, bindingType }) => {
        if (bindingType === BindingTypeEnum.Factory) {
          throw new VerseaError('Auto Binding Module Error: can not auto bind factory.');
        }

        if (bindingType === BindingTypeEnum.ConstantValue) {
          return bind(serviceIdentifier).toConstantValue(implementationType);
        }
        if (bindingType === BindingTypeEnum.Constructor) {
          return bind(serviceIdentifier).toConstructor(implementationType as interfaces.Newable<unknown>);
        }
        if (bindingType === BindingTypeEnum.DynamicValue) {
          return bind(serviceIdentifier).toDynamicValue(implementationType as interfaces.DynamicValue<unknown>);
        }
        if (bindingType === BindingTypeEnum.Function) {
          return bind(serviceIdentifier).toFunction(implementationType);
        }
        if (bindingType === BindingTypeEnum.Provider) {
          return bind(serviceIdentifier).toProvider(implementationType as interfaces.ProviderCreator<unknown>);
        }
        return bind(serviceIdentifier).to(implementationType as new (...args: never[]) => unknown);
      });
    });
  }

  return {
    provide,
    provideValue,
    buildProviderModule,
  };
}
