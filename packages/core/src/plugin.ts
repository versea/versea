/** 依赖注入类型插件的类型定义 */
export interface IPlugin {
  apply: () => void;
}
