# @versea/plugin-custom-match-route

rootFragment 类型的路由自定义匹配。

### 安装

```bash
npm install --save @versea/versea @versea/plugin-custom-match-route
```

### 使用

```ts
import { Versea, AppLifeCycles } from '@versea/versea';
import { IPluginCustomMatchRouteKey } from '@versea/versea';

async function loadScript(url): Promise<void> {
  console.log(url);
  // ...
  await Promise.resolve();
}

const versea = new Versea();
versea.use(IPluginCustomMatchRouteKey);

// 注册子应用
versea.registerApps([
  {
    name: 'subApp',
    routes: [
      {
        path: 'sub-app',
        isRootFragment: true,
        // 自定义路由匹配
        customMatchRoute(path) {
          return path.indexOf('test') >= 0;
        },
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
