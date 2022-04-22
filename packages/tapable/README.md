# @versea/tapable

versea 的的 tapable 事件库。

### 安装

```bash
npm install --save @versea/tapable
```

### 使用

```ts
import { AsyncSeriesHook, HookContext } from '@versea/tapable';

interface Context extends HookContext {
  test: string;
}

const testAsyncSeriesHook = new AsyncSeriesHook<Context>();
testAsyncSeriesHook.tap('name', async () => {
  return Promise.resolve();
});
void testAsyncSeriesHook.call({ test: 'test' });
```
