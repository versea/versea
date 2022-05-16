# @versea/plugin-source-entry

自动生成注册应用的 loadApp 配置。

### 安装

```bash
npm install --save @versea/versea @versea/plugin-source-entry
```

### 使用

```ts
import { Versea } from '@versea/versea';
import { IPluginSourceEntryKey } from '@versea/plugin-source-entry';

const versea = new Versea({ defaultContainer: '#microApp' });
versea.use(IPluginSourceEntryKey);

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
