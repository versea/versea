import { IApp, provide } from '@versea/core';
import { ExtensibleEntity } from '@versea/shared';
import { uniq } from 'ramda';

import { bindFunction } from '../../bind-function';
import { ICurrentApp } from '../../current-app/interface';
import { IElementPatch } from '../../element-patch/interface';
import { globalEnv } from '../../global-env';
import { IDocumentEffect } from '../document-effect/interface';
import { ISandboxEffect } from '../sandbox-effect/interface';
import { VerseaAppWindow } from '../sandbox/types';
import { ISandbox, SandboxDependencies, SandboxOptions } from './interface';

export * from './interface';

// eslint-disable-next-line @typescript-eslint/unbound-method
const rawDefineProperty = Object.defineProperty;
// eslint-disable-next-line @typescript-eslint/unbound-method
const rawDefineProperties = Object.defineProperties;
// eslint-disable-next-line @typescript-eslint/unbound-method
const rawHasOwnProperty = Object.prototype.hasOwnProperty;

const staticEscapeProperties: PropertyKey[] = ['System', '__cjsWrapper'];
const escapeSetterKeyList: PropertyKey[] = ['location'];
const globalPropertyList: PropertyKey[] = ['window', 'self', 'globalThis'];

@provide(ISandbox, 'Constructor')
export class Sandbox extends ExtensibleEntity implements ISandbox {
  public static activeCount = 0;

  public appWindow: VerseaAppWindow;

  public proxyWindow: VerseaAppWindow;

  public scopeProperties: PropertyKey[] = ['webpackJsonp', 'Vue'];

  public escapeProperties: PropertyKey[] = [];

  /** 沙箱启用状态 */
  protected _active = false;

  /** 新设置到 appWindow 的 key */
  protected readonly _injectedKeys = new Set<PropertyKey>();

  /** 需要设置到 rawWindow 的 key */
  protected readonly _escapeKeys = new Set<PropertyKey>();

  /** 新设置到 appWindow 的 key 对应的 value */
  protected _recordInjectedValues?: Map<PropertyKey, unknown>;

  protected readonly _currentApp: ICurrentApp;

  protected readonly _documentEffect: IDocumentEffect;

  protected readonly _sandboxEffect: ISandboxEffect;

  protected readonly _elementPatch: IElementPatch;

  constructor(
    options: SandboxOptions,
    // eslint-disable-next-line @typescript-eslint/naming-convention
    { currentApp, documentEffect, WindowEffect, SandboxEffect, elementPatch }: SandboxDependencies,
  ) {
    super(options);

    // 绑定依赖
    this._currentApp = currentApp;
    this._documentEffect = documentEffect;
    this._elementPatch = elementPatch;

    const { app } = options;
    this.appWindow = {} as VerseaAppWindow;
    this.proxyWindow = this._createProxyWindow(app);
    this._initVerseaAppWindow(app);

    this._sandboxEffect = new SandboxEffect(
      // @ts-expect-error 需要传入参数，但 inversify 这里的参数类型是 never
      { proxyWindow: this.proxyWindow },
      { currentApp, documentEffect, WindowEffect },
    );
  }

  public start(): void {
    if (!this._active) {
      this._active = true;

      // BUG FIX: bable-polyfill@6.x
      if (globalEnv.rawWindow._babelPolyfill) {
        globalEnv.rawWindow._babelPolyfill = false;
      }

      this._increaseActiveSandbox();
    }
  }

  public stop(): void {
    if (this._active) {
      this._active = false;
      this._sandboxEffect.releaseEffect();

      this._injectedKeys.forEach((key: PropertyKey) => {
        Reflect.deleteProperty(this.appWindow, key);
      });
      this._injectedKeys.clear();

      this._escapeKeys.forEach((key: PropertyKey) => {
        Reflect.deleteProperty(globalEnv.rawWindow, key);
      });
      this._escapeKeys.clear();

      this._decreaseActiveSandbox();
    }
  }

