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

### Hooks

本插件新增的所有 Hook 和内部监听者名称。

#### loadApp
1. TapName: VERSEA_PLUGIN_SOURCE_ENTRY_NORMALIZE_SOURCE_TAP 设置 app 的资源信息
2. TapName: VERSEA_PLUGIN_SOURCE_ENTRY_TAP 创建容器并执行加载资源文件
3. TapName: VERSEA_PLUGIN_SOURCE_ENTRY_EXEC_SOURCE_TAP 尝试渲染容器并执行资源文件
4. TapName: VERSEA_PLUGIN_SOURCE_ENTRY_UPDATE_LIFECYCLE_TAP 重写应用生命周期函数

#### mountApp
1. TapName: VERSEA_PLUGIN_SOURCE_ENTRY_EXEC_SOURCE_TAP 尝试渲染容器并执行资源文件
2. TapName: VERSEA_PLUGIN_SOURCE_ENTRY_EXEC_LIFECYCLE_TAP 执行应用 mount 生命周期函数

#### unmountApp
1. TapName: VERSEA_PLUGIN_SOURCE_ENTRY_EXEC_LIFECYCLE_TAP 执行应用 unmount 生命周期函数
2. TapName: VERSEA_PLUGIN_SOURCE_ENTRY_REMOVE_CONTAINER_TAP 销毁容器

#### loadSource
无内部监听

#### execSource
1. TapName: VERSEA_PLUGIN_SOURCE_ENTRY_TAP 创建 link 或 script 运行资源文件
