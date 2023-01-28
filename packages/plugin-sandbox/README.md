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
        pathToRegexpOptions: {
          end: false,
        },
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

本插件新增的所有 Hook，参考[interface](./src/plugin/interface.ts)。

### Load 和 Mount 生命周期

变更 @versea/plugin-source-entry 的 hooks

#### loadApp
1. TapName: PLUGIN_SOURCE_ENTRY_NORMALIZE_SOURCE_TAP 设置 app 的资源信息
2. TapName: PLUGIN_SOURCE_ENTRY_TAP 创建容器并加载资源文件
3. TapName: PLUGIN_SANDBOX_TAP 创建沙箱`（新增）`，可以在这个之后增加 hook 修改沙箱或直接替换这个 hook 替换沙箱
4. TapName: PLUGIN_SOURCE_ENTRY_UPDATE_LIFECYCLE_TAP 重写应用生命周期函数

#### mountApp
1. TapName: PLUGIN_SOURCE_ENTRY_RENDER_CONTAINER_TAP 渲染容器
2. TapName: PLUGIN_SANDBOX_TAP 启动沙箱`（新增）`
3. TapName: PLUGIN_SOURCE_ENTRY_EXEC_SOURCE_TAP 执行资源文件
4. TapName: PLUGIN_SANDBOX_EFFECT_TAP: 记录或重置沙箱副作用`（新增）`
5. TapName: PLUGIN_SOURCE_ENTRY_EXEC_LIFECYCLE_TAP 执行应用 mount 生命周期函数

#### unmountApp
1. TapName: PLUGIN_SOURCE_ENTRY_EXEC_LIFECYCLE_TAP 执行应用 unmount 生命周期函数
2. TapName: PLUGIN_SANDBOX_TAP 停止沙箱`（新增）`
3. TapName: PLUGIN_SOURCE_ENTRY_REMOVE_CONTAINER_TAP 销毁容器

#### loadSource
1. TapName: PLUGIN_SANDBOX_TAP 加载资源文件`（新增）`

#### execSource
1. TapName: PLUGIN_SOURCE_ENTRY_TAP 使用沙箱环境执行资源文件`（替换）`

### 特别声明

本插件借鉴了 micro-app 和 qiankun 的沙箱方案，后期关注沙箱是否可以使用其他开源项目的实现。