  public recordSnapshot(): void {
    this._sandboxEffect.recordEffect();

    this._recordInjectedValues = new Map<PropertyKey, unknown>();
    this._injectedKeys.forEach((key: PropertyKey) => {
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      this._recordInjectedValues!.set(key, Reflect.get(this.appWindow, key));
    });
  }

  public rebuildSnapshot(): void {
    if (this._recordInjectedValues) {
      this._recordInjectedValues.forEach((value: unknown, key: PropertyKey) => {
        Reflect.set(this.proxyWindow, key, value);
      });
    }

    this._sandboxEffect.rebuildEffect();
  }

  protected _initVerseaAppWindow(app: IApp): void {
    Object.assign(this.appWindow, {
      /* eslint-disable @typescript-eslint/naming-convention */
      __VERSEA_APP_ENVIRONMENT__: true,
      __VERSEA_APP_NAME__: app.name,
      __VERSEA_APP_BASE_URL__: app.entry ?? '',
      __VERSEA_APP_PUBLIC_PATH__: app.assetsPublicPath ?? '',
      /* eslint-enable @typescript-eslint/naming-convention */
      verseaApp: app,

      rawWindow: globalEnv.rawWindow,
      rawDocument: globalEnv.rawDocument,

      removeScope: (): void => {
        this._currentApp.setName();
      },
    } as VerseaAppWindow);
    this.appWindow.__VERSEA_APP_WINDOW__ = this.appWindow;
    this._setMappingPropertiesWithRawDescriptor(this.appWindow);
    this._setHijackProperties(this.appWindow, app.name);
  }

  protected _createProxyWindow(app: IApp): VerseaAppWindow {
    const rawWindow = globalEnv.rawWindow;
    const descriptorTargetMap = new Map<PropertyKey, 'rawWindow' | 'target'>();

    return new Proxy(this.appWindow, {
      get: (target: VerseaAppWindow, key: PropertyKey): unknown => {
        this._currentApp.throttleDeferForSetAppName(app.name);

        if (
          Reflect.has(target, key) ||
          (typeof key === 'string' && key.startsWith('__VERSEA_APP_')) ||
          this.scopeProperties.includes(key)
        ) {
          return Reflect.get(target, key);
        }

        const value: unknown = Reflect.get(rawWindow, key);
        return typeof value === 'function' ? bindFunction(rawWindow, value) : value;
      },
      set: (target: VerseaAppWindow, key: PropertyKey, value: unknown): boolean => {
        if (this._active) {
          this._currentApp.throttleDeferForSetAppName(app.name);

          if (escapeSetterKeyList.includes(key)) {
            Reflect.set(rawWindow, key, value);
          } else if (
            // target.hasOwnProperty has been rewritten
            !rawHasOwnProperty.call(target, key) &&
            rawHasOwnProperty.call(rawWindow, key) &&
            !this.scopeProperties.includes(key)
          ) {
            const descriptor = Object.getOwnPropertyDescriptor(rawWindow, key);
            // eslint-disable-next-line @typescript-eslint/unbound-method, @typescript-eslint/no-non-null-assertion
            const { configurable, enumerable, writable, set } = descriptor!;
            rawDefineProperty(target, key, {
              value,
              configurable,
              enumerable,
              writable: writable ?? !!set,
            });

            this._injectedKeys.add(key);
          } else {
            Reflect.set(target, key, value);
            this._injectedKeys.add(key);
          }

          if (
            (this.escapeProperties.includes(key) ||
              (staticEscapeProperties.includes(key) && !Reflect.has(rawWindow, key))) &&
            !this.scopeProperties.includes(key)
          ) {
            Reflect.set(rawWindow, key, value);
            this._escapeKeys.add(key);
          }
        }

        return true;
      },
      has: (target: VerseaAppWindow, key: PropertyKey): boolean => {
        if (this.scopeProperties.includes(key)) return key in target;
        return key in target || key in rawWindow;
      },
      // Object.getOwnPropertyDescriptor(window, key)
      getOwnPropertyDescriptor: (target: VerseaAppWindow, key: PropertyKey): PropertyDescriptor | undefined => {
        if (rawHasOwnProperty.call(target, key)) {
          descriptorTargetMap.set(key, 'target');
          return Object.getOwnPropertyDescriptor(target, key);
        }

        if (rawHasOwnProperty.call(rawWindow, key)) {
          descriptorTargetMap.set(key, 'rawWindow');
          const descriptor = Object.getOwnPropertyDescriptor(rawWindow, key);
          if (descriptor && !descriptor.configurable) {
            descriptor.configurable = true;
          }
          return descriptor;
        }

        return undefined;
      },
      // Object.defineProperty(window, key, Descriptor)
      defineProperty: (target: VerseaAppWindow, key: PropertyKey, value: PropertyDescriptor): boolean => {
        const from = descriptorTargetMap.get(key);
        return Reflect.defineProperty(from === 'rawWindow' ? rawWindow : target, key, value);
      },
      // Object.getOwnPropertyNames(window)
      ownKeys: (target: VerseaAppWindow): (string | symbol)[] => {
        return uniq(Reflect.ownKeys(rawWindow).concat(Reflect.ownKeys(target)));
      },
      deleteProperty: (target: VerseaAppWindow, key: PropertyKey): boolean => {
        if (rawHasOwnProperty.call(target, key)) {
          if (this._injectedKeys.has(key)) {
            this._injectedKeys.delete(key);
          }

          if (this._escapeKeys.has(key)) {
            Reflect.deleteProperty(rawWindow, key);
          }

          return Reflect.deleteProperty(target, key);
        }
        return true;
      },
    });
  }

