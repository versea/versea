# @versea/core

versea 的核心能力，应用注册，加载，切换能力。

### 安装

```bash
npm install --save @versea/core
```

### 使用

```ts
import { buildProviderModule, IAppService, IAppServiceKey, IStarter, IStarterKey, AppHooks } from '@versea/core';
import { Container } from 'inversify';

async function loadScript(url): Promise<void> {
  console.log(url);
  // ...
  await Promise.resolve();
}

// 创建容器
const container = new Container({ defaultScope: 'Singleton' });

// 绑定依赖容器
container.load(buildProviderModule());

// 注册子应用
container.get<IAppService>(IAppServiceKey).registerApps([
  {
    name: 'subApp',
    routes: [
      {
        path: 'sub-app',
      },
    ],
    loadApp: async (): AppHooks => {
      await loadScript('http://localhost:3000/static/js/bundle.js');
      return (window as any).microApp;
    },
  },
]);

// 在合适的时机启动 versea
void container.get<IStarter>(IStarterKey).start();
```
