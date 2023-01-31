# @versea/plugin-html-entry

以 html 为入口资源加载子应用

### 安装

```bash
npm install --save @versea/versea @versea/plugin-source-entry @versea/plugin-html-entry
```

### 使用

```ts
import { Versea } from '@versea/versea';
import { IPluginSourceEntry } from '@versea/plugin-source-entry';
import { IPluginHtmlEntry } from '@versea/plugin-html-entry';

const versea = new Versea({ defaultContainer: '#microApp' });
versea.use(IPluginSourceEntry);
versea.use(IPluginHtmlEntry);

// 注册子应用
versea.registerApps([
  {
    name: 'subApp',
    routes: [
      {
        path: 'sub-app',
        pathToRegexpOptions: {
          end: false,
        },
      },
    ],
    entry: 'http://localhost:3000/sub-app/',
  },
]);

// 在合适的时机启动 versea
void versea.start();
```

### Load 和 Mount 生命周期

变更 @versea/plugin-source-entry 的 hooks

#### loadApp
1. TapName: PLUGIN_HTML_ENTRY_FETCH_SOURCE_TAP 获取 HTML 资源`（新增）`
2. TapName: PLUGIN_SOURCE_ENTRY_CREATE_CONTAINER_TAP 根据 HTML 资源创建容器
3. TapName: PLUGIN_HTML_ENTRY_TAP 从 `app.container` 中获取资源信息，设置 `app.styles` 和 `app.scripts` 这两个参数资源信息供后续使用`（新增）`
4. TapName: PLUGIN_SOURCE_ENTRY_TAP 加载资源文件
5. TapName: PLUGIN_SOURCE_ENTRY_UPDATE_LIFECYCLE_TAP 重写应用生命周期函数
