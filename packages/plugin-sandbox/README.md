# @versea/plugin-sandbox

给应用增加沙箱能力

### 安装

```bash
npm install --save @versea/versea @versea/plugin-source-entry @versea/plugin-sandbox
```

### 使用

```ts
import { Versea } from '@versea/versea';
import { IPluginSourceEntry } from '@versea/plugin-source-entry';
import { IPluginSandbox } from '@versea/plugin-sandbox'

const versea = new Versea({ defaultContainer: '#microApp' });
versea.use(IPluginSourceEntry);
versea.use(IPluginSandbox)

// 注册子应用
versea.registerApps([
  {
    name: 'subApp',
    routes: [
      {
        path: 'sub-app',
      },
    ],
    scripts: [
      'http://localhost:3000/static/js/bundle.js'
    ],
  },
]);

// 在合适的时机启动 versea
void versea.start();
```


### 特别声明

本插件借鉴了 micro-app 和 qiankun 的沙箱方案，后期关注沙箱是否可以使用其他开源项目的实现。
