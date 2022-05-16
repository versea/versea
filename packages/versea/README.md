# @versea/versea

versea 核心能力的封装。

### 安装

```bash
npm install --save @versea/core
```

### 使用

```ts
import { Versea, AppLifeCycles } from '@versea/versea';

async function loadScript(url): Promise<void> {
  console.log(url);
  // ...
  await Promise.resolve();
}

const versea = new Versea();

// 注册子应用
versea.registerApps([
  {
    name: 'subApp',
    routes: [
      {
        path: 'sub-app',
      },
    ],
    loadApp: async (): AppLifeCycles => {
      await loadScript('http://localhost:3000/static/js/bundle.js');
      return (window as any).microApp;
    },
  },
]);

// 在合适的时机启动 versea
void versea.start();
```
