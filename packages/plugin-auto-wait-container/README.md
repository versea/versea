# @versea/plugin-auto-wait-container

rootFragment 类型的路由自定义匹配。

### 安装

```bash
npm install --save @versea/versea @versea/plugin-source-entry @versea/plugin-auto-wait-container

```

### 使用

```ts
import { Versea, AppLifeCycles } from '@versea/versea';
import { IPluginCustomMatchRoute } from '@versea/plugin-source-entry';
import { IPluginAutoWaitContainer } from '@versea/plugin-auto-wait-container';

const versea = new Versea({ defaultContainer: '#microApp' });
versea.use(IPluginSourceEntry);
versea.use(IPluginAutoWaitContainer);

// 注册子应用1
versea.registerApps([
  {
    name: 'subApp1',
    routes: [
      {
        path: 'sub-app1',
        slot: 'sub-app1-container',
        children: [{
          path: '/(.*)',
        }],
      },
    ],
    scripts: [
      'http://localhost:3000/static/js/bundle.js'
    ],
  },
]);

// 注册子应用2
versea.registerApp({
  name: 'subApp2',
  routes: [{
    fill: 'sub-app1-container',
    path: 'sub-app2',
    pathToRegexpOptions: {
      end: false
    }
  }],
  scripts: [
    'http://localhost:3001/static/js/bundle.js'
  ]
})

// 在合适的时机启动 versea
void versea.start();
```

### 作用

应用嵌套的情况下，自动寻找父应用的容器。

根据使用举例说明：subApp1 和 subApp2 都是子应用，但是 subApp1 嵌套 subApp2，subApp1 渲染完成之后未必马上渲染渲染了可以插入 subApp2 的容器 dom 节点，因为渲染过程过程可能是异步的，此时 `@versea/plugin-auto-wait-container` 会等待并自动查找容器是否加载完成，加载完成之后再渲染 subApp2。