/** 依赖注入类型的插件的默认定义 */
export interface IPlugin {
  apply: () => void;
}