  protected _setMappingPropertiesWithRawDescriptor(appWindow: VerseaAppWindow): void {
    let topValue: Window | null = null;
    let parentValue: Window | null = null;
    const rawWindow = globalEnv.rawWindow;
    if (rawWindow === rawWindow.parent) {
      topValue = parentValue = this.proxyWindow;
    } else {
      topValue = rawWindow.top;
      parentValue = rawWindow.parent;
    }

    rawDefineProperty(appWindow, 'top', this._createDescriptorForVerseaAppWindow('top', topValue));
    rawDefineProperty(appWindow, 'parent', this._createDescriptorForVerseaAppWindow('parent', parentValue));

    globalPropertyList.forEach((key: PropertyKey) => {
      rawDefineProperty(appWindow, key, this._createDescriptorForVerseaAppWindow(key, this.proxyWindow));
    });
  }

  protected _createDescriptorForVerseaAppWindow(key: PropertyKey, value: unknown): PropertyDescriptor {
    // eslint-disable-next-line @typescript-eslint/unbound-method
    const {
      configurable = true,
      enumerable = true,
      writable,
      set,
    } = Object.getOwnPropertyDescriptor(globalEnv.rawWindow, key) ?? { writable: true };
    return {
      value,
      configurable,
      enumerable,
      writable: writable ?? !!set,
    };
  }

  protected _setHijackProperties(appWindow: VerseaAppWindow, appName: string): void {
    const currentApp = this._currentApp;

    let modifiedEval: unknown = undefined;
    rawDefineProperties(appWindow, {
      document: {
        get() {
          currentApp.throttleDeferForSetAppName(appName);
          return globalEnv.rawDocument;
        },
        configurable: false,
        enumerable: true,
      },
      eval: {
        get() {
          currentApp.throttleDeferForSetAppName(appName);
          return modifiedEval || eval;
        },
        set: (value) => {
          modifiedEval = value;
        },
        configurable: true,
        enumerable: false,
      },
    });
  }

  protected _increaseActiveSandbox(): void {
    const SandboxClass = this.constructor as typeof Sandbox;
    if (++SandboxClass.activeCount === 1) {
      this._documentEffect.effectEvent();
      this._elementPatch.patch();
    }
  }

  protected _decreaseActiveSandbox(): void {
    const SandboxClass = this.constructor as typeof Sandbox;
    if (--SandboxClass.activeCount === 0) {
      this._documentEffect.restoreEvent();
      this._elementPatch.restore();
    }
  }
}
