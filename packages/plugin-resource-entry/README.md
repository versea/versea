# @versea/plugin-resource-entry

自动生成注册应用的 loadApp 配置。

### 安装

```bash
npm install --save @versea/versea @versea/plugin-resource-entry
```

### 使用

```ts
import { Versea } from '@versea/versea';
import { IPluginResourceEntryKey } from '@versea/plugin-resource-entry';

const versea = new Versea({ defaultContainer: '#microApp' });
versea.use(IPluginResourceEntryKey);

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
